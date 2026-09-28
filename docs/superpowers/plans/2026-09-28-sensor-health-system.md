# Sensor Health System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the loose, toast-based "sensor down" check with real MQTT-heartbeat-driven liveness tracking, pushed live over the existing Socket.IO server, and surfaced as per-panel status icons (Live / Degraded / Silent / Unknown) with a manual refresh, on the dashboard and every statistics page.

**Architecture:** Backend keeps an in-memory heartbeat map (updated the instant an MQTT message arrives, independently of whether the following DB write succeeds), pushes changes over the app's existing Socket.IO server as a `sensor-health` event, and also serves the same snapshot via `GET /health/sensors` for initial load and manual refresh. Frontend has one shared `SensorHealthProvider` (React Context) mounted once at the sidebar layout, feeding a small `<SensorStatusIcon>` used on the dashboard and every statistics page.

**Tech Stack:** Express + Sequelize + `mqtt` + `socket.io` (backend, existing), Next.js App Router + React Context + `socket.io-client` (frontend, new dependency), `lucide-react` icons (existing).

**Spec:** `docs/superpowers/specs/2026-09-28-sensor-health-system-design.md`

## Global Constraints

- Silence threshold: a panel is `transmitting` only if its last MQTT message arrived within the last **30 000 ms**.
- Freshness tick interval: recompute transmitting state every **5000 ms**.
- Manual refresh debounce: the refresh button disables itself for **2500 ms** after each click.
- No test framework is introduced anywhere in this plan (neither project has one today). Backend logic verification uses Node's built-in `assert` in throwaway `node -e` commands. Frontend verification uses `next lint` on changed files plus a described manual browser check.
- Health snapshot shape (used identically by the REST endpoint and the Socket.IO event), one entry per panel keyed by `"A"`–`"E"`:
  ```json
  {
    "transmitting": false,
    "lastMessageAt": null,
    "persisted": false,
    "lastPersistedAt": null,
    "lastError": null
  }
  ```
- `socket.io-client` version must match the backend's `socket.io` (`^4.8.1`, from `Backend-NTU-2.0-main/package.json:31`).
- Icon states: `live` (transmitting && persisted), `degraded` (transmitting && !persisted), `silent` (!transmitting), `unknown` (no snapshot yet, or the client's Socket.IO connection is down after having been up at least once).

---

## Task 1: Backend heartbeat module

**Files:**
- Create: `Backend-NTU-2.0-main/helper/sensorHealth.js`

**Interfaces:**
- Produces (used by Tasks 2 and 3):
  - `PANELS: string[]` — `['A', 'B', 'C', 'D', 'E']`
  - `SILENCE_THRESHOLD_MS: number` — `30000`
  - `recordMessage(panel: string): void`
  - `recordPersisted(panel: string): void`
  - `recordError(panel: string, message: string): void`
  - `getSnapshot(): object` — `{ A: {...}, B: {...}, C: {...}, D: {...}, E: {...} }`, each entry matching the Global Constraints shape
  - `recomputeTransmitting(): boolean` — returns `true` if any panel's `transmitting` flag changed
  - `startFreshnessTick(onChange: (snapshot: object) => void, intervalMs?: number): NodeJS.Timeout`

- [ ] **Step 1: Write the module**

```js
'use strict';

const PANELS = ['A', 'B', 'C', 'D', 'E'];
const SILENCE_THRESHOLD_MS = 30 * 1000;

const state = {};
PANELS.forEach((panel) => {
  state[panel] = {
    transmitting: false,
    lastMessageAt: null,
    persisted: false,
    lastPersistedAt: null,
    lastError: null,
  };
});

function recordMessage(panel) {
  state[panel].lastMessageAt = new Date();
  state[panel].transmitting = true;
}

function recordPersisted(panel) {
  state[panel].persisted = true;
  state[panel].lastPersistedAt = new Date();
  state[panel].lastError = null;
}

function recordError(panel, message) {
  state[panel].persisted = false;
  state[panel].lastError = message;
}

function recomputeTransmitting() {
  const now = Date.now();
  let changed = false;

  PANELS.forEach((panel) => {
    const entry = state[panel];
    const isFresh =
      entry.lastMessageAt !== null &&
      now - entry.lastMessageAt.getTime() < SILENCE_THRESHOLD_MS;

    if (entry.transmitting !== isFresh) {
      entry.transmitting = isFresh;
      changed = true;
    }
  });

  return changed;
}

function getSnapshot() {
  const snapshot = {};
  PANELS.forEach((panel) => {
    snapshot[panel] = { ...state[panel] };
  });
  return snapshot;
}

function startFreshnessTick(onChange, intervalMs = 5000) {
  return setInterval(() => {
    if (recomputeTransmitting()) {
      onChange(getSnapshot());
    }
  }, intervalMs);
}

module.exports = {
  PANELS,
  SILENCE_THRESHOLD_MS,
  recordMessage,
  recordPersisted,
  recordError,
  getSnapshot,
  recomputeTransmitting,
  startFreshnessTick,
};
```

- [ ] **Step 2: Verify the module behaves correctly**

Run this from `Backend-NTU-2.0-main/`:

```bash
node -e "
const assert = require('assert');
const h = require('./helper/sensorHealth');

// Fresh panel starts silent.
let snap = h.getSnapshot();
assert.strictEqual(snap.A.transmitting, false);
assert.strictEqual(snap.A.lastMessageAt, null);

// A message marks it transmitting immediately.
h.recordMessage('A');
snap = h.getSnapshot();
assert.strictEqual(snap.A.transmitting, true);
assert.ok(snap.A.lastMessageAt instanceof Date);

// A successful persist clears any prior error.
h.recordError('A', 'boom');
h.recordPersisted('A');
snap = h.getSnapshot();
assert.strictEqual(snap.A.persisted, true);
assert.strictEqual(snap.A.lastError, null);

// A failed persist keeps transmitting true but flips persisted false.
h.recordError('A', 'connect ECONNREFUSED 127.0.0.1:3306');
snap = h.getSnapshot();
assert.strictEqual(snap.A.transmitting, true);
assert.strictEqual(snap.A.persisted, false);
assert.strictEqual(snap.A.lastError, 'connect ECONNREFUSED 127.0.0.1:3306');

// recomputeTransmitting reports no change immediately after a fresh message (A is still within the threshold).
const changedWhileFresh = h.recomputeTransmitting();
assert.strictEqual(changedWhileFresh, false);

console.log('sensorHealth: all checks passed');
"
```

Expected output: `sensorHealth: all checks passed`

- [ ] **Step 3: Commit**

```bash
git add Backend-NTU-2.0-main/helper/sensorHealth.js
git commit -m "feat(backend): add in-memory sensor heartbeat tracking module"
```

---

## Task 2: Wire heartbeat into the MQTT handler

**Files:**
- Modify: `Backend-NTU-2.0-main/app.js`

**Interfaces:**
- Consumes: `helper/sensorHealth.js` — `recordMessage`, `recordPersisted`, `recordError`, `getSnapshot`, `startFreshnessTick` (Task 1)
- Produces: the running process now emits a Socket.IO `sensor-health` event (full snapshot) whenever any panel's health state changes — consumed by Task 5 (frontend provider) and manually verified in Task 3.

- [ ] **Step 1: Add the require**

In `Backend-NTU-2.0-main/app.js`, the current top of the file reads:

```js
require('dotenv').config();

const express = require('express');
const app = express();
const router = require('./Routers/router');
const errorHandler = require('./middlewares/errorHandler');
const cors = require('cors');
const mqtt = require('mqtt');
const fs = require('fs');
const { PanelA, PanelB, PanelC, PanelD, PanelE } = require('./models');
const user = require('./models/user');
const { createServer } = require('http');
const { Server } = require('socket.io');
```

Change it to:

```js
require('dotenv').config();

const express = require('express');
const app = express();
const router = require('./Routers/router');
const errorHandler = require('./middlewares/errorHandler');
const cors = require('cors');
const mqtt = require('mqtt');
const fs = require('fs');
const { PanelA, PanelB, PanelC, PanelD, PanelE } = require('./models');
const user = require('./models/user');
const { createServer } = require('http');
const { Server } = require('socket.io');
const sensorHealth = require('./helper/sensorHealth');
```

- [ ] **Step 2: Record heartbeats and persistence outcomes, and start the freshness tick**

The current message handler reads:

```js
client.on('message', async (topic, message) => {
  const data = JSON.parse(message.toString());
  // Emit to Socket.IO clients
  io.emit(topic, data);
  switch (topic) {
    case 'water_monitor/data/panelA':
      await PanelA.create(data);
      break;
    case 'water_monitor/data/panelB':
      await PanelB.create(data);
      break;
    case 'water_monitor/data/panelC':
      await PanelC.create(data);
      break;
    case 'water_monitor/data/panelD':
      await PanelD.create(data);
      break;
    case 'water_monitor/data/panelE':
      await PanelE.create(data);
      break;
    default:
      console.log(`No handler for topic ${topic}`);
  }
});
```

Replace it with:

```js
const PANEL_BY_TOPIC = {
  'water_monitor/data/panelA': 'A',
  'water_monitor/data/panelB': 'B',
  'water_monitor/data/panelC': 'C',
  'water_monitor/data/panelD': 'D',
  'water_monitor/data/panelE': 'E',
};

client.on('message', async (topic, message) => {
  const data = JSON.parse(message.toString());
  // Emit to Socket.IO clients
  io.emit(topic, data);

  const panelKey = PANEL_BY_TOPIC[topic];
  if (panelKey) sensorHealth.recordMessage(panelKey);

  switch (topic) {
    case 'water_monitor/data/panelA':
      try {
        await PanelA.create(data);
        sensorHealth.recordPersisted('A');
      } catch (err) {
        sensorHealth.recordError('A', err.message);
      }
      break;
    case 'water_monitor/data/panelB':
      try {
        await PanelB.create(data);
        sensorHealth.recordPersisted('B');
      } catch (err) {
        sensorHealth.recordError('B', err.message);
      }
      break;
    case 'water_monitor/data/panelC':
      try {
        await PanelC.create(data);
        sensorHealth.recordPersisted('C');
      } catch (err) {
        sensorHealth.recordError('C', err.message);
      }
      break;
    case 'water_monitor/data/panelD':
      try {
        await PanelD.create(data);
        sensorHealth.recordPersisted('D');
      } catch (err) {
        sensorHealth.recordError('D', err.message);
      }
      break;
    case 'water_monitor/data/panelE':
      try {
        await PanelE.create(data);
        sensorHealth.recordPersisted('E');
      } catch (err) {
        sensorHealth.recordError('E', err.message);
      }
      break;
    default:
      console.log(`No handler for topic ${topic}`);
  }

  if (panelKey) io.emit('sensor-health', sensorHealth.getSnapshot());
});

sensorHealth.startFreshnessTick((snapshot) => {
  io.emit('sensor-health', snapshot);
});
```

- [ ] **Step 3: Verify with a live MQTT listen**

This requires network access to the real broker (credentials in `.env`). From `Backend-NTU-2.0-main/`, start the server in one terminal:

```bash
node -e "require('./app'); "
```

(This runs `app.js` as a module without calling `httpServer.listen`, since `require.main !== module` in this invocation — that's fine, we only need the MQTT client and heartbeat wiring to run, not the HTTP server, for this check. Watch the console.)

Expected: within a few seconds you should see `Connected to MQTT` printed, confirming the client connected and subscribed — the same behavior verified manually earlier in this project. No errors should be thrown by the new heartbeat calls (a thrown error here would print an unhandled promise rejection). Stop the process with Ctrl+C after confirming no errors appear for ~20 seconds.

- [ ] **Step 4: Commit**

```bash
git add Backend-NTU-2.0-main/app.js
git commit -m "feat(backend): record MQTT heartbeats and push sensor-health over Socket.IO"
```

---

## Task 3: Health REST endpoint

**Files:**
- Create: `Backend-NTU-2.0-main/Controllers/HealthController.js`
- Create: `Backend-NTU-2.0-main/Routers/health.js`
- Modify: `Backend-NTU-2.0-main/Routers/router.js`

**Interfaces:**
- Consumes: `helper/sensorHealth.js` — `getSnapshot` (Task 1)
- Produces: `GET /health/sensors` — consumed by Task 5 (frontend provider, initial load + manual refresh)

- [ ] **Step 1: Write the controller**

```js
// Backend-NTU-2.0-main/Controllers/HealthController.js
const sensorHealth = require('../helper/sensorHealth');

class HealthController {
  static async getSensors(req, res) {
    res.status(200).json(sensorHealth.getSnapshot());
  }
}

module.exports = HealthController;
```

- [ ] **Step 2: Write the route**

```js
// Backend-NTU-2.0-main/Routers/health.js
const express = require('express');
const HealthController = require('../Controllers/HealthController');
const router = express.Router();

router.get('/sensors', HealthController.getSensors);

module.exports = router;
```

- [ ] **Step 3: Wire it into the main router**

`Backend-NTU-2.0-main/Routers/router.js` currently reads:

```js
const express = require("express");
const UserController = require("../Controllers/UserController");
const authentication = require("../middlewares/authenticate");
const adminAuth = require("../middlewares/authorization");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.post("/register", authentication, adminAuth, UserController.register);
router.post("/login", UserController.login);

router.use("/data", require("./data"));

module.exports = router;
```

Add the health route:

```js
const express = require("express");
const UserController = require("../Controllers/UserController");
const authentication = require("../middlewares/authenticate");
const adminAuth = require("../middlewares/authorization");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.post("/register", authentication, adminAuth, UserController.register);
router.post("/login", UserController.login);

router.use("/data", require("./data"));
router.use("/health", require("./health"));

module.exports = router;
```

- [ ] **Step 4: Verify by running the server and curling the endpoint**

```bash
cd Backend-NTU-2.0-main
NODE_ENV=production node bin/www &
sleep 2
curl -s http://localhost:${PORT:-3006}/health/sensors
```

Expected output: a JSON object with keys `A` through `E`, each shaped like `{"transmitting":false,"lastMessageAt":null,"persisted":false,"lastPersistedAt":null,"lastError":null}` immediately after boot (before any MQTT message arrives), or with populated fields if a message has already arrived by the time you curl. Stop the background server afterward:

```bash
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add Backend-NTU-2.0-main/Controllers/HealthController.js Backend-NTU-2.0-main/Routers/health.js Backend-NTU-2.0-main/Routers/router.js
git commit -m "feat(backend): add GET /health/sensors endpoint"
```

---

## Task 4: Fix data-source bugs

**Files:**
- Modify: `Backend-NTU-2.0-main/Controllers/DataController.js`
- Modify: `Backend-NTU-2.0-main/Routers/data.js`

**Interfaces:** None — this task only fixes existing behavior, it introduces no new interfaces other tasks depend on.

- [ ] **Step 1: Fix the `getPanelE`/`PanelD` copy-paste bug**

Current (`Controllers/DataController.js:181-183`):

```js
  static async getPanelE(req, res) {
    return DataController.getPanelData(req, res, PanelD);
  }
```

Change to:

```js
  static async getPanelE(req, res) {
    return DataController.getPanelData(req, res, PanelE);
  }
```

- [ ] **Step 2: Fix `getLatestPanelData` to sort by `createdAt`, not the unreliable device `timestamp`**

Current (`Controllers/DataController.js:86-95`):

```js
  static async getLatestPanelData(req, res, panelModel) {
    try {
      const data = await panelModel.findOne({
        order: [['timestamp', 'DESC']],
      });
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
```

Change to:

```js
  static async getLatestPanelData(req, res, panelModel) {
    try {
      const data = await panelModel.findOne({
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
```

- [ ] **Step 3: Remove the dead `/data/leakages` route and its unreachable code**

In `Controllers/DataController.js`, remove the `Leakage` import (currently line 9 of the destructured `require('../models')` block, lines 3-10):

Current:

```js
const {
  PanelA,
  PanelB,
  PanelC,
  PanelD,
  PanelE,
  Leakage,
} = require('../models');
```

Change to:

```js
const {
  PanelA,
  PanelB,
  PanelC,
  PanelD,
  PanelE,
} = require('../models');
```

Then delete the entire `getLeakages` method (currently lines 97-163 — the full method from `static async getLeakages(req, res) {` through its closing `}` right before `static async getPanelA(req, res) {`). After deletion, the file should go directly from the end of `getLatestPanelData` to `getPanelA`:

```js
  static async getLatestPanelData(req, res, panelModel) {
    try {
      const data = await panelModel.findOne({
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getPanelA(req, res) {
    return DataController.getPanelData(req, res, PanelA);
  }
```

- [ ] **Step 4: Remove the now-dead route registration**

`Backend-NTU-2.0-main/Routers/data.js` currently reads:

```js
const express = require('express');
const DataController = require('../Controllers/DataController');
const router = express.Router();

router.get('/panelA', DataController.getPanelA);
router.get('/panelB', DataController.getPanelB);
router.get('/panelC', DataController.getPanelC);
router.get('/panelD', DataController.getPanelD);
router.get('/panelE', DataController.getPanelE);

router.get('/leakages', DataController.getLeakages);

router.get('/panelA1/latest', DataController.getLatestPanelA);
router.get('/panelB1/latest', DataController.getLatestPanelB);
router.get('/panelC1/latest', DataController.getLatestPanelC);
router.get('/panelD1/latest', DataController.getLatestPanelD);
router.get('/panelE1/latest', DataController.getLatestPanelE);
router.get('/news', DataController.getNewsSearch);
router.get('/tiktok', DataController.getTikTokSearch);
router.get('/tiktok-points', DataController.getTikTokPoints);

module.exports = router;
```

Remove the `/leakages` line:

```js
const express = require('express');
const DataController = require('../Controllers/DataController');
const router = express.Router();

router.get('/panelA', DataController.getPanelA);
router.get('/panelB', DataController.getPanelB);
router.get('/panelC', DataController.getPanelC);
router.get('/panelD', DataController.getPanelD);
router.get('/panelE', DataController.getPanelE);

router.get('/panelA1/latest', DataController.getLatestPanelA);
router.get('/panelB1/latest', DataController.getLatestPanelB);
router.get('/panelC1/latest', DataController.getLatestPanelC);
router.get('/panelD1/latest', DataController.getLatestPanelD);
router.get('/panelE1/latest', DataController.getLatestPanelE);
router.get('/news', DataController.getNewsSearch);
router.get('/tiktok', DataController.getTikTokSearch);
router.get('/tiktok-points', DataController.getTikTokPoints);

module.exports = router;
```

- [ ] **Step 5: Verify the file still loads and the routes behave**

```bash
cd Backend-NTU-2.0-main
node -e "require('./Controllers/DataController'); require('./Routers/data'); console.log('loaded OK');"
```

Expected output: `loaded OK` (a `ReferenceError` on `Leakage` or a syntax error would throw here instead).

Then, with the server running (`NODE_ENV=production node bin/www &`), confirm `/data/leakages` now 404s (route no longer exists) instead of 500ing, and that `/data/panelE` no longer throws a Sequelize error tied to the wrong model:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:${PORT:-3006}/data/leakages
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:${PORT:-3006}/data/panelE"
kill %1
```

Expected: `404` for `/data/leakages`, and `200` for `/data/panelE` (assuming the configured database in `config/config.json` is reachable in your environment — if it isn't, you'll see `500` with a DB connection error, which is a pre-existing environment issue unrelated to this fix, not a regression).

- [ ] **Step 6: Commit**

```bash
git add Backend-NTU-2.0-main/Controllers/DataController.js Backend-NTU-2.0-main/Routers/data.js
git commit -m "fix(backend): correct getPanelE model, sort latest by createdAt, remove dead leakages route"
```

---

## Task 5: Frontend Socket.IO dependency + SensorHealthProvider

**Files:**
- Modify: `ntu-1.2/package.json`
- Create: `ntu-1.2/src/context/SensorHealthContext.js`
- Modify: `ntu-1.2/src/app/(sidebar)/layout.js`

**Interfaces:**
- Consumes: backend `GET /health/sensors` and Socket.IO `sensor-health` event (Tasks 2, 3)
- Produces (used by Tasks 6, 7, 8, 9, 10, 11, 12):
  - `useSensorHealth()` hook returning `{ health, connected, refreshing, refresh, getPanelState, PANELS }`
  - `getPanelState(panel: "A"|"B"|"C"|"D"|"E"): "live"|"degraded"|"silent"|"unknown"`
  - `refresh(): void`
  - `PANELS: string[]` — `["A","B","C","D","E"]`

- [ ] **Step 1: Add the dependency**

In `ntu-1.2/package.json`, the `dependencies` block currently includes (among others):

```json
    "next": "15.5.18",
```

Add `socket.io-client` alphabetically near the other top-level deps — e.g. right after `"react-toastify"` or wherever it sorts; exact position doesn't matter, but add this line inside `dependencies`:

```json
    "socket.io-client": "^4.8.1",
```

Then install it:

```bash
cd ntu-1.2
npm install socket.io-client@^4.8.1
```

- [ ] **Step 2: Write the context/provider**

```js
// ntu-1.2/src/context/SensorHealthContext.js
"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";
const PANELS = ["A", "B", "C", "D", "E"];
const REFRESH_COOLDOWN_MS = 2500;

const SensorHealthContext = createContext();

export const SensorHealthProvider = ({ children }) => {
  const [health, setHealth] = useState(null);
  const [connected, setConnected] = useState(false);
  const [everConnected, setEverConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);

  const fetchSnapshot = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health/sensors`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json().catch(() => null);
      if (data && typeof data === "object") setHealth(data);
    } catch {
      // Leave existing state; getPanelState treats missing/stale data as unknown.
    }
  };

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchSnapshot().finally(() => {
      setTimeout(() => setRefreshing(false), REFRESH_COOLDOWN_MS);
    });
  };

  useEffect(() => {
    fetchSnapshot();

    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setEverConnected(true);
      fetchSnapshot();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("sensor-health", (snapshot) => setHealth(snapshot));

    return () => {
      socket.disconnect();
    };
  }, []);

  const getPanelState = (panel) => {
    if (everConnected && !connected) return "unknown";
    const entry = health && health[panel];
    if (!entry) return "unknown";
    if (entry.transmitting && entry.persisted) return "live";
    if (entry.transmitting && !entry.persisted) return "degraded";
    return "silent";
  };

  return (
    <SensorHealthContext.Provider value={{ health, connected, refreshing, refresh, getPanelState, PANELS }}>
      {children}
    </SensorHealthContext.Provider>
  );
};

export const useSensorHealth = () => useContext(SensorHealthContext);
```

- [ ] **Step 3: Mount the provider**

`ntu-1.2/src/app/(sidebar)/layout.js` currently reads:

```js
"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cloneElement, useState } from "react";
import { SelectedTypeProvider } from "@/context/SelectedTypeContext";

export default function Layout({ children }) {
  return (
    <SelectedTypeProvider>
      <SidebarProvider>
        <div className="flex flex-row w-screen h-screen overflow-hidden">
          <AppSidebar />
          <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
        </div>
      </SidebarProvider>
    </SelectedTypeProvider>
  );
}
```

Change to:

```js
"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cloneElement, useState } from "react";
import { SelectedTypeProvider } from "@/context/SelectedTypeContext";
import { SensorHealthProvider } from "@/context/SensorHealthContext";

export default function Layout({ children }) {
  return (
    <SensorHealthProvider>
      <SelectedTypeProvider>
        <SidebarProvider>
          <div className="flex flex-row w-screen h-screen overflow-hidden">
            <AppSidebar />
            <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
          </div>
        </SidebarProvider>
      </SelectedTypeProvider>
    </SensorHealthProvider>
  );
}
```

- [ ] **Step 4: Verify**

```bash
cd ntu-1.2
npx next lint --file "src/app/(sidebar)/layout.js" src/context/SensorHealthContext.js
```

Expected: no new errors (pre-existing warnings elsewhere in the project are unrelated and fine).

Then, with the backend running (per Task 3's verification) and the frontend dev server running (`npm run dev` in `ntu-1.2`, with `NEXT_PUBLIC_API_BASE_URL` pointed at the backend), open any page under `(sidebar)` in a browser and check the console for Socket.IO connection errors — there should be none, and a network request to `/health/sensors` should appear in devtools on load.

- [ ] **Step 5: Commit**

```bash
git add ntu-1.2/package.json ntu-1.2/package-lock.json ntu-1.2/src/context/SensorHealthContext.js "ntu-1.2/src/app/(sidebar)/layout.js"
git commit -m "feat(frontend): add SensorHealthProvider with live Socket.IO health tracking"
```

---

## Task 6: SensorStatusIcon component

**Files:**
- Create: `ntu-1.2/src/components/SensorStatusIcon.js`

**Interfaces:**
- Consumes: `useSensorHealth()` from `src/context/SensorHealthContext.js` (Task 5)
- Produces (used by Tasks 7, 8, 9, 10, 11, 12): `<SensorStatusIcon panel="A" />` (also accepts optional `size`, default `18`)

- [ ] **Step 1: Write the component**

```js
// ntu-1.2/src/components/SensorStatusIcon.js
"use client";

import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { useSensorHealth } from "@/context/SensorHealthContext";

const STATE_CONFIG = {
  live: { Icon: CheckCircle2, className: "text-sky-600", label: "Live" },
  degraded: { Icon: AlertTriangle, className: "text-amber-500", label: "Degraded" },
  silent: { Icon: XCircle, className: "text-red-500", label: "Silent" },
  unknown: { Icon: HelpCircle, className: "text-slate-400", label: "Unknown" },
};

export const SensorStatusIcon = ({ panel, size = 18 }) => {
  const { getPanelState, health } = useSensorHealth();
  const state = getPanelState(panel);
  const { Icon, className, label } = STATE_CONFIG[state];
  const entry = health && health[panel];
  const title =
    entry && entry.lastError
      ? `Panel ${panel}: ${label} — ${entry.lastError}`
      : `Panel ${panel}: ${label}`;

  return (
    <span title={title} className={`inline-flex items-center ${className}`}>
      <Icon size={size} />
    </span>
  );
};
```

- [ ] **Step 2: Verify**

```bash
cd ntu-1.2
npx next lint --file src/components/SensorStatusIcon.js
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ntu-1.2/src/components/SensorStatusIcon.js
git commit -m "feat(frontend): add SensorStatusIcon component"
```

---

## Task 7: Dashboard — replace toast-based liveness with a health strip

**Files:**
- Modify: `ntu-1.2/src/app/(sidebar)/dashboard/page.js`

**Interfaces:**
- Consumes: `useSensorHealth()`, `<SensorStatusIcon>` (Tasks 5, 6)

**Important scope note:** `dashboard/page.js` uses `react-toastify` for two unrelated things. Only the sensor-liveness toast logic (inside the `useEffect` that also fetches panel data) is touched. The separate water-quality alert `useEffect` (the one using `lastToastTime`, `FIVE_MINUTES`, and `toast.warn(...)` for TDS/pH/turbidity thresholds) is untouched — do not remove `react-toastify`, `ToastContainer`, `lastToastTime`, or `FIVE_MINUTES`.

- [ ] **Step 1: Add the new imports**

Current top of file:

```js
"use client";

import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import moment from "moment";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Gauge,
  ShieldCheck,
  Waves,
  Wrench,
} from "lucide-react";
```

Change to:

```js
"use client";

import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import moment from "moment";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Gauge,
  ShieldCheck,
  Waves,
  Wrench,
} from "lucide-react";
import { useSensorHealth } from "@/context/SensorHealthContext";
import { SensorStatusIcon } from "@/components/SensorStatusIcon";
```

- [ ] **Step 2: Add a `SensorHealthStrip` local component**

Immediately after the existing `StatusPill` component definition:

```js
const StatusPill = ({ status, label }) => {
  const style = statusStyles[status] || statusStyles.normal;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${style.border} ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label || style.label}
    </span>
  );
};
```

add:

```js
const SensorHealthStrip = () => {
  const { PANELS, refresh, refreshing } = useSensorHealth();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-sky-100 bg-white px-4 py-3 shadow-sm shadow-sky-100/70">
      <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Sensor Health</span>
      <div className="flex items-center gap-3">
        {PANELS.map((panel) => (
          <span key={panel} className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            <SensorStatusIcon panel={panel} />
            {panel}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        className="ml-auto rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 disabled:opacity-50"
      >
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
};
```

- [ ] **Step 3: Strip the toast logic out of the panel-data effect, keep the data fetching**

Current (the whole `useEffect` block that both fetches panel data and toasts on staleness):

```js
  useEffect(() => {
    const toastTimers = {}; // untuk menyimpan timer per panel

    const checkAndToast = async () => {
      try {
        let hasAnyData = false;

        const fetchLatestPanelData = async (path) => {
          try {
            const response = await fetch(`${API_BASE_URL}/data/${path}/latest`, { cache: "no-store" });
            if (!response.ok) return null;

            const data = await response.json().catch(() => null);
            return data && typeof data === "object" ? data : null;
          } catch {
            // Fetch failure is handled by the sensor toast below.
            return null;
          }
        };

        const showSensorToast = (key, label, createdAt) => {
          const toastId = `${key}-dead`;
          const lastSent = createdAt
            ? `Terakhir mengirim pada: ${moment(createdAt).format("DD MMM YYYY, HH:mm")}`
            : "Data terakhir belum tersedia.";

          if (!toast.isActive(toastId)) {
            toast.error(`Sensor ${label} tidak mengirim data hari ini. ${lastSent}`, {
              autoClose: false,
              closeOnClick: true,
              toastId,
              onClose: () => {
                if (toastTimers[toastId]) clearTimeout(toastTimers[toastId]);
                toastTimers[toastId] = setTimeout(() => {
                  checkAndToast();
                }, 300000);
              },
            });
          }
        };

        for (const [key, panel] of Object.entries(sensorPanels)) {
          const data = await fetchLatestPanelData(panel.path);

          const isToday = (dateString) => moment(dateString).isSame(moment(), 'day');

          if (!data) {
            showSensorToast(key, panel.label);
            continue;
          }

          hasAnyData = true;

          if (!data.createdAt || !isToday(data.createdAt)) {
            showSensorToast(key, panel.label, data.createdAt);
          } else if (data.createdAt) {
            // Kalau data sudah valid hari ini, hapus toast dan timer
            toast.dismiss(`${key}-dead`);
            if (toastTimers[`${key}-dead`]) {
              clearTimeout(toastTimers[`${key}-dead`]);
              delete toastTimers[`${key}-dead`];
            }
          }

          // --- Atur state di sini kalau perlu (flow, tds, dsb) ---
          if (key === 'panelA') {
            if (data.flow1 !== undefined) setFlow1(data.flow1);
            if (data.turbidity !== undefined) setTurbidity1(data.turbidity);
            if (data.ph !== undefined) setPh1(data.ph);
            if (data.tds !== undefined) setTds1(data.tds);
          }
          if (key === 'panelB') {
            if (data.flow1 !== undefined) setFlow2(data.flow1);
            if (data.flow2 !== undefined) setFlow3(data.flow2);
            if (data.turbidity !== undefined) setTurbidity2(data.turbidity);
            if (data.ph !== undefined) setPh2(data.ph);
            if (data.tds !== undefined) setTds2(data.tds);
          }
          if (key === 'panelC' && data.level1 !== undefined) setLevel1(data.level1);
          if (key === 'panelD') {
            if (data.level1 !== undefined) setLevel2(data.level1);
            if (data.level !== undefined || data.level1 !== undefined) setLevel3(data.level ?? data.level1);
          }
          if (key === 'panelE') {
            if (data.flow1 !== undefined) setFlow4(data.flow1);
            if (data.turbidity !== undefined) setTurbidity3(data.turbidity);
            if (data.ph !== undefined) setPh3(data.ph);
            if (data.tds !== undefined) setTds3(data.tds);
            if (data.level1 !== undefined) setLevel3(data.level1);
          }
        }
        setLastUpdated(hasAnyData ? moment().format("DD MMM YYYY, HH:mm") : "Data sensor belum tersedia");
      } catch (error) {
        setLastUpdated("Data sensor belum tersedia");
      } finally {
        setisLoading(false);
      }
    };

    checkAndToast();

    // Optional: refresh data every 10 minutes (prevent stale data)
    const interval = setInterval(checkAndToast, 600000);
    return () => clearInterval(interval);
  }, []);
```

Replace it with (toast-triggering parts removed, data fetching and state updates kept, function renamed since it no longer toasts):

```js
  useEffect(() => {
    const fetchLatestPanelData = async (path) => {
      try {
        const response = await fetch(`${API_BASE_URL}/data/${path}/latest`, { cache: "no-store" });
        if (!response.ok) return null;

        const data = await response.json().catch(() => null);
        return data && typeof data === "object" ? data : null;
      } catch {
        return null;
      }
    };

    const fetchAllPanels = async () => {
      try {
        let hasAnyData = false;

        for (const [key, panel] of Object.entries(sensorPanels)) {
          const data = await fetchLatestPanelData(panel.path);
          if (!data) continue;

          hasAnyData = true;

          if (key === 'panelA') {
            if (data.flow1 !== undefined) setFlow1(data.flow1);
            if (data.turbidity !== undefined) setTurbidity1(data.turbidity);
            if (data.ph !== undefined) setPh1(data.ph);
            if (data.tds !== undefined) setTds1(data.tds);
          }
          if (key === 'panelB') {
            if (data.flow1 !== undefined) setFlow2(data.flow1);
            if (data.flow2 !== undefined) setFlow3(data.flow2);
            if (data.turbidity !== undefined) setTurbidity2(data.turbidity);
            if (data.ph !== undefined) setPh2(data.ph);
            if (data.tds !== undefined) setTds2(data.tds);
          }
          if (key === 'panelC' && data.level1 !== undefined) setLevel1(data.level1);
          if (key === 'panelD') {
            if (data.level1 !== undefined) setLevel2(data.level1);
            if (data.level !== undefined || data.level1 !== undefined) setLevel3(data.level ?? data.level1);
          }
          if (key === 'panelE') {
            if (data.flow1 !== undefined) setFlow4(data.flow1);
            if (data.turbidity !== undefined) setTurbidity3(data.turbidity);
            if (data.ph !== undefined) setPh3(data.ph);
            if (data.tds !== undefined) setTds3(data.tds);
            if (data.level1 !== undefined) setLevel3(data.level1);
          }
        }
        setLastUpdated(hasAnyData ? moment().format("DD MMM YYYY, HH:mm") : "Data sensor belum tersedia");
      } catch (error) {
        setLastUpdated("Data sensor belum tersedia");
      } finally {
        setisLoading(false);
      }
    };

    fetchAllPanels();

    // Refresh raw panel readings every 10 minutes (liveness itself is now handled by SensorHealthProvider).
    const interval = setInterval(fetchAllPanels, 600000);
    return () => clearInterval(interval);
  }, []);
```

- [ ] **Step 4: Render the strip**

Current header section end:

```jsx
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="max-w-full rounded-lg border border-sky-100 bg-white px-4 py-3 shadow-sm shadow-sky-100/70">
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Update</p>
              <p className="text-slate-950 text-sm font-bold mt-1">{isLoading ? "Memuat data..." : lastUpdated}</p>
            </div>
            <StatusPill status={systemStatus} label={systemStatus === "normal" ? "Sistem stabil" : statusStyles[systemStatus].label} />
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
```

Add the strip between `</header>` and the summary cards section:

```jsx
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="max-w-full rounded-lg border border-sky-100 bg-white px-4 py-3 shadow-sm shadow-sky-100/70">
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide">Update</p>
              <p className="text-slate-950 text-sm font-bold mt-1">{isLoading ? "Memuat data..." : lastUpdated}</p>
            </div>
            <StatusPill status={systemStatus} label={systemStatus === "normal" ? "Sistem stabil" : statusStyles[systemStatus].label} />
          </div>
        </header>

        <SensorHealthStrip />

        <section className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
```

- [ ] **Step 5: Verify**

```bash
cd ntu-1.2
npx next lint --file "src/app/(sidebar)/dashboard/page.js"
```

Expected: only the pre-existing `react-hooks/exhaustive-deps` warnings already present before this change (not a new error).

Manual check: with backend and frontend both running, open the dashboard in a browser. Confirm: the "Sensor Health" strip renders with 5 icons and a Refresh button; no dead-sensor toasts appear anymore; clicking Refresh briefly disables the button and re-fetches; the water-quality warning toasts (if TDS/pH/turbidity readings exceed thresholds) still work exactly as before.

- [ ] **Step 6: Commit**

```bash
git add "ntu-1.2/src/app/(sidebar)/dashboard/page.js"
git commit -m "feat(frontend): replace dashboard sensor-down toast with live health strip"
```

---

## Task 8: Icon placement — LeakedChart panels (A, B×2, E)

**Files:**
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/LeakedChart_Panel-A.js`
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/LeakedChart_Panel-B_Flow1.js`
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/LeakedChart_Panel-B_Flow2.js`
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/LeakedChart_Panel-E.js`

**Interfaces:**
- Consumes: `<SensorStatusIcon>` (Task 6)

All four files share the identical header structure; only the `<h1>` text and target panel differ.

- [ ] **Step 1: Add the import to each of the 4 files**

Each file currently starts:

```js
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
```

Change to:

```js
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { SensorStatusIcon } from "@/components/SensorStatusIcon";
```

- [ ] **Step 2: Insert the icon in `LeakedChart_Panel-A.js` (panel `A`)**

Current:

```jsx
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-[18px] font-semibold">Pipe WTP In</h1>
              <h2 className="text-slate-500 text-[12px]">Leaked Water</h2>
            </div>
            <div className="flex items-center">
              <span
                className="text-[14px] px-4 h-[35px] flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: statusColor[leakStatus], color: "#FFFFFF" }}
              >
                {statusText[leakStatus]}
              </span>
            </div>
          </div>

          {/* Dropdown */}
          <Dropdown
```

Change to:

```jsx
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-[18px] font-semibold">Pipe WTP In</h1>
              <h2 className="text-slate-500 text-[12px]">Leaked Water</h2>
            </div>
            <div className="flex items-center">
              <span
                className="text-[14px] px-4 h-[35px] flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: statusColor[leakStatus], color: "#FFFFFF" }}
              >
                {statusText[leakStatus]}
              </span>
            </div>
            <SensorStatusIcon panel="A" />
          </div>

          {/* Dropdown */}
          <Dropdown
```

- [ ] **Step 3: Insert the icon in `LeakedChart_Panel-B_Flow1.js` (panel `B`)**

Current:

```jsx
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-[18px] font-semibold">Pipe Pump House In</h1>
              <h2 className="text-slate-500 text-[12px]">Leaked Water</h2>
            </div>
            <div className="flex items-center">
              <span
                className="text-[14px] px-4 h-[35px] flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: statusColor[leakStatus], color: "#FFFFFF" }}
              >
                {statusText[leakStatus]}
              </span>
            </div>
          </div>

          {/* Dropdown */}
          <Dropdown
```

Change to:

```jsx
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-[18px] font-semibold">Pipe Pump House In</h1>
              <h2 className="text-slate-500 text-[12px]">Leaked Water</h2>
            </div>
            <div className="flex items-center">
              <span
                className="text-[14px] px-4 h-[35px] flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: statusColor[leakStatus], color: "#FFFFFF" }}
              >
                {statusText[leakStatus]}
              </span>
            </div>
            <SensorStatusIcon panel="B" />
          </div>

          {/* Dropdown */}
          <Dropdown
```

- [ ] **Step 4: Insert the icon in `LeakedChart_Panel-B_Flow2.js` (panel `B`)**

Current:

```jsx
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-[18px] font-semibold">Pipe Pump House Out</h1>
              <h2 className="text-slate-500 text-[12px]">Leaked Water</h2>
            </div>
            <div className="flex items-center">
              <span
                className="text-[14px] px-4 h-[35px] flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: statusColor[leakStatus], color: "#FFFFFF" }}
              >
                {statusText[leakStatus]}
              </span>
            </div>
          </div>

          {/* Dropdown */}
          <Dropdown
```

Change to:

```jsx
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-[18px] font-semibold">Pipe Pump House Out</h1>
              <h2 className="text-slate-500 text-[12px]">Leaked Water</h2>
            </div>
            <div className="flex items-center">
              <span
                className="text-[14px] px-4 h-[35px] flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: statusColor[leakStatus], color: "#FFFFFF" }}
              >
                {statusText[leakStatus]}
              </span>
            </div>
            <SensorStatusIcon panel="B" />
          </div>

          {/* Dropdown */}
          <Dropdown
```

- [ ] **Step 5: Insert the icon in `LeakedChart_Panel-E.js` (panel `E`)**

Current:

```jsx
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-[18px] font-semibold">Pipe Asrama</h1>
              <h2 className="text-slate-500 text-[12px]">Leaked Water</h2>
            </div>
            <div className="flex items-center">
              <span
                className="text-[14px] px-4 h-[35px] flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: statusColor[leakStatus], color: "#FFFFFF" }}
              >
                {statusText[leakStatus]}
              </span>
            </div>
          </div>

          {/* Dropdown */}
          <Dropdown
```

Change to:

```jsx
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-[18px] font-semibold">Pipe Asrama</h1>
              <h2 className="text-slate-500 text-[12px]">Leaked Water</h2>
            </div>
            <div className="flex items-center">
              <span
                className="text-[14px] px-4 h-[35px] flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: statusColor[leakStatus], color: "#FFFFFF" }}
              >
                {statusText[leakStatus]}
              </span>
            </div>
            <SensorStatusIcon panel="E" />
          </div>

          {/* Dropdown */}
          <Dropdown
```

- [ ] **Step 6: Verify**

```bash
cd ntu-1.2
npx next lint --file \
  "src/app/(sidebar)/statistics/LeakedChart_Panel-A.js" \
  "src/app/(sidebar)/statistics/LeakedChart_Panel-B_Flow1.js" \
  "src/app/(sidebar)/statistics/LeakedChart_Panel-B_Flow2.js" \
  "src/app/(sidebar)/statistics/LeakedChart_Panel-E.js"
```

Expected: only the pre-existing `exhaustive-deps` warnings for `fetchWater`, no new errors.

- [ ] **Step 7: Commit**

```bash
git add \
  "ntu-1.2/src/app/(sidebar)/statistics/LeakedChart_Panel-A.js" \
  "ntu-1.2/src/app/(sidebar)/statistics/LeakedChart_Panel-B_Flow1.js" \
  "ntu-1.2/src/app/(sidebar)/statistics/LeakedChart_Panel-B_Flow2.js" \
  "ntu-1.2/src/app/(sidebar)/statistics/LeakedChart_Panel-E.js"
git commit -m "feat(frontend): show sensor health icon on leakage chart pages"
```

---

## Task 9: Icon placement — Water Level panels (C, D, E)

**Files:**
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/Water_LevelA.js` (fetches Panel `C`)
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/Water_LevelB.js` (fetches Panel `D`)
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/Water_LevelC.js` (fetches Panel `E`)

Note the naming mismatch is pre-existing: `Water_LevelA.js`'s title says "Main Tank A" but its actual `fetch` target is `panelC`; `Water_LevelB.js` says "Main Tank B" but fetches `panelD`; `Water_LevelC.js` says "Main Tank C" but fetches `panelE`. The icon must reflect the panel each file actually fetches, not the letter in its title — that mismatch is Phase C's concern, not this one's.

**Interfaces:**
- Consumes: `<SensorStatusIcon>` (Task 6)

- [ ] **Step 1: Add the import to each of the 3 files**

Each file currently starts:

```js
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
```

Change to:

```js
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { SensorStatusIcon } from "@/components/SensorStatusIcon";
```

- [ ] **Step 2: Insert the icon in `Water_LevelA.js` (panel `C`)**

Current:

```jsx
        <div className="flex justify-between items-center mb-8">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-2xl font-semibold">Water Level Main Tank A</h1>
              <h2 className="text-slate-500 text-sm">Leaked Water</h2>
            </div>
          </div>

          {/* Dropdown */}
          <Dropdown
```

Change to:

```jsx
        <div className="flex justify-between items-center mb-8">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-2xl font-semibold">Water Level Main Tank A</h1>
              <h2 className="text-slate-500 text-sm">Leaked Water</h2>
            </div>
            <SensorStatusIcon panel="C" />
          </div>

          {/* Dropdown */}
          <Dropdown
```

- [ ] **Step 3: Insert the icon in `Water_LevelB.js` (panel `D`)**

Current:

```jsx
        <div className="flex justify-between items-center mb-8">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-2xl font-semibold">Water Level Main Tank B</h1>
              <h2 className="text-slate-500 text-sm">Leaked Water</h2>
            </div>
          </div>

          {/* Dropdown */}
          <Dropdown
```

Change to:

```jsx
        <div className="flex justify-between items-center mb-8">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-2xl font-semibold">Water Level Main Tank B</h1>
              <h2 className="text-slate-500 text-sm">Leaked Water</h2>
            </div>
            <SensorStatusIcon panel="D" />
          </div>

          {/* Dropdown */}
          <Dropdown
```

- [ ] **Step 4: Insert the icon in `Water_LevelC.js` (panel `E`)**

Current:

```jsx
        <div className="flex justify-between items-center mb-8">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-2xl font-semibold">Water Level Main Tank C</h1>
              <h2 className="text-slate-500 text-sm">Leaked Water</h2>
            </div>
          </div>

          {/* Dropdown */}
          <Dropdown
```

Change to:

```jsx
        <div className="flex justify-between items-center mb-8">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 text-2xl font-semibold">Water Level Main Tank C</h1>
              <h2 className="text-slate-500 text-sm">Leaked Water</h2>
            </div>
            <SensorStatusIcon panel="E" />
          </div>

          {/* Dropdown */}
          <Dropdown
```

- [ ] **Step 5: Verify**

```bash
cd ntu-1.2
npx next lint --file \
  "src/app/(sidebar)/statistics/Water_LevelA.js" \
  "src/app/(sidebar)/statistics/Water_LevelB.js" \
  "src/app/(sidebar)/statistics/Water_LevelC.js"
```

Expected: only pre-existing `exhaustive-deps` warnings, no new errors.

- [ ] **Step 6: Commit**

```bash
git add \
  "ntu-1.2/src/app/(sidebar)/statistics/Water_LevelA.js" \
  "ntu-1.2/src/app/(sidebar)/statistics/Water_LevelB.js" \
  "ntu-1.2/src/app/(sidebar)/statistics/Water_LevelC.js"
git commit -m "feat(frontend): show sensor health icon on water level chart pages"
```

---

## Task 10: Icon placement — WaterUsage (panel E) and WaterUsageChart (panel C)

**Files:**
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/WaterUsage.js`
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/WaterUsageChart.js`

**Interfaces:**
- Consumes: `<SensorStatusIcon>` (Task 6)

- [ ] **Step 1: `WaterUsage.js` — add import**

Current top of file:

```js
"use client";
import React, { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";
```

Change to:

```js
"use client";
import React, { useEffect, useState } from "react";
import { SensorStatusIcon } from "@/components/SensorStatusIcon";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";
```

- [ ] **Step 2: `WaterUsage.js` — insert the icon (panel `E`)**

Current:

```jsx
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-slate-900 text-xl font-medium">Water Usage in Asrama</h2>
        <div className="flex items-center bg-sky-50 border border-sky-100 rounded-lg px-4 py-2 cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-pink-500 mr-2"></div>
          <select className="bg-sky-50 text-slate-900 border-none outline-none pr-6 appearance-none cursor-pointer">
            <option>Asrama 1</option>
            <option>Asrama 2</option>
            <option>Asrama 3</option>
            <option>Asrama 4</option>
          </select>
        </div>
      </div>
```

Change to:

```jsx
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-slate-900 text-xl font-medium">Water Usage in Asrama</h2>
        <div className="flex items-center gap-3">
          <SensorStatusIcon panel="E" />
          <div className="flex items-center bg-sky-50 border border-sky-100 rounded-lg px-4 py-2 cursor-pointer">
            <div className="w-2 h-2 rounded-full bg-pink-500 mr-2"></div>
            <select className="bg-sky-50 text-slate-900 border-none outline-none pr-6 appearance-none cursor-pointer">
              <option>Asrama 1</option>
              <option>Asrama 2</option>
              <option>Asrama 3</option>
              <option>Asrama 4</option>
            </select>
          </div>
        </div>
      </div>
```

- [ ] **Step 3: `WaterUsageChart.js` — add import**

Current top of file:

```js
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
```

Change to:

```js
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { SensorStatusIcon } from "@/components/SensorStatusIcon";
```

- [ ] **Step 4: `WaterUsageChart.js` — insert the icon (panel `C`)**

Current:

```jsx
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-slate-500 text-sm mb-1">Water Usage</h2>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-900 text-2xl font-semibold">Today 60L</h1>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs rounded">40%</span>
            </div>
          </div>

          <Dropdown
            value={selectedRange}
            options={dropdownOptions}
            onChange={(e) => setSelectedRange(e.value)}
            className="flex items-center text-center gap-2 bg-sky-50 border border-sky-100 px-4 py-2 rounded-lg text-slate-500 text-sm"
            panelStyle={{
              backgroundColor: "#ffffff",
              color: "#0f172a",
              textAlign: "center",
            }}
            style={{ color: "#0f172a" }}
          />
        </div>
```

Change to:

```jsx
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-slate-500 text-sm mb-1">Water Usage</h2>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-900 text-2xl font-semibold">Today 60L</h1>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs rounded">40%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SensorStatusIcon panel="C" />
            <Dropdown
              value={selectedRange}
              options={dropdownOptions}
              onChange={(e) => setSelectedRange(e.value)}
              className="flex items-center text-center gap-2 bg-sky-50 border border-sky-100 px-4 py-2 rounded-lg text-slate-500 text-sm"
              panelStyle={{
                backgroundColor: "#ffffff",
                color: "#0f172a",
                textAlign: "center",
              }}
              style={{ color: "#0f172a" }}
            />
          </div>
        </div>
```

- [ ] **Step 5: Verify**

```bash
cd ntu-1.2
npx next lint --file \
  "src/app/(sidebar)/statistics/WaterUsage.js" \
  "src/app/(sidebar)/statistics/WaterUsageChart.js"
```

Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add \
  "ntu-1.2/src/app/(sidebar)/statistics/WaterUsage.js" \
  "ntu-1.2/src/app/(sidebar)/statistics/WaterUsageChart.js"
git commit -m "feat(frontend): show sensor health icon on water usage pages"
```

---

## Task 11: Icon placement — SupplierChart (panels C, D, E)

**Files:**
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/SupplierChart.js`

**Interfaces:**
- Consumes: `<SensorStatusIcon>` (Task 6)

- [ ] **Step 1: Add the import**

Current top of file:

```js
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
```

Change to:

```js
"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { SensorStatusIcon } from "@/components/SensorStatusIcon";
```

- [ ] **Step 2: Insert the icons (panels `C`, `D`, `E`)**

Current:

```jsx
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-slate-900 text-[16px] font-semibold mb-2">Supplier and Request Water</h1>
            <div className="flex space-x-6 mt-2">
            <div className="flex items-center">
              <span className="text-slate-900 text-[12px]">{totalSupplier.toFixed(0)}mÂ³</span>
              <span className="text-pink-500 bg-sky-50 px-2 text-[14px] rounded-md ml-1 ">Supplier</span>
            </div>
            <div className="flex items-center">
              <span className="text-slate-900 text-[12px]">{totalRequest.toFixed(0)}mÂ³</span>
              <span className="text-[#A1EF7A] bg-sky-50 px-2 text-[14px] rounded-md ml-1">Request</span>
            </div>
          </div>
          <div className="flex mt-4">
            <div className="w-2 h-2 rounded-full bg-pink-500 mr-2 mt-2"></div>
            <span className="text-slate-900 text-[12px]">Supplier</span>
            <div className="w-2 h-2 rounded-full bg-[#A1EF7A] ml-6 mt-2"></div>
            <span className="text-slate-900 text-[12px] ml-2">Request</span>
          </div>
          </div>

          <Dropdown
```

Change to:

```jsx
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-slate-900 text-[16px] font-semibold mb-2">Supplier and Request Water</h1>
            <div className="flex space-x-6 mt-2">
            <div className="flex items-center">
              <span className="text-slate-900 text-[12px]">{totalSupplier.toFixed(0)}mÂ³</span>
              <span className="text-pink-500 bg-sky-50 px-2 text-[14px] rounded-md ml-1 ">Supplier</span>
            </div>
            <div className="flex items-center">
              <span className="text-slate-900 text-[12px]">{totalRequest.toFixed(0)}mÂ³</span>
              <span className="text-[#A1EF7A] bg-sky-50 px-2 text-[14px] rounded-md ml-1">Request</span>
            </div>
          </div>
          <div className="flex mt-4">
            <div className="w-2 h-2 rounded-full bg-pink-500 mr-2 mt-2"></div>
            <span className="text-slate-900 text-[12px]">Supplier</span>
            <div className="w-2 h-2 rounded-full bg-[#A1EF7A] ml-6 mt-2"></div>
            <span className="text-slate-900 text-[12px] ml-2">Request</span>
          </div>
          </div>

          <div className="flex items-center gap-2">
            <SensorStatusIcon panel="C" />
            <SensorStatusIcon panel="D" />
            <SensorStatusIcon panel="E" />
          </div>

          <Dropdown
```

- [ ] **Step 3: Verify**

```bash
cd ntu-1.2
npx next lint --file "src/app/(sidebar)/statistics/SupplierChart.js"
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "ntu-1.2/src/app/(sidebar)/statistics/SupplierChart.js"
git commit -m "feat(frontend): show sensor health icons on supplier chart page"
```

---

## Task 12: Icon placement — PhChart, Tds, Turbidity (panels A, B, E each)

**Files:**
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/PhChart.js`
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/Tds.js`
- Modify: `ntu-1.2/src/app/(sidebar)/statistics/Turbidity.js`

These three charts have no existing JSX header — their title is drawn by Chart.js's own `title` plugin onto the canvas, not as HTML. A new small header row has to be added above the chart to hold the icons.

**Interfaces:**
- Consumes: `<SensorStatusIcon>` (Task 6)

- [ ] **Step 1: Add the import to each of the 3 files**

Each currently starts:

```js
"use client";
import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
```

Change to:

```js
"use client";
import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { SensorStatusIcon } from "@/components/SensorStatusIcon";
```

- [ ] **Step 2: Add the icon row above the chart in all three files**

Each currently ends with the identical return block:

```jsx
  return (
    <div className="bg-white shadow-sm shadow-sky-100/70 rounded-xl p-6 h-[615px] border-sky-100 border" style={{ width: width, height: "505px" }}>
      <div className="h-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};
```

Change to:

```jsx
  return (
    <div className="bg-white shadow-sm shadow-sky-100/70 rounded-xl p-6 h-[615px] border-sky-100 border" style={{ width: width, height: "505px" }}>
      <div className="flex justify-end gap-2 mb-2">
        <SensorStatusIcon panel="A" />
        <SensorStatusIcon panel="B" />
        <SensorStatusIcon panel="E" />
      </div>
      <div className="h-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};
```

(Apply this identical change to `PhChart.js`, `Tds.js`, and `Turbidity.js` — all three share this exact return block verbatim.)

- [ ] **Step 3: Verify**

```bash
cd ntu-1.2
npx next lint --file \
  "src/app/(sidebar)/statistics/PhChart.js" \
  "src/app/(sidebar)/statistics/Tds.js" \
  "src/app/(sidebar)/statistics/Turbidity.js"
```

Expected: no new errors.

Manual check: open the `/statistics` page in a browser and confirm each of these three charts now shows 3 small status icons above its bars, and that adding them didn't visually break the existing `h-[615px]`/`height: "505px"` sizing (the chart should still render at full height below the new icon row).

- [ ] **Step 4: Commit**

```bash
git add \
  "ntu-1.2/src/app/(sidebar)/statistics/PhChart.js" \
  "ntu-1.2/src/app/(sidebar)/statistics/Tds.js" \
  "ntu-1.2/src/app/(sidebar)/statistics/Turbidity.js"
git commit -m "feat(frontend): show sensor health icons on pH/TDS/turbidity chart pages"
```

---

## Notes for the implementer (not tasks)

- `src/components/WaterUsage.js` and `src/components/Water_LevelA.js` (and `src/components/statistic copy.js`, which imports neither but sits alongside them) were investigated during planning and found to be **dead code** — nothing in the live app renders them (`statistic.js`/`statistic2.js` import the `src/components/` versions, but those two files are themselves only imported by `SelectedTypeWrapper.js`, which nothing renders). They're excluded from this plan entirely. Worth a follow-up cleanup conversation, but deleting them wasn't part of the approved design, so this plan doesn't touch them.
- `ColorWtp.js` (rendered on `/statistics`) has no fetch at all and isn't tied to any real panel, so it gets no health icon in this phase — that's Phase C territory (rebuild-or-remove the fabricated data).

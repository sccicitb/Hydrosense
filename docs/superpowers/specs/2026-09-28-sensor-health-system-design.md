# Sensor Health System — Design Spec

Date: 2026-09-28
Status: Approved for planning

## Background

An audit of the Hydrosense water-monitoring app found two separate problems:

1. **No real liveness concept exists.** The only "is a sensor online" signal
   today is a frontend toast (`dashboard/page.js`) that checks whether the
   latest DB row's `createdAt` is from today. This is loose (a sensor silent
   for 20 hours still reads as "fine") and conflates sensor liveness with
   database write success — confirmed directly: the production backend
   (`api.hydrosense.awankesehatan.com`) currently 500s on every DB-backed
   request (`connect ECONNREFUSED 127.0.0.1:3306`), while a direct read-only
   MQTT subscribe test proved Panels B, C, and D are actively transmitting
   real sensor data every ~5 seconds right now. The existing toast logic
   would misreport this exact situation as "sensors are down," when the
   sensors are fine and the database is the actual problem.
2. **Several pages show fabricated or silently-broken data** as if it were
   real (flat-zero fallback charts hitting 404 routes, a hardcoded bar
   chart with no fetch at all, an entirely invented "Reports" page). That
   work is real but out of scope for this spec — see Non-Goals.

This spec covers **Phase A (backend data-source correctness + health
tracking) and Phase B (live sensor-health UI)** only. Phase C (rewiring
each chart's real data) and Phase D (`titik-maps`) are separate,
later specs.

## Goals

- Replace the toast-based, day-granularity "sensor down" check with a real,
  live liveness signal driven by actual MQTT traffic.
- Distinguish "sensor isn't transmitting" from "sensor is transmitting but
  the database write is failing" — these are different problems today
  reported identically (or not reported at all).
- Show per-panel health status on the dashboard and on every statistics
  page that displays that panel's data.
- Fix the concrete backend bugs discovered along the way, since they sit in
  the same files this work touches.

## Non-Goals (explicitly deferred)

- Fixing the statistics pages' own broken data endpoints
  (`/data/leakage/statistics`, `/data/supply/panelX`,
  `/data/panelX/statistics` — none of these routes exist on the backend
  today). Charts keep showing their current flat-zero fallback until Phase C.
- Rebuilding `Reports` (fully fabricated financial-loss data) or `ColorWtp`
  (hardcoded bar chart, no fetch at all).
- `titik-maps`' fabricated incident markers / fake-located TikTok markers.
- Any live server/deployment configuration (DB host, cPanel env, TLS). The
  user owns deployment; this spec only changes application code.

## Backend Design

### In-memory heartbeat state

`app.js` (which already runs the MQTT client and a Socket.IO server) gains a
plain in-memory map keyed by panel letter:

```js
{
  A: { transmitting: false, lastMessageAt: null, persisted: false, lastPersistedAt: null, lastError: null },
  B: { ... }, C: { ... }, D: { ... }, E: { ... }
}
```

On every MQTT message:
1. Update `lastMessageAt = new Date()` **immediately**, before attempting
   any DB write.
2. Attempt `PanelX.create(data)` in a try/catch.
   - Success: set `persisted = true`, `lastPersistedAt = new Date()`,
     `lastError = null`.
   - Failure: set `persisted = false`, `lastError = err.message`. Do **not**
     touch `lastMessageAt` — the sensor still transmitted successfully.

### Freshness tick

A `setInterval` running every 5s recomputes `transmitting` for all 5 panels:
`transmitting = (now - lastMessageAt) < 30_000`. The 30s threshold is chosen
because live panels were observed messaging roughly every 5s — 30s gives
margin against jitter without being slow to flag genuine silence.

Whenever any panel's computed state changes, emit the full snapshot via
`io.emit('sensor-health', snapshot)`. Do not emit on every tick — only on
change — to avoid flooding connected clients with identical payloads.

### New REST endpoint

`GET /health/sensors` returns the same snapshot shape as the Socket.IO
event. Used by the frontend for the initial page load (before the first
push arrives) and as the target of the manual "Refresh" action.

### Bug fixes (same files, bundled in)

- `DataController.getPanelE` currently calls
  `DataController.getPanelData(req, res, PanelD)` — copy-paste bug. Fix to
  pass `PanelE`.
- `DataController.getLatestPanelData` currently sorts by the device-reported
  `timestamp` field (`order: [['timestamp', 'DESC']]`). This field is
  unreliable — observed values are epoch-1970-ish or raw device-uptime
  counters that reset to 0 on every device reboot, meaning "latest by
  device timestamp" can return a stale row after a reboot even though newer
  data exists. Fix to sort by `createdAt` DESC (server receipt time).
- `/data/leakages` (`DataController.getLeakages`) references a `Leakage`
  Sequelize model that does not exist anywhere in `models/` — every call
  500s. Remove the route (and dead `getLeakages` method / unused `Leakage`
  import) rather than leaving a permanently-broken endpoint; Phase C can
  build a real leakage-statistics endpoint from scratch against real panel
  data if/when needed.

## Frontend Design

### `SensorHealthProvider`

New React context, mounted once in `ntu-1.2/src/app/(sidebar)/layout.js` so
it wraps the dashboard and every statistics page beneath it. Responsibilities:

- On mount: `fetch(`${API_BASE_URL}/health/sensors`)` for the initial
  snapshot.
- Open one `socket.io-client` connection to `API_BASE_URL`, listen for
  `sensor-health`, update shared state on each push.
- Track the socket's own connection state (connected / disconnected).
- Expose `refresh()`: re-fetches `GET /health/sensors` on demand, disabled
  for ~2-3s after invocation to prevent spamming.
- Expose the per-panel status map to consumers.

`socket.io-client` is added as a new frontend dependency.

### Icon states (four, not two)

| State | Meaning | Trigger |
|---|---|---|
| **Live** (green) | Sensor transmitting, DB write succeeding | `transmitting && persisted` |
| **Degraded** (amber) | Sensor transmitting, DB write failing | `transmitting && !persisted` — surfaces exactly the ECONNREFUSED-style failure found in production, instead of masquerading as a dead sensor |
| **Silent** (red) | No MQTT message within 30s threshold | `!transmitting` |
| **Unknown** (gray) | No data yet, or the client's own socket is disconnected | no snapshot received yet, or `socket.connected === false` |

The Unknown state matters as much as Degraded: if the *frontend's* connection
to the backend drops, panels must not default to "Silent" (that would
misreport a client-side problem as a sensor problem — the same class of lie
this whole effort is meant to eliminate).

### Placement

- **Dashboard**: a compact status strip — 5 icons (one per panel) plus one
  "Refresh" button calling `refresh()` — replaces the sensor-liveness
  portion of `dashboard/page.js`'s data-fetch effect.
- **Each statistics page**: one `<SensorStatusIcon panel="X" />` (the single
  panel that page displays) next to its chart header, reading from the same
  shared context — no per-page socket connections, no duplicate refresh
  logic.

### Cleanup (corrected during implementation planning)

`dashboard/page.js` uses `react-toastify` for two unrelated things: (1) the
sensor-liveness toast this spec replaces, and (2) a separate water-quality
alert system (`lastToastTime` ref, `FIVE_MINUTES` constant, the `useEffect`
around what was originally lines 698-760) that warns when TDS/pH/turbidity
cross unsafe thresholds. That second system is untouched by this spec —
`react-toastify`, `ToastContainer`, `lastToastTime`, and `FIVE_MINUTES` all
stay.

The sensor-liveness effect (originally lines 483-587) also does double duty
today: besides the toast logic, it's where the dashboard fetches each
panel's latest reading into state (`flow1`, `ph1`, `tds1`, `level1`, etc.)
for the summary cards. Only the toast-triggering parts (`showSensorToast`,
the `isToday` check, `toastTimers`, `toast.dismiss`/`toast.error` calls) are
removed; the per-panel `fetch` + state-setting logic and the 10-minute
polling interval are kept as-is, just no longer wrapped in toast calls.

## Data Flow & Edge Cases

- **Backend restart**: heartbeat map resets to empty/unknown. Frontend shows
  "Unknown" for all panels until the first tick or message repopulates it —
  self-correcting within seconds, no manual action required.
- **Frontend socket disconnect** (network blip, backgrounded tab, etc.): all
  panels flip to "Unknown" until reconnect. On reconnect, the provider
  immediately calls `GET /health/sensors` to resync rather than waiting for
  the next push, covering any events missed during the gap.
- **Manual refresh spam**: button disables itself for ~2-3s after each click.
- **Debugging aid**: `lastError` from a failed DB write is available in the
  snapshot and can be surfaced as a tooltip on the Degraded icon.
- **Multiple browser tabs**: each tab's provider opens its own socket
  connection; the backend just broadcasts to all connected sockets — no
  per-client server-side state needed.

## Testing Plan

Neither project has a test framework configured (`Backend-NTU-2.0-main`'s
`npm test` is a placeholder; `ntu-1.2` has none). No test framework will be
introduced for this feature alone. Verification is manual and concrete,
matching how this system was already investigated:

- **Backend**: direct MQTT publish/listen script to confirm the heartbeat
  map updates correctly and the 30s silence threshold flips `transmitting`
  as expected; `curl /health/sensors` to confirm response shape; confirm
  `getPanelE` now returns Panel E data and `getLatestPanelData` sorts by
  `createdAt`.
- **Frontend**: browser check that icons render and update live from real
  broker traffic, that a backend restart shows "Unknown" and self-corrects,
  that killing the frontend's network shows "Unknown" (not "Silent"), and
  that refresh works and is debounced.

## Open Questions

None outstanding — all decisions above were confirmed during brainstorming
(2026-09-28 session): MQTT-heartbeat-based liveness with both
transmitting/persisted signals shown separately, live push via the existing
Socket.IO server, icons on the dashboard and every statistics page, one
shared connection via React Context.

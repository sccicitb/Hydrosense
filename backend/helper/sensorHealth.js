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

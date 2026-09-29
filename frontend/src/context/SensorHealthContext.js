"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";
const PANELS = ["A", "B", "C", "D", "E"];
const REFRESH_COOLDOWN_MS = 2500;
const CONNECT_TIMEOUT_MS = 15000;

const SensorHealthContext = createContext();

export const SensorHealthProvider = ({ children }) => {
  const [health, setHealth] = useState(null);
  const [connected, setConnected] = useState(false);
  const [everConnected, setEverConnected] = useState(false);
  const [connectTimedOut, setConnectTimedOut] = useState(false);
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

    const connectTimeoutId = setTimeout(() => setConnectTimedOut(true), CONNECT_TIMEOUT_MS);

    socket.on("connect", () => {
      clearTimeout(connectTimeoutId);
      setConnected(true);
      setEverConnected(true);
      setConnectTimedOut(false);
      fetchSnapshot();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("sensor-health", (snapshot) => setHealth(snapshot));

    return () => {
      clearTimeout(connectTimeoutId);
      socket.disconnect();
    };
  }, []);

  const getPanelState = (panel) => {
    if (!connected && (everConnected || connectTimedOut)) return "unknown";
    const entry = health && health[panel];
    if (!entry || !entry.lastMessageAt) return "unknown";
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

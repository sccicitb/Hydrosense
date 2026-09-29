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

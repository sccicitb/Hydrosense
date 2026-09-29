"use client";

import React, { useEffect, useState } from "react";
import moment from "moment";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Gauge,
  HelpCircle,
  ShieldCheck,
  Waves,
  Wrench,
  XCircle,
} from "lucide-react";
import { useSensorHealth } from "@/context/SensorHealthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";

const sensorPanels = {
  panelA: { path: "panelA1", label: "Panel A" },
  panelB: { path: "panelB1", label: "Panel B" },
  panelC: { path: "panelC1", label: "Panel C" },
  panelD: { path: "panelD1", label: "Panel D" },
  panelE: { path: "panelE1", label: "Panel E" },
};

const priorityStyles = {
  high: {
    label: "Prioritas tinggi",
    icon: AlertTriangle,
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    pill: "bg-red-100 text-red-700 border-red-200",
  },
  medium: {
    label: "Perlu dipantau",
    icon: Wrench,
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    pill: "bg-amber-100 text-amber-700 border-amber-200",
  },
  normal: {
    label: "Operasional normal",
    icon: CheckCircle2,
    border: "border-sky-200",
    bg: "bg-sky-50",
    text: "text-sky-700",
    pill: "bg-sky-100 text-sky-700 border-sky-200",
  },
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const statusStyles = {
  normal: {
    label: "Normal",
    border: "border-sky-200",
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  watch: {
    label: "Pantau",
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  danger: {
    label: "Kritis",
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

const getTankStatus = (value) => {
  const number = toNumber(value);
  if (number <= 100) return "danger";
  if (number <= 200) return "watch";
  return "normal";
};

const getFlowStatus = (value) => {
  const number = toNumber(value);
  if (number <= 0) return "danger";
  if (number < 50) return "watch";
  return "normal";
};

const getTdsStatus = (value) => {
  const number = toNumber(value);
  if (number >= 800) return "danger";
  if (number >= 500) return "watch";
  return "normal";
};

const getPhStatus = (value) => {
  const number = toNumber(value);
  if (number < 5.5 || number >= 8.5) return "danger";
  if (number <= 6.5 || number >= 8.0) return "watch";
  return "normal";
};

const getTurbidityStatus = (value) => {
  const number = toNumber(value);
  if (number >= 15) return "danger";
  if (number >= 5) return "watch";
  return "normal";
};

const buildMetricWarning = (metricLabel, panelLocation, status) => {
  if (status === "normal") return null;
  return `Kualitas air sudah melebihi batas aman konsumsi, perlu dilakukan water treatment tambahan pada ${metricLabel} ${panelLocation}!`;
};

const average = (values) => {
  const validValues = values.map(toNumber).filter((value) => Number.isFinite(value));
  if (validValues.length === 0) return 0;
  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
};

const StatusPill = ({ status, label }) => {
  const style = statusStyles[status] || statusStyles.normal;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${style.border} ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label || style.label}
    </span>
  );
};

const sensorStateStyles = {
  live: { icon: CheckCircle2, label: "Live", border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-600" },
  degraded: { icon: AlertTriangle, label: "Degraded", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-600" },
  silent: { icon: XCircle, label: "Silent", border: "border-red-200", bg: "bg-red-50", text: "text-red-600" },
  unknown: { icon: HelpCircle, label: "Unknown", border: "border-slate-200", bg: "bg-slate-50", text: "text-slate-500" },
};

const SensorHealthStrip = () => {
  const { PANELS, refresh, refreshing, getPanelState } = useSensorHealth();

  return (
    <section className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/70">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <SectionTitle title="Sensor Health" subtitle="Status koneksi sensor secara real-time" />
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PANELS.map((panel) => {
          const state = getPanelState(panel);
          const style = sensorStateStyles[state];
          const Icon = style.icon;

          return (
            <div key={panel} className={`flex flex-col items-center gap-2 rounded-lg border ${style.border} ${style.bg} px-4 py-4`}>
              <Icon size={32} className={style.text} />
              <span className="text-slate-950 text-sm font-black">Panel {panel}</span>
              <span className={`text-xs font-bold ${style.text}`}>{style.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const SectionTitle = ({ title, subtitle }) => (
  <div className="flex flex-col gap-1">
    <h2 className="text-slate-950 text-2xl font-bold">{title}</h2>
    {subtitle ? <p className="text-slate-500 text-sm">{subtitle}</p> : null}
  </div>
);

const SummaryCard = ({ icon: Icon, label, value, helper, status }) => {
  const style = statusStyles[status] || statusStyles.normal;

  return (
    <article className={`rounded-lg border ${style.border} bg-white p-5 min-h-[142px] flex flex-col justify-between shadow-sm shadow-sky-100/70`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`h-10 w-10 rounded-md border ${style.border} ${style.bg} ${style.text} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <StatusPill status={status} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h3 className="text-slate-950 text-3xl font-black mt-1 leading-tight">{value}</h3>
        <p className="text-slate-500 text-xs mt-2">{helper}</p>
      </div>
    </article>
  );
};

const TankOverview = ({ tanks, formatValue }) => (
  <section className="rounded-lg border border-sky-100 bg-white p-5 min-h-[258px] shadow-sm shadow-sky-100/70">
    <div className="flex items-start justify-between gap-4">
      <SectionTitle title="Water Level" subtitle="Ketersediaan air per tandon" />
      <div className="h-10 w-10 rounded-md border border-sky-200 bg-sky-50 text-sky-600 flex items-center justify-center">
        <Droplets size={20} />
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 border border-sky-100 rounded-md overflow-hidden">
      {tanks.map((tank, index) => {
        const status = getTankStatus(tank.value);
        const style = statusStyles[status] || statusStyles.normal;

        return (
          <div key={tank.label} className={`p-4 bg-sky-50/40 ${index > 0 ? "border-t lg:border-t-0 lg:border-l border-sky-100" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-slate-700 text-sm font-bold">{tank.label}</p>
              <StatusPill status={status} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Available</p>
                <h3 className="text-slate-950 text-4xl font-black mt-1">{formatValue(tank.value)}</h3>
              </div>
              <span className={`text-sm font-bold ${style.text}`}>cm</span>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

const FlowCard = ({ label, value, formatValue }) => {
  const status = getFlowStatus(value);
  const style = statusStyles[status] || statusStyles.normal;

  return (
    <article className={`rounded-lg border ${style.border} bg-white p-5 min-h-[120px] flex flex-col justify-between shadow-sm shadow-sky-100/70`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sky-700 text-sm font-black uppercase tracking-wide">{label}</p>
        <Activity size={18} className={style.text} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-slate-950 text-3xl font-black">{formatValue(value)}</h3>
          <p className="text-slate-500 text-xs mt-1">L/m</p>
        </div>
        <StatusPill status={status} />
      </div>
    </article>
  );
};

const MetricReading = ({ label, value, unit, status, formatValue, warning }) => {
  const style = statusStyles[status] || statusStyles.normal;

  return (
    <div className="border-t border-sky-100 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-slate-600 text-sm font-semibold">{label}</p>
        <StatusPill status={status} />
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className={`text-3xl font-black ${style.text}`}>{formatValue(value)}</span>
        {unit ? <span className="text-slate-500 text-sm font-bold pb-1">{unit}</span> : null}
      </div>
      {warning ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-700 text-xs font-semibold leading-snug">{warning}</p>
        </div>
      ) : null}
    </div>
  );
};

const QualityPanel = ({ panel, formatValue }) => {
  const statusRank = { normal: 0, watch: 1, danger: 2 };
  const panelStatus = panel.metrics.reduce((current, metric) => (
    statusRank[metric.status] > statusRank[current] ? metric.status : current
  ), "normal");

  return (
    <article className="rounded-lg border border-sky-100 bg-white overflow-hidden shadow-sm shadow-sky-100/70">
      <div className="p-4">
        <p className="text-slate-950 text-lg font-black">{panel.name}</p>
        <p className="text-slate-500 text-xs mt-1">{panel.location}</p>
      </div>
      <div className="px-4 pb-4">
        <StatusPill status={panelStatus} label={panelStatus === "normal" ? "Stabil" : statusStyles[panelStatus].label} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3">
        {panel.metrics.map((metric) => (
          <MetricReading key={metric.label} {...metric} formatValue={formatValue} />
        ))}
      </div>
    </article>
  );
};

const buildPolicyRecommendations = (metrics, formatValue) => {
  const recommendations = [];

  const addRecommendation = (recommendation) => {
    recommendations.push(recommendation);
  };

  const qualityPanels = [
    {
      key: "pump",
      label: "Pump House",
      tds: toNumber(metrics.tds2),
      ph: toNumber(metrics.ph2),
      turbidity: toNumber(metrics.turbidity2),
    },
    {
      key: "dorm",
      label: "Asrama",
      tds: toNumber(metrics.tds3),
      ph: toNumber(metrics.ph3),
      turbidity: toNumber(metrics.turbidity3),
    },
  ];

  qualityPanels.forEach((panel) => {
    if (panel.tds >= 500) {
      addRecommendation({
        id: `${panel.key}-tds`,
        priority: panel.tds >= 800 ? "high" : "medium",
        title: `Treatment tambahan TDS ${panel.label}`,
        metric: `${formatValue(panel.tds)} ppm`,
        action: "Tetapkan water treatment tambahan, cek media filtrasi, dan lakukan sampling ulang sebelum air digunakan untuk konsumsi.",
      });
    }

    if (panel.ph <= 6.5 || panel.ph >= 8.0) {
      addRecommendation({
        id: `${panel.key}-ph`,
        priority: panel.ph < 5.5 || panel.ph >= 8.5 ? "high" : "medium",
        title: `Normalisasi pH ${panel.label}`,
        metric: `pH ${formatValue(panel.ph)}`,
        action: "Aktifkan SOP koreksi pH, validasi ulang sensor, dan tahan distribusi konsumsi sampai pembacaan kembali pada rentang 6.5-8.0.",
      });
    }

    if (panel.turbidity >= 5) {
      addRecommendation({
        id: `${panel.key}-turbidity`,
        priority: panel.turbidity >= 15 ? "high" : "medium",
        title: `Pengendalian kekeruhan ${panel.label}`,
        metric: `${formatValue(panel.turbidity)} NTU`,
        action: "Jalankan flushing dan backwash filter, inspeksi sumber sedimen, lalu catat hasil tindak lanjut pada log operator.",
      });
    }
  });

  const tankLevels = [
    { label: "WTP 1 Tank", value: toNumber(metrics.level1) },
    { label: "Ground Tank", value: toNumber(metrics.level2) },
    { label: "Dorm Tank", value: toNumber(metrics.level3) },
  ];
  const lowestTank = tankLevels.reduce((lowest, tank) => (tank.value < lowest.value ? tank : lowest), tankLevels[0]);

  if (lowestTank.value <= 100) {
    addRecommendation({
      id: "tank-critical",
      priority: "high",
      title: "Prioritas distribusi air tandon",
      metric: `${lowestTank.label}: ${formatValue(lowestTank.value)} cm`,
      action: "Prioritaskan suplai ke area esensial, tunda pemakaian non-prioritas, dan aktifkan jadwal pengisian tandon darurat.",
    });
  } else if (lowestTank.value <= 200) {
    addRecommendation({
      id: "tank-watch",
      priority: "medium",
      title: "Pemantauan cadangan tandon",
      metric: `${lowestTank.label}: ${formatValue(lowestTank.value)} cm`,
      action: "Pantau level tandon per shift dan siapkan pembatasan pemakaian jika tren penurunan berlanjut.",
    });
  }

  const flowSensors = [
    { label: "WTP-IN", value: toNumber(metrics.flow1) },
    { label: "WTP-OUT", value: toNumber(metrics.flow2) },
    { label: "GT-OUT", value: toNumber(metrics.flow3) },
    { label: "DORM-OUT", value: toNumber(metrics.flow4) },
  ];
  const stoppedFlow = flowSensors.find((flow) => flow.value <= 0);

  if (stoppedFlow) {
    addRecommendation({
      id: "flow-stop",
      priority: "high",
      title: "Investigasi aliran nol",
      metric: `${stoppedFlow.label}: ${formatValue(stoppedFlow.value)} L/m`,
      action: "Periksa valve, pompa, dan koneksi flowmeter sebelum operator menyatakan jalur distribusi aman.",
    });
  }

  const baselineRecommendations = [
    {
      id: "baseline-monitoring",
      priority: "normal",
      title: "SOP monitoring per shift",
      metric: "Review 10 menit",
      action: "Tetapkan petugas untuk meninjau alarm kualitas air dan level tandon setiap shift, termasuk bukti tindak lanjut.",
    },
    {
      id: "baseline-calibration",
      priority: "normal",
      title: "Kalibrasi sensor berkala",
      metric: "Mingguan",
      action: "Jadwalkan kalibrasi pH, turbidity, TDS, level, dan flowmeter agar keputusan operasional berbasis data valid.",
    },
    {
      id: "baseline-escalation",
      priority: "normal",
      title: "Alur eskalasi kualitas air",
      metric: "Operator ke teknisi",
      action: "Gunakan batas TDS 500 ppm, turbidity 5 NTU, dan pH 6.5-8.0 sebagai trigger laporan teknis dan pembatasan pemakaian.",
    },
  ];

  return recommendations.length > 0
    ? [...recommendations, ...baselineRecommendations.slice(0, 1)].slice(0, 6)
    : baselineRecommendations;
};

const PolicyRecommendations = ({ recommendations }) => {
  const highPriorityCount = recommendations.filter((item) => item.priority === "high").length;
  const headerStatus = highPriorityCount > 0 ? "Ada tindakan prioritas" : "Kondisi terkendali";

  return (
    <section className="mb-8">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="text-slate-950 text-2xl font-bold">Rekomendasi Kebijakan</h2>
            <p className="text-slate-500 text-sm mt-1">
              Saran operasional berdasarkan pembacaan sensor kualitas air, level tandon, dan flow terkini.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-2 text-xs font-bold text-slate-600 uppercase tracking-wide shadow-sm shadow-sky-100/70">
          <ShieldCheck size={14} className={highPriorityCount > 0 ? "text-red-600" : "text-sky-600"} />
          {headerStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 pt-5">
        {recommendations.map((item) => {
          const style = priorityStyles[item.priority] || priorityStyles.normal;
          const Icon = style.icon;

          return (
            <article
              key={item.id}
              className={`rounded-lg border ${style.border} ${style.bg} p-4 min-h-[168px] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${style.text}`}>
                    <Icon size={16} />
                    {style.label}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${style.pill}`}>
                    {item.metric}
                  </span>
                </div>
                <h3 className="text-slate-950 text-lg font-bold mt-3 leading-snug">{item.title}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mt-3">{item.action}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

const Statistics = () => {
  // console.log("ini di dashboard", isCollapsed);

  const [level1, setLevel1] = useState(0.14);
  const [level2, setLevel2] = useState(0.14);
  const [level3, setLevel3] = useState(0.14);

  const [flow1, setFlow1] = useState(808);
  const [flow2, setFlow2] = useState(808);
  const [flow3, setFlow3] = useState(808);
  const [flow4, setFlow4] = useState(808);
  const [turbidity1, setTurbidity1] = useState(0.14);
  const [ph1, setPh1] = useState(7.2);
  const [tds1, setTds1] = useState(0.14);
  const [turbidity2, setTurbidity2] = useState(0.14);
  const [ph2, setPh2] = useState(7.2);
  const [tds2, setTds2] = useState(0.14);
  const [turbidity3, setTurbidity3] = useState(0.14);
  const [ph3, setPh3] = useState(7.2);
  const [tds3, setTds3] = useState(0.14);

  const [isLoading, setisLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("-");

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
            if (data.level2 !== undefined) setLevel3(data.level2);
          }
          if (key === 'panelE') {
            if (data.flow1 !== undefined) setFlow4(data.flow1);
            if (data.turbidity !== undefined) setTurbidity3(data.turbidity);
            if (data.ph !== undefined) setPh3(data.ph);
            if (data.tds !== undefined) setTds3(data.tds);
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

  const fmt = (v) => {
    if (v === null || v === undefined) return "0.00";
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  const policyRecommendations = buildPolicyRecommendations(
    {
      level1,
      level2,
      level3,
      flow1,
      flow2,
      flow3,
      flow4,
      turbidity2,
      ph2,
      tds2,
      turbidity3,
      ph3,
      tds3,
    },
    fmt
  );

  const tankData = [
    { label: "WTP 1 Tank", value: level1 },
    { label: "Ground Tank", value: level2 },
    { label: "Dorm Tank", value: level3 },
  ];

  const flowData = [
    { label: "WTP-IN", value: flow1 },
    { label: "WTP-OUT", value: flow2 },
    { label: "GT-OUT", value: flow3 },
    { label: "DORM-OUT", value: flow4 },
  ];

  const qualityPanels = [
    {
      name: "Panel A",
      location: "WTP Intake",
      metrics: [
        { label: "Turbidity", value: turbidity1, unit: "NTU", status: getTurbidityStatus(turbidity1) },
        { label: "pH", value: ph1, unit: "", status: getPhStatus(ph1) },
        { label: "TDS", value: tds1, unit: "ppm", status: getTdsStatus(tds1) },
      ],
    },
    {
      name: "Panel B",
      location: "Pump House",
      metrics: [
        { label: "Turbidity", value: turbidity2, unit: "NTU", status: getTurbidityStatus(turbidity2), warning: buildMetricWarning("Turbidity", "Pump House", getTurbidityStatus(turbidity2)) },
        { label: "pH", value: ph2, unit: "", status: getPhStatus(ph2), warning: buildMetricWarning("pH", "Pump House", getPhStatus(ph2)) },
        { label: "TDS", value: tds2, unit: "ppm", status: getTdsStatus(tds2), warning: buildMetricWarning("TDS", "Pump House", getTdsStatus(tds2)) },
      ],
    },
    {
      name: "Panel E",
      location: "Dormitory",
      metrics: [
        { label: "Turbidity", value: turbidity3, unit: "NTU", status: getTurbidityStatus(turbidity3), warning: buildMetricWarning("Turbidity", "Asrama", getTurbidityStatus(turbidity3)) },
        { label: "pH", value: ph3, unit: "", status: getPhStatus(ph3), warning: buildMetricWarning("pH", "Asrama", getPhStatus(ph3)) },
        { label: "TDS", value: tds3, unit: "ppm", status: getTdsStatus(tds3), warning: buildMetricWarning("TDS", "Asrama", getTdsStatus(tds3)) },
      ],
    },
  ];

  const activeRecommendations = policyRecommendations.filter((item) => item.priority !== "normal").length;
  const highPriorityRecommendations = policyRecommendations.filter((item) => item.priority === "high").length;
  const lowestTank = tankData.reduce((lowest, tank) => (toNumber(tank.value) < toNumber(lowest.value) ? tank : lowest), tankData[0]);
  const activeFlowCount = flowData.filter((flow) => toNumber(flow.value) > 0).length;
  const averageTds = average([tds1, tds2, tds3]);
  const systemStatus = highPriorityRecommendations > 0 ? "danger" : activeRecommendations > 0 ? "watch" : "normal";

  const summaryCards = [
    {
      icon: ShieldCheck,
      label: "Status Sistem",
      value: systemStatus === "danger" ? "Atensi" : systemStatus === "watch" ? "Pantau" : "Stabil",
      helper: `${activeRecommendations} rekomendasi aktif`,
      status: systemStatus,
    },
    {
      icon: Droplets,
      label: "Tandon Terendah",
      value: `${fmt(lowestTank.value)} cm`,
      helper: lowestTank.label,
      status: getTankStatus(lowestTank.value),
    },
    {
      icon: Gauge,
      label: "Rata-rata TDS",
      value: `${fmt(averageTds)} ppm`,
      helper: "Panel A, B, dan E",
      status: getTdsStatus(averageTds),
    },
    {
      icon: Activity,
      label: "Jalur Flow Aktif",
      value: `${activeFlowCount}/4`,
      helper: "WTP, Ground Tank, Dorm",
      status: activeFlowCount === 4 ? "normal" : activeFlowCount > 0 ? "watch" : "danger",
    },
  ];

  return (
    <div className="min-h-full w-full max-w-full min-w-0 overflow-x-hidden bg-[#F3FAFF] p-5 sm:p-6 lg:p-8">
      <div className="space-y-6 pb-8">
        <header className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg border border-sky-200 bg-white text-sky-600 flex items-center justify-center shadow-sm shadow-sky-100/70">
                <Waves size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-sky-700 text-sm font-semibold uppercase tracking-[0.2em]">Hydrosense</p>
                <h1 className="text-3xl font-black leading-tight text-slate-950 xl:text-4xl">Water Monitoring Dashboard</h1>
              </div>
            </div>
          </div>

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
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </section>

        <section className="grid grid-cols-1 2xl:grid-cols-[1.15fr_0.85fr] gap-4">
          <TankOverview tanks={tankData} formatValue={fmt} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {flowData.map((flow) => (
              <FlowCard key={flow.label} {...flow} formatValue={fmt} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between mb-4">
            <SectionTitle title="Kualitas Air per Panel" subtitle="Nilai pH, TDS, dan turbidity pada titik pemantauan utama" />
            <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-2 text-xs font-bold text-slate-600 uppercase tracking-wide shadow-sm shadow-sky-100/70">
              <Gauge size={14} className="text-sky-600" />
              3 panel aktif
            </div>
          </div>
          <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4">
            {qualityPanels.map((panel) => (
              <QualityPanel key={panel.name} panel={panel} formatValue={fmt} />
            ))}
          </div>
        </section>

        <PolicyRecommendations recommendations={policyRecommendations} />
      </div>
    </div>
  );
};

export default Statistics;

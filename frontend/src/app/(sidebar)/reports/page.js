"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";

// Rough estimate, not an exact published rate: universities/schools fall under
// PDAM's "Sosial Khusus" tariff category, which prices below the commercial
// rate. PDAM Tirta Medal (serves Sumedang regency, including Jatinangor)
// publishes a commercial rate of ~Rp 6,825-6,850/m3; social/education tiers
// run below that. Rp 6,000/m3 chosen as a reasonable working figure — update
// here if a real billed rate becomes available.
const WATER_TARIFF_PER_M3 = 6000;
const WATER_TARIFF_PER_LITER = WATER_TARIFF_PER_M3 / 1000;
const MINUTES_PER_DAY = 24 * 60;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const statusStyles = {
  normal: { label: "Normal", border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  watch: { label: "Perlu Dipantau", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  danger: { label: "Kritis", border: "border-red-200", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const getLeakStatus = (percent) => {
  if (percent >= 10) return "danger";
  if (percent >= 5) return "watch";
  return "normal";
};

// Segments follow the flow chain implied by the dashboard's existing
// WTP-IN/WTP-OUT/GT-OUT/DORM-OUT labels (Panel A -> Panel B in/out -> Panel
// E). Best-informed guess at the real plumbing topology, not independently
// verified against physical piping - correct here if the real layout differs.
const computeSegment = (label, upstreamFlow, downstreamFlow) => {
  const upstream = toNumber(upstreamFlow);
  const downstream = toNumber(downstreamFlow);
  const lossRate = Math.max(0, upstream - downstream);
  const lossPercent = upstream > 0 ? (lossRate / upstream) * 100 : 0;
  const estimatedDailyLiters = lossRate * MINUTES_PER_DAY;
  const estimatedDailyCost = estimatedDailyLiters * WATER_TARIFF_PER_LITER;

  return {
    label,
    upstream,
    downstream,
    lossRate,
    lossPercent,
    estimatedDailyLiters,
    estimatedDailyCost,
    status: getLeakStatus(lossPercent),
  };
};

const StatusPill = ({ status }) => {
  const style = statusStyles[status] || statusStyles.normal;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${style.border} ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

const fmtLiters = (value) => `${toNumber(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })} L`;
const fmtRupiah = (value) => `Rp ${Math.round(toNumber(value)).toLocaleString("id-ID")}`;
const fmtPercent = (value) => `${toNumber(value).toFixed(1)}%`;

const Report = () => {
  const [flowA1, setFlowA1] = useState(null);
  const [flowB1, setFlowB1] = useState(null);
  const [flowB2, setFlowB2] = useState(null);
  const [flowE1, setFlowE1] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("-");

  useEffect(() => {
    const fetchLatest = async (path) => {
      try {
        const response = await fetch(`${API_BASE_URL}/data/${path}/latest`, { cache: "no-store" });
        if (!response.ok) return null;
        const data = await response.json().catch(() => null);
        return data && typeof data === "object" ? data : null;
      } catch {
        return null;
      }
    };

    const fetchAll = async () => {
      const [dataA, dataB, dataE] = await Promise.all([
        fetchLatest("panelA1"),
        fetchLatest("panelB1"),
        fetchLatest("panelE1"),
      ]);

      if (dataA?.flow1 !== undefined) setFlowA1(dataA.flow1);
      if (dataB?.flow1 !== undefined) setFlowB1(dataB.flow1);
      if (dataB?.flow2 !== undefined) setFlowB2(dataB.flow2);
      if (dataE?.flow1 !== undefined) setFlowE1(dataE.flow1);

      setLastUpdated(dataA || dataB || dataE ? new Date().toLocaleString("id-ID") : "Data sensor belum tersedia");
      setIsLoading(false);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 600000);
    return () => clearInterval(interval);
  }, []);

  const segments = [
    computeSegment("WTP Intake -> Pump House (masuk)", flowA1, flowB1),
    computeSegment("Pump House (masuk -> keluar)", flowB1, flowB2),
    computeSegment("Pump House (keluar) -> Dormitory", flowB2, flowE1),
  ];

  const statusRank = { normal: 0, watch: 1, danger: 2 };
  const worstSegment = segments.reduce(
    (worst, segment) => (statusRank[segment.status] > statusRank[worst.status] ? segment : worst),
    segments[0]
  );
  const totalDailyLiters = segments.reduce((sum, segment) => sum + segment.estimatedDailyLiters, 0);
  const totalDailyCost = segments.reduce((sum, segment) => sum + segment.estimatedDailyCost, 0);
  const overallStatus = worstSegment.status;

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#F3FAFF] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-row justify-between items-center pb-7">
        <h1 className="text-4xl font-bold text-slate-900">Water Leakage Report</h1>
      </div>

      <div className="mb-7 w-full rounded-lg border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/70">
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-slate-900 text-2xl font-bold">Estimasi Kebocoran per Segmen</h2>
          <p className="text-slate-500 text-sm">
            Dihitung dari selisih laju alir (flow) antar titik sensor terkini &mdash; bukan data historis kumulatif.
            Terakhir diperbarui: {isLoading ? "Memuat..." : lastUpdated}.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-500 text-sm">Estimasi Kehilangan Harian</h3>
            <p className="text-slate-900 text-xl font-bold">{fmtLiters(totalDailyLiters)}</p>
            <p className="text-slate-400 text-xs mt-1">berdasarkan laju saat ini</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-500 text-sm">Estimasi Kerugian Harian</h3>
            <p className="text-slate-900 text-xl font-bold">{fmtRupiah(totalDailyCost)}</p>
            <p className="text-slate-400 text-xs mt-1">tarif estimasi Rp {WATER_TARIFF_PER_M3.toLocaleString("id-ID")}/m&sup3;</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-500 text-sm">Segmen Tertinggi</h3>
            <p className="text-slate-900 text-lg font-bold leading-snug">{worstSegment.label}</p>
            <p className="text-slate-400 text-xs mt-1">{fmtPercent(worstSegment.lossPercent)} kehilangan</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-500 text-sm mb-2">Status Keseluruhan</h3>
            <StatusPill status={overallStatus} />
          </div>
        </div>

        {/* Segment table */}
        <div className="overflow-x-auto">
          <table className="w-full text-slate-900">
            <thead>
              <tr className="border-b border-sky-100">
                <th className="text-left py-3 px-2">Segmen</th>
                <th className="text-right py-3 px-2">Masuk (L/m)</th>
                <th className="text-right py-3 px-2">Keluar (L/m)</th>
                <th className="text-right py-3 px-2">Selisih (L/m)</th>
                <th className="text-right py-3 px-2">Kehilangan (%)</th>
                <th className="text-right py-3 px-2">Est. Rp/hari</th>
                <th className="text-right py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment) => (
                <tr key={segment.label} className="border-b border-sky-100">
                  <td className="py-2 px-2">{segment.label}</td>
                  <td className="py-2 px-2 text-right">{segment.upstream.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{segment.downstream.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{segment.lossRate.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{fmtPercent(segment.lossPercent)}</td>
                  <td className="py-2 px-2 text-right">{fmtRupiah(segment.estimatedDailyCost)}</td>
                  <td className="py-2 px-2 text-right">
                    <StatusPill status={segment.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-slate-400 text-xs mt-4">
          Segmen mengikuti rangkaian flow yang sudah dipakai di Dashboard (WTP Intake &rarr; Pump House &rarr;
          Dormitory, Panel A &rarr; Panel B &rarr; Panel E). Tarif air Rp {WATER_TARIFF_PER_M3.toLocaleString("id-ID")}/m&sup3;
          adalah estimasi kasar (kategori sosial/pendidikan PDAM), bukan tarif resmi yang tertagih.
        </p>
      </div>
    </div>
  );
};

export default Report;

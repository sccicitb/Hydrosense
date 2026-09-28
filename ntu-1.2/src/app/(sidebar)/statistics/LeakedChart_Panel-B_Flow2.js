"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { SensorStatusIcon } from "@/components/SensorStatusIcon";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip
);

const WaterUsageChart = ({ width }) => {
  const [selectedRange, setSelectedRange] = useState("weekly");
  const [WaterData, setWaterData] = useState([]);
  const [leakStatus, setLeakStatus] = useState("normal");

  // Fungsi untuk menentukan status kebocoran berdasarkan data
  const getLeakStatusColor = (data) => {
    const total = data.reduce((acc, val) => acc + val, 0);
    const average = data.length ? total / data.length : 0;

    if (average <= 5) return "normal";
    if (average <= 10) return "aware";
    return "worry";
  };

  const fetchWater = async () => {
    let url = "";
    let expectedLength = 0;
  
    switch (selectedRange) {
      case "hourly":
        url = `${API_BASE_URL}/data/leakage/statistics?filter=hourly&panelId=panelB_flow2`;
        expectedLength = 60;
        break;
      case "daily":
        url = `${API_BASE_URL}/data/leakage/statistics?filter=daily&panelId=panelB_flow2`;
        expectedLength = 24;
        break;
      case "weekly":
        url = `${API_BASE_URL}/data/leakage/statistics?filter=weekly&panelId=panelB_flow2`;
        expectedLength = 7;
        break;
      case "monthly":
        url = `${API_BASE_URL}/data/leakage/statistics?filter=monthly&panelId=panelB_flow2`;
        expectedLength = 31;
        break;
      case "yearly":
        url = `${API_BASE_URL}/data/leakage/statistics?filter=yearly&panelId=panelB_flow2`;
        expectedLength = 12;
        break;
      default:
        return;
    }
  
    try {
      const response = await axios.get(url, { validateStatus: () => true });
      const raw = response.data;
      const data = Array.isArray(raw.data) ? raw.data : [];
      let water = Array(expectedLength).fill(0);
  
      data.forEach((item) => {
        let index = 0;
  
        if (selectedRange === "hourly") {
          if (item.minute !== undefined) {
            index = parseInt(item.minute);
          }
        } else if (selectedRange === "daily") {
          if (item.hour !== undefined) {
            index = parseInt(item.hour);
          }
        } else if (selectedRange === "weekly") {
          if (item.dayName !== undefined) {
            const dayMap = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            index = dayMap.indexOf(item.dayName); // periksa nama hari
          }
        } else if (selectedRange === "monthly") {
          if (item.dayOfMonth !== undefined) {
            index = parseInt(item.dayOfMonth) - 1;
          }
        } else if (selectedRange === "yearly") {
          if (item.monthName !== undefined) {
            const monthMap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            index = monthMap.indexOf(item.monthName); // periksa nama bulan
          }
        }
  
        if (index >= 0 && index < expectedLength) {
          // Membagi data dengan 1000 dan menghilangkan desimal
          water[index] = parseFloat(item.totalLeakage) || 0; // Mengonversi ke meter kubik dan membulatkan ke bawah
        }
      });
  
      setWaterData(water);
      setLeakStatus(getLeakStatusColor(water));
    } catch (error) {
      console.warn("Gagal mengambil data leakage:", error?.message || error);
      setWaterData(Array(expectedLength).fill(0));
      setLeakStatus("normal");
    }
  };

  useEffect(() => {
    fetchWater();
    const interval = setInterval(fetchWater, 3600000);
    return () => clearInterval(interval);
  }, [selectedRange]);

  const labels = {
    hourly: Array.from({ length: 60 }, (_, i) => `Minute ${i}:00`),
    daily: Array.from({ length: 24 }, (_, i) => `Hour ${i}:00`),
    weekly: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    monthly: Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
    yearly: Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`),
  };

  const leakageLevelInfo = [
    { label: "Normal  200.8L(0-5%)", color: "#1DC286" },
    { label: "Aware 101.2L(6-10%)", color: "#F39035" },
    { label: "Worry 40L(>10%)", color: "#F34035" },
  ];

  const activeIndex = (() => {
    if (selectedRange === "weekly") {
      const today = new Date().getDay();
      return today === 0 ? 6 : today - 1;
    } else if (selectedRange === "monthly") {
      return new Date().getDate() - 1;
    }
    return null;
  })();

  const statusColor = {
    normal: "#1DC286",
    aware: "#F39035",
    worry: "#F34035",
  };

  const statusText = {
    normal: "No Leaking Found",
    aware: "Aware for Leaking",
    worry: "Leaking Found",
  };

  const backgroundColors = labels[selectedRange].map((_, index) =>
    index === activeIndex ? statusColor[leakStatus] : "#D3D3D3"
  );

  const dropdownOptions = [
    { label: "Weekly", value: "weekly" },
    { label: "Hourly", value: "hourly" },
    { label: "Daily", value: "daily" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  const data = {
    labels: labels[selectedRange],
    datasets: [
      {
        fill: true,
        data: WaterData,
        borderColor: statusColor[leakStatus],
        backgroundColor: `${statusColor[leakStatus]}20`,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: backgroundColors,
        pointHoverBackgroundColor: statusColor[leakStatus],
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#0f172a",
        bodyColor: "#334155",
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.raw}L Water`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: (value) => `${value}L`,
          color: "#64748b",
          font: { size: 12 },
          padding: 8,
        },
        grid: { color: "#dbeafe", drawBorder: false },
        border: { display: false },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          callback: function (index) {
            if (selectedRange === "daily") {
              return index % 4 === 0 ? [index] : "";
            } else if (selectedRange === "hourly") {
              return index % 10 === 0 ? [index] : "";
            } else if (selectedRange === "monthly") {
              return index % 6 === 0 ? [index] : "";
            } else if (selectedRange === "yearly") {
              return [index];
            }
            return labels[selectedRange][index];
          },
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          align: 'center', 
        },
      },
    },
  };

  return (
    <div className="flex">
      <div
        className="bg-white shadow-sm shadow-sky-100/70 rounded-xl p-6 pr-2 border-sky-100 border border-r-1"
        style={{ width: width, height: "400px" }}
      >
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
            value={selectedRange}
            options={dropdownOptions}
            onChange={(e) => setSelectedRange(e.value)}
            placeholder="This Week"
            className="flex items-center text-center gap-2 bg-sky-50 border border-sky-100 px-4 py-2 rounded-lg text-slate-500 text-sm"
            panelStyle={{
              backgroundColor: "#ffffff",
              color: "#0f172a",
              textAlign: "center",
            }}
            style={{ color: "#0f172a" }}
          />
        </div>

        {/* Chart */}
        <div className="h-[258px]">
          <Line data={data} options={options} />
        </div>
        {/* Keterangan level kebocoran */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {leakageLevelInfo.map((info, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded" style={{ backgroundColor: info.color }}></span>
              <span className="text-slate-900 text-sm">{info.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WaterUsageChart;

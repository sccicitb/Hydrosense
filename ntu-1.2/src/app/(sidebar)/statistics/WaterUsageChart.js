"use client";

import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.hydrosense.awankesehatan.com";

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

  const fetchWater = async () => {
    let url = "";
    let expectedLength = 0;
  
    switch (selectedRange) {
      case "hourly":
        url = `${API_BASE_URL}/data/supply/panelC?filter=hourly`;
        expectedLength = 60; // 60 menit per jam
        break;
      case "daily":
        url = `${API_BASE_URL}/data/supply/panelC?filter=daily`;
        expectedLength = 24; // 24 jam per hari
        break;
      case "weekly":
        url = `${API_BASE_URL}/data/supply/panelC?filter=weekly`;
        expectedLength = 7; // 7 hari dalam seminggu
        break;
      case "monthly":
        url = `${API_BASE_URL}/data/supply/panelC?filter=monthly`;
        expectedLength = 31; // 30/31 hari dalam sebulan
        break;
      case "yearly":
        url = `${API_BASE_URL}/data/supply/panelC?filter=yearly`;
        expectedLength = 12; // 12 bulan dalam setahun
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
          water[index] = Math.floor(parseFloat(item.totalSupply) / 1000) || 0; // Mengonversi ke meter kubik dan membulatkan ke bawah
        }
      });
  
      setWaterData(water);
    } catch (error) {
      console.warn("Gagal mengambil data water usage chart:", error?.message || error);
      setWaterData(Array(expectedLength).fill(0));
    }
  };

  useEffect(() => {
    fetchWater();
    const interval = setInterval(fetchWater, 3600000); // Setiap 1 jam
    return () => clearInterval(interval);
  }, [selectedRange]);

  const labels = {
    hourly: Array.from({ length: 60 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    daily: Array.from({ length: 24 }, (_, i) => `Hour ${i}`),
    weekly: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    monthly: Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
    yearly: Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`),
  };

  
  const dropdownOptions = [
    { label: "Hourly", value: "hourly" },
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  const [maxY, setMaxY] = useState(100);
  
  useEffect(() => {
    const maxData = Math.max(...WaterData, 0);
    const roundedMax = getRoundedMax(maxData);
    setMaxY(roundedMax);
  }, [WaterData]);

  const getRoundedMax = (maxData) => {
    if (maxData === 0) return 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxData)));
    const roundTo = magnitude / 2;
    return Math.ceil(maxData / roundTo) * roundTo;
  };

  const getStepSize = (maxY) => {
    return maxY / 5;
  };

  const data = {
    labels: labels[selectedRange],
    datasets: [
      {
        fill: true,
        data: WaterData,
        borderColor: `#0E43FB`,
        backgroundColor: `rgba(14, 67, 251, 0.3)`,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#0E43FB",
        pointHoverBackgroundColor: `#0E43FB`,
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
          label: (context) => {
            const value = Math.floor(context.raw); // Membulatkan nilai
            return `${value}mÂ³ Water`; // Menampilkan dalam meter kubik
          },
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
        max: maxY,
        ticks: {
          stepSize: getStepSize(maxY),
          callback: (value) => `${Math.floor(value)}mÂ³`, // Menampilkan dalam meter kubik
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
      <div className="bg-white shadow-sm shadow-sky-100/70 rounded-xl p-6 pr-2 border-sky-100 border border-r-1" style={{ width: width, height: "415px" }}>
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

        <div className="h-[290px]">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default WaterUsageChart;

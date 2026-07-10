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
        url = "https://api.hydrosense.awankesehatan.com/data/panelC/statistics?filter=hourly&parameter=level1";
        expectedLength = 60;
        break;
      case "daily":
        url = "https://api.hydrosense.awankesehatan.com/data/panelC/statistics?filter=daily&parameter=level1";
        expectedLength = 24;
        break;
      case "weekly":
        url = "https://api.hydrosense.awankesehatan.com/data/panelC/statistics?filter=weekly&parameter=level1";
        expectedLength = 7;
        break;
      case "monthly":
        url = "https://api.hydrosense.awankesehatan.com/data/panelC/statistics?filter=monthly&parameter=level1";
        expectedLength = 31;
        break;
      case "yearly":
        url = "https://api.hydrosense.awankesehatan.com/data/panelC/statistics?filter=yearly&parameter=level1";
        expectedLength = 12;
        break;
      default:
        return;
    }
  
    try {
      const response = await axios.get(url);
      const raw = response.data;
      const data = Array.isArray(raw.data) ? raw.data : [];
      let water = Array(expectedLength).fill(0);
  
      data.forEach((item) => {
        let index = 0;
  
        // Determine the time range and map the timestamp accordingly
        const timestamp = new Date(item.timestamp);
        const hour = timestamp.getHours();
        const minute = timestamp.getMinutes();
        const day = timestamp.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const date = timestamp.getDate(); // day of the month (1-31)
        const month = timestamp.getMonth(); // 0 = January, 1 = February, ..., 11 = December
  
        if (selectedRange === "hourly") {
          index = minute; // For hourly data, use minute as index
        } else if (selectedRange === "daily") {
          index = hour; // For daily data, use hour as index
        } else if (selectedRange === "weekly") {
          index = day; // For weekly data, use day of the week as index
        } else if (selectedRange === "monthly") {
          index = date - 1; // For monthly data, use the day of the month as index
        } else if (selectedRange === "yearly") {
          index = month; // For yearly data, use the month as index
        }
  
        if (index >= 0 && index < expectedLength) {
          // Convert volume to cubic meters and round down
          water[index] = Math.floor(parseFloat(item.volume) / 1000) || 0;
        }
      });
  
      setWaterData(water);
    } catch (error) {
      console.error("Error fetching water data: ", error);
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

  const dropdownOptions = [
    { label: "Hourly", value: "hourly" },
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

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
        pointBorderColor: "#fff",
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
        backgroundColor: "#1A2142",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.raw}m³`,
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
        max: 500,
        ticks: {
          stepSize: 100,
          callback: (value) => `${value}m³`,
          color: "#ffffff80",
          font: { size: 12 },
          padding: 8,
        },
        grid: { color: "#ffffff10", drawBorder: false },
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
        className="bg-[#111736] rounded-xl p-6 pr-2 border-slate-700 border border-r-1"
        style={{ width: width, height: "365px" }}
      >
        <div className="flex justify-between items-center mb-8">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-white text-[18px] font-semibold">Water Level</h1>
              <h2 className="text-white/80 text-[12px]">Leaked Water</h2>
            </div>
          </div>

          {/* Dropdown */}
          <Dropdown
            value={selectedRange}
            options={dropdownOptions}
            onChange={(e) => setSelectedRange(e.value)}
            placeholder="This Week"
            className="flex items-center text-center gap-2 bg-[#1A2142] px-4 py-2 rounded-lg text-white/80 text-sm"
            panelStyle={{
              backgroundColor: "#1A2142",
              color: "white",
              textAlign: "center",
            }}
            style={{ color: "white" }}
          />
        </div>

        {/* Chart */}
        <div className="h-[250px]">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default WaterUsageChart;

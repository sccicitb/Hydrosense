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
  const [WaterDataC, setWaterDataC] = useState([]);
  const [WaterDataE, setWaterDataE] = useState([]);
  const [totalSupplier, setTotalSupplier] = useState(0);
  const [totalRequest, setTotalRequest] = useState(0);

  const fetchWater = async () => {
    let expectedLength = 0;
    let filterParam = selectedRange;
  
    switch (filterParam) {
      case "hourly":
        expectedLength = 60;
        break;
      case "daily":
        expectedLength = 24;
        break;
      case "weekly":
        expectedLength = 7;
        break;
      case "monthly":
        expectedLength = 31;
        break;
      case "yearly":
        expectedLength = 12;
        break;
      default:
        return;
    }
  
    const urls = {
      panelC: `https://api.hydrosense.awankesehatan.com/data/supply/panelC?filter=${filterParam}`,
      panelD: `https://api.hydrosense.awankesehatan.com/data/supply/panelD?filter=${filterParam}`,
      panelE: `https://api.hydrosense.awankesehatan.com/data/supply/panelE?filter=${filterParam}`,
    };
  
    const dayMap = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayNameMap = {
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sunday: "Sun",
    };
    const monthMap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    try {
      const [resC, resD, resE] = await Promise.all([
        axios.get(urls.panelC, { validateStatus: () => true }),
        axios.get(urls.panelD, { validateStatus: () => true }),
        axios.get(urls.panelE, { validateStatus: () => true }),
      ]);
  
      const mergeSupplyData = (dataC, dataD) => {
        let water = Array(expectedLength).fill(0);
  
        const process = (data) => {
          data.forEach((item) => {
            let index = -1;
            if (filterParam === "hourly" && item.minute !== undefined) {
              index = parseInt(item.minute);
            } else if (filterParam === "daily" && item.hour !== undefined) {
              index = parseInt(item.hour);
            } else if (filterParam === "weekly" && item.dayName !== undefined) {
              const mapped = dayNameMap[item.dayName] || item.dayName;
              index = dayMap.indexOf(mapped);
            } else if (filterParam === "monthly" && item.dayOfMonth !== undefined) {
              index = parseInt(item.dayOfMonth) - 1;
            } else if (filterParam === "yearly" && item.monthName !== undefined) {
              index = monthMap.indexOf(item.monthName);
            }
  
            if (index >= 0 && index < expectedLength) {
              water[index] += parseFloat(item.totalSupply) || 0;
            }
          });
        };
  
        process(dataC);
        process(dataD);
  
        // Konversi ke mÂ³
        return water.map((val) => Math.floor(val / 1000));
      };
  
      const processRequestData = (data) => {
        let water = Array(expectedLength).fill(0);
  
        data.forEach((item) => {
          let index = -1;
          if (filterParam === "hourly" && item.minute !== undefined) {
            index = parseInt(item.minute);
          } else if (filterParam === "daily" && item.hour !== undefined) {
            index = parseInt(item.hour);
          } else if (filterParam === "weekly" && item.dayName !== undefined) {
            const mapped = dayNameMap[item.dayName] || item.dayName;
            index = dayMap.indexOf(mapped);
          } else if (filterParam === "monthly" && item.dayOfMonth !== undefined) {
            index = parseInt(item.dayOfMonth) - 1;
          } else if (filterParam === "yearly" && item.monthName !== undefined) {
            index = monthMap.indexOf(item.monthName);
          }
  
          if (index >= 0 && index < expectedLength) {
            water[index] = Math.floor(parseFloat(item.totalSupply) / 1000) || 0;
          }
        });
  
        return water;
      };
  
      const WaterDataSupplier = mergeSupplyData(resC.data.data || [], resD.data.data || []);
      const WaterDataRequest = processRequestData(resE.data.data || []);
  
      setWaterDataC(WaterDataSupplier);
      setWaterDataE(WaterDataRequest);
      console.log("Ini Supllier:", WaterDataSupplier);
      console.log("Ini Request:", WaterDataRequest);
      setTotalSupplier(WaterDataSupplier.reduce((a, b) => a + b, 0));
      setTotalRequest(WaterDataRequest.reduce((a, b) => a + b, 0));
    } catch (error) {
      console.warn("Gagal mengambil data supplier/request:", error?.message || error);
      setWaterDataC(Array(expectedLength).fill(0));
      setWaterDataE(Array(expectedLength).fill(0));
      setTotalSupplier(0);
      setTotalRequest(0);
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

  const [maxY, setMaxY] = useState(100);

  useEffect(() => {
    const allValues = [...WaterDataC, ...WaterDataE];
    const maxData = Math.max(...allValues, 0);
    const roundedMax = getRoundedMax(maxData);
    setMaxY(roundedMax);
  }, [WaterDataC, WaterDataE]);

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
        label: "Panel C",
        fill: true,
        data: WaterDataC,
        borderColor: `#FF69B4`,
        backgroundColor: `rgba(14, 67, 251, 0)`,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#FF69B4",
        pointHoverBackgroundColor: `#FF69B4`,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: "Panel E",
        fill: true,
        data: WaterDataE,
        borderColor: `#A1EF7A`,
        backgroundColor: `rgba(161, 239, 122, 0.1)`,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "#A1EF7A",
        pointHoverBackgroundColor: `#A1EF7A`,
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
            const value = Math.floor(context.raw);
            return `${value}mÂ³ Water`;
          },
          labelTextColor: (context) => {
            return context.datasetIndex === 0 ? "#FF69B4" : "#A1EF7A";
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
          callback: (value) => `${Math.floor(value)}mÂ³`,
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
        style={{ width: width, height: "415px" }}
      >
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
            value={selectedRange}
            options={dropdownOptions}
            onChange={(e) => setSelectedRange(e.value)}
            className="bg-sky-50 border border-sky-100 px-4 py-2 rounded-lg text-slate-500 text-sm"
            panelStyle={{
              backgroundColor: "#ffffff",
              color: "#0f172a",
              textAlign: "center",
            }}
            style={{ color: "#0f172a" }}
          />
        </div>

        <div className="h-[280px]">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default WaterUsageChart;

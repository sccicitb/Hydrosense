"use client";
import React, { useEffect, useState } from "react";

const WaterUsage = ({ width }) => {
  const [volume, setVolume] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://waterwise-server.urbansolv.co.id/data/panelE1/latest");
        const data = await response.json();
        const level1 = data.level1;
        const calculatedVolume = ((6 * 5 * level1) / 100) * 1000;
        setVolume(Math.round(calculatedVolume)); // dibulatkan ke bilangan bulat
      } catch (error) {
        console.warn("Gagal mengambil data water usage:", error?.message || error);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      className="bg-white shadow-sm shadow-sky-100/70 rounded-2xl p-8 border-sky-100 border flex flex-col justify-between"
      style={{ width: width, height: "415px" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-slate-900 text-xl font-medium">Water Usage in Asrama</h2>
        <div className="flex items-center bg-sky-50 border border-sky-100 rounded-lg px-4 py-2 cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-pink-500 mr-2"></div>
          <select className="bg-sky-50 text-slate-900 border-none outline-none pr-6 appearance-none cursor-pointer">
            <option>Asrama 1</option>
            <option>Asrama 2</option>
            <option>Asrama 3</option>
            <option>Asrama 4</option>
          </select>
        </div>
      </div>

      {/* Middle (Gauge and Label) */}
      <div className="flex justify-center items-center flex-col flex-grow">
        <div className="relative">
          <svg width="300" height="180">
            <path
              d="M 30 150 A 120 120 0 0 1 270 150" 
              fill="none"
              stroke="#dbeafe"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M 30 150 A 120 120 0 0 1 270 150" 
              fill="none"
              stroke="#FF4444"
              strokeWidth="16"
              strokeDasharray="251"
              strokeDashoffset="63"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform mt-10 -translate-x-1/2 translate-y-[-80%] text-center">
            <div className="text-slate-900 text-3xl font-bold">
              {volume !== null ? `${volume}L` : "Loading..."}
            </div>
            <div className="text-slate-500 text-sm">in this day</div>
          </div>
        </div>
        <div className="mt-4">
          <span className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-[#FF4444]">Dangerous Level</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <div className="text-slate-500 text-[12px] mb-2">Target Usage</div>
          <div className="text-slate-900 text-[28px] font-semibold">110L</div>
        </div>
        <button className="text-sky-600 hover:text-sky-700 transition-colors">
          View Report
        </button>
      </div>
    </div>
  );
};

export default WaterUsage;

"use client";
import React, { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.hydrosense.awankesehatan.com";

const WaterUsage = ({ width }) => {
  const [volume, setVolume] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/data/panelE1/latest`);
        const data = await response.json();
        const level1 = data.level1;
        const calculatedVolume = ((6 * 5 * level1) / 100) * 1000;
        setVolume(Math.round(calculatedVolume)); // dibulatkan ke bilangan bulat
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      className="bg-[#0B1437] rounded-2xl p-4 border-slate-700 border flex flex-col justify-between"
      style={{ width: width, height: "249px" }}
    >
      {/* Header */}
      <div className="flex justify-center items-center">
        <h2 className="text-white text-2xl font-medium">Flow Water</h2>
      </div>

      {/* Middle (Gauge and Label) */}
      <div className="flex justify-center items-center flex-col flex-grow">
        <div className="relative">
          <svg width="225" height="135">
            <path
              d="M 22.5 112.5 A 90 90 0 0 1 202.5 112.5"
              fill="none"
              stroke="#2A3558"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 22.5 112.5 A 90 90 0 0 1 202.5 112.5"
              fill="none"
              stroke="#FF4444"
              strokeWidth="12"
              strokeDasharray="188"
              strokeDashoffset="47"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform mt-10 -translate-x-1/2 translate-y-[-80%] text-center">
            <div className="text-white text-2xl font-bold">
              {volume !== null ? `${volume}L` : "Loading..."}
            </div>
            <div className="text-gray-400 text-sm">in this day</div>
          </div>
        </div>
        <div className="mt-2">
          <span className="bg-[#3A2337] text-[#FF4444] px-4 py-2 text-sm rounded-lg">Dangerous Level</span>
        </div>
      </div>
    </div>
  );
};

export default WaterUsage;

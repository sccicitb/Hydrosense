"use client";

import React from "react";

const TemperatureIndicator = ({ temperature = 29, percentage = 16 }) => {
  return (
    <div className="bg-[#0B1437] rounded-xl p-4 w-[295px] h-[134px] border-slate-700 border flex items-center gap-6">
      {/* Thermometer Icon Circle */}
      <div className="bg-[#0F2341] rounded-full w-16 h-16 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="2">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" className="text-red-500" />
        </svg>
      </div>

      <div className="flex-1">
        <div className="text-gray-400 text-sm mb-3">Temperature of Water</div>
        <div className="flex items-center gap-3">
          <span className="text-white text-2xl font-semibold">{temperature}°</span>
          <div className="bg-[#2D1619] px-2 py-1 rounded flex items-center gap-1">
            <span className="text-red-500 font-medium">{percentage}%</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-red-500" strokeWidth="2">
              <path d="M13 7l5 5-5 5M6 7l5 5-5 5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureIndicator;

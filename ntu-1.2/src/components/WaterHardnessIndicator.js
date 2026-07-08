"use client";

import React from "react";

const WaterHardnessIndicator = ({ percentage = 90, status = "Suitable for use" }) => {
  return (
    <div className="bg-[#0B1739] rounded-lg p-4 w-[295px] h-[134px] border-slate-700 border flex items-center gap-4">
      {/* Water Drop Icon Circle */}
      <div className="bg-[#0F2341] rounded-full w-16 h-16 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-400">
          <path d="M12 20a6 6 0 0 1-6-6c0-4 6-10.8 6-10.8S18 10 18 14a6 6 0 0 1-6 6Z" />
        </svg>
      </div>

      <div className="flex-1">
        <div className="text-gray-400 text-sm mb-3">Hardness of Water</div>
        <div className="flex items-center justify-between">
          <span className="text-white text-2xl font-semibold">{percentage}%</span>
          <div className="bg-[#1B4D4A] text-[#4AE8AB] px-3 py-1 rounded text-xs">{status}</div>
        </div>
      </div>
    </div>
  );
};

export default WaterHardnessIndicator;

"use client";

import React from "react";

const QualityLevel = ({ percentage = 90, status = "Suitable for use" }) => {
  return (
    <div className="bg-[#0B1739] rounded-lg p-4 w-[295px] h-[134px] border-slate-700 border">
      <div className="flex justify-between items-center ">
        <span className="text-white/60 text-xs">Quality Level</span>
        <span className="bg-[#1B4D4A] text-[#4AE8AB] px-2 mr-4 py-1 rounded-md text-xs">{status}</span>
      </div>

      <div className="text-white text-xl font-bold ">{percentage}%</div>

      <div className="flex items-center gap-2">
        <div className="text-blue-500">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 20a6 6 0 0 1-6-6c0-4 6-10.8 6-10.8S18 10 18 14a6 6 0 0 1-6 6Z" />
          </svg>
        </div>

        <div className="flex-1 h-2 bg-gray-700 rounded-full">
          <div className="relative w-full h-full">
            <div className="absolute h-full w-1/3 bg-[#4AE8AB] rounded-l-full" />
            <div className="absolute left-1/3 h-full w-1/3 bg-gray-400" />
            <div className="absolute left-2/3 h-full w-1/3 bg-gray-400 rounded-r-full" />

            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-white" />
            <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-white" />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-1 text-xs">
        <span className="text-[#4AE8AB]">Normal</span>
        <span className="text-orange-400">Warning</span>
        <span className="text-red-500">Danger</span>
      </div>
    </div>
  );
};

export default QualityLevel;

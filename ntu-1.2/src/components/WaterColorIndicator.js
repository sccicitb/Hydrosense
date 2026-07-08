'use client';

import React from 'react';

const WaterColorIndicator = ({ cloudiness = 19, trend = 46, status = "Cloudy" }) => {
  return (
    <div className="bg-[#0B1739] rounded-lg p-4 w-[295px] h-[134px] border-slate-700 border flex items-center gap-4">
      {/* Test Tube Icon Circle */}
      <div className="bg-[#0F2341] rounded-full w-16 h-16 flex items-center justify-center">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          className="w-8 h-8 text-emerald-400"
          strokeWidth="2"
        >
          <path d="M10 2v8L4 20h16l-6-10V2" />
          <path d="M7 16h10" />
        </svg>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-400 text-sm">Color of Water</span>
          <div className="bg-[#1B4D4A] px-2 py-1 rounded flex items-center gap-1">
            <span className="text-emerald-400 font-medium">{trend}%</span>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-4 h-4 text-emerald-400 rotate-180"
              strokeWidth="2"
            >
              <path d="M13 7l5 5-5 5M6 7l5 5-5 5" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white text-2xl font-semibold">
            {cloudiness}%
          </span>
          <span className="text-white text-2xl">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WaterColorIndicator;
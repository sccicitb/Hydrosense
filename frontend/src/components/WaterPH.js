'use client';

import React from 'react';

const WaterPH = ({ temperature = 8, percentage = 16 }) => {
  return (
    <div className="bg-[#0B1437] rounded-xl p-4 w-[295px] h-[134px] border-slate-700 border flex items-center gap-6">
      {/* Thermometer Icon Circle */}
      <div className="bg-[#0F2341] rounded-full w-16 h-16 flex items-center justify-center">
      <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-8 h-8 text-blue-400"
        >
          <path d="M12 20a6 6 0 0 1-6-6c0-4 6-10.8 6-10.8S18 10 18 14a6 6 0 0 1-6 6Z" />
        </svg>
      </div>

      <div className="flex-1">
        <div className="text-gray-400 text-md mb-1">Water pH</div>
        <div className="flex items-center gap-3">
          <span className="text-white text-4xl font-semibold">
            {temperature}
          </span>
          <div className="bg-[#1B4D4A] text-[#4AE8AB] px-2 py-1 rounded flex items-center gap-1">
            <span className="bg-[#1B4D4A] text-[#4AE8AB] font-medium">{percentage}%</span>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-4 h-4 bg-[#1B4D4A] text-[#4AE8AB]"
              strokeWidth="2"
            >
              <path d="M13 7l5 5-5 5M6 7l5 5-5 5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterPH;
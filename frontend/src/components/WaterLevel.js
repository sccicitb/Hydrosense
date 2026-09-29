"use client";
import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const WaterLevel = () => {
  const percentage = 66.67; // (1200/1800) * 100

  return (
    <div className="bg-[#0B1437] rounded-xl p-4 w-[295px] h-[134px] border-slate-700 border">
      <h2 className="text-white/60 text-sm mb-1">Water Level</h2>

      <div className="flex items-center justify-between">
        {/* Circular Progress */}
        <div className="relative w-16 h-16 ml-4">
          <CircularProgressbar
            value={percentage}
            strokeWidth={12}
            styles={buildStyles({
              rotation: 0.75,
              strokeLinecap: "round",
              pathColor: "#0E43FB",
              trailColor: "rgba(14, 67, 251, 0.1)",
              pathTransitionDuration: 0.5,
            })}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-[10px] font-medium">1200L</span>
            <span className="text-white/40 text-[10px]">/1800L</span>
          </div>
        </div>

        {/* Tank Indicators */}
        <div className="flex items-end gap-4 mr-4 ">
          {/* Tank A */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-16 bg-[#0E43FB]/10 rounded-lg overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-[#0E43FB] transition-all duration-500" style={{ height: "40%" }} />
            </div>
            <span className="text-white/60 text-xs">Tank A</span>
          </div>

          {/* Tank B */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-16 bg-[#0E43FB]/10 rounded-lg overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-[#0E43FB] transition-all duration-500" style={{ height: "70%" }} />
            </div>
            <span className="text-white/60 text-xs">Tank B</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterLevel;

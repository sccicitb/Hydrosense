"use client";
import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Bell } from "lucide-react";

const WaterLevelChart = ({ width }) => {
  const percentage = 66.67; // (1200/1800) * 100

  return (
    <div className="flex">
      <div
        className="bg-[#111736] rounded-xl p-6 pr-2 border-slate-700 border border-r-1"
        style={{ width: width, height: "250px" }}
      >
        {/* Alert Banner */}
        <div className="flex justify-between items-center mb-6">
          {/* Title & Status */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-white text-[18px] font-semibold">Water Level</h1>
            </div>
          </div>
        </div>
        {/* Circular Progress */}
        <div className="flex flex-row justify-center items-center gap-x-10 mb-12">
          <div className="relative w-36 h-36 mb-3">
            <CircularProgressbar
              value={percentage}
              strokeWidth={12}
              styles={buildStyles({
                rotation: 0.75,
                strokeLinecap: "round",
                pathColor: "#4169E1",
                trailColor: "#1A2142",
                pathTransitionDuration: 0.5,
              })}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-xl font-semibold">1200L</span>
              <span className="text-white/60 text-sm">/1800L</span>
            </div>
          </div>
    
          {/* Tank Level Indicators */}
          <div className="flex justify-between gap-8 px-4">
            {/* Tank A */}
            <div className="flex-1">
              <div className="relative h-[100px] w-[85px] bg-[#1A2142] rounded-b-3xl overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 bg-[#4169E1] transition-all duration-500 ease-in-out" style={{ height: "20%" }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#4169E1]/50 to-[#4169E1]" />
                </div>
                {/* Tank Level Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">200L</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="text-white/60 text-sm">Tank A</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterLevelChart;

"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import WaterUsage from "./WaterUsage";
import LeakedChart from "./Water_LevelA";
import TrianglePipeChart from "./TrianglePipeChart";

export default function Statistic({ selectedType }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedType) {
      setIsOpen(true); // buka panel saat ada yang dipilih
    }
  }, [selectedType]);

  const toggleStatistic = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* STATIC CHART Button */}
      <div
        className={`fixed top-1/2 shadow-lg transform -translate-y-1/2 bg-[#081028] text-white text-sm font-bold px-2 py-4 rounded-l-lg cursor-pointer z-40 transition-all duration-300 ${
          isOpen ? "right-[400px]" : "right-0"
        }`}
        onClick={toggleStatistic}
        style={{ writingMode: "vertical-rl", textOrientation: "upright" }}
      >
        STATISTIC CHART
      </div>

      {/* Statistik Container */}
      {isOpen && (
        <div className="bg-[#081028CC]/80 flex flex-col w-[400px] items-center overflow-auto h-full fixed right-0 top-0 z-30">
          <div className=" h-[239px] mb-4 ml-1 mt-2">
            <WaterUsage width={"380px"} />
          </div>
          <div className=" h-[239px] mb-6 ml-1 mt-1">
            <LeakedChart width={"380px"} />
          </div>
          <div className="h-[239px] mb-6 ml-1 mt-28">
            <TrianglePipeChart width={"380px"} />
          </div>
        </div>
      )}
    </>
  );
}

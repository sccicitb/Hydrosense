"use client";
import React from "react";

const ParameterAnalytic = () => {
  const parameters = [
    { name: "Odor content", unit: "-", result: "Tidak Berbau" },
    { name: "Electrical Conductivity", unit: "µS/cm", result: "191" },
    { name: "Fluoride", unit: "mg/L", result: "<0,100" },
    { name: "E. Coli", unit: "MPN/100 mL", result: ">23" },
    { name: "Total Coliform", unit: "MPN/100 mL", result: "3,6" },
    { name: "Water pH", unit: "-", result: "8,20" },
    { name: "Kesadahan", unit: "mg/L", result: "72,9" },
    { name: "Kandungan Besi", unit: "mg/L", result: "0,201" },
    { name: "Nitrit", unit: "mg/L", result: "0,022" },
    { name: "Nitrat", unit: "mg/L", result: "0,339" },
  ];

  return (
    <div className="bg-[#0B1437] rounded-xl p-4 w-[295px] h-fit border border-slate-700">
      <div className="grid grid-cols-3 text-xs text-white/60 mb-3">
        <div>Parameter Analytic</div>
        <div className="text-center">Unit</div>
        <div className="text-right">Analytic Result</div>
      </div>

      <div className="space-y-2.5 text-xs">
        {parameters.map((param, index) => (
          <div key={index} className="grid grid-cols-3 text-white items-center py-1 border-b border-slate-700/20">
            <div className="text-white/80">{param.name}</div>
            <div className="text-center text-white/60">{param.unit}</div>
            <div className="text-right text-white/80">{param.result}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParameterAnalytic;

"use client";
import React from "react";

import Turbidity from "./Turbidity";
import PhChart from "./PhChart";
import Tds from "./Tds";

const Dashboard = () => {
  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#F3FAFF] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-row items-center justify-between pb-5">
        <h1 className="text-2xl font-bold text-slate-950 lg:text-3xl">Cena Water Monitoring</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Turbidity width="100%" />
        <PhChart width="100%" />
        <Tds width="100%" />
      </div>
    </div>
  );
};

export default Dashboard;

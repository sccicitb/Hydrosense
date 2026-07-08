"use client";
import React from "react";

import LeakedChart1 from "./LeakedChart_Panel-A";
import LeakedChart2 from "./LeakedChart_Panel-B_Flow1";
import LeakedChart3 from "./LeakedChart_Panel-B_Flow2";
import LeakedChart4 from "./LeakedChart_Panel-E";

import WaterLevel1 from "./Water_LevelA";
import WaterLevel2 from "./Water_LevelB";
import WaterLevel3 from "./Water_LevelC";

import SupplierChart from "./SupplierChart";
import WaterUsage from "./WaterUsage";
import WaterUsageChart from "./WaterUsageChart";
import Turbidity from "./Turbidity";
import PhChart from "./PhChart";
import Tds from "./Tds";
import ColorWtp from "./ColorWtp";

const Dashboard = () => {
  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#F3FAFF] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-row items-center justify-between pb-5">
        <h1 className="text-2xl font-bold text-slate-950 lg:text-3xl">Cena Water Monitoring</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LeakedChart1 width="100%" />
        <LeakedChart2 width="100%" />
        <LeakedChart3 width="100%" />
        <LeakedChart4 width="100%" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <WaterLevel1 width="100%" />
        <WaterLevel2 width="100%" />
        <WaterLevel3 width="100%" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <SupplierChart width="100%" />
        <WaterUsage width="100%" />
        <WaterUsageChart width="100%" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Turbidity width="100%" />
        <PhChart width="100%" />
        <Tds width="100%" />
        <ColorWtp width="100%" />
      </div>
    </div>
  );
};

export default Dashboard;

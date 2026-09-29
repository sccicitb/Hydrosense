"use client";
import Map from "@/components/map";
import { useSidebar } from "@/components/ui/sidebar";
import React from "react";

const Dashboard = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="h-full w-full bg-[#F3FAFF]">
      <Map isCollapsed={isCollapsed} />
    </div>
  );
};

export default Dashboard;

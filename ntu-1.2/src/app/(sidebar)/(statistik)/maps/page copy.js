"use client";
import Map from "@/components/map";
import { useSidebar } from "@/components/ui/sidebar";

const Dashboard = (props) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="h-full w-full bg-[#F3FAFF]">
      <Map isCollapsed={isCollapsed} onTypeChange={props.onTypeChange} />
    </div>
  );
};

export default Dashboard;

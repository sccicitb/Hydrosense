"use client";

import { useSidebar } from "@/components/ui/sidebar";

const Summary = () => {
  const { isCollapsed } = useSidebar();
  const widthClass = isCollapsed ? "w-[calc(100vw-3rem)]" : "w-[calc(100vw-16rem)]";
  const padding = isCollapsed ? "p-8 pr-9" : "p-8 pr-16";
  return (
    <div className={`bg-[#081028] ${widthClass} ${padding} h-full`}>
      <h1>Summary Page</h1>
    </div>
  );
};

export default Summary;

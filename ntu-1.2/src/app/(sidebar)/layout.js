"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cloneElement, useState } from "react";
import { SelectedTypeProvider } from "@/context/SelectedTypeContext";
import { SensorHealthProvider } from "@/context/SensorHealthContext";

export default function Layout({ children }) {
  return (
    <SensorHealthProvider>
      <SelectedTypeProvider>
        <SidebarProvider>
          <div className="flex flex-row w-screen h-screen overflow-hidden">
            <AppSidebar />
            <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
          </div>
        </SidebarProvider>
      </SelectedTypeProvider>
    </SensorHealthProvider>
  );
}

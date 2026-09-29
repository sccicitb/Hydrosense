"use client";
import { ReceiptText, LayoutDashboard, Map, LogOut, ChartColumnDecreasing } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Statistics",
    url: "/statistics",
    icon: ChartColumnDecreasing,
  },
  {
    title: "Maps",
    url: "/maps",
    icon: Map,
  },
  {
    title: "People Reports",
    url: "/titik-maps",
    icon: Map,
  },
  // {
  //   title: "3D Layer",
  //   url: "/3d-layer",
  //   icon: Layers,
  // },
  // {
  //   title: "Profile",
  //   url: "/profile",
  //   icon: UserRound,
  // },
  {
    title: "Reports",
    url: "/reports",
    icon: ReceiptText,
  },
];

const header = {
  title1: "HydroSense",
  logo: "/icon-hydrosense-transparent.png",
  logo2: "/icon-hydrosense-transparent.png",
  alt: "HydroSense logo",
};

const footer = {
  title: "Logout",
  url: "/login",
  icon: LogOut,
};

export function AppSidebar() {
  const [logoSrc, setLogoSrc] = React.useState(header.logo);
  const { toggleSidebar, sidebar2, isCollapsed } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        Cookies.remove("token");
        router.push("/login");
      }
    });
  };

  return (
    <Sidebar collapsible="icon" className="bg-[#6699CC]">
      <SidebarHeader>
        <div className="flex flex-col items-center">
          <SidebarMenuButton
            className="h-20 gap-2 px-2 group-data-[collapsible=icon]:h-16 group-data-[collapsible=icon]:px-2"
            onMouseEnter={() => setLogoSrc(header.logo2)}
            onMouseLeave={() => setLogoSrc(header.logo)}
            onClick={() => {
              toggleSidebar();
              sidebar2();
            }}
          >
            <Image src={logoSrc} alt={header.alt} width={48} height={48} className="h-10 w-10 shrink-0 object-contain group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9" />
            <span className="min-w-0 text-[1.08rem] font-bold leading-none tracking-tight group-data-[collapsible=icon]:hidden">
              {header.title1}
            </span>
          </SidebarMenuButton>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu align="center">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11 px-3 text-base">
                    <a href={item.url}>
                      <item.icon size={isCollapsed ? 20 : 22} />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton onClick={handleLogout} className="h-11 px-3 text-base">
          <footer.icon />
          <span>{footer.title}</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

"use client";

import React from "react";
import { useSelectedType } from "@/context/SelectedTypeContext";
import Statistic from "@/components/statistic";
import Statistic2 from "@/components/statistic2";

export default function StatisticRenderer() {
  const { selectedType } = useSelectedType();

  if (selectedType === "pipeline") {
    return <Statistic />;
  }

  if (selectedType === "polygon") {
    return <Statistic2 />;
  }

  return ;
}


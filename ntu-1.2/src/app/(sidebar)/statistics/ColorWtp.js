"use client";
import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const ColorWtp = ({ width }) => {
  const labels = [
    "Situ 1", 
    "Setelah Unit Pre-treatment", 
    "Setelah Unit Mikrohidro", 
    "Setelah Rumah Pompa WTP", 
    "Setelah GWK Induk", 
    "Asrama TB4"
  ];

  const data = {
    labels,
    datasets: [
      {
        data: [19, 13, 20, 14, 14, 19, 12, 22, 19, 12],
        backgroundColor: "#605CFF",
        borderRadius: 2,
        borderSkipped: false,
        barThickness: 32,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "ColorWTP ITB Jatinangor",
        color: "#0f172a",
        font: {
          size: 26,
          weight: "500",
          family: "'Inter', sans-serif",
        },
        padding: {
          top: 10,
          bottom: 40,
        },
        align: "start",
      },
      tooltip: {
        backgroundColor: "#ffffff",
        padding: 12,
        displayColors: false,
        titleColor: "#0f172a",
        bodyColor: "#334155",
        callbacks: {
          label: function (context) {
            return `${context.raw} NTU`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#475569",
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          maxRotation: 45,
          minRotation: 45,
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 25,
        grid: {
          color: "#dbeafe",
          drawBorder: false,
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 8,
          stepSize: 10,
        },
        border: {
          display: false,
        },
      },
    },
    barThickness: 24,
    layout: {
      padding: {
        right: 20,
      },
    },
  };

  return (
    <div className="bg-white shadow-sm shadow-sky-100/70 rounded-xl p-6 h-[615px] border-sky-100 border" style={{ width: width, height: "505px" }}>
      <div className="h-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default ColorWtp;

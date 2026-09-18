"use client";
import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.hydrosense.awankesehatan.com";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const TurbidityChart = ({ width }) => {
  const [data, setData] = useState({
    labels: [
      "Situ 1", 
      "Setelah Unit Pre-treatment", 
      "Setelah Unit Mikrohidro", 
      "Setelah Rumah Pompa WTP", 
      "Setelah GWK Induk", 
      "Asrama TB4"
    ],
    datasets: [
      {
        data: [],
        backgroundColor: "#605CFF",
        borderRadius: 2,
        borderSkipped: false,
        barThickness: 32,
        maxBarThickness: 32,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mengambil data dari panel A (Situ 1)
        const responseA = await fetch(`${API_BASE_URL}/data/panelA1/latest`);
        const dataA = await responseA.json();
        
        // Mengambil data dari panel B (Setelah Unit Pre-treatment, Rumah Pompa WTP)
        const responseB = await fetch(`${API_BASE_URL}/data/panelB1/latest`);
        const dataB = await responseB.json();

        // Mengambil data dari panel E (GWK Induk, Asrama TB4)
        const responseE = await fetch(`${API_BASE_URL}/data/panelE1/latest`);
        const dataE = await responseE.json();

        // Fungsi untuk membatasi angka hingga 2 digit di belakang koma
        const formatTurbidity = (value) => parseFloat(value).toFixed(2);

        // Menyusun data ph untuk grafik dengan 2 angka di belakang koma
        setData(prevData => ({
          ...prevData,
          datasets: [
            {
              ...prevData.datasets[0],
              data: [
                formatTurbidity(dataA.ph),    // Situ 1
                formatTurbidity(dataB.ph),    // Setelah Unit Pre-treatment
                formatTurbidity(dataB.ph),    // Setelah Unit Mikrohidro (menggunakan data panel B yang sama)
                formatTurbidity(dataB.ph),    // Setelah Rumah Pompa WTP
                formatTurbidity(dataE.ph),    // Setelah GWK Induk
                formatTurbidity(dataE.ph),    // Asrama TB4
              ],
            },
          ],
        }));
      } catch (error) {
        console.warn("Gagal mengambil data pH:", error?.message || error);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "pH WTP ITB Jatinangor",
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
        max: 50,
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

export default TurbidityChart;

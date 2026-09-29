'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RadarChart = ({ width }) => {
  const chartRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const rawData = [60, 40, 20];
  const maxScale = 60;

  const getColor = (value) => {
    if (value <= 20) return 'rgba(0, 255, 0, 1)';     // Hijau
    if (value <= 40) return 'rgba(255, 255, 0, 1)';   // Kuning
    return 'rgba(255, 0, 0, 1)';                      // Merah
  };

  const hexToRgb = (hex) => {
    const [r, g, b] = hex.match(/\d+/g).map(Number);
    return { r, g, b };
  };

  const rgbToRgbaString = ({ r, g, b }, alpha = 1) => {
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const lerp = (a, b, t) => a + (b - a) * t;

  const interpolateColor = (colorA, colorB, t) => {
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);
    return rgbToRgbaString({
      r: Math.round(lerp(rgbA.r, rgbB.r, t)),
      g: Math.round(lerp(rgbA.g, rgbB.g, t)),
      b: Math.round(lerp(rgbA.b, rgbB.b, t))
    });
  };

  const gradientFill = ({ chart }) => {
    const { ctx: canvasCtx, chartArea } = chart || {};
    if (!canvasCtx || !chartArea) return null;

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    // Ubah sudut awal jadi -90 derajat (mulai dari atas)
    const gradient = canvasCtx.createConicGradient(-Math.PI / 2, centerX, centerY);
    const n = rawData.length;
    const steps = 40;

    for (let i = 0; i < n; i++) {
        const startColor = getColor(rawData[i]);
        const endColor = getColor(rawData[(i + 1) % n]);
        const startAngle = i / n;
        const endAngle = (i + 1) / n;

        for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const position = startAngle + (endAngle - startAngle) * t;
        const color = interpolateColor(startColor, endColor, t);
        gradient.addColorStop(position, color);
        }
    }

    return gradient;
    };

  // Tunggu chartArea tersedia, baru update state
  useEffect(() => {
    const timer = setTimeout(() => {
      const chart = chartRef.current?.chart;
      if (chart?.chartArea) {
        setIsReady(true);
      }
    }, 300); // tunggu 300ms agar chartArea terbentuk

    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(() => {

    return {
      labels: ['Total Dissolved Solid', 'PH Water', 'Turbidity'],
      datasets: [
        {
          label: 'Sensor Data',
          data: rawData,
          backgroundColor: gradientFill,
          borderColor: 'rgba(255,255,255,0.1)',
          pointBackgroundColor: rawData.map(getColor),
          pointBorderColor: 'black',
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  }, [isReady]);

  const options = {
    responsive: true,
    onResize: () => {
        const chart = chartRef.current?.chart;
        if (chart?.chartArea) {
        setIsReady(true); // setelah resize, gradient akan dibuat
        }
    },
    scales: {
      r: {
        angleLines: { color: 'white' },
        grid: { color: 'gray' },
        pointLabels: {
          color: 'white',
          font: { size: 14 },
        },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: maxScale,
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="flex">
        <div
            className="bg-[#111736] rounded-xl p-4 pr-2 mb-4 border-slate-700 border"
            style={{ width: width, height: "375px" }}
        >
            {/* Chart di atas */}
            <div className="flex justify-center mb-4">
                <div style={{ width: 350, height: 350 }}>
                    <Radar ref={chartRef} data={data} options={options} />
                </div>
            </div>

            {/* Text label di bawah secara horizontal */}
            <div className="flex flex-row justify-center gap-x-16 items-center mt-[-70px]">
            {/* Turbidity */}
            <div className="flex flex-col items-center">
                <h1 className="text-white text-[16px] font-semibold">Turbidity</h1>
                <h2 className="text-white/80 text-[12px]">0.14 PPM</h2>
            </div>
            
            {/* PH Water */}
            <div className="flex flex-col items-center">
                <h1 className="text-white text-[16px] font-semibold">PH Water</h1>
                <h2 className="text-white/80 text-[12px]">0.14 PPM</h2>
            </div>

            {/* TDS */}
            <div className="flex flex-col items-center">
                <h1 className="text-white text-[16px] font-semibold">TDS</h1>
                <h2 className="text-white/80 text-[12px]">0.14 PPM</h2>
            </div>
            </div>
        </div>
    </div>
  );
};

export default RadarChart;

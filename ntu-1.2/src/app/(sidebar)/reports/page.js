"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { useState } from "react";

const Report = () => {
  const { isCollapsed } = useSidebar();
  const widthClass = isCollapsed ? "w-[calc(100vw-3rem)]" : "w-[calc(100vw-16rem)]";
  const padding = isCollapsed ? "p-8 pr-9" : "p-8 pr-16";

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isCollapsed ? 5 : 5;

  const data = {
    health: {
      status: "ok",
      time: "2025-08-14T10:13:13",
    },
    analysis: {
      anomaly_count: 220619,
      total_kerugian_all: 6533.895,
      daily_loss_all: [
        {
          panelId: "panelE",
          hari: "2025-06-26",
          kebocoran_harian: 225.1632,
          biaya_air_terbuang: 788.0712,
          total_kerugian_harian: 562.908,
        },
        {
          panelId: "panelE",
          hari: "2025-06-29",
          kebocoran_harian: 50,
          biaya_air_terbuang: 175,
          total_kerugian_harian: 125,
        },
        {
          panelId: "panelE",
          hari: "2025-06-30",
          kebocoran_harian: 345.996,
          biaya_air_terbuang: 1210.986,
          total_kerugian_harian: 864.99,
        },
        {
          panelId: "panelE",
          hari: "2025-07-01",
          kebocoran_harian: 195.9968,
          biaya_air_terbuang: 685.9888,
          total_kerugian_harian: 489.992,
        },
        {
          panelId: "panelE",
          hari: "2025-07-02",
          kebocoran_harian: 37.5,
          biaya_air_terbuang: 131.25,
          total_kerugian_harian: 93.75,
        },
        {
          panelId: "panelE",
          hari: "2025-07-03",
          kebocoran_harian: 266.8296,
          biaya_air_terbuang: 933.9036,
          total_kerugian_harian: 667.074,
        },
        {
          panelId: "panelE",
          hari: "2025-07-04",
          kebocoran_harian: 183.496,
          biaya_air_terbuang: 642.236,
          total_kerugian_harian: 458.74,
        },
        {
          panelId: "panelE",
          hari: "2025-07-05",
          kebocoran_harian: 158.3336,
          biaya_air_terbuang: 554.1676,
          total_kerugian_harian: 395.834,
        },
        {
          panelId: "panelE",
          hari: "2025-07-06",
          kebocoran_harian: 291.8296,
          biaya_air_terbuang: 1021.4036,
          total_kerugian_harian: 729.574,
        },
        {
          panelId: "panelE",
          hari: "2025-07-08",
          kebocoran_harian: 4.16639999999995,
          biaya_air_terbuang: 14.5823999999998,
          total_kerugian_harian: 10.4159999999999,
        },
        {
          panelId: "panelE",
          hari: "2025-07-09",
          kebocoran_harian: 641.74792,
          biaya_air_terbuang: 2246.11772,
          total_kerugian_harian: 1604.3698,
        },
        {
          panelId: "panelE",
          hari: "2025-07-10",
          kebocoran_harian: 4.16639999999995,
          biaya_air_terbuang: 14.5823999999998,
          total_kerugian_harian: 10.4159999999999,
        },
        {
          panelId: "panelE",
          hari: "2025-07-11",
          kebocoran_harian: 70.8336000000001,
          biaya_air_terbuang: 247.9176,
          total_kerugian_harian: 177.084,
        },
        {
          panelId: "panelE",
          hari: "2025-07-12",
          kebocoran_harian: 8.33280000000002,
          biaya_air_terbuang: 29.1648000000001,
          total_kerugian_harian: 20.8320000000001,
        },
        {
          panelId: "panelE",
          hari: "2025-07-13",
          kebocoran_harian: 16.6664,
          biaya_air_terbuang: 58.3323999999998,
          total_kerugian_harian: 41.6659999999999,
        },
        {
          panelId: "panelE",
          hari: "2025-07-14",
          kebocoran_harian: 12.5,
          biaya_air_terbuang: 43.75,
          total_kerugian_harian: 31.25,
        },
        {
          panelId: "panelE",
          hari: "2025-07-15",
          kebocoran_harian: 54.1664000000001,
          biaya_air_terbuang: 189.5824,
          total_kerugian_harian: 135.416,
        },
        {
          panelId: "panelE",
          hari: "2025-07-16",
          kebocoran_harian: 37.5,
          biaya_air_terbuang: 131.25,
          total_kerugian_harian: 93.75,
        },
        {
          panelId: "panelE",
          hari: "2025-07-29",
          kebocoran_harian: 8.33328000000006,
          biaya_air_terbuang: 29.1664800000002,
          total_kerugian_harian: 20.8332000000001,
        },
      ],
      last_month: {
        period_start: "2025-07-01",
        period_end: "2025-07-31",
        daily_loss: [
          {
            panelId: "panelE",
            hari: "2025-07-01",
            kebocoran_harian: 195.9968,
            biaya_air_terbuang: 685.9888,
            total_kerugian_harian: 489.992,
          },
          {
            panelId: "panelE",
            hari: "2025-07-02",
            kebocoran_harian: 37.5,
            biaya_air_terbuang: 131.25,
            total_kerugian_harian: 93.75,
          },
          {
            panelId: "panelE",
            hari: "2025-07-03",
            kebocoran_harian: 266.8296,
            biaya_air_terbuang: 933.9036,
            total_kerugian_harian: 667.074,
          },
          {
            panelId: "panelE",
            hari: "2025-07-04",
            kebocoran_harian: 183.496,
            biaya_air_terbuang: 642.236,
            total_kerugian_harian: 458.74,
          },
          {
            panelId: "panelE",
            hari: "2025-07-05",
            kebocoran_harian: 158.3336,
            biaya_air_terbuang: 554.1676,
            total_kerugian_harian: 395.834,
          },
          {
            panelId: "panelE",
            hari: "2025-07-06",
            kebocoran_harian: 291.8296,
            biaya_air_terbuang: 1021.4036,
            total_kerugian_harian: 729.574,
          },
          {
            panelId: "panelE",
            hari: "2025-07-08",
            kebocoran_harian: 4.16639999999995,
            biaya_air_terbuang: 14.5823999999998,
            total_kerugian_harian: 10.4159999999999,
          },
          {
            panelId: "panelE",
            hari: "2025-07-09",
            kebocoran_harian: 641.74792,
            biaya_air_terbuang: 2246.11772,
            total_kerugian_harian: 1604.3698,
          },
          {
            panelId: "panelE",
            hari: "2025-07-10",
            kebocoran_harian: 4.16639999999995,
            biaya_air_terbuang: 14.5823999999998,
            total_kerugian_harian: 10.4159999999999,
          },
          {
            panelId: "panelE",
            hari: "2025-07-11",
            kebocoran_harian: 70.8336000000001,
            biaya_air_terbuang: 247.9176,
            total_kerugian_harian: 177.084,
          },
          {
            panelId: "panelE",
            hari: "2025-07-12",
            kebocoran_harian: 8.33280000000002,
            biaya_air_terbuang: 29.1648000000001,
            total_kerugian_harian: 20.8320000000001,
          },
          {
            panelId: "panelE",
            hari: "2025-07-13",
            kebocoran_harian: 16.6664,
            biaya_air_terbuang: 58.3323999999998,
            total_kerugian_harian: 41.6659999999999,
          },
          {
            panelId: "panelE",
            hari: "2025-07-14",
            kebocoran_harian: 12.5,
            biaya_air_terbuang: 43.75,
            total_kerugian_harian: 31.25,
          },
          {
            panelId: "panelE",
            hari: "2025-07-15",
            kebocoran_harian: 54.1664000000001,
            biaya_air_terbuang: 189.5824,
            total_kerugian_harian: 135.416,
          },
          {
            panelId: "panelE",
            hari: "2025-07-16",
            kebocoran_harian: 37.5,
            biaya_air_terbuang: 131.25,
            total_kerugian_harian: 93.75,
          },
          {
            panelId: "panelE",
            hari: "2025-07-29",
            kebocoran_harian: 8.33328000000006,
            biaya_air_terbuang: 29.1664800000002,
            total_kerugian_harian: 20.8332000000001,
          },
        ],
        total_kerugian: 4980.997,
        total_kebocoran_liter: 1992.3988,
      },
      this_month: {
        month: "2025-08",
        daily_loss: [],
        total_kerugian: 0,
        total_kebocoran_liter: 0,
      },
    },
    ai_insight:
      "## Analisis Singkat Kerugian Kebocoran Air Panel E\n\nData menunjukkan fluktuasi signifikan dalam kebocoran air harian Panel E.  Meskipun bulan Agustus hingga tanggal 14 belum mencatat kebocoran, bulan Juli menunjukkan total kebocoran 1,992.40 liter dengan total kerugian Rp 4,981.  Terdapat beberapa hari dengan kebocoran yang relatif tinggi (misalnya, 2025-07-03 dan 2025-07-09),  mengindikasikan kemungkinan adanya masalah intermiten pada sistem perpipaan.  Ketidakhadiran data untuk beberapa hari di bulan Juli juga perlu diperhatikan.\n\n**Poin-poin penting:**\n\n* **Fluktuasi Kebocoran:**  Besarnya variasi kebocoran harian menunjukkan adanya masalah yang tidak konsisten, bukan kebocoran terus-menerus.\n* **Data Hilang:**  Data harian bulan Juli tidak lengkap, sehingga analisis yang komprehensif terhambat.  Perlu investigasi penyebab hilangnya data ini.\n* **Tidak Ada Kebocoran di Agustus (Hingga 14 Agustus):**  Situasi ini bisa menunjukkan perbaikan sementara, tetapi juga bisa menandakan masalah yang belum terdeteksi.\n* **Rasio Biaya dan Kebocoran:**  Rasio antara biaya air terbuang dan kebocoran konsisten (sekitar 2.5), menunjukkan konsistensi dalam perhitungan biaya.\n\n\n## Rekomendasi\n\n1. **Investigasi Penyebab Fluktuasi:**  Lakukan pemeriksaan menyeluruh pada sistem perpipaan Panel E untuk mengidentifikasi sumber kebocoran yang menyebabkan fluktuasi tersebut.  Perhatikan terutama pada hari-hari dengan kebocoran tinggi.\n2. **Pencatatan Data yang Lengkap:**  Pastikan sistem pencatatan data kebocoran berfungsi dengan baik dan mencatat data secara lengkap setiap hari.  Identifikasi dan perbaiki penyebab hilangnya data di bulan Juli.\n3. **Monitoring Berkala:**  Terapkan monitoring rutin dan sistematis terhadap kebocoran air Panel E, minimal harian, untuk mendeteksi masalah sejak dini.\n4. **Perbaikan Sistem Perpipaan:**  Setelah identifikasi sumber kebocoran, lakukan perbaikan segera untuk meminimalisir kerugian finansial dan air.\n5. **Analisis Data Historis yang Lebih Lengkap:**  Analisis data historis yang lebih lengkap (jika tersedia) untuk melihat pola musiman atau tren kebocoran jangka panjang.  Ini bisa membantu dalam memprediksi dan mencegah masalah di masa depan.\n6. **Evaluasi Sistem Deteksi Kebocoran:**  Tinjau efektivitas sistem deteksi kebocoran yang ada dan pertimbangkan peningkatannya, misalnya dengan sensor yang lebih sensitif atau sistem peringatan dini.\n\n\nDengan menerapkan rekomendasi di atas, diharapkan dapat mengurangi kerugian akibat kebocoran air, meningkatkan efisiensi penggunaan air, dan memberikan informasi yang lebih akurat untuk pengambilan keputusan di masa depan.\n",
    config: null,
  };

  // Calculate summary data
  const calculateSummary = () => {
    const thisMonth = data.analysis.this_month;
    const lastMonth = data.analysis.last_month;

    const totalKeebocoranKeseluruhan = data.analysis.daily_loss_all.reduce((sum, item) => sum + item.kebocoran_harian, 0);
    const totalBiayaKeseluruhan = data.analysis.daily_loss_all.reduce((sum, item) => sum + item.biaya_air_terbuang, 0);

    const perubahanKebocoran = thisMonth.total_kebocoran_liter - lastMonth.total_kebocoran_liter;
    const perubahanBiaya = thisMonth.total_kerugian - lastMonth.total_kerugian;

    const persentaseKeebocoranChange =
      lastMonth.total_kebocoran_liter > 0 ? ((perubahanKebocoran / lastMonth.total_kebocoran_liter) * 100).toFixed(1) : 0;

    const persentaseBiayaChange = lastMonth.total_kerugian > 0 ? ((perubahanBiaya / lastMonth.total_kerugian) * 100).toFixed(1) : 0;

    return {
      totalKeebocoranKeseluruhan,
      totalBiayaKeseluruhan,
      keebocoranBulanIni: thisMonth.total_kebocoran_liter,
      biayaBulanIni: thisMonth.total_kerugian,
      keebocoranBulanLalu: lastMonth.total_kebocoran_liter,
      biayaBulanLalu: lastMonth.total_kerugian,
      perubahanKebocoran,
      perubahanBiaya,
      persentaseKeebocoranChange,
      persentaseBiayaChange,
    };
  };

  const summary = calculateSummary();

  // Pagination functions
  const totalItems = data.analysis.daily_loss_all.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.analysis.daily_loss_all.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#F3FAFF] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-row justify-between items-center pb-7">
        <h1 className="text-4xl font-bold text-slate-900">AI Report</h1>
      </div>
      {isCollapsed ? (
        <>
          <div className="mb-7 w-full rounded-lg border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/70">
            <h1 className="text-slate-900 text-2xl font-bold mb-4">Water Leakage Report</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-slate-500 text-sm">Total Kebocoran Keseluruhan</h3>
                <p className="text-slate-900 text-xl font-bold">{summary.totalKeebocoranKeseluruhan.toFixed(2)} L</p>
              </div>
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-slate-500 text-sm">Kebocoran Bulan Ini</h3>
                <p className="text-slate-900 text-xl font-bold">{summary.keebocoranBulanIni.toFixed(2)} L</p>
                <p className={`text-sm ${summary.persentaseKeebocoranChange >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {summary.persentaseKeebocoranChange >= 0 ? "+" : ""}
                  {summary.persentaseKeebocoranChange}% vs bulan lalu
                </p>
              </div>
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-slate-500 text-sm">Biaya Kebocoran Bulan Ini</h3>
                <p className="text-slate-900 text-xl font-bold">Rp {summary.biayaBulanIni.toLocaleString()}</p>
                <p className={`text-sm ${summary.persentaseBiayaChange >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {summary.persentaseBiayaChange >= 0 ? "+" : ""}
                  {summary.persentaseBiayaChange}% vs bulan lalu
                </p>
              </div>
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-slate-500 text-sm">Total Biaya Keseluruhan</h3>
                <p className="text-slate-900 text-xl font-bold">Rp {summary.totalBiayaKeseluruhan.toLocaleString()}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-slate-900">
                <thead>
                  <tr className="border-b border-sky-100">
                    <th className="text-left py-3 px-2">Lokasi</th>
                    <th className="text-left py-3 px-2">Tanggal</th>
                    <th className="text-right py-3 px-2">Kebocoran (L)</th>
                    <th className="text-right py-3 px-2">Biaya Terbuang (Rp)</th>
                    <th className="text-right py-3 px-2">Total Kerugian (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, index) => (
                    <tr key={startIndex + index} className="border-b border-sky-100">
                      <td className="py-2 px-2">{item.panelId}</td>
                      <td className="py-2 px-2">{new Date(item.hari).toLocaleDateString("id-ID")}</td>
                      <td className="py-2 px-2 text-right">{item.kebocoran_harian.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">{item.biaya_air_terbuang.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">{item.total_kerugian_harian.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <p className="text-slate-500 text-sm">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} data
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="rounded border border-sky-100 bg-white px-3 py-1 text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sky-50"
                  >
                    Previous
                  </button>
                  <span className="text-slate-900">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="rounded border border-sky-100 bg-white px-3 py-1 text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sky-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-7 w-full rounded-lg border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/70">
            <h1 className="text-slate-900 text-2xl font-bold mb-4">AI Recommendation</h1>
            <div className="text-slate-600 leading-relaxed">
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <div className="prose prose-slate max-w-none">
                  {data.ai_insight.split("\n").map((line, index) => {
                    if (line.startsWith("##")) {
                      return (
                        <h3 key={index} className="text-xl font-bold text-slate-900 mb-3 mt-4">
                          {line.replace("##", "").trim()}
                        </h3>
                      );
                    } else if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <p key={index} className="font-bold text-sky-700 mb-2">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      );
                    } else if (line.startsWith("* **")) {
                      const parts = line.split(":**");
                      return (
                        <div key={index} className="mb-2">
                          <span className="font-bold text-sky-700">{parts[0].replace("* **", "• ")}</span>
                          <span className="text-slate-600">{parts[1] || ""}</span>
                        </div>
                      );
                    } else if (line.startsWith("*")) {
                      return (
                        <p key={index} className="mb-1 ml-4 text-slate-600">
                          {line.replace("*", "•")}
                        </p>
                      );
                    } else if (line.trim() && !line.startsWith("#")) {
                      return (
                        <p key={index} className="mb-3 text-slate-600">
                          {line}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-7 w-full rounded-lg border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/70">
            <h1 className="text-slate-900 text-2xl font-bold mb-4">Water Leakage Report</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-slate-500 text-sm">Total Kebocoran Keseluruhan</h3>
                <p className="text-slate-900 text-xl font-bold">{summary.totalKeebocoranKeseluruhan.toFixed(2)} L</p>
              </div>
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-slate-500 text-sm">Kebocoran Bulan Ini</h3>
                <p className="text-slate-900 text-xl font-bold">{summary.keebocoranBulanIni.toFixed(2)} L</p>
                <p className={`text-sm ${summary.persentaseKeebocoranChange >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {summary.persentaseKeebocoranChange >= 0 ? "+" : ""}
                  {summary.persentaseKeebocoranChange}% vs bulan lalu
                </p>
              </div>
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-slate-500 text-sm">Biaya Kebocoran Bulan Ini</h3>
                <p className="text-slate-900 text-xl font-bold">Rp {summary.biayaBulanIni.toLocaleString()}</p>
                <p className={`text-sm ${summary.persentaseBiayaChange >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {summary.persentaseBiayaChange >= 0 ? "+" : ""}
                  {summary.persentaseBiayaChange}% vs bulan lalu
                </p>
              </div>
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-slate-500 text-sm">Total Biaya Keseluruhan</h3>
                <p className="text-slate-900 text-xl font-bold">Rp {summary.totalBiayaKeseluruhan.toLocaleString()}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-slate-900">
                <thead>
                  <tr className="border-b border-sky-100">
                    <th className="text-left py-3 px-2">Lokasi</th>
                    <th className="text-left py-3 px-2">Tanggal</th>
                    <th className="text-right py-3 px-2">Kebocoran (L)</th>
                    <th className="text-right py-3 px-2">Biaya Terbuang (Rp)</th>
                    <th className="text-right py-3 px-2">Total Kerugian (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, index) => (
                    <tr key={startIndex + index} className="border-b border-sky-100">
                      <td className="py-2 px-2">{item.panelId}</td>
                      <td className="py-2 px-2">{new Date(item.hari).toLocaleDateString("id-ID")}</td>
                      <td className="py-2 px-2 text-right">{item.kebocoran_harian.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">{item.biaya_air_terbuang.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">{item.total_kerugian_harian.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <p className="text-slate-500 text-sm">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} data
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="rounded border border-sky-100 bg-white px-3 py-1 text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sky-50"
                  >
                    Previous
                  </button>
                  <span className="text-slate-900">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="rounded border border-sky-100 bg-white px-3 py-1 text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sky-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-7 w-full rounded-lg border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/70">
            <h1 className="text-slate-900 text-2xl font-bold mb-4">AI Recommendation</h1>
            <div className="text-slate-600 leading-relaxed">
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                <div className="prose prose-slate max-w-none">
                  {data.ai_insight.split("\n").map((line, index) => {
                    if (line.startsWith("##")) {
                      return (
                        <h3 key={index} className="text-xl font-bold text-slate-900 mb-3 mt-4">
                          {line.replace("##", "").trim()}
                        </h3>
                      );
                    } else if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <p key={index} className="font-bold text-sky-700 mb-2">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      );
                    } else if (line.startsWith("* **")) {
                      const parts = line.split(":**");
                      return (
                        <div key={index} className="mb-2">
                          <span className="font-bold text-sky-700">{parts[0].replace("* **", "• ")}</span>
                          <span className="text-slate-600">{parts[1] || ""}</span>
                        </div>
                      );
                    } else if (line.startsWith("*")) {
                      return (
                        <p key={index} className="mb-1 ml-4 text-slate-600">
                          {line.replace("*", "•")}
                        </p>
                      );
                    } else if (line.trim() && !line.startsWith("#")) {
                      return (
                        <p key={index} className="mb-3 text-slate-600">
                          {line}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Report;

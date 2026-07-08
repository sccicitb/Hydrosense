"use client";
import Map from "@/components/map";
import { useSidebar } from "@/components/ui/sidebar";
import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, X, List } from "lucide-react";

const issuePointsData = [
  {
    id: "iss-1",
    title: "Sumur Warga Jatinangor Tercemar Solar",
    description: "Heboh sumur warga di Dusun Batu Rumpil, Desa Cisempur mengeluarkan air mirip solar dan berbau menyengat.",
    issue: "Pencemaran BBM",
    severity: "critical",
    coordinates: [107.7698, -6.9295],
    source: "Sumur Warga Jatinangor Tercemar Solar",
    sourceUrl: "https://www.merdeka.com/jabar/heboh-sumur-warga-di-jatinangor-sumedang-tercemar-solar-begini-faktanya.html",
  },
  {
    id: "iss-2",
    title: "Sungai Citatih Tercemar Limbah Domestik",
    description: "Air sungai di Jatinangor ini tercemar limbah domestik dan sedimentasi, menyebabkan kekeruhan dan bau tidak sedap.",
    issue: "Pencemaran Sungai",
    severity: "critical",
    coordinates: [107.7746, -6.9264],
    source: "Sungai Citatih Tercemar Limbah Domestik",
    sourceUrl: "https://www.tiktok.com/search?q=sungai citatih jatinangor air",
  },
  {
    id: "iss-3",
    title: "Drainase Jalur Utama Kampus Tersumbat",
    description: "Sumbatan sampah di drainase menyebabkan genangan air dan potensi kontaminasi saat hujan deras.",
    issue: "Genangan Air",
    severity: "warning",
    coordinates: [107.7670, -6.9276],
    source: "Drainase Jalur Utama Kampus Tersumbat",
    sourceUrl: "https://www.tiktok.com/search?q=drainase jatinangor tersumbat",
  },
  {
    id: "iss-4",
    title: "Krisis Air Bersih di Permukiman Padat",
    description: "Permasalahan distribusi air di permukiman padat Jatinangor membuat warga bergantung pada air isi ulang.",
    issue: "Akses Air Bersih",
    severity: "info",
    coordinates: [107.7725, -6.9290],
    source: "Krisis Air Bersih di Permukiman Padat",
    sourceUrl: "https://www.tiktok.com/search?q=akses air bersih jatinangor",
  },
  {
    id: "iss-5",
    title: "Limbah Pabrik di Sungai Cikeruh",
    description: "Warga melaporkan aliran sungai Cikeruh berubah warna menjadi hitam pekat diduga akibat pembuangan limbah industri.",
    issue: "Limbah Industri",
    severity: "critical",
    coordinates: [107.7650, -6.9320],
    source: "Limbah Sungai Cikeruh",
    sourceUrl: "https://www.tiktok.com/search?q=limbah sungai cikeruh jatinangor",
  },
  {
    id: "iss-6",
    title: "Kekeringan di Desa Hegarmanah",
    description: "Sejumlah sumur warga di Desa Hegarmanah mulai mengering saat musim kemarau panjang tahun ini.",
    issue: "Kekeringan",
    severity: "warning",
    coordinates: [107.7780, -6.9240],
    source: "Hegarmanah Kekeringan",
    sourceUrl: "https://www.tiktok.com/search?q=kekeringan jatinangor",
  },
  {
    id: "iss-7",
    title: "Pencemaran Air di Dekat Area Kost",
    description: "Mahasiswa mengeluhkan air kost yang berbau besi dan berwarna kekuningan di area sekitar Sayang.",
    issue: "Kualitas Air Kost",
    severity: "warning",
    coordinates: [107.7710, -6.9310],
    source: "Air Kost Jatinangor",
    sourceUrl: "https://www.tiktok.com/search?q=air kost jatinangor keruh",
  },
  {
    id: "iss-8",
    title: "Banjir Cileles Akibat Drainase Buruk",
    description: "Luapan air dari selokan yang tidak terawat merendam jalanan di wilayah Cileles Jatinangor.",
    issue: "Banjir Genangan",
    severity: "warning",
    coordinates: [107.7850, -6.9220],
    source: "Banjir Cileles",
    sourceUrl: "https://www.tiktok.com/search?q=banjir jatinangor cileles",
  },
  {
    id: "iss-9",
    title: "Kandungan E.Coli Tinggi di Air Tanah",
    description: "Hasil penelitian menunjukkan beberapa titik air tanah di pemukiman padat Jatinangor mengandung bakteri E.Coli.",
    issue: "Kontaminasi Bakteri",
    severity: "critical",
    coordinates: [107.7730, -6.9270],
    source: "Penelitian Air Jatinangor",
    sourceUrl: "https://www.tiktok.com/search?q=kualitas air tanah jatinangor",
  },
  {
    id: "iss-10",
    title: "Akses Air PDAM Terganggu",
    description: "Gangguan distribusi pipa PDAM menyebabkan aliran air ke rumah warga terhenti selama beberapa hari.",
    issue: "Layanan PDAM",
    severity: "info",
    coordinates: [107.7680, -6.9250],
    source: "PDAM Jatinangor",
    sourceUrl: "https://www.tiktok.com/search?q=pdam jatinangor mati",
  },
  {
    id: "iss-11",
    title: "Air Kuning di Wilayah Caringin",
    description: "Warga Caringin mengeluhkan kualitas air tanah yang berubah warna menjadi kekuningan dan meninggalkan endapan.",
    issue: "Kualitas Air",
    severity: "warning",
    coordinates: [107.7760, -6.9330],
    source: "Laporan Warga Caringin",
    sourceUrl: "https://www.tiktok.com/search?q=air kuning jatinangor",
  },
  {
    id: "iss-12",
    title: "Sumur Bor Kering di Ciseke",
    description: "Penurunan muka air tanah menyebabkan beberapa sumur bor milik warga di area Ciseke tidak mengeluarkan air.",
    issue: "Kekeringan",
    severity: "critical",
    coordinates: [107.7705, -6.9270],
    source: "Info Jatinangor",
    sourceUrl: "https://www.tiktok.com/search?q=kekeringan ciseke jatinangor",
  },
  {
    id: "iss-13",
    title: "Bau Limbah di Depan Gerbang Unpad",
    description: "Aroma tidak sedap tercium dari saluran drainase di depan gerbang utama kampus saat debit air rendah.",
    issue: "Pencemaran Udara/Air",
    severity: "warning",
    coordinates: [107.7735, -6.9255],
    source: "Keluhan Mahasiswa",
    sourceUrl: "https://www.tiktok.com/search?q=limbah unpad jatinangor",
  },
  {
    id: "iss-14",
    title: "Sampah Menyumbat Selokan Cipacing",
    description: "Tumpukan sampah domestik menyumbat aliran selokan di wilayah Cipacing, berisiko banjir saat hujan.",
    issue: "Sanitasi Buruk",
    severity: "warning",
    coordinates: [107.7600, -6.9350],
    source: "Relawan Lingkungan",
    sourceUrl: "https://www.tiktok.com/search?q=sampah selokan cipacing",
  },
  {
    id: "iss-15",
    title: "Krisis Air Bersih Desa Cileles",
    description: "Warga Desa Cileles terpaksa mengantri bantuan air bersih karena sumber air utama desa tercemar.",
    issue: "Akses Air Bersih",
    severity: "critical",
    coordinates: [107.7880, -6.9210],
    source: "Bantuan Air Cileles",
    sourceUrl: "https://www.tiktok.com/search?q=krisis air cileles jatinangor",
  },
  {
    id: "iss-16",
    title: "Pipa Bocor di Jalan Raya Bandung-Sumedang",
    description: "Kebocoran pipa distribusi air menyebabkan genangan di jalan raya dan pemborosan debit air bersih.",
    issue: "Infrastruktur Rusak",
    severity: "info",
    coordinates: [107.7650, -6.9290],
    source: "Laporan Jalan Raya",
    sourceUrl: "https://www.tiktok.com/search?q=pipa bocor jatinangor",
  },
  {
    id: "iss-17",
    title: "Kontaminasi Air Sungai Desa Sayang",
    description: "Aktivitas pembuangan limbah rumah tangga langsung ke sungai memperburuk kualitas air di Desa Sayang.",
    issue: "Pencemaran Sungai",
    severity: "critical",
    coordinates: [107.7720, -6.9300],
    source: "Warga Desa Sayang",
    sourceUrl: "https://www.tiktok.com/search?q=pencemaran sungai desa sayang",
  },
  {
    id: "iss-18",
    title: "Air PDAM Berpasir di Sukawening",
    description: "Pelanggan PDAM di Sukawening mengeluhkan air yang keluar dari keran mengandung pasir dan keruh.",
    issue: "Layanan PDAM",
    severity: "warning",
    coordinates: [107.7800, -6.9280],
    source: "Komplain Pelanggan",
    sourceUrl: "https://www.tiktok.com/search?q=pdam jatinangor keruh",
  },
  {
    id: "iss-19",
    title: "Genangan Air di Area Parkir Kampus",
    description: "Drainase yang tidak memadai di area parkir menyebabkan genangan setinggi mata kaki setiap hujan deras.",
    issue: "Genangan Air",
    severity: "info",
    coordinates: [107.7715, -6.9260],
    source: "Info Kampus",
    sourceUrl: "https://www.tiktok.com/search?q=banjir kampus jatinangor",
  },
  {
    id: "iss-20",
    title: "Penurunan Debit Mata Air Gunung Geulis",
    description: "Debit mata air dari Gunung Geulis yang menjadi sumber air warga sekitar terus menurun secara drastis.",
    issue: "Sumber Air Berkurang",
    severity: "critical",
    coordinates: [107.7850, -6.9150],
    source: "Kelompok Tani Jatinangor",
    sourceUrl: "https://www.tiktok.com/search?q=mata air gunung geulis",
  }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";
const TIKTOK_QUERY = "jatinangor air bersih kualitas air pencemaran limbah";
const TIKTOK_REFRESH_INTERVAL = 5 * 60 * 1000;
const JATINANGOR_CENTER = [107.77045, -6.92808];

const createStableTikTokId = (value = "") => {
  const text = String(value || "tiktok");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
};

const createNewsCoordinates = (id = "") => {
  const hash = String(id)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const angle = ((hash % 360) * Math.PI) / 180;
  const radius = 0.0025 + (hash % 500) / 100000;

  return [
    Number((JATINANGOR_CENTER[0] + Math.cos(angle) * radius).toFixed(6)),
    Number((JATINANGOR_CENTER[1] + Math.sin(angle) * radius).toFixed(6)),
  ];
};

const formatNewsTime = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapTikTokItemToPoint = (item) => {
  const uniqueValue = item.sourceUrl || `${item.title}-${item.source}-${item.publishedAt}`;
  const id = `tiktok-${createStableTikTokId(uniqueValue)}`;
  const stats = item.stats || {};
  const comments = Array.isArray(item.comments) ? item.comments : [];
  const commentText = comments.length
    ? `Komentar TikTok: ${comments
        .slice(0, 2)
        .map((comment) => `"${comment.text}"`)
        .join(" • ")}`
    : item.commentWarning || "Komentar TikTok belum tersedia dari respons publik.";

  return {
    id,
    title: item.title || "Video TikTok Jatinangor",
    description:
      item.description ||
      "Unggahan TikTok terkait isu air, lingkungan, atau layanan publik di sekitar Jatinangor.",
    issue: item.issue || "TikTok",
    severity: item.severity || "info",
    coordinates: createNewsCoordinates(id),
    source: item.source || "TikTok",
    sourceUrl: item.sourceUrl,
    videoUrl: item.videoUrl,
    cover: item.cover,
    publishedAt: item.publishedAt,
    stats,
    comments,
    commentWarning: item.commentWarning,
    commentText,
    detailSource: item.detailSource,
    scrapeSource: item.scrapeSource,
    isLiveTikTok: true,
  };
};

const mergeLiveTikTokItems = (currentItems, incomingItems) => {
  const knownKeys = new Set(
    currentItems.map((item) => item.sourceUrl || item.id || item.title)
  );
  const newItems = incomingItems.filter((item) => {
    const key = item.sourceUrl || item.id || item.title;
    if (!key || knownKeys.has(key)) return false;

    knownKeys.add(key);
    return true;
  });

  return [...newItems, ...currentItems].slice(0, 12);
};

const TitikMapsPage = () => {
  const { isCollapsed } = useSidebar();
  const [showPanel, setShowPanel] = useState(true);
  const [focusedPoint, setFocusedPoint] = useState(null);
  const [activeVideoPoint, setActiveVideoPoint] = useState(null);
  const [liveTikTok, setLiveTikTok] = useState([]);
  const [tiktokUpdatedAt, setTikTokUpdatedAt] = useState(null);
  const issuePoints = useMemo(() => [...liveTikTok, ...issuePointsData], [liveTikTok]);

  useEffect(() => {
    let isActive = true;

    const fetchLatestTikTok = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/data/tiktok-points?q=${encodeURIComponent(TIKTOK_QUERY)}`,
          { cache: "no-store" }
        );

        if (!response.ok) return;

        const payload = await response.json();
        const nextTikTokItems = Array.isArray(payload.items)
          ? payload.items.map(mapTikTokItemToPoint)
          : [];

        if (!isActive) return;

        setLiveTikTok((currentItems) => mergeLiveTikTokItems(currentItems, nextTikTokItems));
        setTikTokUpdatedAt(new Date());
      } catch {
        if (isActive) {
          setTikTokUpdatedAt(new Date());
        }
      }
    };

    fetchLatestTikTok();
    const intervalId = window.setInterval(fetchLatestTikTok, TIKTOK_REFRESH_INTERVAL);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const handlePointFocus = (point) => {
    setFocusedPoint({ ...point, focusKey: Date.now() });
    if (point.videoUrl) {
      setActiveVideoPoint(point);
    }
  };

  const handlePointKeyDown = (event, point) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePointFocus(point);
    }
  };

  return (
    <div className="bg-black w-full h-screen relative overflow-hidden">
      <Map
        isCollapsed={isCollapsed}
        issuePoints={issuePoints}
        hideBatasLine={true}
        focusedPoint={focusedPoint}
        onIssuePointClick={(point) => {
          if (point.videoUrl) {
            setActiveVideoPoint(point);
          }
        }}
      />

      {activeVideoPoint?.videoUrl && (
        <div className="absolute left-1/2 top-[18%] z-50 w-[340px] max-w-[90vw] -translate-x-1/2 overflow-hidden rounded-3xl border border-sky-300/70 bg-slate-950/95 text-white shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300">
                TikTok Video
              </p>
              <h2 className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug">
                {activeVideoPoint.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveVideoPoint(null)}
              className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-white hover:bg-white/20"
            >
              ×
            </button>
          </div>
          <video
            controls
            playsInline
            autoPlay
            muted
            preload="metadata"
            poster={activeVideoPoint.cover || undefined}
            className="aspect-[9/16] max-h-[420px] w-full bg-black object-contain"
            src={activeVideoPoint.videoUrl}
          />
          <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs text-slate-300">
            <span className="truncate">{activeVideoPoint.source || "TikTok"}</span>
            {activeVideoPoint.sourceUrl && (
              <a
                href={activeVideoPoint.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-bold text-sky-300 hover:text-sky-200"
              >
                Buka TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button when panel is closed */}
      {!showPanel && (
        <button 
          onClick={() => setShowPanel(true)}
          className="absolute top-24 right-16 z-50 p-4 bg-[#0B1739]/90 backdrop-blur-md rounded-2xl border border-[#343B4F] text-white shadow-2xl hover:bg-[#0E1B46] transition-all duration-300 group"
        >
          <List size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Dark Glassmorphism Overlay Panel */}
      <div className={`absolute top-24 right-16 z-40 max-w-[420px] min-w-[300px] rounded-3xl bg-[#0B1739]/90 p-6 shadow-2xl backdrop-blur-md text-white h-[82vh] overflow-y-auto border border-[#343B4F]/80 transition-all duration-300 ${showPanel ? "translate-x-0 opacity-100" : "translate-x-[200%] opacity-0 pointer-events-none"}`}>
        
        {/* Panel Header */}
        <div className="mb-6 pb-4 border-b border-[#343B4F]/50 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Map Titik Jatinangor
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Peta sebaran laporan isu lingkungan dan ketersediaan air bersih di area Jatinangor.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                TikTok live aktif
              </span>
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sky-200">
                {liveTikTok.length} data TikTok
              </span>
              {tiktokUpdatedAt && (
                <span className="text-slate-400">
                  Update {formatNewsTime(tiktokUpdatedAt)}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => setShowPanel(false)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Issue Cards */}
        <div className="space-y-4">
          {issuePoints.map((point, index) => (
            <div 
              key={`${point.id}-${point.sourceUrl || point.title || index}`} 
              role="button"
              tabIndex={0}
              aria-label={`Fokus ke ${point.title} di peta`}
              onClick={() => handlePointFocus(point)}
              onKeyDown={(event) => handlePointKeyDown(event, point)}
              className={`rounded-2xl border p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-sky-400/70 cursor-pointer ${
                focusedPoint?.id === point.id
                  ? "border-sky-400/70 bg-[#0B1739]"
                  : "border-[#343B4F]/60 bg-[#081028]/80 hover:border-slate-500/50"
              }`}
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: point.severity === "critical" ? "#ef4444" : point.severity === "warning" ? "#f97316" : "#0ea5e9"
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="text-xs font-bold uppercase tracking-wider" 
                  style={{
                    color: point.severity === "critical" ? "#f87171" : point.severity === "warning" ? "#fb923c" : "#38bdf8"
                  }}
                >
                  {point.issue}
                </div>
              </div>
              
              <h3 className="text-base font-extrabold text-white leading-snug transition-colors pb-0.5 inline-block">
                {point.title}
              </h3>
              
              {/* Clickable Source Link */}
              <a 
                href={point.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                className="mt-3 text-[11px] text-slate-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 font-medium hover:underline group/link w-fit bg-white/5 px-2.5 py-1 rounded-lg border border-white/10"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                {(point.source || "Sumber berita").length > 30
                  ? `${(point.source || "Sumber berita").substring(0, 30)}...`
                  : point.source || "Sumber berita"}
                <ExternalLink size={10} className="opacity-40 group-hover/link:opacity-100 transition-opacity" />
              </a>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed font-normal">{point.description}</p>
              {point.isLiveTikTok && (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-relaxed text-slate-300">
                  <div className="mb-1 font-bold uppercase tracking-wide text-pink-300">
                    Komentar TikTok
                  </div>
                  <p>{point.commentText}</p>
                  {point.stats && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
                      <span>{point.stats.likeCount || 0} likes</span>
                      <span>{point.stats.commentCount || 0} komentar</span>
                      <span>{point.stats.shareCount || 0} share</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 flex flex-wrap gap-2">
                {point.isLiveTikTok && (
                  <span className="rounded-full bg-pink-950/70 border border-pink-400/30 px-3 py-1 text-[10px] font-bold text-pink-200 tracking-wide uppercase">
                    TikTok Live
                  </span>
                )}
                {point.detailSource === "video-detail" && (
                  <span className="rounded-full bg-emerald-950/70 border border-emerald-400/30 px-3 py-1 text-[10px] font-bold text-emerald-200 tracking-wide uppercase">
                    Video Detail
                  </span>
                )}
                <span className="rounded-full bg-teal-950/60 border border-teal-500/30 px-3 py-1 text-[10px] font-bold text-teal-300 tracking-wide uppercase">
                  Jatinangor
                </span>
                {point.publishedAt && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-300 tracking-wide">
                    {formatNewsTime(point.publishedAt)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TitikMapsPage;

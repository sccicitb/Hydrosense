"use client";

import Map from "@/components/map";
import { useSidebar } from "@/components/ui/sidebar";
import React, { useEffect, useState } from "react";
import { Play, Heart, MessageCircle, X, List } from "lucide-react";

const TikTokMapsPage = () => {
  const { isCollapsed } = useSidebar();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPanel, setShowPanel] = useState(true);

  // Jatinangor center coordinates for fallback
  const JATINANGOR_CENTER = [107.77045, -6.92808];

  const generateRandomCoords = (center, index) => {
    // Spread markers around the center
    const angle = (index * 137.5) * (Math.PI / 180); // Use golden angle for distribution
    const radius = 0.002 + (index * 0.0005); // Increasing radius
    return [
      center[0] + radius * Math.cos(angle),
      center[1] + radius * Math.sin(angle)
    ];
  };

  useEffect(() => {
    const fetchTikTokPosts = async () => {
      setLoading(true);
      setError("");
      try {
        const baseUrl = `${window.location.protocol}//${window.location.hostname}:3006`;
        const query = encodeURIComponent("jatinangor air");
        const response = await fetch(`${baseUrl}/data/tiktok?q=${query}`);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Server error ${response.status}: ${text}`);
        }

        const result = await response.json();
        const videos = (result.videos || []).map((v, idx) => {
          const displayTitle = v.desc && v.desc.length > 40 
            ? v.desc.substring(0, 40) + "..." 
            : v.desc || "Laporan Video TikTok";

          return {
            ...v,
            // Add properties needed by Map component
            title: displayTitle,
            description: v.desc || "Tidak ada deskripsi",
            issue: "TikTok Video",
            severity: "info",
            coordinates: generateRandomCoords(JATINANGOR_CENTER, idx),
            source: `@${v.authorName || v.author}`,
            sourceUrl: v.tiktokUrl
          };
        });
        setPosts(videos);
      } catch (err) {
        console.error("TikTok fetch error:", err);
        setError(err.message || "Tidak dapat memuat data TikTok.");
      } finally {
        setLoading(false);
      }
    };

    fetchTikTokPosts();
  }, []);

  return (
    <div className="bg-black w-full h-screen relative overflow-hidden">
      <Map isCollapsed={isCollapsed} issuePoints={posts} hideBatasLine={true} />

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
      <div className={`absolute top-24 right-16 z-40 max-w-[440px] min-w-[320px] bg-[#0B1739]/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl overflow-y-auto h-[82vh] border border-[#343B4F]/80 transition-all duration-300 text-white ${showPanel ? "translate-x-0 opacity-100" : "translate-x-[200%] opacity-0 pointer-events-none"}`}>
        
        {/* Panel Header */}
        <div className="mb-6 pb-4 border-b border-[#343B4F]/50 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              TikTok Jatinangor Air
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Hasil penelusuran video TikTok terkait problematika air bersih di kawasan Jatinangor.
            </p>
          </div>
          <button 
            onClick={() => setShowPanel(false)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs text-slate-400 animate-pulse">Menghubungkan ke server scraping TikTok...</div>
          </div>
        )}
        
        {error && (
          <div className="text-xs text-red-400 py-4 bg-red-950/20 border border-red-500/20 rounded-2xl px-4 leading-relaxed mb-4">
            <span className="font-bold">Error:</span> {error}
            <div className="mt-2 text-[10px] text-slate-400">Pastikan server backend di port 3006 sudah berjalan.</div>
          </div>
        )}
        
        {!loading && !error && posts.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-12 border border-dashed border-[#343B4F] rounded-2xl">
            Tidak ditemukan video TikTok untuk pencarian ini.
          </div>
        )}

        {/* Scraped Video Cards */}
        <div className="space-y-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.tiktokUrl}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-2xl border border-[#343B4F]/60 bg-[#081028]/80 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-slate-500/50 group"
            >
              {post.cover ? (
                <div className="relative h-44 w-full overflow-hidden border-b border-[#343B4F]/50">
                  <img 
                    src={post.cover} 
                    alt={post.desc || "TikTok cover"} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  {/* Play Overlay Button */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/40 shadow-lg">
                      <Play size={20} className="fill-white text-white" />
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="p-4">
                <div className="text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
                  <span>@{post.authorName || post.author || "unknown"}</span>
                </div>
                
                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-normal line-clamp-2 group-hover:text-white transition-colors">
                  {post.desc || "Tidak ada deskripsi"}
                </p>
                
                {/* Stats Bar */}
                <div className="mt-4 pt-3 border-t border-[#343B4F]/30 flex items-center gap-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                    <Play size={10} className="fill-slate-400 stroke-none" />
                    {post.stats?.playCount ?? "-"} views
                  </span>
                  <span className="flex items-center gap-1 hover:text-red-400 transition-colors">
                    <Heart size={10} className="fill-slate-400 stroke-none" />
                    {post.stats?.likeCount ?? "-"} likes
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TikTokMapsPage;

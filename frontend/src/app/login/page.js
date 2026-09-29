"use client";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import Cookies from 'js-cookie'; // pastikan ini sudah di-import

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        Cookies.set("token", data.access_token, { expires: 1 });
        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil!',
          text: `Selamat datang!`,
          timer: 2000,
          showConfirmButton: false,
        });

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: data.error || data.message || 'Terjadi kesalahan saat login.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Terjadi kesalahan saat login.',
      });
    }
  };

  return (
    <div className="w-svw bg-white h-svh grid grid-cols-1 md:grid-cols-2 overflow-hidden relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/70 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-100/70 blur-[150px] pointer-events-none" />

      {/* Left Column: Form Container */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 z-10">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-slate-200/80 p-8 md:p-10 rounded-[2.5rem] w-full max-w-[460px] flex flex-col justify-center items-center transition-all duration-500">
          
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo-hydrosense.png"
              alt="HydroSense"
              width={280}
              height={210}
              className="mb-3 h-32 w-auto object-contain"
              priority
            />
            <p className="text-slate-500 text-xs mt-2 text-center">
              Masukkan email dan kata sandi untuk mengakses dasbor monitoring air
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col space-y-4 w-full" onSubmit={handleLogin}>
            <div className="flex flex-col">
              <label className="text-slate-700 text-xs font-semibold mb-2">Email</label>
              <input 
                className="bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 placeholder-slate-400 text-sm focus:border-blue-500 shadow-sm" 
                type="email" 
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-slate-700 text-xs font-semibold mb-2">Password</label>
              <input 
                className="bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 placeholder-slate-400 text-sm focus:border-blue-500 shadow-sm" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              className="bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold rounded-xl py-3.5 shadow-lg shadow-blue-900/30 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-300 mt-6 text-sm" 
              type="submit"
            >
              Sign In
            </button>
          </form>

        </div>
        
      </div>

      {/* Right Column: Graphic Display */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 to-white border-l border-slate-200 relative p-12">
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-blue-100/70 blur-[80px] pointer-events-none" />
        <div className="w-5/6 max-w-[550px] relative transition-transform duration-500 hover:scale-105">
          {/* Subtle Glow Overlay */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-200 to-cyan-100 opacity-80 blur-xl"></div>
          <Image 
            src="/tangki.png" 
            alt="login image" 
            className="relative rounded-2xl object-contain drop-shadow-[0_20px_50px_rgba(15,23,42,0.12)]" 
            width={713} 
            height={500} 
            priority
          />
        </div>
      </div>
    </div>
  );
}

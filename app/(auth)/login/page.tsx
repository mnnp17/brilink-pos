import React from 'react';
import { Wallet, Receipt, Sparkles } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-[#F0F4F8] font-sans antialiased">

      {/* ═══════════════════════════════════
          LEFT PANEL — Brand Hero
          ═══════════════════════════════════ */}
      <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-[#001E36] px-[52px] py-[48px] md:flex min-h-screen">
        
        {/* Top Section */}
        <div className="flex flex-col gap-9">
          
          {/* Logo row */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12px] font-bold tracking-wider text-white">
              BANK BRI
            </div>
            <div className="h-5 w-[1px] bg-white/25" />
            <div className="rounded-lg bg-[#FF6600] px-3.5 py-1.5 text-[12px] font-bold tracking-[0.08em] text-white">
              BRILink
            </div>
          </div>

          {/* Headline */}
          <h1 className="max-w-[320px] text-[30px] font-extrabold leading-tight text-white m-0">
            Sistem Pencatatan Digital Agen Brilink
          </h1>

          {/* Features */}
          <div className="flex flex-col gap-5">
            {[
              { icon: <Wallet size={18} />, label: 'Pencatatan Uang Tunai & Non-Tunai' },
              { icon: <Receipt size={18} />, label: 'Cetak Struk Pembayaran Langsung' },
              { icon: <Sparkles size={18} />, label: 'Laporan Rekap Kios Otomatis' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#FF6600]/35 bg-[#FF6600]/15 text-[#FF6600]">
                  {f.icon}
                </div>
                <span className="text-[14px] font-semibold text-slate-200">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center self-start gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[12px] font-medium text-slate-300">
            <div className="relative h-2.5 w-2.5 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#10B981] opacity-75" />
              <span className="relative block h-2.5 w-2.5 rounded-full bg-[#10B981]" />
            </div>
            <span>
              Sesi Terenkripsi &amp; Terproteksi
            </span>
          </div>
          <p className="text-[11px] text-white/35 m-0">© 2026 Mochammad Naufal</p>
        </div>
      </div>

      {/* ═══════════════════════════════════
          RIGHT PANEL — Form Container
          ═══════════════════════════════════ */}
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[#F0F4F8] px-10 py-12 md:px-10 lg:px-12 relative">
        <div className="flex w-full max-w-[440px] flex-col gap-4">
          
          <LoginForm />

          {/* Version */}
          <p className="m-0 text-center text-[11px] text-slate-400 mt-2">v2.1.0 • Multi-Outlet &amp; Role Protection</p>
        </div>
      </div>
    </div>
  );
}

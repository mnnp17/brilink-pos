'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard,
  Cpu,
  Terminal,
  Database,
  Users,
  Sliders,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const DEV_NAV_ITEMS = [
  { href: '/developer', icon: LayoutDashboard, label: 'Dashboard Teknis' },
  { href: '/developer/api', icon: Cpu, label: 'Pemantauan API & Integrasi' },
  { href: '/developer/logs', icon: Terminal, label: 'Log Sistem & Error' },
  { href: '/developer/data', icon: Database, label: 'Manajemen Data & Tools' },
  { href: '/developer/users', icon: Users, label: 'Sesi User & Kelola Outlet' },
  { href: '/developer/settings', icon: Sliders, label: 'Pengaturan & Fitur Sistem' },
];

export function DeveloperSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside
      className={`flex h-full shrink-0 flex-col items-center border-r border-slate-200 bg-white py-4 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div
        className={`mb-4 flex h-10 items-center rounded-xl bg-[#001E36] transition-all duration-300 ${
          collapsed ? 'w-10 justify-center' : 'w-[calc(100%-24px)] px-3 gap-3 justify-start'
        }`}
      >
        <span className="text-[11px] font-black text-[#FF6600] leading-none shrink-0">BRL</span>
        {!collapsed && (
          <span className="text-[13px] font-bold text-white truncate">Dev Console</span>
        )}
      </div>

      {/* Ergonomic Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
        className={`group relative mb-6 flex h-10 items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-150 ${
          collapsed ? 'w-10 justify-center' : 'w-[calc(100%-24px)] px-3.5 gap-3.5 justify-start'
        }`}
      >
        {collapsed ? (
          <ChevronRight className="h-[18px] w-[18px] shrink-0" />
        ) : (
          <ChevronLeft className="h-[18px] w-[18px] shrink-0" />
        )}
        {!collapsed && <span className="text-[13px] font-bold">Tutup Menu</span>}
      </button>

      {/* Navigation */}
      <nav className={`flex flex-1 flex-col gap-1 w-full transition-all duration-300 ${
        collapsed ? 'items-center px-2' : 'px-3'
      }`}>
        {DEV_NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`group relative flex h-10 items-center rounded-xl transition-all duration-150 ${
                collapsed 
                  ? 'w-10 justify-center' 
                  : 'w-full px-3.5 gap-3.5 justify-start'
              } ${
                isActive
                  ? 'bg-[#001E36] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <span className="text-[13px] font-bold truncate">
                  {label}
                </span>
              )}
              {/* Tooltip (only when collapsed) */}
              {collapsed && (
                <span className="pointer-events-none absolute left-[52px] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {label}
                </span>
              )}
              {/* Active indicator dot/bar */}
              {isActive && (
                <span className={`absolute rounded-full bg-[#FF6600] ${
                  collapsed 
                    ? '-right-[5px] top-1/2 h-1.5 w-1.5 -translate-y-1/2' 
                    : 'left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r'
                }`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Store Switch & Avatar & Logout */}
      <div className={`flex flex-col items-center gap-2.5 w-full mt-4 border-t border-slate-100 pt-4 transition-all duration-300 ${
        collapsed ? 'px-2' : 'px-3'
      }`}>
        {/* Avatar block */}
        <div className={`flex items-start transition-all ${
          collapsed ? 'justify-center w-9' : 'w-full gap-3 px-1 mt-1'
        }`}>
          <div
            title={profile?.full_name ?? 'Developer'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[12px] font-bold text-white shadow-sm"
          >
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'D'}
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[9px] font-bold tracking-wider text-purple-600 uppercase">
                {profile?.role ?? 'DEVELOPER'}
              </span>
              <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">
                {profile?.full_name ?? 'Dev Admin'}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Keluar"
          className={`flex h-9 items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 ${
            collapsed ? 'w-9 justify-center' : 'w-full px-3.5 gap-3.5 justify-start'
          }`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="text-[13px] font-bold">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}

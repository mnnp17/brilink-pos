'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useActiveShift } from '@/lib/hooks/useShift';
import { toast } from 'sonner';
import { formatTime } from '@/lib/utils/format';
import {
  LayoutDashboard,
  Store,
  History,
  FileText,
  Settings as SettingsIcon,
  Wallet,
  Users as UsersIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Banknote,
} from 'lucide-react';
import { ShiftClosingModal } from '../shift/ShiftClosingModal';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pos', icon: Store, label: 'POS Kasir' },
  { href: '/transactions', icon: History, label: 'Riwayat Transaksi' },
  { href: '/reports', icon: FileText, label: 'Laporan' },
  { href: '/expenses', icon: Banknote, label: 'Pengeluaran Toko' },
  { href: '/services', icon: SettingsIcon, label: 'Katalog & Biaya' },
  { href: '/accounts', icon: Wallet, label: 'Kelola Rekening' },
  { href: '/staff', icon: UsersIcon, label: 'Kelola Staf' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { data: shift } = useActiveShift(profile?.id);
  const [collapsed, setCollapsed] = useState(true);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const handleLogoutClick = () => {
    if (profile?.role === 'kasir' && shift) {
      setIsShiftModalOpen(true);
      toast.info('Harap tutup shift kasir terlebih dahulu sebelum logout.');
    } else {
      signOut();
    }
  };

  // Filter menu items based on role and adjust links dynamically
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (profile?.role === 'kasir') {
      return item.href === '/pos' || item.href === '/transactions';
    }
    if (profile?.role === 'owner') {
      return item.href !== '/pos';
    }
    return true;
  }).map((item) => {
    // Redirect Owner & Developer to the audited reports transactions view
    if (item.href === '/transactions' && (profile?.role === 'owner' || profile?.role === 'developer')) {
      return { ...item, href: '/reports/transactions' };
    }
    return item;
  });

  // Sync initial collapse state with viewport size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) {
        setCollapsed(false);
      }
    }
  }, []);

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col items-center border-r border-slate-200 bg-white py-4 transition-all duration-300 ease-in-out ${
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
          <span className="text-[13px] font-bold text-white truncate">BRILink POS</span>
        )}
      </div>

      {/* Ergonomic Collapse Toggle Button (Moved to top below logo) */}
      <button
        onClick={() => {
          if (onClose) {
            onClose();
          } else {
            setCollapsed(!collapsed);
          }
        }}
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
        {collapsed && (
          <span className="pointer-events-none absolute left-[52px] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            Buka Menu
          </span>
        )}
      </button>

      {/* Navigation */}
      <nav className={`flex flex-1 flex-col gap-1 w-full transition-all duration-300 ${
        collapsed ? 'items-center px-2' : 'px-3'
      }`}>
        {visibleNavItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/reports'
            ? pathname === '/reports'
            : pathname === href || (href !== '/pos' && pathname.startsWith(href));
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

        {/* Tutup Shift Button (Only for Cashier/Kasir) */}
        {profile?.role === 'kasir' && (
          <button
            onClick={() => setIsShiftModalOpen(true)}
            title={collapsed ? 'Tutup Shift' : undefined}
            className={`group relative mt-1 flex h-10 items-center rounded-xl font-bold transition-all duration-150 ${
              collapsed
                ? 'w-10 justify-center bg-rose-50 text-rose-600 border border-rose-200'
                : 'w-full px-3.5 gap-3.5 justify-start bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <Lock className="h-[18px] w-[18px] shrink-0 text-rose-600" />
            {!collapsed && <span className="text-[13px]">Tutup Shift</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-[52px] z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Tutup Shift
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Avatar & Logout */}
      <div className={`flex flex-col items-center gap-2 w-full mt-4 border-t border-slate-100 pt-4 transition-all duration-300 ${
        collapsed ? 'px-2' : 'px-3'
      }`}>
        {/* Avatar & User Info block */}
        <div className={`flex items-start transition-all ${
          collapsed ? 'justify-center w-9' : 'w-full gap-3 px-1'
        }`}>
          <div
            title={profile?.full_name ?? 'User'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[12px] font-bold text-white shadow-sm"
          >
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[9px] font-bold tracking-wider text-blue-500 uppercase">
                {profile?.role ?? 'KASIR'}
              </span>
              <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">
                {profile?.full_name ?? 'Kasir Default'}
              </p>
              
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-500 truncate">
                    Login: {shift?.opened_at ? formatTime(shift.opened_at) : formatTime(new Date())}
                  </span>
                </div>
                {profile?.role === 'kasir' && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    <span className="text-[10px] text-slate-500 truncate">
                      Shift: {shift?.status === 'open' ? 'Aktif' : 'Tutup'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogoutClick}
          title="Keluar"
          className={`flex h-9 items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 ${
            collapsed ? 'w-9 justify-center' : 'w-full px-3.5 gap-3.5 justify-start'
          }`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="text-[13px] font-bold">Keluar</span>}
        </button>
      </div>
      {/* Shift Closing Modal */}
      <ShiftClosingModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />
    </aside>
  );
}

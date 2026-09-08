'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState, useEffect } from 'react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/accounts',
    label: 'Rekening & EDC',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Riwayat Transaksi',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Laporan',
    badge: 'Fase 3',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export function OwnerSidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [isOnline, setIsOnline] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    // Check initial state asynchronously to avoid React 19 setState in effect warning
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        setIsOnline(navigator.onLine)
      }, 0)
    }
    const onlineHandler = () => setIsOnline(true)
    const offlineHandler = () => setIsOnline(false)
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    return () => {
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    }
  }, [])

  return (
    <aside className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">BRILink POS</p>
              <p className="text-slate-500 text-xs mt-0.5">Owner Dashboard</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
          </svg>
        </button>
      </div>

      {/* Online Status */}
      <div className={`flex items-center gap-2 px-4 py-2 ${collapsed ? 'justify-center' : ''}`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
        {!collapsed && (
          <span className={`text-xs font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-medium flex-1">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/40">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {!collapsed && profile && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{profile.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{profile.full_name}</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-900/50 text-indigo-300 border border-indigo-800/50">
                Owner
              </span>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          title="Keluar"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="text-sm font-medium">Keluar</span>}
        </button>
      </div>
    </aside>
  )
}

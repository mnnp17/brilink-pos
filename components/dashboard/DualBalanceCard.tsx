'use client'

import { useAccounts } from '@/lib/hooks/useAccounts'
import { calculateTotalDigitalBalance, calculateCashBalance } from '@/lib/utils/balance'
import { formatRupiah } from '@/lib/utils/format'

export function DualBalanceCard() {
  const { data: accounts = [], isLoading } = useAccounts()

  const digitalBalance = calculateTotalDigitalBalance(accounts)
  const cashBalance = calculateCashBalance(accounts)
  const totalBalance = digitalBalance + cashBalance

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-2xl animate-shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Balance */}
      <div className="md:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-900/40">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium">Total Aset Gabungan</p>
          <p className="text-white text-3xl font-bold mt-2 rupiah">{formatRupiah(totalBalance)}</p>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <p className="text-blue-200 text-xs">Kas + Saldo Digital</p>
          </div>
        </div>
      </div>

      {/* Digital Balance */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400 text-sm font-medium">Saldo Digital</p>
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
        <p className="text-white text-2xl font-bold rupiah">{formatRupiah(digitalBalance)}</p>
        <p className="text-slate-500 text-xs mt-2">Total rekening & EDC aktif</p>
      </div>

      {/* Cash Balance */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400 text-sm font-medium">Kas Fisik Laci</p>
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <p className="text-white text-2xl font-bold rupiah">{formatRupiah(cashBalance)}</p>
        <p className="text-slate-500 text-xs mt-2">Uang tunai di laci kasir</p>
      </div>
    </div>
  )
}

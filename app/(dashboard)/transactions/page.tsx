'use client'

import { useState, useEffect } from 'react'
import { X, History } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { ShiftReconciliationBanner } from '@/components/transactions/ShiftReconciliationBanner'
import { TransactionFilterBar } from '@/components/transactions/TransactionFilterBar'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { TransactionCardList } from '@/components/transactions/TransactionCard'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function TransactionsPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const {
    filters,
    setFilter,
    resetFilters,
    filteredTransactions,
    reconciliation,
    isAllMatched,
    accounts,
    isLoading,
  } = useTransactionHistory()

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Redirect Owner or Developer to Owner-exclusive Transaction Report route
  useEffect(() => {
    if (!authLoading && profile && (profile.role === 'owner' || profile.role === 'developer')) {
      router.replace('/reports/transactions')
    }
  }, [profile, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 relative">
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* ── Mobile Sidebar Drawer ────────────────────────────────── */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex w-auto bg-white shadow-2xl">
            <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* ── Page Header ── */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
          {/* Left: Hamburger + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden transition-colors"
              title="Menu Utama"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                <History className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 leading-tight">Riwayat Transaksi</h1>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Rekonsiliasi arus kas shift Anda</p>
              </div>
            </div>
          </div>

          {/* Right: Brand pill */}
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-black tracking-tight text-[#001E36]">BRILink</span>
            <span className="rounded-md bg-[#FF6600] px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wide">POS</span>
          </div>
        </header>

        {/* ── Scrollable Body ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Reconciliation Banner */}
          <ShiftReconciliationBanner
            summaries={reconciliation}
            isAllMatched={isAllMatched}
          />

          {/* Filter Bar */}
          <TransactionFilterBar
            filters={filters}
            accounts={accounts}
            onFilterChange={setFilter}
            onReset={resetFilters}
            resultCount={filteredTransactions.length}
          />

          {/* Data: Desktop Table */}
          <TransactionTable
            transactions={filteredTransactions}
            isLoading={isLoading}
          />

          {/* Data: Mobile Card List */}
          <TransactionCardList
            transactions={filteredTransactions}
            isLoading={isLoading}
          />

          {/* Bottom Padding for mobile safe-area */}
          <div className="h-4" />
        </main>
      </div>
    </div>
  )
}

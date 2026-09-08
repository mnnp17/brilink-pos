'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ShiftReconciliationSummary } from '@/lib/types/transaction'
import { formatRupiah } from '@/lib/utils/format'

interface Props {
  summaries: ShiftReconciliationSummary[]
  isAllMatched: boolean
}

function DeltaChip({ value }: { value: number }) {
  const isPositive = value >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums ${
        isPositive ? 'text-emerald-600' : 'text-rose-600'
      }`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {isPositive ? '+' : ''}{formatRupiah(value)}
    </span>
  )
}

export function ShiftReconciliationBanner({ summaries, isAllMatched }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  if (summaries.length === 0) return null

  return (
    <div
      className={`rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
        isAllMatched
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      {/* ── Header Row ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isAllMatched ? 'bg-emerald-100' : 'bg-amber-100'
            }`}
          >
            {isAllMatched ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
            )}
          </div>
          <div>
            <p className={`text-[13px] font-bold leading-tight ${isAllMatched ? 'text-emerald-800' : 'text-amber-800'}`}>
              Rekonsiliasi Shift
            </p>
            <p className={`text-[11px] font-medium ${isAllMatched ? 'text-emerald-600' : 'text-amber-600'}`}>
              {summaries.length} rekening aktif pada filter ini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
              isAllMatched
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                : 'bg-amber-100 text-amber-700 border-amber-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAllMatched ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            {isAllMatched ? 'MATCH · Sesuai' : 'SELISIH · Periksa Ulang'}
          </span>

          {/* Collapse toggle */}
          <button
            className={`p-1 rounded-lg transition-colors ${
              isAllMatched ? 'hover:bg-emerald-100 text-emerald-500' : 'hover:bg-amber-100 text-amber-500'
            }`}
            aria-label={collapsed ? 'Tampilkan detail' : 'Sembunyikan detail'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Detail Cards ────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {summaries.map((item) => (
            <div
              key={item.accountId}
              className={`rounded-xl p-3.5 border bg-white shadow-xs transition-all ${
                item.isMatched
                  ? 'border-emerald-100'
                  : 'border-amber-200 ring-1 ring-amber-300/50'
              }`}
            >
              {/* Account Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="overflow-hidden">
                  <p className="text-[12px] font-bold text-slate-800 truncate">{item.accountName}</p>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tight">{item.accountNumber}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    item.isMatched
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}
                >
                  {item.isMatched ? '✓ OK' : '! Selisih'}
                </span>
              </div>

              {/* Balance Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Saldo Digital</span>
                  <DeltaChip value={item.digitalBalanceChange} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Kas Laci</span>
                  <DeltaChip value={item.cashLaciChange} />
                </div>
                <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{item.transactionCount} transaksi sukses</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { formatRupiah, formatDateTime } from '@/lib/utils/format'
import type { Shift } from '@/lib/types'

interface ShiftSummaryCardProps {
  shift: Shift
  totalTransactions: number
  totalNominal: number
  totalFee: number
  totalCashIn: number
  totalCashOut: number
  expectedCash: number
  onCloseShift: () => void
}

export function ShiftSummaryCard({
  shift,
  totalTransactions,
  totalNominal,
  totalFee,
  totalCashIn,
  totalCashOut,
  expectedCash,
  onCloseShift,
}: ShiftSummaryCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Shift Aktif</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              OPEN
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Dibuka: {formatDateTime(shift.opened_at)} oleh <span className="text-white font-medium">{shift.kasir_name}</span>
          </p>
        </div>
        <button
          onClick={onCloseShift}
          className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white rounded-xl text-sm font-semibold transition-all"
        >
          Tutup Shift (Closing)
        </button>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-slate-400 text-xs font-medium">Kas Awal Laci</p>
          <p className="text-white text-lg font-bold mt-1 rupiah">{formatRupiah(shift.opening_cash)}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-slate-400 text-xs font-medium">Total Transaksi</p>
          <p className="text-white text-lg font-bold mt-1">{totalTransactions}</p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-slate-400 text-xs font-medium">Volume Total</p>
          <p className="text-white text-lg font-bold mt-1 rupiah">{formatRupiah(totalNominal)}</p>
        </div>
        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-700/30">
          <p className="text-emerald-400 text-xs font-medium">Fee / Profit Kasir</p>
          <p className="text-emerald-300 text-lg font-bold mt-1 rupiah">+{formatRupiah(totalFee)}</p>
        </div>
      </div>

      {/* Cash Register Breakdown */}
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Rekonsiliasi Kas Laci (Real-time)</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>(+) Cash In (Setor Tunai, Fee, PPOB)</span>
            <span className="text-emerald-400 font-medium rupiah">+{formatRupiah(totalCashIn)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>(-) Cash Out (Tarik Tunai)</span>
            <span className="text-red-400 font-medium rupiah">-{formatRupiah(totalCashOut)}</span>
          </div>
          <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-white">
            <span>Kas Laci Saat Ini (Ekspektasi System)</span>
            <span className="text-lg text-emerald-400 rupiah">{formatRupiah(expectedCash)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

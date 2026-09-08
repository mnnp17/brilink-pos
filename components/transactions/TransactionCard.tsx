'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import type { TransactionItem, TransactionStatus } from '@/lib/types/transaction'
import { formatRupiah, formatDateTime } from '@/lib/utils/format'
import { ReceiptActions } from './ReceiptActions'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TransactionStatus, {
  label: string
  borderColor: string
  bgColor: string
  badgeClass: string
  dotClass: string
}> = {
  SUCCESS: {
    label: 'Sukses',
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-white',
    badgeClass: 'badge-success',
    dotClass: 'live-dot-green',
  },
  FAILED: {
    label: 'Gagal',
    borderColor: 'border-l-rose-500',
    bgColor: 'bg-white',
    badgeClass: 'badge-danger',
    dotClass: 'live-dot-red',
  },
  PENDING: {
    label: 'Pending',
    borderColor: 'border-l-amber-400',
    bgColor: 'bg-white',
    badgeClass: 'badge-warning',
    dotClass: 'live-dot-amber',
  },
}

const SERVICE_COLOR: Record<string, string> = {
  TARIK_TUNAI: 'bg-blue-50 text-blue-700 border-blue-200',
  SETOR_TUNAI: 'bg-violet-50 text-violet-700 border-violet-200',
  TRANSFER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PPOB: 'bg-teal-50 text-teal-700 border-teal-200',
  PULSA: 'bg-orange-50 text-orange-700 border-orange-200',
}

function DeltaRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null
  const isPos = value >= 0
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className={`inline-flex items-center gap-1 text-[13px] font-bold tabular-nums ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPos ? <TrendingUp className="w-3 h-3 shrink-0" /> : <TrendingDown className="w-3 h-3 shrink-0" />}
        {isPos ? '+' : ''}{formatRupiah(value)}
      </span>
    </div>
  )
}

// ── Mobile Empty State ────────────────────────────────────────────────────────

function MobileEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-slate-600 font-semibold text-[14px]">Tidak ada transaksi</p>
        <p className="text-slate-400 text-[13px] mt-0.5">Coba ubah filter atau rentang waktu</p>
      </div>
    </div>
  )
}

// ── Single Mobile Card ────────────────────────────────────────────────────────

function TransactionCard({ tx }: { tx: TransactionItem }) {
  const cfg = STATUS_CONFIG[tx.status]
  const serviceColorClass = SERVICE_COLOR[tx.serviceCategory] ?? 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <div
      className={`relative rounded-xl border border-slate-200 border-l-4 ${cfg.borderColor} ${cfg.bgColor} shadow-xs overflow-hidden active:scale-[0.99] transition-transform`}
    >
      {/* Card Top Row */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex-1 min-w-0">
          {/* Service Label */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border mb-2 ${serviceColorClass}`}>
            {tx.serviceName}
          </span>
          {/* Account */}
          <p className="text-[13px] font-bold text-slate-800 leading-tight">{tx.sourceAccount.accountName}</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{tx.receiptNumber}</p>
        </div>

        {/* Status Badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold shrink-0 mt-0.5 ${cfg.badgeClass}`}>
          <span className={`live-dot ${cfg.dotClass}`} />
          {cfg.label}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 mx-4" />

      {/* Card Middle: Target + Time */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[12px] text-slate-500 mb-0.5">Tujuan / Pelanggan</p>
          <p className="text-[13px] font-semibold text-slate-700 truncate">{tx.targetAccount}</p>
          {tx.customerName && (
            <p className="text-[11px] text-slate-400 truncate">{tx.customerName}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[12px] text-slate-500 mb-0.5">Waktu</p>
          <p className="text-[13px] font-semibold text-slate-700 tabular-nums">{formatDateTime(tx.createdAt)}</p>
        </div>
      </div>

      {/* Card Bottom: Delta amounts */}
      <div className="bg-slate-50 px-4 py-3 space-y-2 border-t border-slate-100">
        <DeltaRow label="Saldo Digital" value={tx.digitalAmount} />
        <DeltaRow label="Kas Laci" value={tx.cashAmount} />
        {tx.digitalAmount === 0 && tx.cashAmount === 0 && (
          <p className="text-[12px] text-slate-400 text-center">Tidak ada perubahan saldo</p>
        )}
      </div>

      {/* Notes (if any) */}
      {tx.notes && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
          <p className="text-[11px] text-amber-700">📝 {tx.notes}</p>
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-end px-4 py-3 border-t border-slate-100">
        <ReceiptActions transaction={tx} />
      </div>
    </div>
  )
}

// ── Mobile Card List ──────────────────────────────────────────────────────────

interface Props {
  transactions: TransactionItem[]
  isLoading?: boolean
}

export function TransactionCardList({ transactions, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="lg:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-slate-200/60 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="lg:hidden bg-white rounded-2xl border border-slate-200">
        <MobileEmptyState />
      </div>
    )
  }

  return (
    <div className="lg:hidden space-y-3">
      {transactions.map((tx) => (
        <TransactionCard key={tx.id} tx={tx} />
      ))}
    </div>
  )
}

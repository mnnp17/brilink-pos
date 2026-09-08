'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import type { TransactionItem, TransactionStatus } from '@/lib/types/transaction'
import { formatRupiah, formatTime, formatDate } from '@/lib/utils/format'
import { ReceiptActions } from './ReceiptActions'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TransactionStatus, { label: string; className: string; dot: string }> = {
  SUCCESS: {
    label: 'Sukses',
    className: 'badge-success',
    dot: 'live-dot-green',
  },
  FAILED: {
    label: 'Gagal',
    className: 'badge-danger',
    dot: 'live-dot-red',
  },
  PENDING: {
    label: 'Pending',
    className: 'badge-warning',
    dot: 'live-dot-amber',
  },
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold ${cfg.className}`}>
      <span className={`live-dot ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function DeltaCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-slate-400 text-[12px]">—</span>
  const isPos = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
      {isPos ? <TrendingUp className="w-3 h-3 shrink-0" /> : <TrendingDown className="w-3 h-3 shrink-0" />}
      {isPos ? '+' : ''}{formatRupiah(value)}
    </span>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={8} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-slate-600 font-semibold text-[14px]">Tidak ada transaksi</p>
            <p className="text-slate-400 text-[13px] mt-0.5">Coba ubah filter atau rentang waktu</p>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 bg-slate-200 rounded-full" style={{ width: i === 0 ? '60px' : i === 3 ? '100px' : '80px' }} />
        </td>
      ))}
    </tr>
  )
}

// ── Service Category Label ────────────────────────────────────────────────────

const SERVICE_COLOR: Record<string, string> = {
  TARIK_TUNAI: 'bg-blue-50 text-blue-700 border-blue-200',
  SETOR_TUNAI: 'bg-violet-50 text-violet-700 border-violet-200',
  TRANSFER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PPOB: 'bg-teal-50 text-teal-700 border-teal-200',
  PULSA: 'bg-orange-50 text-orange-700 border-orange-200',
}

function ServiceLabel({ name, category }: { name: string; category: string }) {
  const colorClass = SERVICE_COLOR[category] ?? 'bg-slate-50 text-slate-700 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colorClass}`}>
      {name}
    </span>
  )
}

// ── Main Desktop Table ────────────────────────────────────────────────────────

interface Props {
  transactions: TransactionItem[]
  isLoading?: boolean
}

export function TransactionTable({ transactions, isLoading = false }: Props) {
  return (
    <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Waktu', 'Rekening / EDC', 'Jenis Layanan', 'Tujuan / Pelanggan', 'Saldo Digital', 'Kas Laci', 'Status', 'Aksi'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : transactions.length === 0 ? (
              <EmptyState />
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Waktu */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-[13px] font-semibold text-slate-800 tabular-nums">{formatTime(tx.createdAt)}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(tx.createdAt)}</p>
                  </td>

                  {/* Rekening */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-[13px] font-semibold text-slate-700">{tx.sourceAccount.accountName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{tx.sourceAccount.accountNumber.slice(-8)}</p>
                  </td>

                  {/* Jenis Layanan */}
                  <td className="px-4 py-3.5">
                    <ServiceLabel name={tx.serviceName} category={tx.serviceCategory} />
                  </td>

                  {/* Tujuan / Pelanggan */}
                  <td className="px-4 py-3.5 max-w-[180px]">
                    <p className="text-[13px] text-slate-700 font-medium truncate">{tx.targetAccount}</p>
                    {tx.customerName && (
                      <p className="text-[11px] text-slate-400 truncate">{tx.customerName}</p>
                    )}
                  </td>

                  {/* Saldo Digital */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <DeltaCell value={tx.digitalAmount} />
                  </td>

                  {/* Kas Laci */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <DeltaCell value={tx.cashAmount} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={tx.status} />
                  </td>

                  {/* Aksi */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <ReceiptActions transaction={tx} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

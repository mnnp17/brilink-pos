'use client'

import { useState } from 'react'
import { formatRupiah, formatDateTime } from '@/lib/utils/format'

const TYPE_LABELS: Record<string, string> = {
  setor_tunai: 'Setor Tunai',
  tarik_tunai: 'Tarik Tunai',
  ppob: 'PPOB / Tagihan',
  pulsa: 'Pulsa / Data',
  transfer_internal: 'Transfer Internal',
  cash_drop: 'Cash Drop',
}

export interface ReceiptData {
  transaction_number?: string
  type: string
  nominal: number
  fee_amount: number
  modal_price: number
  sell_price: number
  profit: number
  customer_name?: string
  customer_phone?: string
  [key: string]: unknown
}

interface TransactionReceiptProps {
  data: ReceiptData
  onClose: () => void
}

export function TransactionReceipt({ data, onClose }: TransactionReceiptProps) {
  const isPPOB = ['ppob', 'pulsa'].includes(data.type)
  const [fallbackId] = useState(() => 'TXN-' + Date.now())
  const now = new Date()

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm no-print">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in">
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-700">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Transaksi Berhasil</h2>
          <p className="text-slate-400 text-sm mt-1">{formatDateTime(now)}</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-3">
          <div className="text-center mb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">No. Transaksi</p>
            <p className="text-white font-mono font-bold text-lg mt-1">{data.transaction_number ?? fallbackId}</p>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Jenis</span>
              <span className="text-white font-medium">{TYPE_LABELS[data.type] ?? data.type}</span>
            </div>
            {!isPPOB ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Nominal</span>
                  <span className="text-white rupiah">{formatRupiah(data.nominal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Biaya Admin</span>
                  <span className="text-white rupiah">{formatRupiah(data.fee_amount)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Harga Jual</span>
                  <span className="text-white rupiah">{formatRupiah(data.sell_price)}</span>
                </div>
              </>
            )}
            {data.customer_name && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Nasabah</span>
                <span className="text-white">{data.customer_name}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-xl p-4 border border-blue-500/20">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold">Total Dibayar</span>
              <span className="text-white font-bold text-xl rupiah">
                {formatRupiah(isPPOB ? data.sell_price : data.nominal + data.fee_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-400 text-sm">Laba Toko</span>
              <span className="text-emerald-400 font-semibold text-sm rupiah">+{formatRupiah(data.profit)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3 border-t border-slate-700">
          <button
            id="btn-print-receipt"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Struk
          </button>
          <button
            id="btn-close-receipt"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  )
}

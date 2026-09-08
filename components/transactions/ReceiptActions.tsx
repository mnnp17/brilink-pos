'use client'

import { useState } from 'react'
import { Printer, MessageCircle, X } from 'lucide-react'
import type { TransactionItem } from '@/lib/types/transaction'
import { formatRupiah, formatDateTime } from '@/lib/utils/format'

interface Props {
  transaction: TransactionItem
}

// ── WhatsApp message formatter ────────────────────────────────────────────────

function buildWhatsAppText(tx: TransactionItem): string {
  const statusLabel = tx.status === 'SUCCESS' ? '✅ BERHASIL' : tx.status === 'FAILED' ? '❌ GAGAL' : '⏳ PENDING'
  const digitalSign = tx.digitalAmount >= 0 ? '+' : ''
  const cashSign = tx.cashAmount >= 0 ? '+' : ''

  const lines = [
    `🧾 *NOTA TRANSAKSI*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `No. Struk : ${tx.receiptNumber}`,
    `Waktu     : ${formatDateTime(tx.createdAt)}`,
    `Status    : ${statusLabel}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Layanan   : ${tx.serviceName}`,
    `Rekening  : ${tx.sourceAccount.accountName}`,
    `Tujuan    : ${tx.targetAccount}`,
    tx.customerName ? `Nasabah   : ${tx.customerName}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Saldo Digital : ${digitalSign}${formatRupiah(tx.digitalAmount)}`,
    `Kas Fisik     : ${cashSign}${formatRupiah(tx.cashAmount)}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    tx.notes ? `Catatan: ${tx.notes}` : null,
    ``,
    `_Dikirim via BRILink POS_`,
  ]
    .filter(Boolean)
    .join('\n')

  return encodeURIComponent(lines)
}

// ── Thermal Receipt Print Modal ────────────────────────────────────────────────

interface PrintModalProps {
  tx: TransactionItem
  onClose: () => void
}

function PrintReceiptModal({ tx, onClose }: PrintModalProps) {
  const statusLabel = tx.status === 'SUCCESS' ? 'BERHASIL' : tx.status === 'FAILED' ? 'GAGAL' : 'PENDING'
  const statusColor = tx.status === 'SUCCESS' ? '#059669' : tx.status === 'FAILED' ? '#DC2626' : '#D97706'
  const digitalSign = tx.digitalAmount >= 0 ? '+' : ''
  const cashSign = tx.cashAmount >= 0 ? '+' : ''

  const handlePrint = () => {
    const printContent = document.getElementById('thermal-receipt-content')
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=380,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk - ${tx.receiptNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              width: 80mm;
              padding: 8px;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 15px; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .label { color: #555; }
            .status { font-size: 13px; font-weight: bold; color: ${statusColor}; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="center bold large">BRILink POS</div>
          <div class="center" style="font-size:11px; color:#555;">Agen BRILink Resmi</div>
          <div class="divider"></div>
          <div class="center bold">${tx.serviceName.toUpperCase()}</div>
          <div class="divider"></div>
          <div class="row"><span class="label">No. Struk</span><span>${tx.receiptNumber}</span></div>
          <div class="row"><span class="label">Waktu</span><span>${formatDateTime(tx.createdAt)}</span></div>
          <div class="row"><span class="label">Status</span><span class="status">${statusLabel}</span></div>
          <div class="divider"></div>
          <div class="row"><span class="label">Rekening</span><span>${tx.sourceAccount.accountName}</span></div>
          <div class="row"><span class="label">Tujuan</span><span>${tx.targetAccount}</span></div>
          ${tx.customerName ? `<div class="row"><span class="label">Nasabah</span><span>${tx.customerName}</span></div>` : ''}
          <div class="divider"></div>
          <div class="row"><span class="label">Saldo Digital</span><span>${digitalSign}${formatRupiah(tx.digitalAmount)}</span></div>
          <div class="row"><span class="label">Kas Fisik</span><span>${cashSign}${formatRupiah(tx.cashAmount)}</span></div>
          <div class="divider"></div>
          ${tx.notes ? `<div style="font-size:11px;color:#555;margin-top:4px;">* ${tx.notes}</div><div class="divider"></div>` : ''}
          <div class="center" style="font-size:10px;color:#888;margin-top:8px;">Terima kasih telah menggunakan layanan kami</div>
          <div class="center" style="font-size:10px;color:#888;">Simpan struk ini sebagai bukti transaksi</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    // printWindow.close()  // optionally auto-close after print
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-[14px] font-bold text-slate-800">Pratinjau Struk</p>
            <p className="text-[11px] text-slate-400 font-mono">{tx.receiptNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Preview */}
        <div id="thermal-receipt-content" className="p-5">
          <div
            className="font-mono text-[11px] bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1 leading-relaxed"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            <div className="text-center font-bold text-[13px]">BRILink POS</div>
            <div className="text-center text-slate-500 text-[10px]">Agen BRILink Resmi</div>
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="text-center font-bold">{tx.serviceName.toUpperCase()}</div>
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="flex justify-between"><span className="text-slate-500">No. Struk</span><span className="font-medium">{tx.receiptNumber.slice(-8)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Waktu</span><span>{formatDateTime(tx.createdAt)}</span></div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-bold ${tx.status === 'SUCCESS' ? 'text-emerald-600' : tx.status === 'FAILED' ? 'text-rose-600' : 'text-amber-600'}`}>
                {statusLabel}
              </span>
            </div>
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="flex justify-between"><span className="text-slate-500">Rekening</span><span>{tx.sourceAccount.accountName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tujuan</span><span>{tx.targetAccount}</span></div>
            {tx.customerName && <div className="flex justify-between"><span className="text-slate-500">Nasabah</span><span>{tx.customerName}</span></div>}
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="flex justify-between">
              <span className="text-slate-500">Saldo Digital</span>
              <span className={tx.digitalAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {digitalSign}{formatRupiah(tx.digitalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kas Fisik</span>
              <span className={tx.cashAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {cashSign}{formatRupiah(tx.cashAmount)}
              </span>
            </div>
            {tx.notes && (
              <>
                <div className="border-t border-dashed border-slate-300 my-2" />
                <div className="text-slate-500 text-[10px]">* {tx.notes}</div>
              </>
            )}
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="text-center text-slate-400 text-[10px] pt-1">Terima kasih atas kepercayaan Anda</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            id="btn-print-struk"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[13px] font-semibold rounded-xl transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
          <button
            id={`btn-wa-${tx.id}`}
            onClick={() => {
              const phone = tx.customerName ? '' : '' // could pre-fill if phone known
              window.open(`https://wa.me/${phone}?text=${buildWhatsAppText(tx)}`, '_blank')
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[13px] font-semibold rounded-xl transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            Kirim WA
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Public Component ──────────────────────────────────────────────────────────

export function ReceiptActions({ transaction }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          id={`btn-open-receipt-${transaction.id}`}
          onClick={() => setShowModal(true)}
          title="Cetak / Kirim Struk"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[12px] font-medium transition-all active:scale-95"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Struk</span>
        </button>
        <button
          id={`btn-wa-quick-${transaction.id}`}
          onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppText(transaction)}`, '_blank')}
          title="Kirim via WhatsApp"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C4A] text-[12px] font-medium transition-all active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">WA</span>
        </button>
      </div>

      {showModal && (
        <PrintReceiptModal tx={transaction} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

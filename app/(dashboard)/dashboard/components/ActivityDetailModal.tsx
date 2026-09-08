'use client';

import React from 'react';
import { X, FileText, Info } from 'lucide-react';
import { CashierActivityLog } from '@/types/activity-log';
import { formatRupiah } from '@/lib/utils/format';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: CashierActivityLog | null;
}

export function ActivityDetailModal({ isOpen, onClose, log }: ActivityDetailModalProps) {
  if (!isOpen || !log) return null;

  // Resolve Activity Type Label
  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'TRANSACTION': return '🛒 TRANSAKSI POS KASIR';
      case 'REBALANCE': return '🔄 PEMINDAHAN SALDO (REBALANCE)';
      case 'SHIFT_START': return '🚪 PEMBUKAAN SHIFT';
      case 'SHIFT_END': return '🚪 PENUTUPAN SHIFT';
      case 'EXPENSE_ADD': return '💸 PENGELUARAN OPEX TOKO';
      case 'VOID_TRANSACTION': return '⚠️ PEMBATALAN TRANSAKSI (VOID)';
      case 'ADMIN_OVERRIDE': return '⚙️ OVERRIDE ADMIN MANUAL';
      default: return type;
    }
  };

  const getDampakDuit = (changeAmount: number) => {
    if (changeAmount > 0) return `+${formatRupiah(changeAmount)}`;
    return `-${formatRupiah(Math.abs(changeAmount))}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-300" />
            <div>
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Detail Audit Log</span>
              <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">Detail Aktivitas Operasional</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-[12px] text-slate-600 font-semibold max-h-[75vh] overflow-y-auto font-sans">
          
          {/* Metadata Grid */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
              <span className="text-slate-400">ID LOG:</span>
              <span className="text-slate-800 font-mono font-bold uppercase">{log.id.replace('log-', '#LOG-')}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
              <span className="text-slate-400">Waktu Eksekusi:</span>
              <span className="text-slate-800 font-bold">
                {new Date(log.timestamp).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}, {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
              <span className="text-slate-400">Staf Pelaksana:</span>
              <span className="text-slate-800 font-bold">{log.cashierName} (ID: {log.cashierId})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tipe Aktivitas:</span>
              <span className="text-blue-600 font-extrabold">{getActivityTypeLabel(log.activityType)}</span>
            </div>
          </div>

          {/* Balance Impacts */}
          {log.impacts && log.impacts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase font-black tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>Rincian Dampak Perubahan Saldo</span>
              </div>

              <div className="space-y-3">
                {log.impacts.map((imp) => (
                  <div key={imp.accountId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <p className="font-extrabold text-slate-800 border-b border-slate-200/50 pb-1">{imp.accountName}</p>
                    <div className="grid grid-cols-3 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block">Sebelum</span>
                        <span className="font-mono text-slate-700">{formatRupiah(imp.balanceBefore)}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-400 block">Perubahan</span>
                        <span className={`font-mono font-extrabold ${imp.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {getDampakDuit(imp.changeAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">Sesudah</span>
                        <span className="font-mono text-slate-800 font-bold">{formatRupiah(imp.balanceAfter)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1">Catatan Staf</span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 italic font-medium">
              "{log.notes || 'Tidak ada catatan tambahan.'}"
            </div>
          </div>

          {/* Device Info */}
          <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Terminal/Perangkat:</span>
            <span className="font-mono font-bold text-slate-500">{log.deviceInfo || 'POS-TERMINAL-01 (192.168.1.15)'}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-all text-[12px] cursor-pointer"
          >
            Tutup Audit
          </button>
        </div>
      </div>
    </div>
  );
}

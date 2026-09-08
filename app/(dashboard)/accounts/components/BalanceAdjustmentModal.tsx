'use client';

import React, { useState, useEffect } from 'react';
import { FinancialAccount, BalanceAdjustmentPayload, AdjustmentReason } from '../types/account-master';
import { X, RefreshCw } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';
import { toast } from 'sonner';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface BalanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: FinancialAccount | null;
  onAdjust: (payload: BalanceAdjustmentPayload) => void;
}

const REASON_LABELS: Record<AdjustmentReason, string> = {
  BANK_ADMIN_FEE: 'Biaya Administrasi Bank',
  BANK_INTEREST: 'Bunga Tabungan Bank',
  INPUT_CORRECTION: 'Koreksi Kesalahan Input',
  AUDIT_DIFFERENCE: 'Selisih Hasil Audit Kas',
  OTHER: 'Lainnya',
};

export function BalanceAdjustmentModal({
  isOpen,
  onClose,
  account,
  onAdjust,
}: BalanceAdjustmentModalProps) {
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [reason, setReason] = useState<AdjustmentReason>('INPUT_CORRECTION');
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && account) {
      setActualBalanceInput(String(account.currentBalance));
      setReason('INPUT_CORRECTION');
      setOtherReason('');
      setNotes('');
    }
  }, [isOpen, account]);

  if (!isOpen || !account) return null;

  const currentBalance = account.currentBalance;
  const actualBalance = parseFloat(actualBalanceInput) || 0;
  const discrepancy = actualBalance - currentBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (discrepancy === 0) {
      toast.error('Saldo aktual sama dengan saldo tercatat. Tidak ada penyesuaian yang perlu dibuat!');
      return;
    }

    if (reason === 'OTHER' && !otherReason.trim()) {
      toast.error('Jenis alasan penyesuaian (Lainnya) wajib diisi!');
      return;
    }

    if (!notes.trim()) {
      toast.error('Kolom catatan wajib diisi!');
      return;
    }

    const finalNotes = reason === 'OTHER' 
      ? `[${otherReason.trim()}] ${notes.trim()}` 
      : notes.trim();

    onAdjust({
      accountId: account.id,
      actualBalance,
      reasonCategory: reason,
      notes: finalNotes,
      executedBy: 'Owner Toko',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-fade-in">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-300 animate-spin-once" />
            <div>
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Koreksi Saldo</span>
              <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">Adjustment Saldo Manual</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-[12px] text-slate-600 font-semibold">
          
          {/* Account Info */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Rekening Terpilih</span>
            <p className="font-extrabold text-slate-800 text-[12.5px]">{account.accountName}</p>
            <p className="text-[10.5px] font-mono text-slate-400 leading-none">
              Saldo Saat Ini: <span className="font-bold text-slate-700">{formatRupiah(currentBalance)}</span>
            </p>
          </div>

          {/* Actual Balance Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Saldo Aktual Sebenarnya (Rp)</label>
            <input
              type="number"
              required
              placeholder="Masukkan nominal saldo fisik/bank riil..."
              value={actualBalanceInput}
              onChange={(e) => setActualBalanceInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800 text-[12.5px]"
            />
          </div>

          {/* Discrepancy Preview */}
          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="text-slate-400">Selisih Penyesuaian:</span>
            <span className={`font-mono font-black text-[12px] ${
              discrepancy === 0 ? 'text-slate-600' : discrepancy > 0 ? 'text-emerald-600' : 'text-rose-500'
            }`}>
              {discrepancy > 0 ? `+${formatRupiah(discrepancy)}` : discrepancy < 0 ? `-${formatRupiah(Math.abs(discrepancy))}` : 'Rp 0'}
            </span>
          </div>

          {/* Reason Category */}
          <div>
            <CustomSelect
              label="Alasan Penyesuaian"
              value={reason}
              onChange={(v) => setReason(v as AdjustmentReason)}
              minWidth="100%"
              options={(Object.keys(REASON_LABELS) as AdjustmentReason[]).map((key) => ({
                value: key,
                label: REASON_LABELS[key],
              }))}
            />
          </div>

          {/* Custom Reason Input for 'OTHER' */}
          {reason === 'OTHER' && (
            <div className="animate-fade-in">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tuliskan Alasan Lainnya</label>
              <input
                type="text"
                required
                placeholder="Masukkan jenis penyesuaian..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-bold text-slate-800 text-[12.5px]"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Catatan / Penjelasan Detail</label>
            <textarea
              rows={2.5}
              required
              placeholder="Contoh: Potongan bulanan adm bank Mandiri, koreksi kas laci..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Simpan Penyesuaian
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

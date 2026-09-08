'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FinancialAccount, RebalancePayload } from '../types/account-master';
import { X, ArrowRightLeft } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';
import { toast } from 'sonner';
import { GroupedSelect } from '@/components/ui/GroupedSelect';
import { DropdownGroup } from '@/types/ui';

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  onRebalance: (payload: RebalancePayload) => void;
  defaultFromId?: string;
  defaultToId?: string;
  defaultAmount?: number;
}

export function RebalanceModal({
  isOpen,
  onClose,
  accounts,
  onRebalance,
  defaultFromId = '',
  defaultToId = '',
  defaultAmount = 0,
}: RebalanceModalProps) {
  const activeAccounts = accounts.filter(a => a.isActive);
  
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');

  // Update fromId with default when accounts arrive
  useEffect(() => {
    if (isOpen) {
      setFromId(defaultFromId || activeAccounts[0]?.id || '');
      setToId(defaultToId || activeAccounts[1]?.id || '');
      setAmountInput(defaultAmount > 0 ? String(defaultAmount) : '');
      setNotes('');
    }
  }, [isOpen, defaultFromId, defaultToId, defaultAmount, activeAccounts]);

  // Handle outside click
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        // Only close if it's not a select dropdown click (radix portal issue)
        const target = e.target as HTMLElement;
        if (!target.closest('[role="listbox"]') && !target.closest('[data-radix-select-content]')) {
          onClose();
        }
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build groups for GroupedSelect
  const accountGroups: DropdownGroup[] = [
    {
      groupLabel: 'KAS FISIK',
      options: activeAccounts
        .filter((a) => a.accountType === 'CASH_DRAWER')
        .map((a) => ({
          value: a.id,
          label: a.accountName,
          description: `Saldo: ${formatRupiah(a.currentBalance)}`,
        })),
    },
    {
      groupLabel: 'REKENING BANK & EDC',
      options: activeAccounts
        .filter((a) => a.accountType === 'BANK_ACCOUNT' || a.accountType === 'EDC_MERCHANT')
        .map((a) => ({
          value: a.id,
          label: a.accountName,
          description: `Saldo: ${formatRupiah(a.currentBalance)}`,
        })),
    },
    {
      groupLabel: 'PPOB & AGREGATOR',
      options: activeAccounts
        .filter((a) => a.accountName.toLowerCase().includes('ppob') || a.accountName.toLowerCase().includes('agregator'))
        .map((a) => ({
          value: a.id,
          label: a.accountName,
          description: `Saldo: ${formatRupiah(a.currentBalance)}`,
        })),
    }
  ].filter((g) => g.options.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(amountInput) || 0;
    if (amt <= 0) {
      toast.error('Nominal pemindahan saldo wajib diisi!');
      return;
    }

    if (fromId === toId) {
      toast.error('Akun asal dan akun tujuan tidak boleh sama!');
      return;
    }

    const fromAcc = activeAccounts.find(a => a.id === fromId);
    if (!fromAcc) return;

    if (fromAcc.currentBalance < amt) {
      toast.error(`Saldo ${fromAcc.accountName} tidak mencukupi!`);
      return;
    }

    onRebalance({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: amt,
      notes: notes.trim(),
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
            <ArrowRightLeft className="w-5 h-5 text-blue-300" />
            <div>
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Rebalancing Saldo</span>
              <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">Pemindahan Saldo Internal</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-[12px] text-slate-600 font-semibold">
          
          {/* Source Account */}
          <div className="mb-2">
            <GroupedSelect
              id="fromId"
              label="Dari Akun (Sumber)"
              placeholder="Pilih akun sumber..."
              groups={accountGroups}
              value={fromId}
              onChange={setFromId}
            />
          </div>

          {/* Destination Account */}
          <div className="mb-2">
            <GroupedSelect
              id="toId"
              label="Ke Akun (Tujuan)"
              placeholder="Pilih akun tujuan..."
              groups={accountGroups}
              value={toId}
              onChange={setToId}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nominal Pemindahan (Rp)</label>
            <input
              type="number"
              required
              placeholder="Masukkan nominal, contoh: 5000000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800 text-[12.5px]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Catatan / Keterangan Mutasi</label>
            <textarea
              rows={2.5}
              placeholder="Sebutkan keperluan rebalancing saldo..."
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
              🚀 Pindahkan Saldo
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { FinancialAccount, AccountMutation } from '../types/account-master';
import { X, FileText, ArrowUpRight, ArrowDownLeft, Info } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';

interface AccountMutationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: FinancialAccount | null;
  mutations: AccountMutation[];
}

export function AccountMutationDrawer({
  isOpen,
  onClose,
  account,
  mutations,
}: AccountMutationDrawerProps) {
  if (!isOpen || !account) return null;

  // Filter mutations for this specific account
  const accountMutations = mutations
    .filter((m) => m.accountId === account.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Resolve Mutation Type Label
  const getMutationLabel = (type: string) => {
    switch (type) {
      case 'POS_TRANSACTION': return 'Transaksi POS';
      case 'INTERNAL_REBALANCE': return 'Rebalance';
      case 'STORE_EXPENSE': return 'OPEX Toko';
      case 'MANUAL_ADJUSTMENT': return 'Adjustment';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      {/* Centered Modal Panel */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[80vh] animate-fade-in">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-300" />
            <div>
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Buku Mutasi Kas</span>
              <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5 truncate max-w-[280px]">
                {account.accountName}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Account Info Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex justify-between items-center text-[11px] shrink-0">
          <div>
            <span className="text-slate-400 block font-semibold leading-none">Nomor / TID</span>
            <span className="font-mono text-slate-700 font-bold mt-1 block">{account.accountNumberOrTid || '-'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block font-semibold leading-none">Saldo Saat Ini</span>
            <span className="text-[14px] text-blue-700 font-black tabular-nums mt-0.5 block">{formatRupiah(account.currentBalance)}</span>
          </div>
        </div>

        {/* Scrollable Mutation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {accountMutations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-1">
              <Info className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-[12px]">Belum ada riwayat mutasi untuk akun ini.</p>
              <p className="text-[10px]">Seluruh transaksi penarikan, penyetoran, atau penyesuaian akan tercatat di sini.</p>
            </div>
          ) : (
            accountMutations.map((mut) => {
              const isDebit = mut.direction === 'IN';
              
              // Badge color style
              let typeColor = 'bg-slate-100 text-slate-600';
              if (mut.mutationType === 'POS_TRANSACTION') typeColor = 'bg-blue-50 text-blue-600 border border-blue-200/50';
              else if (mut.mutationType === 'INTERNAL_REBALANCE') typeColor = 'bg-indigo-50 text-indigo-600 border border-indigo-200/50';
              else if (mut.mutationType === 'STORE_EXPENSE') typeColor = 'bg-rose-50 text-rose-600 border border-rose-200/50';
              else if (mut.mutationType === 'MANUAL_ADJUSTMENT') typeColor = 'bg-amber-50 text-amber-600 border border-amber-200/50';

              return (
                <div key={mut.id} className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2 hover:shadow-xs transition-shadow">
                  {/* Row 1: Timestamp & Badge */}
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-400 font-bold">
                      {new Date(mut.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(mut.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${typeColor}`}>
                      {getMutationLabel(mut.mutationType)}
                    </span>
                  </div>

                  {/* Row 2: Direction, Amount, Description */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDebit
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-rose-50 border-rose-200 text-rose-600'
                      }`}>
                        {isDebit ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-[12px] text-slate-800 leading-tight">
                          {isDebit ? '+' : '-'}{formatRupiah(mut.amount)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight">
                          {mut.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right leading-tight">
                      <span className="text-[9.5px] text-slate-400 block font-semibold">Saldo Akhir</span>
                      <span className="text-[11.5px] font-bold text-slate-700 font-mono tabular-nums">
                        {formatRupiah(mut.balanceAfter)}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Operator log */}
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-[9.5px] text-slate-400 leading-none">
                    <span>Operator: {mut.executedBy}</span>
                    <span className="font-mono text-[9px] uppercase">{mut.id.substring(0, 10)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[12px] cursor-pointer"
          >
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}

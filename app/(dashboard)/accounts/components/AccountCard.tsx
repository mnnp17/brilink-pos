'use client';

import React from 'react';
import { FinancialAccount } from '../types/account-master';
import { formatRupiah } from '@/lib/utils/format';
import { Wallet, CreditCard, Smartphone, AlertCircle, RefreshCw, FileText, Settings } from 'lucide-react';

interface AccountCardProps {
  account: FinancialAccount;
  onAdjust: (account: FinancialAccount) => void;
  onMutations: (account: FinancialAccount) => void;
  onEdit: (account: FinancialAccount) => void;
}

export function AccountCard({ account, onAdjust, onMutations, onEdit }: AccountCardProps) {
  const isBelowThreshold = account.currentBalance < account.minBalanceThreshold;

  // Resolve Icon
  const getIcon = () => {
    switch (account.accountType) {
      case 'CASH_DRAWER':
        return <Wallet className="w-4.5 h-4.5" />;
      case 'BANK_ACCOUNT':
        return <CreditCard className="w-4.5 h-4.5" />;
      case 'EDC_MERCHANT':
        return <Smartphone className="w-4.5 h-4.5" />;
      default:
        return <Wallet className="w-4.5 h-4.5" />;
    }
  };

  // Resolve Account Type label
  const getTypeLabel = () => {
    switch (account.accountType) {
      case 'CASH_DRAWER': return 'Kas Laci';
      case 'BANK_ACCOUNT': return 'Rekening Bank';
      case 'EDC_MERCHANT': return 'Merchant EDC';
      default: return account.accountType;
    }
  };

  // Color Mapping
  const color = account.colorCode || 'slate';
  const borderClass = isBelowThreshold
    ? 'border-rose-400 bg-rose-50/10'
    : 'border-slate-200 hover:border-slate-300 bg-white';

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    rose: 'bg-rose-50 border-rose-200 text-rose-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
  };
  const colorClass = colorMap[color] || colorMap.slate;

  return (
    <div className={`rounded-3xl border p-4.5 shadow-xs flex flex-col justify-between h-[230px] transition-all font-sans relative ${borderClass}`}>
      
      {/* Top row */}
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${colorClass}`}>
            {getIcon()}
          </div>

          <div className="flex items-center gap-1.5">
            {isBelowThreshold && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-300">
                <AlertCircle className="w-2.5 h-2.5" />
                <span>Limit Kritis</span>
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
              account.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              {account.isActive ? 'AKTIF' : 'NON-AKTIF'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            {getTypeLabel()} {account.bankName ? `(${account.bankName})` : ''}
          </span>
          <h3 className="font-extrabold text-[13.5px] text-slate-800 leading-tight mt-0.5 truncate">
            {account.accountName}
          </h3>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none">
            {account.accountNumberOrTid || '-'}
          </p>
        </div>
      </div>

      {/* Balance & Actions */}
      <div className="pt-3.5 border-t border-slate-100 space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[9.5px] text-slate-400 block font-semibold leading-none">Saldo Akun</span>
            <span className="text-[16px] font-black text-slate-800 tabular-nums mt-1 block">
              {formatRupiah(account.currentBalance)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[8.5px] text-slate-400 font-bold block leading-none">Min Threshold</span>
            <span className="text-[10px] font-mono font-bold text-slate-500 tabular-nums mt-0.5 block">
              {formatRupiah(account.minBalanceThreshold)}
            </span>
          </div>
        </div>

        {/* 3 Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-extrabold">
          <button
            onClick={() => onAdjust(account)}
            className="flex items-center justify-center gap-1 py-1.5 px-1 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50/20 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span>Adjust</span>
          </button>
          <button
            onClick={() => onMutations(account)}
            className="flex items-center justify-center gap-1 py-1.5 px-1 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/20 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Mutasi</span>
          </button>
          <button
            onClick={() => onEdit(account)}
            className="flex items-center justify-center gap-1 py-1.5 px-1 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <Settings className="w-3 h-3 text-slate-400" />
            <span>Edit</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}

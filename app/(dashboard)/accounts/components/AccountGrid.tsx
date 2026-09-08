'use client';

import React, { useState } from 'react';
import { FinancialAccount } from '../types/account-master';
import { AccountCard } from './AccountCard';
import { Search, Filter } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface AccountGridProps {
  accounts: FinancialAccount[];
  onAdjust: (account: FinancialAccount) => void;
  onMutations: (account: FinancialAccount) => void;
  onEdit: (account: FinancialAccount) => void;
}

export function AccountGrid({ accounts, onAdjust, onMutations, onEdit }: AccountGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = acc.accountName.toLowerCase().includes(q);
      const matchNo = acc.accountNumberOrTid?.toLowerCase().includes(q);
      const matchBank = acc.bankName?.toLowerCase().includes(q);
      if (!matchName && !matchNo && !matchBank) return false;
    }

    // 2. Type Filter
    if (typeFilter !== 'ALL' && acc.accountType !== typeFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Search & Filters Bar */}
      <div className="bg-white p-3.5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari nama rekening, nomor akun, TID, atau bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] outline-none focus:bg-white focus:border-blue-400 text-slate-700 font-semibold"
          />
        </div>

        {/* Filter Dropdown */}
        <CustomSelect
          label="Tipe Akun"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v)}
          minWidth="180px"
          options={[
            { value: 'ALL', label: 'Semua Jenis Akun' },
            { value: 'CASH_DRAWER', label: 'Kas Laci Tunai' },
            { value: 'BANK_ACCOUNT', label: 'Rekening Bank' },
            { value: 'EDC_MERCHANT', label: 'Mesin EDC Merchant' },
          ]}
        />
      </div>

      {/* Grid Cards list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAccounts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-bold bg-white border border-slate-200 rounded-3xl">
            Tidak ditemukan rekening/EDC yang cocok dengan pencarian Anda.
          </div>
        ) : (
          filteredAccounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onAdjust={onAdjust}
              onMutations={onMutations}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}

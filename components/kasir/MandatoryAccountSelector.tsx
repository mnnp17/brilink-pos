'use client';

import React from 'react';

export interface AccountItem {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  minThreshold: number;
}

interface MandatoryAccountSelectorProps {
  accounts: AccountItem[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

export function MandatoryAccountSelector({
  accounts,
  selectedAccountId,
  onSelectAccount,
}: MandatoryAccountSelectorProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
          <span>💳</span> REKENING / EDC DIGITAL SUMBER <span className="text-red-500">* (Wajib Pilih)</span>
        </label>
        <span className="text-[11px] text-gray-400">Geser untuk melihat semua EDC</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {accounts.map((acc) => {
          const isSelected = acc.id === selectedAccountId;
          const isBelowThreshold = acc.balance <= acc.minThreshold;

          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className={`flex-shrink-0 w-64 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border-2 relative ${
                isSelected
                  ? 'border-[#FF6600] bg-[#FFF0E6] shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {/* Checkmark indicator */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#FF6600] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                  ✓
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 truncate pr-6">{acc.name}</p>
                <p className="text-xs font-mono text-gray-400">{acc.accountNumber}</p>
                <p
                  className={`text-base font-extrabold ${
                    isBelowThreshold ? 'text-red-600' : 'text-[#00529C]'
                  }`}
                >
                  Rp {acc.balance.toLocaleString('id-ID')}
                </p>
              </div>

              {isBelowThreshold && (
                <div className="mt-2.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1 flex items-center gap-1 text-[10px] text-red-700 font-bold">
                  <span>⚠️</span> Saldo Kritis (&lt; Rp {acc.minThreshold.toLocaleString('id-ID')})
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

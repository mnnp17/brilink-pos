'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';

export interface AccountOption {
  id: string;
  name: string;
  account_number: string;
  balance: number;
  min_threshold: number;
}

interface AccountSelectorProps {
  value: string;
  onChange: (accountId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function AccountSelector({
  value,
  onChange,
  error,
  disabled = false,
}: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      const supabase = createClient();
      const { data } = await supabase.from('accounts').select('id, name, account_number, balance, min_threshold');
      if (data) setAccounts(data as unknown as AccountOption[]);
      setLoading(false);
    }
    fetchAccounts();
  }, []);

  const selectedAccount = accounts.find((a) => a.id === value);
  const isBelowThreshold = selectedAccount
    ? selectedAccount.balance <= selectedAccount.min_threshold
    : false;

  return (
    <div className="w-full flex flex-col gap-2">
      <CustomSelect
        label="Pilih Rekening / EDC Digital"
        value={value}
        onChange={(v) => onChange(v)}
        minWidth="100%"
        options={[
          { value: '', label: loading ? 'Memuat Rekening...' : '-- Pilih Rekening Sumber --' },
          ...accounts.map((acc) => ({
            value: acc.id,
            label: `${acc.name} (${acc.account_number}) - Rp ${acc.balance.toLocaleString('id-ID')}`,
          })),
        ]}
      />

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {selectedAccount && (
        <div className="flex justify-between items-center text-xs px-1 mt-1">
          <span className="text-gray-500">
            Saldo Aktif: <strong className="text-gray-800">Rp {selectedAccount.balance.toLocaleString('id-ID')}</strong>
          </span>
          {isBelowThreshold && (
            <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              ⚠️ Di bawah ambang batas (Rp {selectedAccount.min_threshold.toLocaleString('id-ID')})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

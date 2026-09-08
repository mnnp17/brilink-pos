'use client';

import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Bell, HelpCircle, ChevronDown, Wallet, Check, Menu } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatRupiah } from '@/lib/utils/format';
import { getStoreAccounts } from '@/lib/actions/shift.actions';
import { UserDropdown } from './UserDropdown';
import { FastRebalanceButton } from '../pos/FastRebalanceButton';

export interface AccountOption {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  type: 'bank' | 'cash';
}

const DEFAULT_ACCOUNTS: AccountOption[] = [
  {
    id: 'fallback-cash',
    name: 'Kas Laci Fisik',
    accountNumber: 'CASH-LACI',
    balance: 5000000,
    type: 'cash',
  },
  {
    id: 'fallback-edc',
    name: 'EDC Mobile BRILink',
    accountNumber: 'EDC-BRI',
    balance: 10000000,
    type: 'bank',
  }
];


interface HeaderProps {
  selectedAccountId?: string;
  onAccountChange?: (id: string) => void;
  onMenuClick?: () => void;
  onRebalanceClick?: () => void;
  accounts?: AccountOption[];
}

export function Header({ selectedAccountId = '1', onAccountChange, onMenuClick, onRebalanceClick, accounts: propAccounts }: HeaderProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>(DEFAULT_ACCOUNTS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync propAccounts if provided
  useEffect(() => {
    if (propAccounts && propAccounts.length > 0) {
      setAccounts(propAccounts);
    }
  }, [propAccounts]);

  useEffect(() => {
    const loadAccounts = async () => {
      if (propAccounts && propAccounts.length > 0) return; // Skip loading if propAccounts is provided

      // 1. Try to load from Supabase database if authenticated
      if (profile?.id) {
        try {
          const res = await getStoreAccounts();
          if (res.success && res.data && res.data.length > 0) {
            const mapped: AccountOption[] = res.data.map((acc) => ({
              id: acc.id,
              name: acc.name,
              accountNumber: acc.account_number || '',
              balance: Number(acc.balance) || 0,
              type: acc.type === 'CASH_DRAWER' ? 'cash' : 'bank',
            }));
            setAccounts(mapped);
            return;
          }
        } catch (err) {
          console.error('Error fetching accounts from Supabase in Header:', err);
        }
      }

      // 2. Default fallback if empty
      setAccounts(DEFAULT_ACCOUNTS);
    };

    loadAccounts();
    window.addEventListener('accounts-updated', loadAccounts);
    window.addEventListener('storage', loadAccounts);
    return () => {
      window.removeEventListener('accounts-updated', loadAccounts);
      window.removeEventListener('storage', loadAccounts);
    };
  }, [profile]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1500);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
      {/* Left: Hamburger + Brand */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            title="Menu Utama"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[17px] font-black tracking-tight text-[#001E36]">BRILink</span>
          <span className="rounded-md bg-[#FF6600] px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wide">POS</span>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Account Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-white"
          >
            <Wallet className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="max-w-[80px] sm:max-w-[160px] truncate">
              {selectedAccount ? (
                <>
                  {selectedAccount.name.split(' ').slice(0, 2).join(' ')}
                  <span className="hidden sm:inline text-slate-400"> ({selectedAccount.accountNumber.slice(-4)})</span>
                </>
              ) : (
                'Tidak Ada Rekening'
              )}
            </span>
            <span className="font-bold text-[#001E36] text-[12px] sm:text-[13px]">
              {formatRupiah(selectedAccount?.balance ?? 0)}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[320px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Rekening Aktif
              </p>
              {accounts.map((acc) => {
                const isSelected = acc.id === selectedAccountId;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      onAccountChange?.(acc.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      acc.type === 'cash' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{acc.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{acc.accountNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-slate-900">{formatRupiah(acc.balance)}</p>
                      {isSelected && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {onRebalanceClick && (
          <FastRebalanceButton onClick={onRebalanceClick} />
        )}

        {/* Sync Button */}
        <button
          onClick={handleSync}
          className="flex items-center gap-1.5 rounded-xl bg-[#1D68A7] px-2.5 sm:px-3 py-1.5 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{syncing ? 'Sinkronisasi...' : 'Sync Online'}</span>
        </button>

        {/* Icon buttons */}
        <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>
        {/* Avatar */}
        <UserDropdown userProfile={profile} />
      </div>
    </header>
  );
}

export { DEFAULT_ACCOUNTS };

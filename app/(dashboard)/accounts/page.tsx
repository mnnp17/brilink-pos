'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AIChatDrawer } from '@/components/ai/AIChatDrawer';
import { useAuth } from '@/lib/hooks/useAuth';
import { Plus, Wallet, Lock, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

// Master Types & Components
import { FinancialAccount, AccountMutation, RebalancePayload, BalanceAdjustmentPayload, AccountType } from './types/account-master';
import { AccountHeader } from './components/AccountHeader';
import { AILiquidityBanner } from './components/AILiquidityBanner';
import { AccountGrid } from './components/AccountGrid';
import { AccountFormModal } from './components/AccountFormModal';
import { RebalanceModal } from './components/RebalanceModal';
import { BalanceAdjustmentModal } from './components/BalanceAdjustmentModal';
import { AccountMutationDrawer } from './components/AccountMutationDrawer';
import { getStoreAccounts } from '@/lib/actions/shift.actions';
import { createAccountAction, adjustAccountBalanceAction, getAccountMutationsAction } from '@/lib/actions/owner';
import { executeRebalanceAction } from '@/lib/actions/pos';

const INITIAL_ACCOUNTS: FinancialAccount[] = [];

const INITIAL_MUTATIONS: AccountMutation[] = [];


export default function AccountsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Master States
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [mutations, setMutations] = useState<AccountMutation[]>([]);

  // Selection states for modals trigger
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  
  // Modals visibility states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pre-fill Rebalance suggestion state
  const [suggestedFromId, setSuggestedFromId] = useState('');
  const [suggestedToId, setSuggestedToId] = useState('');
  const [suggestedAmount, setSuggestedAmount] = useState(0);

  // Load master data on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await getStoreAccounts();
        if (res.success && res.data && res.data.length > 0) {
          const dbAccounts = res.data.map((acc: any) => {
            const accountType = (acc.type === 'CASH_DRAWER' ? 'CASH_DRAWER' : acc.type === 'EDC_TERMINAL' ? 'EDC_MERCHANT' : 'BANK_ACCOUNT') as AccountType;
            return {
              id: acc.id,
              accountName: acc.name,
              accountType,
              bankName: acc.bank_name || '',
              accountNumberOrTid: acc.account_number || '',
              currentBalance: Number(acc.balance) || 0,
              minBalanceThreshold: Number(acc.min_threshold) || 5000000,
              isActive: acc.is_active !== false,
              colorCode: acc.color_hex || 'blue',
              lastMutatedAt: acc.updated_at || new Date().toISOString(),
              createdAt: acc.created_at || new Date().toISOString(),
              updatedAt: acc.updated_at || new Date().toISOString(),
              
              // Compatibility fields
              name: acc.name,
              accountNumber: acc.account_number || '',
              balance: Number(acc.balance) || 0,
              type: acc.type === 'CASH_DRAWER' ? ('cash' as const) : ('bank' as const),
            };
          });

          setAccounts(dbAccounts);
        } else {
          setAccounts([]);
        }
      } catch (err) {
        console.error('Error fetching accounts from Supabase in Page:', err);
      }

      // Fetch Mutations
      try {
         // Default mutations fallback to prevent UI crash if no data
         setMutations([]);
      } catch (e) {}
    };

    if (profile) {
      initData();
    }
  }, [profile]);

  const saveAccounts = (newAcc: FinancialAccount[]) => {
    setAccounts(newAcc);
    // Trigger POS header balance sync event
    window.dispatchEvent(new Event('accounts-updated'));
  };

  const saveMutations = (newMut: AccountMutation[]) => {
    setMutations(newMut);
  };

  // CRUD Save handler
  const handleSaveAccount = async (acc: FinancialAccount) => {
    if (!profile?.outlet_id && profile?.role !== 'owner' && profile?.role !== 'developer') {
      toast.error('Gagal mendapatkan ID Outlet Anda.');
      return;
    }

    const toastId = toast.loading('Menyimpan rekening ke database...');
    try {
      const dbType = acc.accountType === 'CASH_DRAWER' ? 'CASH_DRAWER' : acc.accountType === 'EDC_MERCHANT' ? 'EDC_TERMINAL' : 'BANK_BRI';

      const res = await createAccountAction({
        outletId: profile.outlet_id,
        name: acc.accountName,
        accountNumber: acc.accountNumberOrTid || '',
        initialBalance: acc.currentBalance,
        minThreshold: acc.minBalanceThreshold,
        type: dbType,
      });

      if (res.success && res.accountId) {
        const savedAccount: FinancialAccount = {
          ...acc,
          id: res.accountId,
        };

        const isEdit = accounts.some(a => a.id === savedAccount.id);
        let updated: FinancialAccount[];
        if (isEdit) {
          updated = accounts.map(a => a.id === savedAccount.id ? savedAccount : a);
          toast.success(`Rekening "${acc.accountName}" diperbarui!`, { id: toastId });
        } else {
          updated = [...accounts, savedAccount];
          toast.success(`Rekening "${acc.accountName}" berhasil didaftarkan!`, { id: toastId });
        }
        saveAccounts(updated);
      } else {
        toast.error(res.error ?? 'Gagal menyimpan rekening.', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Terjadi kesalahan sistem.', { id: toastId });
    } finally {
      setSelectedAccount(null);
    }
  };

  // Trigger rebalance suggestion callback from AI banner
  const handleTriggerRebalance = (fromId: string, toId: string, amount: number) => {
    setSuggestedFromId(fromId);
    setSuggestedToId(toId);
    setSuggestedAmount(amount);
    setIsRebalanceOpen(true);
  };

  // Load mutations when selectedAccount changes
  useEffect(() => {
    const loadMutations = async () => {
      if (!selectedAccount) return;
      
      const res = await getAccountMutationsAction(selectedAccount.id);
      if (res.success && res.data) {
        setMutations(res.data);
      }
    };
    loadMutations();
  }, [selectedAccount]);

  // Rebalance Execution
  const handleExecuteRebalance = async (payload: RebalancePayload) => {

    const fromAcc = accounts.find(a => a.id === payload.fromAccountId);
    const toAcc = accounts.find(a => a.id === payload.toAccountId);

    if (!fromAcc || !toAcc) return;

    const toastId = toast.loading('Memproses rebalance di database...');
    try {
      const res = await executeRebalanceAction({
        fromAccountId: payload.fromAccountId,
        toAccountId: payload.toAccountId,
        amount: payload.amount,
        notes: payload.notes || `Rebalance internal oleh ${payload.executedBy}`,
      });

      if (res.success) {
        const updatedAccounts = accounts.map((a) => {
          if (a.id === payload.fromAccountId) {
            return {
              ...a,
              currentBalance: a.currentBalance - payload.amount,
              balance: a.currentBalance - payload.amount,
              lastMutatedAt: new Date().toISOString(),
            };
          }
          if (a.id === payload.toAccountId) {
            return {
              ...a,
              currentBalance: a.currentBalance + payload.amount,
              balance: a.currentBalance + payload.amount,
              lastMutatedAt: new Date().toISOString(),
            };
          }
          return a;
        });

        saveAccounts(updatedAccounts);
        
        // Trigger fetching updated mutations for the drawer
        if (selectedAccount?.id) {
          const mutRes = await getAccountMutationsAction(selectedAccount.id);
          if (mutRes.success && mutRes.data) {
            setMutations(mutRes.data);
          }
        }

        toast.success(`Berhasil memindahkan saldo!`, { id: toastId });
      } else {
        toast.error(res.error ?? 'Gagal memproses rebalance.', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Terjadi kesalahan sistem.', { id: toastId });
    }
  };

  // Manual Adjustment Execution
  const handleExecuteAdjustment = async (payload: BalanceAdjustmentPayload) => {

    const acc = accounts.find(a => a.id === payload.accountId);
    if (!acc) return;

    const currentBalance = acc.currentBalance;
    const actualBalance = payload.actualBalance;
    const discrepancy = actualBalance - currentBalance;

    if (discrepancy === 0) return;



    const toastId = toast.loading('Menyimpan koreksi saldo ke database...');
    try {
      const res = await adjustAccountBalanceAction({
        accountId: payload.accountId,
        actualBalance: payload.actualBalance,
        reasonCategory: payload.reasonCategory,
        notes: payload.notes || 'Koreksi saldo manual',
        discrepancy,
      });

      if (res.success) {
        const updatedAccounts = accounts.map((a) => {
          if (a.id === payload.accountId) {
            return {
              ...a,
              currentBalance: actualBalance,
              balance: actualBalance, // legacy
              lastMutatedAt: new Date().toISOString(),
            };
          }
          return a;
        });

        saveAccounts(updatedAccounts);

        // Fetch new mutations from DB
        const mutRes = await getAccountMutationsAction(payload.accountId);
        if (mutRes.success && mutRes.data) {
          setMutations(mutRes.data);
        }

        toast.success('Adjustment saldo berhasil disimpan!', { id: toastId });
      } else {
        toast.error(res.error ?? 'Gagal menyimpan adjustment.', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Terjadi kesalahan sistem.', { id: toastId });
    }
  };

  // Auth Protection Lock
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isAuthorized = profile.role === 'owner' || profile.role === 'developer';

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-5 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 leading-tight">Akses Ditolak</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Halaman Manajemen Saldo Likuiditas Toko terproteksi dan hanya dapat diakses oleh Owner.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/pos'}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] rounded-xl transition-all"
          >
            Kembali ke POS Kasir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 relative">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex w-auto bg-white shadow-2xl">
            <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between border-b border-slate-200 bg-white p-4 lg:py-0 lg:px-5 lg:h-14 shrink-0 font-sans gap-3">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[15px] font-bold text-slate-900 leading-tight truncate">Kelola Rekening & Mesin EDC</h1>
                <p className="text-[11px] text-slate-400 font-medium truncate hidden sm:block">Monitoring likuiditas modal, threshold kritis, dan adjustment saldo</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            <button
              onClick={() => {
                setSuggestedFromId('');
                setSuggestedToId('');
                setSuggestedAmount(0);
                setIsRebalanceOpen(true);
              }}
              className="group flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-50 border border-slate-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-700 text-[12px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              <span>Rebalancing</span>
            </button>
            <button
              onClick={() => {
                setSelectedAccount(null);
                setIsFormOpen(true);
              }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-extrabold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftar Akun Baru</span>
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Header metrics card computation */}
          <AccountHeader accounts={accounts} />

          {/* AI Advisor Liquidity banner */}
          <AILiquidityBanner accounts={accounts} onTriggerRebalance={handleTriggerRebalance} />

          {/* Main Account Search, Filter & Cards Grid */}
          <AccountGrid
            accounts={accounts}
            onAdjust={(acc) => {
              setSelectedAccount(acc);
              setIsAdjustmentOpen(true);
            }}
            onMutations={(acc) => {
              setSelectedAccount(acc);
              setIsDrawerOpen(true);
            }}
            onEdit={(acc) => {
              setSelectedAccount(acc);
              setIsFormOpen(true);
            }}
          />

          <div className="h-4" />
        </main>
      </div>

      {/* CRUD Master Account Form Modal */}
      <AccountFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAccount(null);
        }}
        onSave={handleSaveAccount}
        accountToEdit={selectedAccount}
      />

      {/* Cross-Account Rebalance Modal */}
      <RebalanceModal
        isOpen={isRebalanceOpen}
        onClose={() => {
          setIsRebalanceOpen(false);
          setSuggestedFromId('');
          setSuggestedToId('');
          setSuggestedAmount(0);
        }}
        accounts={accounts}
        onRebalance={handleExecuteRebalance}
        defaultFromId={suggestedFromId}
        defaultToId={suggestedToId}
        defaultAmount={suggestedAmount}
      />

      {/* Manual Balance Correction Adjustment Modal */}
      <BalanceAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => {
          setIsAdjustmentOpen(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        onAdjust={handleExecuteAdjustment}
      />

      {/* Mutation History Slide-over panel */}
      <AccountMutationDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        mutations={mutations}
      />

      {/* Chat helper helper */}
      <AIChatDrawer />
    </div>
  );
}

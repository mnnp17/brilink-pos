'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { FastRebalanceModal } from './components/FastRebalanceModal';
import { ServiceGrid, type ServiceItem } from '@/components/pos/ServiceGrid';
import { TransactionForm } from '@/components/pos/TransactionForm';
import { TransactionSummary, type PaymentMethod } from '@/components/pos/TransactionSummary';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSmartNominals } from '@/lib/hooks/useSmartNominals';
import { useActiveShift } from '@/lib/hooks/useShift';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { OpenShiftModal } from '@/components/shift/OpenShiftModal';
import { processTransactionAction } from '@/lib/actions/pos';
import { useQueryClient } from '@tanstack/react-query';

export default function PosPage() {
  const { profile, loading: isLoadingAuth, signOut } = useAuth();
  const { data: smartNominals } = useSmartNominals(profile?.outlet_id);
  const { data: activeShift, isLoading: isLoadingShift } = useActiveShift(profile?.id);
  const { data: accounts = [] } = useAccounts();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && !profile) {
      router.push('/login');
    }
  }, [isLoadingAuth, profile, router]);

  // Monitor session revocation / suspension (Kill-Switch)
  useEffect(() => {
    const handleRevoke = () => {
      const revoked = JSON.parse(localStorage.getItem('pos-revoked-sessions') || '[]');
      if (profile && (
        revoked.includes(profile.id) || 
        revoked.includes(profile.full_name.toLowerCase().replace(/\s/g, ''))
      )) {
        toast.error('Sesi Anda telah dicabut atau status akun Anda disuspend oleh Owner!');
        signOut();
      }
    };

    // Run check once on mount
    handleRevoke();

    window.addEventListener('pos-session-revoked', handleRevoke);
    return () => window.removeEventListener('pos-session-revoked', handleRevoke);
  }, [profile, signOut]);

  // Account state
  const [selectedAccountId, setSelectedAccountId] = useState('1');

  // Map accounts to AccountOption[]
  const mappedAccounts = useMemo(() => {
    return accounts.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      accountNumber: acc.account_number || acc.accountNumber || '',
      balance: Number(acc.balance) || Number(acc.current_balance) || 0,
      type: (acc.type === 'CASH_DRAWER' || acc.type === 'cash') ? ('cash' as const) : ('bank' as const),
    }));
  }, [accounts]);

  // Sync selectedAccountId to the first account once accounts load
  useEffect(() => {
    if (mappedAccounts.length > 0 && (selectedAccountId === '1' || !mappedAccounts.some(a => a.id === selectedAccountId))) {
      setSelectedAccountId(mappedAccounts[0].id);
    }
  }, [mappedAccounts, selectedAccountId]);

  // Transaction state
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Mobile layout state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);

  const handleServiceSelect = (service: ServiceItem) => {
    setSelectedService(service);
    setAccountNumber('');
    setAmount(0);
  };

  const handleProcess = async (method: PaymentMethod, cashReceived: number) => {
    if (!selectedService || amount <= 0) return;
    if (!activeShift?.id) {
      toast.error('Tidak ada shift aktif. Silakan buka shift terlebih dahulu.');
      return;
    }

    setProcessing(true);

    let accountId = selectedAccountId;
    if ((accountId === '1' || !accountId) && accounts.length > 0) {
      accountId = accounts[0].id;
    }

    let transactionType: 'SETOR_TUNAI' | 'TARIK_TUNAI' | 'PPOB' = 'PPOB';
    const nameLower = selectedService.name.toLowerCase();
    const serviceCodeLower = (selectedService.description || '').toLowerCase();
    const cfType = selectedService.cashflowType;

    if (cfType === 'REDUCE_CASH' || nameLower.includes('tarik') || serviceCodeLower.includes('tarik')) {
      transactionType = 'TARIK_TUNAI';
    } else if (
      cfType === 'ADD_CASH' || 
      cfType?.startsWith('TRANSFER') || 
      nameLower.includes('setor') || 
      nameLower.includes('transfer') ||
      serviceCodeLower.includes('setor') || 
      serviceCodeLower.includes('transfer')
    ) {
      transactionType = 'SETOR_TUNAI';
    }

    const payload = {
      shiftId: activeShift.id,
      accountId: accountId,
      type: transactionType,
      amount: amount,
      adminFee: selectedService.adminFee || 0,
      bankFee: selectedService.bankFee || 0,
      paymentMethod: method,
      accountNumber: accountNumber,
      idempotencyKey: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };

    try {
      const result = await processTransactionAction(payload);
      if (!result.success) {
        toast.error(result.error ?? 'Gagal memproses transaksi.');
        return;
      }

      toast.success(`Transaksi ${selectedService.name} berhasil diproses!`);
      
      // Invalidate query caches to trigger update of dashboard UI, history list, and account balances
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      // Reset form after success
      setSelectedService(null);
      setAccountNumber('');
      setAmount(0);
    } catch (e) {
      toast.error('Terjadi kesalahan saat memproses transaksi.');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoadingAuth || (profile && isLoadingShift)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#001E36] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-500">Memeriksa status shift kasir...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 relative">
      {/* Sidebar - Hidden on mobile, shown on desktop (lg:) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Navigation Overlay Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Sidebar Drawer Panel */}
          <div className="relative flex w-auto bg-white shadow-2xl transition-transform duration-300 ease-out">
            <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onRebalanceClick={
            profile?.role === 'owner' || profile?.role === 'developer' || profile?.permissions?.canRebalance === true
              ? () => setIsRebalanceModalOpen(true)
              : undefined
          }
          accounts={mappedAccounts}
        />

        {/* Body: Left Scrollable Panel + Desktop Right Summary Panel */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* ── LEFT COLUMN (scrollable POS content) ── */}
          <div className={`flex flex-1 flex-col gap-5 overflow-y-auto p-5 transition-all duration-150 ${
            selectedService && amount > 0 ? 'pb-24 lg:pb-5' : ''
          }`}>
            {/* Service Grid */}
            <ServiceGrid
              selectedServiceId={selectedService?.id ?? null}
              onSelect={handleServiceSelect}
            />

            {/* Transaction Form */}
            <TransactionForm
              selectedService={selectedService}
              accountNumber={accountNumber}
              amount={amount}
              onAccountNumberChange={setAccountNumber}
              onAmountChange={setAmount}
              recommendedNominals={smartNominals}
            />
          </div>

          {/* ── RIGHT COLUMN (desktop only, 360px wide) ── */}
          <div className="hidden lg:block w-[360px] shrink-0 overflow-hidden">
            <TransactionSummary
              selectedService={selectedService}
              accountNumber={accountNumber}
              amount={amount}
              onProcess={handleProcess}
              processing={processing}
            />
          </div>

          {/* Sticky Bottom Actions Bar (Mobile/Tablet only) */}
          {selectedService && amount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bayar</span>
                <span className="text-[18px] font-black text-[#001E36]">
                  {((amount || 0) + (selectedService?.adminFee || 0)).toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  })}
                </span>
              </div>
              <button
                onClick={() => setIsMobileSummaryOpen(true)}
                className="rounded-xl bg-[#FF6600] px-5 py-3 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(255,102,0,0.3)] hover:bg-[#E65C00] active:scale-[0.98] transition-all"
              >
                Lanjut Pembayaran
              </button>
            </div>
          )}

          {/* Mobile Bottom Sheet Drawer for Summary */}
          {isMobileSummaryOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
                onClick={() => setIsMobileSummaryOpen(false)}
              />
              {/* Sheet container */}
              <div className="relative z-10 max-h-[90vh] w-full rounded-t-2xl bg-white shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out transform translate-y-0">
                {/* Header/Close handle */}
                <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-100">
                  <span className="text-[13px] font-black uppercase tracking-wider text-slate-400">Detail Transaksi</span>
                  <button
                    onClick={() => setIsMobileSummaryOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {/* Scrollable content container */}
                <div className="overflow-y-auto flex-1">
                  <TransactionSummary
                    selectedService={selectedService}
                    accountNumber={accountNumber}
                    amount={amount}
                    onProcess={(method, cash) => {
                      setIsMobileSummaryOpen(false);
                      handleProcess(method, cash);
                    }}
                    processing={processing}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      <FastRebalanceModal
        isOpen={isRebalanceModalOpen}
        onClose={() => setIsRebalanceModalOpen(false)}
        cashierName={profile?.full_name || 'Siti Aminah'}
        cashierId={profile?.id || 'KASIR-02'}
      />
      {activeShift === null && <OpenShiftModal />}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AIChatDrawer } from '@/components/ai/AIChatDrawer';
import { FileText, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { RefactoredOwnerTransaction, TransactionFilterState } from '@/types/owner-transaction';
import { TimeFilterBar } from './components/TimeFilterBar';
import { AITransactionSummaryCard } from './components/AITransactionSummaryCard';
import { FilteredTransactionSummary } from './components/FilteredTransactionSummary';
import { OwnerTransactionTable } from './components/OwnerTransactionTable';
import { TransactionDetailDrawer } from './components/TransactionDetailDrawer';
import { TransactionExportMenu } from './components/TransactionExportMenu';
import Link from 'next/link';

// Detailed mock transaction dataset for Owner audits (August 2026) using RefactoredOwnerTransaction
const MOCK_OWNER_TRANSACTIONS: RefactoredOwnerTransaction[] = [];


import { useQuery } from '@tanstack/react-query';
import { getOwnerTransactions } from '@/lib/actions/owner';

export default function OwnerTransactionHistoryPage() {
  const { profile, loading: authLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<RefactoredOwnerTransaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Initialize filter state (Default to TODAY preset)
  const [filter, setFilter] = useState<TransactionFilterState>({
    timePreset: 'TODAY',
    startDateTime: '',
    endDateTime: '',
    marginStatus: 'ALL',
  });

  // Calculate default start & end dates on mount (representing today at 00:00 to 23:59)
  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    setFilter(prev => ({
      ...prev,
      startDateTime: todayStart.toISOString(),
      endDateTime: todayEnd.toISOString(),
    }));
  }, []);

  const { data: dbTransactions = [], isLoading: isTxsLoading } = useQuery<RefactoredOwnerTransaction[]>({
    queryKey: ['owner-transactions-audit'],
    queryFn: async () => {
      const res = await getOwnerTransactions();
      if (res.success && res.data) {
        return res.data.map((tx: any) => {
          const cashierName = tx.users?.name || 'Kasir';
          const sourceAccountName = tx.accounts?.name || 'Kas Laci Fisik';
          
          const amount = Number(tx.amount || 0);
          const adminFee = Number(tx.admin_fee || 0);
          const bankFee = Number(tx.bank_fee || 0);
          const netProfit = Number(tx.net_profit || (adminFee - bankFee));
          
          return {
            id: tx.id,
            transactionNumber: tx.idempotency_key || `TXN-${tx.id.slice(0, 8)}`,
            createdAt: tx.created_at,
            serviceName: tx.type === 'TARIK_TUNAI' ? 'Tarik Tunai EDC' : tx.type === 'SETOR_TUNAI' ? 'Setor Tunai' : 'Transfer Bank',
            sourceAccountName,
            cashierName,
            amount,
            customerAdminFee: adminFee,
            bankFee,
            netProfit,
            status: (tx.status || 'SUCCESS').toUpperCase() as any,
            hasAnomaly: netProfit <= 0,
            anomalyNote: netProfit <= 0 ? 'Laba bersih bernilai 0 atau negatif' : undefined,
          };
        });
      }
      return [];
    },
    enabled: !!profile && (profile.role === 'owner' || profile.role === 'developer')
  });

  // Auth check: Owner and Developer only
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-5">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 leading-tight">Akses Ditolak</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Halaman ini adalah laporan pengawasan transaksi internal owner dan tidak boleh diakses oleh kasir.
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

  // ── FILTER TRANSACTION DATA ──
  const filteredTransactions = dbTransactions.filter((tx) => {
    // 1. Time / Date Filter
    if (filter.startDateTime && tx.createdAt < filter.startDateTime) {
      return false;
    }
    if (filter.endDateTime && tx.createdAt > filter.endDateTime) {
      return false;
    }

    // 2. Cashier Filter
    if (filter.cashierId && tx.cashierName !== filter.cashierId) {
      return false;
    }

    // 3. EDC Account Filter
    if (filter.accountId && tx.sourceAccountName !== filter.accountId) {
      return false;
    }

    // 4. Service Type Filter
    if (filter.serviceId && tx.serviceName !== filter.serviceId) {
      return false;
    }

    // 5. Margin Status Filter (NORMAL: profit > 0, ANOMALY: profit <= 0)
    if (filter.marginStatus === 'NORMAL' && tx.netProfit <= 0) {
      return false;
    }
    if (filter.marginStatus === 'ANOMALY' && tx.netProfit > 0) {
      return false;
    }

    return true;
  });

  // Calculate live aggregate stats to pass to AI card
  const totalVolume = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const anomalyCount = filteredTransactions.filter(tx => tx.netProfit <= 0 || tx.hasAnomaly).length;

  const handleSelectRow = (tx: RefactoredOwnerTransaction) => {
    setSelectedTx(tx);
    setIsDrawerOpen(true);
  };

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

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <Link 
                href="/reports"
                className="hidden lg:flex w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-500 hover:text-slate-700 transition-colors animate-fade-in"
                title="Kembali ke Laporan Utama"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 leading-tight">Audit Transaksi</h1>
                <p className="text-[11px] text-slate-400 font-medium">Pantau rincian untung bersih dan dapatkan peringatan rugi dari AI.</p>
              </div>
            </div>
          </div>

          {/* Export Menu Dropdown */}
          <TransactionExportMenu 
            transactions={filteredTransactions}
            filterState={{
              startDateTime: filter.startDateTime,
              endDateTime: filter.endDateTime,
            }}
          />
        </header>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Time & Parametric Filters */}
          <TimeFilterBar 
            filter={filter}
            onChange={setFilter}
          />

          {/* AI Transaction Auditor Widget */}
          <AITransactionSummaryCard 
            filter={filter}
            aggregateStats={{
              totalVolume,
              totalTransactions: filteredTransactions.length,
              anomalyCount,
            }}
          />

          {/* KPI Metrics Summary Bar */}
          <FilteredTransactionSummary 
            transactions={filteredTransactions}
          />

          {/* Transaction Table */}
          <OwnerTransactionTable 
            transactions={filteredTransactions}
            onSelectRow={handleSelectRow}
          />

          <div className="h-4" />
        </main>
      </div>

      {/* slide-over Audit Drawer */}
      <TransactionDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTx(null);
        }}
        transaction={selectedTx}
      />

      {/* Floating AI Chat Drawer */}
      <AIChatDrawer />
    </div>
  );
}

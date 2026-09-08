'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AIChatDrawer } from '@/components/ai/AIChatDrawer';
import { IncomeProfitChart } from './components/IncomeProfitChart';
import { CashierActivityLogWidget } from './components/CashierActivityLogWidget';
import { DashboardTimeFilter, DashboardFilterState } from './components/DashboardTimeFilter';
import { GroupedSelect } from '@/components/ui/GroupedSelect';
import { DropdownGroup } from '@/types/ui';
import { DailyFinancialChartData } from '@/types/financial';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Banknote, 
  BarChart3, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  ArrowUpRight 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getOwnerDashboardStats, getOwnerTransactions } from '@/lib/actions/owner';
import { getExpenses } from '@/lib/actions/expense.actions';
import { getOutletAccounts } from '@/lib/actions/service.actions';
import { useMemo } from 'react';
import { formatRupiah } from '@/lib/utils/format';

export default function ExecutiveDashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const [timeFilter, setTimeFilter] = useState<DashboardFilterState>(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return {
      timePreset: 'LAST_7_DAYS',
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString()
    };
  });

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['owner-dashboard-stats'],
    queryFn: async () => {
      const res = await getOwnerDashboardStats();
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    }
  });

  const { data: dbAccounts = [] } = useQuery({
    queryKey: ['owner-accounts-all'],
    queryFn: async () => {
      const res = await getOutletAccounts();
      if (res.success && res.data) {
        return res.data;
      }
      return [];
    }
  });

  const { data: dbTransactions = [] } = useQuery({
    queryKey: ['owner-transactions-all'],
    queryFn: async () => {
      const res = await getOwnerTransactions();
      if (res.success && res.data) {
        return res.data;
      }
      return [];
    }
  });

  const { data: dbExpenses = [] } = useQuery({
    queryKey: ['owner-expenses-all'],
    queryFn: async () => {
      const res = await getExpenses();
      if (res.success && res.data) {
        return res.data;
      }
      return [];
    }
  });

  const liquidityBalances = useMemo(() => {
    let totalDigitalLiquidity = 0;
    let totalPhysicalCash = 0;

    if (dbAccounts.length > 0) {
      dbAccounts.forEach((acc: any) => {
        const bal = Number(acc.balance || 0);
        const typeUpper = (acc.type || '').toUpperCase();
        if (typeUpper === 'CASH_DRAWER' || typeUpper === 'CASH') {
          totalPhysicalCash += bal;
        } else {
          totalDigitalLiquidity += bal;
        }
      });
    }

    if (statsData) {
      if (statsData.totalDigitalLiquidity > 0) {
        totalDigitalLiquidity = statsData.totalDigitalLiquidity;
      }
      if (statsData.totalPhysicalCash > 0) {
        totalPhysicalCash = statsData.totalPhysicalCash;
      }
    }

    return { totalDigitalLiquidity, totalPhysicalCash };
  }, [dbAccounts, statsData]);

  const filteredStats = useMemo(() => {
    let grossVolume = 0;
    let txCount = 0;
    let grossAdminIncome = 0;
    let totalBankCogs = 0;
    let totalOpex = 0;

    const start = new Date(timeFilter.startDateTime).getTime();
    const end = new Date(timeFilter.endDateTime).getTime();

    dbTransactions.forEach((tx: any) => {
      const txTime = new Date(tx.created_at).getTime();
      if (txTime >= start && txTime <= end) {
        const adminFee = Number(tx.admin_fee || 0);
        const bankFee = Number(tx.bank_fee || 0);
        const amount = Number(tx.amount || 0);

        grossAdminIncome += adminFee;
        totalBankCogs += bankFee;
        grossVolume += amount;
        txCount += 1;
      }
    });

    dbExpenses.forEach((exp: any) => {
      const expTime = new Date(exp.expense_date || exp.created_at).getTime();
      if (expTime >= start && expTime <= end) {
        totalOpex += Number(exp.amount || 0);
      }
    });

    const netProfit = grossAdminIncome - totalBankCogs - totalOpex;

    const serviceMap = new Map<string, number>();
    
    dbTransactions.forEach((tx: any) => {
      const txTime = new Date(tx.created_at).getTime();
      if (txTime >= start && txTime <= end) {
        let name = 'Lainnya';
        if (tx.type === 'TARIK_TUNAI') name = 'Tarik Tunai';
        else if (tx.type === 'SETOR_TUNAI') name = 'Setor Tunai';
        else if (tx.type === 'TRANSFER' || tx.type === 'TRANSFER_BANK') name = 'Transfer Bank';
        else if (tx.type) name = tx.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

        serviceMap.set(name, (serviceMap.get(name) || 0) + 1);
      }
    });

    const dynamicServices = Array.from(serviceMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return { netProfit, grossVolume, txCount, dynamicServices, totalOpex };
  }, [dbTransactions, dbExpenses, timeFilter]);

  const chartData = useMemo<DailyFinancialChartData[]>(() => {
    const dailyMap = new Map<string, DailyFinancialChartData>();
    
    const startDate = new Date(timeFilter.startDateTime);
    startDate.setHours(0,0,0,0);
    const endDate = new Date(timeFilter.endDateTime);
    endDate.setHours(23,59,59,999);

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    // Generate consecutive days from startDate to endDate
    const curr = new Date(startDate);
    while (curr.getTime() <= endMs) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const dayLabel = curr.toLocaleDateString('id-ID', { weekday: 'short' });

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          dayLabel,
          grossVolume: 0,
          totalExpenses: 0,
          netProfitReal: 0,
          breakdown: { customerAdmin: 0, cogsBank: 0, opexAmount: 0 }
        });
      }

      curr.setDate(curr.getDate() + 1);
    }

    dbTransactions.forEach((tx: any) => {
      const txDate = new Date(tx.created_at);
      const txTime = txDate.getTime();
      if (txTime >= startMs && txTime <= endMs) {
        const year = txDate.getFullYear();
        const month = String(txDate.getMonth() + 1).padStart(2, '0');
        const day = String(txDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        if (dailyMap.has(dateKey)) {
          const current = dailyMap.get(dateKey)!;
          const amount = Number(tx.amount || 0);
          const adminFee = Number(tx.admin_fee || 0);
          const bankFee = Number(tx.bank_fee || 0);

          current.grossVolume += amount;
          current.totalExpenses += bankFee;
          current.netProfitReal += (adminFee - bankFee);
          current.breakdown.customerAdmin += adminFee;
          current.breakdown.cogsBank += bankFee;
        }
      }
    });

    dbExpenses.forEach((exp: any) => {
      const expDate = new Date(exp.expense_date || exp.created_at);
      const expTime = expDate.getTime();
      if (expTime >= startMs && expTime <= endMs) {
        const year = expDate.getFullYear();
        const month = String(expDate.getMonth() + 1).padStart(2, '0');
        const day = String(expDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        if (dailyMap.has(dateKey)) {
          const current = dailyMap.get(dateKey)!;
          const opexAmount = Number(exp.amount || 0);

          current.totalExpenses += opexAmount;
          current.netProfitReal -= opexAmount;
          current.breakdown.opexAmount += opexAmount;
        }
      }
    });

    return Array.from(dailyMap.values());
  }, [dbTransactions, dbExpenses, timeFilter]);

  const stats = statsData || {
    netProfitToday: 0,
    netProfitWeekly: 0,
    netProfitMonthly: 0,
    totalDigitalLiquidity: 0,
    totalPhysicalCash: 0,
    grossVolumeToday: 0,
    transactionCountToday: 0,
    alerts: {
      lowBalanceAccounts: [],
      unmatchedShiftsCount: 0,
    }
  };

  useEffect(() => {
    const checkFlags = () => {
      const stored = localStorage.getItem('pos-feature-flags');
      if (stored) {
        try {
          const flags = JSON.parse(stored);
          const aiFlag = flags.find((f: any) => f.key === 'ai_liquidity_advisor');
          if (aiFlag) {
            setAiEnabled(aiFlag.isEnabled);
          }
        } catch (e) {}
      }
    };
    checkFlags();

    window.addEventListener('feature-flags-updated', checkFlags);
    return () => window.removeEventListener('feature-flags-updated', checkFlags);
  }, []);

  if (isStatsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#001E36] border-t-transparent" />
          <span className="text-sm font-semibold text-slate-500">Memuat dashboard eksekutif...</span>
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

      {/* Mobile Sidebar Navigation Overlay */}
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

      {/* Main content */}
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
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-tight">Dashboard Eksekutif</h1>
              <p className="text-[11px] text-slate-400">Analisis bisnis & performa outlet Agen BRILink</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
              Agen BRILink Gemilang
            </span>
            <span className="rounded-md bg-[#FF6600] px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wide">POS</span>
          </div>
        </header>

        {/* Body content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          <DashboardTimeFilter filter={timeFilter} onChange={setTimeFilter} />

          {/* ── Smart Alert Banner ── */}
          {(stats.alerts.lowBalanceAccounts.length > 0 || stats.alerts.unmatchedShiftsCount > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3.5 items-start md:items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-amber-800 leading-tight">Peringatan Operasional & Saldo</h3>
                  <div className="mt-1 space-y-1">
                    {stats.alerts.lowBalanceAccounts.map((alert: any, i: number) => (
                      <p key={i} className="text-[11px] text-amber-700">
                        ⚠️ Saldo EDC rendah: <span className="font-semibold">{alert}</span> di bawah batas minimum (Rp 3.000.000)
                      </p>
                    ))}
                    {stats.alerts.unmatchedShiftsCount > 0 && (
                      <p className="text-[11px] text-amber-700">
                        🔴 Ditemukan <span className="font-bold">{stats.alerts.unmatchedShiftsCount} laporan shift kasir</span> dengan selisih kas opname!
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/reports'}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors active:scale-95 shrink-0 self-end md:self-auto"
              >
                Tinjau Laporan
              </button>
            </div>
          )}

          {/* ── DUAL-BALANCE HERO METRIC CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Laba Bersih Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Laba Bersih (Net Profit)</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-[20px] font-black text-slate-800 leading-tight">{formatRupiah(filteredStats.netProfit)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Laba bersih berdasarkan waktu terpilih</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>{timeFilter.timePreset === 'TODAY' ? 'Hari Ini' : timeFilter.timePreset === 'LAST_7_DAYS' ? '7 Hari Terakhir' : timeFilter.timePreset === 'THIS_MONTH' ? 'Bulan Ini' : 'Rentang Kustom'}</span>
                <span className="text-emerald-600">{filteredStats.txCount} Transaksi Sukses</span>
              </div>
            </div>

            {/* Likuiditas Digital Card */}
            <div className="bg-[#001E36] rounded-2xl p-4.5 shadow-xs text-white space-y-3 relative overflow-hidden">
              <div className="absolute right-2.5 top-2 text-white/5 text-[54px] font-black">💳</div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Likuiditas Digital</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-[20px] font-black leading-tight">{formatRupiah(liquidityBalances.totalDigitalLiquidity)}</p>
                <p className="text-[10px] text-blue-200 mt-1">Gabungan seluruh saldo EDC & Bank</p>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between text-[10px] text-blue-100">
                <span>Aktif Terpantau</span>
              </div>
            </div>

            {/* Uang Tunai Laci Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Uang Tunai Laci</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-[20px] font-black text-slate-800 leading-tight">{formatRupiah(liquidityBalances.totalPhysicalCash)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Total estimasi fisik kas laci aktif</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Shift Aktif</span>
                <span className="text-indigo-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Kasir
                </span>
              </div>
            </div>

            {/* Volume Gross Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Volume Gross</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6600] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-[20px] font-black text-slate-800 leading-tight">{formatRupiah(filteredStats.grossVolume)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Perputaran dana pada rentang waktu terpilih</p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold flex justify-between">
                <span>Rerata / Transaksi: {filteredStats.txCount > 0 ? formatRupiah(Math.round(filteredStats.grossVolume / filteredStats.txCount)) : 'Rp 0'}</span>
              </div>
            </div>

          </div>

          {/* ── AI BUSINESS INSIGHT NARRATIVE WIDGET ── */}
          {aiEnabled && (() => {
            const physicalCash = liquidityBalances.totalPhysicalCash || stats.totalPhysicalCash || 0;
            const digitalLiquidity = liquidityBalances.totalDigitalLiquidity || stats.totalDigitalLiquidity || 0;
            const lowAccounts = stats.alerts?.lowBalanceAccounts || [];
            const unmatchedCount = stats.alerts?.unmatchedShiftsCount || 0;

            return (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden font-sans">
                <div className="absolute right-4 top-4 text-blue-500/10 text-5xl">✨</div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                  <h3 className="font-bold text-[14px] text-slate-800">Analisa AI Co-Pilot Bisnis Anda</h3>
                  <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Insight Hari Ini</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Card 1: Kas Fisik */}
                  <div className="bg-white/70 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100/60 space-y-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${physicalCash >= 3000000 ? 'text-emerald-600' : physicalCash > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                      {physicalCash >= 3000000 ? 'Kas Fisik Optimal' : physicalCash > 0 ? 'Kas Fisik Terbatas' : 'Kas Fisik Laci'}
                    </span>
                    <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                      {physicalCash >= 3000000 ? (
                        <>Uang tunai laci saat ini tercatat <strong className="text-emerald-700 font-extrabold">{formatRupiah(physicalCash)}</strong>. Kapasitas modal siap melayani penarikan tunai nasabah.</>
                      ) : physicalCash > 0 ? (
                        <>Uang tunai laci saat ini <strong className="text-amber-700 font-extrabold">{formatRupiah(physicalCash)}</strong>. Disarankan rebalance/tambah modal tunai jika transaksi tarik tunai meningkat.</>
                      ) : (
                        <>Belum ada mutasi uang fisik laci aktif. Pastikan kasir telah membuka shift operasional.</>
                      )}
                    </p>
                  </div>

                  {/* Card 2: Likuiditas Digital */}
                  <div className="bg-white/70 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100/60 space-y-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${lowAccounts.length > 0 ? 'text-rose-500' : 'text-blue-600'}`}>
                      {lowAccounts.length > 0 ? 'Peringatan Saldo Rendah' : 'Likuiditas Operasional'}
                    </span>
                    <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                      {lowAccounts.length > 0 ? (
                        <>Terdapat <strong className="text-rose-600 font-extrabold">{lowAccounts.length} rekening</strong> bersaldo rendah ({lowAccounts.join(', ')}). Segera lakukan rebalancing.</>
                      ) : (
                        <>Saldo digital EDC & rekening tercatat sebesar <strong className="text-blue-700 font-extrabold">{formatRupiah(digitalLiquidity)}</strong>. Cadangan modal digital dalam kondisi likuid.</>
                      )}
                    </p>
                  </div>

                  {/* Card 3: Rekonsiliasi Shift */}
                  <div className="bg-white/70 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100/60 space-y-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${unmatchedCount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {unmatchedCount > 0 ? 'Audit Selisih Kas' : 'Integritas Kasir'}
                    </span>
                    <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                      {unmatchedCount > 0 ? (
                        <>Terdapat <strong className="text-rose-600 font-extrabold">{unmatchedCount} shift ditutup</strong> yang memiliki selisih kas fisik vs sistem. Silakan periksa log audit kasir.</>
                      ) : (
                        <>Seluruh penutupan shift kasir tercatat <strong className="text-emerald-700 font-extrabold">100% klop & presisi</strong> tanpa adanya selisih kas laci.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── CHARTS SECTION ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── TREND CHART (Takes 2 columns) ── */}
            <div className="lg:col-span-2">
              <IncomeProfitChart data={chartData} />
            </div>

            {/* ── PIE CHART (Takes 1 column) ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-[14px] text-slate-800">Komposisi Layanan</h3>
                <p className="text-[10px] text-slate-400">Distribusi transaksi berdasarkan jenis</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center pt-2">
                {(() => {
                  const total = filteredStats.txCount || 1; // Prevent div zero
                  
                  // Palette for top 5, rest becomes "Lainnya"
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];
                  
                  let accumulatedPct = 0;
                  const slices: { color: string, name: string, pct: number, start: number, end: number }[] = [];

                  filteredStats.dynamicServices.slice(0, 5).forEach((srv, i) => {
                    const pct = Math.round((srv.count / total) * 100);
                    slices.push({ color: colors[i], name: srv.name, pct, start: accumulatedPct, end: accumulatedPct + pct });
                    accumulatedPct += pct;
                  });

                  // Group remaining into 'Lainnya'
                  const remaining = filteredStats.dynamicServices.slice(5).reduce((acc, curr) => acc + curr.count, 0);
                  if (remaining > 0) {
                     const pct = 100 - accumulatedPct;
                     slices.push({ color: colors[5], name: 'Lainnya', pct, start: accumulatedPct, end: 100 });
                  } else if (slices.length > 0) {
                     // Ensure the last slice goes to 100% to avoid gaps due to rounding
                     slices[slices.length - 1].end = 100;
                  }

                  const gradStr = filteredStats.txCount === 0 
                    ? 'conic-gradient(#E2E8F0 0% 100%)'
                    : `conic-gradient(${slices.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`;

                  return (
                    <>
                      <div 
                        className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner" 
                        style={{ background: gradStr }}
                      >
                        <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center flex-col">
                          <span className="text-[10px] text-slate-400 font-semibold">Total</span>
                          <span className="text-lg font-bold text-slate-800">{filteredStats.txCount}</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="w-full mt-8 flex flex-col gap-3 max-h-40 overflow-y-auto pr-1">
                        {slices.map((s, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }}></span>
                              <span className="text-slate-600 font-medium truncate max-w-[120px]" title={s.name}>{s.name}</span>
                            </div>
                            <span className="font-bold text-slate-800">{s.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ── Cashier Activity Log Widget ── */}
          <CashierActivityLogWidget timeFilter={timeFilter} />

          <div className="h-4" />
        </main>
      </div>

      {/* Floating AI Chat Drawer */}
      <AIChatDrawer />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AIChatDrawer } from '@/components/ai/AIChatDrawer';
import { useAuth } from '@/lib/hooks/useAuth';
import { Lock, FileText, Search } from 'lucide-react';
import Link from 'next/link';

// Component Imports
import { ReportHeaderFilters } from './components/ReportHeaderFilters';
import { TargetProgressBar } from './components/TargetProgressBar';
import { AIExecutiveAdvisor } from './components/AIExecutiveAdvisor';
import { ReportMetricCards } from './components/ReportMetricCards';
import { ReportTabs } from './components/ReportTabs';

// Tab Component Imports
import { ProfitLossTab } from './components/tabs/ProfitLossTab';
import { ServicePerformanceTab } from './components/tabs/ServicePerformanceTab';
import { CashierAuditTab } from './components/tabs/CashierAuditTab';
import { AccountBalanceTab } from './components/tabs/AccountBalanceTab';

// Types & Utils
import { ReportTabType, FinancialReportSummary, AIStrategicAdvice, OpexBreakdownItem, ServiceProfitabilityItem, CashierAuditSummary, AccountBalanceItem } from './types/report';
import { downloadFinancialReportPDF } from './components/ReportPDFGenerator';
import { shareToWhatsApp } from './utils/shareToWhatsApp';
import { getOwnerTransactions } from '@/lib/actions/owner';
import { getExpenses } from '@/lib/actions/expense.actions';
import { getOutletAccounts } from '@/lib/actions/service.actions';

export default function ReportsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTabType>('PROFIT_LOSS');
  
  // State for Filters
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [comparePeriod, setComparePeriod] = useState(true);

  // Financial Data States
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [summary, setSummary] = useState<FinancialReportSummary | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AIStrategicAdvice | null>(null);
  const [opexItems, setOpexItems] = useState<OpexBreakdownItem[]>([]);
  const [services, setServices] = useState<ServiceProfitabilityItem[]>([]);
  const [cashierAudits, setCashierAudits] = useState<CashierAuditSummary[]>([]);
  const [accounts, setAccounts] = useState<AccountBalanceItem[]>([]);

  // Initialize Default Date Range (This Month) on Mount
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    setDateRange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  }, []);

  // Fetch Report Data based on Filters
  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;

    const fetchReportData = async () => {
      setIsLoadingData(true);
      try {
        const [txRes, expRes, accRes] = await Promise.all([
          getOwnerTransactions(),
          getExpenses(),
          getOutletAccounts(),
        ]);

        const transactions = txRes.success && txRes.data ? txRes.data : [];
        const expenses = expRes.success && expRes.data ? expRes.data : [];
        const accountsList = accRes.success && accRes.data ? accRes.data : [];

        const startMs = new Date(dateRange.startDate).getTime();
        const endMs = new Date(dateRange.endDate).getTime();

        let grossVolume = 0;
        let customerAdminIncome = 0;
        let cogsBankFee = 0;

        // Service map
        const serviceMap = new Map<string, { volume: number; admin: number; cogs: number; count: number }>();
        // Cashier map
        const cashierMap = new Map<string, { name: string; count: number; volume: number; netProfit: number }>();

        transactions.forEach((tx: any) => {
          const txTime = new Date(tx.created_at).getTime();
          if (txTime >= startMs && txTime <= endMs) {
            const amount = Number(tx.amount || 0);
            const admin = Number(tx.admin_fee || 0);
            let bankFee = Number(tx.bank_fee || 0);
            if (bankFee === 0 && admin > 0 && (tx.type === 'TRANSFER' || tx.type === 'SETOR_TUNAI' || tx.type === 'PPOB')) {
              bankFee = admin >= 5000 ? 3000 : 2000;
            }

            grossVolume += amount;
            customerAdminIncome += admin;
            cogsBankFee += bankFee;

            // Service breakdown
            const srvName = tx.service_name || (tx.type ? tx.type.replace(/_/g, ' ') : 'Lainnya');
            const currSrv = serviceMap.get(srvName) || { volume: 0, admin: 0, cogs: 0, count: 0 };
            currSrv.volume += amount;
            currSrv.admin += admin;
            currSrv.cogs += bankFee;
            currSrv.count += 1;
            serviceMap.set(srvName, currSrv);

            // Cashier breakdown
            const cashierName = tx.users?.name || 'Kasir';
            const currCashier = cashierMap.get(cashierName) || { name: cashierName, count: 0, volume: 0, netProfit: 0 };
            currCashier.count += 1;
            currCashier.volume += amount;
            currCashier.netProfit += (admin - bankFee);
            cashierMap.set(cashierName, currCashier);
          }
        });

        // OPEX breakdown
        const opexCategoryMap = new Map<string, number>();
        let totalOpex = 0;

        expenses.forEach((exp: any) => {
          const expTime = new Date(exp.expense_date || exp.created_at).getTime();
          if (expTime >= startMs && expTime <= endMs) {
            const catName = exp.expense_categories?.name || 'Lainnya';
            const amt = Number(exp.amount || 0);
            totalOpex += amt;
            opexCategoryMap.set(catName, (opexCategoryMap.get(catName) || 0) + amt);
          }
        });

        const grossProfit = customerAdminIncome - cogsBankFee;
        const netProfitReal = grossProfit - totalOpex;
        const monthlyTarget = 10000000;
        const targetAchievementPct = monthlyTarget > 0 ? Math.min(100, Math.max(0, (netProfitReal / monthlyTarget) * 100)) : 0;

        const startDateObj = new Date(dateRange.startDate);
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const periodName = `${months[startDateObj.getMonth()]} ${startDateObj.getFullYear()}`;

        const reportSummary: FinancialReportSummary = {
          periodLabel: periodName,
          grossVolume,
          customerAdminIncome,
          cogsBankFee,
          grossProfit,
          totalOpex,
          netProfitReal,
          momGrowth: {
            grossVolumePct: 0,
            cogsPct: 0,
            opexPct: 0,
            netProfitPct: 0,
          },
          monthlyTarget,
          targetAchievementPct,
        };

        const opexItems: OpexBreakdownItem[] = Array.from(opexCategoryMap.entries()).map(([categoryName, amount]) => ({
          categoryName,
          amount,
        }));

        const services: ServiceProfitabilityItem[] = Array.from(serviceMap.entries()).map(([serviceName, item], idx) => {
          const grossP = item.admin - item.cogs;
          return {
            serviceId: `srv-${idx}`,
            serviceName,
            txCount: item.count,
            grossAdmin: item.admin,
            cogsBank: item.cogs,
            netProfit: grossP,
            marginPct: item.admin > 0 ? (grossP / item.admin) * 100 : 0,
          };
        });

        const cashierAudits: CashierAuditSummary[] = Array.from(cashierMap.values()).map(c => ({
          cashierId: c.name,
          cashierName: c.name,
          totalShifts: 1,
          matchedShifts: 1,
          totalVarianceAmount: 0,
          accuracyScore: 100,
          status: 'EXCELLENT',
        }));

        const accountItems: AccountBalanceItem[] = accountsList.map((acc: any) => ({
          accountId: acc.id,
          accountName: acc.name,
          accountNumber: acc.account_number || '',
          currentBalance: Number(acc.balance || 0),
          minThreshold: Number(acc.min_threshold || 0),
          totalMutationsCount: 0,
          totalMerchantFee: 0,
        }));

        const aiAdvice: AIStrategicAdvice = {
          healthScore: netProfitReal >= 0 ? 85 : 45,
          executiveSummary: [
            `Total Pendapatan Admin: Rp ${customerAdminIncome.toLocaleString('id-ID')}`,
            `Total Beban Operasional (OPEX): Rp ${totalOpex.toLocaleString('id-ID')}`,
            `Laba Bersih Nyata: Rp ${netProfitReal.toLocaleString('id-ID')}`,
          ],
          strategicRecommendations: [
            totalOpex > grossProfit ? 'Beban OPEX toko melebihi laba kotor. Disarankan mengevaluasi pos pengeluaran operasional.' : 'Arus kas operasional dalam kondisi sehat.',
          ],
        };

        setSummary(reportSummary);
        setOpexItems(opexItems);
        setServices(services);
        setCashierAudits(cashierAudits);
        setAccounts(accountItems);
        setAiAdvice(aiAdvice);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchReportData();
  }, [dateRange, comparePeriod]);

  // Auth/Role validation logic
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
              Halaman ini berisi Laporan Finansial dan Kinerja Bisnis internal Owner. Anda tidak memiliki otoritas akses.
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

  const handleExportPDF = () => {
    if (!summary || !aiAdvice) return;
    downloadFinancialReportPDF(summary, aiAdvice, opexItems, cashierAudits);
  };

  const handleShareWA = () => {
    if (!summary || !aiAdvice) return;
    shareToWhatsApp(summary, aiAdvice);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 relative">
      {/* Desktop Sidebar */}
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
        
        {/* Page Header */}
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 leading-tight">Laporan Kinerja Bisnis</h1>
                <p className="text-[11px] text-slate-400 font-medium">Laba-Rugi Riil (P&L), audit ketelitian, dan rekomendasi AI</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports/transactions"
              className="flex items-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-[12px] font-bold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span>Audit Transaksi</span>
            </Link>
          </div>
        </header>

        {/* Navigation Tabs */}
        <ReportTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Header Controls Panel */}
          {dateRange.startDate && dateRange.endDate && (
            <ReportHeaderFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              comparePeriod={comparePeriod}
              onComparePeriodChange={setComparePeriod}
              onExportPDF={handleExportPDF}
              onShareWA={handleShareWA}
            />
          )}

          {isLoadingData ? (
            <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-[12px] text-slate-400 font-semibold">Mengompilasi Laporan Keuangan...</span>
              </div>
            </div>
          ) : (
            summary && aiAdvice && (
              <>
                {/* Monthly Target Progress Widget */}
                <TargetProgressBar
                  netProfitReal={summary.netProfitReal}
                  monthlyTarget={summary.monthlyTarget}
                />

                {/* AI Executive Advisory Card */}
                <AIExecutiveAdvisor
                  healthScore={aiAdvice.healthScore}
                  executiveSummary={aiAdvice.executiveSummary}
                  strategicRecommendations={aiAdvice.strategicRecommendations}
                />

                {/* 4 KPI Financial Metric Cards */}
                <ReportMetricCards
                  grossVolume={summary.grossVolume}
                  cogsBankFee={summary.cogsBankFee}
                  totalOpex={summary.totalOpex}
                  netProfitReal={summary.netProfitReal}
                  momGrowth={summary.momGrowth}
                />

                {/* Tab Specific Content views */}
                <div className="transition-all duration-300">
                  {activeTab === 'PROFIT_LOSS' && (
                    <ProfitLossTab
                      customerAdminIncome={summary.customerAdminIncome}
                      cogsBankFee={summary.cogsBankFee}
                      grossProfit={summary.grossProfit}
                      opexItems={opexItems}
                      totalOpex={summary.totalOpex}
                      netProfitReal={summary.netProfitReal}
                    />
                  )}
                  {activeTab === 'SERVICES' && (
                    <ServicePerformanceTab
                      services={services}
                    />
                  )}
                  {activeTab === 'CASHIER_AUDIT' && (
                    <CashierAuditTab
                      audits={cashierAudits}
                    />
                  )}
                  {activeTab === 'BANK_MUTATION' && (
                    <AccountBalanceTab
                      accounts={accounts}
                    />
                  )}
                </div>
              </>
            )
          )}

          <div className="h-4" />
        </main>
      </div>

      {/* Floating AI Chat drawer helper */}
      <AIChatDrawer />
    </div>
  );
}

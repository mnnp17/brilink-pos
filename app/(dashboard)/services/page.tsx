'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AIChatDrawer } from '@/components/ai/AIChatDrawer';
import { useAuth } from '@/lib/hooks/useAuth';
import { Settings, Plus, Layers, Sliders, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect } from '@/components/ui/CustomSelect';

import { AIOperationalAdvisor } from './components/AIOperationalAdvisor';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { FeeSimulatorModal } from './components/FeeSimulatorModal';
import { ServiceFormModal } from './components/ServiceFormModal';
import { ServiceTable } from './components/ServiceTable';

import type { CatalogServiceItem, ServiceCategory, AIOperationalAdvice, CashflowType, AdminFeeRule } from './types/catalog-master';

import {
  getServiceCategories,
  getServices,
  getOutletAccounts,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  createService,
  updateService,
  deleteService,
  type ServiceCategoryRow,
  type ServiceRow,
  type AccountOption,
} from '@/lib/actions/service.actions';

// Adapters: konversi Supabase row ke format yang dipakai komponen
function toServiceCategory(row: ServiceCategoryRow): ServiceCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    iconName: row.icon_name,
    badgeColor: row.badge_color,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function toService(row: ServiceRow): CatalogServiceItem {
  return {
    id: row.id,
    serviceCode: row.service_code,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.service_categories?.name,
    defaultAccountId: row.default_account_id ?? '',
    defaultAccountName: (row as any).accounts?.name,
    minTxAmount: Number(row.min_tx_amount),
    maxTxAmount: Number(row.max_tx_amount ?? 0),
    feeType: row.fee_type,
    isActive: row.is_active,
    flatCustomerAdmin: row.flat_customer_admin ? Number(row.flat_customer_admin) : undefined,
    flatBankFeeCogs: row.flat_bank_fee_cogs ? Number(row.flat_bank_fee_cogs) : undefined,
    percentageCustomerAdmin: row.percentage_customer_admin ? Number(row.percentage_customer_admin) : undefined,
    percentageBankFeeCogs: row.percentage_bank_fee_cogs ? Number(row.percentage_bank_fee_cogs) : undefined,
    maxPercentageCap: row.max_percentage_cap ? Number(row.max_percentage_cap) : undefined,
    cashflowType: (row.cashflow_type as CashflowType) || undefined,
    adminFeeRule: (row.admin_fee_rule as AdminFeeRule) || undefined,
    adminFeeEditable: row.admin_fee_editable ?? undefined,
    minAdminFee: row.min_admin_fee ? Number(row.min_admin_fee) : undefined,
    maxAdminFee: row.max_admin_fee ? Number(row.max_admin_fee) : undefined,
    requiresCustomerRef: row.requires_customer_ref ?? undefined,
    customerRefLabel: row.customer_ref_label ?? undefined,
    tierRules: row.service_fee_tiers?.map(tier => ({
      id: tier.id,
      minAmount: Number(tier.min_amount),
      maxAmount: Number(tier.max_amount ?? 0),
      customerAdminFee: Number(tier.customer_admin_fee),
      bankFeeCogs: Number(tier.bank_fee_cogs),
      netProfit: Number(tier.net_profit),
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default function ServicesPage() {
  const { profile, loading: authLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<CatalogServiceItem[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [advices] = useState<AIOperationalAdvice[]>([]); // AI advices - kosong, tidak dari localStorage
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogServiceItem | null>(null);

  const [isPending, startTransition] = useTransition();

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const [catRes, svcRes, accRes] = await Promise.all([
      getServiceCategories(),
      getServices(),
      getOutletAccounts(),
    ]);
    if (catRes.success && catRes.data) setCategories(catRes.data.map(toServiceCategory));
    if (svcRes.success && svcRes.data) setServices(svcRes.data.map(toService));
    if (accRes.success && accRes.data) setAccounts(accRes.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
              Halaman Aturan Biaya & Katalog Layanan COGS terproteksi dan hanya dapat diakses oleh Owner.
            </p>
          </div>
          <button onClick={() => window.location.href = '/pos'}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] rounded-xl transition-all">
            Kembali ke POS Kasir
          </button>
        </div>
      </div>
    );
  }

  // ── Handlers ──
  const handleSaveCategory = (cat: ServiceCategory) => {
    const isEdit = categories.some(c => c.id === cat.id);
    startTransition(async () => {
      if (isEdit) {
        const res = await updateServiceCategory(cat.id, { name: cat.name, slug: cat.slug, icon_name: cat.iconName, badge_color: cat.badgeColor, is_active: cat.isActive, sort_order: cat.sortOrder });
        if (res.success) { toast.success('Kategori diperbarui!'); await fetchAll(); }
        else toast.error(res.error ?? 'Gagal memperbarui kategori.');
      } else {
        const res = await createServiceCategory({ name: cat.name, slug: cat.slug, icon_name: cat.iconName, badge_color: cat.badgeColor });
        if (res.success) { toast.success('Kategori baru ditambahkan!'); await fetchAll(); }
        else toast.error(res.error ?? 'Gagal menambahkan kategori.');
      }
    });
  };

  const handleDeleteCategory = (id: string) => {
    startTransition(async () => {
      const res = await deleteServiceCategory(id);
      if (res.success) { toast.success('Kategori berhasil dihapus!'); await fetchAll(); }
      else toast.error(res.error ?? 'Gagal menghapus kategori.');
    });
  };

  const handleSaveService = (srv: CatalogServiceItem) => {
    const isEdit = services.some(s => s.id === srv.id);
    startTransition(async () => {
      const payload = {
        category_id: srv.categoryId,
        service_code: srv.serviceCode,
        name: srv.name,
        fee_type: srv.feeType,
        is_active: srv.isActive,
        default_account_id: srv.defaultAccountId || undefined,
        min_tx_amount: srv.minTxAmount,
        max_tx_amount: srv.maxTxAmount || undefined,
        flat_customer_admin: srv.flatCustomerAdmin,
        flat_bank_fee_cogs: srv.flatBankFeeCogs,
        percentage_customer_admin: srv.percentageCustomerAdmin,
        percentage_bank_fee_cogs: srv.percentageBankFeeCogs,
        max_percentage_cap: srv.maxPercentageCap,
        cashflow_type: srv.cashflowType,
        admin_fee_rule: srv.adminFeeRule,
        admin_fee_editable: srv.adminFeeEditable,
        min_admin_fee: srv.minAdminFee,
        max_admin_fee: srv.maxAdminFee,
        requires_customer_ref: srv.requiresCustomerRef,
        customer_ref_label: srv.customerRefLabel,
        tier_rules: srv.tierRules?.map(tier => ({ min_amount: tier.minAmount, max_amount: tier.maxAmount, customer_admin_fee: tier.customerAdminFee, bank_fee_cogs: tier.bankFeeCogs })),
      };
      if (isEdit) {
        const res = await updateService(srv.id, payload);
        if (res.success) { toast.success('Layanan berhasil diperbarui!'); await fetchAll(); }
        else toast.error(res.error ?? 'Gagal memperbarui layanan.');
      } else {
        const res = await createService(payload);
        if (res.success) { toast.success('Layanan baru berhasil didaftarkan!'); await fetchAll(); }
        else toast.error(res.error ?? 'Gagal menambahkan layanan.');
      }
    });
    setEditingService(null);
  };

  const handleDeleteService = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus layanan ini dari katalog?')) return;
    startTransition(async () => {
      const res = await deleteService(id);
      if (res.success) { toast.success('Layanan berhasil dihapus!'); await fetchAll(); }
      else toast.error(res.error ?? 'Gagal menghapus layanan.');
    });
  };

  const handleApplyAdvice = (adviceId: string, serviceId: string, accountId: string) => {
    const targetAccount = accounts.find(a => a.id === accountId);
    if (!targetAccount) return;
    const srv = services.find(s => s.id === serviceId);
    if (!srv) return;
    handleSaveService({ ...srv, defaultAccountId: accountId, defaultAccountName: targetAccount.name });
    toast.success('Rute EDC berhasil dioptimalkan!');
  };

  // ── Filter ──
  const filteredServices = services.filter(s => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.serviceCode.toLowerCase().includes(q)) return false;
    }
    if (selectedCategoryId !== 'ALL' && s.categoryId !== selectedCategoryId) return false;
    if (statusFilter === 'ACTIVE' && !s.isActive) return false;
    if (statusFilter === 'INACTIVE' && s.isActive) return false;
    return true;
  });

  const activeCount = services.filter(s => s.isActive).length;
  let totalAdmin = 0, totalCogs = 0;
  services.forEach(s => {
    if (s.feeType === 'FLAT') { totalAdmin += s.flatCustomerAdmin || 0; totalCogs += s.flatBankFeeCogs || 0; }
    else if (s.feeType === 'TIERED' && s.tierRules?.length) {
      const ta = s.tierRules.reduce((sum, r) => sum + r.customerAdminFee, 0) / s.tierRules.length;
      const tc = s.tierRules.reduce((sum, r) => sum + r.bankFeeCogs, 0) / s.tierRules.length;
      totalAdmin += ta; totalCogs += tc;
    }
  });
  const avgMargin = totalAdmin > 0 ? ((totalAdmin - totalCogs) / totalAdmin) * 100 : 0;

  const enrichedCategories = categories.map(cat => ({
    ...cat,
    servicesCount: services.filter(s => s.categoryId === cat.id).length,
  }));

  // Convert AccountOption ke format yang diharapkan ServiceFormModal
  const accountsList = accounts.map(a => ({ id: a.id, name: a.name + ' (' + a.account_number + ')' }));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 relative">
      <div className="hidden lg:block"><Sidebar /></div>
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="relative flex w-auto bg-white shadow-2xl"><Sidebar onClose={() => setIsMobileSidebarOpen(false)} /></div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 leading-tight">Katalog Layanan & Aturan Biaya</h1>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Profit engine khusus owner dengan skema tarif bertingkat</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
                  <div>
                    <span className="text-slate-400 font-bold block">Total Kategori</span>
                    <span className="text-[15px] font-black text-slate-800">{categories.length} Kategori</span>
                  </div>
                  <div className="border-l border-slate-200 h-8 hidden sm:block" />
                  <div>
                    <span className="text-slate-400 font-bold block">Total Layanan</span>
                    <span className="text-[15px] font-black text-slate-800">{activeCount} Aktif / {services.length} Total</span>
                  </div>
                  <div className="border-l border-slate-200 h-8 hidden sm:block" />
                  <div>
                    <span className="text-slate-400 font-bold block">Rata-rata Margin Bersih</span>
                    <span className="text-[15px] font-black text-emerald-600">{avgMargin.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button onClick={() => setIsSimulatorModalOpen(true)}
                    className="flex-1 md:flex-none flex justify-center items-center gap-1.5 py-2 px-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[12px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap">
                    <span>Simulator Tarif</span>
                  </button>
                  <button onClick={() => { setEditingService(null); setIsServiceFormOpen(true); }}
                    className="flex-1 md:flex-none flex justify-center items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-extrabold rounded-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap">
                    <Plus className="w-4 h-4 shrink-0" /><span>Tambah Layanan Baru</span>
                  </button>
                </div>
              </div>

              <AIOperationalAdvisor advices={advices} onApplyAdvice={handleApplyAdvice} />

              <div className="space-y-3.5">
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  <button onClick={() => setSelectedCategoryId('ALL')}
                    className={"px-4 py-2 text-[12px] font-bold rounded-xl transition-all cursor-pointer border shrink-0 " + (selectedCategoryId === 'ALL' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
                    Semua Kategori ({services.length})
                  </button>
                  {categories.map(cat => {
                    const count = services.filter(s => s.categoryId === cat.id).length;
                    return (
                      <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)}
                        className={"px-4 py-2 text-[12px] font-bold rounded-xl transition-all cursor-pointer border shrink-0 " + (selectedCategoryId === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
                        {cat.name} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input type="text" placeholder="Cari layanan, kode unik, bank..."
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-3 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] outline-none focus:bg-white focus:border-blue-400 text-slate-700 font-semibold" />
                  </div>
                  <CustomSelect
                    label="Status Layanan"
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v)}
                    options={[
                      { value: 'ALL', label: 'Semua Status' },
                      { value: 'ACTIVE', label: 'Aktif' },
                      { value: 'INACTIVE', label: 'Non-Aktif' },
                    ]}
                  />
                </div>
              </div>

              {filteredServices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                  <p className="text-slate-500 font-semibold text-[13px]">Belum ada layanan yang terdaftar.</p>
                  <p className="text-slate-400 text-[11px] mt-1">Tambah kategori dan layanan baru untuk mulai menggunakan katalog.</p>
                </div>
              ) : (
                <ServiceTable services={filteredServices} onEdit={(srv) => { setEditingService(srv); setIsServiceFormOpen(true); }} onDelete={handleDeleteService} />
              )}

              <div className="h-4" />
            </>
          )}
        </main>
      </div>

      <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={enrichedCategories} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} />
      <FeeSimulatorModal isOpen={isSimulatorModalOpen} onClose={() => setIsSimulatorModalOpen(false)} services={services} />
      <ServiceFormModal 
        isOpen={isServiceFormOpen} 
        onClose={() => { setIsServiceFormOpen(false); setEditingService(null); }} 
        categories={categories} 
        accounts={accountsList} 
        service={editingService} 
        onSave={handleSaveService}
        onManageCategory={() => setIsCategoryModalOpen(true)}
      />
      <AIChatDrawer />
    </div>
  );
}

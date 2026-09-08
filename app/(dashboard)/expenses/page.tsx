'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AIChatDrawer } from '@/components/ai/AIChatDrawer';
import { Banknote, Plus, TrendingDown, Award, Lock, Edit3 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ExpenseModal } from './components/ExpenseModal';
import { ExpenseTable } from './components/ExpenseTable';
import { ManageCategoryModal } from './components/ManageCategoryModal';
import { formatRupiah } from '@/lib/utils/format';
import { toast } from 'sonner';
import {
  getExpenses,
  getExpenseCategories,
  createExpense,
  updateExpense,
  deleteExpense,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  type ExpenseRow,
  type ExpenseCategoryRow,
} from '@/lib/actions/expense.actions';

// Adapter: konversi ExpenseRow dari Supabase ke format ExpenseItem untuk komponen modal
type ExpenseItem = {
  id: string;
  category: string;
  amount: number;
  description: string;
  receiptUrl?: string;
  createdAt: string;
  createdBy: string;
};

type CustomExpenseCategory = {
  id: string;
  name: string;
  code: string;
  badgeColor: string;
  sortOrder: number;
};

function toExpenseItem(row: ExpenseRow): ExpenseItem {
  return {
    id: row.id,
    category: row.expense_categories?.code ?? '',
    amount: Number(row.amount),
    description: row.description,
    receiptUrl: row.receipt_url ?? undefined,
    createdAt: `${row.expense_date}T00:00:00.000Z`,
    createdBy: '',
  };
}

function toCategoryItem(row: ExpenseCategoryRow): CustomExpenseCategory {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    badgeColor: row.badge_color,
    sortOrder: row.sort_order,
  };
}

export default function ExpensesPage() {
  const { profile, loading: authLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<CustomExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseItem | null>(null);

  const [isPending, startTransition] = useTransition();

  // ── Fetch data dari Supabase ──
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const [expRes, catRes] = await Promise.all([
      getExpenses({ month: new Date().toISOString().slice(0, 7) }),
      getExpenseCategories(),
    ]);
    if (expRes.success && expRes.data) setExpenses(expRes.data.map(toExpenseItem));
    if (catRes.success && catRes.data) setCategories(catRes.data.map(toCategoryItem));
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Auth check ──
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
              Halaman ini berisi catatan pengeluaran rahasia (OPEX) toko dan hanya dapat diakses oleh Owner atau Developer.
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

  // ── Metrics bulan ini ──
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = expenses.filter(exp => exp.createdAt.startsWith(currentMonthPrefix));
  const totalOpexThisMonth = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryTotals: Record<string, number> = {};
  categories.forEach(cat => { categoryTotals[cat.code] = 0; });
  currentMonthExpenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });
  let largestCategoryCode: string | null = null;
  let largestAmount = 0;
  Object.keys(categoryTotals).forEach(code => {
    if (categoryTotals[code] > largestAmount) {
      largestAmount = categoryTotals[code];
      largestCategoryCode = code;
    }
  });
  const largestCategoryName = largestCategoryCode
    ? (categories.find(c => c.code === largestCategoryCode)?.name || largestCategoryCode)
    : null;

  // ── Handlers ──
  const handleCreateOrUpdate = async (formData: Omit<ExpenseItem, 'id' | 'createdBy'> & { id?: string }) => {
    const categoryRow = categories.find(c => c.code === formData.category);
    if (!categoryRow) { toast.error('Pilih kategori yang valid.'); return; }

    startTransition(async () => {
      if (formData.id) {
        const res = await updateExpense(formData.id, {
          category_id: categoryRow.id,
          amount: formData.amount,
          description: formData.description,
          expense_date: formData.createdAt.slice(0, 10),
          receipt_url: formData.receiptUrl ?? null,
        });
        if (res.success) { toast.success('Pengeluaran berhasil diperbarui!'); await fetchAll(); }
        else toast.error(res.error ?? 'Gagal memperbarui pengeluaran.');
      } else {
        const res = await createExpense({
          category_id: categoryRow.id,
          amount: formData.amount,
          description: formData.description,
          expense_date: formData.createdAt.slice(0, 10),
          receipt_url: formData.receiptUrl,
        });
        if (res.success) { toast.success('Pengeluaran baru berhasil dicatat!'); await fetchAll(); }
        else toast.error(res.error ?? 'Gagal mencatat pengeluaran.');
      }
    });
    setIsModalOpen(false);
    setExpenseToEdit(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran ini?')) return;
    startTransition(async () => {
      const res = await deleteExpense(id);
      if (res.success) { toast.success('Catatan pengeluaran berhasil dihapus.'); await fetchAll(); }
      else toast.error(res.error ?? 'Gagal menghapus pengeluaran.');
    });
  };

  const handleEditClick = (expense: ExpenseItem) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (cat: CustomExpenseCategory) => {
    const isEdit = categories.some(c => c.id === cat.id);
    startTransition(async () => {
      if (isEdit) {
        const res = await updateExpenseCategory(cat.id, {
          name: cat.name,
          badge_color: cat.badgeColor,
          sort_order: cat.sortOrder,
        });
        if (res.success) { toast.success('Kategori diperbarui!'); await fetchAll(); }
        else toast.error(res.error ?? 'Gagal memperbarui kategori.');
      } else {
        const res = await createExpenseCategory({
          name: cat.name,
          code: cat.code,
          badge_color: cat.badgeColor,
        });
        if (res.success) { toast.success('Kategori baru ditambahkan!'); await fetchAll(); }
        else toast.error(res.error ?? 'Gagal menambahkan kategori.');
      }
    });
  };

  const handleDeleteCategory = async (id: string) => {
    startTransition(async () => {
      const res = await deleteExpenseCategory(id);
      if (res.success) { toast.success('Kategori berhasil dihapus.'); await fetchAll(); }
      else toast.error(res.error ?? 'Gagal menghapus kategori.');
    });
  };

  const enrichedCategories = categories.map(cat => ({
    ...cat,
    expensesCount: expenses.filter(exp => exp.category === cat.code).length,
  }));

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
                <Banknote className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 leading-tight">Pengeluaran Toko (OPEX)</h1>
                <p className="text-[11px] text-slate-400">Pencatatan & pengawasan pengeluaran operasional toko harian</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }}
              className="flex items-center gap-1 py-1 px-2.5 sm:py-1.5 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-[12px] font-bold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Tambah Pengeluaran</span>
            </button>
          </div>
        </header>

        <div className="flex sm:hidden shrink-0 items-center justify-between gap-2 px-5 py-2.5 bg-white border-b border-slate-200">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi Cepat</span>
          <div className="flex items-center gap-2">
            <button onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }}
              className="flex items-center gap-1 py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /><span>Tambah</span>
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total OPEX Bulan Ini</span>
                    <p className="text-[20px] font-black text-slate-800 leading-tight mt-0.5">{formatRupiah(totalOpexThisMonth)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi pengeluaran bulan berjalan</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kategori Terbesar</span>
                    <p className="text-[16px] font-extrabold text-slate-800 leading-tight mt-0.5 font-sans">
                      {largestCategoryName || 'Belum Ada Data'}
                    </p>
                    <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                      {largestCategoryCode
                        ? `Alokasi Terbesar: ${formatRupiah(largestAmount)} (${((largestAmount / totalOpexThisMonth) * 100).toFixed(1)}%)`
                        : 'Tidak ada pengeluaran bulan ini'}
                    </p>
                  </div>
                </div>
              </div>

              {categories.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                  <p className="text-slate-500 font-semibold text-[13px]">Belum ada kategori pengeluaran.</p>
                  <p className="text-slate-400 text-[11px] mt-1">Klik <strong>Edit Kategori</strong> untuk menambah kategori terlebih dahulu.</p>
                </div>
              ) : (
                <ExpenseTable
                  expenses={expenses}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                  categories={categories}
                />
              )}

              <div className="h-4" />
            </>
          )}
        </main>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setExpenseToEdit(null); }}
        onSave={handleCreateOrUpdate}
        expenseToEdit={expenseToEdit}
        categories={categories}
        onAddCategory={handleSaveCategory}
      />

      <ManageCategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        categories={enrichedCategories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <AIChatDrawer />
    </div>
  );
}

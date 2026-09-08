'use client';

import React, { useState } from 'react';
import { Edit3, Trash2, Image as ImageIcon, Calendar, Filter, X, ArrowUpDown } from 'lucide-react';
import { ExpenseItem, ExpenseCategory, CustomExpenseCategory } from '@/types/financial';
import { formatRupiah } from '@/lib/utils/format';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface ExpenseTableProps {
  expenses: ExpenseItem[];
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (id: string) => void;
  categories: CustomExpenseCategory[];
}

const COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  rose: 'bg-rose-50 border-rose-200 text-rose-700',
};

export function ExpenseTable({ expenses, onEdit, onDelete, categories }: ExpenseTableProps) {
  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Lightbox Modal State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filter & Sort Logic
  const filteredExpenses = expenses
    .filter((item) => {
      // Category filter
      if (filterCategory !== 'ALL' && item.category !== filterCategory) {
        return false;
      }
      
      // Date filter
      const itemDate = item.createdAt.split('T')[0];
      if (startDate && itemDate < startDate) {
        return false;
      }
      if (endDate && itemDate > endDate) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (type: 'date' | 'amount') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Filters Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <CustomSelect
            label="Filter Kategori"
            value={filterCategory}
            onChange={(v) => setFilterCategory(v)}
            options={[
              { value: 'ALL', label: 'Semua Kategori' },
              ...categories.map((cat) => ({ value: cat.code, label: cat.name })),
            ]}
          />

          {/* Date Picker Start */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold focus:bg-white text-[11px]"
            />
            <span className="text-slate-400 px-0.5">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold focus:bg-white text-[11px]"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filterCategory !== 'ALL' || startDate || endDate) && (
          <button
            onClick={() => {
              setFilterCategory('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer self-end md:self-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 cursor-pointer select-none hover:text-slate-600 transition-colors" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3">Catatan</th>
                <th className="px-5 py-3 cursor-pointer select-none hover:text-slate-600 transition-colors" onClick={() => toggleSort('amount')}>
                  <div className="flex items-center gap-1 justify-end">
                    <span>Nominal</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-5 py-3 text-center">Nota</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px] font-medium text-slate-600">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((item) => {
                  const catInfo = categories.find(c => c.code === item.category);
                  const badgeClass = catInfo ? (COLOR_MAP[catInfo.badgeColor] || COLOR_MAP.slate) : COLOR_MAP.slate;
                  const label = catInfo ? catInfo.name : item.category;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Tanggal */}
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {formatDate(item.createdAt)}
                      </td>
                      
                      {/* Kategori Badge */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${badgeClass}`}>
                          {label}
                        </span>
                      </td>

                      {/* Catatan */}
                      <td className="px-5 py-3.5 max-w-xs md:max-w-md truncate">
                        <div className="font-bold text-slate-700">{item.description}</div>
                      </td>

                      {/* Nominal */}
                      <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                        {formatRupiah(item.amount)}
                      </td>

                      {/* Thumbnail Nota */}
                      <td className="px-5 py-3.5 text-center">
                        {item.receiptUrl ? (
                          <button
                            onClick={() => setLightboxImage(item.receiptUrl || null)}
                            className="inline-flex w-8 h-8 rounded-lg border border-slate-200 overflow-hidden hover:border-blue-400 active:scale-95 cursor-pointer shadow-xs transition-all bg-slate-50 items-center justify-center"
                          >
                            <img
                              src={item.receiptUrl}
                              alt="Nota"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                      </td>

                      {/* Aksi (Edit/Hapus) */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEdit(item)}
                            title="Edit"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/20 active:scale-90 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            title="Hapus"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/40 active:scale-90 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Filter className="w-7 h-7 text-slate-300" />
                      <span className="font-bold">Tidak ada data pengeluaran ditemukan</span>
                      <span className="text-[10px]">Coba sesuaikan filter kategori atau rentang tanggal Anda</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Lightbox Image Modal ── */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setLightboxImage(null)} />
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 border border-slate-100 shadow-2xl flex flex-col z-10">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute right-4 top-4 p-1.5 bg-slate-900/50 hover:bg-slate-950 text-white rounded-full hover:scale-105 active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImage}
              alt="Bukti Nota Fisik"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

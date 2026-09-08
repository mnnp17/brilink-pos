'use client';

import React, { useState } from 'react';
import { CustomExpenseCategory } from '@/types/financial';
import { X, Plus, Trash2, Save, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface ManageCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: (CustomExpenseCategory & { expensesCount?: number })[];
  onSaveCategory: (cat: CustomExpenseCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export function ManageCategoryModal({
  isOpen,
  onClose,
  categories,
  onSaveCategory,
  onDeleteCategory,
}: ManageCategoryModalProps) {
  const [editingCat, setEditingCat] = useState<CustomExpenseCategory | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [badgeColor, setBadgeColor] = useState('indigo');
  const [sortOrder, setSortOrder] = useState(1);

  if (!isOpen) return null;

  const handleEditClick = (cat: CustomExpenseCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setCode(cat.code);
    setBadgeColor(cat.badgeColor);
    setSortOrder(cat.sortOrder);
  };

  const handleAddNew = () => {
    setEditingCat(null);
    setName('');
    setCode('');
    setBadgeColor('indigo');
    setSortOrder(categories.length > 0 ? Math.max(...categories.map(c => c.sortOrder)) + 1 : 1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Auto-generate code from name if empty
    const generatedCode = code.trim().toUpperCase() || name.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

    const catData: CustomExpenseCategory = {
      id: editingCat ? editingCat.id : `cat-${Date.now()}`,
      name: name.trim(),
      code: generatedCode,
      badgeColor,
      sortOrder: Number(sortOrder),
    };

    onSaveCategory(catData);
    toast.success(editingCat ? 'Kategori pengeluaran diperbarui!' : 'Kategori pengeluaran baru ditambahkan!');
    handleAddNew();
  };

  const handleDelete = (cat: CustomExpenseCategory & { expensesCount?: number }) => {
    if (cat.expensesCount && cat.expensesCount > 0) {
      toast.error(`Kategori "${cat.name}" tidak dapat dihapus karena memiliki ${cat.expensesCount} catatan pengeluaran terikat.`);
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`)) {
      onDeleteCategory(cat.id);
      toast.success('Kategori pengeluaran berhasil dihapus.');
      handleAddNew();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-slate-50 border border-slate-200 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh] z-10 animate-fade-in">
        
        {/* Left side: Categories list */}
        <div className="w-full md:w-1/2 p-5 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wider">
                Kategori Pengeluaran
              </h3>
            </div>

            <div className="space-y-2 pr-1">
              {categories.length === 0 ? (
                <p className="text-[12px] text-slate-400 text-center py-8">Belum ada kategori pengeluaran.</p>
              ) : (
                categories
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => handleEditClick(cat)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        editingCat && editingCat.id === cat.id
                          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-500/10'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full bg-${cat.badgeColor}-500`} />
                        <div>
                          <p className="text-[12px] font-bold text-slate-800 leading-tight">{cat.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Kode: {cat.code} | Order: {cat.sortOrder}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10.5px] font-bold text-slate-500">
                          {cat.expensesCount || 0} item
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cat);
                          }}
                          className="p-1 hover:text-rose-600 hover:bg-rose-50 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <button
            onClick={handleAddNew}
            className="w-full mt-4 py-2 border-2 border-dashed border-slate-200 hover:border-blue-400 text-slate-500 hover:text-blue-600 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori Baru</span>
          </button>
        </div>

        {/* Right side: Category Form */}
        <div className="w-full md:w-1/2 p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-4">
              <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wider">
                {editingCat ? 'Detail Kategori' : 'Kategori Baru'}
              </h3>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-[12px] text-slate-600 font-semibold font-sans">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operasional Kendaraan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Kode Kategori Unik (Auto-Capital)</label>
                <input
                  type="text"
                  placeholder="AUTO_CODE_IF_EMPTY"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={!!editingCat} // disable editing code to avoid breaking existing expense tags
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono text-[11px] disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Warna Badge"
                    value={badgeColor}
                    onChange={(v) => setBadgeColor(v)}
                    minWidth="100%"
                    options={[
                      { value: 'indigo', label: 'Indigo' },
                      { value: 'cyan', label: 'Cyan' },
                      { value: 'amber', label: 'Amber' },
                      { value: 'purple', label: 'Purple' },
                      { value: 'slate', label: 'Slate' },
                      { value: 'emerald', label: 'Emerald' },
                      { value: 'rose', label: 'Rose' },
                    ]}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 py-2 px-4.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4.5 h-4.5" />
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

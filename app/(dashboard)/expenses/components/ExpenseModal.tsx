'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, FileText, Image as ImageIcon, Plus } from 'lucide-react';
import { ExpenseItem, ExpenseCategory, CustomExpenseCategory } from '@/types/financial';
import { formatRupiah } from '@/lib/utils/format';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseItem, 'id' | 'createdBy'> & { id?: string }) => void;
  expenseToEdit?: ExpenseItem | null;
  categories: CustomExpenseCategory[];
  onAddCategory?: (category: CustomExpenseCategory) => Promise<any> | void;
}

export function ExpenseModal({ isOpen, onClose, onSave, expenseToEdit, categories, onAddCategory }: ExpenseModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>('');
  const [amount, setAmount] = useState<number>(0);
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');

  // Inline category state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setCategory(expenseToEdit.category);
      setAmount(expenseToEdit.amount);
      setDisplayAmount(formatRupiah(expenseToEdit.amount));
      setDate(expenseToEdit.createdAt.split('T')[0]);
      setDescription(expenseToEdit.description);
      setReceiptUrl(expenseToEdit.receiptUrl || '');
      setImagePreview(expenseToEdit.receiptUrl || '');
    } else {
      setCategory(categories[0]?.code || 'OTHER');
      setAmount(0);
      setDisplayAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setReceiptUrl('');
      setImagePreview('');
    }
  }, [expenseToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSaveNewCategory = async () => {
    if (!newCatName.trim()) {
      alert('Nama kategori tidak boleh kosong');
      return;
    }
    const cleanName = newCatName.trim();
    const code = cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    const newCatData: CustomExpenseCategory = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      code: code,
      badgeColor: 'blue',
      sortOrder: categories.length + 1,
    };

    setIsAddingCat(true);
    try {
      if (onAddCategory) {
        await onAddCategory(newCatData);
      }
      setCategory(code);
      setNewCatName('');
      setShowAddCat(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingCat(false);
    }
  };

  // Handles raw number parsing and formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const numVal = parseInt(rawVal, 10) || 0;
    setAmount(numVal);
    setDisplayAmount(numVal > 0 ? formatRupiah(numVal) : '');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setReceiptUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Nominal harus lebih besar dari 0');
      return;
    }
    if (!description.trim()) {
      alert('Catatan pengeluaran harus diisi');
      return;
    }

    onSave({
      id: expenseToEdit?.id,
      category,
      amount,
      description,
      receiptUrl: receiptUrl || undefined,
      createdAt: new Date(date).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-[16px] font-extrabold text-slate-800">
              {expenseToEdit ? 'Edit Pengeluaran Toko' : 'Tambah Pengeluaran Toko'}
            </h3>
            <p className="text-[11px] text-slate-400">Pencatatan pengeluaran operasional (OPEX) harian</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Kategori */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Kategori Pengeluaran
              </label>
              <button
                type="button"
                onClick={() => setShowAddCat(!showAddCat)}
                className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Tambah Kategori</span>
              </button>
            </div>

            {showAddCat && (
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                  Kategori Baru
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Listrik & Air, Gaji Staf"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    disabled={isAddingCat}
                    onClick={handleSaveNewCategory}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isAddingCat ? 'Simpan...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddCat(false); setNewCatName(''); }}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] font-bold rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <CustomSelect
              label="Kategori Pengeluaran"
              value={category}
              onChange={(v) => setCategory(v)}
              minWidth="100%"
              options={categories.map((cat) => ({ value: cat.code, label: `${cat.name} (${cat.code})` }))}
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nominal Pengeluaran (Rp)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Rp 0"
                value={displayAmount}
                onChange={handleAmountChange}
                className="w-full h-10 pl-3 pr-3 text-[13px] font-bold border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all bg-slate-50"
              />
            </div>
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tanggal Pengeluaran
            </label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 pl-10 pr-3 text-[12px] border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all bg-slate-50"
              />
            </div>
          </div>

          {/* Catatan / Deskripsi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Catatan Detail / Keterangan
            </label>
            <div className="relative flex">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <textarea
                required
                rows={3}
                placeholder="Contoh: Pembayaran listrik token token PLN 200k + admin"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all bg-slate-50 resize-none"
              />
            </div>
          </div>

          {/* Upload Nota Bukti Fisik */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Upload Nota / Bukti Pembayaran
            </label>
            <div className="flex gap-4 items-center">
              <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all shrink-0">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 mt-1 font-bold">Pilih File</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>

              {imagePreview ? (
                <div className="relative w-28 h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner group">
                  <img 
                    src={imagePreview} 
                    alt="Nota Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setReceiptUrl('');
                    }}
                    className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-xl border-2 border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[9px] mt-1">Belum Ada Nota</span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-xl transition-colors active:scale-95 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer"
            >
              {expenseToEdit ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

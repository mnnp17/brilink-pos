'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import { FinancialAccount, AccountType } from '../types/account-master';
import { toast } from 'sonner';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: FinancialAccount) => void;
  accountToEdit: FinancialAccount | null;
}

interface AccountFormValues {
  accountName: string;
  accountType: AccountType;
  bankName?: string;
  accountNumberOrTid?: string;
  currentBalance: number;
  minBalanceThreshold: number;
  colorCode?: string;
  isActive: boolean;
}

export function AccountFormModal({ isOpen, onClose, onSave, accountToEdit }: AccountFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AccountFormValues>({
    defaultValues: {
      accountName: '',
      accountType: 'BANK_ACCOUNT',
      bankName: '',
      accountNumberOrTid: '',
      currentBalance: 0,
      minBalanceThreshold: 5000000,
      colorCode: 'blue',
      isActive: true,
    },
  });

  const watchType = watch('accountType');

  // Reset form when opening modal
  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        reset({
          accountName: accountToEdit.accountName,
          accountType: accountToEdit.accountType,
          bankName: accountToEdit.bankName || '',
          accountNumberOrTid: accountToEdit.accountNumberOrTid || '',
          currentBalance: accountToEdit.currentBalance,
          minBalanceThreshold: accountToEdit.minBalanceThreshold,
          colorCode: accountToEdit.colorCode || 'blue',
          isActive: accountToEdit.isActive,
        });
      } else {
        reset({
          accountName: '',
          accountType: 'BANK_ACCOUNT',
          bankName: '',
          accountNumberOrTid: '',
          currentBalance: 0,
          minBalanceThreshold: 5000000,
          colorCode: 'blue',
          isActive: true,
        });
      }
    }
  }, [isOpen, accountToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: AccountFormValues) => {
    if (!data.accountName.trim() || data.accountName.length < 3) {
      toast.error('Nama rekening minimal 3 karakter!');
      return;
    }

    if (data.accountType !== 'CASH_DRAWER' && !data.accountNumberOrTid?.trim()) {
      toast.error('Nomor Rekening / TID wajib diisi untuk Bank atau EDC!');
      return;
    }

    // Force casting string values from HTML number input to actual number
    const currentBalance = Number(data.currentBalance) || 0;
    const minBalanceThreshold = Number(data.minBalanceThreshold) || 0;

    if (currentBalance < 0) {
      toast.error('Saldo tidak boleh kurang dari 0!');
      return;
    }

    if (minBalanceThreshold < 0) {
      toast.error('Batas minimum threshold tidak boleh kurang dari 0!');
      return;
    }

    const formattedAccount: FinancialAccount = {
      ...data,
      currentBalance,
      minBalanceThreshold,
      id: accountToEdit ? accountToEdit.id : `acc-${Date.now()}`,
      createdAt: accountToEdit ? accountToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMutatedAt: accountToEdit ? accountToEdit.lastMutatedAt : new Date().toISOString(),
      
      // Compatibility fields for legacy POS
      name: data.accountName,
      accountNumber: data.accountNumberOrTid || '',
      balance: data.currentBalance,
      type: data.accountType === 'CASH_DRAWER' ? 'cash' : 'bank',
    };

    onSave(formattedAccount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-fade-in">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Master Rekening</span>
            <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">
              {accountToEdit ? 'Edit Akun Rekening' : 'Daftar Akun Rekening Baru'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3.5 text-[12px] text-slate-600 font-semibold max-h-[75vh] overflow-y-auto">
          
          {/* Account Type */}
          <div>
            <CustomSelect
              label="Tipe Akun Likuiditas"
              value={watchType}
              onChange={(v) => setValue('accountType', v as AccountType)}
              minWidth="100%"
              options={[
                { value: 'CASH_DRAWER', label: 'Kas Laci Tunai' },
                { value: 'BANK_ACCOUNT', label: 'Rekening Bank' },
                { value: 'EDC_MERCHANT', label: 'Mesin EDC Merchant' },
              ]}
            />
            {!!accountToEdit && (
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Tipe akun tidak dapat diubah setelah dibuat.</p>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Akun/Rekening</label>
            <input
              type="text"
              placeholder="Contoh: Laci Tunai Gemilang, BRI Utama"
              {...register('accountName')}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white text-slate-800 font-bold"
            />
            {errors.accountName && (
              <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.accountName.message}</p>
            )}
          </div>

          {/* Bank Name (only if Bank/EDC) */}
          {watchType !== 'CASH_DRAWER' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Bank Penerbit</label>
              <input
                type="text"
                placeholder="Contoh: Bank Rakyat Indonesia (BRI), BCA"
                {...register('bankName')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white text-slate-800 font-bold"
              />
            </div>
          )}

          {/* Account Number / TID (only if Bank/EDC) */}
          {watchType !== 'CASH_DRAWER' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {watchType === 'BANK_ACCOUNT' ? 'Nomor Rekening Bank' : 'TID / ID Mesin EDC'}
              </label>
              <input
                type="text"
                placeholder={watchType === 'BANK_ACCOUNT' ? 'Contoh: 0021-01-XXXX-XX-X' : 'Contoh: TID-880012'}
                {...register('accountNumberOrTid')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800 text-[11.5px]"
              />
              {errors.accountNumberOrTid && (
                <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.accountNumberOrTid.message}</p>
              )}
            </div>
          )}

          {/* Current Balance (Initial) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Saldo Saat Ini (Rp)</label>
            <input
              type="number"
              disabled={!!accountToEdit} // balance adjustment modal handles updates
              placeholder="Contoh: 10000000"
              {...register('currentBalance')}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800 disabled:opacity-60"
            />
            {errors.currentBalance && (
              <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.currentBalance.message}</p>
            )}
          </div>

          {/* Threshold Minimum */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Threshold Batas Minimum (Rp)</label>
            <input
              type="number"
              placeholder="Default: 5000000"
              {...register('minBalanceThreshold')}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800"
            />
            {errors.minBalanceThreshold && (
              <p className="text-[10px] text-rose-500 font-bold mt-0.5">{errors.minBalanceThreshold.message}</p>
            )}
          </div>

          {/* Theme Badge Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Warna Tema Kartu"
                value={watch('colorCode') || 'blue'}
                onChange={(v) => setValue('colorCode', v)}
                minWidth="100%"
                options={[
                  { value: 'blue', label: 'Biru' },
                  { value: 'emerald', label: 'Hijau' },
                  { value: 'amber', label: 'Kuning' },
                  { value: 'rose', label: 'Merah' },
                  { value: 'purple', label: 'Ungu' },
                  { value: 'slate', label: 'Abu-abu' },
                ]}
              />
            </div>

            {/* Is Active Toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 py-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-[11px] font-bold text-slate-700">Aktifkan Rekening</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 py-2 px-4.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4.5 h-4.5" />
              <span>Simpan Rekening</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

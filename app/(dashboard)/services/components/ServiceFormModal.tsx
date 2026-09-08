'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { CatalogServiceItem, ServiceCategory, FeeTierRule } from '../types/catalog-master';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';
import { toast } from 'sonner';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  accounts: Array<{ id: string; name: string }>;
  service: CatalogServiceItem | null;
  onSave: (service: CatalogServiceItem) => void;
  onManageCategory?: () => void;
}

export function ServiceFormModal({
  isOpen,
  onClose,
  categories,
  accounts,
  service,
  onSave,
  onManageCategory,
}: ServiceFormModalProps) {
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CatalogServiceItem>({
    defaultValues: {
      name: '',
      serviceCode: '',
      categoryId: '',
      defaultAccountId: '',
      minTxAmount: 0,
      maxTxAmount: 10000000,
      feeType: 'FLAT',
      isActive: true,
      flatCustomerAdmin: 0,
      flatBankFeeCogs: 0,
      percentageCustomerAdmin: 0,
      percentageBankFeeCogs: 0,
      maxPercentageCap: 0,
      tierRules: [{ minAmount: 10000, maxAmount: 1000000, customerAdminFee: 5000, bankFeeCogs: 2000, netProfit: 3000 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tierRules',
  });

  const watchFeeType = watch('feeType');
  const watchTierRules = watch('tierRules') || [];
  
  // Flat profit calculation
  const watchFlatAdmin = watch('flatCustomerAdmin') || 0;
  const watchFlatCogs = watch('flatBankFeeCogs') || 0;
  const flatProfit = watchFlatAdmin - watchFlatCogs;
  const flatMargin = watchFlatAdmin > 0 ? (flatProfit / watchFlatAdmin) * 100 : 0;

  // Percentage profit calculation
  const watchPercentageAdmin = watch('percentageCustomerAdmin') || 0;
  const watchPercentageCogs = watch('percentageBankFeeCogs') || 0;
  const percentageProfit = watchPercentageAdmin - watchPercentageCogs;
  const percentageMargin = watchPercentageAdmin > 0 ? (percentageProfit / watchPercentageAdmin) * 100 : 0;

  const watchName = watch('name');

  // Auto-generate serviceCode from name input
  useEffect(() => {
    if (!service && watchName) {
      const generateCodeFromName = (val: string) => {
        const clean = val.toLowerCase().trim();
        let prefix = '';
        let rest = clean;
        
        if (clean.startsWith('tarik tunai')) {
          prefix = 'TT';
          rest = clean.replace('tarik tunai', '');
        } else if (clean.startsWith('transfer')) {
          prefix = 'TR';
          rest = clean.replace('transfer', '');
        } else if (clean.startsWith('e-money') || clean.startsWith('emoney')) {
          prefix = 'EM';
          rest = clean.replace(/e-?money/, '');
        } else if (clean.startsWith('token')) {
          prefix = 'TKN';
          rest = clean.replace('token', '');
        }
        
        const suffix = rest
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, '')
          .trim()
          .split(/\s+/)
          .join('-');
          
        if (prefix) {
          return suffix ? `${prefix}-${suffix}` : prefix;
        }
        
        return clean
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, '')
          .trim()
          .split(/\s+/)
          .join('-')
          .substring(0, 10);
      };

      setValue('serviceCode', generateCodeFromName(watchName));
    }
  }, [watchName, service, setValue]);

  // Reset form values when service prop changes
  useEffect(() => {
    if (isOpen) {
      if (service) {
        reset(service);
      } else {
        reset({
          name: '',
          serviceCode: '',
          categoryId: categories[0]?.id || '',
          defaultAccountId: accounts[0]?.id || '',
          minTxAmount: 0,
          maxTxAmount: 10000000,
          feeType: 'FLAT',
          isActive: true,
          flatCustomerAdmin: 0,
          flatBankFeeCogs: 0,
          percentageCustomerAdmin: 0,
          percentageBankFeeCogs: 0,
          maxPercentageCap: 0,
          tierRules: [{ minAmount: 10000, maxAmount: 1000000, customerAdminFee: 5000, bankFeeCogs: 2000, netProfit: 3000 }],
          cashflowType: 'MUTATION_ONLY',
          adminFeeRule: 'FLEXIBLE',
          adminFeeEditable: false,
          minAdminFee: 0,
          maxAdminFee: 50000,
          requiresCustomerRef: false,
          customerRefLabel: '',
        });
      }
    }
  }, [service, isOpen, reset, categories, accounts]);

  if (!isOpen) return null;

  const onSubmit = (data: CatalogServiceItem) => {
    // Inter-tier overlap validation
    if (data.feeType === 'TIERED' && data.tierRules) {
      if (data.tierRules.length === 0) {
        toast.error('Aturan bertingkat minimal harus memiliki 1 tier.');
        return;
      }

      // Check min < max inside each tier
      for (let i = 0; i < data.tierRules.length; i++) {
        const tier = data.tierRules[i];
        if (Number(tier.minAmount) >= Number(tier.maxAmount)) {
          toast.error(`Kesalahan Tier ${i + 1}: Batas Maksimal (${formatRupiah(tier.maxAmount)}) harus lebih besar dari Batas Minimal (${formatRupiah(tier.minAmount)}).`);
          return;
        }
      }

      // Check inter-tier boundaries
      for (let i = 1; i < data.tierRules.length; i++) {
        const prevTier = data.tierRules[i - 1];
        const currTier = data.tierRules[i];
        if (Number(currTier.minAmount) <= Number(prevTier.maxAmount)) {
          toast.error(
            `Aturan Tier Overlap (Tumpang Tindih): Batas Minimal Tier ${i + 1} (${formatRupiah(currTier.minAmount)}) harus lebih besar dari Batas Maksimal Tier ${i} (${formatRupiah(prevTier.maxAmount)}).`
          );
          return;
        }
      }

      // Compute netProfit on each tier
      data.tierRules = data.tierRules.map(tier => ({
        ...tier,
        minAmount: Number(tier.minAmount),
        maxAmount: Number(tier.maxAmount),
        customerAdminFee: Number(tier.customerAdminFee),
        bankFeeCogs: Number(tier.bankFeeCogs),
        netProfit: Number(tier.customerAdminFee) - Number(tier.bankFeeCogs),
      }));
    }

    // Assemble dynamic Category & Account Name labels
    const selectedCat = categories.find(c => c.id === data.categoryId);
    const selectedAcc = accounts.find(a => a.id === data.defaultAccountId);

    const assembledItem: CatalogServiceItem = {
      ...data,
      id: service ? service.id : `srv-${Date.now()}`,
      categoryName: selectedCat ? selectedCat.name : '',
      defaultAccountName: selectedAcc ? selectedAcc.name : '',
      minTxAmount: Number(data.minTxAmount),
      maxTxAmount: Number(data.maxTxAmount),
      flatCustomerAdmin: Number(data.flatCustomerAdmin || 0),
      flatBankFeeCogs: Number(data.flatBankFeeCogs || 0),
      percentageCustomerAdmin: Number(data.percentageCustomerAdmin || 0),
      percentageBankFeeCogs: Number(data.percentageBankFeeCogs || 0),
      maxPercentageCap: Number(data.maxPercentageCap || 0),
      createdAt: service ? service.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(assembledItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Master Konfigurasi</span>
            <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">
              {service ? 'Edit Detail Layanan POS' : 'Buat Layanan POS Baru'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4 text-[12px] text-slate-600 font-semibold">
          
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Layanan</label>
              <input
                type="text"
                placeholder="Contoh: Transfer Bank Lain"
                {...register('name', { required: true })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Kode Layanan Unik</label>
              <input
                type="text"
                placeholder="#TR-NON"
                {...register('serviceCode', { required: true })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono text-[11px] uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-600">Kategori Layanan</label>
                {onManageCategory && (
                  <button 
                    type="button" 
                    onClick={onManageCategory} 
                    className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3 text-blue-600" /> Tambah Kategori
                  </button>
                )}
              </div>
              <CustomSelect
                label="Kategori Layanan"
                value={watch('categoryId') || ''}
                onChange={(v) => setValue('categoryId', v)}
                minWidth="100%"
                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Default Rekening / EDC</label>
              <CustomSelect
                label="Default Rekening / EDC"
                value={watch('defaultAccountId') || ''}
                onChange={(v) => setValue('defaultAccountId', v)}
                minWidth="100%"
                options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
              />
            </div>
          </div>

          {/* Section 2: Range Nominal */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Limit Batas Transaksi</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Nominal Minimum (Rp)</label>
                <input
                  type="number"
                  {...register('minTxAmount', { required: true })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Nominal Maksimum (Rp)</label>
                <input
                  type="number"
                  {...register('maxTxAmount', { required: true })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Cost Type Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Skema & Aturan Biaya</label>
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 w-fit">
                <button
                  type="button"
                  onClick={() => setValue('feeType', 'FLAT')}
                  className={`px-3.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    watchFeeType === 'FLAT' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Flat Rate (Tetap)
                </button>
                <button
                  type="button"
                  onClick={() => setValue('feeType', 'PERCENTAGE')}
                  className={`px-3.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    watchFeeType === 'PERCENTAGE' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Persentase (%)
                </button>
                <button
                  type="button"
                  onClick={() => setValue('feeType', 'TIERED')}
                  className={`px-3.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    watchFeeType === 'TIERED' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Bertingkat (Tiered)
                </button>
              </div>
            </div>

            {/* FLAT FEE CONFIG */}
            {watchFeeType === 'FLAT' && (
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Admin Pelanggan (Rp)</label>
                  <input
                    type="number"
                    {...register('flatCustomerAdmin')}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Beban COGS Bank (Rp)</label>
                  <input
                    type="number"
                    {...register('flatBankFeeCogs')}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-rose-500"
                  />
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-500">Estimasi Margin Laba:</span>
                  <span className="font-bold text-emerald-600">
                    Rp {flatProfit.toLocaleString('id-ID')} ({flatMargin.toFixed(1)}% Margin)
                  </span>
                </div>
              </div>
            )}

            {/* PERCENTAGE CONFIG */}
            {watchFeeType === 'PERCENTAGE' && (
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Persentase Admin Pelanggan (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('percentageCustomerAdmin')}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Persentase COGS Bank (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('percentageBankFeeCogs')}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-rose-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Batas Maksimal Admin / Cap Limit (Rp, 0 jika tanpa batas)</label>
                  <input
                    type="number"
                    {...register('maxPercentageCap')}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-slate-600"
                  />
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-500">Spread Persentase Keuntungan:</span>
                  <span className="font-bold text-emerald-600">
                    +{percentageProfit.toFixed(2)}% ({percentageMargin.toFixed(1)}% Margin)
                  </span>
                </div>
              </div>
            )}

            {/* TIERED CONFIG */}
            {watchFeeType === 'TIERED' && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Aturan Tiering Nominal</span>
                  <button
                    type="button"
                    onClick={() => append({ minAmount: 0, maxAmount: 0, customerAdminFee: 0, bankFeeCogs: 0, netProfit: 0 })}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Tier</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {fields.map((field, index) => {
                    const row = watchTierRules[index] || { customerAdminFee: 0, bankFeeCogs: 0 };
                    const profit = (Number(row.customerAdminFee) || 0) - (Number(row.bankFeeCogs) || 0);

                    return (
                      <div key={field.id} className="relative bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                        {/* Remove row button */}
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-[10px] text-slate-400 font-black uppercase">Tier #{index + 1}</span>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Batas Minimal (Rp)</label>
                            <input
                              type="number"
                              required
                              {...register(`tierRules.${index}.minAmount` as const, { required: true })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Batas Maksimal (Rp)</label>
                            <input
                              type="number"
                              required
                              {...register(`tierRules.${index}.maxAmount` as const, { required: true })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Admin Pelanggan (Rp)</label>
                            <input
                              type="number"
                              required
                              {...register(`tierRules.${index}.customerAdminFee` as const, { required: true })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">COGS Bank (Rp)</label>
                            <input
                              type="number"
                              required
                              {...register(`tierRules.${index}.bankFeeCogs` as const, { required: true })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white font-medium text-rose-500"
                            />
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-200/60 flex justify-between items-center text-[10.5px]">
                          <span className="text-slate-400 font-bold">Laba Bersih Est:</span>
                          <span className="font-extrabold text-emerald-600">
                            Rp {profit.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Karakteristik & Aturan Operasional (Owner Guardrails) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] text-blue-600 font-extrabold uppercase tracking-wider block">
              Pusat Kendali Aturan Operasional (Owner Guardrails)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Klasifikasi Arus Kas */}
              <div>
                <CustomSelect
                  label="Klasifikasi Arus Kas & Sumber Rekening"
                  value={watch('cashflowType') || ''}
                  onChange={(v) => setValue('cashflowType', v as any)}
                  minWidth="100%"
                  options={[
                    { value: 'TRANSFER_FLEXIBLE', label: 'Transfer Bank (Fleksibel: Kasir Pilih Rekening BRILink / Nasabah)' },
                    { value: 'TRANSFER_STORE_BALANCE', label: 'Transfer Bank (Terkunci: Wajib Saldo Toko BRILink)' },
                    { value: 'TRANSFER_CUSTOMER_BALANCE', label: 'Transfer Bank (Terkunci: Wajib Saldo / ATM Nasabah - Admin Tunai)' },
                    { value: 'ADD_CASH', label: 'Tambah Kas Laci (Setor Tunai - Nasabah Serah Uang Fisik)' },
                    { value: 'REDUCE_CASH', label: 'Kurangi Kas Laci (Tarik Tunai - Keluar Uang Fisik)' },
                    { value: 'MUTATION_ONLY', label: 'Mutasi Digital Murni (PPOB / PLN / Pulsa)' },
                  ]}
                />
              </div>

              {/* Aturan Penagihan Admin */}
              <div>
                <CustomSelect
                  label="Aturan Metode Penagihan Admin"
                  value={watch('adminFeeRule') || ''}
                  onChange={(v) => setValue('adminFeeRule', v as any)}
                  minWidth="100%"
                  options={[
                    { value: 'FLEXIBLE', label: 'Fleksibel / Bebas Dipilih Kasir' },
                    { value: 'MANDATORY_CASH', label: 'Wajib Tunai Pas Terpisah (Cash)' },
                    { value: 'MANDATORY_DEDUCTED', label: 'Wajib Potong Saldo / Dipotong dari Kartu' },
                  ]}
                />
              </div>
            </div>

            {/* Syarat Data Pelanggan */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="srv-requires-ref"
                  {...register('requiresCustomerRef')}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="srv-requires-ref" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                  Wajibkan Input Nomor Rekening / ID Pelanggan / No. Meter PLN
                </label>
              </div>

              {watch('requiresCustomerRef') && (
                <div className="pl-6">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Label Bidang Input Pelanggan di Kasir</label>
                  <input
                    type="text"
                    {...register('customerRefLabel')}
                    placeholder="Contoh: No. Rekening Tujuan, No. Meter PLN, ID Pelanggan"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-slate-700 text-[11px]"
                  />
                </div>
              )}
            </div>

            {/* Wewenang Ubah Biaya Admin */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="srv-admin-editable"
                  {...register('adminFeeEditable')}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="srv-admin-editable" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                  Izinkan Kasir Mengubah Nominal Admin di Layar POS (Fleksibel)
                </label>
              </div>

              {watch('adminFeeEditable') && (
                <div className="pl-6 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Batas Minimal Admin (Rp)</label>
                    <input
                      type="number"
                      {...register('minAdminFee')}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-slate-700 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Batas Maksimal Admin (Rp)</label>
                    <input
                      type="number"
                      {...register('maxAdminFee')}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-bold text-slate-700 text-[11px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Toggle Active */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 select-none">
            <input
              type="checkbox"
              id="srv-active"
              {...register('isActive')}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="srv-active" className="text-[12px] font-black text-slate-700 cursor-pointer">
              Aktifkan Layanan ini untuk Menu Transaksi POS Kasir
            </label>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 shrink-0 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-[12px]"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            className="flex items-center gap-1.5 py-2 px-4.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4.5 h-4.5" />
            <span>Simpan Layanan</span>
          </button>
        </div>
      </div>
    </div>
  );
}

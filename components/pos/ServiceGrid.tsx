'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ScanLine, ArrowRightLeft, Zap, Lightbulb, Smartphone, Droplets, Wallet, Layers } from 'lucide-react';
import { getServices } from '@/lib/actions/service.actions';

import type { CashflowType, AdminFeeRule } from '@/app/(dashboard)/services/types/catalog-master';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  adminFee: number;
  bankFee: number;
  cashflowType?: CashflowType;
  adminFeeRule?: AdminFeeRule;
  adminFeeEditable?: boolean;
  minAdminFee?: number;
  maxAdminFee?: number;
  requiresCustomerRef?: boolean;
  customerRefLabel?: string;
  rawService?: any;
}

interface ServiceGridProps {
  selectedServiceId: string | null;
  onSelect: (service: ServiceItem) => void;
}

export function ServiceGrid({ selectedServiceId, onSelect }: ServiceGridProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  const { data: dbServices = [], isLoading } = useQuery({
    queryKey: ['pos-services'],
    queryFn: async () => {
      const res = await getServices();
      if (res.success && res.data) {
        return res.data;
      }
      return [];
    }
  });

  const services = useMemo<ServiceItem[]>(() => {
    return dbServices.map((s: any) => {
      const categoryName = s.service_categories?.name || 'Lainnya';
      
      let icon = <ArrowRightLeft className="h-5 w-5" />;
      const nameLower = s.name.toLowerCase();
      
      if (nameLower.includes('tarik') || nameLower.includes('cashback') || nameLower.includes('laci')) {
        icon = <Wallet className="h-5 w-5" />;
      } else if (nameLower.includes('pln') || nameLower.includes('listrik') || nameLower.includes('token')) {
        icon = <Zap className="h-5 w-5" />;
      } else if (nameLower.includes('pulsa') || nameLower.includes('paket') || nameLower.includes('kuota') || nameLower.includes('hp')) {
        icon = <Smartphone className="h-5 w-5" />;
      } else if (nameLower.includes('pdam') || nameLower.includes('air')) {
        icon = <Droplets className="h-5 w-5" />;
      } else if (nameLower.includes('wallet') || nameLower.includes('dana') || nameLower.includes('gopay') || nameLower.includes('ovo') || nameLower.includes('shopee')) {
        icon = <Wallet className="h-5 w-5" />;
      }

      // Infer defaults if missing in legacy database rows
      let cashflowType = s.cashflow_type;
      if (!cashflowType) {
        if (nameLower.includes('setor')) cashflowType = 'ADD_CASH';
        else if (nameLower.includes('tarik')) cashflowType = 'REDUCE_CASH';
        else cashflowType = 'MUTATION_ONLY';
      }

      let adminFeeRule = s.admin_fee_rule;
      if (!adminFeeRule) {
        if (nameLower.includes('setor')) adminFeeRule = 'MANDATORY_CASH';
        else if (nameLower.includes('tarik')) adminFeeRule = 'FLEXIBLE';
        else adminFeeRule = 'MANDATORY_DEDUCTED';
      }

      let requiresCustomerRef = s.requires_customer_ref;
      if (requiresCustomerRef === undefined || requiresCustomerRef === null) {
        requiresCustomerRef = !nameLower.includes('tarik');
      }

      let bankFee = Number(s.flat_bank_fee_cogs || 0);
      if (s.fee_type === 'TIERED' && s.service_fee_tiers && s.service_fee_tiers.length > 0) {
        bankFee = Number(s.service_fee_tiers[0].bank_fee_cogs || 0);
      }

      return {
        id: s.id,
        name: s.name,
        description: s.service_code,
        icon,
        category: categoryName,
        adminFee: Number(s.flat_customer_admin || 0),
        bankFee,
        cashflowType,
        adminFeeRule,
        adminFeeEditable: s.admin_fee_editable !== false,
        minAdminFee: Number(s.min_admin_fee || 0),
        maxAdminFee: Number(s.max_admin_fee || 50000),
        requiresCustomerRef,
        customerRefLabel: s.customer_ref_label || (nameLower.includes('transfer') ? 'Nomor Rekening Tujuan' : 'ID Pelanggan / No. Meter PLN'),
        rawService: s,
      };
    });
  }, [dbServices]);

  const categories = useMemo<string[]>(() => {
    const list = new Set<string>();
    list.add('Semua');
    services.forEach((s) => list.add(s.category));
    return Array.from(list);
  }, [services]);

  const getCategoryColorClass = (cat: string) => {
    if (cat === 'Semua') return 'bg-slate-100 text-slate-600';
    const catLower = cat.toLowerCase();
    if (catLower.includes('perbankan') || catLower.includes('bri') || catLower.includes('bank') || catLower.includes('transfer')) {
      return 'bg-blue-100 text-blue-600';
    }
    if (catLower.includes('ppob') || catLower.includes('pulsa') || catLower.includes('listrik')) {
      return 'bg-amber-100 text-amber-600';
    }
    if (catLower.includes('kios') || catLower.includes('barang')) {
      return 'bg-emerald-100 text-emerald-600';
    }
    return 'bg-purple-100 text-purple-600';
  };

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchCat = activeCategory === 'Semua' || s.category === activeCategory;
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, activeCategory, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-8 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#001E36] border-t-transparent" />
        <span className="text-xs text-slate-400 font-semibold">Memuat katalog layanan...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari layanan..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[14px] text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] transition-all"
        />
      </div>

      {/* Category Filter Chips */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-[#001E36] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((service) => {
            const isSelected = selectedServiceId === service.id;
            return (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className={`group relative flex flex-col items-start gap-2.5 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/30 shadow-[0_0_0_1px_rgba(37,99,235,0.2)]'
                    : 'border-transparent bg-white hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}

                {/* Icon */}
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : getCategoryColorClass(service.category)
                } transition-colors group-hover:scale-105 transition-transform`}>
                  {service.icon}
                </div>

                {/* Text */}
                <div>
                  <p className={`text-[13px] font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {service.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 font-mono uppercase">{service.description}</p>
                </div>

              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-200 p-6 text-center">
          {dbServices.length === 0 ? (
            <>
              <Layers className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-[14px] font-bold text-slate-600">Katalog Layanan Kosong</p>
              <p className="text-[12px] text-slate-400 mt-1.5 max-w-sm">
                Belum ada menu layanan yang ditambahkan oleh Owner. Silakan buat kategori dan layanan baru di dashboard Owner terlebih dahulu.
              </p>
            </>
          ) : (
            <>
              <Search className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-[14px] font-semibold text-slate-400">Layanan tidak ditemukan</p>
              <p className="text-[12px] text-slate-300 mt-1">Coba kata kunci lain atau pilih kategori berbeda</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

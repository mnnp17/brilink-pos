'use client';

import React, { useState } from 'react';
import { CatalogServiceItem } from '../types/catalog-master';
import { formatRupiah } from '@/lib/utils/format';
import { Edit3, Trash2, ChevronDown, ChevronUp, Layers, CheckCircle2, XCircle } from 'lucide-react';

interface ServiceTableProps {
  services: CatalogServiceItem[];
  onEdit: (service: CatalogServiceItem) => void;
  onDelete: (id: string) => void;
}

export function ServiceTable({ services, onEdit, onDelete }: ServiceTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderCashflowBadge = (service: CatalogServiceItem) => {
    const cf = service.cashflowType || (service.name.toLowerCase().includes('setor') ? 'ADD_CASH' : service.name.toLowerCase().includes('tarik') ? 'REDUCE_CASH' : service.name.toLowerCase().includes('transfer') ? 'TRANSFER_FLEXIBLE' : 'MUTATION_ONLY');
    let label = 'Mutasi Digital';
    let color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (cf === 'ADD_CASH') {
      label = '+Kas Laci (Setor)';
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (cf === 'REDUCE_CASH') {
      label = '-Kas Laci (Tarik)';
      color = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (cf === 'TRANSFER_FLEXIBLE') {
      label = 'Transfer (Fleksibel)';
      color = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (cf === 'TRANSFER_STORE_BALANCE') {
      label = 'Transfer (Saldo Toko)';
      color = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (cf === 'TRANSFER_CUSTOMER_BALANCE') {
      label = 'Transfer (ATM Nasabah)';
      color = 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold border mt-1 ${color}`}>
        {label}
      </span>
    );
  };

  const renderFeeTypeLabel = (type: CatalogServiceItem['feeType']) => {
    if (type === 'FLAT') return 'Flat Rate';
    if (type === 'PERCENTAGE') return 'Persentase';
    return 'Bertingkat (Tier)';
  };

  const renderFormulaSpread = (service: CatalogServiceItem) => {
    if (service.feeType === 'FLAT') {
      const admin = service.flatCustomerAdmin || 0;
      const cogs = service.flatBankFeeCogs || 0;
      const profit = admin - cogs;
      return (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-800 leading-tight">
            {formatRupiah(admin)} - <span className="text-rose-500 font-medium">-{formatRupiah(cogs)}</span>
          </p>
          <p className="text-[10px] text-emerald-600 font-extrabold">
            = {formatRupiah(profit)}
          </p>
        </div>
      );
    }

    if (service.feeType === 'PERCENTAGE') {
      const admin = service.percentageCustomerAdmin || 0;
      const cogs = service.percentageBankFeeCogs || 0;
      return (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-800 leading-tight">
            Admin: {admin}% | COGS: <span className="text-rose-500">{cogs}%</span>
          </p>
          {service.maxPercentageCap && service.maxPercentageCap > 0 ? (
            <p className="text-[9.5px] text-slate-400 font-bold">
              Cap Limit: {formatRupiah(service.maxPercentageCap)}
            </p>
          ) : null}
        </div>
      );
    }

    // Tiered Row
    const isExpanded = !!expandedRows[service.id];
    return (
      <button
        onClick={() => toggleRow(service.id)}
        className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-[10.5px] font-bold text-slate-600 transition-all cursor-pointer"
      >
        <span>{service.tierRules?.length || 0} Tier Aturan</span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="px-4 py-3.5">Nama Layanan & Kode</th>
              <th className="px-4 py-3.5">Kanal / Rekening</th>
              <th className="px-4 py-3.5">Skema Biaya</th>
              <th className="px-4 py-3.5">Batas Nominal</th>
              <th className="px-4 py-3.5">Formulasi (Admin - COGS = Laba)</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
            {services.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400 font-bold">
                  Tidak ada layanan ditemukan.
                </td>
              </tr>
            ) : (
              services.map((service) => {
                const isExpanded = !!expandedRows[service.id];
                
                return (
                  <React.Fragment key={service.id}>
                    {/* Main Row */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800 leading-tight">{service.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-0.5">
                          {service.serviceCode}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-[10.5px]">
                          {service.defaultAccountName || 'Belum diatur'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        <div>
                          <p>{renderFeeTypeLabel(service.feeType)}</p>
                          {renderCashflowBadge(service)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium text-[11px]">
                        {formatRupiah(service.minTxAmount)} - {formatRupiah(service.maxTxAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        {renderFormulaSpread(service)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase border ${
                          service.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {service.isActive ? 'AKTIF' : 'NON-AKTIF'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(service)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit Layanan"
                          >
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => onDelete(service.id)}
                            className="p-1 hover:text-rose-600 hover:bg-rose-50 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Layanan"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Accordion Row for Tier Rules */}
                    {service.feeType === 'TIERED' && isExpanded && service.tierRules && (
                      <tr className="bg-slate-50/40">
                        <td colSpan={7} className="px-6 py-3 border-t border-slate-200/50">
                          <div className="bg-white rounded-xl border border-slate-200/60 p-3 space-y-2.5 max-w-2xl">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                              Aturan Bertingkat (Nominal Range Builder)
                            </span>
                            
                            <table className="w-full text-left text-[11px] font-semibold text-slate-600">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9.5px]">
                                  <th className="py-1">Tier</th>
                                  <th className="py-1">Rentang Nominal Uang</th>
                                  <th className="py-1 text-right">Admin Pelanggan</th>
                                  <th className="py-1 text-right text-rose-500">COGS Bank</th>
                                  <th className="py-1 text-right text-emerald-600">Margin Laba</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {service.tierRules.map((rule, idx) => {
                                  const profit = rule.customerAdminFee - rule.bankFeeCogs;
                                  const margin = rule.customerAdminFee > 0 ? (profit / rule.customerAdminFee) * 100 : 0;
                                  return (
                                    <tr key={idx}>
                                      <td className="py-2 text-slate-800">Tier #{idx + 1}</td>
                                      <td className="py-2 text-slate-500 font-medium">
                                        {formatRupiah(rule.minAmount)} - {formatRupiah(rule.maxAmount)}
                                      </td>
                                      <td className="py-2 text-right text-indigo-600 font-semibold">+{formatRupiah(rule.customerAdminFee)}</td>
                                      <td className="py-2 text-right text-rose-500 font-semibold">-{formatRupiah(rule.bankFeeCogs)}</td>
                                      <td className="py-2 text-right text-emerald-600 font-bold">
                                        +{formatRupiah(profit)} ({margin.toFixed(0)}%)
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

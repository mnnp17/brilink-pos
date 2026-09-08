'use client';

import React, { useState, useEffect } from 'react';
import { CatalogServiceItem } from '../types/catalog-master';
import { X, Search } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface FeeSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: CatalogServiceItem[];
}

export function FeeSimulatorModal({ isOpen, onClose, services }: FeeSimulatorModalProps) {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [result, setResult] = useState<{
    ruleFound: string;
    adminFee: number;
    bankCogs: number;
    netProfit: number;
    marginPct: number;
    warning?: string;
  } | null>(null);

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Recalculate simulation whenever input changes
  useEffect(() => {
    const amount = parseFloat(amountInput) || 0;
    const service = services.find(s => s.id === selectedServiceId);

    if (!service || amount <= 0) {
      setResult(null);
      return;
    }

    // Check tx boundaries
    if (amount < service.minTxAmount || amount > service.maxTxAmount) {
      setResult({
        ruleFound: 'Batas Nominal Terlanggar',
        adminFee: 0,
        bankCogs: 0,
        netProfit: 0,
        marginPct: 0,
        warning: `Nominal transaksi di luar batas aturan layanan: ${formatRupiah(service.minTxAmount)} s/d ${formatRupiah(service.maxTxAmount)}`,
      });
      return;
    }

    let adminFee = 0;
    let bankCogs = 0;
    let ruleFound = '';

    if (service.feeType === 'FLAT') {
      adminFee = service.flatCustomerAdmin || 0;
      bankCogs = service.flatBankFeeCogs || 0;
      ruleFound = 'Aturan Flat Rate (Tetap)';
    } else if (service.feeType === 'PERCENTAGE') {
      const calcAdmin = ((service.percentageCustomerAdmin || 0) / 100) * amount;
      adminFee = service.maxPercentageCap && service.maxPercentageCap > 0
        ? Math.min(calcAdmin, service.maxPercentageCap)
        : calcAdmin;
      
      bankCogs = ((service.percentageBankFeeCogs || 0) / 100) * amount;
      ruleFound = `Aturan Persentase (${service.percentageCustomerAdmin}%) ${
        service.maxPercentageCap && calcAdmin > service.maxPercentageCap ? `(Terkena Cap Limit ${formatRupiah(service.maxPercentageCap)})` : ''
      }`;
    } else if (service.feeType === 'TIERED') {
      const rule = service.tierRules?.find(r => amount >= r.minAmount && amount <= r.maxAmount);
      if (rule) {
        adminFee = rule.customerAdminFee;
        bankCogs = rule.bankFeeCogs;
        ruleFound = `Aturan Bertingkat: Rentang ${formatRupiah(rule.minAmount)} - ${formatRupiah(rule.maxAmount)}`;
      } else {
        setResult({
          ruleFound: 'Tidak Ada Tier Yang Cocok',
          adminFee: 0,
          bankCogs: 0,
          netProfit: 0,
          marginPct: 0,
          warning: `Tidak ditemukan aturan tingkatan (tier) biaya untuk nominal ${formatRupiah(amount)}.`,
        });
        return;
      }
    }

    const netProfit = adminFee - bankCogs;
    const marginPct = adminFee > 0 ? (netProfit / adminFee) * 100 : 0;

    setResult({
      ruleFound,
      adminFee,
      bankCogs,
      netProfit,
      marginPct,
    });
  }, [selectedServiceId, amountInput, services]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Kalkulator Simulasi</span>
            <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">Simulator Tarif & Margin</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-[12px] text-slate-600 font-semibold">
          {/* Select Service */}
          <div>
            <CustomSelect
              label="Pilih Layanan"
              value={selectedServiceId}
              onChange={(v) => setSelectedServiceId(v)}
              minWidth="100%"
              options={services.map(s => ({ value: s.id, label: `${s.name} (${s.serviceCode})` }))}
            />
          </div>

          {/* Input Nominal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Nominal Transaksi (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
              <input
                type="number"
                placeholder="Masukkan nominal, contoh: 2500000"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Results Summary */}
          {result && (
            <div className={`p-4 rounded-2xl border ${result.warning ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'} space-y-3`}>
              <div className="border-b border-dashed border-slate-200 pb-2">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Aturan Pencocokan</span>
                <span className={`text-[11px] font-black ${result.warning ? 'text-rose-600' : 'text-slate-800'}`}>
                  {result.ruleFound}
                </span>
              </div>

              {result.warning ? (
                <p className="text-rose-600 leading-normal font-bold">{result.warning}</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Admin Pelanggan:</span>
                    <span className="text-indigo-600 font-extrabold">+{formatRupiah(result.adminFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beban COGS Bank:</span>
                    <span className="text-rose-500 font-extrabold">-{formatRupiah(result.bankCogs)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                    <span className="font-bold text-slate-800">Net Profit Toko:</span>
                    <div className="text-right">
                      <span className="text-emerald-600 font-black text-[14px]">
                        +{formatRupiah(result.netProfit)}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-black tracking-wide">
                        Margin: {result.marginPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-all text-[12px] cursor-pointer"
          >
            Tutup Simulator
          </button>
        </div>
      </div>
    </div>
  );
}

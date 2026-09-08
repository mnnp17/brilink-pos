'use client';

import { ScanLine } from 'lucide-react';
import type { ServiceItem } from './ServiceGrid';

const QUICK_CHIPS = [
  { label: '50rb', value: 50000 },
  { label: '100rb', value: 100000 },
  { label: '200rb', value: 200000 },
  { label: '500rb', value: 500000 },
  { label: '1 Jt', value: 1000000 },
];

interface TransactionFormProps {
  selectedService: ServiceItem | null;
  accountNumber: string;
  amount: number;
  onAccountNumberChange: (v: string) => void;
  onAmountChange: (v: number) => void;
  recommendedNominals?: number[];
}

export function TransactionForm({
  selectedService,
  accountNumber,
  amount,
  onAccountNumberChange,
  onAmountChange,
  recommendedNominals = [100000, 200000, 500000, 1000000, 2000000],
}: TransactionFormProps) {
  if (!selectedService) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <ScanLine className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-[14px] font-semibold text-slate-400">Pilih layanan di atas</p>
        <p className="mt-1 text-[12px] text-slate-300">Klik salah satu kartu layanan untuk melanjutkan</p>
      </div>
    );
  }

  const formatDisplay = (val: number) =>
    val > 0 ? val.toLocaleString('id-ID') : '';

  const handleAmountInput = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    onAmountChange(cleaned ? parseInt(cleaned, 10) : 0);
  };

  const needsAccountNumber = selectedService.requiresCustomerRef !== false || ['transfer_bri', 'tarik_edc', 'setor_tunai'].includes(selectedService.id);
  const refLabel = selectedService.customerRefLabel || 'Nomor Rekening / ID Pelanggan';

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          {selectedService.icon}
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-slate-800">{selectedService.name}</h3>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Nomor Rekening / ID Pelanggan */}
      {needsAccountNumber && (
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-slate-600">
            {refLabel} <span className="text-[#FF6600]">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => onAccountNumberChange(e.target.value)}
              placeholder={`Masukkan ${refLabel.toLowerCase()}...`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-[14px] font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all"
            />
          </div>
        </div>
      )}

      {/* Nominal */}
      <div>
        <label className="mb-1.5 block text-[12px] font-bold text-slate-600">
          Nominal <span className="text-[#FF6600]">*</span>
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-[16px] font-bold text-slate-400">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatDisplay(amount)}
            onChange={(e) => handleAmountInput(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-[22px] font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all"
          />
        </div>
      </div>

      {/* Quick Chips */}
      <div className="flex flex-wrap gap-2">
        {recommendedNominals.map((val) => {
          const formatChipLabel = (n: number) => {
            if (n >= 1000000) {
              const millions = n / 1000000;
              return `${millions} Jt`;
            }
            if (n >= 1000) {
              return `${n / 1000}rb`;
            }
            return n.toLocaleString('id-ID');
          };
          return (
            <button
              key={val}
              type="button"
              onClick={() => onAmountChange(val)}
              className={`rounded-lg border px-3.5 py-1.5 text-[12px] font-bold transition-all ${
                amount === val
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {formatChipLabel(val)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Printer, Banknote, CreditCard, Building2, UserCheck } from 'lucide-react';
import type { ServiceItem } from './ServiceGrid';

export type PaymentMethod = 'CASH' | 'DEPOSIT' | 'STORE_BALANCE' | 'CUSTOMER_BALANCE';

interface TransactionSummaryProps {
  selectedService: ServiceItem | null;
  accountNumber: string;
  amount: number;
  onProcess: (method: PaymentMethod, cashReceived: number) => void;
  processing?: boolean;
}

export function TransactionSummary({
  selectedService,
  accountNumber,
  amount,
  onProcess,
  processing = false,
}: TransactionSummaryProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceivedRaw, setCashReceivedRaw] = useState('');

  const adminFee = selectedService?.adminFee ?? 0;
  const total = amount + adminFee;
  const cashReceived = parseInt(cashReceivedRaw.replace(/\D/g, '') || '0', 10);

  const nameLower = (selectedService?.name || '').toLowerCase();
  const cfType = selectedService?.cashflowType;

  const isTarikTunai = cfType === 'REDUCE_CASH' || nameLower.includes('tarik');
  const isTransfer = cfType?.startsWith('TRANSFER') || nameLower.includes('transfer');
  const isSetorTunai = cfType === 'ADD_CASH' || nameLower.includes('setor');

  // Set default method when service changes
  useEffect(() => {
    if (isTransfer) {
      if (cfType === 'TRANSFER_CUSTOMER_BALANCE') {
        setPaymentMethod('CUSTOMER_BALANCE');
      } else {
        setPaymentMethod('STORE_BALANCE');
      }
    } else if (isTarikTunai) {
      if (selectedService?.adminFeeRule === 'MANDATORY_DEDUCTED') {
        setPaymentMethod('DEPOSIT');
      } else if (selectedService?.adminFeeRule === 'MANDATORY_CASH') {
        setPaymentMethod('CASH');
      } else {
        setPaymentMethod('DEPOSIT'); // default flexible tarik is gabung potong saldo
      }
    } else {
      setPaymentMethod('CASH');
    }
  }, [selectedService, isTransfer, isTarikTunai, cfType]);

  // Reset cash input when amount or service changes
  useEffect(() => {
    setCashReceivedRaw('');
  }, [amount, selectedService]);

  const formatRp = (val: number) =>
    'Rp ' + val.toLocaleString('id-ID');

  const handleCashInput = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    setCashReceivedRaw(cleaned ? parseInt(cleaned, 10).toLocaleString('id-ID') : '');
  };

  const isRefMissing = selectedService?.requiresCustomerRef && !accountNumber.trim();
  const canProcess = selectedService && amount > 0 && !isRefMissing;

  // Calculate required cash from customer
  let requiredCashAmount = 0;
  if (isTransfer) {
    requiredCashAmount = paymentMethod === 'STORE_BALANCE' ? total : adminFee;
  } else if (isSetorTunai) {
    requiredCashAmount = total;
  } else if (isTarikTunai) {
    requiredCashAmount = paymentMethod === 'CASH' ? adminFee : 0;
  } else {
    requiredCashAmount = total;
  }

  const change = (paymentMethod === 'CASH' || isSetorTunai || (isTransfer && paymentMethod === 'STORE_BALANCE'))
    ? cashReceived - requiredCashAmount
    : 0;

  const isCashValid = requiredCashAmount === 0 || (cashReceived >= requiredCashAmount);

  return (
    <div className="flex h-full flex-col bg-white border-l border-slate-200">
      {/* Title */}
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-400">
          Ringkasan Transaksi
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
        {/* Service Info */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Layanan</span>
              <span className="font-semibold text-slate-800 text-right max-w-[55%]">
                {selectedService?.name ?? '—'}
              </span>
            </div>
            {accountNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">No. Rek / ID</span>
                <span className="font-semibold text-slate-800">{accountNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Nominal</span>
              <span className="font-semibold text-slate-800">
                {amount > 0 ? formatRp(amount) : '—'}
              </span>
            </div>
            {adminFee > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Biaya Admin</span>
                <span className="font-semibold text-slate-800">{formatRp(adminFee)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Total Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wide">
              {isTransfer && paymentMethod === 'CUSTOMER_BALANCE' ? 'Admin Jasa' : 'Total Transaksi'}
            </span>
            <span className="text-[26px] font-black text-slate-900 leading-none">
              {amount > 0 
                ? (isTransfer && paymentMethod === 'CUSTOMER_BALANCE' ? formatRp(adminFee) : formatRp(total))
                : 'Rp —'}
            </span>
          </div>
        </div>

        {/* SKENARIO 1: TRANSFER BANK */}
        {isTransfer && (
          <div className="px-5 py-4 border-b border-slate-100 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Sumber Rekening Transfer
            </p>

            {cfType === 'TRANSFER_STORE_BALANCE' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-[12px]">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>Rekening BRILink (Saldo Toko)</span>
                </div>
                <span className="text-[10px] bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded font-black">TERKUNCI</span>
              </div>
            )}

            {cfType === 'TRANSFER_CUSTOMER_BALANCE' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-[12px]">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                  <span>Rekening Nasabah (Mini ATM EDC)</span>
                </div>
                <span className="text-[10px] bg-purple-200/60 text-purple-800 px-2 py-0.5 rounded font-black">TERKUNCI</span>
              </div>
            )}

            {cfType !== 'TRANSFER_STORE_BALANCE' && cfType !== 'TRANSFER_CUSTOMER_BALANCE' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('STORE_BALANCE')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-2.5 px-2 text-[11.5px] font-bold transition-all cursor-pointer ${
                      paymentMethod === 'STORE_BALANCE'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Rekening BRILink</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CUSTOMER_BALANCE')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-2.5 px-2 text-[11.5px] font-bold transition-all cursor-pointer ${
                      paymentMethod === 'CUSTOMER_BALANCE'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Rekening Nasabah</span>
                  </button>
                </div>

                {paymentMethod === 'STORE_BALANCE' ? (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                    <div className="flex justify-between font-extrabold">
                      <span>Saldo Toko Terpotong:</span>
                      <span className="font-mono text-rose-600">-{formatRp(amount)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold border-t border-blue-200 pt-0.5">
                      <span>Nasabah Wajib Setor Tunai:</span>
                      <span className="font-mono text-blue-700">+{formatRp(total)}</span>
                    </div>
                    <p className="text-[10px] text-blue-600 pt-0.5 leading-tight">
                      💡 Kasir mentransfer dari saldo toko, nasabah menyetorkan uang tunai nominal + admin ke laci kasir.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-[11px] text-purple-900 space-y-1">
                    <div className="flex justify-between font-extrabold">
                      <span>Saldo Digital Toko:</span>
                      <span className="font-mono text-emerald-600">Rp 0 (Aman)</span>
                    </div>
                    <div className="flex justify-between font-extrabold border-t border-purple-200 pt-0.5">
                      <span>Nasabah Bayar Admin Tunai:</span>
                      <span className="font-mono text-purple-700">+{formatRp(adminFee)}</span>
                    </div>
                    <p className="text-[10px] text-purple-600 pt-0.5 leading-tight">
                      💡 Nasabah gesek kartu ATM di Mini ATM EDC. Saldo toko tidak berkurang, kas laci bertambah uang admin tunai.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SKENARIO 2: TARIK TUNAI */}
        {isTarikTunai && (
          <div className="px-5 py-4 border-b border-slate-100 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Metode Penagihan Biaya Admin
            </p>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('DEPOSIT')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-2.5 px-2 text-[11.5px] font-bold transition-all cursor-pointer ${
                    paymentMethod === 'DEPOSIT'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Potong Saldo (Gabung)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-2.5 px-2 text-[11.5px] font-bold transition-all cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  <span>Tunai Pas (Pisah)</span>
                </button>
              </div>

              {paymentMethod === 'DEPOSIT' ? (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                  <div className="flex justify-between font-extrabold">
                    <span>Gesek EDC / Masuk Saldo:</span>
                    <span className="font-mono text-blue-700">+{formatRp(total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kas Fisik Laci Diserahkan:</span>
                    <span className="font-mono font-bold text-rose-600">-{formatRp(amount)}</span>
                  </div>
                  <p className="text-[10px] text-blue-600 pt-0.5 leading-tight">
                    💡 Biaya admin <strong>{formatRp(adminFee)}</strong> sudah digabung dalam gesekan kartu nasabah. Nasabah tidak perlu bayar uang tunai.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
                  <div className="flex justify-between font-extrabold">
                    <span>Gesek EDC / Masuk Saldo:</span>
                    <span className="font-mono text-blue-700">+{formatRp(amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kas Fisik Laci Diserahkan:</span>
                    <span className="font-mono font-bold text-rose-600">-{formatRp(amount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold border-t border-emerald-200 pt-0.5">
                    <span>Nasabah Bayar Admin Tunai:</span>
                    <span className="font-mono">+{formatRp(adminFee)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SKENARIO 3: SETOR TUNAI & PPOB */}
        {!isTransfer && !isTarikTunai && (
          <div className="px-5 py-4 border-b border-slate-100 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Metode Pembayaran Pelanggan
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-[12px]">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span>Tunai (Pelanggan Menyerahkan Uang Fisik Penuh)</span>
              </div>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded font-black">TUNAI</span>
            </div>
          </div>
        )}

        {/* Kalkulator Uang Masuk & Kembalian (jika transaksi menerima uang tunai dari nasabah) */}
        {requiredCashAmount > 0 && (
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Uang Fisik Diterima <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCashReceivedRaw(requiredCashAmount.toLocaleString('id-ID'))}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-[#FF6600] rounded-full shadow-2xs hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer select-none"
                    title="Klik untuk mengisi nominal uang pas otomatis"
                  >
                    <span className="font-extrabold">Uang Pas</span>
                    <span className="text-white/60">•</span>
                    <span className="font-mono font-black">{formatRp(requiredCashAmount)}</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[13px] font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashReceivedRaw}
                    onChange={(e) => handleCashInput(e.target.value)}
                    placeholder={requiredCashAmount.toLocaleString('id-ID')}
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 text-[16px] font-bold placeholder:text-slate-300 focus:outline-none transition-all ${
                      cashReceived > 0 && !isCashValid
                        ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.1)]'
                        : isCashValid && cashReceived > 0
                          ? 'border-emerald-300 bg-emerald-50/30 text-emerald-900 focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
                          : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                    }`}
                  />
                </div>
              </div>
              <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                change < 0 && cashReceived > 0
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <span className={`text-[13px] font-bold ${change < 0 && cashReceived > 0 ? 'text-rose-700' : 'text-amber-700'}`}>
                  {change < 0 && cashReceived > 0 ? 'Kurang Bayar' : 'Kembalian'}
                </span>
                <span className={`text-[22px] font-black ${
                  cashReceived === 0
                    ? 'text-slate-400'
                    : change >= 0
                      ? 'text-[#FF6600]'
                      : 'text-rose-600'
                }`}>
                  {cashReceived > 0 ? formatRp(Math.abs(change)) : 'Rp —'}
                </span>
              </div>
              {change < 0 && cashReceived > 0 && (
                <p className="text-[11px] text-rose-600 font-bold text-center">
                  ⚠ Uang diterima kurang {formatRp(Math.abs(change))} dari total tagihan
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="border-t border-slate-200 p-4">
        <button
          onClick={() => canProcess && isCashValid && onProcess(paymentMethod, cashReceived)}
          disabled={!canProcess || processing || !isCashValid}
          className={`flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[14px] font-bold text-white transition-all ${
            !canProcess || processing || !isCashValid
              ? 'bg-slate-300 cursor-not-allowed opacity-80'
              : 'bg-[#FF6600] hover:bg-[#E65C00] shadow-[0_4px_16px_rgba(255,102,0,0.3)] active:scale-[0.98] cursor-pointer'
          }`}
        >
          <Printer className="h-5 w-5" />
          {processing
            ? 'Memproses...'
            : requiredCashAmount > 0 && cashReceived === 0
              ? `Masukkan Uang Fisik (Min ${formatRp(requiredCashAmount)})`
              : requiredCashAmount > 0 && !isCashValid
                ? `Uang Kurang ${formatRp(Math.abs(change))}`
                : 'Proses & Cetak Struk'}
        </button>
      </div>
    </div>
  );
}

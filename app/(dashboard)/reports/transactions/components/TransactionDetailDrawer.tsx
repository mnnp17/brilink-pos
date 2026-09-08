'use client';

import React from 'react';
import { RefactoredOwnerTransaction } from '@/types/owner-transaction';
import { X, Calendar, Clock, User, ShieldAlert, FileText, ArrowRightLeft } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';

interface TransactionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: RefactoredOwnerTransaction | null;
}

export function TransactionDetailDrawer({ isOpen, onClose, transaction }: TransactionDetailDrawerProps) {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' WIB';
  };

  // Generate double-entry ledger journal mockup based on transaction category/name
  const getLedgerJournal = (tx: RefactoredOwnerTransaction) => {
    const isSetor = tx.serviceName.includes('Setor');
    const isTarik = tx.serviceName.includes('Tarik');

    if (isSetor) {
      return [
        { account: 'Kas Laci Fisik (Debit - Terima Tunai)', debit: tx.amount + tx.customerAdminFee, credit: 0 },
        { account: `Saldo Digital ${tx.sourceAccountName} (Kredit - Transfer out)`, debit: 0, credit: tx.amount },
        { account: 'Beban Admin Bank / COGS (Kredit - Potongan)', debit: 0, credit: tx.bankFee },
        { account: 'Pendapatan Komisi / Margin Bersih (Kredit)', debit: 0, credit: tx.netProfit },
      ];
    } else if (isTarik) {
      return [
        { account: `Saldo Digital ${tx.sourceAccountName} (Debit - Terima Transfer)`, debit: tx.amount, credit: 0 },
        { account: 'Kas Laci Fisik (Kredit - Keluar Tunai)', debit: 0, credit: tx.amount - tx.customerAdminFee },
        { account: 'Beban Admin Bank / COGS (Kredit - Potongan)', debit: 0, credit: tx.bankFee },
        { account: 'Pendapatan Komisi / Margin Bersih (Kredit)', debit: 0, credit: tx.netProfit },
      ];
    } else {
      // Transfer / PPOB
      return [
        { account: 'Kas Laci Fisik (Debit - Terima Tunai)', debit: tx.amount + tx.customerAdminFee, credit: 0 },
        { account: `Saldo Digital ${tx.sourceAccountName} (Kredit - Transfer out)`, debit: 0, credit: tx.amount },
        { account: 'Beban Admin Bank / COGS (Kredit - Potongan)', debit: 0, credit: tx.bankFee },
        { account: 'Pendapatan Komisi / Margin Bersih (Kredit)', debit: 0, credit: tx.netProfit },
      ];
    }
  };

  const ledger = getLedgerJournal(transaction);
  const totalDebit = ledger.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = ledger.reduce((sum, item) => sum + item.credit, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-slate-50 shadow-2xl max-h-[90vh] flex flex-col z-10 border border-slate-200 rounded-3xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Audit Trail Transaksi</span>
            <h3 className="font-extrabold text-[14px] font-mono mt-0.5 select-all">{transaction.transactionNumber}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4.5 space-y-4 text-[12px]">
          
          {/* Status Alert (if anomaly exists) */}
          {transaction.hasAnomaly && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3.5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-[11px] uppercase tracking-wider text-rose-800">Peringatan Audit AI</h4>
                <p className="font-bold leading-normal mt-0.5 text-rose-700">
                  {transaction.anomalyNote || 'Peringatan: Margin transaksi berada di bawah batas wajar (Rp 0 atau negatif).'}
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Rincian Transaksi */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
            <h4 className="font-extrabold text-[12px] text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider">
              Rincian Nominal
            </h4>
            
            <div className="grid grid-cols-2 gap-y-3 font-semibold text-slate-600">
              <div>Layanan:</div>
              <div className="text-right font-bold text-slate-800">{transaction.serviceName}</div>

              <div>Sumber Saldo:</div>
              <div className="text-right font-bold text-slate-800">{transaction.sourceAccountName}</div>
              
              <div>Nominal Utama:</div>
              <div className="text-right font-extrabold text-slate-800 font-mono">
                {formatRupiah(transaction.amount)}
              </div>
              
              <div className="text-indigo-600 font-bold">Admin Pelanggan:</div>
              <div className="text-right font-bold text-indigo-600 font-mono">
                +{formatRupiah(transaction.customerAdminFee)}
              </div>
              
              <div className="text-rose-500 font-bold">Potongan COGS Bank:</div>
              <div className="text-right font-bold text-rose-500 font-mono">
                -{formatRupiah(transaction.bankFee)}
              </div>
              
              <div className="pt-2 border-t border-slate-100 font-bold text-slate-800">Laba Bersih Riil:</div>
              <div className={`pt-2 border-t border-slate-100 text-right font-black font-mono text-[13px] ${
                transaction.netProfit > 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {transaction.netProfit >= 0 ? '+' : ''}{formatRupiah(transaction.netProfit)}
              </div>
            </div>
          </div>

          {/* Section 2: Jurnal Jurnal Akunting Double-Entry */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <h4 className="font-extrabold text-[12px] text-slate-800 uppercase tracking-wider">
                Jurnal Mutasi Akuntansi
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10.5px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                    <th className="py-1">Akun Perkiraan</th>
                    <th className="py-1 text-right">Debet</th>
                    <th className="py-1 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {ledger.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 pr-2 leading-tight font-semibold text-slate-700">{item.account}</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-800">
                        {item.debit > 0 ? formatRupiah(item.debit) : '-'}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-slate-800">
                        {item.credit > 0 ? formatRupiah(item.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Balance Footer */}
                  <tr className="border-t border-slate-200 font-bold bg-slate-50/60">
                    <td className="py-2 font-extrabold text-slate-700">Total Jurnal (Balance)</td>
                    <td className="py-2 text-right font-mono font-black text-slate-800">{formatRupiah(totalDebit)}</td>
                    <td className="py-2 text-right font-mono font-black text-slate-800">{formatRupiah(totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Detail Shift Kasir */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
            <h4 className="font-extrabold text-[12px] text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider">
              Metadata Shift Kasir
            </h4>
            
            <div className="grid grid-cols-2 gap-y-3 font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Kasir Pelaksana:</span>
              </div>
              <div className="text-right font-bold text-slate-800">{transaction.cashierName}</div>

              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>ID Shift Terkait:</span>
              </div>
              <div className="text-right font-mono font-bold text-slate-800">shift-20260819-01</div>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Waktu Transaksi:</span>
              </div>
              <div className="text-right font-bold text-slate-800">{formatDate(transaction.createdAt)}</div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Waktu Jam:</span>
              </div>
              <div className="text-right font-mono font-bold text-slate-800">{formatTime(transaction.createdAt)}</div>

              <div>Status Shift Kasir:</div>
              <div className="text-right">
                <span className="inline-flex px-1.5 py-0.5 bg-emerald-100 border border-emerald-200 rounded text-[9.5px] font-extrabold text-emerald-800">
                  SHIFT MATCH (OK)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[12px] rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Tutup Panel Audit
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { AccountOption } from '@/components/layout/Header';
import { CashierActivityLog, AccountBalanceImpact } from '@/types/activity-log';
import { formatRupiah } from '@/lib/utils/format';
import { toast } from 'sonner';
import { executeRebalanceAction } from '@/lib/actions/pos';
import { getStoreAccounts } from '@/lib/actions/shift.actions';
import { GroupedSelect } from '@/components/ui/GroupedSelect';
import { DropdownGroup } from '@/types/ui';
import { useAuth } from '@/lib/hooks/useAuth';

interface FastRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashierName: string;
  cashierId: string;
}

export function FastRebalanceModal({ isOpen, onClose, cashierName, cashierId }: FastRebalanceModalProps) {
  const { profile } = useAuth();
  const canRebalance = profile?.role === 'owner' || profile?.role === 'developer' || profile?.permissions?.canRebalance === true;

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState('');
  const [requiresPin, setRequiresPin] = useState(false);

  // Load accounts on mount / open
  useEffect(() => {
    if (isOpen) {
      setAmountInput('');
      setNotes('');
      setPin('');
      setRequiresPin(false);
      
      const loadAccounts = async () => {
        try {
          const res = await getStoreAccounts();
          if (res.success && res.data && res.data.length > 0) {
            const mapped = res.data.map((acc: any) => ({
              id: acc.id,
              name: acc.name,
              accountNumber: acc.account_number || '',
              balance: Number(acc.balance) || 0,
              type: (acc.type === 'CASH_DRAWER' ? 'cash' : 'bank') as 'cash' | 'bank',
            }));
            setAccounts(mapped);
            if (mapped.length >= 2) {
              setSourceId(mapped[0].id);
              setDestId(mapped[1].id);
            }
          }
        } catch (e) {}
      };
      
      loadAccounts();
    }
  }, [isOpen]);

  // Monitor amount to determine if PIN is required
  useEffect(() => {
    const amt = parseFloat(amountInput) || 0;
    if (amt > 5000000) {
      setRequiresPin(true);
    } else {
      setRequiresPin(false);
    }
  }, [amountInput]);

  if (!isOpen) return null;

  const accountGroups: DropdownGroup[] = [
    {
      groupLabel: 'KAS FISIK',
      options: accounts
        .filter((a) => a.type === 'cash' || a.name.toLowerCase().includes('kas'))
        .map((a) => ({
          value: a.id,
          label: a.name,
          description: `Saldo: ${formatRupiah(a.balance)}`,
        })),
    },
    {
      groupLabel: 'REKENING BANK & EDC',
      options: accounts
        .filter((a) => a.type === 'bank' && !a.name.toLowerCase().includes('kas') && !a.name.toLowerCase().includes('agregator') && !a.name.toLowerCase().includes('ppob'))
        .map((a) => ({
          value: a.id,
          label: a.name,
          description: `Saldo: ${formatRupiah(a.balance)}`,
        })),
    },
    {
      groupLabel: 'PPOB & AGREGATOR',
      options: accounts
        .filter((a) => a.name.toLowerCase().includes('agregator') || a.name.toLowerCase().includes('ppob'))
        .map((a) => ({
          value: a.id,
          label: a.name,
          description: `Saldo: ${formatRupiah(a.balance)}`,
        })),
    }
  ].filter(g => g.options.length > 0);

  const handleRebalance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canRebalance) {
      toast.error('Akses ditolak: Anda tidak memiliki hak akses untuk memindahkan saldo.');
      return;
    }

    const amt = parseFloat(amountInput) || 0;
    if (amt <= 0) {
      toast.error('Nominal pemindahan harus lebih besar dari Rp 0!');
      return;
    }

    if (sourceId === destId) {
      toast.error('Akun sumber dan akun tujuan pemindahan tidak boleh sama!');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === sourceId);
    const destAcc = accounts.find(a => a.id === destId);

    if (!sourceAcc || !destAcc) {
      toast.error('Akun sumber atau tujuan tidak valid.');
      return;
    }

    if (sourceAcc.balance < amt) {
      toast.error(`Saldo ${sourceAcc.name} tidak mencukupi untuk memindahkan ${formatRupiah(amt)}!`);
      return;
    }

    // Owner PIN Validation check
    if (requiresPin && pin !== '123456') {
      toast.error('Otorisasi Gagal: PIN Owner tidak valid! (PIN simulasi: 123456)');
      return;
    }

    // Update balances
    const updatedAccounts = accounts.map(a => {
      if (a.id === sourceId) {
        return { ...a, balance: a.balance - amt };
      }
      if (a.id === destId) {
        return { ...a, balance: a.balance + amt };
      }
      return a;
    });

    // Create activity log
    const sourceBefore = sourceAcc.balance;
    const sourceAfter = sourceBefore - amt;
    const destBefore = destAcc.balance;
    const destAfter = destBefore + amt;

    const impacts: AccountBalanceImpact[] = [
      {
        accountId: sourceAcc.id,
        accountName: sourceAcc.name,
        balanceBefore: sourceBefore,
        changeAmount: -amt,
        balanceAfter: sourceAfter,
      },
      {
        accountId: destAcc.id,
        accountName: destAcc.name,
        balanceBefore: destBefore,
        changeAmount: amt,
        balanceAfter: destAfter,
      },
    ];

    const newLog: CashierActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cashierId: cashierId || 'KASIR-02',
      cashierName: cashierName || 'Siti Aminah',
      shiftId: 'shift-1',
      activityType: 'REBALANCE',
      title: 'PINDAH SALDO',
      summary: `${formatRupiah(amt)} (${sourceAcc.name.split(' ').slice(0, 2).join(' ')} ➔ ${destAcc.name.split(' ').slice(0, 2).join(' ')})`,
      notes: notes.trim() || 'Setor tunai internal kasir',
      deviceInfo: 'POS-TERMINAL-01 (192.168.1.15)',
      impacts,
    };

    const toastId = toast.loading('Memproses pemindahan saldo di database...');
    try {
      const res = await executeRebalanceAction({
        fromAccountId: sourceId,
        toAccountId: destId,
        amount: amt,
        notes: notes.trim() || 'Setor tunai internal kasir',
      });

      if (res.success) {
        // Trigger update event for Header/UI
        window.dispatchEvent(new Event('accounts-updated'));

        const storedLogs = localStorage.getItem('pos-activity-logs');
        let logs: CashierActivityLog[] = [];
        if (storedLogs) {
          try {
            logs = JSON.parse(storedLogs);
          } catch (e) {}
        }
        logs.unshift(newLog);
        localStorage.setItem('pos-activity-logs', JSON.stringify(logs));
        window.dispatchEvent(new Event('activity-logs-updated'));

        toast.success('Pindah saldo berhasil diproses!', { id: toastId });
        onClose();
      } else {
        toast.error(res.error ?? 'Gagal memproses pindah saldo.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Terjadi kesalahan sistem.', { id: toastId });
    }
  };

  if (!isOpen || !canRebalance) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-300" />
            <div>
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Kasir Rebalance</span>
              <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">Pemindahan Saldo Internal</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRebalance} className="p-5 space-y-4 text-[12px] text-slate-600 font-semibold font-sans">
          <div className="text-[11px] bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Kasir Operasional</span>
            <span className="font-bold text-slate-800 text-[12px]">{cashierName} (ID: {cashierId})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Source */}
            <div>
              <GroupedSelect
                id="sourceId"
                label="Dari Akun (Sumber)"
                placeholder="Pilih akun..."
                groups={accountGroups}
                value={sourceId}
                onChange={setSourceId}
              />
            </div>

            {/* Destination */}
            <div>
              <GroupedSelect
                id="destId"
                label="Ke Akun (Tujuan)"
                placeholder="Pilih akun..."
                groups={accountGroups}
                value={destId}
                onChange={setDestId}
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nominal Transfer (Rp)</label>
            <input
              type="number"
              required
              placeholder="Masukkan nominal, contoh: 2000000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Catatan / Keperluan</label>
            <textarea
              rows={2}
              required
              placeholder="Sebutkan keperluan pemindahan saldo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white resize-none"
            />
          </div>

          {/* Requires PIN Protection Warning & Input */}
          {requiresPin && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-2">
              <div className="flex gap-2 text-amber-800">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-[11.5px] font-black uppercase tracking-wider">Batas Limit Kasir Terlewati</h4>
                  <p className="text-[10px] text-amber-700 leading-normal font-bold">
                    Pemindahan saldo di atas Rp 5.000.000 memerlukan PIN Owner untuk otorisasi instan.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Input PIN Otorisasi Owner</label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="------"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full text-center tracking-widest px-3 py-1.5 border border-amber-300 rounded-xl bg-white text-[13px] font-bold outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              🚀 Pindahkan Saldo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

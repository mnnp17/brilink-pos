'use client';

import React, { useState, useEffect } from 'react';
import { StaffUser, ResetPinPayload } from '../types/staff-master';
import { X, Key, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface FastPinResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffUser | null;
  onReset: (payload: ResetPinPayload) => void;
}

export function FastPinResetModal({ isOpen, onClose, staff, onReset }: FastPinResetModalProps) {
  const [newPin, setNewPin] = useState('');
  const [forceLogout, setForceLogout] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setNewPin('');
      setForceLogout(true);
    }
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  // 1-Click PIN Generator
  const generateRandomPin = () => {
    let pin = '';
    for (let i = 0; i < 6; i++) {
      pin += Math.floor(Math.random() * 10);
    }
    setNewPin(pin);
    toast.success(`PIN Acak Terbuat: ${pin}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPin.length !== 6) {
      toast.error('PIN baru harus tepat 6-digit angka!');
      return;
    }

    onReset({
      staffId: staff.id,
      newPin,
      forceLogout,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-300 animate-spin-once" />
            <div>
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block">Keamanan Kredensial</span>
              <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">
                Reset PIN Kilat Kasir
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-[12px] text-slate-600 font-semibold">
          
          {/* Target Staff detail */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Staf Terpilih</span>
            <p className="font-extrabold text-slate-800 text-[13px]">{staff.fullName}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Username: @{staff.username}</p>
          </div>

          {/* PIN Input with generator button */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">PIN Baru Kasir (6 Digit)</label>
              <button
                type="button"
                onClick={generateRandomPin}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-[10px] font-bold active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate PIN Acak</span>
              </button>
            </div>
            
            <input
              type="password"
              maxLength={6}
              required
              placeholder="------"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-widest px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800 text-[16px]"
            />
          </div>

          {/* Force Logout Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-200/60 rounded-2xl select-none cursor-pointer">
            <input
              type="checkbox"
              checked={forceLogout}
              onChange={(e) => setForceLogout(e.target.checked)}
              className="w-4.5 h-4.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 mt-0.5 cursor-pointer"
            />
            <div>
              <span className="text-[11px] font-black text-amber-800 block">Keluarkan Dari Seluruh Perangkat</span>
              <span className="text-[9.5px] text-slate-400 block leading-normal mt-0.5 font-bold">
                (Sangat Disarankan) Memutus sesi login kasir yang saat ini sedang aktif di POS terminal toko demi keamanan PIN baru.
              </span>
            </div>
          </label>

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
              className="py-2 px-4.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              🔒 Terapkan PIN Baru
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

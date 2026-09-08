'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { StaffUser, StaffRole, StaffPermissions, CreateStaffPayload, ROLE_PERMISSION_PRESETS, PERMISSION_CATEGORIES, DEFAULT_STAFF_PERMISSIONS } from '../types/staff-master';
import { X, Save, ArrowRight, ArrowLeft, Store, Wallet, FileText, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateStaffPayload) => void;
}

export function StaffFormModal({ isOpen, onClose, onSave }: StaffFormModalProps) {
  const [step, setStep] = useState(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('JUNIOR_CASHIER');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Permissions State
  const [permissions, setPermissions] = useState<StaffPermissions>(DEFAULT_STAFF_PERMISSIONS);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFullName('');
      setUsername('');
      setPhone('');
      setRole('JUNIOR_CASHIER');
      setPin('');
      setConfirmPin('');
      setPermissions(ROLE_PERMISSION_PRESETS.JUNIOR_CASHIER);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Preset 1-Klik Permissions Handler
  const applyPreset = (presetKey: StaffRole) => {
    setPermissions(ROLE_PERMISSION_PRESETS[presetKey]);
    toast.info(`Preset ${presetKey === 'SENIOR_CASHIER' ? 'Senior Kasir' : presetKey === 'JUNIOR_CASHIER' ? 'Junior Kasir' : 'Trainee'} terpasang!`);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !username.trim() || !phone.trim()) {
        toast.error('Semua data diri wajib diisi!');
        return;
      }
      if (fullName.trim().length < 3) {
        toast.error('Nama lengkap minimal 3 karakter!');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (pin.length !== 6 || confirmPin.length !== 6) {
        toast.error('PIN harus berupa 6-digit angka!');
        return;
      }
      if (pin !== confirmPin) {
        toast.error('Konfirmasi PIN tidak cocok!');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      handleNext();
      return;
    }

    onSave({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      pin,
      permissions,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block">Manajemen Staf</span>
            <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">
              Daftar Akun Kasir Baru
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-[10px] font-black uppercase text-slate-400 shrink-0">
          <span className={step === 1 ? 'text-blue-600' : 'text-slate-500'}>1. Data Diri</span>
          <span className="w-6 h-px bg-slate-300" />
          <span className={step === 2 ? 'text-blue-600' : 'text-slate-500'}>2. PIN Kredensial</span>
          <span className="w-6 h-px bg-slate-300" />
          <span className={step === 3 ? 'text-blue-600' : 'text-slate-500'}>3. Hak Akses</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-[12px] text-slate-600 font-semibold max-h-[70vh] overflow-y-auto">
          
          {/* STEP 1: Data Diri */}
          {step === 1 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap Staf</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Aminah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: sitiaminah"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Handphone / WA</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white text-slate-800 font-bold"
                />
              </div>

              <div>
                <CustomSelect
                  label="Pangkat / Peran Role"
                  value={role}
                  onChange={(v) => setRole(v as StaffRole)}
                  minWidth="100%"
                  options={[
                    { value: 'TRAINEE', label: 'Kasir Magang (Trainee)' },
                    { value: 'JUNIOR_CASHIER', label: 'Junior Kasir (Standar)' },
                    { value: 'SENIOR_CASHIER', label: 'Senior Kasir (Senior)' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* STEP 2: PIN Kredensial */}
          {step === 2 && (
            <div className="space-y-3.5">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl">
                <p className="text-[10px] text-blue-700 leading-normal font-bold">
                  Kredensial PIN digunakan kasir untuk masuk ke modul POS terminal outlet toko. Masukkan 6-digit PIN numerik unik.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">PIN Login (6 Angka)</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800 text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Konfirmasi Ulang PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white font-mono font-bold text-slate-800 text-[14px]"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Hak Akses */}
          {step === 3 && (
            <div className="space-y-4">
              
              {/* Preset Selector */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Terapkan Template Preset Akses:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('TRAINEE')}
                    className="py-1.5 px-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-bold cursor-pointer"
                  >
                    🌱 Trainee
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('JUNIOR_CASHIER')}
                    className="py-1.5 px-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-bold cursor-pointer"
                  >
                    💼 Standar (Junior)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('SENIOR_CASHIER')}
                    className="py-1.5 px-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-bold cursor-pointer"
                  >
                    👑 Senior (Full)
                  </button>
                </div>
              </div>

              {/* Categorized Permissions */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                {PERMISSION_CATEGORIES.map((category) => (
                  <div key={category.id} className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                        {category.title}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {category.items.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-start justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200/80 select-none cursor-pointer hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <span className="text-[11px] font-extrabold text-slate-800 block">
                              {item.label}
                            </span>
                            <span className="text-[9px] text-slate-400 block leading-tight">
                              {item.description}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={permissions[item.key as keyof StaffPermissions]}
                            onChange={(e) => setPermissions({ ...permissions, [item.key]: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Navigation Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 py-2 px-4.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1.5 py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Daftarkan Staf</span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}

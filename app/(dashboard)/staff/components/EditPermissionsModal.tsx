'use client';

import React, { useState, useEffect } from 'react';
import { StaffUser, StaffPermissions, StaffRole, PERMISSION_CATEGORIES, ROLE_PERMISSION_PRESETS, DEFAULT_STAFF_PERMISSIONS } from '../types/staff-master';
import { X, Shield, Save, CheckCircle2, Store, Wallet, FileText, Sparkles, Sliders } from 'lucide-react';
import { toast } from 'sonner';

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffUser | null;
  onSave: (staffId: string, permissions: StaffPermissions) => void;
}

export function EditPermissionsModal({
  isOpen,
  onClose,
  staff,
  onSave,
}: EditPermissionsModalProps) {
  const [permissions, setPermissions] = useState<StaffPermissions>(DEFAULT_STAFF_PERMISSIONS);
  const [activePreset, setActivePreset] = useState<StaffRole | 'CUSTOM'>('CUSTOM');

  useEffect(() => {
    if (isOpen && staff) {
      const perms = { ...DEFAULT_STAFF_PERMISSIONS, ...staff.permissions };
      setPermissions(perms);
      
      // Determine if it matches any preset
      if (JSON.stringify(perms) === JSON.stringify(ROLE_PERMISSION_PRESETS.SENIOR_CASHIER)) {
        setActivePreset('SENIOR_CASHIER');
      } else if (JSON.stringify(perms) === JSON.stringify(ROLE_PERMISSION_PRESETS.JUNIOR_CASHIER)) {
        setActivePreset('JUNIOR_CASHIER');
      } else if (JSON.stringify(perms) === JSON.stringify(ROLE_PERMISSION_PRESETS.TRAINEE)) {
        setActivePreset('TRAINEE');
      } else {
        setActivePreset('CUSTOM');
      }
    }
  }, [isOpen, staff]);

  if (!isOpen || !staff) return null;

  const handleApplyPreset = (presetKey: StaffRole) => {
    const presetPerms = ROLE_PERMISSION_PRESETS[presetKey];
    setPermissions(presetPerms);
    setActivePreset(presetKey);
  };

  const handleToggle = (key: keyof StaffPermissions, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: value,
    }));
    setActivePreset('CUSTOM');
  };

  const handleSelectAllInCategory = (catKeys: (keyof StaffPermissions)[], selectAll: boolean) => {
    setPermissions(prev => {
      const updated = { ...prev };
      catKeys.forEach(k => {
        updated[k] = selectAll;
      });
      return updated;
    });
    setActivePreset('CUSTOM');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(staff.id, permissions);
    toast.success(`Hak akses untuk kasir ${staff.fullName} berhasil diperbarui & disinkronkan!`);
    onClose();
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Store': return <Store className="w-4 h-4 text-blue-600" />;
      case 'Wallet': return <Wallet className="w-4 h-4 text-emerald-600" />;
      case 'FileText': return <FileText className="w-4 h-4 text-purple-600" />;
      default: return <Shield className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
              <Shield className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block">Pusat Kendali Otoritas Staf</span>
              <h3 className="font-extrabold text-[15px] uppercase tracking-wider mt-0.5">
                Pengaturan Kategori Hak Akses
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-[12px] text-slate-600">
          
          {/* Selected staff detail */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Staf Kasir Terpilih</span>
              <p className="font-extrabold text-slate-800 text-[14px]">{staff.fullName}</p>
              <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">@{staff.username}@brilink.com</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Preset Aktif</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg mt-0.5">
                <Sliders className="w-3 h-3" />
                {activePreset === 'SENIOR_CASHIER' ? 'Senior Kasir (Full)' : activePreset === 'JUNIOR_CASHIER' ? 'Junior Kasir (Standar)' : activePreset === 'TRAINEE' ? 'Trainee / Magang' : 'Kustom'}
              </span>
            </div>
          </div>

          {/* Quick Role Presets Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Terapkan Template Preset Akses Cepat:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('TRAINEE')}
                className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                  activePreset === 'TRAINEE'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                🌱 Trainee / Magang
                <span className="block text-[9px] font-medium text-slate-400 mt-0.5">POS & Struk Saja</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('JUNIOR_CASHIER')}
                className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                  activePreset === 'JUNIOR_CASHIER'
                    ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                💼 Junior Kasir (Standar)
                <span className="block text-[9px] font-medium text-slate-400 mt-0.5">POS, Shift, OPEX, Riwayat</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('SENIOR_CASHIER')}
                className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                  activePreset === 'SENIOR_CASHIER'
                    ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                👑 Senior Kasir (Full)
                <span className="block text-[9px] font-medium text-slate-400 mt-0.5">Semua Fitur Termasuk Rebalance</span>
              </button>
            </div>
          </div>

          {/* Categorized Permissions */}
          <div className="space-y-4 pt-1">
            {PERMISSION_CATEGORIES.map((category) => {
              const catKeys = category.items.map(it => it.key);
              const allChecked = catKeys.every(k => permissions[k]);
              const someChecked = catKeys.some(k => permissions[k]);

              return (
                <div
                  key={category.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-2xl overflow-hidden transition-all"
                >
                  {/* Category Header */}
                  <div className="p-3.5 bg-white border-b border-slate-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        {getCategoryIcon(category.iconName)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[12.5px] text-slate-800">
                          {category.title}
                        </h4>
                        <p className="text-[10px] text-slate-400">{category.description}</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleSelectAllInCategory(catKeys, !allChecked)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      {allChecked ? 'Hapus Semua' : 'Pilih Semua'}
                    </button>
                  </div>

                  {/* Category Items */}
                  <div className="p-3 space-y-2">
                    {category.items.map((item) => {
                      const isChecked = permissions[item.key];

                      return (
                        <label
                          key={item.key}
                          className={`flex items-start justify-between gap-3 p-2.5 rounded-xl border transition-all select-none cursor-pointer ${
                            isChecked
                              ? 'bg-white border-blue-200 shadow-xs'
                              : 'bg-white/50 border-slate-200/60 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11.5px] font-extrabold ${isChecked ? 'text-slate-800' : 'text-slate-500'}`}>
                                {item.label}
                              </span>
                              {item.key === 'canRebalance' && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                  Sensitif
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                              {item.description}
                            </span>
                          </div>

                          <div className="pt-0.5 shrink-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleToggle(item.key, e.target.checked)}
                              className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-[12px] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs text-[12px]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terapkan Hak Akses</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


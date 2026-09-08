'use client';

import React, { useState, useEffect } from 'react';
import { ImpersonationModal } from '../components/ImpersonationModal';
import { UserCheck, ShieldAlert, Search, Store, Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { addOutletAction, editOutletAction, deleteOutletAction } from '@/lib/actions/dev';
import type { ActiveUserSession } from '../types/developer';
import { formatRupiah } from '@/lib/utils/format';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface OutletRecord {
  id: string;
  name: string;
  city?: string;
  mid?: string;
  status: string;
  cash: number;
  digital: number;
  address?: string;
  owner_id?: string;
}

interface OwnerOption {
  id: string;
  name: string;
  email: string;
}

const INITIAL_SESSIONS: ActiveUserSession[] = [];


export default function UserImpersonationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sessions' | 'outlets'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Impersonation state
  const [selectedSession, setSelectedSession] = useState<ActiveUserSession | null>(null);
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = useState(false);

  // Outlets state
  const [outlets, setOutlets] = useState<OutletRecord[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [isAddOutletModalOpen, setIsAddOutletModalOpen] = useState(false);
  const [isEditOutletModalOpen, setIsEditOutletModalOpen] = useState(false);
  const [isDeleteOutletModalOpen, setIsDeleteOutletModalOpen] = useState(false);

  // Form states
  const [targetOutlet, setTargetOutlet] = useState<OutletRecord | null>(null);
  const [outletName, setOutletName] = useState('');
  const [outletAddress, setOutletAddress] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Outlets and Owners
  const fetchOutlets = async () => {
    setIsLoadingOutlets(true);
    try {
      const res = await fetch('/api/dev/outlets');
      const data = await res.json();
      if (data.outlets) {
        setOutlets(data.outlets);
      }
    } catch (e) {
      toast.error('Gagal memuat data outlet.');
    } finally {
      setIsLoadingOutlets(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await fetch('/api/dev/users');
      const data = await res.json();
      if (data.users) {
        const ownerUsers = data.users
          .filter((u: any) => u.role === 'OWNER')
          .map((u: any) => ({ id: u.id, name: u.name, email: u.email }));
        setOwners(ownerUsers);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchOutlets();
    fetchOwners();
  }, []);

  const handleConfirmImpersonation = (session: ActiveUserSession) => {
    const mockProfile = {
      id: session.userId,
      full_name: session.fullName,
      role: session.role.toLowerCase() as any,
      must_change_password: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      outlet_id: '00000000-0000-0000-0000-000000000000',
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('impersonated_user', JSON.stringify(mockProfile));
      window.dispatchEvent(new Event('impersonation-changed'));
      toast.success(`Berhasil menyamar sebagai ${session.fullName}! Mengalihkan...`);
      setTimeout(() => {
        if (mockProfile.role === 'owner') {
          router.replace('/dashboard');
        } else {
          router.replace('/pos');
        }
      }, 1000);
    }
  };

  // Add Outlet
  const handleAddOutletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletName.trim() || !selectedOwnerId) {
      toast.error('Nama outlet dan owner wajib dipilih.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await addOutletAction(outletName, selectedOwnerId, outletAddress);
      if (res.success) {
        toast.success('Outlet berhasil ditambahkan!');
        setIsAddOutletModalOpen(false);
        setOutletName('');
        setOutletAddress('');
        setSelectedOwnerId('');
        fetchOutlets();
      } else {
        toast.error(res.error || 'Gagal menambahkan outlet.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Outlet
  const handleEditOutletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOutlet || !outletName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await editOutletAction(targetOutlet.id, outletName, outletAddress);
      if (res.success) {
        toast.success('Outlet berhasil diperbarui!');
        setIsEditOutletModalOpen(false);
        setTargetOutlet(null);
        setOutletName('');
        setOutletAddress('');
        fetchOutlets();
      } else {
        toast.error(res.error || 'Gagal memperbarui outlet.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Outlet
  const handleDeleteOutletConfirm = async () => {
    if (!targetOutlet) return;
    setIsSubmitting(true);
    try {
      const res = await deleteOutletAction(targetOutlet.id);
      if (res.success) {
        toast.success('Outlet berhasil dinonaktifkan.');
        setIsDeleteOutletModalOpen(false);
        setTargetOutlet(null);
        fetchOutlets();
      } else {
        toast.error(res.error || 'Gagal menonaktifkan outlet.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filters
  const filteredSessions = INITIAL_SESSIONS.filter((session) => {
    const q = searchQuery.toLowerCase();
    return (
      session.fullName.toLowerCase().includes(q) ||
      session.username.toLowerCase().includes(q) ||
      session.role.toLowerCase().includes(q)
    );
  });

  const filteredOutlets = outlets.filter((out) => {
    const q = searchQuery.toLowerCase();
    return (
      out.name.toLowerCase().includes(q) ||
      (out.address && out.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sesi User & Kelola Outlet</h1>
          <p className="text-[11px] text-slate-400 font-medium font-semibold">Pengelolaan sesi aktif pengguna, impersonasi user, dan manajemen outlet POS</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40 shrink-0">
          <button
            onClick={() => { setActiveTab('sessions'); setSearchQuery(''); }}
            className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${
              activeTab === 'sessions'
                ? 'bg-white shadow-sm text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            SESI USER (IMPERSONATE)
          </button>
          <button
            onClick={() => { setActiveTab('outlets'); setSearchQuery(''); }}
            className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${
              activeTab === 'outlets'
                ? 'bg-white shadow-sm text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            KELOLA OUTLET POS
          </button>
        </div>
      </div>

      {activeTab === 'sessions' ? (
        /* ── USER SESSIONS TAB ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800 leading-tight">Registry Sesi User Terdaftar</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Inspeksi sesi user aktif dan jalankan mode penyamaran developer</p>
            </div>

            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari user / role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-[11.5px] border border-slate-200 rounded-xl w-56 outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            </div>
          </div>

          {/* Sessions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                  <th className="px-5 py-3">Nama Lengkap</th>
                  <th className="px-5 py-3 font-mono">Username</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-center">Status Shift</th>
                  <th className="px-5 py-3 text-center">IP Address</th>
                  <th className="px-5 py-3">Perangkat</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((session) => (
                  <tr key={session.userId} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-800">{session.fullName}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">@{session.username}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase ${
                        session.role === 'OWNER' 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        {session.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {session.shiftStatus ? (
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase border ${
                          session.shiftStatus === 'ON_DUTY'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          {session.shiftStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-slate-500">{session.ipAddress}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-500 truncate max-w-[150px]" title={session.deviceInfo}>
                      {session.deviceInfo}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setIsImpersonationModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-sm shadow-amber-500/25 transition-all flex items-center gap-1 ml-auto active:scale-95 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Masuk sebagai User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── OUTLETS MANAGEMENT TAB ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          {/* Toolbar Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800 leading-tight">Daftar Outlet POS Terdaftar</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Ubah nama, status, alamat, atau tambahkan outlet baru</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama / alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 text-[11.5px] border border-slate-200 rounded-xl w-56 outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              </div>

              {/* Add Outlet Button */}
              <button
                onClick={() => {
                  setOutletName('');
                  setOutletAddress('');
                  setSelectedOwnerId('');
                  setIsAddOutletModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Outlet
              </button>
            </div>
          </div>

          {/* Outlets Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                  <th className="px-5 py-3">Nama Outlet</th>
                  <th className="px-5 py-3">Alamat</th>
                  <th className="px-5 py-3 text-right">Saldo Kas Fisik</th>
                  <th className="px-5 py-3 text-right">Saldo Kas Digital</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingOutlets ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-bold bg-white animate-pulse">
                      Memuat data outlet...
                    </td>
                  </tr>
                ) : filteredOutlets.map((out) => (
                  <tr key={out.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <Store className="w-4 h-4 text-indigo-500 shrink-0" />
                      {out.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate" title={out.address}>{out.address || '-'}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-700">{formatRupiah(out.cash)}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-700">{formatRupiah(out.digital)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setTargetOutlet(out);
                          setOutletName(out.name);
                          setOutletAddress(out.address || '');
                          setIsEditOutletModalOpen(true);
                        }}
                        className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setTargetOutlet(out);
                          setIsDeleteOutletModalOpen(true);
                        }}
                        className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOutlets.length === 0 && !isLoadingOutlets && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-bold bg-white">
                      Tidak ada outlet yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Impersonation Confirmation Modal */}
      <ImpersonationModal
        isOpen={isImpersonationModalOpen}
        onClose={() => {
          setIsImpersonationModalOpen(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
        onConfirm={handleConfirmImpersonation}
      />

      {/* Add Outlet Modal */}
      {isAddOutletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <form onSubmit={handleAddOutletSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-fade-in">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-600" />
                <h3 className="text-[13px] font-black uppercase text-slate-800">Tambah Outlet POS</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOutletModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Outlet</label>
                <input
                  type="text"
                  placeholder="Kios Berkah Jaya"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <CustomSelect
                label="Owner Outlet"
                value={selectedOwnerId}
                onChange={(v) => setSelectedOwnerId(v)}
                minWidth="100%"
                options={[
                  { value: '', label: '-- Pilih Owner --' },
                  ...owners.map((owner) => ({
                    value: owner.id,
                    label: `${owner.name} (${owner.email})`,
                  })),
                ]}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Outlet</label>
                <textarea
                  placeholder="Jl. Raya Sudirman No. 12"
                  value={outletAddress}
                  onChange={(e) => setOutletAddress(e.target.value)}
                  className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 h-20 resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOutletModalOpen(false)}
                className="px-4 py-2 text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-[12px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Outlet Modal */}
      {isEditOutletModalOpen && targetOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <form onSubmit={handleEditOutletSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-fade-in">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-600" />
                <h3 className="text-[13px] font-black uppercase text-slate-800">Edit Outlet POS</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOutletModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Outlet</label>
                <input
                  type="text"
                  placeholder="Kios Berkah Jaya"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Outlet</label>
                <textarea
                  placeholder="Jl. Raya Sudirman No. 12"
                  value={outletAddress}
                  onChange={(e) => setOutletAddress(e.target.value)}
                  className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 h-20 resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOutletModalOpen(false)}
                className="px-4 py-2 text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-[12px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Perbarui'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Outlet Modal */}
      {isDeleteOutletModalOpen && targetOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-200 mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-[15px] font-extrabold text-slate-900">Hapus Outlet?</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Anda akan menonaktifkan outlet <span className="font-bold text-slate-800">{targetOutlet.name}</span> secara permanen dari sistem.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setIsDeleteOutletModalOpen(false)}
                className="flex-1 py-2.5 px-4 text-[13px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteOutletConfirm}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Hapus Outlet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

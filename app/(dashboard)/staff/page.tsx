'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AIChatDrawer } from '@/components/ai/AIChatDrawer';
import { useAuth } from '@/lib/hooks/useAuth';
import { StaffUser, CreateStaffPayload, ResetPinPayload, StaffPermissions, StaffRole, StaffStatus } from './types/staff-master';
import { StaffHeader } from './components/StaffHeader';
import { StaffToolbar } from './components/StaffToolbar';
import { StaffCardGrid } from './components/StaffCardGrid';
import { StaffFormModal } from './components/StaffFormModal';
import { FastPinResetModal } from './components/FastPinResetModal';
import { EditPermissionsModal } from './components/EditPermissionsModal';
import { StaffActivityLogDrawer } from './components/StaffActivityLogDrawer';
import { Users, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import { CashierActivityLog } from '@/types/activity-log';
import { toast } from 'sonner';
import { createEmployeeAction, getOutletEmployees, resetEmployeePasswordAction, toggleEmployeeActivationAction, deleteEmployeeAction } from '@/lib/actions/owner';

const DEFAULT_STAFF: StaffUser[] = [];


export default function StaffPage() {
  const { profile, loading: authLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Master Data States
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<CashierActivityLog[]>([]);

  // Modal / Drawer Open States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPinResetOpen, setIsPinResetOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Selected Item State
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null);

  // 1. Initial Load & Synchronization with localStorage & Database
  useEffect(() => {
    const initData = async () => {
      // A. Staff List from localStorage
      let localList: StaffUser[] = [];
      const storedStaff = localStorage.getItem('pos-staff-users');
      if (storedStaff) {
        try {
          const parsed = JSON.parse(storedStaff) as StaffUser[];
          localList = parsed.filter(s => !['KASIR-01', 'KASIR-02', 'KASIR-03'].includes(s.id));
        } catch (e) {}
      }

      // B. Fetch from Database to Sync
      if (profile?.outlet_id) {
        const res = await getOutletEmployees();
        if (res.success && res.data) {
          const dbEmployees = res.data.map((dbUser: any) => {
            const username = dbUser.email.split('@')[0];
            return {
              id: dbUser.id,
              fullName: dbUser.name,
              username: username,
              phone: '-',
              role: 'JUNIOR_CASHIER' as StaffRole,
              status: 'OFF_DUTY' as StaffStatus,
              permissions: {
                canProcessPos: true,
                canManageShift: true,
                canRebalance: false,
                canProcessExpense: true,
                canViewHistory: true,
                canReprintReceipt: true,
                canVoidTransaction: false,
                canApplyCustomDiscount: false
              },
              kpi: {
                cashAccuracyPercentage: 100.0,
                shiftOnTimePercentage: 100.0,
                totalShiftCount: 0,
              },
              createdAt: dbUser.created_at,
              updatedAt: dbUser.updated_at,
            };
          });

          // Merge: for each db employee, if they don't exist in localList, add them
          dbEmployees.forEach((dbEmp) => {
            if (!localList.some(s => s.id === dbEmp.id || s.username.toLowerCase() === dbEmp.username.toLowerCase())) {
              localList.push(dbEmp);
            }
          });
        }
      }

      setStaffList(localList);
      localStorage.setItem('pos-staff-users', JSON.stringify(localList));

      // C. Activity Logs
      const storedLogs = localStorage.getItem('pos-activity-logs');
      if (storedLogs) {
        try {
          const parsed = JSON.parse(storedLogs) as CashierActivityLog[];
          const cleaned = parsed.filter(log => !['log-1', 'log-2', 'log-3', 'log-4', 'log-5'].includes(log.id));
          setActivityLogs(cleaned);
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('pos-activity-logs', JSON.stringify(cleaned));
          }
        } catch (e) {}
      }
    };

    if (profile) {
      initData();
    }
  }, [profile]);

  // Sync state modifications to LocalStorage
  const saveStaffList = (updated: StaffUser[]) => {
    setStaffList(updated);
    localStorage.setItem('pos-staff-users', JSON.stringify(updated));
  };

  // 2. Action Handlers

  // ADD STAFF
  const handleSaveAddStaff = async (payload: CreateStaffPayload) => {
    // Check constraints
    if (staffList.some(s => s.username.toLowerCase() === payload.username.toLowerCase())) {
      toast.error(`Username "${payload.username}" sudah digunakan!`);
      return;
    }

    const targetOutletId = profile?.outlet_id || '00000000-0000-0000-0000-000000000000';

    const toastId = toast.loading('Mendaftarkan kasir ke database...');
    try {
      const res = await createEmployeeAction({
        name: payload.fullName,
        username: payload.username,
        outletId: targetOutletId,
        initialPassword: payload.pin,
      });

      if (res.success && res.employeeId) {
        const newStaff: StaffUser = {
          id: res.employeeId,
          fullName: payload.fullName,
          username: payload.username,
          phone: payload.phone,
          role: payload.role,
          status: 'OFF_DUTY',
          permissions: payload.permissions,
          kpi: {
            cashAccuracyPercentage: 100.0,
            shiftOnTimePercentage: 100.0,
            totalShiftCount: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(`pos-pin-${newStaff.id}`, payload.pin);
        const updatedList = [...staffList, newStaff];
        saveStaffList(updatedList);
        toast.success(`Akun kasir ${payload.fullName} berhasil didaftarkan di database!`, { id: toastId });
      } else {
        toast.error(res.error ?? 'Gagal mendaftarkan kasir.', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Terjadi kesalahan sistem.', { id: toastId });
    }
  };

  // RESET PIN
  const handlePinReset = async (payload: ResetPinPayload) => {
    const target = staffList.find(s => s.id === payload.staffId);
    if (!target) return;

    const toastId = toast.loading('Memperbarui PIN kasir di database...');
    try {
      const res = await resetEmployeePasswordAction(payload.staffId, payload.newPin);
      if (res.success) {
        localStorage.setItem(`pos-pin-${payload.staffId}`, payload.newPin);
        toast.success(`PIN kasir ${target.fullName} berhasil diperbarui!`, { id: toastId });
      } else {
        toast.error(res.error ?? 'Gagal memperbarui PIN.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Terjadi kesalahan sistem.', { id: toastId });
    }
  };

  // UPDATE PERMISSIONS
  const handleSavePermissions = (staffId: string, updatedPerms: StaffPermissions) => {
    const updated = staffList.map(s => {
      if (s.id === staffId) {
        return { ...s, permissions: updatedPerms, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveStaffList(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pos-staff-updated'));
    }
  };

  // TOGGLE SUSPEND / BAN (KILL SWITCH)
  const handleToggleStatus = async (staff: StaffUser) => {
    const isCurrentlySuspended = staff.status === 'SUSPENDED';
    const updatedStatus: StaffStatus = isCurrentlySuspended ? 'OFF_DUTY' : 'SUSPENDED';
    const isActive = updatedStatus !== 'SUSPENDED';

    const toastId = toast.loading('Memperbarui status aktivasi kasir...');
    try {
      const res = await toggleEmployeeActivationAction(staff.id, isActive);
      if (res.success) {
        const updated = staffList.map(s => {
          if (s.id === staff.id) {
            return { ...s, status: updatedStatus, updatedAt: new Date().toISOString() };
          }
          return s;
        });

        saveStaffList(updated);

        if (updatedStatus === 'SUSPENDED') {
          // Force logout by adding to revoked list
          const revoked = JSON.parse(localStorage.getItem('pos-revoked-sessions') || '[]');
          revoked.push(staff.id);
          localStorage.setItem('pos-revoked-sessions', JSON.stringify(revoked));
          window.dispatchEvent(new Event('pos-session-revoked'));

          toast.warning(`Akun ${staff.fullName} berhasil disuspend. Akses POS & Transaksi dihentikan seketika!`, { id: toastId });
        } else {
          // Remove from revoked list
          let revoked = JSON.parse(localStorage.getItem('pos-revoked-sessions') || '[]');
          revoked = revoked.filter((id: string) => id !== staff.id);
          localStorage.setItem('pos-revoked-sessions', JSON.stringify(revoked));

          toast.success(`Akun ${staff.fullName} telah diaktifkan kembali.`, { id: toastId });
        }
      } else {
        toast.error(res.error ?? 'Gagal memperbarui status kasir.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Terjadi kesalahan sistem.', { id: toastId });
    }
  };

  // DELETE STAFF
  const handleDeleteStaff = (staff: StaffUser) => {
    setStaffToDelete(staff);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;

    const toastId = toast.loading('Menghapus kasir dari database...');
    try {
      const res = await deleteEmployeeAction(staffToDelete.id);
      if (res.success) {
        // Remove from staff list
        const updated = staffList.filter(s => s.id !== staffToDelete.id);
        saveStaffList(updated);

        // Remove PIN from local storage
        localStorage.removeItem(`pos-pin-${staffToDelete.id}`);

        // Revoke active session if any
        const revoked = JSON.parse(localStorage.getItem('pos-revoked-sessions') || '[]');
        if (!revoked.includes(staffToDelete.id)) {
          revoked.push(staffToDelete.id);
          localStorage.setItem('pos-revoked-sessions', JSON.stringify(revoked));
          window.dispatchEvent(new Event('pos-session-revoked'));
        }

        toast.success(`Akun karyawan ${staffToDelete.fullName} berhasil dihapus permanen.`, { id: toastId });
      } else {
        toast.error(res.error ?? 'Gagal menghapus kasir.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Terjadi kesalahan sistem.', { id: toastId });
    } finally {
      setIsDeleteConfirmOpen(false);
      setStaffToDelete(null);
    }
  };

  // 3. Guards & Authentication UI States
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="text-sm font-bold text-slate-500">Memuat data otorisasi...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isAuthorized = profile.role === 'owner' || profile.role === 'developer';

  // Access Denied Screen (Strict Isolation)
  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-5 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[15px] text-slate-900 uppercase">Akses Ditolak</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-normal">
              Halaman ini dilindungi sistem keamanan khusus Owner dan Developer. Akses Anda ditutup secara penuh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 relative">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar Mobile */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex w-auto bg-white shadow-2xl">
            <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 font-sans">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 leading-tight">Kelola Staf & Hak Akses</h1>
                <p className="text-[11px] text-slate-400 font-medium">Manajemen kredensial login kasir, reset PIN kilat, suspensi darurat, dan KPI akurasi</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Section 1: KPI Metrics Header */}
          <StaffHeader staffList={staffList} />

          {/* Section 2: Toolbar Actions */}
          <StaffToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAddStaffClick={() => setIsFormOpen(true)}
          />

          {/* Section 3: Cards Grid Container */}
          <StaffCardGrid
            staffList={staffList}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onResetPin={(staff) => {
              setSelectedStaff(staff);
              setIsPinResetOpen(true);
            }}
            onEditPermissions={(staff) => {
              setSelectedStaff(staff);
              setIsPermissionsOpen(true);
            }}
            onToggleStatus={handleToggleStatus}
            onViewLogs={(staff) => {
              setSelectedStaff(staff);
              setIsLogsOpen(true);
            }}
            onDelete={handleDeleteStaff}
          />

          <div className="h-4" />
        </main>
      </div>

      {/* CRUD Add Staff Modal */}
      <StaffFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveAddStaff}
      />

      {/* Fast PIN Reset Modal */}
      <FastPinResetModal
        isOpen={isPinResetOpen}
        onClose={() => {
          setIsPinResetOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onReset={handlePinReset}
      />

      {/* Edit Permissions Modal */}
      <EditPermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => {
          setIsPermissionsOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onSave={handleSavePermissions}
      />

      {/* Staff Activity Log Audit Trail Drawer */}
      <StaffActivityLogDrawer
        isOpen={isLogsOpen}
        onClose={() => {
          setIsLogsOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        activityLogs={activityLogs}
      />

      {/* Antigravity Custom Copilot Assistant Floating drawer */}
      <AIChatDrawer />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && staffToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5 animate-fade-in">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-200 mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>

            {/* Title & Description */}
            <div className="text-center space-y-1.5">
              <h3 className="text-[15px] font-extrabold text-slate-900">Hapus Karyawan?</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Anda akan menghapus akun{' '}
                <span className="font-bold text-slate-800">{staffToDelete.fullName}</span>{' '}
                secara permanen. Tindakan ini tidak dapat dibatalkan dan sesi aktif karyawan akan langsung diputus.
              </p>
            </div>

            {/* Staff Info Card */}
            <div className="bg-red-50/60 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black text-[13px] shrink-0">
                {staffToDelete.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-slate-800 truncate">{staffToDelete.fullName}</p>
                <p className="text-[10px] text-slate-400 font-mono">@{staffToDelete.username} • {staffToDelete.id}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setStaffToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 text-[13px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm shadow-red-600/30 active:scale-[0.98]"
              >
                🗑️ Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

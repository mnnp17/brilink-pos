export type StaffRole = 'SENIOR_CASHIER' | 'JUNIOR_CASHIER' | 'TRAINEE';
export type StaffStatus = 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED';

export interface StaffPermissions {
  // 1. Kategori: Operasional POS & Layanan
  canProcessPos: boolean;            // Memproses Transaksi POS
  canManageShift: boolean;           // Buka & Tutup Shift Kasir
  canApplyCustomDiscount: boolean;   // Ubah / Sesuaikan Biaya Admin Transaksi

  // 2. Kategori: Kas & Likuiditas
  canRebalance: boolean;             // Pindah Saldo Internal / Rebalancing Saldo Kasir
  canProcessExpense: boolean;        // Pencatatan Biaya Operasional Toko (OPEX)

  // 3. Kategori: Riwayat, Struk & Audit
  canViewHistory: boolean;           // Melihat Riwayat Transaksi
  canReprintReceipt: boolean;        // Cetak Ulang & Bagikan Struk
  canVoidTransaction: boolean;       // Pembatalan Transaksi (Void)
}

export interface PermissionCategoryDef {
  id: string;
  title: string;
  description: string;
  iconName: 'Store' | 'Wallet' | 'FileText';
  badgeColor: string;
  items: {
    key: keyof StaffPermissions;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_CATEGORIES: PermissionCategoryDef[] = [
  {
    id: 'pos_operations',
    title: 'Operasional POS & Layanan',
    description: 'Akses transaksi kasir harian dan kendali pembukuan shift',
    iconName: 'Store',
    badgeColor: 'blue',
    items: [
      {
        key: 'canProcessPos',
        label: 'Menjalankan Transaksi POS',
        description: 'Memproses transaksi setor tunai, tarik tunai, transfer, dan PPOB',
      },
      {
        key: 'canManageShift',
        label: 'Buka & Tutup Shift',
        description: 'Membuka shift kasir, input kas awal, dan tutup shift kas opname',
      },
      {
        key: 'canApplyCustomDiscount',
        label: 'Ubah Biaya Admin / Diskon',
        description: 'Mengubah nominal biaya admin layanan saat melayani transaksi',
      },
    ],
  },
  {
    id: 'cashflow_liquidity',
    title: 'Kas & Likuiditas Saldo',
    description: 'Otorisasi pemindahan saldo digital dan pelaporan biaya operasional',
    iconName: 'Wallet',
    badgeColor: 'emerald',
    items: [
      {
        key: 'canRebalance',
        label: 'Pindah Saldo (Rebalancing)',
        description: 'Memindahkan saldo internal antar rekening bank, EDC, dan kas laci',
      },
      {
        key: 'canProcessExpense',
        label: 'Catat Biaya Toko (OPEX)',
        description: 'Mencatat pengeluaran operasional toko yang dibayar dari kas laci',
      },
    ],
  },
  {
    id: 'audit_receipts',
    title: 'Riwayat, Struk & Pembatalan',
    description: 'Akses audit laporan riwayat kasir, cetak ulang nota, dan void transaksi',
    iconName: 'FileText',
    badgeColor: 'purple',
    items: [
      {
        key: 'canViewHistory',
        label: 'Lihat Riwayat Transaksi',
        description: 'Melihat seluruh daftar riwayat transaksi kasir',
      },
      {
        key: 'canReprintReceipt',
        label: 'Cetak Ulang / Bagikan Struk',
        description: 'Mencetak ulang atau membagikan struk transaksi ke WhatsApp',
      },
      {
        key: 'canVoidTransaction',
        label: 'Pembatalan Transaksi (Void)',
        description: 'Membatalkan nota/transaksi yang telah selesai diproses',
      },
    ],
  },
];

export const ROLE_PERMISSION_PRESETS: Record<StaffRole, StaffPermissions> = {
  SENIOR_CASHIER: {
    canProcessPos: true,
    canManageShift: true,
    canApplyCustomDiscount: true,
    canRebalance: true,
    canProcessExpense: true,
    canViewHistory: true,
    canReprintReceipt: true,
    canVoidTransaction: true,
  },
  JUNIOR_CASHIER: {
    canProcessPos: true,
    canManageShift: true,
    canApplyCustomDiscount: false,
    canRebalance: false,
    canProcessExpense: true,
    canViewHistory: true,
    canReprintReceipt: true,
    canVoidTransaction: false,
  },
  TRAINEE: {
    canProcessPos: true,
    canManageShift: false,
    canApplyCustomDiscount: false,
    canRebalance: false,
    canProcessExpense: false,
    canViewHistory: false,
    canReprintReceipt: true,
    canVoidTransaction: false,
  },
};

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  canProcessPos: true,
  canManageShift: true,
  canApplyCustomDiscount: false,
  canRebalance: false,
  canProcessExpense: true,
  canViewHistory: true,
  canReprintReceipt: true,
  canVoidTransaction: false,
};

export interface StaffKPI {
  cashAccuracyPercentage: number;
  shiftOnTimePercentage: number;
  totalShiftCount: number;
}

export interface StaffUser {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  currentShiftId?: string;
  permissions: StaffPermissions;
  kpi: StaffKPI;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffPayload {
  fullName: string;
  username: string;
  phone: string;
  role: StaffRole;
  pin: string;
  permissions: StaffPermissions;
}

export interface ResetPinPayload {
  staffId: string;
  newPin: string;
  forceLogout: boolean;
}

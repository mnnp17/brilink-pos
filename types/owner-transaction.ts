export type QuickTimePreset = 'TODAY' | 'ACTIVE_SHIFT' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM';

export interface TransactionFilterState {
  timePreset: QuickTimePreset;
  startDateTime: string; // ISO String
  endDateTime: string;   // ISO String
  shiftId?: string;
  cashierId?: string;
  accountId?: string;
  serviceId?: string;
  marginStatus?: 'ALL' | 'NORMAL' | 'ANOMALY';
  searchQuery?: string;
}

export interface RefactoredOwnerTransaction {
  id: string;
  transactionNumber: string;
  createdAt: string; // ISO String lengkap jam & detik
  serviceName: string;
  sourceAccountName: string;
  cashierName: string;
  amount: number;
  customerAdminFee: number;
  bankFee: number;       // COGS
  netProfit: number;     // customerAdminFee - bankFee
  status: 'SUCCESS' | 'FAILED' | 'VOID';
  hasAnomaly: boolean;   // True jika netProfit <= 0 atau ada override admin
  anomalyNote?: string;
}

export interface AITransactionAuditResponse {
  summaryPoints: string[];
  anomaliesFound: boolean;
  anomalyDetails?: string[];
  efficiencyTip?: string;
}

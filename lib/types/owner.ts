export interface OwnerDashboardStats {
  netProfitToday: number;
  netProfitWeekly: number;
  netProfitMonthly: number;
  totalDigitalLiquidity: number;
  totalPhysicalCash: number;
  grossVolumeToday: number;
  transactionCountToday: number;
  alerts: {
    lowBalanceAccounts: string[];
    unmatchedShiftsCount: number;
  };
}

export interface TransactionProfitDetail {
  id: string;
  createdAt: string;
  serviceName: string;
  sourceAccountName: string;
  amount: number;
  customerAdminFee: number;
  bankFee: number;
  netProfit: number; // customerAdminFee - bankFee
}

export interface ShiftAuditLog {
  id: string;
  cashierName: string;
  clockInAt: string;
  clockOutAt: string;
  shiftDuration: string;
  openingCash: number;
  expectedCash: number;
  actualCash: number;
  variance: number; // actualCash - expectedCash
  varianceNote?: string;
  status: 'MATCH' | 'MINUS' | 'PLUS';
}

export interface AIInsightResponse {
  executiveSummary: string[];
  liquidityWarning?: string;
  anomalyNotice?: string;
  marginAdvice?: string;
}

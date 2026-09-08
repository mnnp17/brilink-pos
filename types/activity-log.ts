export type ActivityType = 
  | 'TRANSACTION' 
  | 'REBALANCE' 
  | 'SHIFT_START' 
  | 'SHIFT_END' 
  | 'EXPENSE_ADD' 
  | 'VOID_TRANSACTION' 
  | 'ADMIN_OVERRIDE';

export interface AccountBalanceImpact {
  accountId: string;
  accountName: string;
  balanceBefore: number;
  changeAmount: number;
  balanceAfter: number;
}

export interface CashierActivityLog {
  id: string;
  timestamp: string;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  activityType: ActivityType;
  title: string;
  summary: string;
  notes?: string;
  deviceInfo?: string;
  // Optional details based on type
  transactionId?: string;
  expenseId?: string;
  impacts?: AccountBalanceImpact[];
}

export type AccountType = 'CASH_DRAWER' | 'BANK_ACCOUNT' | 'EDC_MERCHANT';

export type MutationType = 
  | 'POS_TRANSACTION' 
  | 'INTERNAL_REBALANCE' 
  | 'STORE_EXPENSE' 
  | 'MANUAL_ADJUSTMENT';

export type AdjustmentReason = 
  | 'BANK_ADMIN_FEE' 
  | 'BANK_INTEREST' 
  | 'INPUT_CORRECTION' 
  | 'AUDIT_DIFFERENCE'
  | 'OTHER';

export interface FinancialAccount {
  id: string;
  accountName: string;
  accountType: AccountType;
  bankName?: string;
  accountNumberOrTid?: string;
  currentBalance: number;
  minBalanceThreshold: number;
  isActive: boolean;
  colorCode?: string; // e.g. blue, emerald, amber, rose, purple
  lastMutatedAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Compatibility properties for Header & cashier rebalance forms
  name: string;
  accountNumber: string;
  balance: number;
  type: 'bank' | 'cash';
}

export interface AccountMutation {
  id: string;
  accountId: string;
  accountName: string;
  mutationType: MutationType;
  direction: 'IN' | 'OUT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  description: string;
  executedBy: string;
  createdAt: string;
}

export interface RebalancePayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  notes?: string;
  executedBy: string;
}

export interface BalanceAdjustmentPayload {
  accountId: string;
  actualBalance: number;
  reasonCategory: AdjustmentReason;
  notes: string;
  executedBy: string;
}

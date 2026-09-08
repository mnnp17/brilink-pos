export type ExpenseCategory = string;

export interface CustomExpenseCategory {
  id: string;
  name: string;
  code: string;
  badgeColor: string;
  sortOrder: number;
}

export interface ExpenseItem {
  id: string;
  createdAt: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptUrl?: string;
  createdBy: string;
}

export interface CogsConfig {
  type: 'FLAT' | 'PERCENTAGE' | 'TIERED';
  flatAmount?: number;
  percentageValue?: number;
  tieredRules?: Array<{ minAmount: number; maxAmount: number; bankFee: number }>;
}

export interface DailyFinancialChartData {
  date: string;
  dayLabel: string;
  grossVolume: number;      // Garis 1
  totalExpenses: number;    // Garis 2 (COGS + OPEX)
  netProfitReal: number;    // Garis 3
  breakdown: {
    customerAdmin: number;
    cogsBank: number;
    opexAmount: number;
  };
}

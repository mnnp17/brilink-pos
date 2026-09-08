export type ReportTabType = 'PROFIT_LOSS' | 'SERVICES' | 'CASHIER_AUDIT' | 'BANK_MUTATION';

export interface FinancialReportSummary {
  periodLabel: string;
  grossVolume: number;
  customerAdminIncome: number;
  cogsBankFee: number;
  grossProfit: number; // customerAdminIncome - cogsBankFee
  totalOpex: number;
  netProfitReal: number; // grossProfit - totalOpex
  momGrowth: {
    grossVolumePct: number;
    cogsPct: number;
    opexPct: number;
    netProfitPct: number;
  };
  monthlyTarget: number;
  targetAchievementPct: number;
}

export interface AIStrategicAdvice {
  healthScore: number;
  executiveSummary: string[];
  strategicRecommendations: string[];
}

export interface OpexBreakdownItem {
  categoryName: string;
  amount: number;
}

export interface ServiceProfitabilityItem {
  serviceId: string;
  serviceName: string;
  txCount: number;
  grossAdmin: number;
  cogsBank: number;
  netProfit: number;
  marginPct: number;
}

export interface CashierAuditSummary {
  cashierId: string;
  cashierName: string;
  totalShifts: number;
  matchedShifts: number;
  totalVarianceAmount: number;
  accuracyScore: number; // 0 - 100%
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_EVALUATION';
}

export interface AccountBalanceItem {
  accountId: string;
  accountName: string;
  accountNumber: string;
  currentBalance: number;
  minThreshold: number;
  totalMutationsCount: number;
  totalMerchantFee: number;
}

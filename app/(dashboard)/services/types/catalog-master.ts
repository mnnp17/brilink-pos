export type FeeType = 'FLAT' | 'TIERED' | 'PERCENTAGE';
export type CashflowType = 
  | 'ADD_CASH'                     // Setor Tunai (Nasabah Serah Uang Fisik Penuh + Admin)
  | 'REDUCE_CASH'                  // Tarik Tunai (Nasabah Tarik Uang Fisik)
  | 'TRANSFER_FLEXIBLE'            // Transfer Bank (Fleksibel - Kasir Pilih Rekening BRILink atau Rekening Nasabah)
  | 'TRANSFER_STORE_BALANCE'       // Transfer Bank (Terkunci: Wajib Saldo Toko BRILink)
  | 'TRANSFER_CUSTOMER_BALANCE'    // Transfer Bank (Terkunci: Wajib Saldo/ATM Nasabah)
  | 'MUTATION_ONLY';               // PPOB & Tagihan Digital
export type AdminFeeRule = 'MANDATORY_CASH' | 'MANDATORY_DEDUCTED' | 'FLEXIBLE';
export type AdvisoryType = 'COGS_ROUTING' | 'TIER_THRESHOLD' | 'INACTIVE_CLEANUP' | 'LIQUIDITY_PREDICTION';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  badgeColor: string;
  sortOrder: number;
  isActive: boolean;
  servicesCount?: number;
}

export interface FeeTierRule {
  id?: string;
  minAmount: number;
  maxAmount: number;
  customerAdminFee: number;
  bankFeeCogs: number;
  netProfit: number;
}

export interface CatalogServiceItem {
  id: string;
  serviceCode: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  defaultAccountId: string;
  defaultAccountName?: string;
  minTxAmount: number;
  maxTxAmount: number;
  feeType: FeeType;
  isActive: boolean;
  flatCustomerAdmin?: number;
  flatBankFeeCogs?: number;
  percentageCustomerAdmin?: number;
  percentageBankFeeCogs?: number;
  maxPercentageCap?: number;
  tierRules?: FeeTierRule[];
  
  // Operational Guardrails & Smart Form Rules
  cashflowType?: CashflowType;
  adminFeeRule?: AdminFeeRule;
  adminFeeEditable?: boolean;
  minAdminFee?: number;
  maxAdminFee?: number;
  requiresCustomerRef?: boolean;
  customerRefLabel?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AIOperationalAdvice {
  id: string;
  type: AdvisoryType;
  title: string;
  description: string;
  impactMonthlyAmount?: number;
  targetServiceId?: string;
  suggestedAccountId?: string;
}

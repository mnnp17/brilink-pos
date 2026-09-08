export interface DenominationBreakdown {
  [nominal: number]: number; // Contoh: { 100000: 15, 50000: 10 }
}

export interface PreviousShiftInfo {
  closingBalance: number;
  closedByName: string;
  closedAt: string;
}

export interface OpenShiftPayload {
  cashierId: string;
  cashierName: string;
  startingCash: number;
  denominations?: DenominationBreakdown;
  notes?: string;
  isAutoFilledFromPrevious: boolean;
  openedAt: string;
}

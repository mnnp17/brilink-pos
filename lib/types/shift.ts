export interface ShiftSession {
  id: string;
  cashierName: string;
  clockInAt: string; // ISO String (contoh: "2026-08-18T08:00:00Z")
  clockOutAt: string; // ISO String saat modal dibuka
  openingCash: number; // Modal awal laci
  totalCashIn: number; // Uang masuk fisik
  totalCashOut: number; // Uang keluar fisik
  expectedCash: number; // openingCash + totalCashIn - totalCashOut
}

export interface DenominationState {
  d100k: number;
  d50k: number;
  d20k: number;
  d10k: number;
  d5k: number;
  d2k: number;
  d1k: number;
}

export interface ShiftPrintDenomination {
  nominal: number;
  count: number;
  total: number;
}

export interface ShiftPrintData {
  shiftId: string;
  reconciliationId: string;
  outletName: string;
  outletAddress: string;
  outletPhone: string;
  cashierName: string;
  cashierRole: string;
  openedAt: string;
  closedAt: string;
  durationFormatted: string;
  startCash: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedCash: number;
  actualCash: number;
  differenceCash: number;
  status: 'MATCH' | 'DISCREPANCY';
  denominations?: ShiftPrintDenomination[];
  notes?: string;
  printedAt: string;
}

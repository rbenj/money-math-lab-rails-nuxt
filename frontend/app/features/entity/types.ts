export enum EntityType {
  Account = "account",
  Debt = "debt",
  Expense = "expense",
  Holding = "holding",
  Income = "income",
  Possession = "possession",
}

export interface SerializedEntity {
  id: string;
  name: string;
  type: string;
  templateKey: string;
  parentId: string | null;
  data: Record<string, unknown>;
  ledgerEntries: SerializedLedgerEntry[];
}

export interface LedgerEntry {
  id?: string;
  day: number;
  amount?: number;
  shareQuantity?: number;
  sharePrice?: number;
}

export type Ledger = LedgerEntry[];

export interface SerializedLedgerEntry {
  id?: string;
  day: number;
  amount?: number;
  shareQuantity?: number;
  sharePrice?: number;
  isDeleted?: boolean;
}

export type SerializedLedger = SerializedLedgerEntry[];

export interface ScheduleFormData {
  type: string;
  daysOfMonth?: number[];
  daysOfWeek?: number[];
  interval?: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface LedgerEntryFormData {
  id?: string;
  day: string; // YYYY-MM-DD
  amount?: number;
  shareQuantity?: number;
  sharePrice?: number;
  isDeleted?: boolean;
}

export interface BaseEntityFormData {
  id?: string;
  name: string;
  templateKey: string;
  parentId?: string;
  ledgerEntries: LedgerEntryFormData[];
}

export interface AccountEntityFormData extends BaseEntityFormData {
  type: EntityType.Account;
  growthRate: number;
}

export interface DebtEntityFormData extends BaseEntityFormData {
  type: EntityType.Debt;
  interestRate: number;
  paymentAmount: number;
  paymentSchedule: ScheduleFormData;
  paymentSourceEntityId: string;
}

export interface ExpenseEntityFormData extends BaseEntityFormData {
  type: EntityType.Expense;
  growthRate: number;
  schedule: ScheduleFormData;
  sourceEntityId: string;
}

export interface HoldingEntityFormData extends BaseEntityFormData {
  type: EntityType.Holding;
  symbol: string;
  growthRate: number;
}

export interface IncomeEntityFormData extends BaseEntityFormData {
  type: EntityType.Income;
  growthRate: number;
  schedule: ScheduleFormData;
  targetEntityId: string;
}

export interface PossessionEntityFormData extends BaseEntityFormData {
  type: EntityType.Possession;
  growthRate: number;
}

export type EntityFormData =
  | AccountEntityFormData
  | DebtEntityFormData
  | ExpenseEntityFormData
  | HoldingEntityFormData
  | IncomeEntityFormData
  | PossessionEntityFormData;

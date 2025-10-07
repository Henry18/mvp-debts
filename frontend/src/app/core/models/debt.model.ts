import { User } from './user.model';

export enum DebtStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface Debt {
  id: string;
  description: string;
  amount: number;
  status: DebtStatus;
  paidAt?: Date;
  debtor: User;
  creditor: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDebtInput {
  description: string;
  amount: number;
  debtorId: string;
  creditorId: string;
}

export interface UpdateDebtInput {
  id: string;
  description?: string;
  amount?: number;
}

export interface DebtSummary {
  totalDebts: number;
  pendingDebts: number;
  paidDebts: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}

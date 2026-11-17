export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'OTHER';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
  date: string; // ISO 8601 string
  note?: string;
  receiptImage?: string; // Base64 data URL
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string; // Lucide icon name
  color: string; // Hex color
  monthlyBudget?: number;
  isCustom?: boolean;
}

export type DebtType = 'RECEIVABLE' | 'PAYABLE'; // পাবো (Asset) vs দিবো (Liability)
export type DebtStatus = 'PENDING' | 'PARTIAL' | 'SETTLED';

export interface DebtSettlement {
  id: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface DebtRecord {
  id: string;
  personName: string;
  phoneNumber?: string;
  type: DebtType;
  totalAmount: number;
  settledAmount: number;
  dueDate?: string;
  notes?: string;
  status: DebtStatus;
  settlements: DebtSettlement[];
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  language: 'bn' | 'en';
  currencySymbol: string;
  currencyCode: string;
  monthlyBudgetLimit: number;
  theme: 'light' | 'dark';
  isPinEnabled: boolean;
  pinHash?: string;
}

export type ActiveTab = 'dashboard' | 'transactions' | 'debts' | 'reports' | 'settings';

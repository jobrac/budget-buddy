
import type { Timestamp } from "firebase/firestore";

export interface Project {
    id: string;
    name: string;
    budget: number;
    currency: string;
    createdAt: Timestamp;
    roles: {
        [uid: string]: 'Owner' | 'Editor' | 'Viewer';
    };
    type: 'Personal' | 'Business' | 'Other';
}

export interface Account {
    id: string;
    name: string;
    balance: number;
    currency: string;
    createdAt: Timestamp;
}

export interface Transaction {
    id: string;
    amount: number; // in project's currency
    type: 'Income' | 'Expense';
    category: string;
    date: Timestamp;
    clientDate: Timestamp;
    description?: string;
    createdAt: Timestamp;
    accountId: string;
    accountName: string;
    originalAmount?: number; // in account's currency
    accountCurrency?: string;
    recurringTransactionId?: string; // Link to the rule that created it
}

export interface Category {
    id: string;
    name: string;
    isDefault?: boolean;
}

export interface RecurringTransaction {
    id: string;
    accountId: string;
    accountName: string;
    amount: number;
    type: 'Income' | 'Expense';
    category: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // e.g., 1 for every month, 2 for every other month
    startDate: Timestamp;
    endDate?: Timestamp;
    nextDueDate: Timestamp;
    createdAt: Timestamp;
}

export interface UserPreferences {
    id: string;
    defaultCurrency: string;
}

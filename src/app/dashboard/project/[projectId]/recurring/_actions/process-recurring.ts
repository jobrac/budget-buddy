
'use server';

import { db } from "@/lib/firebase/client";
import type { RecurringTransaction, Account } from "@/lib/types";
import { collection, query, where, getDocs, Timestamp, writeBatch, doc } from "firebase/firestore";
import { add } from 'date-fns';

// This function calculates the next due date based on the frequency and interval
const calculateNextDueDate = (currentDueDate: Date, frequency: string, interval: number): Date => {
    switch (frequency) {
        case 'daily':
            return add(currentDueDate, { days: interval });
        case 'weekly':
            return add(currentDueDate, { weeks: interval });
        case 'monthly':
            return add(currentDueDate, { months: interval });
        case 'yearly':
            return add(currentDueDate, { years: interval });
        default:
            throw new Error(`Unknown frequency: ${frequency}`);
    }
};


export async function processRecurringTransactions(projectId: string): Promise<{created: number}> {
    const recurringRef = collection(db, "projects", projectId, "recurringTransactions");
    const accountsRef = collection(db, "projects", projectId, "accounts");
    const transactionsRef = collection(db, "projects", projectId, "transactions");
    
    // Find all rules that are due
    const now = Timestamp.now();
    const q = query(recurringRef, where("nextDueDate", "<=", now));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { created: 0 };
    }
    
    // Fetch all accounts in the project once to avoid multiple reads
    const accountsSnap = await getDocs(accountsRef);
    const accountsMap = new Map<string, Account>();
    accountsSnap.forEach(doc => {
        accountsMap.set(doc.id, {id: doc.id, ...doc.data()} as Account);
    });

    const batch = writeBatch(db);
    let createdCount = 0;

    for (const ruleDoc of querySnapshot.docs) {
        const rule = { id: ruleDoc.id, ...ruleDoc.data() } as RecurringTransaction;
        
        let currentDueDate = rule.nextDueDate.toDate();
        
        // Loop to create all missed transactions since the last check
        while (currentDueDate <= now.toDate()) {
            const account = accountsMap.get(rule.accountId);
            if (!account) continue; // Skip if account was deleted

            // 1. Create the new transaction
            const newTransactionRef = doc(transactionsRef);
            batch.set(newTransactionRef, {
                amount: rule.amount,
                type: rule.type,
                category: rule.category,
                description: rule.description || `Recurring: ${rule.category}`,
                date: Timestamp.fromDate(currentDueDate), // The server timestamp for when it was processed
                clientDate: Timestamp.fromDate(currentDueDate), // The actual due date
                createdAt: Timestamp.now(),
                accountId: rule.accountId,
                accountName: account.name,
                originalAmount: rule.amount, // Assuming recurring is in project currency for now
                accountCurrency: account.currency, // Storing this for consistency
                recurringTransactionId: rule.id,
            });
            
            createdCount++;

            // 2. Update the account balance
            const accountRef = doc(db, "projects", projectId, "accounts", rule.accountId);
            const newBalance = rule.type === 'Income' 
                ? account.balance + rule.amount 
                : account.balance - rule.amount;
            batch.update(accountRef, { balance: newBalance });
            
            // Manually update balance in our map to handle multiple transactions for the same account
            account.balance = newBalance; 
            accountsMap.set(rule.accountId, account);

            // 3. Calculate the next due date for the rule
            currentDueDate = calculateNextDueDate(currentDueDate, rule.frequency, rule.interval);
        }

        // 4. Update the rule with the new nextDueDate
        batch.update(ruleDoc.ref, { nextDueDate: Timestamp.fromDate(currentDueDate) });
    }

    await batch.commit();
    
    return { created: createdCount };
}

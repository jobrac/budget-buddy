
'use server';

/**
 * @fileOverview A flow for checking the budget status of a project.
 *
 * - checkBudgetStatus - A function that checks if a project is over, under, or near its budget for the current month.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { Project } from '@/lib/types';
import { CheckBudgetStatusInputSchema, CheckBudgetStatusOutputSchema, type CheckBudgetStatusInput, type CheckBudgetStatusOutput } from '@/ai/schemas/check-budget-status';


export async function checkBudgetStatus(
  input: CheckBudgetStatusInput
): Promise<CheckBudgetStatusOutput> {
  return checkBudgetStatusFlow(input);
}


const checkBudgetStatusFlow = ai.defineFlow(
  {
    name: 'checkBudgetStatusFlow',
    inputSchema: CheckBudgetStatusInputSchema,
    outputSchema: CheckBudgetStatusOutputSchema,
  },
  async ({ projectId }) => {
    // 1. Fetch project to get the budget
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
        throw new Error('Project not found');
    }
    const project = projectSnap.data() as Project;
    const budget = project.budget || 0;

    if (budget <= 0) {
        return { status: 'NO_BUDGET', message: 'No budget set for this project.', expenses: 0, budget: 0 };
    }

    // 2. Fetch expenses for the current month
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
      
    const transactionsQuery = collection(db, "projects", projectId, "transactions");
    const q = query(
        transactionsQuery, 
        where("type", "==", "Expense"),
        where("clientDate", ">=", Timestamp.fromDate(startOfCurrentMonth)),
        where("clientDate", "<=", Timestamp.fromDate(endOfCurrentMonth))
    );

    const querySnapshot = await getDocs(q);
    const totalExpenses = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

    // 3. Determine status and message
    const percentageSpent = (totalExpenses / budget) * 100;
    
    if (percentageSpent > 100) {
        return { 
            status: 'OVER_BUDGET', 
            message: `You are over budget by $${(totalExpenses - budget).toFixed(2)}.`,
            expenses: totalExpenses,
            budget
        };
    } else if (percentageSpent >= 85) {
        return { 
            status: 'NEAR_BUDGET',
            message: `You have spent ${percentageSpent.toFixed(0)}% of your budget.`,
            expenses: totalExpenses,
            budget
        };
    } else {
        return {
            status: 'UNDER_BUDGET',
            message: `You are well within your budget.`,
            expenses: totalExpenses,
            budget
        };
    }
  }
);

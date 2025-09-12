import { z } from 'genkit';

export const CheckBudgetStatusInputSchema = z.object({
  projectId: z.string().describe('The ID of the project to check.'),
});
export type CheckBudgetStatusInput = z.infer<typeof CheckBudgetStatusInputSchema>;


export const CheckBudgetStatusOutputSchema = z.object({
    status: z.enum(['OVER_BUDGET', 'NEAR_BUDGET', 'UNDER_BUDGET', 'NO_BUDGET'])
        .describe('The budget status of the project.'),
    message: z.string().describe('A brief, helpful message about the budget status.'),
    expenses: z.number().describe('The total expenses for the current month.'),
    budget: z.number().describe('The project\'s budget.'),
});
export type CheckBudgetStatusOutput = z.infer<typeof CheckBudgetStatusOutputSchema>;

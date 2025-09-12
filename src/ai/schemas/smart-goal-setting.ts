import {z} from 'genkit';

export const SuggestBudgetGoalInputSchema = z.object({
  incomeHistory: z
    .string()
    .describe('Historical income data, as a JSON string.'),
  expenseHistory: z
    .string()
    .describe('Historical expense data, as a JSON string.'),
  projectType: z
    .string()
    .describe(
      'The type of project (e.g., Home Budget, Office Budget, Business Budget).'
    ),
});
export type SuggestBudgetGoalInput = z.infer<typeof SuggestBudgetGoalInputSchema>;

export const SuggestBudgetGoalOutputSchema = z.object({
  suggestedGoal: z
    .number()
    .describe('The suggested budget goal for the project.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested budget goal.'),
});
export type SuggestBudgetGoalOutput = z.infer<typeof SuggestBudgetGoalOutputSchema>;

'use server';

/**
 * @fileOverview A flow for suggesting budget goals for projects based on historical data and project type.
 *
 * - suggestBudgetGoal - A function that suggests budget goals for a project.
 */

import {ai} from '@/ai/genkit';
import { SuggestBudgetGoalInputSchema, SuggestBudgetGoalOutputSchema, type SuggestBudgetGoalInput, type SuggestBudgetGoalOutput } from '@/ai/schemas/smart-goal-setting';


export async function suggestBudgetGoal(input: SuggestBudgetGoalInput): Promise<SuggestBudgetGoalOutput> {
  return suggestBudgetGoalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBudgetGoalPrompt',
  input: {schema: SuggestBudgetGoalInputSchema},
  output: {schema: SuggestBudgetGoalOutputSchema},
  prompt: `You are a financial advisor who helps users set realistic budget goals for their projects.

  Based on the user's historical income, expenses, and the project type, suggest a budget goal.

  Income History: {{{incomeHistory}}}
  Expense History: {{{expenseHistory}}}
  Project Type: {{{projectType}}}

  Consider the project type when suggesting the budget goal. For example, a "Business Budget" might require more initial investment than a "Home Budget".

  Provide a brief reasoning for your suggested budget goal.

  Output your reasoning and suggested budget goal in JSON format.
  `,
});

const suggestBudgetGoalFlow = ai.defineFlow(
  {
    name: 'suggestBudgetGoalFlow',
    inputSchema: SuggestBudgetGoalInputSchema,
    outputSchema: SuggestBudgetGoalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

import { z } from 'genkit';

export const ConvertCurrencyInputSchema = z.object({
  amount: z.number().describe('The amount to convert.'),
  from: z.string().describe('The currency to convert from (e.g., USD).'),
  to: z.string().describe('The currency to convert to (e.g., EUR).'),
});
export type ConvertCurrencyInput = z.infer<typeof ConvertCurrencyInputSchema>;

export const ConvertCurrencyOutputSchema = z.object({
  convertedAmount: z.number().describe('The converted amount.'),
});
export type ConvertCurrencyOutput = z.infer<typeof ConvertCurrencyOutputSchema>;

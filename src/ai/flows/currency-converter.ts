
'use server';

/**
 * @fileOverview A flow for converting currency amounts using an external API.
 *
 * - convertCurrency - A function that converts an amount from one currency to another.
 */

import { ai } from '@/ai/genkit';
import { ConvertCurrencyInputSchema, ConvertCurrencyOutputSchema, type ConvertCurrencyInput, type ConvertCurrencyOutput } from '@/ai/schemas/currency-converter';


export async function convertCurrency(
  input: ConvertCurrencyInput
): Promise<ConvertCurrencyOutput> {
  return convertCurrencyFlow(input);
}

const convertCurrencyFlow = ai.defineFlow(
  {
    name: 'convertCurrencyFlow',
    inputSchema: ConvertCurrencyInputSchema,
    outputSchema: ConvertCurrencyOutputSchema,
  },
  async ({ amount, from, to }) => {
    if (from === to) {
      return { convertedAmount: amount };
    }
    
    // Using a free, open-source currency exchange API
    const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Currency API request failed with status ${response.status}`);
      }
      const data = await response.json();
      const convertedAmount = data.rates[to];
      
      if (convertedAmount === undefined) {
          throw new Error(`Conversion rate for ${to} not found in API response.`);
      }
      
      return { convertedAmount };
    } catch (error) {
      console.error("Currency conversion failed:", error);
      // Fallback to a 1:1 conversion if API fails to prevent blocking user
      return { convertedAmount: amount };
    }
  }
);

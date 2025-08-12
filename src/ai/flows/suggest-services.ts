'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest relevant services based on a user's natural language query.
 *
 * - suggestServices - A function that takes a user query and returns a list of suggested services.
 * - SuggestServicesInput - The input type for the suggestServices function, which is a string query.
 * - SuggestServicesOutput - The return type for the suggestServices function, which is a list of service names.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestServicesInputSchema = z
  .string()
  .describe('The user query to find the relevant services.');
export type SuggestServicesInput = z.infer<typeof SuggestServicesInputSchema>;

const SuggestServicesOutputSchema = z.array(z.string()).describe('A list of suggested service names.');
export type SuggestServicesOutput = z.infer<typeof SuggestServicesOutputSchema>;

export async function suggestServices(query: SuggestServicesInput): Promise<SuggestServicesOutput> {
  return suggestServicesFlow(query);
}

const prompt = ai.definePrompt({
  name: 'suggestServicesPrompt',
  input: {schema: SuggestServicesInputSchema},
  output: {schema: SuggestServicesOutputSchema},
  prompt: `You are an AI assistant helping users find government services. Based on the user's query, suggest a list of relevant service names.

User Query: {{{$input}}}

Suggested Services:`,
});

const suggestServicesFlow = ai.defineFlow(
  {
    name: 'suggestServicesFlow',
    inputSchema: SuggestServicesInputSchema,
    outputSchema: SuggestServicesOutputSchema,
  },
  async query => {
    const {output} = await prompt(query);
    return output!;
  }
);

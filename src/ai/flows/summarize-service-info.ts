'use server';

/**
 * @fileOverview A service information summarization AI agent.
 *
 * - summarizeServiceInfo - A function that summarizes service information.
 * - SummarizeServiceInfoInput - The input type for the summarizeServiceInfo function.
 * - SummarizeServiceInfoOutput - The return type for the summarizeServiceInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeServiceInfoInputSchema = z.object({
  serviceName: z.string().describe('The name of the service to summarize.'),
  serviceDetails: z.string().describe('Detailed information about the service.'),
});
export type SummarizeServiceInfoInput = z.infer<typeof SummarizeServiceInfoInputSchema>;

const SummarizeServiceInfoOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the service information.'),
});
export type SummarizeServiceInfoOutput = z.infer<typeof SummarizeServiceInfoOutputSchema>;

export async function summarizeServiceInfo(input: SummarizeServiceInfoInput): Promise<SummarizeServiceInfoOutput> {
  return summarizeServiceInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeServiceInfoPrompt',
  input: {schema: SummarizeServiceInfoInputSchema},
  output: {schema: SummarizeServiceInfoOutputSchema},
  prompt: `You are an AI assistant designed to provide summaries of government services to citizens.

  Summarize the following information about the '{{{serviceName}}}' service in a clear and concise manner, highlighting key features and benefits for the user:

  {{{serviceDetails}}}
  `,
});

const summarizeServiceInfoFlow = ai.defineFlow(
  {
    name: 'summarizeServiceInfoFlow',
    inputSchema: SummarizeServiceInfoInputSchema,
    outputSchema: SummarizeServiceInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

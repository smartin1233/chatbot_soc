'use server';
/**
 * @fileOverview Chatbot flow that provides contextual help based on the selected Business Unit and Line of Business.
 *
 * - getContextualHelp - A function that retrieves relevant help information based on the context.
 * - ContextualHelpInput - The input type for the getContextualHelp function.
 * - ContextualHelpOutput - The return type for the getContextualHelp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualHelpInputSchema = z.object({
  businessUnit: z.string().describe('The selected Business Unit.'),
  lineOfBusiness: z.string().describe('The selected Line of Business.'),
  query: z.string().describe('The user query.'),
});
export type ContextualHelpInput = z.infer<typeof ContextualHelpInputSchema>;

const ContextualHelpOutputSchema = z.object({
  helpText: z.string().describe('The relevant help information.'),
});
export type ContextualHelpOutput = z.infer<typeof ContextualHelpOutputSchema>;

export async function getContextualHelp(input: ContextualHelpInput): Promise<ContextualHelpOutput> {
  return contextualHelpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualHelpPrompt',
  input: {schema: ContextualHelpInputSchema},
  output: {schema: ContextualHelpOutputSchema},
  prompt: `You are a Business Intelligence forecasting platform assistant. Provide contextual help based on the selected Business Unit and Line of Business for the user's query.

Business Unit: {{{businessUnit}}}
Line of Business: {{{lineOfBusiness}}}
User Query: {{{query}}}

Provide relevant and accurate help with forecasting tasks.`,
});

const contextualHelpFlow = ai.defineFlow(
  {
    name: 'contextualHelpFlow',
    inputSchema: ContextualHelpInputSchema,
    outputSchema: ContextualHelpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

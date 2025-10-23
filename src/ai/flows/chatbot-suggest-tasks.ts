'use server';

/**
 * @fileOverview An AI agent that suggests relevant forecasting tasks based on user data and business goals.
 *
 * - chatbotSuggestTasks - A function that suggests relevant forecasting tasks.
 * - ChatbotSuggestTasksInput - The input type for the chatbotSuggestTasks function.
 * - ChatbotSuggestTasksOutput - The return type for the chatbotSuggestTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatbotSuggestTasksInputSchema = z.object({
  businessUnit: z.string().describe('The business unit for which to suggest tasks.'),
  lineOfBusiness: z.string().describe('The line of business for which to suggest tasks.'),
  businessGoals: z.string().describe('The business goals for the forecasting exercise.'),
  dataDescription: z.string().describe('A description of the available data.'),
});
export type ChatbotSuggestTasksInput = z.infer<typeof ChatbotSuggestTasksInputSchema>;

const ChatbotSuggestTasksOutputSchema = z.object({
  suggestedTasks: z.array(z.string()).describe('An array of suggested forecasting tasks.'),
  reasoning: z.string().describe('The reasoning behind the suggested tasks.'),
});
export type ChatbotSuggestTasksOutput = z.infer<typeof ChatbotSuggestTasksOutputSchema>;

export async function chatbotSuggestTasks(input: ChatbotSuggestTasksInput): Promise<ChatbotSuggestTasksOutput> {
  return chatbotSuggestTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatbotSuggestTasksPrompt',
  input: {schema: ChatbotSuggestTasksInputSchema},
  output: {schema: ChatbotSuggestTasksOutputSchema},
  prompt: `You are an expert business intelligence assistant. Your goal is to suggest relevant forecasting tasks to the user based on their business unit, line of business, business goals, and data description.

Business Unit: {{{businessUnit}}}
Line of Business: {{{lineOfBusiness}}}
Business Goals: {{{businessGoals}}}
Data Description: {{{dataDescription}}}

Suggest a list of relevant forecasting tasks, and explain your reasoning for each task.

Example output:
{
  "suggestedTasks": ["Analyze historical data", "Preprocess data", "Train forecasting model", "Evaluate model", "Generate forecast"],
  "reasoning": "Based on the business goals and data description, these tasks are recommended to build an effective forecasting model."
}
`,
});

const chatbotSuggestTasksFlow = ai.defineFlow(
  {
    name: 'chatbotSuggestTasksFlow',
    inputSchema: ChatbotSuggestTasksInputSchema,
    outputSchema: ChatbotSuggestTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

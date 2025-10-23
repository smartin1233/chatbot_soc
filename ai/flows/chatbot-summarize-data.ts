'use server';

/**
 * @fileOverview A flow that summarizes uploaded data, including key statistics and data quality indicators.
 *
 * - summarizeUploadedData - A function that handles the data summarization process.
 * - SummarizeUploadedDataInput - The input type for the summarizeUploadedData function.
 * - SummarizeUploadedDataOutput - The return type for the summarizeUploadedData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeUploadedDataInputSchema = z.object({
  data: z
    .string()
    .describe('The uploaded data in CSV or Excel format.'),
  fileType: z.enum(['csv', 'excel']).describe('The type of the uploaded file.'),
});
export type SummarizeUploadedDataInput = z.infer<typeof SummarizeUploadedDataInputSchema>;

const SummarizeUploadedDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the uploaded data, including key statistics and data quality indicators.'),
});
export type SummarizeUploadedDataOutput = z.infer<typeof SummarizeUploadedDataOutputSchema>;

export async function summarizeUploadedData(input: SummarizeUploadedDataInput): Promise<SummarizeUploadedDataOutput> {
  return summarizeUploadedDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeUploadedDataPrompt',
  input: {schema: SummarizeUploadedDataInputSchema},
  output: {schema: SummarizeUploadedDataOutputSchema},
  prompt: `You are a data analysis expert. Please provide a summary of the following data, including key statistics and data quality indicators. The data is in {{{fileType}}} format.\n\nData:\n{{{data}}}`,
});

const summarizeUploadedDataFlow = ai.defineFlow(
  {
    name: 'summarizeUploadedDataFlow',
    inputSchema: SummarizeUploadedDataInputSchema,
    outputSchema: SummarizeUploadedDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

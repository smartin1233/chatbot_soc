/**
 * @fileOverview Schemas and types for the chatbot report generation flow.
 *
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import {z} from 'genkit';

export const GenerateReportInputSchema = z.object({
  conversationHistory: z.string().describe('The entire conversation history as a JSON string.'),
  analysisContext: z.string().describe('The context of the current data analysis, including BU, LOB, and data quality.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

export const GenerateReportOutputSchema = z.object({
  reportMarkdown: z.string().describe('The generated report in Markdown format.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

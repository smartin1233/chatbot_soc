'use server';

/**
 * @fileOverview A flow that generates a report from conversation history and data context.
 *
 * - generateReport - A function that handles the report generation process.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateReportInputSchema,
  type GenerateReportInput,
  GenerateReportOutputSchema,
  type GenerateReportOutput,
} from '@/ai/flows/schemas/chatbot-generate-report-schema';

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are a Business Intelligence Analyst. Your task is to generate a comprehensive report based on the provided conversation history and data analysis context. The report should be well-structured, easy to read, and formatted in Markdown.

Here is the data to use:

**Analysis Context:**
{{{analysisContext}}}

**Conversation History (JSON):**
{{{conversationHistory}}}

**Report Structure:**
1.  **Title**: Create a clear title for the report.
2.  **Executive Summary**: A brief overview of the findings and recommendations.
3.  **Data Overview**: Describe the dataset that was analyzed (BU, LOB, record count).
4.  **Analysis and Findings**: Detail the key insights discovered during the conversation. Include trends, seasonality, and data quality issues.
5.  **Forecasting Workflow**: If a forecast was performed, describe the steps taken, the models used, and the evaluation results.
6.  **Forecast Results**: Present the final forecast if available.
7.  **Recommendations**: Provide actionable recommendations based on the analysis and forecast.

Generate the report in Markdown format.
`,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

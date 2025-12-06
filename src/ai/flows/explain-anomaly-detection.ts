'use server';

/**
 * @fileOverview This file defines a Genkit flow for explaining anomalies detected in FreshTrace data.
 *
 * - explainAnomaly - A function that takes anomaly data as input and returns a plain-English explanation.
 * - ExplainAnomalyInput - The input type for the explainAnomaly function.
 * - ExplainAnomalyOutput - The return type for the explainAnomaly function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainAnomalyInputSchema = z.object({
  metricName: z.string().describe('The name of the metric that exhibited anomalous behavior.'),
  metricValue: z.number().describe('The value of the metric at the time of the anomaly.'),
  expectedValue: z.number().describe('The expected value of the metric.'),
  timestamp: z.string().describe('The timestamp of the anomaly.'),
  additionalContext: z
    .string() // Changed from z.record to z.string, as a string is more appropriate for context description
    .optional()
    .describe('Additional context related to the anomaly, such as sensor readings or location data.'),
});
export type ExplainAnomalyInput = z.infer<typeof ExplainAnomalyInputSchema>;

const ExplainAnomalyOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A plain-English explanation of why the anomaly was flagged.'),
  suggestedAction: z
    .string()
    .describe('A concrete, actionable suggestion for the user to take to resolve the issue.'),
});
export type ExplainAnomalyOutput = z.infer<typeof ExplainAnomalyOutputSchema>;

export async function explainAnomaly(input: ExplainAnomalyInput): Promise<ExplainAnomalyOutput> {
  return explainAnomalyFlow(input);
}

const explainAnomalyPrompt = ai.definePrompt({
  name: 'explainAnomalyPrompt',
  input: {schema: ExplainAnomalyInputSchema},
  output: {schema: ExplainAnomalyOutputSchema},
  prompt: `You are an AI assistant that explains anomalies in FreshTrace data in plain English and suggests corrective actions.

  You will receive the metric name, its anomalous value, the expected value, the timestamp of the anomaly, and any additional context.

  Your task is to generate:
  1. A concise and understandable explanation of why the anomaly was flagged. Focus on the deviation from the expected value and the potential implications.
  2. A concrete, actionable suggestion for what the user should do next to investigate or resolve the issue.

  Metric Name: {{{metricName}}}
  Metric Value: {{{metricValue}}}
  Expected Value: {{{expectedValue}}}
  Timestamp: {{{timestamp}}}
  Additional Context: {{{additionalContext}}}
  `,
});

const explainAnomalyFlow = ai.defineFlow(
  {
    name: 'explainAnomalyFlow',
    inputSchema: ExplainAnomalyInputSchema,
    outputSchema: ExplainAnomalyOutputSchema,
  },
  async input => {
    const {output} = await explainAnomalyPrompt(input);
    return output!;
  }
);

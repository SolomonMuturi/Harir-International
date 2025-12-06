
'use server';

/**
 * @fileOverview This file defines a Genkit flow for explaining anomalies detected in water consumption data.
 *
 * - explainWaterAnomaly - A function that takes anomaly data and returns a plain-English explanation.
 * - ExplainAnomalyInput - The input type for the explainWaterAnomaly function.
 * - ExplainAnomalyOutput - The return type for the explainWaterAnomaly function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExplainAnomalyInput, ExplainAnomalyOutput } from './explain-anomaly-detection';

// Re-exporting types to be used by the page
export type { ExplainAnomalyInput, ExplainAnomalyOutput };

export async function explainWaterAnomaly(input: ExplainAnomalyInput): Promise<ExplainAnomalyOutput> {
  return explainWaterAnomalyFlow(input);
}

const explainWaterAnomalyPrompt = ai.definePrompt({
  name: 'explainWaterAnomalyPrompt',
  input: {schema: z.object({
      metricName: z.string(),
      metricValue: z.number(),
      expectedValue: z.number(),
      timestamp: z.string(),
      additionalContext: z.string().optional(),
    })
  },
  output: {schema: z.object({
      explanation: z.string(),
      suggestedAction: z.string()
    })
  },
  prompt: `You are an AI assistant for a fresh produce company called FreshTrace. You specialize in explaining water management anomalies.

  You will receive data about an unusual water consumption event. Your task is to generate:
  1. A concise and understandable explanation of why the anomaly was flagged. Consider potential causes like leaks, unscheduled cleaning, or irrigation system malfunctions.
  2. A concrete, actionable suggestion for what the user should do next to investigate or resolve the issue.

  Metric Name: {{{metricName}}}
  Anomalous Value: {{{metricValue}}} m³
  Expected Value: {{{expectedValue}}} m³
  Timestamp: {{{timestamp}}}
  Additional Context: {{{additionalContext}}}
  `,
});

const explainWaterAnomalyFlow = ai.defineFlow(
  {
    name: 'explainWaterAnomalyFlow',
    inputSchema: z.object({
      metricName: z.string(),
      metricValue: z.number(),
      expectedValue: z.number(),
      timestamp: z.string(),
      additionalContext: z.string().optional(),
    }),
    outputSchema: z.object({
      explanation: z.string(),
      suggestedAction: z.string()
    }),
  },
  async input => {
    const {output} = await explainWaterAnomalyPrompt(input);
    return output!;
  }
);


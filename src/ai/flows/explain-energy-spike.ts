
'use server';

/**
 * @fileOverview This file defines a Genkit flow for explaining anomalies detected in energy consumption data.
 *
 * - explainEnergySpike - A function that takes anomaly data and returns a plain-English explanation.
 * - ExplainAnomalyInput - The input type for the explainEnergySpike function.
 * - ExplainAnomalyOutput - The return type for the explainEnergySpike function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExplainAnomalyInput, ExplainAnomalyOutput } from './explain-anomaly-detection';

// Re-exporting types to be used by the page
export type { ExplainAnomalyInput, ExplainAnomalyOutput };

export async function explainEnergySpike(input: ExplainAnomalyInput): Promise<ExplainAnomalyOutput> {
  return explainEnergySpikeFlow(input);
}

const explainEnergySpikePrompt = ai.definePrompt({
  name: 'explainEnergySpikePrompt',
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
  prompt: `You are an AI assistant for a fresh produce company called FreshTrace. You specialize in explaining energy consumption anomalies.

  You will receive data about an unusual energy usage event. Your task is to generate:
  1. A concise and understandable explanation of why the anomaly was flagged. Consider potential causes like equipment starting up simultaneously, a faulty high-draw machine, or inefficient operation of cold rooms.
  2. A concrete, actionable suggestion for what the user should do next to investigate or resolve the issue.

  Metric Name: {{{metricName}}}
  Anomalous Value: {{{metricValue}}} kWh
  Expected Value: {{{expectedValue}}} kWh
  Timestamp: {{{timestamp}}}
  Additional Context: {{{additionalContext}}}
  `,
});

const explainEnergySpikeFlow = ai.defineFlow(
  {
    name: 'explainEnergySpikeFlow',
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
    const {output} = await explainEnergySpikePrompt(input);
    return output!;
  }
);

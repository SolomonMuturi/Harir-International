
'use server';
/**
 * @fileOverview A produce quality diagnosis AI agent.
 *
 * - diagnoseProduceQuality - A function that handles the produce diagnosis process.
 * - DiagnoseProduceQualityInput - The input type for the diagnoseProduceQuality function.
 * - DiagnoseProduceQualityOutput - The return type for the diagnoseProduceQuality function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DiagnoseProduceQualityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of produce, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description or name of the produce being analyzed.'),
});
export type DiagnoseProduceQualityInput = z.infer<typeof DiagnoseProduceQualityInputSchema>;

const DiagnoseProduceQualityOutputSchema = z.object({
  produceIdentification: z.object({
    isProduce: z.boolean().describe('Whether or not the image contains produce.'),
    produceName: z.string().describe('The common name of the identified produce (e.g., "Avocado", "Rose").'),
    confidence: z.number().describe('A confidence score from 0.0 to 1.0 on the produce identification.'),
  }),
  qualityAssessment: z.object({
    isEdible: z.boolean().describe('Whether the produce is considered safe and suitable for consumption.'),
    qualityScore: z.number().describe('A quality score from 0 (poor) to 100 (excellent).'),
    ripeness: z.string().describe('A descriptive assessment of ripeness (e.g., "Underripe", "Perfectly Ripe", "Overripe").'),
    freshness: z.string().describe('A descriptive assessment of freshness (e.g., "Very Fresh", "Slightly Withered", "Spoiled").'),
    damage: z.string().describe('A description of any visible damage, bruising, or defects.'),
    overallAssessment: z.string().describe("A concise, one-sentence overall assessment of the produce's quality."),
  }),
});
export type DiagnoseProduceQualityOutput = z.infer<typeof DiagnoseProduceQualityOutputSchema>;

export async function diagnoseProduceQuality(input: DiagnoseProduceQualityInput): Promise<DiagnoseProduceQualityOutput> {
  return diagnoseProduceQualityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseProduceQualityPrompt',
  input: { schema: DiagnoseProduceQualityInputSchema },
  output: { schema: DiagnoseProduceQualityOutputSchema },
  prompt: `You are an expert agronomist for a fresh produce export company called FreshTrace. Your task is to analyze an image of produce and provide a detailed quality assessment.

  Use the provided image and description to perform the analysis.

  1.  **Identify the Produce**: First, determine if the image contains produce. If it does, identify its common name. Provide a confidence score for your identification.
  2.  **Assess Quality**: Evaluate the produce based on the following criteria:
      *   **Ripeness**: Is it underripe, ripe, or overripe?
      *   **Freshness**: How fresh does it appear? Look for signs of wilting or dehydration.
      *   **Damage**: Are there any bruises, cuts, blemishes, or signs of disease/pests?
      *   **Edibility**: Based on your assessment, is it suitable for consumption?
  3.  **Score and Summarize**: Provide a quality score out of 100 and a final, one-sentence overall assessment.

  Description of Produce: {{{description}}}
  Photo: {{media url=photoDataUri}}`,
});

const diagnoseProduceQualityFlow = ai.defineFlow(
  {
    name: 'diagnoseProduceQualityFlow',
    inputSchema: DiagnoseProduceQualityInputSchema,
    outputSchema: DiagnoseProduceQualityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

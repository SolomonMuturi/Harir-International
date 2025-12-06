'use server';
/**
 * @fileOverview A utility to calculate the estimated labor cost for processing a shipment using a rule-based system.
 *
 * - calculateShipmentLaborCost - A function that estimates labor cost.
 * - CalculateShipmentLaborCostInput - The input type for the function.
 * - CalculateShipmentLaborCostOutput - The return type for the function.
 */

import { z } from 'zod';

const CalculateShipmentLaborCostInputSchema = z.object({
  product: z.string().describe('The type of product in the shipment (e.g., "Roses", "Hass Avocados").'),
  weightKg: z.number().describe('The total weight of the shipment in kilograms.'),
});
export type CalculateShipmentLaborCostInput = z.infer<typeof CalculateShipmentLaborCostInputSchema>;

const CalculateShipmentLaborCostOutputSchema = z.object({
  estimatedHours: z.number().describe('The estimated total labor hours required to process the shipment.'),
  estimatedCost: z.number().describe('The total estimated labor cost in KES, calculated from the estimated hours and an average wage.'),
  breakdown: z.array(z.object({
    stage: z.string().describe('The processing stage (e.g., Unloading, Quality Control, Sorting, Packing).'),
    hours: z.number().describe('Estimated hours for this stage.'),
  })).describe('A breakdown of estimated hours per processing stage.'),
});
export type CalculateShipmentLaborCostOutput = z.infer<typeof CalculateShipmentLaborCostOutputSchema>;

// --- Manual Calculation Logic ---
const AVERAGE_WAGE_PER_HOUR_KES = 250;

// Processing time in hours per 100kg
const PROCESSING_RATES = {
  'flowers': 1.5, // Flowers are delicate and take longer
  'berries': 1.2, // Berries require careful handling
  'avocados': 0.8, // Avocados are relatively robust
  'vegetables': 1.0,
  'default': 0.9,
};

const STAGE_BREAKDOWN_PERCENTAGES = {
  'Unloading': 0.20,
  'Quality Control': 0.35,
  'Sorting & Grading': 0.25,
  'Packing & Labeling': 0.20,
};

function getProductCategory(product: string): keyof typeof PROCESSING_RATES {
    const lowerProduct = product.toLowerCase();
    if (lowerProduct.includes('rose') || lowerProduct.includes('flower') || lowerProduct.includes('carnation')) return 'flowers';
    if (lowerProduct.includes('berry') || lowerProduct.includes('strawberry')) return 'berries';
    if (lowerProduct.includes('avocado')) return 'avocados';
    if (lowerProduct.includes('bean') || lowerProduct.includes('tomato') || lowerProduct.includes('lettuce')) return 'vegetables';
    return 'default';
}

export async function calculateShipmentLaborCost(input: CalculateShipmentLaborCostInput): Promise<CalculateShipmentLaborCostOutput> {
  const { product, weightKg } = input;

  const category = getProductCategory(product);
  const ratePer100Kg = PROCESSING_RATES[category];
  
  const estimatedHours = (weightKg / 100) * ratePer100Kg;
  const estimatedCost = estimatedHours * AVERAGE_WAGE_PER_HOUR_KES;

  const breakdown = Object.entries(STAGE_BREAKDOWN_PERCENTAGES).map(([stage, percentage]) => ({
    stage,
    hours: estimatedHours * percentage,
  }));

  const result: CalculateShipmentLaborCostOutput = {
    estimatedHours,
    estimatedCost,
    breakdown,
  };

  // Ensure the output matches the Zod schema
  return CalculateShipmentLaborCostOutputSchema.parse(result);
}

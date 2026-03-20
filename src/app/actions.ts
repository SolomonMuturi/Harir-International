
'use server';

import { explainAnomaly, type ExplainAnomalyInput, type ExplainAnomalyOutput } from '@/ai/flows/explain-anomaly-detection';
import { diagnoseProduceQuality, type DiagnoseProduceQualityInput, type DiagnoseProduceQualityOutput } from '@/ai/flows/diagnose-produce-quality';
import { explainEnergySpike } from '@/ai/flows/explain-energy-spike';
import { calculateShipmentLaborCost, type CalculateShipmentLaborCostInput, type CalculateShipmentLaborCostOutput } from '@/ai/flows/calculate-shipment-labor-cost';
import { explainWaterAnomaly } from '@/ai/flows/explain-water-anomaly';


export async function getAnomalyExplanation(
  input: ExplainAnomalyInput
): Promise<ExplainAnomalyOutput> {
  try {
    const explanation = await explainAnomaly(input);
    return explanation;
  } catch (error) {
    console.error('Error getting anomaly explanation:', error);
    return { 
      explanation: 'An error occurred while generating the explanation. Please try again.',
      suggestedAction: 'Check the system logs for more details or retry the request.'
    };
  }
}

export async function getProduceQualityDiagnosis(
  input: DiagnoseProduceQualityInput
): Promise<DiagnoseProduceQualityOutput> {
  try {
    const diagnosis = await diagnoseProduceQuality(input);
    return diagnosis;
  } catch (error) {
    console.error('Error getting produce quality diagnosis:', error);
    // Provide a structured error response that matches the expected output schema
    return {
      produceIdentification: {
        isProduce: false,
        produceName: 'Error',
        confidence: 0,
      },
      qualityAssessment: {
        isEdible: false,
        qualityScore: 0,
        ripeness: 'Unknown',
        freshness: 'Unknown',
        damage: 'Unknown',
        overallAssessment: 'An error occurred while analyzing the produce quality. Please try again or check the system logs.',
      },
    };
  }
}

export async function getShipmentLaborCost(
  input: CalculateShipmentLaborCostInput
): Promise<CalculateShipmentLaborCostOutput> {
  try {
    const cost = await calculateShipmentLaborCost(input);
    return cost;
  } catch (error) {
    console.error('Error getting shipment labor cost:', error);
    return {
      estimatedHours: 0,
      estimatedCost: 0,
      breakdown: [{ stage: 'Error', hours: 0 }],
    };
  }
}

export { explainEnergySpike, explainWaterAnomaly };


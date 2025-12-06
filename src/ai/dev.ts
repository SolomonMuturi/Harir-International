
import { config } from 'dotenv';
config();

import '@/ai/flows/explain-anomaly-detection.ts';
import '@/ai/flows/diagnose-produce-quality.ts';
import '@/ai/flows/explain-energy-spike.ts';
import '@/ai/flows/calculate-shipment-labor-cost.ts';
import '@/ai/flows/explain-water-anomaly.ts';


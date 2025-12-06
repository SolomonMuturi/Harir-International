'use client';

import {
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Button } from '../ui/button';

interface OperationalComplianceChartProps {
  data: { category: string; score: number }[];
  onViewBreakdown?: () => void;
}

const chartConfig: ChartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--chart-1))',
  },
};

export function OperationalComplianceChart({
  data,
  onViewBreakdown,
}: OperationalComplianceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Compliance Score</CardTitle>
        <CardDescription>
          An overview of adherence to operational standards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer>
            <RadarChart data={data}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <PolarAngleAxis dataKey="category" />
              <PolarGrid />
              <Radar
                dataKey="score"
                fill="var(--color-score)"
                fillOpacity={0.6}
                stroke="var(--color-score)"
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      {onViewBreakdown && (
        <CardFooter>
          <Button onClick={onViewBreakdown} variant="outline" className="w-full">
            View Detailed Breakdown
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}


'use client';

import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Factory } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

interface WaterBreakdownChartProps {
  data: {
    area: string;
    consumption: number;
    fill: string;
  }[];
}

const chartConfig: ChartConfig = {
  consumption: {
    label: 'Consumption (m³)',
  },
  'Packing Line': { label: 'Packing Line', color: 'hsl(var(--chart-1))' },
  'Cold Rooms': { label: 'Cold Rooms', color: 'hsl(var(--chart-2))' },
  'Cleaning': { label: 'Cleaning', color: 'hsl(var(--chart-3))' },
  'Domestic': { label: 'Domestic', color: 'hsl(var(--chart-4))' },
  'Irrigation': { label: 'Irrigation', color: 'hsl(var(--chart-5))' },
};

export function WaterBreakdownChart({ data }: WaterBreakdownChartProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Factory className='w-5 h-5 text-primary'/>
            Consumption by Area
        </CardTitle>
        <CardDescription>
          Breakdown of water consumption by operational area.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full max-h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="consumption"
                nameKey="area"
                innerRadius={60}
                strokeWidth={5}
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.area}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="area" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="mt-auto pt-4">
        <Button asChild variant="outline" className="w-full">
            <Link href="/analytics">View Breakdown</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
export default WaterBreakdownChart;


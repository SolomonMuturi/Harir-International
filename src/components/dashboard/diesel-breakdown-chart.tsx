
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

interface DieselBreakdownChartProps {
  data: {
    name: string;
    value: number;
    fill: string;
  }[];
}

const chartConfig: ChartConfig = {
  value: {
    label: '%',
  },
  Fleet: { label: 'Fleet', color: 'hsl(var(--chart-1))' },
  Generators: { label: 'Generators', color: 'hsl(var(--chart-2))' },
};

export function DieselBreakdownChart({ data }: DieselBreakdownChartProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Factory className='w-5 h-5 text-primary'/>
            Diesel Consumption Breakdown
        </CardTitle>
        <CardDescription>
          Breakdown of diesel usage between fleet and generators.
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
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
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

export default DieselBreakdownChart;

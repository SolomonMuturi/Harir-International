'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

interface ShipmentVolumeChartProps {
  data: {
    month: string;
    shipped: number;
    delivered: number;
  }[];
}

const chartConfig: ChartConfig = {
  shipped: {
    label: 'Shipped',
    color: 'hsl(var(--chart-1))',
  },
  delivered: {
    label: 'Delivered',
    color: 'hsl(var(--chart-2))',
  },
};

export function ShipmentVolumeChart({ data }: ShipmentVolumeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Volume</CardTitle>
        <CardDescription>Monthly shipped vs. delivered volume.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="shipped" fill="var(--color-shipped)" radius={4} />
              <Bar dataKey="delivered" fill="var(--color-delivered)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

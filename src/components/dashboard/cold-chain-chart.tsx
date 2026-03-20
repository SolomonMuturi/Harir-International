'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
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

interface ColdChainChartProps {
  data: {
    time: string;
    temperature: number;
    humidity: number;
  }[];
}

const chartConfig: ChartConfig = {
  temperature: {
    label: 'Temperature',
    color: 'hsl(var(--chart-1))',
  },
  humidity: {
    label: 'Humidity',
    color: 'hsl(var(--chart-2))',
  },
};

export function ColdChainChart({ data }: ColdChainChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cold Chain Monitoring</CardTitle>
        <CardDescription>
          Real-time temperature and humidity tracking for active shipments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis
                dataKey="time"
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
                tickFormatter={(value) => `${value}°C`}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Legend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="var(--color-temperature)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="var(--color-humidity)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

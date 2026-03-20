
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
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
import { Clock } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

interface DwellTimeRiskChartProps {
  data: {
    location: string;
    product: string;
    dwellTime: number;
  }[];
}

const chartConfig: ChartConfig = {
  dwellTime: {
    label: 'Dwell Time (minutes)',
    color: 'hsl(var(--chart-2))',
  },
};

export function DwellTimeRiskChart({ data }: DwellTimeRiskChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Clock />
            Dwell Time Risk
        </CardTitle>
        <CardDescription>Top 5 locations by item dwell time.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} min`}
              />
              <YAxis
                dataKey="location"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="dwellTime" fill="var(--color-dwellTime)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
            <Link href="/cold-room">View Detailed Breakdown</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

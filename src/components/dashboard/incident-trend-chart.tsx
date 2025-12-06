
'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
import Link from 'next/link';

const chartConfig: ChartConfig = {
  incidents: {
    label: 'Incidents',
    color: 'hsl(var(--chart-1))',
  },
};

interface IncidentTrendChartProps {
  data: { month: string; incidents: number }[];
}

export function IncidentTrendChart({ data }: IncidentTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Trend Analysis</CardTitle>
        <CardDescription>
          Monthly incident volume over the last 6 months.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 300]}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
                <linearGradient id="fillIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-incidents)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-incidents)" stopOpacity={0.1} />
                </linearGradient>
            </defs>
            <Area
              dataKey="incidents"
              type="natural"
              fill="url(#fillIncidents)"
              stroke="var(--color-incidents)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
            <Link href="/analytics">View Detailed Breakdown</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

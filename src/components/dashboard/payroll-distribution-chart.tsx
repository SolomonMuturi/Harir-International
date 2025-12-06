'use client';

import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

interface PayrollDistributionChartProps {
  data: {
    role: string;
    value: number;
    fill: string;
  }[];
}

const chartConfig: ChartConfig = {
  value: {
    label: 'KES',
  },
  Admin: { label: 'Admin', color: 'hsl(var(--chart-1))' },
  Manager: { label: 'Manager', color: 'hsl(var(--chart-2))' },
  Driver: { label: 'Driver', color: 'hsl(var(--chart-3))' },
  Warehouse: { label: 'Warehouse', color: 'hsl(var(--chart-4))' },
  Security: { label: 'Security', color: 'hsl(var(--chart-5))' },
};

export function PayrollDistributionChart({ data }: PayrollDistributionChartProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Payroll by Role</CardTitle>
        <CardDescription>
          Distribution of total gross salary by employee role.
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
                nameKey="role"
                innerRadius={60}
                strokeWidth={5}
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.role}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="role" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

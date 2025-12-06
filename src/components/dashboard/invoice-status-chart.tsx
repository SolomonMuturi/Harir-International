'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from 'recharts';
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
import { Receipt } from 'lucide-react';

interface InvoiceStatusChartProps {
  data: {
    status: string;
    count: number;
    fill: string;
  }[];
}

const chartConfig: ChartConfig = {
  count: {
    label: 'Invoices',
  },
  Paid: {
    label: 'Paid',
    color: 'hsl(var(--chart-1))',
  },
  Pending: {
    label: 'Pending',
    color: 'hsl(var(--chart-4))',
  },
  Overdue: {
    label: 'Overdue',
    color: 'hsl(var(--chart-5))',
  },
};

export function InvoiceStatusChart({ data }: InvoiceStatusChartProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Receipt className='w-5 h-5 text-primary'/>
            Invoice Status
        </CardTitle>
        <CardDescription>
          Current breakdown of invoice statuses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full max-h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

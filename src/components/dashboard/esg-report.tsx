
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Cell } from 'recharts';
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
import { Separator } from '@/components/ui/separator';
import { Leaf, Users, Shield } from 'lucide-react';

const carbonFootprintData = [
  { month: 'Feb', emissions: 120 }, { month: 'Mar', emissions: 110 },
  { month: 'Apr', emissions: 115 }, { month: 'May', emissions: 105 },
  { month: 'Jun', emissions: 100 }, { month: 'Jul', emissions: 95 },
];

const waterIntensityData = [
  { month: 'Feb', intensity: 0.5 }, { month: 'Mar', intensity: 0.48 },
  { month: 'Apr', intensity: 0.51 }, { month: 'May', intensity: 0.45 },
  { month: 'Jun', intensity: 0.42 }, { month: 'Jul', intensity: 0.4 },
];

const wasteRecyclingData = [
  { name: 'Recycled', value: 75, fill: 'hsl(var(--chart-1))' },
  { name: 'Landfill', value: 25, fill: 'hsl(var(--chart-5))' },
];

const workforceDiversityData = [
  { name: 'Female', value: 45, fill: 'hsl(var(--chart-2))' },
  { name: 'Male', value: 55, fill: 'hsl(var(--chart-4))' },
];

const safetyIncidentData = [
    { month: "Feb", rate: 0.8 }, { month: "Mar", rate: 0.5 },
    { month: "Apr", rate: 0.9 }, { month: "May", rate: 0.6 },
    { month: "Jun", rate: 1.1 }, { month: "Jul", rate: 0.4 },
];

const governanceData = [
    { name: 'Compliance Training', score: 95 },
    { name: 'Ethical Code Adherence', score: 98 },
    { name: 'Board Independence', score: 75 },
    { name: 'Data Privacy', score: 92 },
];


export function EsgReport() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>ESG Report Details</CardTitle>
                <CardDescription>A detailed breakdown of key ESG performance indicators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Environmental Section */}
                <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <Leaf className="text-green-500" />
                        Environmental
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <ChartCard title="Carbon Footprint (tCO2e)" data={carbonFootprintData} dataKey="emissions" />
                        <ChartCard title="Water Usage Intensity (m³/tonne)" data={waterIntensityData} dataKey="intensity" />
                        <PieChartCard title="Waste Recycling Rate" data={wasteRecyclingData} />
                    </div>
                </section>

                <Separator />

                {/* Social Section */}
                 <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <Users className="text-blue-500" />
                        Social
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <PieChartCard title="Workforce Diversity" data={workforceDiversityData} />
                         <ChartCard title="Safety Incident Rate (per 1000 hrs)" data={safetyIncidentData} dataKey="rate" />
                         <InfoCard title="Employee Training Hours" value="1,200" description="Total hours this year" />
                    </div>
                </section>

                <Separator />

                {/* Governance Section */}
                 <section>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <Shield className="text-indigo-500" />
                        Governance
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <ChartCard title="Compliance & Ethics Scores" data={governanceData} dataKey="score" yAxisKey="name" />
                         <InfoCard title="Board Independence" value="75%" description="Independent board members" />
                         <InfoCard title="Policies Updated" value="4" description="Policies updated this quarter" />
                    </div>
                </section>

            </CardContent>
        </Card>
    );
}

const ChartCard = ({ title, data, dataKey, yAxisKey = 'month' }: { title: string, data: any[], dataKey: string, yAxisKey?: string }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <ChartContainer config={{ [dataKey]: { label: title, color: 'hsl(var(--chart-1))' } }} className="h-48 w-full">
                 <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: -10 }}>
                        <XAxis dataKey={yAxisKey} tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={4} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
    </Card>
);

const PieChartCard = ({ title, data }: { title: string, data: any[] }) => {
  const chartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full max-h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} strokeWidth={2}>
                {data.map((entry) => (<Cell key={entry.name} fill={entry.fill} />))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} className="text-xs" />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

const InfoCard = ({ title, value, description }: { title: string, value: string, description: string }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-4xl font-bold">{value}</p>
        </CardContent>
    </Card>
);

'use client';

import { useState, useEffect } from 'react';
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
import { Truck, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Define the data structure from API
interface CarrierPerformanceData {
  carrier: string;
  total: number;
  onTime: number;
  delayed: number;
  inTransit: number;
  other: number;
  onTimePercentage: number;
  delayedPercentage: number;
  performanceScore: number;
}

interface CarrierPerformanceProps {
  initialData?: CarrierPerformanceData[];
  showFilters?: boolean;
}

const chartConfig: ChartConfig = {
  onTime: {
    label: 'On-Time',
    color: 'hsl(var(--chart-1))',
  },
  delayed: {
    label: 'Delayed',
    color: 'hsl(var(--chart-5))',
  },
};

export function CarrierPerformanceChart({ 
  initialData = [], 
  showFilters = true 
}: CarrierPerformanceProps) {
  const [data, setData] = useState<CarrierPerformanceData[]>(initialData);
  const [loading, setLoading] = useState(!initialData.length);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('fromDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('toDate', dateRange.to.toISOString());
      }
      
      const response = await fetch(`/api/carriers/performance?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch performance data');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform data for chart
        const chartData = result.data.map((carrier: CarrierPerformanceData) => ({
          carrier: carrier.carrier,
          onTime: carrier.onTime,
          delayed: carrier.delayed,
          inTransit: carrier.inTransit,
          other: carrier.other,
          onTimePercentage: carrier.onTimePercentage,
          delayedPercentage: carrier.delayedPercentage,
          performanceScore: carrier.performanceScore
        }));
        
        setData(chartData);
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (err: any) {
      console.error('Error fetching carrier performance:', err);
      setError(err.message || 'Failed to load performance data');
      // Fallback to empty data
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData.length) {
      fetchPerformanceData();
    }
  }, []);

  // Prepare data for stacked bar chart
  const chartData = data.map(carrier => ({
    name: carrier.carrier,
    onTime: carrier.onTime,
    delayed: carrier.delayed,
    total: carrier.total,
    performanceScore: carrier.performanceScore
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Truck className='w-5 h-5 text-primary' />
              Carrier Performance
            </CardTitle>
            <CardDescription>On-time vs. delayed deliveries by carrier</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {showFilters && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPerformanceData}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading carrier performance data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <p className="text-destructive mb-2">Error: {error}</p>
              <Button variant="outline" onClick={fetchPerformanceData}>
                Try Again
              </Button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No carrier performance data available</p>
              <p className="text-sm text-muted-foreground">
                No shipments have been assigned to carriers yet
              </p>
            </div>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `${value}`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const total = data.onTime + data.delayed;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <div className="text-sm mt-2 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-chart-1">On-Time:</span>
                                <span className="font-medium">{data.onTime} ({total > 0 ? ((data.onTime / total) * 100).toFixed(0) : 0}%)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-chart-5">Delayed:</span>
                                <span className="font-medium">{data.delayed} ({total > 0 ? ((data.delayed / total) * 100).toFixed(0) : 0}%)</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Shipments:</span>
                                <span className="font-medium">{total}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Performance Score:</span>
                                <span className="font-medium">{data.performanceScore.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    content={({ payload }) => (
                      <div className="flex justify-center gap-4 mt-4">
                        {payload?.map((entry, index) => (
                          <div key={`legend-${index}`} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-sm" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <Bar 
                    dataKey="onTime" 
                    stackId="a" 
                    fill="var(--color-onTime)" 
                    radius={[0, 4, 4, 0]} 
                    name="On-Time Deliveries"
                  />
                  <Bar 
                    dataKey="delayed" 
                    stackId="a" 
                    fill="var(--color-delayed)" 
                    radius={[4, 0, 0, 4]} 
                    name="Delayed Deliveries"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            {/* Performance Summary */}
            {data.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Top Performer</p>
                  <p className="text-xl font-bold">{data[0]?.carrier}</p>
                  <p className="text-sm">Score: {data[0]?.performanceScore.toFixed(1)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Avg On-Time Rate</p>
                  <p className="text-xl font-bold">
                    {(data.reduce((sum, carrier) => sum + carrier.onTimePercentage, 0) / data.length).toFixed(1)}%
                  </p>
                  <p className="text-sm">Across {data.length} carriers</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Shipments Tracked</p>
                  <p className="text-xl font-bold">
                    {data.reduce((sum, carrier) => sum + carrier.total, 0)}
                  </p>
                  <p className="text-sm">With carrier assignments</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
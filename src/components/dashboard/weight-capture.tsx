'use client';

import { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import WeightCapture from '@/components/dashboard/weight-capture';
import { FinalTagDialog } from '@/components/dashboard/final-tag-dialog';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Scale, Boxes, GitCompareArrows, Loader2, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import type { WeightEntry } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define API response types
interface WeightEntryAPI {
  id: string;
  palletId: string;
  product: string;
  weight: number;
  unit: 'kg' | 'lb';
  timestamp: string;
  supplier: string;
  truckId: string;
  driverId: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight: number;
  declaredWeight?: number;
  rejectedWeight?: number;
  created_at: string;
}

interface KPIData {
  palletsWeighed: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
  totalWeight: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
  discrepancyRate: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
  };
}

const getChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral') => {
  switch (changeType) {
    case 'increase':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'decrease':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-600" />;
  }
};

export default function WeightCapturePage() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [lastWeightEntry, setLastWeightEntry] = useState<WeightEntry | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch weight entries from database
  const fetchWeights = async () => {
    try {
      setError(null);
      const response = await fetch('/api/weights?limit=50&order=desc');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weights: ${response.statusText}`);
      }
      
      const data: WeightEntryAPI[] = await response.json();
      
      // Transform to match WeightEntry type from your data file
      const transformedWeights: WeightEntry[] = data.map(entry => ({
        id: entry.id,
        palletId: entry.palletId,
        product: entry.product,
        weight: entry.netWeight,
        unit: entry.unit,
        timestamp: entry.timestamp,
        supplier: entry.supplier,
        truckId: entry.truckId,
        driverId: entry.driverId,
        grossWeight: entry.grossWeight,
        tareWeight: entry.tareWeight,
        netWeight: entry.netWeight,
        declaredWeight: entry.declaredWeight,
        rejectedWeight: entry.rejectedWeight,
      }));
      
      setWeights(transformedWeights);
    } catch (error: any) {
      console.error('Error fetching weights:', error);
      setError(error.message || 'Failed to load weight data');
      // Use mock data for demo
      const mockWeights: WeightEntry[] = [
        {
          id: '1',
          palletId: 'PAL-001',
          product: 'Apples',
          weight: 500,
          unit: 'kg',
          timestamp: new Date().toISOString(),
          supplier: 'Fresh Farms Inc.',
          truckId: 'TRK-001',
          driverId: 'DRV-001',
          grossWeight: 520,
          tareWeight: 20,
          netWeight: 500,
          declaredWeight: 500,
          rejectedWeight: 0,
        },
        {
          id: '2',
          palletId: 'PAL-002',
          product: 'Bananas',
          weight: 450,
          unit: 'kg',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          supplier: 'Tropical Harvest',
          truckId: 'TRK-002',
          driverId: 'DRV-002',
          grossWeight: 470,
          tareWeight: 20,
          netWeight: 450,
          declaredWeight: 455,
          rejectedWeight: 0,
        },
        {
          id: '3',
          palletId: 'PAL-003',
          product: 'Oranges',
          weight: 480,
          unit: 'kg',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          supplier: 'Citrus Grove',
          truckId: 'TRK-003',
          driverId: 'DRV-003',
          grossWeight: 500,
          tareWeight: 20,
          netWeight: 480,
          declaredWeight: 480,
          rejectedWeight: 5,
        },
      ];
      setWeights(mockWeights);
    }
  };

  // Fetch KPI data
  const fetchKpiData = async () => {
    try {
      const response = await fetch('/api/weights/kpi');
      
      if (!response.ok) {
        throw new Error('Failed to fetch KPI data');
      }
      
      const data = await response.json();
      
      setKpiData({
        palletsWeighed: {
          title: 'Pallets Weighed Today',
          value: data.todayCount.toString(),
          change: data.changeSinceLastHour >= 0 ? 
            `+${data.changeSinceLastHour} since last hour` : 
            `${data.changeSinceLastHour} since last hour`,
          changeType: data.changeSinceLastHour >= 0 ? 'increase' : 'decrease',
        },
        totalWeight: {
          title: 'Total Weight Today',
          value: `${(data.totalWeightToday / 1000).toFixed(1)} t`,
          change: 'across all entries',
          changeType: 'increase',
        },
        discrepancyRate: {
          title: 'Discrepancy Rate',
          value: `${data.discrepancyRate.toFixed(1)}%`,
          change: 'net vs. declared weight',
          changeType: data.discrepancyRate > 5 ? 'increase' : 'decrease',
        },
      });
    } catch (error: any) {
      console.error('Error fetching KPI data:', error);
      // Set default KPI data
      setKpiData({
        palletsWeighed: {
          title: 'Pallets Weighed Today',
          value: '3',
          change: '+2 since last hour',
          changeType: 'increase',
        },
        totalWeight: {
          title: 'Total Weight Today',
          value: '1.43 t',
          change: 'across 3 entries',
          changeType: 'increase',
        },
        discrepancyRate: {
          title: 'Discrepancy Rate',
          value: '0.8%',
          change: 'within tolerance',
          changeType: 'decrease',
        },
      });
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchWeights(), fetchKpiData()]);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Function to refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchWeights(), fetchKpiData()]);
    setIsRefreshing(false);
  };

  const handleAddWeight = async (newWeight: Omit<WeightEntry, 'id' | 'timestamp'>) => {
    try {
      setError(null);
      const response = await fetch('/api/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          palletId: newWeight.palletId,
          product: newWeight.product,
          weight: newWeight.netWeight,
          unit: newWeight.unit || 'kg',
          netWeight: newWeight.netWeight,
          grossWeight: newWeight.grossWeight || newWeight.netWeight,
          tareWeight: newWeight.tareWeight || 0,
          declaredWeight: newWeight.declaredWeight || newWeight.netWeight,
          rejectedWeight: newWeight.rejectedWeight || 0,
          supplier: newWeight.supplier || '',
          truckId: newWeight.truckId || '',
          driverId: newWeight.driverId || '',
          timestamp: new Date(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save weight');
      }

      const savedEntry: WeightEntryAPI = await response.json();
      
      // Transform saved entry to match WeightEntry type
      const transformedEntry: WeightEntry = {
        id: savedEntry.id,
        palletId: savedEntry.palletId,
        product: savedEntry.product,
        weight: savedEntry.netWeight,
        unit: savedEntry.unit,
        timestamp: savedEntry.timestamp,
        supplier: savedEntry.supplier,
        truckId: savedEntry.truckId,
        driverId: savedEntry.driverId,
        grossWeight: savedEntry.grossWeight,
        tareWeight: savedEntry.tareWeight,
        netWeight: savedEntry.netWeight,
        declaredWeight: savedEntry.declaredWeight,
        rejectedWeight: savedEntry.rejectedWeight,
      };
      
      // Update local state
      setWeights(prev => [transformedEntry, ...prev]);
      setLastWeightEntry(transformedEntry);
      setIsReceiptOpen(true);
      
      // Refresh KPI data after adding new weight
      await fetchKpiData();
      
    } catch (error: any) {
      console.error('Error adding weight:', error);
      setError(error.message || 'Failed to save weight entry');
      
      // Fallback: add to local state even if API fails
      const fallbackEntry: WeightEntry = {
        id: `weight-${Date.now()}`,
        palletId: newWeight.palletId,
        product: newWeight.product,
        weight: newWeight.netWeight,
        unit: newWeight.unit || 'kg',
        timestamp: new Date().toISOString(),
        supplier: newWeight.supplier || '',
        truckId: newWeight.truckId || '',
        driverId: newWeight.driverId || '',
        grossWeight: newWeight.grossWeight || newWeight.netWeight,
        tareWeight: newWeight.tareWeight || 0,
        netWeight: newWeight.netWeight,
        declaredWeight: newWeight.declaredWeight || newWeight.netWeight,
        rejectedWeight: newWeight.rejectedWeight || 0,
      };
      
      setWeights(prev => [fallbackEntry, ...prev]);
      setLastWeightEntry(fallbackEntry);
      setIsReceiptOpen(true);
    }
  };

  const handleReprint = (entry: WeightEntry) => {
    setLastWeightEntry(entry);
    setIsReceiptOpen(true);
  };

  // Default KPI data while loading
  const defaultKpiData: KPIData = {
    palletsWeighed: {
      title: 'Pallets Weighed Today',
      value: isLoading ? '...' : '0',
      change: isLoading ? 'Loading...' : 'No data',
      changeType: 'neutral',
    },
    totalWeight: {
      title: 'Total Weight Today',
      value: isLoading ? '...' : '0 t',
      change: isLoading ? 'Loading...' : 'No data',
      changeType: 'neutral',
    },
    discrepancyRate: {
      title: 'Discrepancy Rate',
      value: isLoading ? '...' : '0%',
      change: isLoading ? 'Loading...' : 'No data',
      changeType: 'neutral',
    },
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 p-4 bg-sidebar-background/50">
            <FreshViewLogo className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                FreshTrace
              </h1>
              <p className="text-xs text-sidebar-foreground/70">Weight Station</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 md:p-6 lg:p-8 bg-gradient-to-b from-background to-muted/20 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Weight Capture Station
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Record pallet weights, monitor shipments, and track discrepancies in real-time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={refreshData}
                    disabled={isRefreshing || isLoading}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/20 hover:border-primary/40"
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Badge variant="outline" className="px-3 py-1 border-primary/20">
                    <Scale className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                      <Boxes className="w-4 h-4" />
                      Total Pallets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{weights.length}</div>
                    <p className="text-xs text-blue-700 mt-1">Processed today</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      Total Weight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {(weights.reduce((sum, w) => sum + w.netWeight, 0) / 1000).toFixed(2)} t
                    </div>
                    <p className="text-xs text-green-700 mt-1">Across all shipments</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
                      <GitCompareArrows className="w-4 h-4" />
                      Avg. Discrepancy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-900">0.8%</div>
                    <p className="text-xs text-amber-700 mt-1">Within tolerance</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 animate-in slide-in-from-top duration-300">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">{error}</p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Using demo data. Check your API configuration.
                      </p>
                    </div>
                    <Button
                      onClick={() => setError(null)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Boxes className="w-4 h-4 mr-2" />
                  Dashboard Overview
                </TabsTrigger>
                <TabsTrigger value="capture" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Scale className="w-4 h-4 mr-2" />
                  Weight Capture
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(kpiData || defaultKpiData).map(([key, data]) => (
                    <Card key={key} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors hover:shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {key === 'palletsWeighed' && <Boxes className="w-4 h-4" />}
                            {key === 'totalWeight' && <Scale className="w-4 h-4" />}
                            {key === 'discrepancyRate' && <GitCompareArrows className="w-4 h-4" />}
                            {data.title}
                          </span>
                          {getChangeIcon(data.changeType)}
                        </CardTitle>
                        <CardDescription className="text-xs">{data.change}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{data.value}</div>
                        <div className={`text-xs mt-2 flex items-center gap-1 ${
                          data.changeType === 'increase' ? 'text-green-600' :
                          data.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {data.changeType === 'increase' && <TrendingUp className="w-3 h-3" />}
                          {data.changeType === 'decrease' && <TrendingDown className="w-3 h-3" />}
                          {data.changeType === 'neutral' && <Minus className="w-3 h-3" />}
                          {data.change}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Recent Activity
                      </span>
                      <Badge variant="secondary">{weights.length} entries</Badge>
                    </CardTitle>
                    <CardDescription>
                      Latest weight entries from today
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {weights.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Scale className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{entry.palletId}</span>
                                <Badge variant="outline" className="text-xs">
                                  {entry.product}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {entry.supplier} • {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{entry.netWeight} {entry.unit}</div>
                            {entry.declaredWeight && Math.abs(entry.netWeight - entry.declaredWeight) > 1 && (
                              <div className={`text-xs ${entry.netWeight > entry.declaredWeight ? 'text-red-600' : 'text-green-600'}`}>
                                {entry.netWeight > entry.declaredWeight ? '+' : ''}{(entry.netWeight - entry.declaredWeight).toFixed(1)} {entry.unit}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Weight Capture Tab */}
              <TabsContent value="capture" className="animate-in fade-in duration-300">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scale className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Weight Capture Interface</h2>
                        <CardDescription>
                          Add new weight entries and manage existing records
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="h-96 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 flex flex-col items-center justify-center">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 animate-spin text-primary/60" />
                          <Scale className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="mt-4 text-lg font-medium">Loading weight data...</p>
                        <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch the latest entries</p>
                      </div>
                    ) : (
                      <WeightCapture 
                        weights={weights}
                        onAddWeight={handleAddWeight}
                        onReprint={handleReprint}
                        isLoading={isLoading}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        {lastWeightEntry && (
          <FinalTagDialog
            isOpen={isReceiptOpen}
            onOpenChange={setIsReceiptOpen}
            weightEntry={lastWeightEntry}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
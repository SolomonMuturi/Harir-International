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
// THIS IS CORRECT in the PAGE file:
import WeightCapture from '@/components/dashboard/weight-capture';
import { FinalTagDialog } from '@/components/dashboard/final-tag-dialog';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Scale, Boxes, GitCompareArrows, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Define types based on your schema
interface WeightEntry {
  id: string;
  pallet_id: string | null;
  product: string | null;
  weight: number | null;
  unit: 'kg' | 'lb';
  timestamp: string | null;
  supplier: string | null;
  truck_id: string | null;
  driver_id: string | null;
  gross_weight: number | null;
  tare_weight: number | null;
  net_weight: number | null;
  declared_weight: number | null;
  rejected_weight: number | null;
  created_at: string;
}

interface NewWeightEntry {
  pallet_id: string;
  product: string;
  net_weight: number;
  unit?: 'kg';
  gross_weight?: number;
  tare_weight?: number;
  declared_weight?: number;
  rejected_weight?: number;
  supplier?: string;
  truck_id?: string;
  driver_id?: string;
  timestamp?: Date;
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

interface WeightEntryAPI {
  id: string;
  pallet_id: string | null;
  product: string | null;
  weight: number | null;
  unit: 'kg' | 'lb';
  timestamp: string | null;
  supplier: string | null;
  truck_id: string | null;
  driver_id: string | null;
  gross_weight: number | null;
  tare_weight: number | null;
  net_weight: number | null;
  declared_weight: number | null;
  rejected_weight: number | null;
  created_at: string;
}

interface KPIApiResponse {
  todayCount: number;
  changeSinceLastHour: number;
  totalWeightToday: number;
  discrepancyRate: number;
}

export default function WeightCapturePage() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [lastWeightEntry, setLastWeightEntry] = useState<WeightEntry | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch weight entries from database
  const fetchWeights = async () => {
    try {
      setError(null);
      const response = await fetch('/api/weights?limit=50&order=desc');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weights: ${response.statusText}`);
      }
      
      const data: WeightEntryAPI[] = await response.json();
      
      // Transform to match WeightEntry type
      const transformedWeights: WeightEntry[] = data.map(entry => ({
        id: entry.id,
        pallet_id: entry.pallet_id,
        product: entry.product,
        weight: entry.weight,
        unit: entry.unit,
        timestamp: entry.timestamp,
        supplier: entry.supplier,
        truck_id: entry.truck_id,
        driver_id: entry.driver_id,
        gross_weight: entry.gross_weight,
        tare_weight: entry.tare_weight,
        net_weight: entry.net_weight,
        declared_weight: entry.declared_weight,
        rejected_weight: entry.rejected_weight,
        created_at: entry.created_at,
      }));
      
      setWeights(transformedWeights);
    } catch (error: any) {
      console.error('Error fetching weights:', error);
      setError(error.message || 'Failed to load weight data');
      setWeights([]);
    }
  };

  // Fetch KPI data
  const fetchKpiData = async () => {
    try {
      const response = await fetch('/api/weights/kpi');
      
      if (!response.ok) {
        throw new Error('Failed to fetch KPI data');
      }
      
      const data: KPIApiResponse = await response.json();
      
      // Calculate discrepancy rate (if declared_weight is available)
      const todayEntries = weights.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const today = new Date();
        return entryDate.toDateString() === today.toDateString();
      });
      
      let calculatedDiscrepancy = 0;
      if (todayEntries.length > 0) {
        const totalDeclared = todayEntries.reduce((sum, entry) => 
          sum + (entry.declared_weight || entry.net_weight || 0), 0);
        const totalActual = todayEntries.reduce((sum, entry) => 
          sum + (entry.net_weight || 0), 0);
        
        if (totalDeclared > 0) {
          calculatedDiscrepancy = Math.abs(totalDeclared - totalActual) / totalDeclared * 100;
        }
      }
      
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
          value: `${calculatedDiscrepancy.toFixed(1)}%`,
          change: 'net vs. declared weight',
          changeType: calculatedDiscrepancy > 5 ? 'increase' : 'decrease',
        },
      });
    } catch (error: any) {
      console.error('Error fetching KPI data:', error);
      // Set default KPI data
      setKpiData({
        palletsWeighed: {
          title: 'Pallets Weighed Today',
          value: '0',
          change: 'No data',
          changeType: 'neutral',
        },
        totalWeight: {
          title: 'Total Weight Today',
          value: '0 t',
          change: 'No data',
          changeType: 'neutral',
        },
        discrepancyRate: {
          title: 'Discrepancy Rate',
          value: '0%',
          change: 'No data',
          changeType: 'neutral',
        },
      });
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchWeights();
      await fetchKpiData();
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Refresh data when weights change
  useEffect(() => {
    if (!isLoading) {
      fetchKpiData();
    }
  }, [weights]);

  // Function to refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchWeights(), fetchKpiData()]);
    setIsRefreshing(false);
  };

  const handleAddWeight = async (newWeight: NewWeightEntry) => {
    try {
      setError(null);
      const response = await fetch('/api/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pallet_id: newWeight.pallet_id,
          product: newWeight.product,
          net_weight: newWeight.net_weight,
          unit: newWeight.unit || 'kg',
          gross_weight: newWeight.gross_weight || newWeight.net_weight,
          tare_weight: newWeight.tare_weight || 0,
          declared_weight: newWeight.declared_weight || newWeight.net_weight,
          rejected_weight: newWeight.rejected_weight || 0,
          supplier: newWeight.supplier || '',
          truck_id: newWeight.truck_id || '',
          driver_id: newWeight.driver_id || '',
          timestamp: newWeight.timestamp || new Date(),
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
        pallet_id: savedEntry.pallet_id,
        product: savedEntry.product,
        weight: savedEntry.weight,
        unit: savedEntry.unit,
        timestamp: savedEntry.timestamp,
        supplier: savedEntry.supplier,
        truck_id: savedEntry.truck_id,
        driver_id: savedEntry.driver_id,
        gross_weight: savedEntry.gross_weight,
        tare_weight: savedEntry.tare_weight,
        net_weight: savedEntry.net_weight,
        declared_weight: savedEntry.declared_weight,
        rejected_weight: savedEntry.rejected_weight,
        created_at: savedEntry.created_at,
      };
      
      // Update local state
      setWeights(prev => [transformedEntry, ...prev]);
      setLastWeightEntry(transformedEntry);
      setIsReceiptOpen(true);
      
    } catch (error: any) {
      console.error('Error adding weight:', error);
      setError(error.message || 'Failed to save weight entry');
      
      // Fallback: add to local state even if API fails
      const fallbackEntry: WeightEntry = {
        id: `weight-${Date.now()}`,
        pallet_id: newWeight.pallet_id,
        product: newWeight.product,
        weight: newWeight.net_weight,
        unit: newWeight.unit || 'kg',
        timestamp: new Date().toISOString(),
        supplier: newWeight.supplier || null,
        truck_id: newWeight.truck_id || null,
        driver_id: newWeight.driver_id || null,
        gross_weight: newWeight.gross_weight || newWeight.net_weight,
        tare_weight: newWeight.tare_weight || 0,
        net_weight: newWeight.net_weight,
        declared_weight: newWeight.declared_weight || newWeight.net_weight,
        rejected_weight: newWeight.rejected_weight || 0,
        created_at: new Date().toISOString(),
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
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
              FreshTrace
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Weight Capture Station
                </h2>
                <p className="text-muted-foreground">
                  Record and view pallet weights for shipments.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshData}
                  disabled={isRefreshing || isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-destructive/80 hover:text-destructive"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OverviewCard 
                  data={kpiData?.palletsWeighed || defaultKpiData.palletsWeighed} 
                  icon={Boxes} 
                />
                <OverviewCard 
                  data={kpiData?.totalWeight || defaultKpiData.totalWeight} 
                  icon={Scale} 
                />
                <Link href="/analytics" className="block transition-transform hover:scale-[1.02]">
                  <OverviewCard 
                    data={kpiData?.discrepancyRate || defaultKpiData.discrepancyRate} 
                    icon={GitCompareArrows} 
                  />
                </Link>
              </div>
            )}

            {isLoading ? (
              <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading weight data...</span>
              </div>
            ) : (
              <WeightCapture 
                weights={weights}
                onAddWeight={handleAddWeight}
                onReprint={handleReprint}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>
        {lastWeightEntry && (
          <FinalTagDialog
            isOpen={isReceiptOpen}
            onOpenChange={setIsReceiptOpen}
            weightEntry={{
              id: lastWeightEntry.id,
              palletId: lastWeightEntry.pallet_id || '',
              shipmentId: '',
              weight: `${lastWeightEntry.net_weight || 0} ${lastWeightEntry.unit}`,
              timestamp: lastWeightEntry.timestamp || lastWeightEntry.created_at,
              status: 'approved',
              operator: 'operator',
              notes: '',
              supplier: lastWeightEntry.supplier || '',
              truckId: lastWeightEntry.truck_id || '',
              driverId: lastWeightEntry.driver_id || '',
            }}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
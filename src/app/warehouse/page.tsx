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
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import WeightCapture from '@/components/dashboard/weight-capture'; // CHANGED: removed curly braces
import { GenerateTagsForm } from '@/components/dashboard/generate-tags-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { QrCode, HardHat, Users, DollarSign, TrendingUp, ArrowRight, ScanLine, FlaskConical, PackageCheck, Tags, Warehouse as WarehouseIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProcessingStationStatus } from '@/components/dashboard/processing-station-status';
import { UtilityMonitors } from '@/components/dashboard/utility-monitors';
import { LaborBreakdown } from '@/components/dashboard/labor-breakdown';
import Link from 'next/link';

// Types based on your database schema
interface Customer {
  id: string;
  name: string;
  location: string;
}

interface Shipment {
  id: string;
  shipment_id: string;
  customer: string;
  origin: string;
  destination: string;
  status: string;
  product: string;
  weight: string;
  tags: string;
  carrier: string;
  expected_arrival: string | null;
  created_at: string;
  customers: Customer | null;
}

interface WeightEntry {
  id: string;
  shipment_id: string;
  operator_id?: string;
  pallet_id?: string;
  gross_weight: number;
  tare_weight?: number;
  net_weight: number;
  unit: string;
  quality_check: string;
  notes?: string;
  timestamp: string;
  created_at: string;
}

interface TagBatch {
  id: string;
  batch_id: string;
  shipment_id?: string;
  product?: string;
  count: number;
  prefix?: string;
  start_number: number;
  status: string;
  generated_at: string;
  notes?: string;
}

const processingStages = [
    { id: 'receiving', name: 'Receiving', icon: ScanLine, description: 'Shipment arrival & initial check-in.', tag: 'Shipment ID (e.g., SH-XXXXX)' },
    { id: 'qc', name: 'Weighing & QC', icon: FlaskConical, description: 'Record weights and perform quality checks.', tag: 'Pallet ID / Batch ID' },
    { id: 'tagging', name: 'Breakdown & Tagging', icon: Tags, description: 'Assign unique QR codes to individual boxes/units.', tag: 'Item QR Code (e.g., B-YYYYMM-XXX-001)' },
    { id: 'sorting', name: 'Processing & Sorting', icon: PackageCheck, description: 'Sort items based on grade, size, or destination.', tag: 'Item QR Code' },
    { id: 'storage', name: 'Cold Room Storage', icon: WarehouseIcon, description: 'Scan items into designated cold room locations.', tag: 'Location ID + Item QR' },
];

export default function WarehousePage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [tagBatches, setTagBatches] = useState<TagBatch[]>([]);
  const [isLoading, setIsLoading] = useState({
    shipments: true,
    weights: true,
    tagBatches: true,
    all: true
  });
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Fetch shipments from database - only pending shipments
  const fetchShipments = async () => {
    try {
      setIsLoading(prev => ({ ...prev, shipments: true }));
      const response = await fetch('/api/shipments?status=Awaiting_QC');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch shipments: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setShipments(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError(`Failed to load shipments: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, shipments: false, all: prev.weights && prev.tagBatches }));
    }
  };

  // Fetch recent weights from database
  const fetchWeights = async () => {
    try {
      setIsLoading(prev => ({ ...prev, weights: true }));
      const response = await fetch('/api/weights?limit=10&order=desc');
      if (!response.ok) throw new Error('Failed to fetch weights');
      const data = await response.json();
      setWeights(data);
    } catch (err: any) {
      console.error('Error fetching weights:', err);
      setError(`Failed to load weight data: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, weights: false, all: prev.shipments && prev.tagBatches }));
    }
  };

  // Fetch tag batches from database
  const fetchTagBatches = async () => {
    try {
      setIsLoading(prev => ({ ...prev, tagBatches: true }));
      const response = await fetch('/api/tags/batches?limit=10&order=desc');
      if (!response.ok) throw new Error('Failed to fetch tag batches');
      const data = await response.json();
      setTagBatches(data);
    } catch (err: any) {
      console.error('Error fetching tag batches:', err);
      setError(`Failed to load tag batches: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, tagBatches: false, all: prev.shipments && prev.weights }));
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setIsLoading({ shipments: true, weights: true, tagBatches: true, all: true });
    setError(null);
    try {
      await Promise.all([
        fetchShipments(),
        fetchWeights(),
        fetchTagBatches()
      ]);
    } catch (err) {
      console.error('Error fetching all data:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter pending shipments
  const pendingShipments = shipments.filter(s => 
    s.status === 'Receiving' || 
    s.status === 'Awaiting_QC' ||
    s.status === 'Processing'
  );

  const handleRecordWeight = async (shipmentId: string) => {
    // Find the shipment to get the shipment_id
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      router.push(`/weight-capture?shipmentId=${shipment.shipment_id}`);
    } else {
      router.push('/weight-capture');
    }
  };

  const handleManageTags = (shipmentId: string) => {
    router.push(`/tag-management?shipmentId=${shipmentId}`);
  };

  const handleViewDetails = (shipmentId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      router.push(`/traceability?shipmentId=${shipment.shipment_id}`);
    }
  };
  
  const handleAddWeight = async (newWeight: Omit<WeightEntry, 'id' | 'timestamp' | 'created_at'>) => {
    try {
      const response = await fetch('/api/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWeight),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save weight: ${response.status} ${errorText}`);
      }

      const savedWeight = await response.json();
      setWeights(prev => [savedWeight, ...prev]);
      
      // Update shipment status if needed
      if (newWeight.shipment_id) {
        try {
          // First, get the shipment by shipment_id to get its id
          const shipmentResponse = await fetch(`/api/shipments?shipmentId=${newWeight.shipment_id}`);
          if (shipmentResponse.ok) {
            const shipments = await shipmentResponse.json();
            if (shipments.length > 0) {
              const shipment = shipments[0];
              // Update the status
              await fetch(`/api/shipments/${shipment.id}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'Processing' }),
              });
              // Refresh shipments list
              fetchShipments();
            }
          }
        } catch (updateErr) {
          console.error('Error updating shipment status:', updateErr);
        }
      }
    } catch (err: any) {
      console.error('Error adding weight:', err);
      setError(`Failed to save weight data: ${err.message}`);
    }
  };

  const handleGenerateTags = async (newBatch: Omit<TagBatch, 'id' | 'batch_id' | 'generated_at' | 'status'>) => {
    try {
      const response = await fetch('/api/tags/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBatch),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate tags: ${response.status} ${errorText}`);
      }

      const savedBatch = await response.json();
      setTagBatches(prev => [savedBatch, ...prev]);
    } catch (err: any) {
      console.error('Error generating tags:', err);
      setError(`Failed to generate tags: ${err.message}`);
    }
  };

  // Refresh data every 30 seconds (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading.all) {
        fetchAllData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoading.all]);

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
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading data</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={fetchAllData}
                    className="text-sm underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-sm hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <HardHat />
                Warehouse Processing Dashboard
              </h2>
              <p className="text-muted-foreground">
                Manage incoming shipments, weighing, tagging, and processing.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <div className="text-sm text-muted-foreground">
                  Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <button
                onClick={fetchAllData}
                disabled={isLoading.all}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading.all ? 'animate-spin' : ''}`} />
                {isLoading.all ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Processing Stages Card */}
          <Card>
            <CardHeader>
                <CardTitle>Processing Stages & Tagging Workflow</CardTitle>
                <CardDescription>An overview of the key stages for tracking items through the warehouse.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 text-center">
                    {processingStages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center">
                            <Card className="flex-1 flex flex-col items-center p-4">
                                <div className="bg-primary/10 p-3 rounded-full mb-2">
                                    <stage.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="font-semibold">{index + 1}. {stage.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                                <p className="text-xs font-mono bg-muted px-2 py-1 rounded-md mt-2">{stage.tag}</p>
                            </Card>
                            {index < processingStages.length - 1 && (
                              <ArrowRight className="hidden md:block self-center mx-2 text-muted-foreground" />
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
           
           {/* Processing Station Status */}
           <ProcessingStationStatus />

            {/* Labor Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LaborBreakdown />
            </div>
          
          {/* Main Content Area */}
          <div className="space-y-8">
            {/* Incoming Shipments */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Incoming Shipments for Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    {pendingShipments.length} shipment(s) pending processing
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    href="/shipments/new" 
                    className="text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md"
                  >
                    + New Shipment
                  </Link>
                </div>
              </div>
              
              {isLoading.shipments ? (
                <div className="h-48 flex flex-col items-center justify-center border rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading shipments...</p>
                </div>
              ) : pendingShipments.length > 0 ? (
                <ShipmentDataTable
                  shipments={pendingShipments}
                  onRecordWeight={handleRecordWeight}
                  onManageTags={handleManageTags}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <Card>
                  <CardContent className="h-48 flex flex-col items-center justify-center">
                    <div className="bg-muted p-4 rounded-full mb-4">
                      <PackageCheck className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No shipments pending processing</p>
                    <p className="text-sm text-muted-foreground mt-1">All shipments have been processed or are en route</p>
                    <Link 
                      href="/shipments/new" 
                      className="mt-4 text-primary hover:underline"
                    >
                      + Create new shipment
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Generate Tags Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Generate New Batch
                  </CardTitle>
                  <CardDescription>
                    Create new QR codes for a product.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GenerateTagsForm 
                    onSubmit={handleGenerateTags} 
                    shipments={shipments}
                    isLoading={isLoading.shipments}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Weight Capture */}
            <div>
              <WeightCapture 
                weights={weights} 
                onAddWeight={handleAddWeight} 
                isLoading={isLoading.weights}
                shipments={shipments}
              />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
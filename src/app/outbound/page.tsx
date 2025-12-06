'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshTraceLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { employeeData, type OutboundShipmentFormData } from '@/lib/data';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Truck, PackageCheck, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateOutboundShipmentForm } from '@/components/dashboard/create-outbound-shipment-form';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define API response type
interface DatabaseShipment {
  id: string;
  shipment_id: string;
  customer_id?: string | null;
  origin?: string | null;
  destination?: string | null;
  status: string;
  product?: string | null;
  tags?: string | null;
  weight?: string | null;
  carrier?: string | null;
  expected_arrival?: string | null;
  created_at: string;
  customers?: {
    id: string;
    name: string;
    location?: string | null;
  } | null;
}

// Define Shipment type for frontend
interface Shipment {
  id: string;
  shipmentId: string;
  customer: string;
  origin: string;
  destination: string;
  status: string;
  product: string;
  weight: string;
  temperature: string;
  humidity: string;
  tags: string;
  expectedArrival: string;
  driver: string;
  carrier: string;
  priority: string;
  notes: string;
}

// Helper function to convert database status to display format
function convertDbStatusToDisplay(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'Awaiting_QC': 'Awaiting QC',
    'Processing': 'Processing',
    'Receiving': 'Receiving',
    'Preparing_for_Dispatch': 'Preparing for Dispatch',
    'Ready_for_Dispatch': 'Ready for Dispatch',
    'In_Transit': 'In-Transit',
    'Delayed': 'Delayed',
    'Delivered': 'Delivered'
  };
  
  return statusMap[dbStatus] || 'Awaiting QC';
}

export default function OutboundPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch shipments from API
  const fetchShipments = useCallback(async () => {
    try {
      console.log('📡 Fetching shipments for outbound page...');
      setLoading(true);
      
      const response = await fetch('/api/shipments');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch shipments: ${response.status}`);
      }
      
      const data: DatabaseShipment[] = await response.json();
      console.log('✅ Outbound API returned', data.length, 'shipments');
      
      // Transform database data
      const transformedData: Shipment[] = data.map(shipment => {
        const displayStatus = convertDbStatusToDisplay(shipment.status);
        
        const formatDate = (dateString?: string | null) => {
          if (!dateString) return 'N/A';
          try {
            return new Date(dateString).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch {
            return 'N/A';
          }
        };
        
        // Format weight consistently
        const weight = shipment.weight || '0';
        const formattedWeight = `${parseFloat(weight).toFixed(0)} kg`;
        
        return {
          id: shipment.id,
          shipmentId: shipment.shipment_id,
          customer: shipment.customers?.name || 'Unknown Customer',
          origin: shipment.origin || 'N/A',
          destination: shipment.destination || 'N/A',
          status: displayStatus,
          product: shipment.product || 'N/A',
          weight: formattedWeight,
          temperature: 'N/A',
          humidity: 'N/A',
          tags: shipment.tags || 'Not tagged',
          expectedArrival: formatDate(shipment.expected_arrival),
          driver: 'Not assigned',
          carrier: shipment.carrier || 'N/A',
          priority: 'Medium',
          notes: ''
        };
      });
      
      setShipments(transformedData);
    } catch (error) {
      console.error('❌ Error fetching shipments for outbound:', error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleShipmentSubmission = async (formData: OutboundShipmentFormData) => {
    try {
      const shipmentToUpdate = shipments.find(s => s.id === formData.shipmentId);
      if (!shipmentToUpdate) {
        console.error('Shipment not found:', formData.shipmentId);
        return;
      }
      
      // Update shipment status in database
      const updateResponse = await fetch(`/api/shipments/${formData.shipmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'In_Transit',
          carrier: formData.carrier,
          driverId: formData.driverId,
          truckId: formData.truckId
        }),
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Failed to update shipment:', errorData);
        throw new Error('Failed to update shipment status');
      }
      
      console.log('✅ Shipment updated successfully');
      
      // Store form data for manifest page
      sessionStorage.setItem(`dispatch-${formData.shipmentId}`, JSON.stringify({
        ...formData,
        dispatchDate: new Date().toISOString(),
        originalShipment: shipmentToUpdate
      }));
      
      // Refresh shipments data
      await fetchShipments();
      
      // Navigate to manifest page
      router.push(`/outbound/manifest/${formData.shipmentId}`);
      
    } catch (error) {
      console.error('❌ Error processing outbound shipment:', error);
      alert('Failed to process shipment. Please try again.');
    }
  };

  const outboundKpis = {
    readyForDispatch: {
      title: 'Ready for Dispatch',
      value: String(shipments.filter(s => s.status === 'Ready for Dispatch').length),
      change: 'awaiting carrier pickup',
      changeType: 'increase' as const,
    },
    preparing: {
      title: 'Preparing for Dispatch',
      value: String(shipments.filter(s => s.status === 'Preparing for Dispatch').length),
      change: 'in the staging area',
      changeType: 'increase' as const,
    },
    dispatchedToday: {
      title: 'Dispatched Today',
      value: String(shipments.filter(s => s.status === 'In-Transit').length),
      change: 'across all carriers',
      changeType: 'increase' as const,
    }
  };

  // Filter shipments for outbound processing
  const shipmentsForOutbound = shipments.filter(
    s => s.status === 'Preparing for Dispatch' || s.status === 'Ready for Dispatch'
  );
  
  const handleRecordWeight = (shipmentId: string) => router.push(`/weight-capture?shipmentId=${shipmentId}`);
  const handleManageTags = (shipmentId: string) => router.push(`/tag-management?shipmentId=${shipmentId}`);
  const handleViewDetails = (shipmentId: string) => router.push(`/traceability?shipmentId=${shipmentId}`);
  const handleViewNote = (shipmentId: string) => router.push(`/outbound/dispatch-note/${shipmentId}`);
  const handleViewManifest = (shipmentId: string) => router.push(`/outbound/manifest/${shipmentId}`);

  const handleRefresh = () => {
    console.log('🔄 Refreshing outbound shipments...');
    fetchShipments();
  };

  if (loading) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
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
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading outbound shipments from database...</p>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Truck />
                Outbound Logistics Dashboard
              </h2>
              <p className="text-muted-foreground">
                Process and dispatch outgoing shipments from database.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {shipments.length} shipment(s) from database
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("mr-2", loading && "animate-spin")} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/shipments" className="block transition-transform hover:scale-[1.02]">
              <OverviewCard data={outboundKpis.readyForDispatch} icon={PackageCheck} />
            </Link>
            <Link href="/shipments" className="block transition-transform hover:scale-[1.02]">
              <OverviewCard data={outboundKpis.preparing} icon={Clock} />
            </Link>
            <Link href="/shipments" className="block transition-transform hover:scale-[1.02]">
              <OverviewCard data={outboundKpis.dispatchedToday} icon={Truck} />
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Process Outbound Shipment</CardTitle>
              <CardDescription>
                Select a shipment that is ready for dispatch to fill its details and generate an outbound manifest.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateOutboundShipmentForm 
                shipments={shipmentsForOutbound}
                onSubmit={handleShipmentSubmission} 
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                All Outbound Shipments ({shipmentsForOutbound.length} ready for dispatch)
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open('/api/shipments', '_blank')}
                title="View raw API data"
              >
                View API
              </Button>
            </div>
            
            {shipmentsForOutbound.length > 0 ? (
              <ShipmentDataTable 
                shipments={shipmentsForOutbound} 
                onRecordWeight={handleRecordWeight}
                onManageTags={handleManageTags}
                onViewDetails={handleViewDetails}
                onViewNote={handleViewNote}
                onViewManifest={handleViewManifest}
              />
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <PackageCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No shipments ready for outbound processing</p>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  All shipments are either in transit, delivered, or in other statuses
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline"
                    onClick={handleRefresh}
                  >
                    Refresh Data
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/shipments')}
                  >
                    View All Shipments
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { employeeData, vmsIotData, shipmentVolumeData, carrierPerformanceData } from '@/lib/data';
import type { Shipment, ShipmentFormData, ShipmentStatus } from '@/lib/data';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import { Button } from '@/components/ui/button';
import { GoodsReceivedNoteDialog } from '@/components/dashboard/goods-received-note-dialog';
import { PlusCircle, Printer, Calendar as CalendarIcon, PackageX, Truck, PackageCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { PrintableShipmentReport } from '@/components/dashboard/printable-shipment-report';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { ShipmentVolumeChart } from '@/components/dashboard/shipment-volume-chart';
import { CarrierPerformanceChart } from '@/components/dashboard/carrier-performance-chart';
import Link from 'next/link';

// Define API response type matching your Prisma schema
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

// Filter button configuration
const filterButtons = [
  { display: 'All', dbValue: null },
  { display: 'Awaiting QC', dbValue: 'Awaiting_QC' },
  { display: 'Processing', dbValue: 'Processing' },
  { display: 'Receiving', dbValue: 'Receiving' },
  { display: 'Preparing for Dispatch', dbValue: 'Preparing_for_Dispatch' },
  { display: 'Ready for Dispatch', dbValue: 'Ready_for_Dispatch' },
  { display: 'In-Transit', dbValue: 'In_Transit' },
  { display: 'Delayed', dbValue: 'Delayed' },
  { display: 'Delivered', dbValue: 'Delivered' },
];

// Valid database status values
const VALID_DB_STATUSES = [
  'Awaiting_QC',
  'Processing',
  'Receiving',
  'Preparing_for_Dispatch',
  'Ready_for_Dispatch',
  'In_Transit',
  'Delayed',
  'Delivered'
];

// Helper function to convert database status to display format
function convertDbStatusToDisplay(dbStatus: string): ShipmentStatus {
  const statusMap: Record<string, ShipmentStatus> = {
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

// Helper function to convert display status to database format
function convertDisplayStatusToDb(displayStatus: ShipmentStatus): string | null {
  const statusMap: Record<ShipmentStatus, string> = {
    'Awaiting QC': 'Awaiting_QC',
    'Processing': 'Processing',
    'Receiving': 'Receiving',
    'Preparing for Dispatch': 'Preparing_for_Dispatch',
    'Ready for Dispatch': 'Ready_for_Dispatch',
    'In-Transit': 'In_Transit',
    'Delayed': 'Delayed',
    'Delivered': 'Delivered'
  };
  
  return statusMap[displayStatus] || null;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGrnOpen, setIsGrnOpen] = useState(false);
  const [selectedShipmentForNote, setSelectedShipmentForNote] = useState<
    (Shipment & { formData?: ShipmentFormData }) | null
  >(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const productFilterFromUrl = searchParams.get('product');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeFilter, setActiveFilter] = useState<ShipmentStatus | 'All'>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch shipments from API - REAL DATA FETCH
  const fetchShipments = useCallback(async () => {
    try {
      console.log('📡 Fetching shipments from database...');
      setLoading(true);
      
      const params = new URLSearchParams();
      
      // Handle status filter - ONLY add if it's a specific status (not 'All')
      if (activeFilter !== 'All') {
        const dbStatus = convertDisplayStatusToDb(activeFilter);
        if (dbStatus && dbStatus.trim() && VALID_DB_STATUSES.includes(dbStatus)) {
          params.append('status', dbStatus);
          console.log('🔍 Adding status filter:', dbStatus);
        } else {
          console.log('⚠️ Skipping invalid status filter:', dbStatus);
        }
      }
      
      // Handle product filter
      if (productFilterFromUrl && productFilterFromUrl.trim() !== '') {
        params.append('product', productFilterFromUrl.trim());
        console.log('🔍 Adding product filter:', productFilterFromUrl);
      }
      
      // Handle date filters
      if (dateRange?.from) {
        params.append('fromDate', dateRange.from.toISOString());
        console.log('🔍 Adding fromDate:', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        params.append('toDate', dateRange.to.toISOString());
        console.log('🔍 Adding toDate:', dateRange.to.toISOString());
      }
      
      // Log the final URL
      const apiUrl = `/api/shipments${params.toString() ? '?' + params.toString() : ''}`;
      console.log('🌐 API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch shipments: ${response.status}`);
      }
      
      const data: DatabaseShipment[] = await response.json();
      console.log('✅ API returned', data.length, 'shipments');
      
      // Transform database data to match your existing Shipment type
      const transformedData: Shipment[] = data.map(shipment => {
        // Convert database status to display format
        const displayStatus = convertDbStatusToDisplay(shipment.status);
        
        return {
          id: shipment.id,
          shipmentId: shipment.shipment_id,
          customer: shipment.customers?.name || 'Unknown Customer',
          origin: shipment.origin || 'N/A',
          destination: shipment.destination || 'N/A',
          status: displayStatus,
          product: shipment.product || 'N/A',
          weight: shipment.weight || 'Not weighed',
          temperature: 'N/A',
          humidity: 'N/A',
          tags: shipment.tags || 'Not tagged',
          expectedArrival: shipment.expected_arrival 
            ? format(new Date(shipment.expected_arrival), 'yyyy-MM-dd')
            : 'N/A',
          driver: 'Not assigned',
          carrier: shipment.carrier || 'N/A',
          priority: 'Medium',
          notes: ''
        };
      });
      
      setShipments(transformedData);
    } catch (error) {
      console.error('❌ Error fetching shipments:', error);
      // Show empty state
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, productFilterFromUrl, dateRange]);

  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Handle URL parameter changes
  useEffect(() => {
    if (productFilterFromUrl) {
      setActiveFilter('All');
    }
  }, [productFilterFromUrl]);

  const handleRecordWeight = (shipmentId: string) => {
    router.push(`/weight-capture?shipmentId=${shipmentId}`);
  };

  const handleManageTags = (shipmentId: string) => {
    router.push(`/tag-management?shipmentId=${shipmentId}`);
  };

  const handleViewDetails = (shipmentId: string) => {
    router.push(`/shipments/${shipmentId}/details`);
  };

  const handleViewManifest = (shipmentId: string) => {
    router.push(`/outbound/manifest/${shipmentId}`);
  };
  
  const handleViewNote = async (shipmentId: string) => {
    try {
      console.log('📡 Fetching shipment details for GRN:', shipmentId);
      const response = await fetch(`/api/shipments/${shipmentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shipment details');
      }
      
      const shipment: DatabaseShipment = await response.json();
      
      // Get driver and truck data
      const driver = employeeData.find(e => e.role === 'Driver');
      const truck = vmsIotData.find(d => d.name.includes('Truck'));
      
      const displayStatus = convertDbStatusToDisplay(shipment.status);
      
      const mockFormData: ShipmentFormData = {
        customer: shipment.customers?.name || 'Unknown Customer',
        origin: shipment.origin || '',
        destination: shipment.destination || '',
        status: displayStatus,
        product: shipment.product || '',
        qualityChecks: {
          packaging: { status: 'accepted' },
          freshness: { status: 'accepted' },
          seals: { status: 'accepted' },
        },
        declaredWeight: parseFloat(shipment.weight || '0') || 0,
        netWeight: parseFloat(shipment.weight || '0') || 0,
        arrivalTemperature: 4,
        driverId: driver?.id || '',
        truckId: truck?.id || '',
      };
      
      const transformedShipment: Shipment = {
        id: shipment.id,
        shipmentId: shipment.shipment_id,
        customer: shipment.customers?.name || 'Unknown Customer',
        origin: shipment.origin || 'N/A',
        destination: shipment.destination || 'N/A',
        status: displayStatus,
        product: shipment.product || 'N/A',
        weight: shipment.weight || 'Not weighed',
        temperature: 'N/A',
        humidity: 'N/A',
        tags: shipment.tags || 'Not tagged',
        expectedArrival: shipment.expected_arrival 
          ? format(new Date(shipment.expected_arrival), 'yyyy-MM-dd')
          : 'N/A',
        driver: 'Not assigned',
        carrier: shipment.carrier || 'N/A',
        priority: 'Medium',
        notes: ''
      };
      
      setSelectedShipmentForNote({ ...transformedShipment, formData: mockFormData });
      setIsGrnOpen(true);
    } catch (error) {
      console.error('Error fetching shipment for GRN:', error);
      // Fallback to finding in local state
      const shipment = shipments.find(s => s.id === shipmentId);
      if (shipment) {
        const mockFormData: ShipmentFormData = {
          customer: shipment.customer,
          origin: shipment.origin,
          destination: shipment.destination,
          status: shipment.status,
          product: shipment.product,
          qualityChecks: {
            packaging: { status: 'accepted' },
            freshness: { status: 'accepted' },
            seals: { status: 'accepted' },
          },
          declaredWeight: parseFloat(shipment.weight) || 0,
          netWeight: parseFloat(shipment.weight) || 0,
          arrivalTemperature: 4,
          driverId: employeeData.find(e => e.role === 'Driver')?.id || '',
          truckId: vmsIotData.find(d => d.name.includes('Truck'))?.id || '',
        };
        setSelectedShipmentForNote({ ...shipment, formData: mockFormData });
        setIsGrnOpen(true);
      }
    }
  };

  const handlePrintReport = async () => {
    const element = printRef.current;
    if (element) {
      const canvas = await html2canvas(element, { scale: 2 });
      const data = canvas.toDataURL('image/jpeg');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`shipment-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manually refreshing shipments...');
    fetchShipments();
  };

  const incomingShipments = shipments.filter(s => 
    s.status === 'Receiving' || s.status === 'Awaiting QC' || s.status === 'Processing'
  );

  const filteredShipments = shipments;

  const kpiData = {
    awaitingQc: {
      title: 'Awaiting QC',
      value: String(shipments.filter(s => s.status === 'Awaiting QC').length),
      change: `${shipments.filter(s => s.status === 'Awaiting QC').length} need attention`,
      changeType: 'increase' as const,
    },
    inTransit: {
      title: 'In-Transit',
      value: String(shipments.filter(s => s.status === 'In-Transit').length),
      change: `${shipments.filter(s => s.status === 'In-Transit').length} currently on the road`,
      changeType: 'increase' as const,
    },
    delivered: {
      title: 'Total Delivered',
      value: String(shipments.filter(s => s.status === 'Delivered').length),
      change: `${shipments.filter(s => s.status === 'Delivered').length} shipments completed`,
      changeType: 'increase' as const,
    },
    delayed: {
      title: 'Delayed',
      value: String(shipments.filter(s => s.status === 'Delayed').length),
      change: `${shipments.filter(s => s.status === 'Delayed').length} shipments behind schedule`,
      changeType: 'decrease' as const,
    },
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
          <div className="non-printable">
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading shipments from database...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fetching real-time data
                </p>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <>
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
          <div className="non-printable">
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Inbound & Outbound Command Center
                </h2>
                <p className="text-muted-foreground">
                  Real-time shipment tracking from database
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {shipments.length} shipment(s) from database
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw className={cn("mr-2", loading && "animate-spin")} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="outline" onClick={handlePrintReport}>
                  <Printer className="mr-2" />
                  Print Report
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <OverviewCard data={kpiData.awaitingQc} icon={PackageX} />
                <OverviewCard data={kpiData.inTransit} icon={Truck} />
                <OverviewCard data={kpiData.delivered} icon={PackageCheck} />
                <OverviewCard data={kpiData.delayed} icon={AlertCircle} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <Link href="/analytics" className="block h-full transition-transform hover:scale-[1.02]">
                  <ShipmentVolumeChart data={shipmentVolumeData} />
                </Link>
              </div>
              <div className="lg:col-span-2">
                 <Link href="/analytics" className="block h-full transition-transform hover:scale-[1.02]">
                  <CarrierPerformanceChart data={carrierPerformanceData} />
                </Link>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Incoming Shipment Notice Board</h3>
              {incomingShipments.length > 0 ? (
                <ShipmentDataTable
                  shipments={incomingShipments}
                  onRecordWeight={handleRecordWeight}
                  onManageTags={handleManageTags}
                  onViewDetails={handleViewDetails}
                  onViewNote={handleViewNote}
                  onViewManifest={handleViewManifest}
                />
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <PackageX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No incoming shipments found in database</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    All shipments are either delivered or not in receiving/processing status
                  </p>
                </div>
              )}
            </div>
            
            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  All Shipments (Database)
                  {productFilterFromUrl && (
                    <span className="text-base text-muted-foreground"> (Filtered by: {productFilterFromUrl})</span>
                  )}
                </h3>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredShipments.length} shipment(s) found
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open('/api/shipments', '_blank')}
                    title="View raw API data"
                  >
                    View API
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {filterButtons.map(({ display, dbValue }) => {
                  const isActive = activeFilter === display;
                  return (
                    <Button
                      key={display}
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => {
                        setActiveFilter(display as ShipmentStatus | 'All');
                        const currentUrl = new URL(window.location.href);
                        if (currentUrl.searchParams.has('product')) {
                          currentUrl.searchParams.delete('product');
                          window.history.replaceState({}, '', currentUrl.toString());
                        }
                      }}
                      className={cn(
                        display === 'Awaiting QC' && isActive && 'bg-yellow-500 hover:bg-yellow-600 text-white',
                        display === 'Delayed' &&
                          isActive &&
                          'bg-destructive hover:bg-destructive/90',
                        display === 'Delivered' && isActive && 'bg-green-600 hover:bg-green-700'
                      )}
                    >
                      {display}
                    </Button>
                  );
                })}
                <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                          "w-[300px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                      )}
                      >
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                          <span>Filter by arrival date</span>
                      )}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      />
                  </PopoverContent>
                </Popover>
              </div>
              {filteredShipments.length > 0 ? (
                <ShipmentDataTable
                  shipments={filteredShipments}
                  onRecordWeight={handleRecordWeight}
                  onManageTags={handleManageTags}
                  onViewDetails={handleViewDetails}
                  onViewNote={handleViewNote}
                  onViewManifest={handleViewManifest}
                />
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <PackageX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No shipments found in database</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Your database might be empty. Check your API endpoint or seed the database.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setActiveFilter('All');
                        setDateRange(undefined);
                      }}
                    >
                      Clear filters
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('/api/shipments', '_blank')}
                    >
                      Check API
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleRefresh}
                    >
                      Refresh Data
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>

        {selectedShipmentForNote && (
          <GoodsReceivedNoteDialog
            isOpen={isGrnOpen}
            onOpenChange={setIsGrnOpen}
            shipment={selectedShipmentForNote}
          />
        )}
      </SidebarProvider>
       <div className="printable-visitor-report-container">
        <div ref={printRef}>
          <PrintableShipmentReport shipments={filteredShipments} />
        </div>
      </div>
    </>
  );
}
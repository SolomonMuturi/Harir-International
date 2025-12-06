'use client';

import Link from 'next/link';
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
import {
  overviewData,
  coldChainData,
  recentAlertsData,
  podReconciliationData,
  invoiceStatusData,
  customerData,
  supplierData,
  vmsIotData,
  weightData,
  dwellTimeData,
  shipmentData,
  tagBatchData,
  type Shipment,
  type WeightEntry,
  type TagBatch,
} from '@/lib/data';
import { OverviewCard } from '@/components/dashboard/overview-card';
import {
  DollarSign,
  FileText,
  PackageSearch,
  Thermometer,
  Users,
  Receipt,
  Container,
  Clock,
  HardHat,
  QrCode,
  Printer,
  Grape,
  FileCheck2,
} from 'lucide-react';
import { PodReconciliation } from '@/components/dashboard/pod-reconciliation';
import { ColdChainChart } from '@/components/dashboard/cold-chain-chart';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { InvoiceStatusChart } from '@/components/dashboard/invoice-status-chart';
import { CustomerDataTable } from '@/components/dashboard/customer-data-table';
import { VmsIotStatus } from '@/components/dashboard/vms-iot-status';
import { DwellTime } from '@/components/dashboard/dwell-time';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import WeightCapture from '@/components/dashboard/weight-capture';
import { GenerateTagsForm } from '@/components/dashboard/generate-tags-form';
import { ProcessingStationStatus } from '@/components/dashboard/processing-station-status';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const AdminDashboard = () => {
    const router = useRouter();
    const handleRecordWeight = (shipmentId: string) => router.push(`/weight-capture?shipmentId=${shipmentId}`);
    const handleManageTags = (shipmentId: string) => router.push('/tag-management');
    const handleViewDetails = (shipmentId: string) => router.push(`/traceability?shipmentId=${shipmentId}`);

    const incomingShipments = shipmentData.filter(s => s.status === 'Receiving' || s.status === 'In-Transit' || s.status === 'Processing');
    
    const dwellTimeWithWeights = dwellTimeData.map(item => ({
        ...item,
        weight: Math.floor(Math.random() * 500) + 500 // Add random weight for demonstration
    }));
    
    const totalSuppliers = {
        title: 'Total Suppliers',
        value: String(supplierData.length),
        change: 'in your network',
        changeType: 'increase' as const
    };

  return (
      <>
        <div className="grid gap-6 md:gap-8 grid-cols-12">
            <div className="col-span-12">
            <h2 className="text-2xl font-bold tracking-tight">
                FreshTrace System Dashboard
            </h2>
            <p className="text-muted-foreground">
                A unified view of your supply chain operations and financial health.
            </p>
            </div>

            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Link href="/traceability" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={overviewData.traceability} icon={PackageSearch} />
                </Link>
                <Link href="/cold-room" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={overviewData.coldChain} icon={Thermometer} />
                </Link>
                <Link href="/financials" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={overviewData.accountsReceivable} icon={DollarSign} />
                </Link>
                <Link href="/suppliers" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={totalSuppliers} icon={Grape} />
                </Link>
                <Link href="/customers" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={{...overviewData.newCustomers, title: "Total Customers", value: String(customerData.length) }} icon={Users} />
                </Link>
                 <Link href="/shipments" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={overviewData.podsPending} icon={FileCheck2} />
                </Link>
            </div>
            
            <div className="col-span-12">
                <h3 className="text-lg font-semibold mb-4">Incoming Shipment Notice Board</h3>
                <ShipmentDataTable shipments={incomingShipments} onRecordWeight={handleRecordWeight} onManageTags={handleManageTags} onViewDetails={handleViewDetails} />
            </div>

            <div className="col-span-12 lg:col-span-8">
                <Link href="/cold-room" className="block h-full transition-transform hover:scale-[1.02]">
                    <ColdChainChart data={coldChainData} />
                </Link>
            </div>

            <div className="col-span-12 lg:col-span-4">
                <RecentAlerts alerts={recentAlertsData} />
            </div>
            
            <div className="col-span-12">
                <Link href="/cold-room" className="block h-full transition-transform hover:scale-[1.02]">
                    <DwellTime locations={dwellTimeWithWeights} />
                </Link>
            </div>

            <div className="col-span-12">
                <Link href="/shipments" className="block h-full transition-transform hover:scale-[1.02]">
                    <PodReconciliation reconciliations={podReconciliationData} />
                </Link>
            </div>

            <div className="col-span-12">
                <Link href="/financials/invoices" className="block h-full transition-transform hover:scale-[1.02]">
                    <InvoiceStatusChart data={invoiceStatusData} />
                </Link>
            </div>

            <div className="col-span-12">
                <Link href="/customers" className="block h-full transition-transform hover:scale-[1.02]">
                    <CustomerDataTable customers={customerData} onEditCustomer={() => {}} />
                </Link>
            </div>

            <div className="col-span-12">
                <Link href="/vehicle-management" className="block h-full transition-transform hover:scale-[1.02]">
                    <VmsIotStatus devices={vmsIotData} />
                </Link>
            </div>
        </div>
    </>
  );
};

const WarehouseDashboard = () => {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>(shipmentData);
  const [weights, setWeights] = useState<WeightEntry[]>(weightData);
  const [tagBatches, setTagBatches] = useState<TagBatch[]>(tagBatchData);
  const [isLoadingWeights, setIsLoadingWeights] = useState(false);

  const pendingShipments = shipments.filter(s => s.status === 'Receiving');

  const handleRecordWeight = (shipmentId: string) => router.push(`/weight-capture?shipmentId=${shipmentId}`);
  const handleManageTags = (shipmentId: string) => router.push('/tag-management');
  const handleViewDetails = (shipmentId: string) => router.push(`/traceability?shipmentId=${shipmentId}`);
  
  const handleAddWeight = (newWeight: Omit<WeightEntry, 'id' | 'timestamp'>) => {
    const newEntry: WeightEntry = { 
      ...newWeight, 
      id: `w-${Date.now()}`, 
      timestamp: new Date().toISOString() 
    };
    setWeights(prev => [newEntry, ...prev]);
  };

  const handleReprint = (entry: WeightEntry) => {
    console.log('Reprint weight entry:', entry);
    // Add your reprint logic here, e.g., open a dialog, call API, etc.
    alert(`Reprinting weight entry for Pallet ID: ${entry.pallet_id || 'N/A'}`);
  };

  const handleGenerateTags = (newBatch: Omit<TagBatch, 'id' | 'batchId' | 'generatedAt' | 'status'>) => {
    const newBatchWithDefaults: TagBatch = { 
      ...newBatch, 
      id: `tag-${Date.now()}`, 
      batchId: `B-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, 
      generatedAt: new Date().toISOString(), 
      status: 'active' 
    };
    setTagBatches(prev => [newBatchWithDefaults, ...prev]);
  };

  return (
    <div className="grid gap-6 md:gap-8 grid-cols-12">
      <div className="col-span-12">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HardHat />
          Warehouse Dashboard
        </h2>
        <p className="text-muted-foreground">Manage incoming shipments, weighing, tagging, and processing.</p>
      </div>
      <div className="col-span-12"><ProcessingStationStatus /></div>
      <div className="col-span-12">
        <h3 className="text-lg font-semibold mb-4">Incoming Shipments for Processing</h3>
        <ShipmentDataTable shipments={pendingShipments} onRecordWeight={handleRecordWeight} onManageTags={handleManageTags} onViewDetails={handleViewDetails} />
      </div>
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" />Generate New Batch</CardTitle>
            <CardDescription>Create new QR codes for a product.</CardDescription>
          </CardHeader>
          <CardContent><GenerateTagsForm onSubmit={handleGenerateTags} /></CardContent>
        </Card>
      </div>
      <div className='col-span-12'>
        <WeightCapture 
          weights={weights} 
          onAddWeight={handleAddWeight} 
          onReprint={handleReprint} 
          isLoading={isLoadingWeights} 
        />
      </div>
    </div>
  );
};

const DriverDashboard = () => {
    const router = useRouter();
    const { user } = useUser();
    
    const myShipments = shipmentData.filter(s => s.status === 'In-Transit');
    
    const handleRecordWeight = (shipmentId: string) => router.push(`/weight-capture?shipmentId=${shipmentId}`);
    const handleManageTags = (shipmentId: string) => router.push('/tag-management');
    const handleViewDetails = (shipmentId: string) => router.push(`/traceability?shipmentId=${shipmentId}`);

    return (
        <div className="grid gap-6 md:gap-8 grid-cols-12">
            <div className="col-span-12">
                <h2 className="text-2xl font-bold tracking-tight">Driver Dashboard</h2>
                <p className="text-muted-foreground">Your active shipments and quick actions.</p>
            </div>
            <div className="col-span-12">
                 <ShipmentDataTable shipments={myShipments} onRecordWeight={handleRecordWeight} onManageTags={handleManageTags} onViewDetails={handleViewDetails} />
            </div>
        </div>
    );
};

export default function DashboardPage() {
  const { user } = useUser();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'Admin':
      case 'Manager':
        return <AdminDashboard />;
      case 'Warehouse':
        return <WarehouseDashboard />;
      case 'Driver':
        return <DriverDashboard />;
      default:
        return <AdminDashboard />; // Default to admin view
    }
  };

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
          {renderDashboard()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
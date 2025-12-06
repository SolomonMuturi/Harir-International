
'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { shipmentData, type Shipment, type ShipmentFormData, accountsReceivableData, type AccountsReceivableEntry, employeeData, weightData } from '@/lib/data';
import CreateShipmentForm from '@/components/dashboard/create-shipment-form';
import { ProduceQualityAnalyzer } from '@/components/dashboard/produce-quality-analyzer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GoodsReceivedNoteDialog } from '@/components/dashboard/goods-received-note-dialog';
import { FlaskConical, ListChecks, ThumbsDown, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type ProcessedShipment = Shipment & { 
  finalStatus: 'Approved' | 'Rejected';
  formData: ShipmentFormData;
  processedAt: string;
  processedBy: string;
};

const mockProcessedShipments: ProcessedShipment[] = [
    {
        id: 'ship-proc-1',
        shipmentId: 'SH-88118',
        customer: 'Carrefour Kenya',
        origin: 'Athi River',
        destination: 'Nakuru',
        status: 'Processing',
        product: 'Tomatoes',
        tags: 'B-202407-060',
        weight: '1200 kg',
        expectedArrival: '2024-07-28T10:00:00Z',
        finalStatus: 'Approved',
        processedAt: '2024-07-29T10:00:00Z',
        processedBy: 'John Omondi',
        formData: {
            customer: 'Carrefour Kenya', origin: 'Athi River', destination: 'Nakuru', status: 'Processing', product: 'Tomatoes', declaredWeight: 1200, netWeight: 1195, arrivalTemperature: 4.5, driverId: 'emp-2', truckId: 'vms-1',
            qualityChecks: { packaging: { status: 'accepted' }, freshness: { status: 'accepted' }, seals: { status: 'accepted' } }
        }
    },
    {
        id: 'ship-proc-2',
        shipmentId: 'SH-88117',
        customer: 'Quickmart',
        origin: 'Limuru',
        destination: 'Nairobi',
        status: 'Rejected',
        product: 'Lettuce',
        tags: 'N/A',
        weight: '300 kg',
        expectedArrival: '2024-07-27T12:00:00Z',
        finalStatus: 'Rejected',
        processedAt: '2024-07-28T11:30:00Z',
        processedBy: 'John Omondi',
        formData: {
            customer: 'Quickmart', origin: 'Limuru', destination: 'Nairobi', status: 'Rejected', product: 'Lettuce', declaredWeight: 300, netWeight: 300, arrivalTemperature: 6.8, driverId: 'emp-5', truckId: 'vms-4',
            qualityChecks: { packaging: { status: 'accepted' }, freshness: { status: 'rejected', rejectedWeight: 50 }, seals: { status: 'accepted' } }
        }
    },
];


export default function QualityControlPage() {
  const { user } = useUser();
  const [shipments, setShipments] = useState<Shipment[]>(shipmentData);
  const [isGrnOpen, setIsGrnOpen] = useState(false);
  const [processedShipments, setProcessedShipments] = useState<ProcessedShipment[]>(mockProcessedShipments);
  const [selectedShipmentForNote, setSelectedShipmentForNote] = useState<ProcessedShipment | null>(null);

  const shipmentsAwaitingQc = shipments.filter(s => s.status === 'Awaiting QC');

  const handleShipmentSubmission = (formData: ShipmentFormData) => {
    const hasRejections = Object.values(formData.qualityChecks).some(check => check.status === 'rejected');
    const finalStatus = hasRejections ? 'Rejected' : 'Approved';

    const shipmentIndex = shipments.findIndex(s => s.shipmentId === (formData as any).shipmentId || s.customer === formData.customer);
    const processedShipmentBase = shipments[shipmentIndex];

    if (!processedShipmentBase) return;
    
    const updatedShipment: Shipment = { ...processedShipmentBase, status: 'Processing' };
    const newShipments = [...shipments];
    newShipments.splice(shipmentIndex, 1);
    setShipments(newShipments);

    const newProcessedShipment: ProcessedShipment = {
        ...updatedShipment,
        finalStatus,
        formData,
        processedAt: new Date().toISOString(),
        processedBy: user?.name || 'QC Officer',
    };

    setProcessedShipments(prev => [newProcessedShipment, ...prev]);
    
    setSelectedShipmentForNote(newProcessedShipment);
    setIsGrnOpen(true);

    if (finalStatus === 'Approved') {
        const totalRejectedWeight = Object.values(formData.qualityChecks).reduce((acc, check) => acc + (check.rejectedWeight || 0), 0);
        const acceptedWeight = formData.netWeight - totalRejectedWeight;
        const newArEntry: AccountsReceivableEntry = {
            id: `ar-${Date.now()}`,
            customer: formData.customer,
            invoiceId: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            amount: acceptedWeight * 500, // Placeholder
            dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            agingStatus: 'On Time'
        };
        console.log("Adding to AR:", newArEntry);
    }
  };

  const handleViewGrn = (shipment: ProcessedShipment) => {
    setSelectedShipmentForNote(shipment);
    setIsGrnOpen(true);
  };
  
  const qcKpis = {
      awaitingQc: {
          title: 'Shipments Awaiting QC',
          value: String(shipmentsAwaitingQc.length),
          change: 'in the queue',
          changeType: 'increase' as const,
      },
      rejectionRate: {
          title: 'Overall Rejection Rate',
          value: '5.2%',
          change: '-0.3% from last week',
          changeType: 'decrease' as const,
      },
      avgQcTime: {
          title: 'Average QC Time',
          value: '35 mins',
          change: '+2 mins from last week',
          changeType: 'increase' as const,
      }
  }


  return (
    <>
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
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FlaskConical />
                Quality Control Dashboard
              </h2>
              <p className="text-muted-foreground">
                Process incoming shipments, perform quality checks, and generate Goods Received Notes.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="#awaiting-qc-table" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={qcKpis.awaitingQc} icon={ListChecks} />
                </Link>
                <Link href="/analytics" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={qcKpis.rejectionRate} icon={ThumbsDown} />
                </Link>
                <Link href="/analytics" className="block transition-transform hover:scale-[1.02]">
                    <OverviewCard data={qcKpis.avgQcTime} icon={Clock} />
                </Link>
            </div>

            <Tabs defaultValue="receiving" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="receiving">Inbound Receiving QC</TabsTrigger>
                <TabsTrigger value="analysis">Final Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="receiving" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 items-start">
                    <Card id="awaiting-qc-table">
                        <CardHeader>
                            <CardTitle>Shipments Awaiting QC</CardTitle>
                            <CardDescription>Select a shipment from this list to begin processing it in the form below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Shipment ID</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Arrival</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shipmentsAwaitingQc.length > 0 ? shipmentsAwaitingQc.map((shipment) => (
                                        <TableRow key={shipment.id} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell className="font-mono">{shipment.shipmentId}</TableCell>
                                            <TableCell>{shipment.product}</TableCell>
                                            <TableCell>{shipment.customer}</TableCell>
                                            <TableCell>{shipment.expectedArrival ? format(new Date(shipment.expectedArrival), 'HH:mm') : '-'}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No shipments are currently awaiting QC.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Process Shipment</CardTitle>
                            <CardDescription>
                                Fill in the details below to complete the QC check and generate a GRN.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreateShipmentForm onSubmit={handleShipmentSubmission} />
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Generated GRNs & QC Log</CardTitle>
                        <CardDescription>A log of recently processed shipments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shipment ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Accepted Weight</TableHead>
                                        <TableHead>Officer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Decision</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processedShipments.map((shipment) => {
                                        const totalRejectedWeight = Object.values(shipment.formData.qualityChecks).reduce((acc, check) => acc + (check.rejectedWeight || 0), 0);
                                        const acceptedWeight = shipment.formData.netWeight - totalRejectedWeight;
                                        return (
                                            <TableRow key={shipment.id}>
                                                <TableCell className="font-mono">{shipment.shipmentId}</TableCell>
                                                <TableCell>{shipment.customer}</TableCell>
                                                <TableCell className="font-mono">{acceptedWeight.toFixed(2)} kg</TableCell>
                                                <TableCell>{shipment.processedBy}</TableCell>
                                                <TableCell className="text-sm">{format(new Date(shipment.processedAt), 'PPp')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={shipment.finalStatus === 'Approved' ? 'default' : 'destructive'} className="flex items-center gap-1 w-fit">
                                                        {shipment.finalStatus === 'Approved' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                        {shipment.finalStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewGrn(shipment)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View GRN
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {processedShipments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">No shipments processed yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="analysis" className="mt-6">
                <div className="max-w-2xl mx-auto">
                    <ProduceQualityAnalyzer />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </SidebarProvider>
      {selectedShipmentForNote && (
          <GoodsReceivedNoteDialog
            isOpen={isGrnOpen}
            onOpenChange={setIsGrnOpen}
            shipment={selectedShipmentForNote}
          />
        )}
    </>
  );
}

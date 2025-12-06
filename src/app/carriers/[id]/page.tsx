
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { carrierData, shipmentData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Truck, Mail, Phone, TrendingUp, FileText, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { StarRating } from '@/components/ui/star-rating';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function CarrierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carrierId = params.id as string;

  const carrier = carrierData.find((c) => c.id === carrierId);

  const carrierShipments = useMemo(() => {
    if (!carrier) return [];
    return shipmentData.filter(shipment => shipment.carrier === carrier.name);
  }, [carrier]);
  
  if (!carrier) {
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
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2" />
                    Back to Carriers
                </Button>
                <div className="flex items-center justify-center h-64">
                    <p>Carrier not found.</p>
                </div>
            </main>
            </SidebarInset>
      </SidebarProvider>
    );
  }

  const shipmentsOverview = {
    title: 'Total Shipments (YTD)',
    value: carrierShipments.length.toLocaleString(),
    change: `for ${carrier.name}`,
    changeType: 'increase' as const,
  }

  const onTimeDeliveries = carrierShipments.filter(s => s.status === 'Delivered').length;
  const onTimePercentage = carrierShipments.length > 0 ? (onTimeDeliveries / carrierShipments.length) * 100 : 0;
  
  const onTimeOverview = {
    title: 'On-Time Delivery Rate',
    value: `${onTimePercentage.toFixed(1)}%`,
    change: 'all-time',
    changeType: 'increase' as const,
  }

  const statusVariant = {
    Active: 'default',
    Inactive: 'destructive',
  } as const;

  const shipmentStatusVariant = {
    'Awaiting QC': 'destructive',
    'Receiving': 'secondary',
    'Processing': 'default',
    'Preparing for Dispatch': 'secondary',
    'Ready for Dispatch': 'default',
    'In-Transit': 'default',
    'Delivered': 'outline',
    'Delayed': 'destructive',
  } as const;


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
            <div className="mb-6">
                 <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2" />
                    Back to Carriers
                </Button>
                <div className="flex items-center gap-4">
                     <Truck className="h-16 w-16 text-primary" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            {carrier.name}
                            <Badge variant={statusVariant[carrier.status]} className='capitalize text-sm'>{carrier.status}</Badge>
                        </h2>
                        <StarRating rating={carrier.rating} size={20} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <OverviewCard data={shipmentsOverview} icon={Truck} />
                <OverviewCard data={onTimeOverview} icon={TrendingUp} />
                <Card>
                    <CardHeader>
                        <CardTitle className='text-sm font-medium'>Primary Contact</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{carrier.contactName}</p>
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <p className="flex items-center gap-2"><User /> {carrier.idNumber}</p>
                            <p className="flex items-center gap-2"><Mail /> {carrier.contactEmail}</p>
                            <p className="flex items-center gap-2"><Phone /> {carrier.contactPhone}</p>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className='text-sm font-medium'>Primary Vehicle</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-xl font-bold font-mono">{carrier.vehicleRegistration}</p>
                         <p className="text-xs text-muted-foreground">Default assigned vehicle</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp />
                        Shipment History
                    </CardTitle>
                    <CardDescription>
                        A log of all shipments handled by {carrier.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shipment ID</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Tonnage</TableHead>
                                <TableHead>Destination</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {carrierShipments.map((shipment) => (
                                <TableRow key={shipment.id} className="cursor-pointer" onClick={() => router.push(`/traceability?shipmentId=${shipment.shipmentId}`)}>
                                    <TableCell className="font-mono">{shipment.shipmentId}</TableCell>
                                    <TableCell>{shipment.product}</TableCell>
                                    <TableCell>{shipment.weight}</TableCell>
                                    <TableCell>{shipment.destination}</TableCell>
                                    <TableCell>{shipment.expectedArrival ? format(new Date(shipment.expectedArrival), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={shipmentStatusVariant[shipment.status]}>
                                            {shipment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/outbound/manifest/${shipment.id}`);
                                            }}
                                        >
                                            <FileText className="mr-2 h-4 w-4"/>
                                            Manifest
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {carrierShipments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">No shipments found for this carrier.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                   </Table>
                </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

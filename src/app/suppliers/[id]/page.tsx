'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import { shipmentData, type Supplier, type Shipment, type WarehouseData } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, FileText, Package, Mail, Phone, Building, Briefcase, PlusCircle, Eye, Truck, CreditCard, Users, Scale, Box, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DatabaseSupplier {
  id: string;
  name: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  produce_types: string;
  status: string;
  logo_url: string;
  active_contracts: number;
  supplier_code: string;
  kra_pin: string;
  vehicle_number_plate: string;
  driver_name: string;
  driver_id_number: string;
  mpesa_paybill: string;
  mpesa_account_number: string;
  bank_name: string;
  bank_account_number: string;
  password: string;
  created_at: string;
}

interface WarehouseIntakeData {
  id: string;
  shipmentId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  product: string;
  intakeWeight: number;
  countedWeight: number;
  numberOf4kgBoxes: number;
  numberOf10kgCrates: number;
  rejectedWeight: number;
  rejectionReason?: string;
  qualityCheckStatus: 'Passed' | 'Failed' | 'Pending';
  warehouseLocation: string;
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const supplierId = params.id as string;
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [warehouseData, setWarehouseData] = useState<WarehouseIntakeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch supplier from database
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/suppliers/${supplierId}`);
        if (response.ok) {
          const data: DatabaseSupplier = await response.json();
          
          // Convert database format to your app's Supplier format
          const convertedSupplier: Supplier = {
            id: data.id,
            name: data.name,
            location: data.location,
            contactName: data.contact_name,
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone,
            produceTypes: data.produce_types ? JSON.parse(data.produce_types) : [],
            status: data.status as 'Active' | 'Inactive' | 'Onboarding',
            logoUrl: data.logo_url,
            activeContracts: data.active_contracts,
            supplierCode: data.supplier_code,
            kraPin: data.kra_pin,
            vehicleNumberPlate: data.vehicle_number_plate,
            driverName: data.driver_name,
            driverIdNumber: data.driver_id_number,
            mpesaPaybill: data.mpesa_paybill,
            mpesaAccountNumber: data.mpesa_account_number,
            bankName: data.bank_name,
            bankAccountNumber: data.bank_account_number
          };
          
          setSupplier(convertedSupplier);
        } else {
          throw new Error('Failed to fetch supplier');
        }
      } catch (error) {
        console.error('Error fetching supplier:', error);
        toast({
          title: 'Error',
          description: 'Failed to load supplier details',
          variant: 'destructive',
        });
      }
    };

    const fetchWarehouseData = async () => {
      try {
        const response = await fetch(`/api/warehouse-intake?supplierId=${supplierId}`);
        if (response.ok) {
          const data = await response.json();
          setWarehouseData(data);
        } else {
          // Fallback to mock data if API fails
          const mockWarehouseData: WarehouseIntakeData[] = generateMockWarehouseData(supplierId);
          setWarehouseData(mockWarehouseData);
        }
      } catch (error) {
        console.error('Error fetching warehouse data:', error);
        // Fallback to mock data
        const mockWarehouseData: WarehouseIntakeData[] = generateMockWarehouseData(supplierId);
        setWarehouseData(mockWarehouseData);
      }
    };

    if (supplierId) {
      fetchSupplier();
      fetchWarehouseData();
      setIsLoading(false);
    }
  }, [supplierId, toast]);

  // Generate mock warehouse data for demonstration
  const generateMockWarehouseData = (supplierId: string): WarehouseIntakeData[] => {
    const mockData: WarehouseIntakeData[] = [];
    const supplier = supplierData.find(s => s.id === supplierId);
    
    if (!supplier) return mockData;
    
    // Generate 3-5 mock deliveries
    const numberOfDeliveries = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numberOfDeliveries; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7)); // Spread deliveries over weeks
      
      const intakeWeight = Math.floor(Math.random() * 1000) + 500; // 500-1500 kg
      const rejectedWeight = Math.floor(Math.random() * 100); // 0-100 kg
      const countedWeight = intakeWeight - rejectedWeight;
      const numberOf4kgBoxes = Math.floor(countedWeight / 4);
      const numberOf10kgCrates = Math.floor(countedWeight / 10);
      
      mockData.push({
        id: `wh-${supplierId}-${i}`,
        shipmentId: `SH${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${i.toString().padStart(3, '0')}`,
        supplierId: supplierId,
        supplierName: supplier.name,
        date: date.toISOString(),
        product: supplier.produceTypes[Math.floor(Math.random() * supplier.produceTypes.length)] || 'Produce',
        intakeWeight,
        countedWeight,
        numberOf4kgBoxes,
        numberOf10kgCrates,
        rejectedWeight,
        rejectionReason: rejectedWeight > 0 ? 'Quality issues' : undefined,
        qualityCheckStatus: rejectedWeight > 50 ? 'Failed' : 'Passed',
        warehouseLocation: 'Main Warehouse'
      });
    }
    
    return mockData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const supplierShipments = useMemo(() => {
    if (!supplier) return [];
    // A more robust system would use a supplierID on the shipment.
    // For this mock data, we'll assume the origin contains the supplier's name.
    return shipmentData.filter(ship => ship.origin.toLowerCase().includes(supplier.name.toLowerCase().split(' ')[0]));
  }, [supplier]);

  // Calculate totals for the supplier
  const deliveryTotals = useMemo(() => {
    if (warehouseData.length === 0) {
      return {
        totalIntakeWeight: 0,
        totalCountedWeight: 0,
        total4kgBoxes: 0,
        total10kgCrates: 0,
        totalRejectedWeight: 0,
        totalDeliveries: 0
      };
    }

    return warehouseData.reduce((acc, delivery) => ({
      totalIntakeWeight: acc.totalIntakeWeight + delivery.intakeWeight,
      totalCountedWeight: acc.totalCountedWeight + delivery.countedWeight,
      total4kgBoxes: acc.total4kgBoxes + delivery.numberOf4kgBoxes,
      total10kgCrates: acc.total10kgCrates + delivery.numberOf10kgCrates,
      totalRejectedWeight: acc.totalRejectedWeight + delivery.rejectedWeight,
      totalDeliveries: acc.totalDeliveries + 1
    }), {
      totalIntakeWeight: 0,
      totalCountedWeight: 0,
      total4kgBoxes: 0,
      total10kgCrates: 0,
      totalRejectedWeight: 0,
      totalDeliveries: 0
    });
  }, [warehouseData]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                Harir International
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
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2" />
              Back to Suppliers
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-200 animate-pulse rounded-full"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 animate-pulse rounded w-48"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-32"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!supplier) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                Harir International
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
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2" />
              Back to Suppliers
            </Button>
            <p>Supplier not found.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('');

  const statusVariant = {
    Active: 'default',
    Inactive: 'destructive',
    Onboarding: 'secondary',
  } as const;
  
  const shipmentStatusVariant = {
    'Delivered': 'default',
    'In-Transit': 'secondary',
    'Awaiting QC': 'outline',
    'Processing': 'outline',
    'Receiving': 'secondary',
    'Ready for Dispatch': 'default',
    'Preparing for Dispatch': 'default',
    'Delayed': 'destructive',
  } as const;

  const qualityCheckVariant = {
    'Passed': 'default',
    'Failed': 'destructive',
    'Pending': 'secondary'
  } as const;

  const ytdPurchases = {
    title: 'YTD Purchases',
    value: `KES ${(deliveryTotals.totalCountedWeight * 100).toLocaleString()}`, // Assuming 100 KES per kg
    change: `${deliveryTotals.totalDeliveries} deliveries`,
    changeType: 'increase' as const,
  };

  const amountPayable = {
    title: 'Amount Payable',
    value: `KES ${(deliveryTotals.totalRejectedWeight * 100).toLocaleString()}`, // Cost of rejected items
    change: `${deliveryTotals.totalRejectedWeight}kg rejected`,
    changeType: 'decrease' as const,
  };
  
  const handleLogActivitySubmit = () => {
    setIsLogActivityOpen(false);
    toast({
        title: 'Activity Logged',
        description: 'Your new activity has been added to the timeline.'
    });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
              Harir International
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
                 <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2" />
                    Back to Suppliers
                </Button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={supplier.logoUrl} />
                            <AvatarFallback className="text-2xl">{getInitials(supplier.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                {supplier.name}
                                <Badge variant={statusVariant[supplier.status]} className='capitalize text-sm'>{supplier.status}</Badge>
                            </h2>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                              <p className="text-muted-foreground">
                                  {supplier.location}
                              </p>
                              <div className="hidden md:block text-muted-foreground">•</div>
                              <p className="text-muted-foreground">
                                  Code: {supplier.supplierCode || 'N/A'}
                              </p>
                            </div>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button asChild variant="secondary">
                            <Link href={`/suppliers/portal?supplierId=${supplierId}`}>
                                <Eye className="mr-2" />
                                View Supplier Portal
                            </Link>
                        </Button>
                        <Dialog open={isLogActivityOpen} onOpenChange={setIsLogActivityOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2" />
                                    Log Activity
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Log New Activity for {supplier.name}</DialogTitle>
                                    <DialogDescription>Record a new interaction or note.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Textarea placeholder="Type your activity note here..." />
                                </div>
                                <Button onClick={handleLogActivitySubmit}>Log Activity</Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OverviewCard data={ytdPurchases} icon={DollarSign} />
                <OverviewCard data={amountPayable} icon={FileText} />
            </div>

             <Tabs value={activeTab} onValueChange={(value) => router.push(`/suppliers/${supplierId}?tab=${value}`)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="deliveries" className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="hidden sm:inline">Deliveries</span>
                    </TabsTrigger>
                    <TabsTrigger value="financials" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Financials</span>
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Contacts</span>
                    </TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Supplier Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Supplier Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                <span>{supplier.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                <span>Code: {supplier.supplierCode || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <span>Produce: {supplier.produceTypes.join(', ') || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Contact Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                <span>Contact: {supplier.contactName || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span>{supplier.contactEmail || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{supplier.contactPhone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Additional Info */}
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium">Additional Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">KRA PIN</p>
                                        <p className="font-medium">{supplier.kraPin || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Driver</p>
                                        <p className="font-medium">{supplier.driverName || 'Not provided'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Vehicle</p>
                                        <p className="font-medium">{supplier.vehicleNumberPlate || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* Deliveries Tab */}
                <TabsContent value="deliveries" className="mt-6">
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Deliveries</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{deliveryTotals.totalDeliveries}</div>
                                    <p className="text-xs text-muted-foreground">All-time deliveries</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Scale className="h-4 w-4" />
                                        Total Weight
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{deliveryTotals.totalCountedWeight} kg</div>
                                    <p className="text-xs text-muted-foreground">
                                        {deliveryTotals.totalIntakeWeight} kg intake
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Box className="h-4 w-4" />
                                        Total Boxes/Crates
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {deliveryTotals.total4kgBoxes + deliveryTotals.total10kgCrates}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {deliveryTotals.total4kgBoxes} 4kg boxes, {deliveryTotals.total10kgCrates} 10kg crates
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Total Rejected
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-destructive">
                                        {deliveryTotals.totalRejectedWeight} kg
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {((deliveryTotals.totalRejectedWeight / deliveryTotals.totalIntakeWeight) * 100).toFixed(1)}% rejection rate
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Delivery History Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Delivery & Intake History</CardTitle>
                                <CardDescription>Detailed warehouse intake records for each delivery</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {warehouseData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Shipment ID</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead className="text-right">Intake Weight (kg)</TableHead>
                                                    <TableHead className="text-right">Counted Weight (kg)</TableHead>
                                                    <TableHead className="text-right">4kg Boxes</TableHead>
                                                    <TableHead className="text-right">10kg Crates</TableHead>
                                                    <TableHead className="text-right">Rejected (kg)</TableHead>
                                                    <TableHead>QC Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {warehouseData.map((delivery) => (
                                                    <TableRow key={delivery.id} 
                                                        className="cursor-pointer hover:bg-muted/50" 
                                                        onClick={() => router.push(`/traceability?shipmentId=${delivery.shipmentId}`)}>
                                                        <TableCell className="font-mono font-medium">
                                                            {delivery.shipmentId}
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(new Date(delivery.date), 'dd/MM/yyyy')}
                                                        </TableCell>
                                                        <TableCell>{delivery.product}</TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {delivery.intakeWeight.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {delivery.countedWeight.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {delivery.numberOf4kgBoxes.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {delivery.numberOf10kgCrates.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-medium text-destructive">
                                                                    {delivery.rejectedWeight.toLocaleString()}
                                                                </span>
                                                                {delivery.rejectionReason && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {delivery.rejectionReason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={qualityCheckVariant[delivery.qualityCheckStatus]}>
                                                                {delivery.qualityCheckStatus}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No delivery history found for this supplier</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Warehouse intake data will appear here once deliveries are recorded
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Rejection Analysis */}
                        {deliveryTotals.totalRejectedWeight > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                        Rejection Analysis
                                    </CardTitle>
                                    <CardDescription>
                                        Quality issues and rejection patterns for {supplier.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Total Rejected Weight</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Across {warehouseData.filter(d => d.rejectedWeight > 0).length} deliveries
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-destructive">
                                                    {deliveryTotals.totalRejectedWeight} kg
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {((deliveryTotals.totalRejectedWeight / deliveryTotals.totalIntakeWeight) * 100).toFixed(1)}% of total intake
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <p className="font-medium">Common Rejection Reasons:</p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive">
                                                    Quality Issues
                                                </Badge>
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive">
                                                    Underweight Packages
                                                </Badge>
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive">
                                                    Contamination
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
                
                {/* Financials Tab */}
                <TabsContent value="financials" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Payment & Financial Details</CardTitle>
                            <CardDescription>Bank and payment information for this supplier</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Bank Details
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Bank Name</p>
                                                <p className="font-medium">{supplier.bankName || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Account Number</p>
                                                <p className="font-medium">{supplier.bankAccountNumber || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                                            <DollarSign className="h-5 w-5" />
                                            M-Pesa Details
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Paybill Number</p>
                                                <p className="font-medium">{supplier.mpesaPaybill || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Account Number</p>
                                                <p className="font-medium">{supplier.mpesaAccountNumber || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t">
                                        <h4 className="font-medium text-lg mb-4">Tax Information</h4>
                                        <div>
                                            <p className="text-sm text-muted-foreground">KRA PIN</p>
                                            <p className="font-medium">{supplier.kraPin || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* Contacts Tab */}
                <TabsContent value="contacts" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Contact Persons</CardTitle>
                            <CardDescription>Primary and secondary contacts for this supplier</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <div>
                                                <h4 className="font-medium">{supplier.contactName || 'Primary Contact'}</h4>
                                                <p className="text-sm text-muted-foreground">Primary Contact</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Email</p>
                                                    <p className="font-medium">{supplier.contactEmail || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Phone</p>
                                                    <p className="font-medium">{supplier.contactPhone || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Additional contacts can be added here */}
                                <div className="text-center py-4">
                                    <Button variant="outline" onClick={() => setIsLogActivityOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Additional Contact
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
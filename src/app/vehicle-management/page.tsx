'use client';

import { useState, useRef, useEffect } from 'react';
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
import { VisitorDataTable } from '@/components/dashboard/visitor-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateVisitorForm, type VisitorFormValues } from '@/components/dashboard/create-visitor-form';
import { Truck, QrCode, Printer, DoorOpen, Loader2, RefreshCw, Car, Fuel, Gauge } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { GatePassDialog } from '@/components/dashboard/gate-pass-dialog';
import { VisitorDetailDialog } from '@/components/dashboard/visitor-detail-dialog';
import { CheckInDialog } from '@/components/dashboard/check-in-dialog';
import { useToast } from '@/hooks/use-toast';
import { RegistrationSuccess } from '@/components/dashboard/registration-success';
import { PrintableVehicleReport } from '@/components/dashboard/printable-vehicle-report';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Database Visitor type (same as before)
interface DatabaseVisitor {
  id: string;
  visitor_code: string;
  name: string;
  id_number: string;
  company: string;
  phone: string;
  email: string;
  vehicle_plate: string;
  vehicle_type: string;
  cargo_description: string;
  visitor_type: 'visitor' | 'supplier';
  status: 'Pre-registered' | 'Checked-in' | 'Pending Exit' | 'Checked-out';
  check_in_time?: string;
  check_out_time?: string;
  expected_check_in_time: string;
  host_id: string;
  host_name: string;
  department: string;
  created_at: string;
}

// Frontend Visitor type
interface Visitor {
  id: string;
  visitorCode: string;
  name: string;
  idNumber: string;
  company: string;
  email: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string;
  cargoDescription: string;
  visitorType: 'visitor' | 'supplier';
  status: 'Pre-registered' | 'Checked-in' | 'Pending Exit' | 'Checked-out';
  checkInTime?: string;
  checkOutTime?: string;
  expectedCheckInTime: string;
  hostId: string;
  hostName: string;
  department: string;
}

export default function VehicleManagementPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [newlyRegisteredVisitor, setNewlyRegisteredVisitor] = useState<Visitor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('vehicles');
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch visitors (vehicles) from database
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching vehicles from /api/visitors...');
      
      // Only fetch visitors with vehicles
      const response = await fetch('/api/visitors?vehiclePlate=');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
      }
      
      const data: DatabaseVisitor[] = await response.json();
      console.log(`✅ Fetched ${data.length} vehicles from database`);
      
      const convertedVisitors: Visitor[] = data.map(visitor => ({
        id: visitor.id,
        visitorCode: visitor.visitor_code,
        name: visitor.name,
        idNumber: visitor.id_number,
        company: visitor.company,
        email: visitor.email,
        phone: visitor.phone,
        vehiclePlate: visitor.vehicle_plate,
        vehicleType: visitor.vehicle_type,
        cargoDescription: visitor.cargo_description,
        visitorType: visitor.visitor_type as 'visitor' | 'supplier',
        status: visitor.status,
        checkInTime: visitor.check_in_time,
        checkOutTime: visitor.check_out_time,
        expectedCheckInTime: visitor.expected_check_in_time,
        hostId: visitor.host_id,
        hostName: visitor.host_name,
        department: visitor.department,
      }));
      
      // Filter to only show visitors with vehicles
      const vehiclesOnly = convertedVisitors.filter(v => v.vehiclePlate && v.vehiclePlate !== 'N/A');
      setVisitors(vehiclesOnly);
    } catch (error) {
      console.error('❌ Error fetching vehicles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicles from database.',
        variant: 'destructive',
      });
      setVisitors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      await fetchVehicles();
      toast({
        title: 'Data Refreshed',
        description: 'Latest vehicle data has been loaded.',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddVisitor = async (values: VisitorFormValues) => {
    try {
      console.log('🔄 Registering new vehicle with data:', values);
      
      const apiData = {
        name: values.driverName || '',
        id_number: values.idNumber || '',
        company: values.visitorType === 'supplier' ? values.supplierName || '' : '',
        phone: values.phoneNumber || '',
        email: '',
        vehicle_plate: values.vehicleRegNo || '',
        vehicle_type: 'N/A',
        cargo_description: values.cargoDescription || '',
        visitor_type: values.visitorType,
        status: 'Pre-registered',
        expected_check_in_time: `${values.date}T${values.signInTime}:00`,
        host_id: values.department || '',
        department: values.department || '',
      };

      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to register vehicle: ${response.status}`);
      }

      const savedVisitor: DatabaseVisitor = await response.json();
      
      const newVisitor: Visitor = {
        id: savedVisitor.id,
        visitorCode: savedVisitor.visitor_code,
        name: savedVisitor.name,
        idNumber: savedVisitor.id_number,
        company: savedVisitor.company,
        email: savedVisitor.email,
        phone: savedVisitor.phone,
        vehiclePlate: savedVisitor.vehicle_plate,
        vehicleType: savedVisitor.vehicle_type,
        cargoDescription: savedVisitor.cargo_description,
        visitorType: savedVisitor.visitor_type as 'visitor' | 'supplier',
        status: savedVisitor.status,
        expectedCheckInTime: savedVisitor.expected_check_in_time,
        hostId: savedVisitor.host_id,
        hostName: savedVisitor.host_name,
        department: savedVisitor.department,
      };
      
      setVisitors(prev => [newVisitor, ...prev]);
      setNewlyRegisteredVisitor(newVisitor);
      
      toast({
        title: 'Vehicle Registered',
        description: `${newVisitor.name} has been successfully registered.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error registering vehicle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleRegistrationDialogClose = (open: boolean) => {
    if (!open) {
      setNewlyRegisteredVisitor(null);
    }
    setIsRegisterDialogOpen(open);
  };

  const handleCheckIn = async (visitorId: string) => {
    try {
      const visitor = visitors.find(v => v.id === visitorId);
      if (!visitor) return;

      const response = await fetch(`/api/visitors/${visitorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Checked-in',
          check_in_time: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check in vehicle');
      }

      const updatedVisitorData: DatabaseVisitor = await response.json();
      const updatedVisitor: Visitor = {
        ...visitor,
        status: 'Checked-in' as const,
        checkInTime: updatedVisitorData.check_in_time,
      };

      setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
      setIsCheckInDialogOpen(false);
      
      toast({
        title: "Vehicle Checked In",
        description: "The vehicle has been successfully checked in.",
      });

      setSelectedVisitor(updatedVisitor);
      setIsGatePassOpen(true);
      
    } catch (error: any) {
      console.error('Error checking in vehicle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleCheckOut = async (visitorId: string, final: boolean = false) => {
    try {
      const visitor = visitors.find(v => v.id === visitorId);
      if (!visitor) return;

      if (final) {
        const response = await fetch(`/api/visitors/${visitorId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Checked-out',
            check_out_time: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check out vehicle');
        }

        const updatedVisitor = { 
          ...visitor, 
          status: 'Checked-out' as const, 
          checkOutTime: new Date().toISOString() 
        };

        setSelectedVisitor(updatedVisitor);
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        setIsCheckInDialogOpen(false);
        
        toast({
          title: "Vehicle Verified for Exit",
          description: `${visitor.name} has been successfully checked out.`,
        });
      } else {
        const response = await fetch(`/api/visitors/${visitorId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Pending Exit',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initiate checkout');
        }

        const updatedVisitor = { 
          ...visitor, 
          status: 'Pending Exit' as const 
        };

        setSelectedVisitor(updatedVisitor);
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        
        toast({
          title: "Checkout Initiated",
          description: `${visitor.name} is now pending exit. A gate pass has been generated.`,
        });

        setIsGatePassOpen(true);
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process checkout',
        variant: 'destructive',
      });
    }
  };

  const handleRowClick = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setIsDetailDialogOpen(true);
  };

  const handlePrintReport = async () => {
    const element = printRef.current;
    if (element) {
        const canvas = await html2canvas(element, { scale: 2 });
        const data = canvas.toDataURL('image/jpeg');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`vehicle-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    }
  };

  // Calculate statistics
  const vehiclesOnSite = visitors.filter(v => 
    v.status === 'Checked-in' || v.status === 'Pending Exit'
  ).length;

  const pendingExitVehicles = visitors.filter(v => v.status === 'Pending Exit');
  const suppliersOnSite = visitors.filter(v => v.visitorType === 'supplier' && v.status === 'Checked-in').length;

  const preRegisteredVehicles = visitors.filter(v => v.status === 'Pre-registered');

  if (isLoading) {
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
          <div className='non-printable'>
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Vehicle Management
                </h2>
                <p className="text-muted-foreground">
                  Loading data...
                </p>
              </div>
              <Button disabled>
                <Loader2 className="mr-2 animate-spin" />
                Loading...
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
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
          <div className='non-printable'>
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Vehicle Management
                </h2>
                <p className="text-muted-foreground">
                  Manage and track all vehicle deliveries and entries.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="outline" onClick={handlePrintReport}>
                  <Printer className="mr-2" />
                  Download Report
                </Button>
                <Button variant="outline" onClick={() => setIsCheckInDialogOpen(true)}>
                  <QrCode className="mr-2" />
                  Check-in / Verify Exit
                </Button>
                <Dialog open={isRegisterDialogOpen} onOpenChange={handleRegistrationDialogClose}>
                  <DialogTrigger asChild>
                    <Button>
                      <DoorOpen className="mr-2" />
                      Gate In
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    {!newlyRegisteredVisitor ? (
                      <>
                        <DialogHeader>
                          <DialogTitle>Gate In Registration</DialogTitle>
                          <DialogDescription>
                            Register a new vehicle entry at the gate.
                          </DialogDescription>
                        </DialogHeader>
                        <CreateVisitorForm onSubmit={handleAddVisitor} />
                      </>
                    ) : (
                      <RegistrationSuccess 
                        visitor={newlyRegisteredVisitor}
                        onDone={() => handleRegistrationDialogClose(false)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="vehicles">Vehicles On Site</TabsTrigger>
                <TabsTrigger value="suppliers">Supplier Vehicles</TabsTrigger>
                <TabsTrigger value="log">Vehicle Log</TabsTrigger>
              </TabsList>

              <TabsContent value="vehicles" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <OverviewCard data={{
                    title: 'Vehicles On Site',
                    value: String(vehiclesOnSite),
                    change: 'currently on premises',
                    changeType: 'increase' as const,
                  }} icon={Car} />
                  <OverviewCard data={{
                    title: 'Pending Exit',
                    value: String(pendingExitVehicles.length),
                    change: 'awaiting gate verification',
                    changeType: pendingExitVehicles.length > 0 ? 'increase' as const : 'decrease' as const,
                  }} icon={DoorOpen} />
                  <OverviewCard data={{
                    title: 'Suppliers On Site',
                    value: String(suppliersOnSite),
                    change: 'currently delivering',
                    changeType: 'increase' as const,
                  }} icon={Truck} />
                </div>

                <VisitorDataTable 
                  visitors={visitors.filter(v => v.status === 'Checked-in' || v.status === 'Pending Exit')} 
                  onCheckIn={() => setIsCheckInDialogOpen(true)} 
                  onCheckOut={handleCheckOut} 
                  onRowClick={handleRowClick} 
                />
              </TabsContent>

              <TabsContent value="suppliers" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <OverviewCard data={{
                    title: 'Total Suppliers',
                    value: String(visitors.filter(v => v.visitorType === 'supplier').length),
                    change: 'registered in system',
                    changeType: 'increase' as const,
                  }} icon={Truck} />
                  <OverviewCard data={{
                    title: 'Active Deliveries',
                    value: String(suppliersOnSite),
                    change: 'currently delivering',
                    changeType: 'increase' as const,
                  }} icon={Car} />
                  <OverviewCard data={{
                    title: 'Today\'s Suppliers',
                    value: String(visitors.filter(v => 
                      v.visitorType === 'supplier' && 
                      v.expectedCheckInTime && 
                      new Date(v.expectedCheckInTime).toDateString() === new Date().toDateString()
                    ).length),
                    change: 'expected today',
                    changeType: 'increase' as const,
                  }} icon={Gauge} />
                </div>

                <VisitorDataTable 
                  visitors={visitors.filter(v => v.visitorType === 'supplier')} 
                  onCheckIn={() => setIsCheckInDialogOpen(true)} 
                  onCheckOut={handleCheckOut} 
                  onRowClick={handleRowClick} 
                />
              </TabsContent>

              <TabsContent value="log" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Vehicle Maintenance Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-select">Select Vehicle</Label>
                        <Select>
                          <SelectTrigger id="vehicle-select">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {visitors.map(v => (
                              <SelectItem key={v.id} value={v.vehiclePlate}>
                                {v.vehiclePlate} - {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mileage">Mileage (km)</Label>
                        <Input id="mileage" type="number" placeholder="e.g. 120500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fuel">Fuel Added (L)</Label>
                        <Input id="fuel" type="number" placeholder="e.g. 50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maintenance-type">Maintenance Type</Label>
                        <Select>
                          <SelectTrigger id="maintenance-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oil">Oil Change</SelectItem>
                            <SelectItem value="tire">Tire Replacement</SelectItem>
                            <SelectItem value="brake">Brake Service</SelectItem>
                            <SelectItem value="engine">Engine Check</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cost">Cost (Ksh)</Label>
                        <Input id="cost" type="number" placeholder="e.g. 15000" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input id="notes" placeholder="Additional notes..." />
                    </div>
                    <Button className="w-full">
                      <Fuel className="mr-2" />
                      Log Maintenance
                    </Button>
                  </CardContent>
                </Card>

                <VisitorDataTable 
                  visitors={visitors} 
                  onCheckIn={() => setIsCheckInDialogOpen(true)} 
                  onCheckOut={handleCheckOut} 
                  onRowClick={handleRowClick} 
                />
              </TabsContent>
            </Tabs>

            <CheckInDialog
              isOpen={isCheckInDialogOpen}
              onOpenChange={setIsCheckInDialogOpen}
              visitors={preRegisteredVehicles}
              pendingExitVisitors={pendingExitVehicles}
              onCheckIn={handleCheckIn}
              onVerifyExit={(visitorId) => handleCheckOut(visitorId, true)}
            />

            {selectedVisitor && (
              <GatePassDialog 
                isOpen={isGatePassOpen} 
                onOpenChange={setIsGatePassOpen} 
                visitor={selectedVisitor} 
              />
            )}

            {selectedVisitor && (
              <VisitorDetailDialog
                isOpen={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
                visitor={selectedVisitor}
              />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <div className="hidden">
        <div ref={printRef}>
          <PrintableVehicleReport visitors={visitors} />
        </div>
      </div>
    </>
  );
}
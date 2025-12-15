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
import { VehicleDataTable } from '@/components/dashboard/vehicle-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateSupplierGateForm, type SupplierFormValues } from '@/components/dashboard/create-supplier-gate-form';
import { Truck, QrCode, Printer, DoorOpen, Loader2, RefreshCw, CheckCircle, Clock, Calendar, CheckCheck, Package, Fuel, Gauge, AlertCircle } from 'lucide-react';
import { GatePassDialog } from '@/components/dashboard/gate-pass-dialog';
import { useToast } from '@/hooks/use-toast';
import { RegistrationSuccess } from '@/components/dashboard/registration-success';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PrintableVehicleReport } from '@/components/dashboard/printable-vehicle-report';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Supplier Vehicle type definition
interface SupplierVehicle {
  id: string;
  vehicleCode: string;
  driverName: string;
  idNumber: string;
  company: string;
  email: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string;
  cargoDescription: string;
  vehicleTypeCategory: 'supplier';
  status: 'Pre-registered' | 'Checked-in' | 'Pending Exit' | 'Checked-out';
  checkInTime?: string;
  checkOutTime?: string;
  expectedCheckInTime: string;
  hostId: string;
  hostName: string;
  department: string;
}

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<SupplierVehicle[]>([]);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<SupplierVehicle | null>(null);
  const [newlyRegisteredVehicle, setNewlyRegisteredVehicle] = useState<SupplierVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch vehicles from SUPPLIERS database
  useEffect(() => {
    fetchSupplierVehicles();
  }, []);

  const fetchSupplierVehicles = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      console.log('🔄 Fetching supplier vehicles...');
      
      const response = await fetch('/api/suppliers');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Found ${data.length} suppliers`);
      
      // Filter suppliers that have vehicle information
      const vehiclesData = data.filter((supplier: any) => 
        supplier.vehicle_number_plate && supplier.vehicle_number_plate.trim() !== ''
      );
      
      console.log(`📊 Found ${vehiclesData.length} suppliers with vehicles`);
      
      // Convert to SupplierVehicle type with proper status mapping
      const convertedVehicles: SupplierVehicle[] = vehiclesData.map((supplier: any) => ({
        id: supplier.id,
        vehicleCode: supplier.supplier_code || `VEH-${supplier.id}`,
        driverName: supplier.driver_name || supplier.contact_name || 'Unknown Driver',
        idNumber: supplier.driver_id_number || '',
        company: supplier.name || 'Unknown Company',
        email: supplier.contact_email || '',
        phone: supplier.contact_phone || '',
        vehiclePlate: supplier.vehicle_number_plate || '',
        vehicleType: 'Truck', // Default for suppliers
        cargoDescription: supplier.produce_types ? 
          (Array.isArray(supplier.produce_types) ? 
            supplier.produce_types.join(', ') : 
            (typeof supplier.produce_types === 'string' ? 
              JSON.parse(supplier.produce_types || '[]').join(', ') : '')) : '',
        vehicleTypeCategory: 'supplier',
        status: (supplier.vehicle_status as 'Pre-registered' | 'Checked-in' | 'Pending Exit' | 'Checked-out') || 'Pre-registered',
        checkInTime: supplier.vehicle_check_in_time || undefined,
        checkOutTime: supplier.vehicle_check_out_time || undefined,
        expectedCheckInTime: supplier.created_at || new Date().toISOString(),
        hostId: supplier.id,
        hostName: supplier.name || 'Supplier',
        department: supplier.location || '',
      }));
      
      console.log(`🚚 Converted ${convertedVehicles.length} supplier vehicles`);
      setVehicles(convertedVehicles);
      
    } catch (error: any) {
      console.error('❌ Error fetching supplier vehicles:', error);
      setApiError(error.message || 'Could not connect to database');
      
      toast({
        title: 'Database Warning',
        description: 'Could not load supplier vehicles from database.',
        variant: 'destructive',
      });
      
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      await fetchSupplierVehicles();
      toast({
        title: 'Data Refreshed',
        description: 'Latest supplier vehicle data has been loaded.',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh data from server.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle form submission - saves to SUPPLIERS database
  const handleAddVehicle = async (values: SupplierFormValues) => {
    try {
      console.log('🔄 Registering new supplier vehicle with data:', values);
      
      // Generate a unique vehicle code
      const vehicleCode = `SUP-VEH-${Date.now().toString().slice(-6)}`;
      
      // Prepare data for API based on your supplier form fields
      const vehicleData = {
        name: values.company || `${values.driverName}'s Transport`,
        contact_name: values.driverName,
        contact_phone: values.phoneNumber,
        supplier_code: vehicleCode,
        location: 'Gate Registration',
        produce_types: ['Vehicle Delivery'],
        status: 'Active',
        vehicle_number_plate: values.vehicleRegNo,
        driver_name: values.driverName,
        driver_id_number: values.idNumber,
        vehicle_status: 'Pre-registered', // Initial vehicle status
      };

      console.log('📤 Sending to suppliers API:', vehicleData);

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        let errorMessage = 'Failed to register supplier vehicle';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const savedSupplier = await response.json();
      console.log('✅ Supplier vehicle saved:', savedSupplier);
      
      // Create the new vehicle object
      const newVehicle: SupplierVehicle = {
        id: savedSupplier.id,
        vehicleCode: savedSupplier.supplier_code || vehicleCode,
        driverName: savedSupplier.driver_name || values.driverName,
        idNumber: savedSupplier.driver_id_number || values.idNumber,
        company: savedSupplier.name || values.company || `${values.driverName}'s Transport`,
        email: savedSupplier.contact_email || '',
        phone: savedSupplier.contact_phone || values.phoneNumber,
        vehiclePlate: savedSupplier.vehicle_number_plate || values.vehicleRegNo,
        vehicleType: 'Truck',
        cargoDescription: 'Vehicle Delivery',
        vehicleTypeCategory: 'supplier',
        status: 'Pre-registered',
        expectedCheckInTime: savedSupplier.created_at || new Date().toISOString(),
        hostId: savedSupplier.id,
        hostName: savedSupplier.name || 'Supplier',
        department: savedSupplier.location || '',
      };
      
      setVehicles(prev => [newVehicle, ...prev]);
      setNewlyRegisteredVehicle(newVehicle);
      
      toast({
        title: 'Supplier Vehicle Registered',
        description: `${newVehicle.driverName} (${newVehicle.vehiclePlate}) has been successfully registered.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error registering supplier vehicle:', error);
      
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register supplier vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleRegistrationDialogClose = (open: boolean) => {
    if (!open) {
      setNewlyRegisteredVehicle(null);
    }
    setIsRegisterDialogOpen(open);
  };

  const handleCheckIn = async (vehicleId?: string) => {
    if (!vehicleId) {
      toast({
        title: 'No Vehicle Selected',
        description: 'Please select a vehicle to check in.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      if (vehicle.status !== 'Pre-registered') {
        toast({
          title: 'Cannot Check In',
          description: `Vehicle ${vehicle.driverName} is already ${vehicle.status.toLowerCase()}.`,
          variant: 'destructive',
        });
        return;
      }

      // Update vehicle status in database
      const checkInTime = new Date().toISOString();
      const response = await fetch(`/api/suppliers?id=${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_status: 'Checked-in',
          vehicle_check_in_time: checkInTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check in vehicle in database');
      }

      const updatedSupplier = await response.json();
      
      // Update local state
      const updatedVehicle: SupplierVehicle = {
        ...vehicle,
        status: 'Checked-in',
        checkInTime: checkInTime,
      };

      setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
      setSelectedVehicle(updatedVehicle);
      
      toast({
        title: "Vehicle Checked In",
        description: `${vehicle.driverName} has been successfully checked in.`,
      });

      setIsGatePassOpen(true);
      
    } catch (error: any) {
      console.error('Error checking in vehicle:', error);
      
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Failed to check in vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleCheckOut = async (vehicleId: string, final: boolean = false) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      if (final) {
        // Update to checked out in database
        const checkOutTime = new Date().toISOString();
        const response = await fetch(`/api/suppliers?id=${vehicleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_status: 'Checked-out',
            vehicle_check_out_time: checkOutTime,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check out vehicle from database');
        }

        await response.json();
        
        // Update local state
        const updatedVehicle = { 
          ...vehicle, 
          status: 'Checked-out', 
          checkOutTime: checkOutTime,
        };

        setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
        setSelectedVehicle(null);
        
        toast({
          title: "Vehicle Verified for Exit",
          description: `${vehicle.driverName} has been successfully checked out.`,
        });
      } else {
        // Set to pending exit in database
        const response = await fetch(`/api/suppliers?id=${vehicleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_status: 'Pending Exit',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update vehicle status in database');
        }

        await response.json();
        
        // Update local state
        const updatedVehicle = { 
          ...vehicle, 
          status: 'Pending Exit',
        };

        setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
        setSelectedVehicle(updatedVehicle);
        
        toast({
          title: "Checkout Initiated",
          description: `${vehicle.driverName} is now pending exit. A gate pass has been generated.`,
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

  const handleRowClick = (vehicle: SupplierVehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handlePrintReport = async () => {
    const element = printRef.current;
    if (element) {
      try {
        const canvas = await html2canvas(element, { 
          scale: 2,
          useCORS: true,
          logging: false
        });
        const data = canvas.toDataURL('image/jpeg', 0.95);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`supplier-vehicle-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
        
        toast({
          title: 'Report Generated',
          description: 'Supplier vehicle report has been downloaded as PDF.',
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'PDF Generation Failed',
          description: 'Could not generate PDF report.',
          variant: 'destructive',
        });
      }
    }
  };

  // Calculate statistics
  const vehiclesOnSite = vehicles.filter(v => 
    v.status === 'Checked-in' || v.status === 'Pending Exit'
  ).length;

  const pendingExitVehicles = vehicles.filter(v => v.status === 'Pending Exit');
  const preRegisteredVehicles = vehicles.filter(v => v.status === 'Pre-registered');
  const checkedOutVehicles = vehicles.filter(v => v.status === 'Checked-out');

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
          <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Supplier Vehicle Management
                </h2>
                <p className="text-muted-foreground">
                  Loading supplier vehicle data...
                </p>
              </div>
              <Button disabled>
                <Loader2 className="mr-2 animate-spin" />
                Loading...
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
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
          <main className="p-6 space-y-6">
            {apiError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Database Warning</AlertTitle>
                <AlertDescription>
                  {apiError}. You can still manage supplier vehicles locally.
                </AlertDescription>
              </Alert>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-400">
                  Supplier Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage supplier vehicles and deliveries
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePrintReport} 
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Download Report
                </Button>
                <Button 
                  variant="default"
                  onClick={() => selectedVehicle && handleCheckIn(selectedVehicle.id)}
                  disabled={!selectedVehicle || selectedVehicle.status !== 'Pre-registered'}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCheck className="h-4 w-4" />
                  Check In Selected
                </Button>
                <Button 
                  variant="default"
                  onClick={() => selectedVehicle && handleCheckOut(selectedVehicle.id, false)}
                  disabled={!selectedVehicle || selectedVehicle.status !== 'Checked-in'}
                  className="gap-2 bg-amber-600 hover:bg-amber-700"
                >
                  <DoorOpen className="h-4 w-4" />
                  Check Out Now
                </Button>
                <Button 
                  variant="default"
                  onClick={() => selectedVehicle && handleCheckOut(selectedVehicle.id, true)}
                  disabled={!selectedVehicle || selectedVehicle.status !== 'Pending Exit'}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Verify Exit
                </Button>
                <Dialog open={isRegisterDialogOpen} onOpenChange={handleRegistrationDialogClose}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-primary hover:bg-primary/90">
                      <Truck className="h-4 w-4" />
                      New Supplier Vehicle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    {!newlyRegisteredVehicle ? (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Register Supplier Vehicle</DialogTitle>
                          <DialogDescription>
                            Register a new supplier vehicle entry at the gate
                          </DialogDescription>
                        </DialogHeader>
                        <CreateSupplierGateForm onSubmit={handleAddVehicle} />
                      </>
                    ) : (
                      <RegistrationSuccess 
                        visitor={newlyRegisteredVehicle}
                        onDone={() => handleRegistrationDialogClose(false)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Selection Info Banner */}
            {selectedVehicle && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">
                        Selected Vehicle: {selectedVehicle.driverName} ({selectedVehicle.company})
                      </p>
                      <div className="text-sm text-blue-950">
                        Plate: {selectedVehicle.vehiclePlate} • Status: 
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                          {selectedVehicle.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVehicle(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear Selection
                  </Button>
                </div>
                {selectedVehicle.status === 'Pre-registered' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-blue-700">
                      <CheckCheck className="inline h-4 w-4 mr-1" />
                      Ready to check in. Click "Check In Selected" button above.
                    </div>
                  </div>
                )}
                {selectedVehicle.status === 'Checked-in' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-amber-700">
                      <DoorOpen className="inline h-4 w-4 mr-1" />
                      Ready to check out. Click "Check Out Now" button above.
                    </div>
                  </div>
                )}
                {selectedVehicle.status === 'Pending Exit' && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-green-700">
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      Ready to verify exit. Click "Verify Exit" button above.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
                    <h3 className="text-2xl font-bold mt-1 text-white-900">{vehicles.length}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Truck className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Registered</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">On Site</p>
                    <h3 className="text-2xl font-bold mt-1 text-white-900">{vehiclesOnSite}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      <span>Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Pre-registered</p>
                    <h3 className="text-2xl font-bold mt-1 text-white-900">{preRegisteredVehicles.length}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1 text-amber-500" />
                      <span>Scheduled</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-gray-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Checked Out</p>
                    <h3 className="text-2xl font-bold mt-1 text-white-900">{checkedOutVehicles.length}</h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      <span>Completed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Supplier Vehicle Logs</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Total: {vehicles.length}
                    </Badge>
                  </div>
                </div>
                <Separator className="my-4" />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      On Site
                      {vehicles.filter(v => v.status === 'Checked-in').length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {vehicles.filter(v => v.status === 'Checked-in').length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Exit
                      {pendingExitVehicles.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {pendingExitVehicles.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Completed
                      {checkedOutVehicles.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {checkedOutVehicles.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">All Supplier Vehicles</h3>
                          <p className="text-sm text-gray-500">
                            Complete list of all supplier vehicles in the system
                          </p>
                        </div>
                        <Badge variant="outline">
                          {vehicles.length} Vehicles
                        </Badge>
                      </div>
                      {vehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Supplier Vehicles</h3>
                            <p className="text-gray-500 mb-4">
                              No supplier vehicles found in the database.
                            </p>
                            <Button onClick={() => setIsRegisterDialogOpen(true)}>
                              <Truck className="mr-2 h-4 w-4" />
                              Register First Vehicle
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <VehicleDataTable 
                          vehicles={vehicles}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                          onRowClick={handleRowClick}
                          selectedVehicleId={selectedVehicle?.id}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Active Vehicles Tab */}
                  <TabsContent value="active" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Vehicles Currently On Site</h3>
                          <p className="text-sm text-gray-500">
                            Supplier vehicles that are checked in and making deliveries
                          </p>
                        </div>
                        <Badge variant="outline">
                          {vehicles.filter(v => v.status === 'Checked-in').length} Active
                        </Badge>
                      </div>
                      {vehicles.filter(v => v.status === 'Checked-in').length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Active Vehicles</h3>
                            <p className="text-gray-500 mb-4">
                              No supplier vehicles are currently on site.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <VehicleDataTable 
                          vehicles={vehicles.filter(v => v.status === 'Checked-in')}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                          onRowClick={handleRowClick}
                          selectedVehicleId={selectedVehicle?.id}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Pending Exit Tab */}
                  <TabsContent value="pending" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Vehicles Pending Exit</h3>
                          <p className="text-sm text-gray-500">
                            Supplier vehicles awaiting exit verification
                          </p>
                        </div>
                        <Badge variant="outline">
                          {pendingExitVehicles.length} Pending
                        </Badge>
                      </div>
                      {pendingExitVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Pending Exits</h3>
                            <p className="text-gray-500 mb-4">
                              No supplier vehicles are pending exit.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <VehicleDataTable 
                          vehicles={pendingExitVehicles}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                          onRowClick={handleRowClick}
                          selectedVehicleId={selectedVehicle?.id}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Completed Tab */}
                  <TabsContent value="completed" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Completed Deliveries</h3>
                          <p className="text-sm text-gray-500">
                            Supplier vehicles that have completed their deliveries and checked out
                          </p>
                        </div>
                        <Badge variant="outline">
                          {checkedOutVehicles.length} Completed
                        </Badge>
                      </div>
                      {checkedOutVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Completed Deliveries</h3>
                            <p className="text-gray-500 mb-4">
                              No supplier vehicles have completed deliveries yet.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <VehicleDataTable 
                          vehicles={checkedOutVehicles}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                          onRowClick={handleRowClick}
                          selectedVehicleId={selectedVehicle?.id}
                        />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>

            {/* Gate Pass Dialog */}
            {selectedVehicle && (
              <GatePassDialog 
                isOpen={isGatePassOpen} 
                onOpenChange={setIsGatePassOpen} 
                visitor={selectedVehicle} 
              />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      
      {/* Hidden printable report */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintableVehicleReport visitors={vehicles} shipments={[]} />
        </div>
      </div>
    </>
  );
}
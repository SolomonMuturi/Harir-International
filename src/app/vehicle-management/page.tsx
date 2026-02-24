'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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
import { 
  Truck, 
  QrCode, 
  Printer, 
  DoorOpen, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Calendar, 
  CheckCheck, 
  Package, 
  Fuel, 
  Gauge, 
  AlertCircle, 
  Download, 
  Search, 
  X,
  History,
  Users,
  TrendingUp,
  Filter,
  Plus,
  BarChart3,
  Hash,
  Fingerprint,
  Key,
  Menu
} from 'lucide-react';
import { GatePassDialog } from '@/components/dashboard/gate-pass-dialog';
import { useToast } from '@/hooks/use-toast';
import { RegistrationSuccess } from '@/components/dashboard/registration-success';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, subDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PrintableVehicleReport } from '@/components/dashboard/printable-vehicle-report';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

// Updated Vehicle Visit type with gate entry tracking
interface VehicleVisit {
  id: string;
  visitNumber: number;
  supplierId: string;
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
  registeredAt: string;
  expectedCheckInTime: string;
  hostId: string;
  hostName: string;
  department: string;
  isReturningSupplier: boolean;
  totalVisits?: number;
  
  // New gate entry fields
  gateEntryId?: string;           // Unique ID for this gate entry (GATE-YYYYMMDD-XXXX)
  gateEntryNumber?: number;        // Sequential number for the day
  gateEntryDate?: string;          // Date part (YYYYMMDD)
  isRecheckIn?: boolean;           // Whether this is a recheck-in
  previousGateEntryId?: string;    // Previous gate entry ID if rechecked in
}

type DateRange = {
  from: Date;
  to: Date;
};

interface VisitStats {
  totalVisits: number;
  uniqueSuppliers: number;
  activeVisits: number;
  todayVisits: number;
  todayGateEntries: number;        // New: Today's gate entries
  returningRate: number;
  averageVisitsPerSupplier: number;
}

export default function VehicleManagementPage() {
  // Permission check: Only allow users with 'vehicle_log.view'
  const { data: session, status } = useSession();
  const userPermissions = session?.user?.permissions || [];
  const hasVehicleLogPermission = userPermissions.includes('vehicle_log.view');
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Checking permissions...</span>
      </div>
    );
  }
  if (!hasVehicleLogPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Unauthorized</h2>
          <p className="text-gray-500">You do not have permission to view vehicle logs.</p>
        </div>
      </div>
    );
  }
  // State for visits
  const [vehicles, setVehicles] = useState<VehicleVisit[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleVisit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gateEntryFilter, setGateEntryFilter] = useState<string>(''); // New: Filter by gate entry ID
  
  // UI State
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleVisit | null>(null);
  const [newlyRegisteredVehicle, setNewlyRegisteredVehicle] = useState<VehicleVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [apiError, setApiError] = useState<string | null>(null);
  const [stats, setStats] = useState<VisitStats>({
    totalVisits: 0,
    uniqueSuppliers: 0,
    activeVisits: 0,
    todayVisits: 0,
    todayGateEntries: 0,
    returningRate: 0,
    averageVisitsPerSupplier: 0
  });
  
  // Mobile UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  
  // Date range for history
  const [historyDateRange, setHistoryDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch all visits
  const fetchSupplierVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      console.log('🔄 Fetching vehicle visits...');
      
      const response = await fetch('/api/vehicle-visits?includeSupplier=true&limit=500');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch visits: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Found ${data.visits.length} visits`);
      
      // Convert to VehicleVisit type
      const convertedVisits: VehicleVisit[] = data.visits.map((visit: any) => {
        const supplier = visit.supplier || {};
        const visitNumber = visit.visit_number || 1;
        
        return {
          id: visit.id,
          visitNumber: visitNumber,
          supplierId: visit.supplier_id,
          vehicleCode: supplier.supplier_code || `VISIT-${visit.id.slice(-6)}`,
          driverName: visit.driver_name || supplier.driver_name || supplier.contact_name || 'Unknown Driver',
          idNumber: visit.driver_id_number || supplier.driver_id_number || '',
          company: supplier.name || 'Unknown Company',
          email: supplier.contact_email || '',
          phone: supplier.contact_phone || '',
          vehiclePlate: visit.vehicle_plate || supplier.vehicle_number_plate || '',
          vehicleType: supplier.vehicle_type || 'Truck',
          cargoDescription: visit.cargo_description || 'Avocado Delivery',
          vehicleTypeCategory: 'supplier',
          status: visit.status || 'Pre-registered',
          checkInTime: visit.check_in_time || undefined,
          checkOutTime: visit.check_out_time || undefined,
          registeredAt: visit.registered_at || visit.created_at,
          expectedCheckInTime: visit.registered_at || new Date().toISOString(),
          hostId: supplier.id,
          hostName: supplier.name || 'Supplier',
          department: supplier.location || '',
          isReturningSupplier: visitNumber > 1,
          totalVisits: supplier._count?.visits || visitNumber,
          
          // New gate entry fields
          gateEntryId: visit.gate_entry_id || undefined,
          gateEntryNumber: visit.gate_entry_number || undefined,
          gateEntryDate: visit.gate_entry_date || undefined,
          isRecheckIn: visit.is_recheck_in || false,
          previousGateEntryId: visit.previous_gate_entry_id || undefined
        };
      });
      
      setVehicles(convertedVisits);
      
      // Calculate stats
      const uniqueSupplierIds = new Set(convertedVisits.map(v => v.supplierId));
      const activeCount = convertedVisits.filter(v => 
        ['Pre-registered', 'Checked-in'].includes(v.status)
      ).length;
      
      const today = new Date().toDateString();
      const todayVisits = convertedVisits.filter(v => {
        const visitDate = parseISO(v.registeredAt);
        return visitDate.toDateString() === today;
      }).length;
      
      // Today's gate entries (check-ins today)
      const todayGateEntries = convertedVisits.filter(v => {
        if (!v.checkInTime) return false;
        const checkInDate = parseISO(v.checkInTime);
        return checkInDate.toDateString() === today;
      }).length;
      
      const returningCount = convertedVisits.filter(v => v.visitNumber > 1).length;
      const returningRate = convertedVisits.length > 0 
        ? Math.round((returningCount / convertedVisits.length) * 100) 
        : 0;
      
      const avgVisits = uniqueSupplierIds.size > 0
        ? Math.round((convertedVisits.length / uniqueSupplierIds.size) * 10) / 10
        : 0;
      
      setStats({
        totalVisits: convertedVisits.length,
        uniqueSuppliers: uniqueSupplierIds.size,
        activeVisits: activeCount,
        todayVisits: todayVisits,
        todayGateEntries: todayGateEntries,
        returningRate: returningRate,
        averageVisitsPerSupplier: avgVisits
      });
      
    } catch (error: any) {
      console.error('❌ Error fetching visits:', error);
      setApiError(error.message || 'Could not connect to database');
      
      toast({
        title: 'Database Warning',
        description: 'Could not load vehicle visits from database.',
        variant: 'destructive',
      });
      
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchSupplierVehicles();
  }, [fetchSupplierVehicles]);

  // Filter vehicles based on search, status, gate entry, and active tab
  useEffect(() => {
    let filtered = [...vehicles];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    
    // Apply gate entry ID filter
    if (gateEntryFilter) {
      filtered = filtered.filter(v => 
        v.gateEntryId?.toLowerCase().includes(gateEntryFilter.toLowerCase())
      );
    }
    
    // Apply tab-specific filters
    if (activeTab === 'active') {
      filtered = filtered.filter(v => ['Pre-registered', 'Checked-in'].includes(v.status));
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(v => v.status === 'Pending Exit');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(v => v.status === 'Checked-out');
      // Apply date range for completed
      filtered = filtered.filter(v => {
        if (!v.checkOutTime) return false;
        const checkOutDate = parseISO(v.checkOutTime);
        return isWithinInterval(checkOutDate, {
          start: startOfDay(historyDateRange.from),
          end: endOfDay(historyDateRange.to)
        });
      });
    } else if (activeTab === 'gate-entries') {
      // New tab: Show only vehicles with gate entries (checked in)
      filtered = filtered.filter(v => v.gateEntryId);
      // Sort by most recent gate entry
      filtered.sort((a, b) => {
        if (!a.checkInTime) return 1;
        if (!b.checkInTime) return -1;
        return new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime();
      });
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.driverName.toLowerCase().includes(query) ||
        v.company.toLowerCase().includes(query) ||
        v.vehiclePlate.toLowerCase().includes(query) ||
        v.vehicleCode.toLowerCase().includes(query) ||
        v.phone.toLowerCase().includes(query) ||
        v.status.toLowerCase().includes(query) ||
        v.vehicleType.toLowerCase().includes(query) ||
        `#${v.visitNumber}`.includes(query) ||
        // Search by gate entry ID
        (v.gateEntryId && v.gateEntryId.toLowerCase().includes(query)) ||
        (v.previousGateEntryId && v.previousGateEntryId.toLowerCase().includes(query))
      );
    }
    
    setFilteredVehicles(filtered);
  }, [vehicles, searchQuery, statusFilter, gateEntryFilter, activeTab, historyDateRange]);

  const refreshAllData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      await fetchSupplierVehicles();
      toast({
        title: 'Data Refreshed',
        description: 'Latest vehicle visit data has been loaded.',
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setGateEntryFilter('');
  };

  // Handle new vehicle registration (creates a visit)
  const handleAddVehicle = async (values: SupplierFormValues) => {
    try {
      console.log('🔄 Registering new vehicle visit with data:', values);
      
      const response = await fetch('/api/vehicle-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.company || values.driverName,
          contact_name: values.driverName,
          contact_phone: values.phoneNumber,
          vehicle_number_plate: values.vehicleRegNo,
          vehicle_type: values.vehicleType,
          driver_name: values.driverName,
          driver_id_number: values.idNumber,
          cargo_description: 'Avocado Delivery',
          fruit_varieties: ['Avocado'],
          location: 'Gate Registration'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register vehicle visit');
      }

      const data = await response.json();
      console.log('✅ Vehicle visit created:', data);
      
      // Create the new visit object (gateEntryId will be null until check-in)
      const newVehicle: VehicleVisit = {
        id: data.visit.id,
        visitNumber: data.visit.visit_number,
        supplierId: data.supplier.id,
        vehicleCode: data.supplier.supplier_code || `VISIT-${data.visit.id.slice(-6)}`,
        driverName: data.visit.driver_name || values.driverName,
        idNumber: data.visit.driver_id_number || values.idNumber,
        company: data.supplier.name || values.company || values.driverName,
        email: data.supplier.contact_email || '',
        phone: data.supplier.contact_phone || values.phoneNumber,
        vehiclePlate: data.visit.vehicle_plate || values.vehicleRegNo,
        vehicleType: data.supplier.vehicle_type || values.vehicleType,
        cargoDescription: data.visit.cargo_description || 'Avocado Delivery',
        vehicleTypeCategory: 'supplier',
        status: data.visit.status,
        registeredAt: data.visit.registered_at,
        expectedCheckInTime: data.visit.registered_at,
        hostId: data.supplier.id,
        hostName: data.supplier.name || 'Supplier',
        department: data.supplier.location || '',
        isReturningSupplier: data.visit.visit_number > 1,
        totalVisits: data.visit.visit_number,
        
        // Gate entry fields (null initially)
        gateEntryId: undefined,
        gateEntryNumber: undefined,
        gateEntryDate: undefined,
        isRecheckIn: false,
        previousGateEntryId: undefined
      };
      
      setVehicles(prev => [newVehicle, ...prev]);
      setNewlyRegisteredVehicle(newVehicle);
      
      toast({
        title: data.isNewSupplier ? 'New Supplier Registered' : 'Returning Supplier',
        description: data.message,
      });
      
    } catch (error: any) {
      console.error('❌ Error registering vehicle visit:', error);
      
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register vehicle visit',
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

  // Handle check-in (generates gate entry ID automatically)
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

      // Allow re-checking in for vehicles that are checked out
      if (vehicle.status !== 'Pre-registered') {
        toast({
          title: 'Cannot Check In',
          description: `Visit #${vehicle.visitNumber} is currently ${vehicle.status.toLowerCase()}. Can only check in when status is Pre-registered.`,
          variant: 'destructive',
        });
        return;
      }

      const checkInTime = new Date().toISOString();
      const response = await fetch(`/api/vehicle-visits?id=${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Checked-in',
          checkInTime: checkInTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check in vehicle');
      }

      const data = await response.json();
      
      // Update local state with gate entry ID from response
      const updatedVehicle: VehicleVisit = {
        ...vehicle,
        status: 'Checked-in',
        checkInTime: checkInTime,
        checkOutTime: undefined,
        gateEntryId: data.visit.gate_entry_id,
        gateEntryNumber: data.visit.gate_entry_number,
        gateEntryDate: data.visit.gate_entry_date
      };

      setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
      setSelectedVehicle(updatedVehicle);

      toast({
        title: "Vehicle Checked In",
        description: `Checked in with Gate ID: ${data.visit.gate_entry_id}`,
      });

      setIsGatePassOpen(true);
      
    } catch (error: any) {
      console.error('Error checking in:', error);
      
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Failed to check in vehicle',
        variant: 'destructive',
      });
    }
  };

  // Handle check-out
  const handleCheckOut = async (vehicleId: string, final: boolean = false) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const newStatus = final ? 'Checked-out' : 'Pending Exit';
      
      const response = await fetch(`/api/vehicle-visits?id=${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...(final && { checkOutTime: new Date().toISOString() })
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update visit status');
      }

      const data = await response.json();
      
      // Update local state
      const updatedVehicle: VehicleVisit = { 
        ...vehicle, 
        status: newStatus,
        ...(final && { checkOutTime: data.visit.check_out_time })
      };

      setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
      
      if (final) {
        setSelectedVehicle(null);
        toast({
          title: "Vehicle Verified for Exit",
          description: `Visit #${vehicle.visitNumber} has been checked out.`,
        });
      } else {
        setSelectedVehicle(updatedVehicle);
        toast({
          title: "Checkout Initiated",
          description: `Visit #${vehicle.visitNumber} is now pending exit.`,
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

  const handleRowClick = (vehicle: VehicleVisit) => {
    setSelectedVehicle(vehicle);
    // Close mobile action sheet when selecting a vehicle
    setIsActionsSheetOpen(false);
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
        pdf.save(`vehicle-visits-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
        
        toast({
          title: 'Report Generated',
          description: 'Vehicle visits report has been downloaded as PDF.',
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

  // Calculate filtered completed vehicles based on date range
  const checkedOutVehicles = vehicles.filter(v => v.status === 'Checked-out');
  
  const filteredCompletedVehicles = checkedOutVehicles.filter(vehicle => {
    if (!vehicle.checkOutTime) return false;
    const checkOutDate = parseISO(vehicle.checkOutTime);
    return isWithinInterval(checkOutDate, {
      start: startOfDay(historyDateRange.from),
      end: endOfDay(historyDateRange.to)
    });
  });

  // Calculate statistics for UI
  const vehiclesOnSite = vehicles.filter(v => 
    v.status === 'Checked-in' || v.status === 'Pending Exit'
  ).length;

  const pendingExitVehicles = vehicles.filter(v => v.status === 'Pending Exit');
  const preRegisteredVehicles = vehicles.filter(v => v.status === 'Pre-registered');
  const gateEntryVehicles = vehicles.filter(v => v.gateEntryId); // Vehicles with gate entries

  // Helper function to escape CSV fields
  const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
      return '';
    }
    const stringField = String(field);
    if (/[",\n]/.test(stringField)) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  // Convert to CSV
  const convertToCsv = (data: any[], headers: string[]): string => {
    const headerRow = headers.map(escapeCsvField).join(',');
    const dataRows = data.map(row => 
      headers.map(header => {
        const headerKey = header.toLowerCase().replace(/\s+/g, '_');
        return escapeCsvField(
          row[headerKey as keyof typeof row] ?? 
          (row as any)[header] ?? 
          (row as any)[header.toLowerCase()] ?? 
          ''
        );
      }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
  };

  // Export all visits to CSV with gate entry info
  const exportAllVehiclesToCSV = async () => {
    if (vehicles.length === 0) {
      toast({
        title: 'No Data',
        description: 'No vehicle visits found to export.',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingCSV(true);
    try {
      const headers = [
        'Visit #',
        'Gate Entry ID',
        'Driver Name',
        'ID Number',
        'Company',
        'Phone',
        'Vehicle Plate',
        'Vehicle Type',
        'Cargo Description',
        'Status',
        'Registered At',
        'Check-in Time',
        'Check-out Time',
        'Visit Type',
        'Recheck-in',
        'Previous Gate ID',
        'Department'
      ];
      
      const data = vehicles.map(vehicle => ({
        'Visit #': `#${vehicle.visitNumber}`,
        'Gate Entry ID': vehicle.gateEntryId || 'Not checked in',
        'Driver Name': vehicle.driverName,
        'ID Number': vehicle.idNumber,
        'Company': vehicle.company,
        'Phone': vehicle.phone,
        'Vehicle Plate': vehicle.vehiclePlate || 'None',
        'Vehicle Type': vehicle.vehicleType,
        'Cargo Description': vehicle.cargoDescription,
        'Status': vehicle.status,
        'Registered At': format(parseISO(vehicle.registeredAt), 'yyyy-MM-dd HH:mm:ss'),
        'Check-in Time': vehicle.checkInTime ? format(parseISO(vehicle.checkInTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Check-out Time': vehicle.checkOutTime ? format(parseISO(vehicle.checkOutTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        'Visit Type': vehicle.isReturningSupplier ? 'Returning' : 'New',
        'Recheck-in': vehicle.isRecheckIn ? 'Yes' : 'No',
        'Previous Gate ID': vehicle.previousGateEntryId || 'N/A',
        'Department': vehicle.department || ''
      }));

      const csvContent = convertToCsv(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const filename = `all_visits_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Export Complete',
        description: `All visits (${vehicles.length} records) have been downloaded.`,
      });
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to generate CSV file. Please try again.',
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Mobile action buttons component
  const MobileActionButtons = () => (
    <div className="flex flex-col gap-2 p-4">
      <Button
        variant="outline"
        onClick={refreshAllData}
        disabled={isRefreshing}
        className="w-full justify-start gap-2"
      >
        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Refresh Data
      </Button>
      <Button
        variant="outline"
        onClick={handlePrintReport}
        className="w-full justify-start gap-2"
      >
        <Printer className="h-4 w-4" />
        Download PDF Report
      </Button>
      <Button
        variant="outline"
        onClick={exportAllVehiclesToCSV}
        disabled={vehicles.length === 0 || isExportingCSV}
        className="w-full justify-start gap-2"
      >
        {isExportingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Export All CSV ({vehicles.length})
      </Button>
      <Separator className="my-2" />
      {selectedVehicle && (
        <>
          <Button
            variant="default"
            onClick={() => handleCheckIn(selectedVehicle.id)}
            disabled={!['Pre-registered', 'Checked-out'].includes(selectedVehicle.status)}
            className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700"
          >
            <Key className="h-4 w-4" />
            Check In
          </Button>
          <Button
            variant="default"
            onClick={() => handleCheckOut(selectedVehicle.id, false)}
            disabled={selectedVehicle.status !== 'Checked-in'}
            className="w-full justify-start gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <DoorOpen className="h-4 w-4" />
            Check Out Now
          </Button>
          <Button
            variant="default"
            onClick={() => handleCheckOut(selectedVehicle.id, true)}
            disabled={selectedVehicle.status !== 'Pending Exit'}
            className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="h-4 w-4" />
            Verify Exit
          </Button>
        </>
      )}
    </div>
  );

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
          <div className='non-printable'>
            <Header />
          </div>
          <main className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading vehicle visits...</p>
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
                Harir International
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
            <main className="p-2 sm:p-4 md:p-6 space-y-3 md:space-y-6">
            {apiError && (
              <Alert variant="destructive" className="mb-4 md:mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Database Warning</AlertTitle>
                <AlertDescription>
                  {apiError}. You can still manage vehicle visits locally.
                </AlertDescription>
              </Alert>
            )}

            {/* Header Section - Mobile Optimized */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                    Vehicle Visit Management
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
                    Track and manage all vehicle visits
                  </p>
                </div>
                
                {/* Mobile Menu Button */}
                <div className="flex md:hidden gap-2 mt-2 sm:mt-0">
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                      <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                        <SheetDescription>
                          Quick actions and filters
                        </SheetDescription>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                        <div className="space-y-4 p-2">
                          <Button
                            onClick={() => {
                              setIsRegisterDialogOpen(true);
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full gap-2 bg-primary hover:bg-primary/90"
                          >
                            <Truck className="h-4 w-4" />
                            New Vehicle Visit
                          </Button>
                          
                          <Separator />
                          
                          <h3 className="font-medium text-sm">Quick Actions</h3>
                          <MobileActionButtons />
                          
                          <Separator />
                          
                          <h3 className="font-medium text-sm">Filters</h3>
                          <div className="space-y-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Pre-registered">Pre-registered</SelectItem>
                                <SelectItem value="Checked-in">Checked-in</SelectItem>
                                <SelectItem value="Pending Exit">Pending Exit</SelectItem>
                                <SelectItem value="Checked-out">Checked-out</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Input
                              placeholder="Filter by Gate ID..."
                              value={gateEntryFilter}
                              onChange={(e) => setGateEntryFilter(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex flex-wrap gap-2 items-center">
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
                    Download PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={exportAllVehiclesToCSV}
                    disabled={vehicles.length === 0 || isExportingCSV}
                    className="gap-2"
                  >
                    {isExportingCSV ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export CSV
                  </Button>
                  {selectedVehicle && (
                    <>
                      <Button 
                        variant="default"
                        onClick={() => handleCheckIn(selectedVehicle.id)}
                        disabled={!['Pre-registered', 'Checked-out'].includes(selectedVehicle.status)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Key className="h-4 w-4" />
                        Check In
                      </Button>
                      <Button 
                        variant="default"
                        onClick={() => handleCheckOut(selectedVehicle.id, false)}
                        disabled={selectedVehicle.status !== 'Checked-in'}
                        className="gap-2 bg-amber-600 hover:bg-amber-700"
                      >
                        <DoorOpen className="h-4 w-4" />
                        Check Out
                      </Button>
                      <Button 
                        variant="default"
                        onClick={() => handleCheckOut(selectedVehicle.id, true)}
                        disabled={selectedVehicle.status !== 'Pending Exit'}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Verify Exit
                      </Button>
                    </>
                  )}
                  <Dialog open={isRegisterDialogOpen} onOpenChange={handleRegistrationDialogClose}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Truck className="h-4 w-4" />
                        Vehicle Gate In
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
                      {!newlyRegisteredVehicle ? (
                        <>
                          <DialogHeader>
                            <DialogTitle className="text-xl md:text-2xl">Register Vehicle Visit</DialogTitle>
                            <DialogDescription>
                              Register a new vehicle visit at the gate
                            </DialogDescription>
                          </DialogHeader>
                          <CreateSupplierGateForm onSubmit={handleAddVehicle} />
                        </>
                      ) : (
                        <RegistrationSuccess 
                          visitor={{
                            ...newlyRegisteredVehicle,
                            name: newlyRegisteredVehicle.driverName,
                            company: newlyRegisteredVehicle.company,
                            vehicleRegNo: newlyRegisteredVehicle.vehiclePlate,
                            vehicleType: newlyRegisteredVehicle.vehicleType,
                            phoneNumber: newlyRegisteredVehicle.phone
                          }}
                          onDone={() => handleRegistrationDialogClose(false)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Mobile New Visit Button */}
              <div className="flex md:hidden">
                <Button
                  onClick={() => setIsRegisterDialogOpen(true)}
                  className="w-full gap-2 bg-primary hover:bg-primary/90 text-sm py-2"
                >
                  <Truck className="h-4 w-4" />
                  New Vehicle Visit
                </Button>
              </div>
            </div>

            {/* Selection Info Banner - Mobile Optimized */}
            {selectedVehicle && (
              <div className={`border rounded-lg p-2 sm:p-3 md:p-4 ${
                selectedVehicle.isRecheckIn 
                  ? 'bg-purple-50 border-purple-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex flex-col xs:flex-row items-start justify-between gap-2 xs:gap-4">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div className={`rounded-full p-1 md:p-1.5 flex-shrink-0 ${
                      selectedVehicle.isRecheckIn ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {selectedVehicle.gateEntryId ? (
                        <Fingerprint className={`h-4 w-4 md:h-5 md:w-5 ${
                          selectedVehicle.isRecheckIn ? 'text-purple-600' : 'text-blue-600'
                        }`} />
                      ) : (
                        <Hash className={`h-4 w-4 md:h-5 md:w-5 ${
                          selectedVehicle.isRecheckIn ? 'text-purple-600' : 'text-blue-600'
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium text-xs sm:text-sm md:text-base truncate ${
                        selectedVehicle.isRecheckIn ? 'text-purple-800' : 'text-blue-800'
                      }`}>
                        Visit #{selectedVehicle.visitNumber} - {selectedVehicle.driverName}
                      </p>
                      <div className="text-xs md:text-sm text-gray-600 space-y-1 mt-1">
                        <div className="flex flex-wrap gap-1 items-center">
                          <span>Plate: {selectedVehicle.vehiclePlate}</span>
                          <span className="hidden xs:inline">•</span>
                          <span className="block xs:inline">Type: {selectedVehicle.vehicleType}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                          <Badge variant="outline" className={`text-xs ${
                            selectedVehicle.status === 'Checked-out' ? 'bg-purple-50 text-purple-700' : 
                            selectedVehicle.status === 'Checked-in' ? 'bg-green-50 text-green-700' : 
                            selectedVehicle.status === 'Pending Exit' ? 'bg-amber-50 text-amber-700' : 
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {selectedVehicle.status}
                          </Badge>
                          
                          {selectedVehicle.gateEntryId && (
                            <Badge variant="outline" className={`text-xs ${
                              selectedVehicle.isRecheckIn 
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              <Key className="h-3 w-3 mr-1" />
                              {selectedVehicle.gateEntryId}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVehicle(null)}
                    className={`flex-shrink-0 h-8 px-2 mt-2 xs:mt-0 ${
                      selectedVehicle.isRecheckIn 
                        ? 'text-purple-600 hover:text-purple-800' 
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Mobile Action Sheet for Selected Vehicle */}
                <div className="mt-2 pt-2 border-t border-blue-200 flex md:hidden">
                  <Sheet open={isActionsSheetOpen} onOpenChange={setIsActionsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        Vehicle Actions
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-auto">
                      <SheetHeader>
                        <SheetTitle>Vehicle Actions</SheetTitle>
                        <SheetDescription>
                          Select an action for Visit #{selectedVehicle.visitNumber}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4 space-y-2">
                        <Button
                          variant="default"
                          onClick={() => {
                            handleCheckIn(selectedVehicle.id);
                            setIsActionsSheetOpen(false);
                          }}
                          disabled={!['Pre-registered', 'Checked-out'].includes(selectedVehicle.status)}
                          className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Key className="h-4 w-4" />
                          Check In
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => {
                            handleCheckOut(selectedVehicle.id, false);
                            setIsActionsSheetOpen(false);
                          }}
                          disabled={selectedVehicle.status !== 'Checked-in'}
                          className="w-full justify-start gap-2 bg-amber-600 hover:bg-amber-700"
                        >
                          <DoorOpen className="h-4 w-4" />
                          Check Out Now
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => {
                            handleCheckOut(selectedVehicle.id, true);
                            setIsActionsSheetOpen(false);
                          }}
                          disabled={selectedVehicle.status !== 'Pending Exit'}
                          className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Verify Exit
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            )}

            {/* Stats Cards - Mobile Optimized Grid */}
            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-500">Total</p>
                      <h3 className="text-lg md:text-2xl font-bold mt-1 text-gray-900">{stats.totalVisits}</h3>
                    </div>
                    <History className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-500">On Site</p>
                      <h3 className="text-lg md:text-2xl font-bold mt-1 text-green-600">{stats.activeVisits}</h3>
                    </div>
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-500">Today</p>
                      <h3 className="text-lg md:text-2xl font-bold mt-1 text-amber-600">{stats.todayVisits}</h3>
                    </div>
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-500">Return</p>
                      <h3 className="text-lg md:text-2xl font-bold mt-1 text-purple-600">{stats.returningRate}%</h3>
                    </div>
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-500">Gate</p>
                      <h3 className="text-lg md:text-2xl font-bold mt-1 text-indigo-600">{stats.todayGateEntries}</h3>
                    </div>
                    <Fingerprint className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs - Mobile Optimized */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 md:pb-3 px-2 sm:px-4">
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Vehicle Visit Logs</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {filteredVehicles.length}/{vehicles.length}
                  </Badge>
                </div>
                <Separator className="my-2 md:my-4" />
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between mb-4">
                    {/* Mobile Horizontal Scroll Tabs */}
                    <ScrollArea className="w-full md:hidden pb-2">
                      <TabsList className="inline-flex w-max">
                        <TabsTrigger value="overview" className="px-3 py-1.5 text-xs">
                          <Gauge className="h-3 w-3 mr-1" />
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="active" className="px-3 py-1.5 text-xs">
                          <Truck className="h-3 w-3 mr-1" />
                          On Site
                          {vehicles.filter(v => ['Pre-registered', 'Checked-in'].includes(v.status)).length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {vehicles.filter(v => ['Pre-registered', 'Checked-in'].includes(v.status)).length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="px-3 py-1.5 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                          {pendingExitVehicles.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {pendingExitVehicles.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="px-3 py-1.5 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Done
                          {filteredCompletedVehicles.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {filteredCompletedVehicles.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="gate-entries" className="px-3 py-1.5 text-xs">
                          <Fingerprint className="h-3 w-3 mr-1" />
                          Gate
                          {gateEntryVehicles.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {gateEntryVehicles.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                    </ScrollArea>

                    {/* Desktop Tabs */}
                    <TabsList className="hidden md:grid grid-cols-5 w-full md:w-auto">
                      <TabsTrigger value="overview" className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="active" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        On Site
                        {vehicles.filter(v => ['Pre-registered', 'Checked-in'].includes(v.status)).length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {vehicles.filter(v => ['Pre-registered', 'Checked-in'].includes(v.status)).length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Exit
                        {pendingExitVehicles.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {pendingExitVehicles.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Completed
                        {filteredCompletedVehicles.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {filteredCompletedVehicles.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="gate-entries" className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        Gate Entries
                        {gateEntryVehicles.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {gateEntryVehicles.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    {/* Mobile Filter Button */}
                    <div className="flex md:hidden gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterSheetOpen(true)}
                        className="flex-1"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                      
                      {activeTab === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsDatePickerOpen(true)}
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Dates
                        </Button>
                      )}
                    </div>

                    {/* Desktop Filter Section */}
                    <div className="hidden md:flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Pre-registered">Pre-registered</SelectItem>
                          <SelectItem value="Checked-in">Checked-in</SelectItem>
                          <SelectItem value="Pending Exit">Pending Exit</SelectItem>
                          <SelectItem value="Checked-out">Checked-out</SelectItem>
                        </SelectContent>
                      </Select>

                      {activeTab === 'completed' && (
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(historyDateRange.from, 'MMM dd')} - {format(historyDateRange.to, 'MMM dd')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                              mode="range"
                              selected={historyDateRange}
                              onSelect={(range) => {
                                if (range?.from && range?.to) {
                                  setHistoryDateRange({
                                    from: range.from,
                                    to: range.to
                                  });
                                  setIsDatePickerOpen(false);
                                }
                              }}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>

                  {/* Search Bar - Mobile Optimized */}
                  <div className="flex flex-col md:flex-row gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search driver, company, plate..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="pl-10 pr-10 text-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={clearSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Desktop Gate Entry Filter */}
                    <div className="hidden md:block w-64">
                      <Input
                        placeholder="Filter by Gate ID..."
                        value={gateEntryFilter}
                        onChange={(e) => setGateEntryFilter(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Mobile Filter Sheet */}
                  <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                    <SheetContent side="bottom" className="h-auto">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                        <SheetDescription>
                          Apply filters to the vehicle list
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Pre-registered">Pre-registered</SelectItem>
                              <SelectItem value="Checked-in">Checked-in</SelectItem>
                              <SelectItem value="Pending Exit">Pending Exit</SelectItem>
                              <SelectItem value="Checked-out">Checked-out</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Gate Entry ID</Label>
                          <Input
                            placeholder="Filter by Gate ID..."
                            value={gateEntryFilter}
                            onChange={(e) => setGateEntryFilter(e.target.value)}
                          />
                        </div>
                        
                        <Button 
                          onClick={() => {
                            setStatusFilter('all');
                            setGateEntryFilter('');
                            setIsFilterSheetOpen(false);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Mobile Date Range Sheet */}
                  {activeTab === 'completed' && (
                    <Sheet open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <SheetContent side="bottom" className="h-auto">
                        <SheetHeader>
                          <SheetTitle>Select Date Range</SheetTitle>
                          <SheetDescription>
                            Filter completed visits by checkout date
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-4">
                          <CalendarComponent
                            mode="range"
                            selected={historyDateRange}
                            onSelect={(range) => {
                              if (range?.from && range?.to) {
                                setHistoryDateRange({
                                  from: range.from,
                                  to: range.to
                                });
                                setIsDatePickerOpen(false);
                              }
                            }}
                            numberOfMonths={1}
                            className="rounded-md border"
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}

                  {/* Rest of the TabsContent components remain the same */}
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      {filteredVehicles.length === 0 && vehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 md:p-8 text-center">
                            <Truck className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-base md:text-lg font-semibold mb-2">No Vehicle Visits</h3>
                            <p className="text-sm md:text-base text-gray-500 mb-4">
                              No vehicle visits found in the database.
                            </p>
                            <Button size="sm" onClick={() => setIsRegisterDialogOpen(true)}>
                              <Truck className="mr-2 h-4 w-4" />
                              Register First Visit
                            </Button>
                          </CardContent>
                        </Card>
                      ) : filteredVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 md:p-8 text-center">
                            <Search className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-base md:text-lg font-semibold mb-2">No Matching Visits</h3>
                            <p className="text-sm md:text-base text-gray-500 mb-4">
                              No vehicle visits match your search criteria.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setGateEntryFilter('');
                              }}
                            >
                              Clear Filters
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          {/* Mobile Overview Stats */}
                          <div className="grid grid-cols-2 gap-2 md:hidden">
                            <Card className="bg-blue-50 border-blue-100">
                              <CardContent className="p-3">
                                <p className="text-xs text-blue-700 font-medium">Showing</p>
                                <p className="text-lg font-bold text-blue-900">{filteredVehicles.length}</p>
                                <p className="text-xs text-blue-600">of {vehicles.length}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-green-50 border-green-100">
                              <CardContent className="p-3">
                                <p className="text-xs text-green-700 font-medium">Status</p>
                                <div className="space-y-1 mt-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Checked-in:</span>
                                    <Badge variant="outline" className="text-xs bg-green-100">
                                      {filteredVehicles.filter(v => v.status === 'Checked-in').length}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Pre-reg:</span>
                                    <Badge variant="outline" className="text-xs bg-amber-100">
                                      {filteredVehicles.filter(v => v.status === 'Pre-registered').length}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <VehicleDataTable 
                            vehicles={filteredVehicles}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onRowClick={handleRowClick}
                            highlightedVehicleId={selectedVehicle?.id}
                          />
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Active Vehicles Tab */}
                  <TabsContent value="active" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base md:text-lg font-semibold">Vehicles On Site</h3>
                          <p className="text-xs md:text-sm text-gray-500">
                            Currently checked in and active
                          </p>
                        </div>
                        <Badge variant="outline" className="w-fit">
                          {vehicles.filter(v => ['Pre-registered', 'Checked-in'].includes(v.status)).length} Active
                        </Badge>
                      </div>
                      {vehicles.filter(v => ['Pre-registered', 'Checked-in'].includes(v.status)).length === 0 ? (
                        <Card>
                          <CardContent className="p-6 md:p-8 text-center">
                            <Package className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-base md:text-lg font-semibold mb-2">No Active Visits</h3>
                            <p className="text-sm md:text-base text-gray-500">No vehicles are currently on site.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <VehicleDataTable 
                          vehicles={vehicles.filter(v => ['Pre-registered', 'Checked-in'].includes(v.status))}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                          onRowClick={handleRowClick}
                          highlightedVehicleId={selectedVehicle?.id}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Pending Exit Tab */}
                  <TabsContent value="pending" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base md:text-lg font-semibold">Pending Exit</h3>
                          <p className="text-xs md:text-sm text-gray-500">
                            Visits awaiting exit verification
                          </p>
                        </div>
                        <Badge variant="outline" className="w-fit">
                          {pendingExitVehicles.length} Pending
                        </Badge>
                      </div>
                      {pendingExitVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 md:p-8 text-center">
                            <Clock className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-base md:text-lg font-semibold mb-2">No Pending Exits</h3>
                            <p className="text-sm md:text-base text-gray-500">No vehicles are pending exit.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <VehicleDataTable 
                          vehicles={pendingExitVehicles}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                          onRowClick={handleRowClick}
                          highlightedVehicleId={selectedVehicle?.id}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Completed Tab */}
                  <TabsContent value="completed" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base md:text-lg font-semibold">Completed Visits</h3>
                          <p className="text-xs md:text-sm text-gray-500">
                            Vehicles that have checked out
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-fit">
                            {filteredCompletedVehicles.length} Completed
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (filteredCompletedVehicles.length === 0) return;
                              
                              const headers = [
                                'Gate Entry ID',
                                'Driver Name',
                                'Company',
                                'Vehicle Plate',
                                'Check-in Time',
                                'Check-out Time',
                                'Status'
                              ];
                              
                              const data = filteredCompletedVehicles.map(v => ({
                                'Gate Entry ID': v.gateEntryId || 'N/A',
                                'Driver Name': v.driverName,
                                'Company': v.company,
                                'Vehicle Plate': v.vehiclePlate,
                                'Check-in Time': v.checkInTime ? format(parseISO(v.checkInTime), 'yyyy-MM-dd HH:mm') : 'N/A',
                                'Check-out Time': v.checkOutTime ? format(parseISO(v.checkOutTime), 'yyyy-MM-dd HH:mm') : 'N/A',
                                'Status': v.status
                              }));
                              
                              const csvContent = convertToCsv(data, headers);
                              const blob = new Blob([csvContent], { type: 'text/csv' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `completed_visits_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                              a.click();
                            }}
                            disabled={filteredCompletedVehicles.length === 0}
                            className="hidden sm:flex"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        </div>
                      </div>

                      {filteredCompletedVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 md:p-8 text-center">
                            <CheckCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-base md:text-lg font-semibold mb-2">No Completed Visits</h3>
                            <p className="text-sm md:text-base text-gray-500">No completed visits found.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <VehicleDataTable 
                          vehicles={filteredCompletedVehicles}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                          onRowClick={handleRowClick}
                          highlightedVehicleId={selectedVehicle?.id}
                        />
                      )}
                    </div>
                  </TabsContent>

                  {/* Gate Entries Tab */}
                  <TabsContent value="gate-entries" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base md:text-lg font-semibold">Gate Entry Records</h3>
                          <p className="text-xs md:text-sm text-gray-500">
                            All vehicles with unique Gate Entry IDs
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {gateEntryVehicles.length} Entries
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50 hidden sm:inline-flex">
                            Re: {gateEntryVehicles.filter(v => v.isRecheckIn).length}
                          </Badge>
                        </div>
                      </div>

                      {gateEntryVehicles.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 md:p-8 text-center">
                            <Fingerprint className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-base md:text-lg font-semibold mb-2">No Gate Entries</h3>
                            <p className="text-sm md:text-base text-gray-500">
                              No vehicles have been checked in yet.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {/* Mobile Gate Entry Stats */}
                          <div className="grid grid-cols-2 gap-2 md:hidden">
                            <Card className="bg-indigo-50 border-indigo-100">
                              <CardContent className="p-3">
                                <p className="text-xs text-indigo-700">Today's Entries</p>
                                <p className="text-lg font-bold text-indigo-900">{stats.todayGateEntries}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-purple-50 border-purple-100">
                              <CardContent className="p-3">
                                <p className="text-xs text-purple-700">Recheck-ins</p>
                                <p className="text-lg font-bold text-purple-900">
                                  {gateEntryVehicles.filter(v => v.isRecheckIn).length}
                                </p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Desktop Gate Entry Stats */}
                          <div className="hidden md:grid grid-cols-4 gap-4">
                            <Card className="bg-indigo-50 border-indigo-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-indigo-700 font-medium">Today's Gate Entries</p>
                                <p className="text-2xl font-bold text-indigo-900">{stats.todayGateEntries}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-green-50 border-green-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-green-700 font-medium">Currently Active</p>
                                <p className="text-2xl font-bold text-green-900">
                                  {gateEntryVehicles.filter(v => v.status === 'Checked-in').length}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-purple-50 border-purple-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-purple-700 font-medium">Recheck-ins</p>
                                <p className="text-2xl font-bold text-purple-900">
                                  {gateEntryVehicles.filter(v => v.isRecheckIn).length}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-amber-50 border-amber-100">
                              <CardContent className="p-4">
                                <p className="text-sm text-amber-700 font-medium">Latest Gate ID</p>
                                <p className="text-lg font-bold text-amber-900 truncate">
                                  {gateEntryVehicles[0]?.gateEntryId || 'N/A'}
                                </p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Gate Entry Table - Mobile Optimized */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[600px] md:min-w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Gate ID</th>
                                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {gateEntryVehicles.map((vehicle) => (
                                    <tr 
                                      key={vehicle.id}
                                      onClick={() => handleRowClick(vehicle)}
                                      className={`hover:bg-gray-50 cursor-pointer text-sm ${
                                        selectedVehicle?.id === vehicle.id ? 'bg-blue-50' : ''
                                      }`}
                                    >
                                      <td className="px-2 md:px-4 py-2 md:py-3">
                                        <Badge variant="outline" className={`text-xs font-mono ${
                                          vehicle.isRecheckIn 
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {vehicle.gateEntryId}
                                        </Badge>
                                      </td>
                                      <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm">
                                        {vehicle.driverName}
                                      </td>
                                      <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm truncate max-w-[100px] md:max-w-none">
                                        {vehicle.company}
                                      </td>
                                      <td className="px-2 md:px-4 py-2 md:py-3 font-mono text-xs">
                                        {vehicle.vehiclePlate}
                                      </td>
                                      <td className="px-2 md:px-4 py-2 md:py-3 text-xs">
                                        {vehicle.checkInTime ? format(parseISO(vehicle.checkInTime), 'HH:mm') : 'N/A'}
                                      </td>
                                      <td className="px-2 md:px-4 py-2 md:py-3">
                                        <Badge variant="outline" className={`text-xs ${
                                          vehicle.status === 'Checked-in' ? 'bg-green-100 text-green-700' :
                                          vehicle.status === 'Pending Exit' ? 'bg-amber-100 text-amber-700' :
                                          'bg-purple-100 text-purple-700'
                                        }`}>
                                          {vehicle.status === 'Checked-in' ? 'In' : 
                                           vehicle.status === 'Pending Exit' ? 'Exit' : 'Out'}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>

            {/* Gate Pass Dialog - Mobile Optimized */}
            {selectedVehicle && (
              <GatePassDialog 
                isOpen={isGatePassOpen} 
                onOpenChange={setIsGatePassOpen} 
                visitor={{
                  id: selectedVehicle.id,
                  name: selectedVehicle.driverName,
                  company: selectedVehicle.company,
                  vehicleRegNo: selectedVehicle.vehiclePlate,
                  vehicleType: selectedVehicle.vehicleType,
                  phoneNumber: selectedVehicle.phone,
                  status: selectedVehicle.status,
                  checkInTime: selectedVehicle.checkInTime,
                  expectedCheckInTime: selectedVehicle.registeredAt,
                  visitNumber: selectedVehicle.visitNumber,
                  gateEntryId: selectedVehicle.gateEntryId
                }} 
              />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      
      {/* Hidden printable report */}
      <div className="hidden">
        <div ref={printRef}>
                          <PrintableVehicleReport 
                            visitors={vehicles.map(v => ({
                              id: v.id,
                              name: v.driverName,
                              company: v.company,
                              hostId: v.hostId,
                              idNumber: v.idNumber,
                              email: v.email,
                              phone: v.phone,
                              visitorCode: v.vehicleCode,
                              vehiclePlate: v.vehiclePlate,
                              vehicleType: v.vehicleType,
                              cargoDescription: v.cargoDescription,
                              status: v.status,
                              expectedCheckInTime: v.expectedCheckInTime,
                              checkInTime: v.checkInTime,
                              checkOutTime: v.checkOutTime
                            }))} 
                            shipments={[]} 
                          />
        </div>
      </div>
    </>
  );
}
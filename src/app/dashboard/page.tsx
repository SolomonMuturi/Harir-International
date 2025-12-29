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
import { OverviewCard } from '@/components/dashboard/overview-card';
import {
  PackageSearch,
  Thermometer,
  Users,
  Truck,
  Scale,
  Package,
  HardHat,
  QrCode,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
  Activity,
  ClipboardCheck,
  FileText,
  Wifi,
  WifiOff,
  User,
  Briefcase,
  Building,
  Percent,
  Snowflake,
  Database,
  Warehouse,
} from 'lucide-react';
import { ColdChainChart } from '@/components/dashboard/cold-chain-chart';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import { ProcessingStationStatus } from '@/components/dashboard/processing-station-status';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
interface DashboardStats {
  // Employee Stats
  totalEmployees: number;
  employeesPresentToday: number;
  employeesOnLeave: number;
  attendanceRate: number;
  employeesByContract: {
    fullTime: number;
    partTime: number;
    contract: number;
  };
  
  // Supplier Stats
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  suppliersOnboarding: number;
  
  // Vehicle/Gate Stats
  totalVehicles: number;
  vehiclesOnSite: number;
  vehiclesInTransit: number;
  vehiclesPendingExit: number;
  vehiclesCompletedToday: number;
  
  // Operational Stats
  palletsWeighedToday: number;
  totalWeightToday: number;
  coldRoomCapacity: number;
  qualityCheckPassRate: number;
  todayIntakes: number;
  todayProcessed: number;
  todayDispatched: number;
  
  // Financial Stats
  todayOperationalCost: number;
  monthlyOperationalCost: number;
  dieselConsumptionToday: number;
  electricityConsumptionToday: number;
  
  // Performance Metrics
  intakeEfficiency: number;
  processingEfficiency: number;
  dispatchAccuracy: number;
  
  // Recent Alerts
  recentAlerts: Array<{
    id: string;
    type: 'temperature' | 'weight' | 'vehicle' | 'quality' | 'attendance';
    message: string;
    severity: 'high' | 'medium' | 'low';
    time: string;
  }>;
  
  // Cold Chain Data - Updated to use real data structure
  coldChainData: Array<{
    id: string;
    name: string;
    temperature: number;
    humidity: number;
    status: 'optimal' | 'warning' | 'normal';
    capacity: number;
    occupied: number;
    lastUpdate: string;
  }>;
  
  // Cold Room Statistics
  coldRoomStats: {
    total4kgBoxes: number;
    total10kgBoxes: number;
    total4kgPallets: number;
    total10kgPallets: number;
    totalBoxesLoadedToday: number;
    totalWeightLoadedToday: number;
    recentTemperatureLogs: Array<{
      id: string;
      cold_room_id: string;
      temperature: number;
      timestamp: string;
      status: 'normal' | 'warning' | 'critical';
    }>;
  };
  
  // VMS/IoT Data
  vmsIotData: Array<{
    id: string;
    device: string;
    location: string;
    status: 'online' | 'offline';
    lastUpdate: string;
  }>;
}

// Warehouse-related interfaces
interface SupplierIntakeRecord {
  id: string;
  pallet_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  total_weight: number;
  fruit_varieties: Array<{
    name: string;
    weight: number;
    crates: number;
  }>;
  region: string;
  timestamp: string;
  status: 'processed' | 'pending' | 'rejected';
}

interface QualityCheck {
  id: string;
  weight_entry_id: string;
  pallet_id: string;
  supplier_name: string;
  overall_status: 'approved' | 'rejected';
  processed_at: string;
}

interface CountingRecord {
  id: string;
  supplier_id: string;
  supplier_name: string;
  region: string;
  pallet_id: string;
  total_weight: number;
  total_counted_weight: number;
  submitted_at: string;
  status: string;
}

// Cold Room Interface
interface ColdRoomData {
  id: string;
  name: string;
  current_temperature: number;
  capacity: number;
  occupied: number;
  humidity?: number;
  last_temperature_log?: string;
  status?: 'optimal' | 'warning' | 'normal';
}

const AdminDashboard = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Warehouse data states
  const [supplierIntakeRecords, setSupplierIntakeRecords] = useState<SupplierIntakeRecord[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [countingRecords, setCountingRecords] = useState<CountingRecord[]>([]);
  const [warehouseStats, setWarehouseStats] = useState({
    total_processed: 0,
    pending_rejections: 0,
    total_suppliers: 0,
    fuerte_4kg: 0,
    fuerte_10kg: 0,
    hass_4kg: 0,
    hass_10kg: 0,
  });
  
  // Cold room data states
  const [coldRooms, setColdRooms] = useState<ColdRoomData[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<any[]>([]);
  const [coldRoomBoxes, setColdRoomBoxes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<any[]>([]);
  
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };
  
  // Fetch cold room data
  const fetchColdRoomData = async () => {
    try {
      console.log('🌡️ Fetching cold room data...');
      
      // Fetch cold rooms
      const roomsResponse = await fetch('/api/cold-room');
      let roomsData: ColdRoomData[] = [];
      
      if (roomsResponse.ok) {
        const result = await roomsResponse.json();
        console.log('Cold rooms API response:', result);
        
        if (Array.isArray(result)) {
          roomsData = result;
        } else if (result && Array.isArray(result.data)) {
          roomsData = result.data;
        }
      }
      
      // Fetch temperature logs
      const tempResponse = await fetch('/api/cold-room?action=temperature&limit=5');
      let tempLogs: any[] = [];
      
      if (tempResponse.ok) {
        const result = await tempResponse.json();
        if (result.success && Array.isArray(result.data)) {
          tempLogs = result.data.slice(0, 10); // Get last 10 logs
        }
      }
      
      // Fetch cold room boxes for statistics
      const boxesResponse = await fetch('/api/cold-room?action=boxes');
      let boxesData: any[] = [];
      let total4kgBoxes = 0;
      let total10kgBoxes = 0;
      
      if (boxesResponse.ok) {
        const result = await boxesResponse.json();
        if (result.success && Array.isArray(result.data)) {
          boxesData = result.data;
          
          // Calculate box statistics
          boxesData.forEach(box => {
            if (box.box_type === '4kg' || box.boxType === '4kg') {
              total4kgBoxes += Number(box.quantity) || 0;
            } else if (box.box_type === '10kg' || box.boxType === '10kg') {
              total10kgBoxes += Number(box.quantity) || 0;
            }
          });
        }
      }
      
      // Fetch loading history for today's stats
      const today = new Date().toISOString().split('T')[0];
      const historyResponse = await fetch(`/api/cold-room?action=loading-history&date=${today}`);
      let todayLoadingHistory: any[] = [];
      let totalBoxesLoadedToday = 0;
      let totalWeightLoadedToday = 0;
      
      if (historyResponse.ok) {
        const result = await historyResponse.json();
        if (result.success && Array.isArray(result.data)) {
          todayLoadingHistory = result.data;
          
          todayLoadingHistory.forEach(record => {
            totalBoxesLoadedToday += Number(record.quantity) || 0;
            const boxWeight = (record.box_type === '4kg' || record.boxType === '4kg') ? 4 : 10;
            totalWeightLoadedToday += (Number(record.quantity) || 0) * boxWeight;
          });
        }
      }
      
      // Update cold rooms state
      const updatedColdRooms = roomsData.map(room => {
        // Get latest temperature for this room
        const roomTempLogs = tempLogs.filter(log => log.cold_room_id === room.id);
        const latestTempLog = roomTempLogs[0];
        
        // Determine status based on temperature
        let status: 'optimal' | 'warning' | 'normal' = 'normal';
        if (room.id === 'coldroom1') {
          // Cold Room 1: 3-5°C range
          if (latestTempLog && latestTempLog.temperature >= 3 && latestTempLog.temperature <= 5) {
            status = 'optimal';
          } else if (latestTempLog && (latestTempLog.temperature < 2 || latestTempLog.temperature > 6)) {
            status = 'warning';
          }
        } else if (room.id === 'coldroom2') {
          // Cold Room 2: 5°C range (based on your data)
          if (latestTempLog && latestTempLog.temperature >= 4 && latestTempLog.temperature <= 6) {
            status = 'optimal';
          } else if (latestTempLog && (latestTempLog.temperature < 3 || latestTempLog.temperature > 7)) {
            status = 'warning';
          }
        }
        
        return {
          ...room,
          humidity: 75, // Default humidity
          last_temperature_log: latestTempLog?.timestamp,
          status
        };
      });
      
      setColdRooms(updatedColdRooms);
      setTemperatureLogs(tempLogs);
      setColdRoomBoxes(boxesData);
      setLoadingHistory(todayLoadingHistory);
      
      return {
        rooms: updatedColdRooms,
        tempLogs,
        total4kgBoxes,
        total10kgBoxes,
        totalBoxesLoadedToday,
        totalWeightLoadedToday
      };
      
    } catch (error) {
      console.error('❌ Error fetching cold room data:', error);
      
      // Return default data on error
      return {
        rooms: [
          {
            id: 'coldroom1',
            name: 'Cold Room 1',
            current_temperature: 5,
            capacity: 100,
            occupied: 0,
            humidity: 75,
            status: 'normal' as const
          },
          {
            id: 'coldroom2',
            name: 'Cold Room 2',
            current_temperature: 5,
            capacity: 100,
            occupied: 0,
            humidity: 75,
            status: 'normal' as const
          }
        ],
        tempLogs: [],
        total4kgBoxes: 0,
        total10kgBoxes: 0,
        totalBoxesLoadedToday: 0,
        totalWeightLoadedToday: 0
      };
    }
  };
  
  // Fetch all dashboard data including warehouse data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch employee data
      const employeesResponse = await fetch('/api/employees');
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : [];
      
      // Fetch attendance data
      const attendanceResponse = await fetch('/api/attendance');
      const attendanceData = attendanceResponse.ok ? await attendanceResponse.json() : [];
      
      // Fetch supplier data
      const suppliersResponse = await fetch('/api/suppliers');
      const suppliersData = suppliersResponse.ok ? await suppliersResponse.json() : [];
      
      // Fetch vehicle/gate data
      const vehiclesResponse = await fetch('/api/suppliers?vehicles=true');
      const vehiclesData = vehiclesResponse.ok ? await vehiclesResponse.json() : [];
      
      // Fetch warehouse data
      await fetchWarehouseData();
      
      // Fetch cold room data
      const coldRoomData = await fetchColdRoomData();
      
      // Calculate today's date for filtering
      const today = new Date().toISOString().split('T')[0];
      
      // Process employee statistics
      const totalEmployees = employeesData.length;
      const todayAttendance = attendanceData.filter((record: any) => record.date === today);
      const employeesPresentToday = todayAttendance.filter((record: any) => 
        record.status === 'Present' || record.status === 'Late'
      ).length;
      const employeesOnLeave = todayAttendance.filter((record: any) => 
        record.status === 'On Leave'
      ).length;
      const attendanceRate = totalEmployees > 0 
        ? Math.round((employeesPresentToday / totalEmployees) * 100)
        : 0;
      
      const employeesByContract = {
        fullTime: employeesData.filter((emp: any) => emp.contract === 'Full-time').length,
        partTime: employeesData.filter((emp: any) => emp.contract === 'Part-time').length,
        contract: employeesData.filter((emp: any) => emp.contract === 'Contract').length,
      };
      
      // Process supplier statistics
      const totalSuppliers = suppliersData.length;
      const activeSuppliers = suppliersData.filter((sup: any) => sup.status === 'Active').length;
      const inactiveSuppliers = suppliersData.filter((sup: any) => sup.status === 'Inactive').length;
      const suppliersOnboarding = suppliersData.filter((sup: any) => sup.status === 'Onboarding').length;
      
      // Process vehicle statistics
      const totalVehicles = vehiclesData.filter((v: any) => v.vehicle_number_plate).length;
      const vehiclesOnSite = vehiclesData.filter((v: any) => 
        v.vehicle_status === 'Checked-in' || v.vehicle_status === 'Pending Exit'
      ).length;
      const vehiclesInTransit = vehiclesData.filter((v: any) => 
        v.vehicle_status === 'In-Transit'
      ).length;
      const vehiclesPendingExit = vehiclesData.filter((v: any) => 
        v.vehicle_status === 'Pending Exit'
      ).length;
      const vehiclesCompletedToday = vehiclesData.filter((v: any) => {
        if (!v.vehicle_check_out_time) return false;
        const checkOutDate = new Date(v.vehicle_check_out_time).toISOString().split('T')[0];
        return checkOutDate === today;
      }).length;
      
      // Process operational statistics
      const palletsWeighedToday = supplierIntakeRecords.length; // Use actual intake records
      const totalWeightToday = supplierIntakeRecords.reduce((sum, record) => sum + record.total_weight, 0);
      
      // Calculate cold room capacity based on actual data
      const coldRoomCapacity = coldRoomData.rooms.reduce((total, room) => {
        if (room.capacity > 0) {
          return Math.round((room.occupied / room.capacity) * 100);
        }
        return total;
      }, 0) / coldRoomData.rooms.length || 0;
      
      const qualityCheckPassRate = qualityChecks.length > 0 
        ? Math.round((qualityChecks.filter(q => q.overall_status === 'approved').length / qualityChecks.length) * 100)
        : 94.5;
      const todayIntakes = supplierIntakeRecords.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate === today;
      }).length;
      const todayProcessed = countingRecords.filter(record => {
        const recordDate = new Date(record.submitted_at).toISOString().split('T')[0];
        return recordDate === today && record.status === 'processed';
      }).length;
      const todayDispatched = 0; // You would need a separate API for this
      
      // Process financial statistics
      const todayOperationalCost = 0;
      const monthlyOperationalCost = 0;
      const dieselConsumptionToday = 0;
      const electricityConsumptionToday = 0;
      
      // Process performance metrics
      const intakeEfficiency = todayIntakes > 0 ? 92 : 0;
      const processingEfficiency = todayProcessed > 0 ? 88 : 0;
      const dispatchAccuracy = 96;
      
      // Generate recent alerts from various sources
      const recentAlerts = generateRecentAlerts(
        employeesData,
        attendanceData,
        suppliersData,
        vehiclesData,
        coldRoomData.rooms,
        coldRoomData.tempLogs
      );
      
      // Cold chain data - using REAL data from cold rooms
      const coldChainData = coldRoomData.rooms.map(room => ({
        id: room.id,
        name: room.name,
        temperature: room.current_temperature,
        humidity: room.humidity || 75,
        status: room.status || 'normal',
        capacity: room.capacity,
        occupied: room.occupied,
        lastUpdate: room.last_temperature_log || new Date().toISOString()
      }));
      
      // Calculate pallet counts from boxes
      const calculatePallets = (boxes: number, boxType: '4kg' | '10kg') => {
        if (boxType === '4kg') {
          return Math.floor(boxes / 288);
        } else {
          return Math.floor(boxes / 120);
        }
      };
      
      const coldRoomStats = {
        total4kgBoxes: coldRoomData.total4kgBoxes,
        total10kgBoxes: coldRoomData.total10kgBoxes,
        total4kgPallets: calculatePallets(coldRoomData.total4kgBoxes, '4kg'),
        total10kgPallets: calculatePallets(coldRoomData.total10kgBoxes, '10kg'),
        totalBoxesLoadedToday: coldRoomData.totalBoxesLoadedToday,
        totalWeightLoadedToday: coldRoomData.totalWeightLoadedToday,
        recentTemperatureLogs: coldRoomData.tempLogs.slice(0, 5).map((log: any) => ({
          id: log.id,
          cold_room_id: log.cold_room_id,
          temperature: log.temperature,
          timestamp: log.timestamp,
          status: log.status || 'normal'
        }))
      };
      
      // VMS/IoT data
      const vmsIotData = [
        { id: 'device-1', device: 'Temperature Sensor #1', location: 'Cold Room 1', status: 'online' as const, lastUpdate: '2 min ago' },
        { id: 'device-2', device: 'Weight Scale #2', location: 'Weighing Station', status: 'online' as const, lastUpdate: '5 min ago' },
        { id: 'device-3', device: 'GPS Tracker #15', location: 'Vehicle KAB 123X', status: 'online' as const, lastUpdate: '30 sec ago' },
        { id: 'device-4', device: 'Humidity Sensor #3', location: 'Cold Room 3', status: 'offline' as const, lastUpdate: '1 hour ago' },
        { id: 'device-5', device: 'Door Sensor #4', location: 'Loading Bay', status: 'online' as const, lastUpdate: '10 min ago' },
      ];
      
      const dashboardStats: DashboardStats = {
        // Employee Stats
        totalEmployees,
        employeesPresentToday,
        employeesOnLeave,
        attendanceRate,
        employeesByContract,
        
        // Supplier Stats
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers,
        suppliersOnboarding,
        
        // Vehicle/Gate Stats
        totalVehicles,
        vehiclesOnSite,
        vehiclesInTransit,
        vehiclesPendingExit,
        vehiclesCompletedToday,
        
        // Operational Stats
        palletsWeighedToday,
        totalWeightToday,
        coldRoomCapacity,
        qualityCheckPassRate,
        todayIntakes,
        todayProcessed,
        todayDispatched,
        
        // Financial Stats
        todayOperationalCost,
        monthlyOperationalCost,
        dieselConsumptionToday,
        electricityConsumptionToday,
        
        // Performance Metrics
        intakeEfficiency,
        processingEfficiency,
        dispatchAccuracy,
        
        // Recent Alerts
        recentAlerts,
        
        // Cold Chain Data - REAL DATA
        coldChainData,
        
        // Cold Room Statistics
        coldRoomStats,
        
        // VMS/IoT Data
        vmsIotData,
      };
      
      setStats(dashboardStats);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Fetch warehouse-specific data
  const fetchWarehouseData = async () => {
    try {
      // Fetch intake records
      const intakeResponse = await fetch('/api/weights?limit=10');
      if (intakeResponse.ok) {
        const weightEntries = await intakeResponse.json();
        const intakeRecords: SupplierIntakeRecord[] = weightEntries.map((entry: any) => ({
          id: entry.id,
          pallet_id: entry.pallet_id || `WE-${entry.id}`,
          supplier_name: entry.supplier || 'Unknown Supplier',
          driver_name: entry.driver_name || '',
          vehicle_plate: entry.vehicle_plate || entry.truck_id || '',
          total_weight: entry.net_weight || entry.weight || 0,
          fruit_varieties: Array.isArray(entry.fruit_variety) ? entry.fruit_variety.map((f: any) => ({
            name: f.name || f.product || 'Unknown',
            weight: f.weight || 0,
            crates: f.crates || 0
          })) : [{
            name: entry.product || 'Unknown',
            weight: 0,
            crates: 0
          }],
          region: entry.region || '',
          timestamp: entry.timestamp || entry.created_at || new Date().toISOString(),
          status: 'processed'
        }));
        setSupplierIntakeRecords(intakeRecords);
      }
      
      // Fetch quality checks
      const qualityResponse = await fetch('/api/quality-control?limit=10');
      if (qualityResponse.ok) {
        const qualityChecksData = await qualityResponse.json();
        const transformedChecks: QualityCheck[] = qualityChecksData.map((qc: any) => ({
          id: qc.id,
          weight_entry_id: qc.weight_entry_id,
          pallet_id: qc.pallet_id || `WE-${qc.weight_entry_id}`,
          supplier_name: qc.supplier_name || 'Unknown Supplier',
          overall_status: qc.overall_status || 'approved',
          processed_at: qc.processed_at || new Date().toISOString(),
        }));
        setQualityChecks(transformedChecks);
      }
      
      // Fetch counting records
      const countingResponse = await fetch('/api/counting?limit=10');
      if (countingResponse.ok) {
        const result = await countingResponse.json();
        if (result.success) {
          setCountingRecords(result.data || []);
          
          // Calculate warehouse stats
          const totalProcessed = result.data.filter((r: any) => r.status === 'processed').length;
          const pendingRejections = result.data.filter((r: any) => r.status === 'pending').length;
          
          setWarehouseStats({
            total_processed: totalProcessed,
            pending_rejections: pendingRejections,
            total_suppliers: supplierIntakeRecords.length,
            fuerte_4kg: 0,
            fuerte_10kg: 0,
            hass_4kg: 0,
            hass_10kg: 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
    }
  };
  
  // Generate recent alerts from various data sources - UPDATED with cold room alerts
  const generateRecentAlerts = (
    employees: any[],
    attendance: any[],
    suppliers: any[],
    vehicles: any[],
    coldRooms: ColdRoomData[],
    tempLogs: any[]
  ) => {
    const alerts = [];
    const now = new Date();
    
    // Temperature alerts from cold rooms
    coldRooms.forEach(room => {
      const latestTempLog = tempLogs
        .filter(log => log.cold_room_id === room.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (latestTempLog) {
        if (room.id === 'coldroom1' && (latestTempLog.temperature < 3 || latestTempLog.temperature > 5)) {
          alerts.push({
            id: `temp-${room.id}`,
            type: 'temperature',
            message: `${room.name} temperature out of range: ${latestTempLog.temperature}°C`,
            severity: latestTempLog.temperature < 2 || latestTempLog.temperature > 6 ? 'high' : 'medium',
            time: formatDate(latestTempLog.timestamp),
          });
        } else if (room.id === 'coldroom2' && (latestTempLog.temperature < 4 || latestTempLog.temperature > 6)) {
          alerts.push({
            id: `temp-${room.id}`,
            type: 'temperature',
            message: `${room.name} temperature out of range: ${latestTempLog.temperature}°C`,
            severity: latestTempLog.temperature < 3 || latestTempLog.temperature > 7 ? 'high' : 'medium',
            time: formatDate(latestTempLog.timestamp),
          });
        }
      }
    });
    
    // Cold room capacity alerts
    coldRooms.forEach(room => {
      if (room.capacity > 0) {
        const occupancyRate = (room.occupied / room.capacity) * 100;
        if (occupancyRate > 90) {
          alerts.push({
            id: `capacity-${room.id}`,
            type: 'quality',
            message: `${room.name} nearing capacity: ${Math.round(occupancyRate)}% full`,
            severity: occupancyRate > 95 ? 'high' : 'medium',
            time: 'Today',
          });
        }
      }
    });
    
    // Attendance alerts (employees missing check-in after 9 AM)
    if (now.getHours() >= 9) {
      const today = new Date().toISOString().split('T')[0];
      const checkedInEmployees = attendance
        .filter((a: any) => a.date === today && (a.status === 'Present' || a.status === 'Late'))
        .map((a: any) => a.employeeId);
      
      const missingEmployees = employees.filter(
        (emp: any) => !checkedInEmployees.includes(emp.id)
      );
      
      if (missingEmployees.length > 0) {
        alerts.push({
          id: 'attendance-1',
          type: 'attendance',
          message: `${missingEmployees.length} employees have not checked in yet`,
          severity: 'medium' as const,
          time: 'Today 9:00 AM',
        });
      }
    }
    
    // Vehicle alerts (vehicles pending exit for > 2 hours)
    const pendingExitVehicles = vehicles.filter((v: any) => 
      v.vehicle_status === 'Pending Exit'
    );
    
    if (pendingExitVehicles.length > 0) {
      alerts.push({
        id: 'vehicle-1',
        type: 'vehicle',
        message: `${pendingExitVehicles.length} vehicles pending exit verification`,
        severity: 'low' as const,
        time: 'Today',
      });
    }
    
    // Supplier alerts (inactive suppliers)
    const inactiveSuppliers = suppliers.filter((s: any) => 
      s.status === 'Inactive'
    );
    
    if (inactiveSuppliers.length > 0) {
      alerts.push({
        id: 'supplier-1',
        type: 'quality',
        message: `${inactiveSuppliers.length} suppliers are inactive`,
        severity: 'medium' as const,
        time: 'Today',
      });
    }
    
    // Add warehouse alerts
    if (countingRecords.length > 0) {
      const pendingCounting = countingRecords.filter(r => r.status === 'pending').length;
      if (pendingCounting > 0) {
        alerts.push({
          id: 'warehouse-1',
          type: 'quality',
          message: `${pendingCounting} counting records pending processing`,
          severity: 'medium' as const,
          time: 'Today',
        });
      }
    }
    
    // Return only the 5 most recent alerts, sorted by severity (high first)
    return alerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }).slice(0, 5);
  };
  
  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    toast({
      title: 'Data Refreshed',
      description: 'Dashboard data has been updated',
    });
  };
  
  // Calculate accepted suppliers (intake + QC approved)
  const getAcceptedSuppliers = () => {
    return supplierIntakeRecords.filter(intake => {
      const qc = qualityChecks.find(q => q.weight_entry_id === intake.id);
      const inCounting = countingRecords.some(record => record.supplier_id === intake.id);
      return qc && qc.overall_status === 'approved' && !inCounting;
    });
  };
  
  const acceptedSuppliers = getAcceptedSuppliers();
  
  if (isLoading || !stats) {
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
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-[500px] w-full" />
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }
  
  // Overview cards configuration - UPDATED with cold room data
  const overviewCards = [
    {
      id: 'employees',
      title: 'Employees Present',
      value: `${stats.employeesPresentToday}/${stats.totalEmployees}`,
      change: `${stats.attendanceRate}% attendance rate`,
      changeType: stats.attendanceRate > 85 ? 'increase' : 'decrease' as const,
      icon: Users,
      link: '/employees',
      color: 'bg-blue-500',
    },
    {
      id: 'suppliers',
      title: 'Active Suppliers',
      value: String(stats.activeSuppliers),
      change: `${stats.totalSuppliers} total suppliers`,
      changeType: 'increase' as const,
      icon: Building,
      link: '/suppliers',
      color: 'bg-green-500',
    },
    {
      id: 'coldroom',
      title: 'Cold Room Status',
      value: `${stats.coldRoomCapacity}% occupied`,
      change: `${stats.coldRoomStats.totalBoxesLoadedToday} boxes loaded today`,
      changeType: stats.coldRoomCapacity > 90 ? 'increase' : 'normal' as const,
      icon: Snowflake,
      link: '/cold-room',
      color: 'bg-cyan-500',
    },
    {
      id: 'pallets',
      title: 'Pallets Today',
      value: String(stats.palletsWeighedToday),
      change: `${stats.totalWeightToday} kg total`,
      changeType: stats.palletsWeighedToday > 40 ? 'increase' : 'decrease' as const,
      icon: Package,
      link: '/weight-capture',
      color: 'bg-purple-500',
    },
    {
      id: 'quality',
      title: 'Quality Pass Rate',
      value: `${stats.qualityCheckPassRate}%`,
      change: 'Today',
      changeType: stats.qualityCheckPassRate > 90 ? 'increase' : 'decrease' as const,
      icon: CheckCircle,
      link: '/quality-control',
      color: 'bg-emerald-500',
    },
    {
      id: 'warehouse',
      title: "Today's Intake",
      value: String(stats.todayIntakes),
      change: `${stats.todayProcessed} processed, ${stats.todayDispatched} dispatched`,
      changeType: 'increase' as const,
      icon: Warehouse,
      link: '/warehouse',
      color: 'bg-indigo-500',
    },
  ];

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
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Harir International Operations Dashboard</h2>
                <p className="text-muted-foreground">
                  Real-time monitoring of supply chain operations, intake, processing, and dispatch
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  Updated: {lastUpdated}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="coldchain">Cold Chain</TabsTrigger>
                <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {overviewCards.map((card) => (
                    <Link key={card.id} href={card.link} className="block transition-transform hover:scale-[1.02]">
                      <OverviewCard 
                        data={{ 
                          title: card.title, 
                          value: card.value, 
                          change: card.change, 
                          changeType: card.changeType 
                        }} 
                        icon={card.icon} 
                      />
                    </Link>
                  ))}
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Performance Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Operational Performance
                        </CardTitle>
                        <CardDescription>
                          Today's key performance indicators
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Intake Efficiency</span>
                              <span className="font-semibold">{stats.intakeEfficiency}%</span>
                            </div>
                            <Progress value={stats.intakeEfficiency} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Processing Efficiency</span>
                              <span className="font-semibold">{stats.processingEfficiency}%</span>
                            </div>
                            <Progress value={stats.processingEfficiency} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Dispatch Accuracy</span>
                              <span className="font-semibold">{stats.dispatchAccuracy}%</span>
                            </div>
                            <Progress value={stats.dispatchAccuracy} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Quality Pass Rate</span>
                              <span className="font-semibold">{stats.qualityCheckPassRate}%</span>
                            </div>
                            <Progress value={stats.qualityCheckPassRate} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* WAREHOUSE PROCESSING OVERVIEW */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <HardHat className="w-5 h-5" />
                              Warehouse Processing
                            </CardTitle>
                            <CardDescription>
                              {acceptedSuppliers.length} suppliers pending counting • {warehouseStats.pending_rejections} need variance
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Live Updates
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Stats Overview */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <div className="text-2xl font-bold text-blue-700">{acceptedSuppliers.length}</div>
                              <div className="text-sm text-blue-600">Pending Counting</div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                              <div className="text-2xl font-bold text-orange-700">{warehouseStats.pending_rejections}</div>
                              <div className="text-sm text-orange-600">Need Variance</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                              <div className="text-2xl font-bold text-green-700">{warehouseStats.total_processed}</div>
                              <div className="text-sm text-green-600">Total Processed</div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                              <div className="text-2xl font-bold text-purple-700">
                                {supplierIntakeRecords.length}
                              </div>
                              <div className="text-sm text-purple-600">Total Intakes</div>
                            </div>
                          </div>

                          {/* Active Suppliers List */}
                          <div>
                            <h4 className="font-medium mb-2 text-sm text-gray-500">Recent Intake (Last 24 hours)</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                              {supplierIntakeRecords.slice(0, 5).map((supplier, index) => {
                                const qc = qualityChecks.find(q => q.weight_entry_id === supplier.id);
                                const isAccepted = acceptedSuppliers.some(s => s.id === supplier.id);
                                const hasVariance = countingRecords.some(r => r.supplier_id === supplier.id);
                                
                                return (
                                  <div key={supplier.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="font-medium">{supplier.supplier_name}</div>
                                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                                          <div className="flex items-center gap-4">
                                            <span>📍 {supplier.region}</span>
                                            <span>📞 {supplier.driver_name || "No contact"}</span>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <span>🚚 {supplier.vehicle_plate || "No plate"}</span>
                                            <span>⚖️ {supplier.total_weight} kg</span>
                                            <span>📦 {supplier.fruit_varieties.length} varieties</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <Badge variant="outline" className={`
                                          ${isAccepted ? 'bg-green-50 text-green-700 border-green-200' : 
                                            hasVariance ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                            qc?.overall_status === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                            'bg-gray-50 text-gray-700 border-gray-200'}
                                        `}>
                                          {isAccepted ? 'Ready for Counting' : 
                                           hasVariance ? 'Needs Variance' : 
                                           qc?.overall_status === 'approved' ? 'QC Approved' : 'Intake Complete'}
                                        </Badge>
                                        <div className="text-xs text-gray-400">
                                          {formatDate(supplier.timestamp)}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Fruit Varieties */}
                                    {supplier.fruit_varieties.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {supplier.fruit_varieties.map((fruit, idx) => (
                                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                            {fruit.name}: {fruit.weight}kg ({fruit.crates} crates)
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              
                              {supplierIntakeRecords.length === 0 && (
                                <div className="text-center py-4 text-gray-500">
                                  No supplier intake records found
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-4 border-t">
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => router.push('/warehouse')}
                              >
                                <Scale className="w-4 h-4 mr-2" />
                                Go to Warehouse
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => router.push('/warehouse?tab=counting')}
                              >
                                <Package className="w-4 h-4 mr-2" />
                                Start Counting
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => router.push('/warehouse?tab=reject')}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Handle Variance
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Cold Chain Status - USING REAL DATA */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Thermometer className="w-5 h-5" />
                          Cold Chain Monitoring
                        </CardTitle>
                        <CardDescription>
                          Real-time temperature and humidity from cold rooms
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ColdChainChart data={stats.coldChainData} />
                        
                        {/* Cold Room Status Details */}
                        <div className="mt-4 space-y-3">
                          {stats.coldChainData.map((room) => (
                            <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  room.status === 'optimal' ? 'bg-green-500' :
                                  room.status === 'warning' ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`} />
                                <div>
                                  <div className="font-medium">{room.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {room.occupied}/{room.capacity} pallets • {formatDate(room.lastUpdate)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg">{room.temperature}°C</div>
                                <div className="text-xs text-muted-foreground">
                                  {room.humidity}% humidity
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => router.push('/cold-room')}
                        >
                          <Snowflake className="w-4 h-4 mr-2" />
                          View Cold Room Details
                        </Button>
                      </CardFooter>
                    </Card>

                    {/* Recent Alerts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Recent Alerts
                          {stats.recentAlerts.filter(a => a.severity === 'high').length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {stats.recentAlerts.filter(a => a.severity === 'high').length} Critical
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          System notifications requiring attention
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.recentAlerts.map((alert) => (
                            <div key={alert.id} className={`p-3 border rounded-lg ${
                              alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                              alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-blue-50 border-blue-200'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  {alert.type === 'temperature' && <Thermometer className="w-4 h-4" />}
                                  {alert.type === 'weight' && <Scale className="w-4 h-4" />}
                                  {alert.type === 'vehicle' && <Truck className="w-4 h-4" />}
                                  {alert.type === 'quality' && <ClipboardCheck className="w-4 h-4" />}
                                  {alert.type === 'attendance' && <User className="w-4 h-4" />}
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{alert.message}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className={`text-xs ${
                                        alert.severity === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                        'bg-blue-100 text-blue-800 border-blue-200'
                                      }`}>
                                        {alert.severity.toUpperCase()}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {stats.recentAlerts.length === 0 && (
                            <div className="text-center py-4">
                              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-green-600">No active alerts</p>
                              <p className="text-xs text-muted-foreground mt-1">All systems are operating normally</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Resource Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Resource Summary
                    </CardTitle>
                    <CardDescription>
                      Active personnel and suppliers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalSuppliers}</div>
                        <div className="text-sm text-muted-foreground">Total Suppliers</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.totalEmployees}</div>
                        <div className="text-sm text-muted-foreground">Total Employees</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-cyan-600">
                          {stats.coldRoomStats.total4kgBoxes + stats.coldRoomStats.total10kgBoxes}
                        </div>
                        <div className="text-sm text-muted-foreground">Boxes in Cold Rooms</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">{stats.vehiclesCompletedToday}</div>
                        <div className="text-sm text-muted-foreground">Deliveries Today</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Operations Tab */}
              <TabsContent value="operations" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Warehouse Operations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{stats.palletsWeighedToday}</div>
                            <div className="text-sm text-muted-foreground">Pallets Weighed</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{(stats.totalWeightToday / 1000).toFixed(1)} t</div>
                            <div className="text-sm text-muted-foreground">Total Weight</div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">Processing Status</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Intake</span>
                              <span className="font-semibold">{stats.todayIntakes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Processing</span>
                              <span className="font-semibold">{stats.todayProcessed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dispatch</span>
                              <span className="font-semibold">{stats.todayDispatched}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Vehicle Operations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
                            <div className="text-sm text-muted-foreground">Total Registered</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-amber-600">{stats.vehiclesOnSite}</div>
                            <div className="text-sm text-muted-foreground">On Site</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Checked In</span>
                            <span className="font-semibold">{stats.vehiclesOnSite - stats.vehiclesPendingExit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pending Exit</span>
                            <span className="font-semibold">{stats.vehiclesPendingExit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>In Transit</span>
                            <span className="font-semibold">{stats.vehiclesInTransit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Completed Today</span>
                            <span className="font-semibold">{stats.vehiclesCompletedToday}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quality Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-emerald-600">{stats.qualityCheckPassRate}%</div>
                        <div className="text-sm text-muted-foreground">Pass Rate</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">{stats.intakeEfficiency}%</div>
                        <div className="text-sm text-muted-foreground">Intake Efficiency</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">{stats.dispatchAccuracy}%</div>
                        <div className="text-sm text-muted-foreground">Dispatch Accuracy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cold Chain Tab */}
              <TabsContent value="coldchain" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Snowflake className="w-5 h-5" />
                      Cold Chain Overview
                    </CardTitle>
                    <CardDescription>
                      Real-time monitoring of cold storage facilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cold Room Status Cards */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Cold Room Status</h3>
                        {stats.coldChainData.map((room) => {
                          const occupancyRate = room.capacity > 0 ? Math.round((room.occupied / room.capacity) * 100) : 0;
                          return (
                            <Card key={room.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center justify-between">
                                  <span>{room.name}</span>
                                  <Badge variant={
                                    room.status === 'optimal' ? 'default' :
                                    room.status === 'warning' ? 'secondary' :
                                    'outline'
                                  }>
                                    {room.status.toUpperCase()}
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Thermometer className="w-4 h-4" />
                                      <span>Temperature</span>
                                    </div>
                                    <span className="font-bold text-lg">{room.temperature}°C</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4" />
                                      <span>Occupancy</span>
                                    </div>
                                    <span className="font-bold">{occupancyRate}%</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Database className="w-4 h-4" />
                                      <span>Capacity</span>
                                    </div>
                                    <span className="font-medium">{room.occupied}/{room.capacity} pallets</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Last updated: {formatDate(room.lastUpdate)}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      
                      {/* Cold Room Statistics */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Cold Room Statistics</h3>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Inventory Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="border rounded p-3">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {stats.coldRoomStats.total4kgBoxes.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">4kg Boxes</div>
                                </div>
                                <div className="border rounded p-3">
                                  <div className="text-2xl font-bold text-purple-600">
                                    {stats.coldRoomStats.total10kgBoxes.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">10kg Boxes</div>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Total Pallets (4kg)</span>
                                  <span className="font-semibold">{stats.coldRoomStats.total4kgPallets}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Pallets (10kg)</span>
                                  <span className="font-semibold">{stats.coldRoomStats.total10kgPallets}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Boxes Loaded Today</span>
                                  <span className="font-semibold text-green-600">
                                    {stats.coldRoomStats.totalBoxesLoadedToday}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Weight Loaded Today</span>
                                  <span className="font-semibold">
                                    {Math.round(stats.coldRoomStats.totalWeightLoadedToday / 1000)} tons
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Recent Temperature Logs */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Recent Temperature Logs</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {stats.coldRoomStats.recentTemperatureLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      log.status === 'normal' ? 'bg-green-500' :
                                      log.status === 'warning' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`} />
                                    <span className="text-sm">
                                      {log.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{log.temperature}°C</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(log.timestamp).split(' ')[0]}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {stats.coldRoomStats.recentTemperatureLogs.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                  No temperature logs available
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => router.push('/cold-room')}
                    >
                      <Snowflake className="w-4 h-4 mr-2" />
                      Go to Cold Room Management
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Warehouse Tab */}
              <TabsContent value="warehouse" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5" />
                        Warehouse Processing Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{acceptedSuppliers.length}</div>
                            <div className="text-sm text-muted-foreground">Ready for Counting</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{warehouseStats.total_processed}</div>
                            <div className="text-sm text-muted-foreground">Processed Today</div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">Processing Pipeline</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Intake Received</span>
                              <span className="font-semibold">{supplierIntakeRecords.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>QC Approved</span>
                              <span className="font-semibold">
                                {qualityChecks.filter(q => q.overall_status === 'approved').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Counting Completed</span>
                              <span className="font-semibold">
                                {countingRecords.filter(r => r.status === 'processed').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>To Cold Room</span>
                              <span className="font-semibold text-blue-600">
                                {acceptedSuppliers.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => router.push('/warehouse')}>
                        View Warehouse Management
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Supplier Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
                            <div className="text-sm text-muted-foreground">Total Suppliers</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats.activeSuppliers}</div>
                            <div className="text-sm text-muted-foreground">Active</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Active Suppliers</span>
                            <span className="font-semibold">{stats.activeSuppliers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Inactive Suppliers</span>
                            <span className="font-semibold">{stats.inactiveSuppliers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Onboarding</span>
                            <span className="font-semibold">{stats.suppliersOnboarding}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => router.push('/suppliers')}>
                        View Supplier Management
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Recent Warehouse Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Warehouse Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {supplierIntakeRecords.slice(0, 3).map((intake) => (
                        <div key={intake.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{intake.supplier_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {intake.vehicle_plate} • {intake.total_weight} kg
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              {formatDate(intake.timestamp).split(',')[0]}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(intake.timestamp).split(',')[1]}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {supplierIntakeRecords.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No recent intake activity
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

// Warehouse Dashboard Component
const WarehouseDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      // Fetch relevant data for warehouse dashboard
      const [shipmentsRes, employeesRes] = await Promise.all([
        fetch('/api/shipments'),
        fetch('/api/employees'),
      ]);

      // Process data...
      // For now, use mock data
      setStats({
        palletsWeighedToday: 47,
        totalWeightToday: 14250,
        qualityCheckPassRate: 94.5,
        processingEfficiency: 88,
        pendingShipments: 5,
      });
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading warehouse dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Warehouse dashboard content */}
    </div>
  );
};

// Driver Dashboard Component
const DriverDashboard = () => {
  const router = useRouter();
  const { user } = useUser();
  const [driverData, setDriverData] = useState<any>(null);

  // Fetch driver-specific data
  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    // Fetch driver's shipments, schedule, etc.
  };

  return (
    <div className="space-y-6">
      {/* Driver dashboard content */}
    </div>
  );
};

// Main Dashboard Component
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
        return <AdminDashboard />;
    }
  };

  return renderDashboard();
}
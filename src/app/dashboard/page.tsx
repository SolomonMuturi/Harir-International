// app/dashboard/page.tsx
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
  Thermometer,
  Users,
  Truck,
  Scale,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Loader2,
  Activity,
  ClipboardCheck,
  Building,
  Percent,
  Snowflake,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  Droplets,
  Target,
  Shield,
  Layers,
  ThermometerSnowflake,
  Home,
  Weight,
  XCircle,
  User,
} from 'lucide-react';
import { ColdChainChart } from '@/components/dashboard/cold-chain-chart';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Types
interface DashboardStats {
  totalEmployees: number;
  employeesPresentToday: number;
  employeesOnLeave: number;
  attendanceRate: number;
  employeesByContract: {
    fullTime: number;
    partTime: number;
    contract: number;
  };
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  suppliersOnboarding: number;
  totalVehicles: number;
  vehiclesOnSite: number;
  vehiclesInTransit: number;
  vehiclesPendingExit: number;
  vehiclesCompletedToday: number;
  palletsWeighedToday: number;
  totalWeightToday: number;
  coldRoomCapacity: number;
  qualityCheckPassRate: number;
  todayIntakes: number;
  todayProcessed: number;
  todayDispatched: number;
  todayOperationalCost: number;
  monthlyOperationalCost: number;
  dieselConsumptionToday: number;
  electricityConsumptionToday: number;
  intakeEfficiency: number;
  processingEfficiency: number;
  dispatchAccuracy: number;
  recentAlerts: Array<{
    id: string;
    type: 'temperature' | 'weight' | 'vehicle' | 'quality' | 'attendance';
    message: string;
    severity: 'high' | 'medium' | 'low';
    time: string;
  }>;
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
  weeklyIntakeTrend: Array<{
    day: string;
    pallets: number;
    weight: number;
  }>;
  supplierPerformance: Array<{
    id: string;
    name: string;
    intakeWeight: number;
    totalBoxes: number;
    rejectedWeight: number;
    rejectionRate: number;
    status: 'Active' | 'Inactive' | 'Onboarding';
    region: string;
    lastDelivery: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  // Fetch all dashboard data from a single API endpoint
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
      
      setStats(result.data);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
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

  // Data for pie chart - Employee distribution
  const employeeDistributionData = [
    { name: 'Full-time', value: stats.employeesByContract.fullTime, color: '#3b82f6' },
    { name: 'Part-time', value: stats.employeesByContract.partTime, color: '#10b981' },
    { name: 'Contract', value: stats.employeesByContract.contract, color: '#8b5cf6' },
  ];

  // Data for bar chart - Cold room occupancy
  const coldRoomOccupancyData = stats.coldChainData.map(room => ({
    name: room.name,
    occupied: room.occupied,
    capacity: room.capacity,
    occupancyRate: Math.round((room.occupied / room.capacity) * 100),
  }));

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
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold tracking-tight">Operations Dashboard</h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Live
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Comprehensive overview of warehouse operations, cold chain status, and performance metrics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Updated: {lastUpdated}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="gap-2">
                  <Home className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="operations" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Operations
                </TabsTrigger>
                <TabsTrigger value="coldchain" className="gap-2">
                  <ThermometerSnowflake className="w-4 h-4" />
                  Cold Chain
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-8">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Today's Intake */}
                  <Link href="/warehouse" className="block transition-all hover:scale-[1.02]">
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span className="text-muted-foreground">Today's Intake</span>
                          <Package className="w-4 h-4 text-blue-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">{stats.todayIntakes}</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{Math.round(stats.totalWeightToday / 1000).toFixed(1)} t</span>
                            <Badge variant="outline" className="ml-auto">
                              {stats.palletsWeighedToday} pallets
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Cold Room Status */}
                  <Link href="/cold-room" className="block transition-all hover:scale-[1.02]">
                    <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span className="text-muted-foreground">Cold Room Status</span>
                          <Snowflake className="w-4 h-4 text-cyan-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">
                            {stats.coldRoomCapacity}%
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {stats.coldRoomStats.total4kgBoxes + stats.coldRoomStats.total10kgBoxes} boxes
                            </span>
                            <div className="ml-auto flex items-center gap-1">
                              {stats.coldChainData.every(room => room.status === 'optimal') ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Optimal
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Check Alerts</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Quality Pass Rate */}
                  <Link href="/quality-control" className="block transition-all hover:scale-[1.02]">
                    <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span className="text-muted-foreground">Quality Pass Rate</span>
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">{stats.qualityCheckPassRate}%</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">This week</span>
                            <div className="ml-auto flex items-center gap-1">
                              {stats.qualityCheckPassRate >= 95 ? (
                                <>
                                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                  <span className="text-emerald-600">+2.5%</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                                  <span className="text-red-600">-1.2%</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Active Suppliers */}
                  <Link href="/suppliers" className="block transition-all hover:scale-[1.02]">
                    <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span className="text-muted-foreground">Active Suppliers</span>
                          <Building className="w-4 h-4 text-purple-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">
                            {stats.activeSuppliers}/{stats.totalSuppliers}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {stats.supplierPerformance.length} with intake
                            </span>
                            <Badge variant="outline" className="ml-auto">
                              {stats.suppliersOnboarding} onboarding
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Performance & Alerts */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Performance Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Performance Metrics
                        </CardTitle>
                        <CardDescription>
                          Key operational indicators and trends
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Efficiency Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Intake Efficiency</span>
                                <Percent className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="text-2xl font-bold">{stats.intakeEfficiency}%</div>
                              <Progress value={stats.intakeEfficiency} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Processing</span>
                                <Activity className="w-4 h-4 text-green-500" />
                              </div>
                              <div className="text-2xl font-bold">{stats.processingEfficiency}%</div>
                              <Progress value={stats.processingEfficiency} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Dispatch Accuracy</span>
                                <ClipboardCheck className="w-4 h-4 text-purple-500" />
                              </div>
                              <div className="text-2xl font-bold">{stats.dispatchAccuracy}%</div>
                              <Progress value={stats.dispatchAccuracy} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Quality Rate</span>
                                <Shield className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div className="text-2xl font-bold">{stats.qualityCheckPassRate}%</div>
                              <Progress value={stats.qualityCheckPassRate} className="h-2" />
                            </div>
                          </div>

                          {/* Weekly Intake Trend */}
                          <div>
                            <h3 className="text-sm font-medium mb-4">Weekly Intake Trend</h3>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.weeklyIntakeTrend}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <XAxis dataKey="day" />
                                  <YAxis />
                                  <Tooltip />
                                  <Area 
                                    type="monotone" 
                                    dataKey="pallets" 
                                    stroke="#3b82f6" 
                                    fill="#3b82f6" 
                                    fillOpacity={0.2}
                                    name="Pallets"
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="weight" 
                                    stroke="#10b981" 
                                    fill="#10b981" 
                                    fillOpacity={0.2}
                                    name="Weight (kg)"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Cold Chain & Alerts */}
                  <div className="space-y-8">
                    {/* Cold Chain Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ThermometerSnowflake className="w-5 h-5" />
                          Cold Chain Status
                          <Badge variant="outline" className="ml-2">
                            Live
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Real-time temperature monitoring
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ColdChainChart data={stats.coldChainData} />
                        
                        {/* Cold Room Details */}
                        <div className="space-y-3 mt-4">
                          {stats.coldChainData.map((room) => {
                            const occupancyRate = Math.round((room.occupied / room.capacity) * 100);
                            return (
                              <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    room.status === 'optimal' ? 'bg-green-500' :
                                    room.status === 'warning' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`} />
                                  <div>
                                    <div className="font-medium">{room.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {room.occupied}/{room.capacity} pallets
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg flex items-center gap-1">
                                    {room.temperature}°C
                                    <Droplets className="w-4 h-4 text-blue-500" />
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {occupancyRate}% occupied
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Alerts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Recent Alerts
                          {stats.recentAlerts.filter(a => a.severity === 'high').length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {stats.recentAlerts.filter(a => a.severity === 'high').length}
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
                              'bg-black-50 border-blue-200'
                            }`}>
                              <div className="flex items-start gap-3">
                                {alert.type === 'temperature' && (
                                  <Thermometer className="w-4 h-4 text-red-500" />
                                )}
                                {alert.type === 'weight' && (
                                  <Scale className="w-4 h-4 text-blue-500" />
                                )}
                                {alert.type === 'vehicle' && (
                                  <Truck className="w-4 h-4 text-amber-500" />
                                )}
                                {alert.type === 'quality' && (
                                  <Shield className="w-4 h-4 text-emerald-500" />
                                )}
                                {alert.type === 'attendance' && (
                                  <User className="w-4 h-4 text-purple-500" />
                                )}
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{alert.message}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs ${
                                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {alert.severity.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {stats.recentAlerts.length === 0 && (
                            <div className="text-center py-4 border rounded-lg bg-green-50">
                              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm text-green-600">No active alerts</p>
                              <p className="text-xs text-green-500 mt-1">All systems operational</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
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
                                      <Layers className="w-4 h-4" />
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
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Cold Room Occupancy</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={coldRoomOccupancyData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar 
                                    dataKey="occupied" 
                                    name="Occupied Pallets" 
                                    fill="#3b82f6" 
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-6 space-y-6">
                {/* Performance Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Employee Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Employee Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={employeeDistributionData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {employeeDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Supplier Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Supplier Performance
                        <Badge variant="outline" className="ml-2">
                          {stats.supplierPerformance.length} suppliers
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Supplier performance metrics based on intake weight and boxes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats.supplierPerformance.length > 0 ? (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                          {stats.supplierPerformance.map((supplier) => (
                            <div key={supplier.id} className="space-y-3 p-3 border rounded-lg hover:bg-black-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    supplier.status === 'Active' ? 'bg-green-500' :
                                    supplier.status === 'Inactive' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`} />
                                  <div>
                                    <span className="text-sm font-medium truncate">{supplier.name}</span>
                                    <div className="text-xs text-muted-foreground">{supplier.region}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={
                                    supplier.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                                    supplier.status === 'Inactive' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                  }>
                                    {supplier.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Performance Metrics Grid */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <Weight className="w-3 h-3" />
                                    Intake Weight
                                  </div>
                                  <div className="font-semibold text-lg">
                                    {(supplier.intakeWeight / 1000).toFixed(1)} t
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {supplier.intakeWeight.toLocaleString()} kg
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <Package className="w-3 h-3" />
                                    Boxes
                                  </div>
                                  <div className="font-semibold text-lg">
                                    {supplier.totalBoxes.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    total boxes/crates
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Rejected
                                  </div>
                                  <div className="font-semibold text-lg">
                                    {(supplier.rejectedWeight / 1000).toFixed(1)} t
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {supplier.rejectionRate.toFixed(1)}% rate
                                  </div>
                                </div>
                              </div>
                              
                              {/* Progress Bars */}
                              <div className="space-y-2">
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Intake Weight</span>
                                    <span className="font-medium">{supplier.intakeWeight.toLocaleString()} kg</span>
                                  </div>
                                  <Progress 
                                    value={Math.min((supplier.intakeWeight / 10000) * 100, 100)} 
                                    className="h-2" 
                                  />
                                </div>
                                
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Rejection Rate</span>
                                    <span className={
                                      supplier.rejectionRate > 10 ? 'text-red-600 font-medium' :
                                      supplier.rejectionRate > 5 ? 'text-yellow-600 font-medium' :
                                      'text-green-600 font-medium'
                                    }>
                                      {supplier.rejectionRate.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={Math.min(supplier.rejectionRate, 100)} 
                                    className={`h-2 ${
                                      supplier.rejectionRate > 10 ? '[&>div]:bg-red-500' :
                                      supplier.rejectionRate > 5 ? '[&>div]:bg-yellow-500' :
                                      '[&>div]:bg-green-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No supplier intake data available</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supplier intake data will appear here after weight capture
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => router.push('/weight-capture')}
                          >
                            <Scale className="w-4 h-4 mr-2" />
                            Go to Weight Capture
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Total Intake Weight</span>
                          <span className="text-sm font-semibold">
                            {(stats.supplierPerformance.reduce((acc, sp) => acc + sp.intakeWeight, 0) / 1000).toFixed(1)} tons
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Boxes Processed</span>
                          <span className="text-sm font-semibold">
                            {stats.supplierPerformance.reduce((acc, sp) => acc + sp.totalBoxes, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>

                {/* Operational Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Operational Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.weeklyIntakeTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f8f5f5ff" />
                          <XAxis dataKey="day" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="pallets"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Pallets"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="weight"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Weight (kg)"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {stats.supplierPerformance.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Suppliers with Intake</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {(stats.supplierPerformance.reduce((acc, sp) => acc + sp.intakeWeight, 0) / 1000).toFixed(1)}t
                        </div>
                        <div className="text-sm text-muted-foreground">Total Intake Weight</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-600">
                          {stats.supplierPerformance.reduce((acc, sp) => acc + sp.totalBoxes, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Boxes Processed</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">
                          {(stats.supplierPerformance.reduce((acc, sp) => acc + sp.rejectedWeight, 0) / 1000).toFixed(1)}t
                        </div>
                        <div className="text-sm text-muted-foreground">Total Rejected Weight</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
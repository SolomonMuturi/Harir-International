'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  DollarSign, 
  Thermometer, 
  Bolt, 
  Zap, 
  Droplet, 
  Fuel, 
  Clock, 
  AlertTriangle, 
  BarChart, 
  PieChart, 
  Download, 
  Filter, 
  X, 
  Wifi, 
  Building,
  Cpu,
  Snowflake,
  Activity,
  Bell,
  Calendar,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Eye,
  BarChart3,
  CalendarDays,
  FileText,
  Users,
  Save,
  Play,
  StopCircle,
  ArrowLeft
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

// Define utility rates
const UTILITY_RATES = {
  electricity: 25, // KES per kWh
  water: 130,      // KES per m³
  diesel: 74       // KES per liter
} as const;

// Initialize with defaults
const initialEnergyOverview = {
    totalConsumption: { title: 'Total Power (Today)', value: '0 kWh', change: 'No data yet', changeType: 'neutral' as const, icon: Zap, color: 'text-blue-400' },
    monthlyCost: { title: 'Est. Monthly Cost', value: 'KES 0', change: `KES ${UTILITY_RATES.electricity}/kWh`, changeType: 'neutral' as const, icon: DollarSign, color: 'text-green-400' },
    peakDemand: { title: 'Peak Demand', value: '0 kW', change: 'No data', changeType: 'neutral' as const, icon: Bolt, color: 'text-yellow-400' },
    powerFactor: { title: 'Efficiency', value: '0.00', change: 'No data', changeType: 'neutral' as const, icon: TrendingUp, color: 'text-purple-400' },
};

const initialWaterOverview = {
    totalConsumption: { title: 'Total Water (Today)', value: '0 m³', change: 'No data yet', changeType: 'neutral' as const, icon: Droplet, color: 'text-cyan-400' },
    monthlyCost: { title: 'Water Cost', value: 'KES 0', change: `KES ${UTILITY_RATES.water}/m³`, changeType: 'neutral' as const, icon: DollarSign, color: 'text-blue-400' },
    qualityStatus: { title: 'Water Quality', value: 'Good', change: 'Monitoring', changeType: 'neutral' as const, icon: Thermometer, color: 'text-green-400' },
    recyclingRate: { title: 'Savings', value: '0%', change: 'Recycling rate', changeType: 'neutral' as const, icon: Activity, color: 'text-teal-400' },
};

// Add diesel overview
const initialDieselOverview = {
    consumptionToday: { title: 'Diesel Today', value: '0 L', change: 'Generator runtime', changeType: 'neutral' as const, icon: Fuel, color: 'text-orange-400' },
    avgDailyConsumption: { title: 'Avg Daily', value: '0 L', change: 'Last 7 days', changeType: 'neutral' as const, icon: BarChart3, color: 'text-red-400' },
    monthlyCost: { title: 'Monthly Cost', value: 'KES 0', change: `KES ${UTILITY_RATES.diesel}/L`, changeType: 'neutral' as const, icon: DollarSign, color: 'text-amber-400' },
    estimatedRuntime: { title: 'Runtime', value: '0 hrs', change: 'Estimated hours', changeType: 'neutral' as const, icon: Clock, color: 'text-purple-400' },
};

// Add internet overview
const initialInternetOverview = {
    totalCost: { title: 'Total Internet', value: 'KES 0', change: 'Monthly cost', changeType: 'neutral' as const, icon: Wifi, color: 'text-purple-400' },
    safaricomCost: { title: 'Safaricom', value: 'KES 0', change: 'Per month', changeType: 'neutral' as const, icon: Wifi, color: 'text-blue-400' },
    internet5GCost: { title: '5G Internet', value: 'KES 0', change: 'Per month', changeType: 'neutral' as const, icon: Wifi, color: 'text-green-400' },
    syokinetCost: { title: 'Syokinet', value: 'KES 0', change: 'Per month', changeType: 'neutral' as const, icon: Wifi, color: 'text-cyan-400' },
};

// Types for utility readings
interface UtilityReading {
  id: string;
  date: string;
  powerOpening: string;
  powerClosing: string;
  powerConsumed: string;
  waterOpening: string;
  waterClosing: string;
  waterConsumed: string;
  generatorStart: string;
  generatorStop: string;
  timeConsumed: string;
  dieselConsumed: string;
  dieselRefill: string | null;
  recordedBy: string;
  shift: string | null;
  notes: string | null;
  metadata?: any;
}

// Types for chart data
interface ChartDataPoint {
  date: string;
  value: number;
}

// Area breakdown interface
interface AreaBreakdown {
  office: number;
  machine: number;
  coldroom1: number;
  coldroom2: number;
  other: number;
}

// OverviewCard Component (now included inline)
function OverviewCard({ data, className }: any) {
  const { title, value, change, changeType, icon: Icon, color = 'text-blue-500' } = data;
  
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'decrease':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'neutral':
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      case 'neutral':
        return '→';
      default:
        return '→';
    }
  };

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/30 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getChangeColor()}`}>
              {getChangeIcon()} {change}
            </span>
          </div>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-gray-800/50 ${color.replace('text-', 'bg-').replace('-400', '-900/30')}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// UtilityMonitors Component (now included inline)
function UtilityMonitors({ onSaveSuccess }: any) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('power');
  const [recordedBy, setRecordedBy] = useState('');
  const [shift, setShift] = useState('Morning');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Power States
  const [powerReadings, setPowerReadings] = useState({
    office: { opening: '', closing: '' },
    machine: { opening: '', closing: '' },
    coldroom1: { opening: '', closing: '' },
    coldroom2: { opening: '', closing: '' },
    other: { opening: '', closing: '' },
  });
  const [otherActivity, setOtherActivity] = useState('');
  
  // Water States
  const [waterReadings, setWaterReadings] = useState({
    meter1: { opening: '', closing: '' },
    meter2: { opening: '', closing: '' },
  });
  
  // Internet States
  const [internetCosts, setInternetCosts] = useState({
    safaricom: '',
    internet5G: '',
    syokinet: '',
  });
  const [internetBillingCycle, setInternetBillingCycle] = useState('');
  
  // Generator States
  const [generatorStart, setGeneratorStart] = useState('08:00');
  const [generatorStop, setGeneratorStop] = useState('10:30');
  const [dieselRefill, setDieselRefill] = useState('');
  const [dieselConsumed, setDieselConsumed] = useState('');
  const [notes, setNotes] = useState('');

  // Notification States
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedName = localStorage.getItem('recordedBy') || '';
    const savedTime = localStorage.getItem('notificationTime') || '09:00';
    const notifications = localStorage.getItem('notificationsEnabled') === 'true';
    
    if (savedName) setRecordedBy(savedName);
    setNotificationTime(savedTime);
    setNotificationsEnabled(notifications);
  }, []);

  // Calculate power consumption
  const calculatePowerConsumption = () => {
    const calculate = (opening: string, closing: string) => {
      const openingNum = Number(opening) || 0;
      const closingNum = Number(closing) || 0;
      return closingNum > openingNum ? closingNum - openingNum : 0;
    };

    return {
      office: calculate(powerReadings.office.opening, powerReadings.office.closing),
      machine: calculate(powerReadings.machine.opening, powerReadings.machine.closing),
      coldroom1: calculate(powerReadings.coldroom1.opening, powerReadings.coldroom1.closing),
      coldroom2: calculate(powerReadings.coldroom2.opening, powerReadings.coldroom2.closing),
      other: calculate(powerReadings.other.opening, powerReadings.other.closing),
    };
  };

  // Calculate water consumption
  const calculateWaterConsumption = () => {
    const calculate = (opening: string, closing: string) => {
      const openingNum = Number(opening) || 0;
      const closingNum = Number(closing) || 0;
      return closingNum > openingNum ? closingNum - openingNum : 0;
    };

    return {
      meter1: calculate(waterReadings.meter1.opening, waterReadings.meter1.closing),
      meter2: calculate(waterReadings.meter2.opening, waterReadings.meter2.closing),
    };
  };

  // Calculate generator runtime and diesel
  const calculateGeneratorData = () => {
    const [startHour, startMin] = generatorStart.split(':').map(Number);
    const [stopHour, stopMin] = generatorStop.split(':').map(Number);
    
    let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalHours = totalMinutes / 60;
    
    const calculatedDiesel = totalHours * 7; // 7L per hour
    
    return {
      hours,
      minutes,
      totalHours,
      diesel: dieselConsumed ? Number(dieselConsumed) : calculatedDiesel,
    };
  };

  // Setup daily notifications
  const setupDailyNotifications = (time: string) => {
    if ('Notification' in window && notificationsEnabled) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          const [hours, minutes] = time.split(':').map(Number);
          const now = new Date();
          const scheduledTime = new Date();
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          if (scheduledTime < now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
          }
          
          const timeUntilNotification = scheduledTime.getTime() - now.getTime();
          
          setTimeout(() => {
            new Notification('Utility Tracking Reminder', {
              body: 'Remember to fill in today\'s utility readings!',
              icon: '/icon.png',
              tag: 'daily-utility-reminder',
            });
            setupDailyNotifications(time);
          }, timeUntilNotification);
        }
      });
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('notificationsEnabled', newState.toString());
    
    if (newState) {
      localStorage.setItem('notificationTime', notificationTime);
      setupDailyNotifications(notificationTime);
      alert(`Notifications Enabled!\nDaily reminders set for ${notificationTime}`);
    } else {
      alert('Notifications Disabled');
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      const generatorData = calculateGeneratorData();
      const powerConsumption = calculatePowerConsumption();
      const waterConsumption = calculateWaterConsumption();
      
      // Prepare data
      const readingData = {
        // Power readings
        powerOfficeOpening: powerReadings.office.opening || '0',
        powerOfficeClosing: powerReadings.office.closing || '0',
        powerMachineOpening: powerReadings.machine.opening || '0',
        powerMachineClosing: powerReadings.machine.closing || '0',
        powerColdroom1Opening: powerReadings.coldroom1.opening || '0',
        powerColdroom1Closing: powerReadings.coldroom1.closing || '0',
        powerColdroom2Opening: powerReadings.coldroom2.opening || '0',
        powerColdroom2Closing: powerReadings.coldroom2.closing || '0',
        powerOtherOpening: powerReadings.other.opening || '0',
        powerOtherClosing: powerReadings.other.closing || '0',
        powerOtherActivity: otherActivity || '',
        
        // Water readings
        waterMeter1Opening: waterReadings.meter1.opening || '0',
        waterMeter1Closing: waterReadings.meter1.closing || '0',
        waterMeter2Opening: waterReadings.meter2.opening || '0',
        waterMeter2Closing: waterReadings.meter2.closing || '0',
        
        // Internet costs
        internetSafaricom: internetCosts.safaricom || '0',
        internet5G: internetCosts.internet5G || '0',
        internetSyokinet: internetCosts.syokinet || '0',
        internetBillingCycle: internetBillingCycle || '',
        
        // Generator data
        generatorStart,
        generatorStop,
        dieselRefill: dieselRefill || '0',
        dieselConsumed: dieselConsumed || generatorData.diesel.toString(),
        
        // Record details
        recordedBy: recordedBy || 'System',
        shift,
        date,
        notes: notes || '',
      };
      
      const response = await fetch('/api/utility-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readingData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('recordedBy', recordedBy);
        alert('All utility readings saved successfully!');
        
        // Reset form
        setPowerReadings({
          office: { opening: powerReadings.office.closing, closing: '' },
          machine: { opening: powerReadings.machine.closing, closing: '' },
          coldroom1: { opening: powerReadings.coldroom1.closing, closing: '' },
          coldroom2: { opening: powerReadings.coldroom2.closing, closing: '' },
          other: { opening: powerReadings.other.closing, closing: '' },
        });
        
        setWaterReadings({
          meter1: { opening: waterReadings.meter1.closing, closing: '' },
          meter2: { opening: waterReadings.meter2.closing, closing: '' },
        });
        
        setDieselRefill('');
        setDieselConsumed('');
        setNotes('');
        
        if (onSaveSuccess) onSaveSuccess();
        
      } else {
        alert('Failed to save readings: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving readings:', error);
      alert('An error occurred while saving readings');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals for display
  const powerTotals = calculatePowerConsumption();
  const waterTotals = calculateWaterConsumption();
  const generatorTotals = calculateGeneratorData();
  
  const totalPower = Object.values(powerTotals).reduce((a, b) => a + b, 0);
  const totalWater = Object.values(waterTotals).reduce((a, b) => a + b, 0);

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Daily Utility Tracking
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Notification Settings */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <Input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-32 bg-gray-800 border-gray-700"
                disabled={!notificationsEnabled}
              />
              <Button
                variant={notificationsEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleNotificationToggle}
                className={notificationsEnabled ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {notificationsEnabled ? 'On' : 'Off'}
              </Button>
            </div>
            
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Label htmlFor="reading-date" className="text-sm text-gray-400">Date</Label>
              <Input
                id="reading-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 bg-gray-800 border border-gray-700">
            <TabsTrigger value="power" className="data-[state=active]:bg-blue-900">
              <Zap className="h-4 w-4 mr-2" />
              Power
            </TabsTrigger>
            <TabsTrigger value="water" className="data-[state=active]:bg-cyan-900">
              <Droplet className="h-4 w-4 mr-2" />
              Water
            </TabsTrigger>
            <TabsTrigger value="internet" className="data-[state=active]:bg-purple-900">
              <Wifi className="h-4 w-4 mr-2" />
              Internet
            </TabsTrigger>
            <TabsTrigger value="generator" className="data-[state=active]:bg-orange-900">
              <Fuel className="h-4 w-4 mr-2" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-green-900">
              <Activity className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
          </TabsList>
          
          {/* Power Tab */}
          <TabsContent value="power" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Office Power */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-400">
                  <Building className="h-4 w-4" /> Office
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.office.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      office: { ...prev.office, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.office.closing}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      office: { ...prev.office, closing: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-blue-400">{powerTotals.office.toFixed(2)} kWh</p>
                </div>
              </div>
              
              {/* Machine Power */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-green-400">
                  <Cpu className="h-4 w-4" /> Machine
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.machine.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      machine: { ...prev.machine, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.machine.closing}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      machine: { ...prev.machine, closing: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-green-400">{powerTotals.machine.toFixed(2)} kWh</p>
                </div>
              </div>
              
              {/* Coldroom 1 */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-cyan-400">
                  <Snowflake className="h-4 w-4" /> Coldroom 1
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.coldroom1.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      coldroom1: { ...prev.coldroom1, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.coldroom1.closing}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      coldroom1: { ...prev.coldroom1, closing: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-cyan-400">{powerTotals.coldroom1.toFixed(2)} kWh</p>
                </div>
              </div>
              
              {/* Coldroom 2 */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-300">
                  <Snowflake className="h-4 w-4" /> Coldroom 2
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.coldroom2.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      coldroom2: { ...prev.coldroom2, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.coldroom2.closing}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      coldroom2: { ...prev.coldroom2, closing: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-blue-300">{powerTotals.coldroom2.toFixed(2)} kWh</p>
                </div>
              </div>
              
              {/* Other Activities */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-purple-400">
                  <Activity className="h-4 w-4" /> Other Activities
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Activity Type</Label>
                  <Input 
                    placeholder="e.g., Welding, Maintenance"
                    value={otherActivity}
                    onChange={(e) => setOtherActivity(e.target.value)}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.other.opening}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      other: { ...prev.other, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Closing (kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerReadings.other.closing}
                    onChange={(e) => setPowerReadings(prev => ({
                      ...prev,
                      other: { ...prev.other, closing: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-purple-400">{powerTotals.other.toFixed(2)} kWh</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Water Tab */}
          <TabsContent value="water" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Water Meter 1 */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-cyan-400">
                  <Droplet className="h-4 w-4" /> Water Meter 1
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (m³)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={waterReadings.meter1.opening}
                    onChange={(e) => setWaterReadings(prev => ({
                      ...prev,
                      meter1: { ...prev.meter1, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Closing (m³)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={waterReadings.meter1.closing}
                    onChange={(e) => setWaterReadings(prev => ({
                      ...prev,
                      meter1: { ...prev.meter1, closing: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-cyan-400">{waterTotals.meter1.toFixed(2)} m³</p>
                </div>
              </div>
              
              {/* Water Meter 2 */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-400">
                  <Droplet className="h-4 w-4" /> Water Meter 2
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Opening (m³)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={waterReadings.meter2.opening}
                    onChange={(e) => setWaterReadings(prev => ({
                      ...prev,
                      meter2: { ...prev.meter2, opening: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Closing (m³)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={waterReadings.meter2.closing}
                    onChange={(e) => setWaterReadings(prev => ({
                      ...prev,
                      meter2: { ...prev.meter2, closing: e.target.value }
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Consumed</p>
                  <p className="text-xl font-bold text-blue-400">{waterTotals.meter2.toFixed(2)} m³</p>
                </div>
              </div>
            </div>
            
            {/* Water Total Summary */}
            <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-800/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Meter 1 Consumption</p>
                  <p className="text-2xl font-bold text-cyan-400">{waterTotals.meter1.toFixed(2)} m³</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Meter 2 Consumption</p>
                  <p className="text-2xl font-bold text-blue-400">{waterTotals.meter2.toFixed(2)} m³</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Total Water Consumed</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {totalWater.toFixed(2)} m³
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Internet Tab */}
          <TabsContent value="internet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Safaricom */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-purple-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-purple-400">
                  <Wifi className="h-4 w-4" /> Safaricom
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Monthly Cost (KES)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={internetCosts.safaricom}
                    onChange={(e) => setInternetCosts(prev => ({
                      ...prev,
                      safaricom: e.target.value
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Weekly Cost</p>
                  <p className="text-xl font-bold text-purple-400">
                    KES {((Number(internetCosts.safaricom) || 0) / 4.33).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Daily: KES {((Number(internetCosts.safaricom) || 0) / 30).toFixed(2)}</p>
                </div>
              </div>
              
              {/* 5G Internet */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-blue-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-400">
                  <Wifi className="h-4 w-4" /> 5G Internet
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Monthly Cost (KES)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={internetCosts.internet5G}
                    onChange={(e) => setInternetCosts(prev => ({
                      ...prev,
                      internet5G: e.target.value
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Weekly Cost</p>
                  <p className="text-xl font-bold text-blue-400">
                    KES {((Number(internetCosts.internet5G) || 0) / 4.33).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Daily: KES {((Number(internetCosts.internet5G) || 0) / 30).toFixed(2)}</p>
                </div>
              </div>
              
              {/* Syokinet */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-green-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-green-400">
                  <Wifi className="h-4 w-4" /> Syokinet
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Monthly Cost (KES)</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={internetCosts.syokinet}
                    onChange={(e) => setInternetCosts(prev => ({
                      ...prev,
                      syokinet: e.target.value
                    }))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Weekly Cost</p>
                  <p className="text-xl font-bold text-green-400">
                    KES {((Number(internetCosts.syokinet) || 0) / 4.33).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Daily: KES {((Number(internetCosts.syokinet) || 0) / 30).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-400">Billing Cycle (e.g., 1st-30th)</Label>
                <Input 
                  placeholder="Monthly billing cycle"
                  value={internetBillingCycle}
                  onChange={(e) => setInternetBillingCycle(e.target.value)}
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              
              {/* Internet Total Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-900/20 to-green-900/20 border border-purple-800/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Safaricom</p>
                    <p className="text-lg font-bold text-purple-400">
                      KES {(Number(internetCosts.safaricom) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">5G Internet</p>
                    <p className="text-lg font-bold text-blue-400">
                      KES {(Number(internetCosts.internet5G) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Syokinet</p>
                    <p className="text-lg font-bold text-green-400">
                      KES {(Number(internetCosts.syokinet) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total Monthly</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                      KES {(
                        (Number(internetCosts.safaricom) || 0) + 
                        (Number(internetCosts.internet5G) || 0) + 
                        (Number(internetCosts.syokinet) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generator Runtime */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-orange-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-orange-400">
                  <Clock className="h-4 w-4" /> Generator Runtime
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Start Time</Label>
                    <Input 
                      type="time"
                      value={generatorStart}
                      onChange={(e) => setGeneratorStart(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Stop Time</Label>
                    <Input 
                      type="time"
                      value={generatorStop}
                      onChange={(e) => setGeneratorStop(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-center"
                    />
                  </div>
                </div>
                <div className="text-center bg-gray-900 p-3 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-400">Total Runtime</p>
                  <p className="text-xl font-bold text-orange-400">
                    {generatorTotals.hours}h {generatorTotals.minutes}m
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {generatorStart} → {generatorStop}
                  </p>
                </div>
              </div>
              
              {/* Diesel Tracking */}
              <div className="space-y-4 p-4 bg-gray-800/50 border border-red-700/50 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-red-400">
                  <Fuel className="h-4 w-4" /> Diesel Tracking
                </h3>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Diesel Consumed (L)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Auto-calculated from runtime"
                    value={dieselConsumed}
                    onChange={(e) => setDieselConsumed(e.target.value)}
                    className="bg-gray-900 border-gray-700"
                  />
                  <p className="text-xs text-gray-400">
                    Auto calculation: {generatorTotals.diesel.toFixed(2)} L (7L/hour)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Diesel Refill (L)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="e.g., 500"
                    value={dieselRefill}
                    onChange={(e) => setDieselRefill(e.target.value)}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Power Summary */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-400">
                  <Zap className="h-4 w-4" /> Power Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Office:</span>
                    <span className="text-blue-400">{powerTotals.office.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Machine:</span>
                    <span className="text-green-400">{powerTotals.machine.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Coldroom 1:</span>
                    <span className="text-cyan-400">{powerTotals.coldroom1.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Coldroom 2:</span>
                    <span className="text-blue-300">{powerTotals.coldroom2.toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Other:</span>
                    <span className="text-purple-400">{powerTotals.other.toFixed(2)} kWh</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total Power:</span>
                      <span className="text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {totalPower.toFixed(2)} kWh
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Water Summary */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-cyan-400">
                  <Droplet className="h-4 w-4" /> Water Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Meter 1:</span>
                    <span className="text-cyan-400">{waterTotals.meter1.toFixed(2)} m³</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Meter 2:</span>
                    <span className="text-blue-400">{waterTotals.meter2.toFixed(2)} m³</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total Water:</span>
                      <span className="text-xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {totalWater.toFixed(2)} m³
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Generator & Internet Summary */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-orange-400">
                  <Activity className="h-4 w-4" /> Other Summary
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Generator Runtime</p>
                    <p className="text-lg font-bold text-orange-400">
                      {generatorTotals.hours}h {generatorTotals.minutes}m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Diesel Consumed</p>
                    <p className="text-lg font-bold text-red-400">
                      {generatorTotals.diesel.toFixed(2)} L
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Internet Cost</p>
                    <p className="text-lg font-bold text-purple-400">
                      KES {(
                        (Number(internetCosts.safaricom) || 0) + 
                        (Number(internetCosts.internet5G) || 0) + 
                        (Number(internetCosts.syokinet) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Final Summary Card */}
            <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg">
              <h3 className="font-medium text-lg mb-4 text-center">Daily Totals Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Total Power Consumed</p>
                  <p className="text-3xl font-bold text-blue-400">{totalPower.toFixed(2)} kWh</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Total Water Consumed</p>
                  <p className="text-3xl font-bold text-cyan-400">{totalWater.toFixed(2)} m³</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Diesel Consumed</p>
                  <p className="text-3xl font-bold text-orange-400">{generatorTotals.diesel.toFixed(2)} L</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Record Information */}
        <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="font-medium mb-4 text-gray-300">Record Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Recorded By</Label>
              <Input 
                placeholder="Your name"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Shift</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="Morning" className="hover:bg-gray-800">Morning</SelectItem>
                  <SelectItem value="Evening" className="hover:bg-gray-800">Evening</SelectItem>
                  <SelectItem value="Night" className="hover:bg-gray-800">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Selected Date</Label>
              <Input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Notes (Optional)</Label>
              <Input 
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-gray-900 border-gray-700"
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <div className="p-6 border-t border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <AlertTriangle className="h-4 w-4" />
          {notificationsEnabled ? (
            <span>Daily reminders set for {notificationTime}</span>
          ) : (
            <span>Enable notifications for daily reminders</span>
          )}
        </div>
        <Button 
          onClick={handleSaveChanges} 
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Save className="mr-2" />
          {isSaving ? 'Saving...' : 'Save All Readings'}
        </Button>
      </div>
    </Card>
  );
}

// Main Dashboard Component
export default function UtilityManagementPage() {
    const [energyOverview, setEnergyOverview] = useState(initialEnergyOverview);
    const [waterOverview, setWaterOverview] = useState(initialWaterOverview);
    const [dieselOverview, setDieselOverview] = useState(initialDieselOverview);
    const [internetOverview, setInternetOverview] = useState(initialInternetOverview);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPower, setTotalPower] = useState(0);
    const [totalWater, setTotalWater] = useState(0);
    const [totalDiesel, setTotalDiesel] = useState(0);
    const [totalInternet, setTotalInternet] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<string>('Never');
    
    // Breakdown data
    const [powerBreakdown, setPowerBreakdown] = useState<AreaBreakdown>({
      office: 0,
      machine: 0,
      coldroom1: 0,
      coldroom2: 0,
      other: 0
    });
    const [waterBreakdown, setWaterBreakdown] = useState({
      meter1: 0,
      meter2: 0
    });
    
    // Data states
    const [readings, setReadings] = useState<UtilityReading[]>([]);

    // Date filter states
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('today');
    const [utilityTypeFilter, setUtilityTypeFilter] = useState<'all' | 'power' | 'water' | 'diesel' | 'internet'>('all');
    const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'analytics'>('overview');

    // Fetch utility data
    const fetchUtilityData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            let url = '/api/utility-readings?limit=100';
            if (dateFilter !== 'all') {
              url += `&period=${dateFilter}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Set readings
            setReadings(data.readings || []);
            
            // Calculate totals
            let powerTotal = 0;
            let waterTotal = 0;
            let dieselTotal = 0;
            let internetTotal = 0;
            
            const powerBreakdown: AreaBreakdown = {
                office: 0,
                machine: 0,
                coldroom1: 0,
                coldroom2: 0,
                other: 0
            };
            
            const waterBreakdown = {
                meter1: 0,
                meter2: 0
            };
            
            data.readings.forEach((reading: UtilityReading) => {
                const metadata = reading.metadata || {};
                
                // Power breakdown
                powerBreakdown.office += metadata.powerOfficeConsumed || 0;
                powerBreakdown.machine += metadata.powerMachineConsumed || 0;
                powerBreakdown.coldroom1 += metadata.powerColdroom1Consumed || 0;
                powerBreakdown.coldroom2 += metadata.powerColdroom2Consumed || 0;
                powerBreakdown.other += metadata.powerOtherConsumed || 0;
                
                // Water breakdown
                waterBreakdown.meter1 += metadata.waterMeter1Consumed || 0;
                waterBreakdown.meter2 += metadata.waterMeter2Consumed || 0;
                
                // Internet costs
                internetTotal += (metadata.internetSafaricom || 0) + 
                                (metadata.internet5G || 0) + 
                                (metadata.internetSyokinet || 0);
                
                // Totals
                powerTotal += parseFloat(reading.powerConsumed) || 0;
                waterTotal += parseFloat(reading.waterConsumed) || 0;
                dieselTotal += parseFloat(reading.dieselConsumed) || 0;
            });
            
            setTotalPower(powerTotal);
            setTotalWater(waterTotal);
            setTotalDiesel(dieselTotal);
            setTotalInternet(internetTotal);
            setPowerBreakdown(powerBreakdown);
            setWaterBreakdown(waterBreakdown);
            
            // Calculate monthly costs
            const daysInPeriod = dateFilter === 'today' ? 1 : dateFilter === 'week' ? 7 : dateFilter === 'month' ? 30 : 30;
            const powerCost = powerTotal * UTILITY_RATES.electricity * (30 / daysInPeriod);
            const waterCost = waterTotal * UTILITY_RATES.water * (30 / daysInPeriod);
            const dieselCost = dieselTotal * UTILITY_RATES.diesel * (30 / daysInPeriod);
            
            // Update energy overview
            setEnergyOverview({
                totalConsumption: { 
                    title: 'Total Power', 
                    value: `${powerTotal.toFixed(0)} kWh`, 
                    change: '+2% vs yesterday', 
                    changeType: 'increase' as const,
                    icon: Zap,
                    color: 'text-blue-400'
                },
                monthlyCost: { 
                    title: 'Est. Monthly Cost', 
                    value: `KES ${powerCost.toLocaleString()}`, 
                    change: `KES ${UTILITY_RATES.electricity}/kWh`, 
                    changeType: 'increase' as const,
                    icon: DollarSign,
                    color: 'text-green-400'
                },
                peakDemand: { 
                    title: 'Peak Demand', 
                    value: `${(powerTotal / 24).toFixed(1)} kW`, 
                    change: 'Within limits', 
                    changeType: 'increase' as const,
                    icon: Bolt,
                    color: 'text-yellow-400'
                },
                powerFactor: { 
                    title: 'Efficiency', 
                    value: '0.92', 
                    change: 'Optimal', 
                    changeType: 'increase' as const,
                    icon: TrendingUp,
                    color: 'text-purple-400'
                },
            });

            // Update water overview
            setWaterOverview({
                totalConsumption: { 
                    title: 'Total Water', 
                    value: `${waterTotal.toFixed(0)} m³`, 
                    change: '-1.3% vs yesterday', 
                    changeType: 'decrease' as const,
                    icon: Droplet,
                    color: 'text-cyan-400'
                },
                monthlyCost: { 
                    title: 'Water Cost', 
                    value: `KES ${waterCost.toLocaleString()}`, 
                    change: `KES ${UTILITY_RATES.water}/m³`, 
                    changeType: 'increase' as const,
                    icon: DollarSign,
                    color: 'text-blue-400'
                },
                qualityStatus: { 
                    title: 'Water Quality', 
                    value: 'Good', 
                    change: 'Monitoring', 
                    changeType: 'increase' as const,
                    icon: Thermometer,
                    color: 'text-green-400'
                },
                recyclingRate: { 
                    title: 'Savings', 
                    value: '15%', 
                    change: 'Recycling rate', 
                    changeType: 'increase' as const,
                    icon: Activity,
                    color: 'text-teal-400'
                },
            });

            // Update diesel overview
            const readingsList = data.readings || [];
            const avgDailyDiesel = readingsList.length > 0 
                ? readingsList.reduce((sum: number, r: any) => sum + Number(r.dieselConsumed), 0) / readingsList.length
                : 0;
            
            setDieselOverview({
                consumptionToday: { 
                    title: 'Diesel Today', 
                    value: `${dieselTotal.toFixed(1)} L`, 
                    change: 'Generator runtime', 
                    changeType: 'increase' as const,
                    icon: Fuel,
                    color: 'text-orange-400'
                },
                avgDailyConsumption: { 
                    title: 'Avg Daily', 
                    value: `${avgDailyDiesel.toFixed(1)} L`, 
                    change: 'Last 7 days', 
                    changeType: 'increase' as const,
                    icon: BarChart3,
                    color: 'text-red-400'
                },
                monthlyCost: { 
                    title: 'Monthly Cost', 
                    value: `KES ${dieselCost.toLocaleString()}`, 
                    change: `KES ${UTILITY_RATES.diesel}/L`, 
                    changeType: 'increase' as const,
                    icon: DollarSign,
                    color: 'text-amber-400'
                },
                estimatedRuntime: { 
                    title: 'Runtime', 
                    value: avgDailyDiesel > 0 ? `${(500 / (avgDailyDiesel / 24)).toFixed(0)} hrs` : '0 hrs', 
                    change: 'Estimated hours', 
                    changeType: 'increase' as const,
                    icon: Clock,
                    color: 'text-purple-400'
                },
            });

            // Update internet overview
            const lastReading = readingsList[0]?.metadata || {};
            setInternetOverview({
                totalCost: { 
                    title: 'Total Internet', 
                    value: `KES ${(lastReading.internetSafaricom || 0 + lastReading.internet5G || 0 + lastReading.internetSyokinet || 0).toLocaleString()}`, 
                    change: 'Monthly cost', 
                    changeType: 'increase' as const,
                    icon: Wifi,
                    color: 'text-purple-400'
                },
                safaricomCost: { 
                    title: 'Safaricom', 
                    value: `KES ${(lastReading.internetSafaricom || 0).toLocaleString()}`, 
                    change: 'Per month', 
                    changeType: 'neutral' as const,
                    icon: Wifi,
                    color: 'text-blue-400'
                },
                internet5GCost: { 
                    title: '5G Internet', 
                    value: `KES ${(lastReading.internet5G || 0).toLocaleString()}`, 
                    change: 'Per month', 
                    changeType: 'neutral' as const,
                    icon: Wifi,
                    color: 'text-green-400'
                },
                syokinetCost: { 
                    title: 'Syokinet', 
                    value: `KES ${(lastReading.internetSyokinet || 0).toLocaleString()}`, 
                    change: 'Per month', 
                    changeType: 'neutral' as const,
                    icon: Wifi,
                    color: 'text-cyan-400'
                },
            });

            // Update last updated timestamp
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            
        } catch (error) {
            console.error('Error fetching utility data:', error);
            setError('Failed to load utility data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to refresh data when new readings are saved
    const handleRefreshData = () => {
        fetchUtilityData();
    };

    // Calculate daily internet costs
    const dailyInternetCost = totalInternet / 30;
    const weeklyInternetCost = dailyInternetCost * 7;
    
    return (
        <SidebarProvider>
            <Sidebar className="bg-gray-900 border-r border-gray-800">
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-4">
                        <FreshTraceLogo className="w-8 h-8 text-blue-400" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Harir International
                        </h1>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarNav />
                </SidebarContent>
            </Sidebar>
            <SidebarInset className="bg-black">
                <Header />
                <main className="p-4 md:p-6 lg:p-8 space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-gradient-to-r from-gray-900 to-black rounded-xl border border-gray-800">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Utility Management Dashboard
                            </h2>
                            <p className="text-gray-400 mt-2">
                                Monitor energy, water, diesel, and internet consumption across all operations
                            </p>
                            <div className="flex flex-wrap gap-4 mt-4">
                                <Badge className="bg-blue-900/50 text-blue-400 border-blue-800">
                                    <Zap className="h-3 w-3 mr-1" /> {totalPower.toFixed(0)} kWh
                                </Badge>
                                <Badge className="bg-cyan-900/50 text-cyan-400 border-cyan-800">
                                    <Droplet className="h-3 w-3 mr-1" /> {totalWater.toFixed(0)} m³
                                </Badge>
                                <Badge className="bg-orange-900/50 text-orange-400 border-orange-800">
                                    <Fuel className="h-3 w-3 mr-1" /> {totalDiesel.toFixed(1)} L
                                </Badge>
                                <Badge className="bg-purple-900/50 text-purple-400 border-purple-800">
                                    <Wifi className="h-3 w-3 mr-1" /> KES {totalInternet.toLocaleString()}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                onClick={() => fetchUtilityData()} 
                                variant="outline" 
                                className="border-gray-700 bg-gray-900 hover:bg-gray-800"
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button 
                                variant="default"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                onClick={() => window.scrollTo({ top: document.getElementById('utility-monitors')?.offsetTop, behavior: 'smooth' })}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Fill Readings
                            </Button>
                        </div>
                    </div>
                    
                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-800/50 flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5" />
                            <div className="flex-1">
                                <p className="font-medium">Error Loading Data</p>
                                <p className="text-sm">{error}</p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchUtilityData}
                                className="border-red-800 text-red-400 hover:bg-red-900/20"
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Quick Filters */}
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-gray-200">
                                        <Filter className="w-5 h-5" />
                                        Quick Filters & Export
                                    </CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Filter data by period and export reports
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-gray-700 text-gray-400">
                                        {readings.length} readings
                                    </Badge>
                                    <Button 
                                        onClick={() => alert('Export feature coming soon!')} 
                                        disabled={readings.length === 0 || isLoading}
                                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-gray-400 mb-2 block">Period Filter</Label>
                                    <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-700">
                                            <SelectItem value="today" className="hover:bg-gray-800">Today</SelectItem>
                                            <SelectItem value="week" className="hover:bg-gray-800">Last 7 Days</SelectItem>
                                            <SelectItem value="month" className="hover:bg-gray-800">Last 30 Days</SelectItem>
                                            <SelectItem value="all" className="hover:bg-gray-800">All Time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div>
                                    <Label className="text-gray-400 mb-2 block">View Mode</Label>
                                    <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                            <SelectValue placeholder="Select view" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-700">
                                            <SelectItem value="overview" className="hover:bg-gray-800">Overview</SelectItem>
                                            <SelectItem value="detailed" className="hover:bg-gray-800">Detailed</SelectItem>
                                            <SelectItem value="analytics" className="hover:bg-gray-800">Analytics</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div>
                                    <Label className="text-gray-400 mb-2 block">Utility Type</Label>
                                    <Select value={utilityTypeFilter} onValueChange={(value: any) => setUtilityTypeFilter(value)}>
                                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                            <SelectValue placeholder="Select utility" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-700">
                                            <SelectItem value="all" className="hover:bg-gray-800">All Utilities</SelectItem>
                                            <SelectItem value="power" className="hover:bg-gray-800">Power Only</SelectItem>
                                            <SelectItem value="water" className="hover:bg-gray-800">Water Only</SelectItem>
                                            <SelectItem value="diesel" className="hover:bg-gray-800">Diesel Only</SelectItem>
                                            <SelectItem value="internet" className="hover:bg-gray-800">Internet Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Internet Cost Breakdown */}
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-200">
                                <Wifi className="h-5 w-5" />
                                Internet Cost Breakdown
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Monthly internet costs breakdown (Safaricom, 5G, Syokinet)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-gradient-to-br from-blue-900/20 to-blue-900/10 rounded-lg border border-blue-800/30">
                                        <div className="text-sm text-gray-400 mb-2">Daily Cost</div>
                                        <div className="text-2xl font-bold text-blue-400">
                                            KES {dailyInternetCost.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">per day</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-purple-900/20 to-purple-900/10 rounded-lg border border-purple-800/30">
                                        <div className="text-sm text-gray-400 mb-2">Weekly Cost</div>
                                        <div className="text-2xl font-bold text-purple-400">
                                            KES {weeklyInternetCost.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">per week</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-green-900/20 to-green-900/10 rounded-lg border border-green-800/30">
                                        <div className="text-sm text-gray-400 mb-2">Monthly Cost</div>
                                        <div className="text-2xl font-bold text-green-400">
                                            KES {totalInternet.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">per month</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-cyan-900/20 to-cyan-900/10 rounded-lg border border-cyan-800/30">
                                        <div className="text-sm text-gray-400 mb-2">Providers</div>
                                        <div className="text-2xl font-bold text-cyan-400">3</div>
                                        <div className="text-xs text-gray-500 mt-1">active providers</div>
                                    </div>
                                </div>
                                
                                {/* Internet Providers Breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span className="font-medium text-gray-300">Safaricom</span>
                                            </div>
                                            <Badge className="bg-blue-900/50 text-blue-400 border-blue-800">
                                                KES {internetOverview.safaricomCost.value}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-400">Primary business internet</div>
                                    </div>
                                    
                                    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <span className="font-medium text-gray-300">5G Internet</span>
                                            </div>
                                            <Badge className="bg-green-900/50 text-green-400 border-green-800">
                                                KES {internetOverview.internet5GCost.value}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-400">High-speed mobile internet</div>
                                    </div>
                                    
                                    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                                                <span className="font-medium text-gray-300">Syokinet</span>
                                            </div>
                                            <Badge className="bg-cyan-900/50 text-cyan-400 border-cyan-800">
                                                KES {internetOverview.syokinetCost.value}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-400">Backup/Office internet</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Utility Entry Form */}
                    <div id="utility-monitors">
                        <UtilityMonitors onSaveSuccess={handleRefreshData} />
                    </div>

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="block transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-900/20">
                            <OverviewCard data={energyOverview.totalConsumption} />
                        </div>
                        <div className="block transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-900/20">
                            <OverviewCard data={waterOverview.totalConsumption} />
                        </div>
                        <div className="block transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-900/20">
                            <OverviewCard data={dieselOverview.consumptionToday} />
                        </div>
                        <div className="block transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-900/20">
                            <OverviewCard data={internetOverview.totalCost} />
                        </div>
                    </div>

                    {/* Detailed Breakdown Tabs */}
                    <Tabs defaultValue="power" className="space-y-4">
                        <TabsList className="grid grid-cols-4 bg-gray-900 border border-gray-800">
                            <TabsTrigger value="power" className="data-[state=active]:bg-blue-900 data-[state=active]:text-blue-400">
                                <Zap className="h-4 w-4 mr-2" />
                                Power
                            </TabsTrigger>
                            <TabsTrigger value="water" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-400">
                                <Droplet className="h-4 w-4 mr-2" />
                                Water
                            </TabsTrigger>
                            <TabsTrigger value="diesel" className="data-[state=active]:bg-orange-900 data-[state=active]:text-orange-400">
                                <Fuel className="h-4 w-4 mr-2" />
                                Diesel
                            </TabsTrigger>
                            <TabsTrigger value="internet" className="data-[state=active]:bg-purple-900 data-[state=active]:text-purple-400">
                                <Wifi className="h-4 w-4 mr-2" />
                                Internet
                            </TabsTrigger>
                        </TabsList>
                        
                        {/* Power Tab */}
                        <TabsContent value="power" className="space-y-6">
                            <Card className="bg-gray-900 border-gray-800">
                                <CardHeader>
                                    <CardTitle className="text-gray-200">Power Consumption Breakdown</CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Detailed breakdown by area: Office, Machine, Coldrooms, Other
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-blue-800/30">
                                            <Building className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                                            <div className="text-sm text-gray-400">Office</div>
                                            <div className="text-xl font-bold text-blue-400">{powerBreakdown.office.toFixed(1)} kWh</div>
                                            <div className="text-xs text-gray-500 mt-1">{((powerBreakdown.office/totalPower)*100 || 0).toFixed(1)}%</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-green-800/30">
                                            <Cpu className="h-8 w-8 mx-auto mb-2 text-green-400" />
                                            <div className="text-sm text-gray-400">Machine</div>
                                            <div className="text-xl font-bold text-green-400">{powerBreakdown.machine.toFixed(1)} kWh</div>
                                            <div className="text-xs text-gray-500 mt-1">{((powerBreakdown.machine/totalPower)*100 || 0).toFixed(1)}%</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-cyan-800/30">
                                            <Snowflake className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
                                            <div className="text-sm text-gray-400">Coldroom 1</div>
                                            <div className="text-xl font-bold text-cyan-400">{powerBreakdown.coldroom1.toFixed(1)} kWh</div>
                                            <div className="text-xs text-gray-500 mt-1">{((powerBreakdown.coldroom1/totalPower)*100 || 0).toFixed(1)}%</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-blue-300/30">
                                            <Snowflake className="h-8 w-8 mx-auto mb-2 text-blue-300" />
                                            <div className="text-sm text-gray-400">Coldroom 2</div>
                                            <div className="text-xl font-bold text-blue-300">{powerBreakdown.coldroom2.toFixed(1)} kWh</div>
                                            <div className="text-xs text-gray-500 mt-1">{((powerBreakdown.coldroom2/totalPower)*100 || 0).toFixed(1)}%</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-purple-800/30">
                                            <Activity className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                                            <div className="text-sm text-gray-400">Other</div>
                                            <div className="text-xl font-bold text-purple-400">{powerBreakdown.other.toFixed(1)} kWh</div>
                                            <div className="text-xs text-gray-500 mt-1">{((powerBreakdown.other/totalPower)*100 || 0).toFixed(1)}%</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-400">Total Power Consumption</p>
                                                <p className="text-2xl font-bold text-white">{totalPower.toFixed(1)} kWh</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">Monthly Cost</p>
                                                <p className="text-2xl font-bold text-green-400">KES {((totalPower * UTILITY_RATES.electricity * 30) || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        {/* Water Tab */}
                        <TabsContent value="water" className="space-y-6">
                            <Card className="bg-gray-900 border-gray-800">
                                <CardHeader>
                                    <CardTitle className="text-gray-200">Water Consumption Breakdown</CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Two water meters tracking with total consumption
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="text-center p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-lg border border-cyan-800/30">
                                            <Droplet className="h-10 w-10 mx-auto mb-3 text-cyan-400" />
                                            <div className="text-sm text-gray-400 mb-1">Water Meter 1</div>
                                            <div className="text-3xl font-bold text-cyan-400">{waterBreakdown.meter1.toFixed(1)} m³</div>
                                            <div className="text-xs text-gray-400 mt-2">Primary water line</div>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-lg border border-blue-800/30">
                                            <Droplet className="h-10 w-10 mx-auto mb-3 text-blue-400" />
                                            <div className="text-sm text-gray-400 mb-1">Water Meter 2</div>
                                            <div className="text-3xl font-bold text-blue-400">{waterBreakdown.meter2.toFixed(1)} m³</div>
                                            <div className="text-xs text-gray-400 mt-2">Secondary water line</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 p-6 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg border border-gray-800">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-400">Meter 1 Consumption</p>
                                                <p className="text-2xl font-bold text-cyan-400">{waterBreakdown.meter1.toFixed(1)} m³</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-400">Meter 2 Consumption</p>
                                                <p className="text-2xl font-bold text-blue-400">{waterBreakdown.meter2.toFixed(1)} m³</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-400">Total Water</p>
                                                <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                                    {totalWater.toFixed(1)} m³
                                                </p>
                                                <p className="text-sm text-gray-400 mt-1">KES {((totalWater * UTILITY_RATES.water * 30) || 0).toLocaleString()}/month</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Data Status Footer */}
                    <div className="pt-6 border-t border-gray-800">
                        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
                            <div className="flex items-center gap-3 mb-4 md:mb-0">
                                {isLoading ? (
                                    <>
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span>Loading utility data...</span>
                                    </>
                                ) : error ? (
                                    <>
                                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                        <span className="text-red-400">Error loading data</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span>Data loaded successfully</span>
                                    </>
                                )}
                                <span className="text-gray-500">•</span>
                                <span>Last updated: {lastUpdated}</span>
                                <span className="text-gray-500">•</span>
                                <span>{readings.length} total readings</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchUtilityData}
                                    disabled={isLoading}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                            Refreshing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-3 w-3 mr-2" />
                                            Refresh Data
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                                >
                                    <Eye className="h-3 w-3 mr-2" />
                                    Back to Top
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
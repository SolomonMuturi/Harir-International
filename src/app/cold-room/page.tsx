'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
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
import { coldChainData, coldRoomInventoryData, type DwellTimeEntry, activityLogData, type ActivityLog, coldRoomPersonnelLogData, type ColdRoomPersonnelLog, coldRoomAnomalyData, type ColdRoomStatus } from '@/lib/data';
import { ColdChainChart } from '@/components/dashboard/cold-chain-chart';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Thermometer, AlertTriangle, Printer, Snowflake } from 'lucide-react';
import { ColdRoomTimeline } from '@/components/dashboard/cold-room-timeline';
import { AnomalyDetection } from '@/components/dashboard/anomaly-detection';
import { ColdRoomStatus as ColdRoomStatusComponent } from '@/components/dashboard/cold-room-status';
import { QrScanner } from '@/components/dashboard/qr-scanner';
import { DwellTime } from '@/components/dashboard/dwell-time';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColdRoomLogTable } from '@/components/dashboard/cold-room-log-table';
import { LogDetailDialog } from '@/components/dashboard/log-detail-dialog';
import { PersonnelLog } from '@/components/dashboard/personnel-log';
import { PersonnelTracker } from '@/components/dashboard/personnel-tracker';
import { useToast } from '@/hooks/use-toast';
import { explainAnomaly, type ExplainAnomalyInput, type ExplainAnomalyOutput } from '@/ai/flows/explain-anomaly-detection';
import { ColdRoomSettings } from '@/components/dashboard/cold-room-settings';

interface DatabaseColdRoom {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  status: string;
  zone_type: string | null;
  created_at: string;
}

const kpiDataByRoom: Record<string, any> = {
  'cold-1': {
    currentTemp: { title: 'Current Temp (CR-1)', value: '3.2°C' },
    averageTemp: { title: 'Average Temp (CR-1)', value: '3.5°C' },
    excursions: { title: 'Excursions (CR-1)', value: '0' },
  },
  'cold-2': {
    currentTemp: { title: 'Current Temp (CR-2)', value: '-18°C', change: '+1°C vs. avg' },
    averageTemp: { title: 'Average Temp (CR-2)', value: '-19°C', change: '-1°C vs. setpoint' },
    excursions: { title: 'Excursions (CR-2)', value: '2', change: '+1 from yesterday' },
  },
  'cold-3': {
    currentTemp: { title: 'Current Temp (CR-3)', value: '4.5°C' },
    averageTemp: { title: 'Average Temp (CR-3)', value: '4.2°C' },
    excursions: { title: 'Excursions (CR-3)', value: '1' },
  },
};

// Sample data for when database is empty
const sampleColdRooms: ColdRoomStatus[] = [
  {
    id: 'cold-1',
    name: 'Fruit Storage Room',
    temperature: 3.2,
    humidity: 65,
    status: 'Optimal',
    zoneType: 'Fruit',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'cold-2',
    name: 'Vegetable Freezer',
    temperature: -18.5,
    humidity: 70,
    status: 'Warning',
    zoneType: 'Vegetable',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'cold-3',
    name: 'Flower Preservation',
    temperature: 4.1,
    humidity: 60,
    status: 'Optimal',
    zoneType: 'Flower',
    lastUpdated: new Date().toISOString()
  }
];

export default function ColdRoomPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [scannedPalletId, setScannedPalletId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('cold-1');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [personnelLog, setPersonnelLog] = useState<ColdRoomPersonnelLog[]>(coldRoomPersonnelLogData);
  const [coldRooms, setColdRooms] = useState<ColdRoomStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cold rooms from database
  useEffect(() => {
    const fetchColdRooms = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/cold-rooms');
        
        if (response.ok) {
          const data: DatabaseColdRoom[] = await response.json();
          
          if (data.length > 0) {
            // Convert database format to your app's ColdRoomStatus format
            const convertedRooms: ColdRoomStatus[] = data.map(room => ({
              id: room.id,
              name: room.name,
              temperature: room.temperature,
              humidity: room.humidity,
              status: room.status as 'Optimal' | 'Warning' | 'Alert',
              zoneType: room.zone_type,
              lastUpdated: room.created_at
            }));
            
            setColdRooms(convertedRooms);
            setSelectedRoomId(convertedRooms[0].id);
          } else {
            // If database is empty, use sample data
            setColdRooms(sampleColdRooms);
            setSelectedRoomId('cold-1');
            console.log('Using sample data - database is empty');
          }
        } else {
          throw new Error('Failed to fetch cold rooms');
        }
      } catch (error) {
        console.error('Error fetching cold rooms:', error);
        // If API fails, use sample data
        setColdRooms(sampleColdRooms);
        setSelectedRoomId('cold-1');
        toast({
          title: 'Database Connection Issue',
          description: 'Using sample data. Please check your database connection.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchColdRooms();
  }, [toast]);

  const selectedRoom = coldRooms.find(room => room.id === selectedRoomId);
  const kpiData = kpiDataByRoom[selectedRoomId] || kpiDataByRoom['cold-1'];

  const handleScan = (palletId: string) => {
    setScannedPalletId(palletId);
    toast({
      title: 'QR Code Scanned',
      description: `Pallet ID: ${palletId}`,
    });
  };

  const handleRowClick = (entry: DwellTimeEntry) => {
    console.log('Row clicked:', entry);
    toast({
      title: 'Item Selected',
      description: `Viewing details for ${entry.primaryProduct}`,
    });
  };

  const handleLogPersonnel = (employeeId: string, coldRoomId: string, eventType: 'entry' | 'exit') => {
    const newLog: ColdRoomPersonnelLog = {
      id: `plog-${Date.now()}`,
      employeeId,
      coldRoomId,
      eventType,
      timestamp: new Date().toISOString(),
    };
    setPersonnelLog(prev => [newLog, ...prev]);
    toast({
        title: 'Personnel Log Updated',
        description: `Employee ${employeeId} logged ${eventType} for ${coldRoomId}.`,
    });
  }
  
  const handlePrintReport = async () => {
    const element = printRef.current;
    if (element) {
        const canvas = await html2canvas(element, { scale: 2 });
        const data = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`cold-room-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        
        toast({
          title: 'Report Generated',
          description: 'Cold room report downloaded successfully.',
        });
    }
  }

  const handleAnomalyExplain = async (input: ExplainAnomalyInput): Promise<ExplainAnomalyOutput> => {
      return explainAnomaly(input);
  }
  
  const inventoryWithWeights = coldRoomInventoryData.map(item => {
    return {
        id: item.id,
        location: item.location,
        primaryProduct: item.product,
        avgDwellTime: 'N/A',
        items: item.quantity,
        status: 'optimal' as const,
        entryDate: item.entryDate,
        weight: item.currentWeight,
    }
  });
  
  const handleColdRoomsSave = async (updatedRooms: ColdRoomStatus[]) => {
    try {
      // For now, just update local state since we don't have POST endpoint
      setColdRooms(updatedRooms);
      toast({
        title: 'Cold Room Settings Saved',
        description: 'Your cold room configurations have been updated locally.',
      });
      
      // TODO: Uncomment when you have POST endpoint
      /*
      const response = await fetch('/api/cold-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRooms),
      });

      if (response.ok) {
        setColdRooms(updatedRooms);
        toast({
          title: 'Cold Room Settings Saved',
          description: 'Your cold room configurations have been updated.',
        });
      } else {
        throw new Error('Failed to save cold rooms');
      }
      */
    } catch (error) {
      console.error('Error saving cold rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to save cold room settings',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Cold Room Management
                </h2>
                <p className="text-muted-foreground">
                  Loading cold room data...
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
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
        <main className="p-4 md:p-6 lg:p-8 space-y-6" ref={printRef}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Cold Room Management
              </h2>
              <p className="text-muted-foreground">
                Real-time monitoring and logging for your cold chain infrastructure.
              </p>
            </div>
             <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2" />
              Download Report
            </Button>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Item Tracking</TabsTrigger>
              <TabsTrigger value="personnel">Personnel Tracking</TabsTrigger>
              <TabsTrigger value="analytics">Detailed Analytics</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
              <TabsTrigger value="manage">Manage Rooms</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 space-y-6">
              <ColdRoomStatusComponent rooms={coldRooms} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <DwellTime locations={inventoryWithWeights} onRowClick={handleRowClick} scannedId={scannedPalletId || undefined} />
                  </div>
                  <div>
                    <QrScanner onScan={handleScan} />
                  </div>
              </div>
            </TabsContent>

            <TabsContent value="personnel" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PersonnelLog logs={personnelLog} />
                </div>
                <div>
                  <PersonnelTracker onLogPersonnel={handleLogPersonnel} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
                <div className="mb-4">
                  <p className="text-muted-foreground">Select a cold room to view its detailed analytics.</p>
                  <RadioGroup value={selectedRoomId} onValueChange={setSelectedRoomId} className="flex gap-4 mt-2">
                    {coldRooms.map(room => (
                      <div key={room.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={room.id} id={room.id} />
                        <Label htmlFor={room.id}>{room.name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <OverviewCard data={{...kpiData.currentTemp, changeType: 'increase' as const}} icon={Thermometer} />
                    <OverviewCard data={{...kpiData.averageTemp, changeType: 'decrease' as const}} icon={Thermometer} />
                    <OverviewCard data={{...kpiData.excursions, changeType: 'increase' as const}} icon={AlertTriangle} />
                </div>

                <div className="mt-6">
                    <ColdChainChart data={coldChainData} />
                </div>
                
                <div id="alerts-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 scroll-mt-20">
                    <div className='lg:col-span-2'>
                        <AnomalyDetection anomalies={coldRoomAnomalyData} onExplain={handleAnomalyExplain} />
                    </div>
                    <div>
                        <ColdRoomTimeline events={coldRoomAnomalyData.map((a, i) => ({ id: `event-${i}`, type: 'excursion', title: a.metricName, time: a.timestamp }))} />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
                <ColdRoomLogTable logs={activityLogData} onRowClick={setSelectedLog} />
            </TabsContent>

            <TabsContent value="manage" className="mt-6">
                <ColdRoomSettings initialData={coldRooms} onSave={handleColdRoomsSave} />
            </TabsContent>
          </Tabs>

        </main>
      </SidebarInset>
    </SidebarProvider>
    
    <LogDetailDialog 
        isOpen={!!selectedLog} 
        onOpenChange={() => setSelectedLog(null)} 
        log={selectedLog} 
    />
    </>
  );
}
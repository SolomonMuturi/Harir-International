
'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { ArrowLeft, PackageCheck, ScanLine, Tags, Clock4, BarChart, ListChecks, FlaskConical, Users, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { ResponsiveContainer, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChartContainer } from '@/components/ui/chart';

const stationsData = {
    'receiving-bay-1': { 
        name: 'Receiving Bay 1', 
        status: 'Active', 
        currentTask: 'Unloading SH-88122', 
        icon: <ScanLine className="w-12 h-12 text-primary" />,
        analytics: {
            title: 'Hourly Throughput (pallets)',
            data: [ { hour: '8am', pallets: 12 }, { hour: '9am', pallets: 18 }, { hour: '10am', pallets: 15 } ]
        },
        labor: {
            assigned: 4,
            costPerUnit: 12.50,
        },
        taskQueue: [
            { id: 't1', description: 'Unload SH-88123 (Kakuzi)', priority: 'High', shipmentId: 'SH-88123' },
            { id: 't2', description: 'Unload SH-88124 (Sunripe)', priority: 'Medium', shipmentId: 'SH-88124' },
            { id: 't3', description: 'Inspect Incoming Goods from SH-88122', priority: 'High', shipmentId: 'SH-88122' },
        ]
    },
    'quality-control': {
        name: 'Quality Control Station',
        status: 'Active',
        currentTask: 'Inspecting Roses from SH-88122',
        icon: <FlaskConical className="w-12 h-12 text-primary" />,
        analytics: {
            title: 'Checks per Hour',
            data: [ { hour: '8am', checks: 22 }, { hour: '9am', checks: 35 }, { hour: '10am', checks: 30 } ]
        },
        labor: {
            assigned: 2,
            costPerUnit: 5.75,
        },
        taskQueue: [
            { id: 'qc1', description: 'Perform sensory analysis on Blueberry batch', priority: 'High', shipmentId: 'SH-88122' },
            { id: 'qc2', description: 'Verify origin certificates for SH-88123', priority: 'Medium', shipmentId: 'SH-88123' },
            { id: 'qc3', description: 'Check Avocado ripeness (Batch B-2408-A)', priority: 'Medium' },
            { id: 'qc4', description: 'Log pesticide residue test results', priority: 'Low' },
        ]
    },
    'sorting-line-a': { 
        name: 'Sorting Line A', 
        status: 'Active', 
        currentTask: 'Sorting Strawberries', 
        icon: <PackageCheck className="w-12 h-12 text-primary" />,
        analytics: {
            title: 'Items Sorted per Hour',
            data: [ { hour: '8am', items: 520 }, { hour: '9am', items: 610 }, { hour: '10am', items: 580 } ]
        },
        labor: {
            assigned: 8,
            costPerUnit: 0.85,
        },
        taskQueue: [
            { id: 't1', description: 'Switch to Hass Avocados', priority: 'Medium' },
            { id: 't2', description: 'Quality Check Batch #45', priority: 'Low' },
        ]
    },
    'packing-station-3': { 
        name: 'Packing Station 3', 
        status: 'Idle', 
        currentTask: 'Awaiting product', 
        icon: <Clock4 className="w-12 h-12 text-primary" />,
        analytics: {
            title: 'Boxes Packed per Hour',
            data: [ { hour: '8am', boxes: 250 }, { hour: '9am', boxes: 280 }, { hour: '10am', boxes: 0 } ]
        },
        labor: {
            assigned: 6,
            costPerUnit: 0,
        },
        taskQueue: [
             { id: 't1', description: 'Prepare for Blueberry batch', priority: 'High' },
        ]
    },
    'labeling-tagging': { 
        name: 'Labeling & Tagging', 
        status: 'Active', 
        currentTask: 'Applying B-202408-003', 
        icon: <Tags className="w-12 h-12 text-primary" />,
        analytics: {
            title: 'Tags Applied per Minute',
            data: [ { minute: '10:01', tags: 45 }, { minute: '10:02', tags: 52 }, { minute: '10:03', tags: 48 } ]
        },
        labor: {
            assigned: 2,
            costPerUnit: 0.15,
        },
        taskQueue: [
            { id: 't1', description: 'Load new tag roll (B-202408-004)', priority: 'High' },
            { id: 't2', description: 'Verify printer alignment', priority: 'Medium' },
        ]
    },
}

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stationId = params.stationId as string;

  const station = stationsData[stationId as keyof typeof stationsData];
  
  if (!station) {
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
            <main className="p-4 md:p-6 lg:p-8">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2" />
                    Back to Warehouse
                </Button>
                <div className="flex items-center justify-center h-64">
                    <p>Station not found.</p>
                </div>
            </main>
            </SidebarInset>
      </SidebarProvider>
    );
  }

  const priorityVariant = {
    High: 'destructive',
    Medium: 'secondary',
    Low: 'outline',
  } as const;

  const currentShipmentId = station.currentTask.match(/SH-\d+/)?.[0];

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
        <main className="p-4 md:p-6 lg:p-8">
            <div className="mb-6">
                 <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2" />
                    Back to Warehouse
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">
                    {station.name} - Detailed View
                </h2>
                <p className="text-muted-foreground">
                    Deep dive into station performance, tasks, and analytics.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link 
                    href={currentShipmentId ? `/traceability?shipmentId=${currentShipmentId}` : '#'}
                    className={`block transition-transform hover:scale-[1.02] ${!currentShipmentId && 'pointer-events-none'}`}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center gap-4">
                            {station.icon}
                            <p className="text-lg font-semibold">{station.currentTask}</p>
                            <p className="text-sm text-muted-foreground">Status: {station.status}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users />Assigned Employees</CardTitle></CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <p className="text-5xl font-bold">{station.labor.assigned}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DollarSign />Labor Cost</CardTitle></CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <p className="text-5xl font-bold">KES {station.labor.costPerUnit.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground self-end mb-2 ml-1">/ unit</p>
                    </CardContent>
                </Card>
                <div className="lg:col-span-1">
                     <Card 
                        onClick={() => router.push('/analytics')}
                        className="cursor-pointer transition-transform hover:scale-[1.02]"
                     >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart />
                                Station Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">{station.analytics.title}</p>
                            <ChartContainer config={{}} className="h-24 w-full">
                                <ResponsiveContainer>
                                    <RechartsBarChart data={station.analytics.data}>
                                    <XAxis dataKey={Object.keys(station.analytics.data[0])[0]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey={Object.keys(station.analytics.data[0])[1]} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
                 <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListChecks />
                            Task Queue
                        </CardTitle>
                        <CardDescription>Upcoming tasks for this station.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task Description</TableHead>
                                    <TableHead className="text-right">Priority</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {station.taskQueue.map(task => (
                                    <TableRow 
                                        key={task.id}
                                        onClick={() => task.shipmentId && router.push(`/traceability?shipmentId=${task.shipmentId}`)}
                                        className={task.shipmentId ? 'cursor-pointer hover:bg-muted/50' : ''}
                                    >
                                        <TableCell>{task.description}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={priorityVariant[task.priority as keyof typeof priorityVariant]}>
                                                {task.priority}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                       </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

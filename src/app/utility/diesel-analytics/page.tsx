
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { ArrowLeft, Fuel, Bell, Save } from 'lucide-react';
import { DieselConsumptionChart } from '@/components/dashboard/diesel-consumption-chart';
import { dieselConsumptionData } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const historicalDieselData = [
    { date: '2024-07-30', level: 85, refill: 0 },
    { date: '2024-07-29', level: 60, refill: 500 },
    { date: '2024-07-28', level: 95, refill: 0 },
    { date: '2024-07-27', level: 70, refill: 0 },
    // Missed day on 26th
    { date: '2024-07-25', level: 45, refill: 0 },
    { date: '2024-07-24', level: 20, refill: 800 },
];

export default function DieselAnalyticsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [alertThreshold, setAlertThreshold] = useState(25);
    const [currentLevel, setCurrentLevel] = useState(75);

    const handleSaveThreshold = () => {
        toast({
            title: 'Threshold Saved',
            description: `You will be alerted when diesel level drops below ${alertThreshold}%.`
        });
    };

    const isLow = currentLevel <= alertThreshold;

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
                <main className="p-4 md:p-6 lg:p-8 space-y-6">
                    <div className="mb-6">
                        <Button variant="outline" onClick={() => router.back()} className="mb-4">
                            <ArrowLeft className="mr-2" />
                            Back to Utility Management
                        </Button>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Generator Diesel Analytics
                        </h2>
                        <p className="text-muted-foreground">
                            Track diesel consumption, refill history, and set alert thresholds.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <DieselConsumptionChart data={dieselConsumptionData} />
                        
                        <Card className={cn(isLow && "border-destructive ring-2 ring-destructive")}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell />
                                    Alert Threshold
                                </CardTitle>
                                <CardDescription>Set the low fuel alert threshold.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="threshold-input">Low Fuel Alert Level (%)</Label>
                                    <Input
                                        id="threshold-input"
                                        type="number"
                                        value={alertThreshold}
                                        onChange={(e) => setAlertThreshold(Number(e.target.value))}
                                        className="text-lg"
                                    />
                                </div>
                                <div className={cn("p-4 rounded-lg text-center", isLow ? 'bg-destructive/10 text-destructive' : 'bg-muted')}>
                                    <p className="text-sm">Current Level</p>
                                    <p className="text-4xl font-bold">{currentLevel}%</p>
                                    {isLow && <p className="text-sm font-semibold mt-1">Refill required!</p>}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveThreshold} className="w-full">
                                    <Save className="mr-2"/>
                                    Save Threshold
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Historical Readings</CardTitle>
                            <CardDescription>Daily log of generator diesel levels and refills.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Level (%)</TableHead>
                                        <TableHead className="text-right">Refill Amount (L)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historicalDieselData.map((entry, index) => {
                                        const prevEntry = historicalDieselData[index + 1];
                                        const consumption = prevEntry ? prevEntry.level - entry.level + (entry.refill > 0 ? (entry.refill / 10) : 0) : 0; // Simplified consumption logic
                                        
                                        // Check for missed day
                                        if (prevEntry && new Date(entry.date).getDate() - new Date(prevEntry.date).getDate() > 1) {
                                            return (
                                                <>
                                                 <TableRow key={`missed-${index}`} className="bg-muted/50">
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground text-xs italic">
                                                        No reading captured for {new Date(new Date(entry.date).setDate(new Date(entry.date).getDate() - 1)).toLocaleDateString()}
                                                    </TableCell>
                                                 </TableRow>
                                                 <TableRow key={entry.date}>
                                                    <TableCell>{entry.date}</TableCell>
                                                    <TableCell className="text-right font-mono">{entry.level}%</TableCell>
                                                    <TableCell className="text-right font-mono text-green-500">{entry.refill > 0 ? `+${entry.refill} L` : '-'}</TableCell>
                                                </TableRow>
                                                </>
                                            );
                                        }

                                        return (
                                            <TableRow key={entry.date}>
                                                <TableCell>{entry.date}</TableCell>
                                                <TableCell className={cn("text-right font-mono", entry.level <= alertThreshold && "text-destructive font-bold")}>{entry.level}%</TableCell>
                                                <TableCell className="text-right font-mono text-green-500">{entry.refill > 0 ? `+${entry.refill} L` : '-'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}


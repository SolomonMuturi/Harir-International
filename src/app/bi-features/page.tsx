'use client';

import { useState } from 'react';
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
import {
  getBiData,
  coldRoomStatusData,
  overviewData,
  branchData,
} from '@/lib/data';
import { IncidentTrendChart } from '@/components/dashboard/incident-trend-chart';
import { OperationalComplianceChart } from '@/components/dashboard/operational-compliance-chart';
import { DwellTimeRiskChart } from '@/components/dashboard/dwell-time-risk-chart';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, ShieldCheck, Users, TrendingUp, Truck, Building, Zap, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ComplianceScoreBreakdownDialog } from '@/components/dashboard/compliance-score-breakdown-dialog';

export default function BiFeaturesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false);

  const isSuperAdmin = user?.role === 'Admin';
  
  const { 
    kpiData, 
    incidentTrendData, 
    operationalComplianceData, 
    dwellTimeRiskData, 
    overallRiskProfileData 
  } = getBiData(selectedBranchId);

  const filteredDwellTimeData = selectedRoomId === 'all' 
    ? dwellTimeRiskData 
    : dwellTimeRiskData.filter(d => d.location === selectedRoomId);

  const topBranchFromData = getBiData('all').kpiData.topBranch;
  const topBranch = branchData.find(b => b.name === topBranchFromData.value);

  return (
    <>
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="w-8 h-8 text-primary" />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Business Intelligence Analytics
                </h1>
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="branch-selector">Filter by Branch</Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger id="branch-selector" className="w-full sm:w-64">
                    <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">General Overview</SelectItem>
                    {branchData.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          
           {!isSuperAdmin && selectedBranchId !== 'all' && (
            <div className="bg-primary/10 border-l-4 border-primary text-primary-foreground p-4 rounded-md flex items-center justify-between">
              <div>
                <h3 className="font-bold">Unlock Advanced Analytics</h3>
                <p className="text-sm text-primary/90">Upgrade to the Enterprise plan to view detailed, branch-level BI dashboards.</p>
              </div>
              <Button asChild>
                <Link href="/pricing">Upgrade to Enterprise</Link>
              </Button>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <OverviewCard
              data={overviewData.visitorsToday}
              icon={Users}
              cardClass="bg-card"
            />
            <OverviewCard
              data={kpiData.vehiclesOnSite}
              icon={Truck}
              cardClass="bg-card"
            />
            <OverviewCard
              data={kpiData.coldChainCompliance}
              icon={ShieldCheck}
              cardClass="bg-card"
            />
            <OverviewCard
              data={kpiData.topBranch}
              icon={Building}
              cardClass="bg-card"
            />
            <OverviewCard
              data={{ title: 'Energy Risk', value: 'Low', change: 'consumption stable', changeType: 'increase' }}
              icon={Zap}
              cardClass="bg-card"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <IncidentTrendChart data={incidentTrendData} />
            </div>
            <div className="lg:col-span-2">
                <OperationalComplianceChart 
                    data={operationalComplianceData} 
                    onViewBreakdown={() => setIsComplianceDialogOpen(true)}
                />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="room-selector">Filter Dwell Time Risk by Cold Room</Label>
                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                      <SelectTrigger id="room-selector" className="w-full sm:w-64">
                        <SelectValue placeholder="Select a cold room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {coldRoomStatusData.map(room => (
                            <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 <DwellTimeRiskChart data={filteredDwellTimeData} />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <OperationalComplianceChart data={overallRiskProfileData} />
                <OverviewCard
                  data={{ title: 'Water Risk', value: 'Medium', change: 'high consumption vs. peers', changeType: 'decrease' }}
                  icon={Droplet}
                  cardClass="bg-card"
                />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>

    <ComplianceScoreBreakdownDialog 
        isOpen={isComplianceDialogOpen}
        onOpenChange={setIsComplianceDialogOpen}
        data={getBiData(selectedBranchId).operationalComplianceData}
    />
    </>
  );
}
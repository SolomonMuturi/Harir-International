
'use client';

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
import { branchData, employeeData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Building, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar } from 'recharts';

export default function BranchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.id as string;

  const branch = branchData.find((b) => b.id === branchId);
  const manager = branch ? employeeData.find(e => e.id === branch.managerId) : null;
  
  if (!branch) {
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
                    Back to Branches
                </Button>
                <div className="flex items-center justify-center h-64">
                    <p>Branch not found.</p>
                </div>
            </main>
            </SidebarInset>
      </SidebarProvider>
    );
  }

  const employeeCountOverview = {
    title: 'Total Employees',
    value: String(branch.employees),
    change: 'in this branch',
    changeType: 'increase' as const,
  }

  const statusVariant = {
    Active: 'default',
    Inactive: 'destructive',
  } as const;

  const placeholderAnalyticsData = [
      { name: 'Jan', value: 120 }, { name: 'Feb', value: 150 }, { name: 'Mar', value: 180 },
      { name: 'Apr', value: 160 }, { name: 'May', value: 200 }, { name: 'Jun', value: 220 },
  ];


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
                    Back to Branches
                </Button>
                <div className="flex items-center gap-4">
                     <Building className="h-16 w-16 text-primary" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            {branch.name}
                            <Badge variant={statusVariant[branch.status]} className='capitalize text-sm'>{branch.status}</Badge>
                        </h2>
                        <p className="text-muted-foreground">
                            {branch.location}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <OverviewCard data={employeeCountOverview} icon={Users} />
                <Card>
                    <CardHeader>
                        <CardTitle className='text-sm font-medium'>Branch Manager</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{manager?.name || 'Unassigned'}</p>
                        <p className="text-xs text-muted-foreground">{manager?.email}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp />
                        Branch Performance (Placeholder)
                    </CardTitle>
                    <CardDescription>
                        Monthly throughput for {branch.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-64 w-full">
                        <ResponsiveContainer>
                            <BarChart data={placeholderAnalyticsData}>
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

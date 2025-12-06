
'use client';

import { useState } from 'react';
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
  energyConsumptionData,
  energyBreakdownData,
  energyCostData,
  energyAnomalyData,
  waterConsumptionData,
  waterBreakdownData,
  waterQualityData,
  overviewData,
} from '@/lib/data';

import { AnomalyDetection } from '@/components/dashboard/anomaly-detection';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { DollarSign, Thermometer, Bolt, Zap, Droplet } from 'lucide-react';
import type { ExplainAnomalyInput } from "@/ai/flows/explain-anomaly-detection";
import { explainEnergySpike } from '@/ai/flows/explain-energy-spike';
import { explainWaterAnomaly } from '@/ai/flows/explain-water-anomaly';
import { Skeleton } from '@/components/ui/skeleton';
import { UtilityMonitors } from '@/components/dashboard/utility-monitors';

const EnergyConsumptionChart = dynamic(() => import('@/components/dashboard/energy-consumption-chart'), { ssr: false, loading: () => <Skeleton className="h-[386px] w-full" /> });
const EnergyBreakdownChart = dynamic(() => import('@/components/dashboard/energy-breakdown-chart'), { ssr: false, loading: () => <Skeleton className="h-[386px] w-full" /> });
const EnergyCostChart = dynamic(() => import('@/components/dashboard/energy-cost-chart'), { ssr: false, loading: () => <Skeleton className="h-[386px] w-full" /> });

const WaterConsumptionChart = dynamic(() => import('@/components/dashboard/water-consumption-chart'), { ssr: false, loading: () => <Skeleton className="h-[386px] w-full" /> });
const WaterBreakdownChart = dynamic(() => import('@/components/dashboard/water-breakdown-chart'), { ssr: false, loading: () => <Skeleton className="h-[386px] w-full" /> });
const WaterQualityTable = dynamic(() => import('@/components/dashboard/water-quality-table').then(mod => mod.WaterQualityTable), { ssr: false, loading: () => <Skeleton className="h-[318px] w-full" /> });


const energyOverview = {
    totalConsumption: { title: 'Total Consumption (Today)', value: '310 kWh', change: '+2% vs. yesterday', changeType: 'increase' as const, },
    monthlyCost: { title: 'Est. Monthly Cost', value: 'KES 450,000', change: 'at KES 25/kWh', changeType: 'increase' as const, },
    peakDemand: { title: 'Peak Demand (Today)', value: '55 kW @ 16:00', change: 'within limits', changeType: 'increase' as const, },
    powerFactor: { title: 'Power Factor', value: '0.92', change: 'optimal', changeType: 'increase' as const, },
};

const waterOverview = {
    totalConsumption: { title: 'Water Usage (Today)', value: '148 m³', change: '-1.3% vs. yesterday', changeType: 'decrease' as const, },
    monthlyCost: { title: 'Est. Monthly Water Cost', value: 'KES 18,500', change: 'at KES 125/m³', changeType: 'increase' as const, },
    qualityStatus: { title: 'Water Quality', value: 'Fail', change: 'Municipal Main', changeType: 'increase' as const, },
    recyclingRate: { title: 'Recycling Rate', value: '15%', change: '+2% from last week', changeType: 'increase' as const, },
};

export default function UtilityManagementPage() {

    const energyAnomalyExplain = async (anomaly: ExplainAnomalyInput) => {
        return explainEnergySpike(anomaly);
    }

    const waterAnomalyExplain = async (anomaly: ExplainAnomalyInput) => {
        return explainWaterAnomaly(anomaly);
    }
    
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
        <main className="p-4 md:p-6 lg:p-8 space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                Utility Management Dashboard
                </h2>
                <p className="text-muted-foreground">
                Monitor energy and water consumption across your operations.
                </p>
            </div>
            
            <UtilityMonitors />

            <section id="energy">
                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Zap />Energy Management</h3>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="#energy" className="block transition-transform hover:scale-[1.02]"><OverviewCard data={energyOverview.totalConsumption} icon={Zap} /></Link>
                        <Link href="#energy" className="block transition-transform hover:scale-[1.02]"><OverviewCard data={energyOverview.monthlyCost} icon={DollarSign} /></Link>
                        <Link href="#energy" className="block transition-transform hover:scale-[1.02]"><OverviewCard data={energyOverview.peakDemand} icon={Thermometer} /></Link>
                        <Link href="#energy" className="block transition-transform hover:scale-[1.02]"><OverviewCard data={energyOverview.powerFactor} icon={Bolt} /></Link>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <EnergyConsumptionChart data={energyConsumptionData} />
                        </div>
                        <div className="lg:col-span-1">
                            <EnergyBreakdownChart data={energyBreakdownData} />
                        </div>
                        <div className="lg:col-span-2">
                             <EnergyCostChart data={energyCostData} />
                        </div>
                        <div className="lg:col-span-1">
                            <AnomalyDetection anomalies={energyAnomalyData} onExplain={energyAnomalyExplain} />
                        </div>
                    </div>
                </div>
            </section>
            
            <section id="water" className="pt-8">
                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Droplet />Water Management</h3>
                <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="#water" className="block transition-transform hover:scale-[1.02]"><OverviewCard data={waterOverview.totalConsumption} icon={Droplet} /></Link>
                        <Link href="#water" className="block transition-transform hover:scale-[1.02]"><OverviewCard data={waterOverview.monthlyCost} icon={DollarSign} /></Link>
                        <Link href="#water" className="block transition-transform hover:scale-[1.02]"><OverviewCard data={waterOverview.qualityStatus} icon={Thermometer} /></Link>
                        <Link href="#water" className="block transition-transform hover:scale-[1.02]"><OverviewCard data={waterOverview.recyclingRate} icon={Bolt} /></Link>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <WaterConsumptionChart data={waterConsumptionData} />
                        </div>
                        <div className="lg:col-span-1">
                            <WaterBreakdownChart data={waterBreakdownData} />
                        </div>
                        <div className="lg:col-span-3">
                            <WaterQualityTable data={waterQualityData} />
                        </div>
                    </div>
                </div>
            </section>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

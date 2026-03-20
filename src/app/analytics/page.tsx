
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
  shipmentVolumeData,
  carrierPerformanceData,
  costAnalysisData,
  coldChainData,
  employeePerformanceData,
  dwellTimeData,
  coldRoomStatusData,
  energyConsumptionData,
  energyBreakdownData,
  waterConsumptionData,
  waterBreakdownData,
  predictiveMaintenanceData,
} from '@/lib/data';
import { ShipmentVolumeChart } from '@/components/dashboard/shipment-volume-chart';
import { CarrierPerformanceChart } from '@/components/dashboard/carrier-performance-chart';
<CarrierPerformanceChart showFilters={true} />
import { CostAnalysisChart } from '@/components/dashboard/cost-analysis-chart';
import { ColdChainChart } from '@/components/dashboard/cold-chain-chart';
import { EmployeePerformanceChart } from '@/components/dashboard/employee-performance-chart';
import { ProcessingStationStatus } from '@/components/dashboard/processing-station-status';
import { DwellTime } from '@/components/dashboard/dwell-time';
import { ColdRoomStatus } from '@/components/dashboard/cold-room-status';
import { EnergyConsumptionChart } from '@/components/dashboard/energy-consumption-chart';
import { EnergyBreakdownChart } from '@/components/dashboard/energy-breakdown-chart';
import { WaterConsumptionChart } from '@/components/dashboard/water-consumption-chart';
import { WaterBreakdownChart } from '@/components/dashboard/water-breakdown-chart';
import { PredictiveMaintenance } from '@/components/dashboard/predictive-maintenance';

export default function AnalyticsPage() {
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
        <main className="p-4 md:p-6 lg:p-8 grid gap-6 md:gap-8 grid-cols-12">
          <div className="col-span-12">
            <h2 className="text-2xl font-bold tracking-tight">
              Analytics Dashboard
            </h2>
            <p className="text-muted-foreground">
              Deep dive into your supply chain performance and costs.
            </p>
          </div>
          
          <div className="col-span-12">
            <PredictiveMaintenance alerts={predictiveMaintenanceData} />
          </div>
          
          <div className="col-span-12 lg:col-span-8">
            <Link
                href="/utility#energy"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
                <EnergyConsumptionChart data={energyConsumptionData} />
            </Link>
          </div>
          <div className="col-span-12 lg:col-span-4">
             <Link
                href="/utility#energy"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
                <EnergyBreakdownChart data={energyBreakdownData} />
            </Link>
          </div>
          
           <div className="col-span-12 lg:col-span-8">
            <Link
                href="/utility#water"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
                <WaterConsumptionChart data={waterConsumptionData} />
            </Link>
          </div>
          <div className="col-span-12 lg:col-span-4">
             <Link
                href="/utility#water"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
                <WaterBreakdownChart data={waterBreakdownData} />
            </Link>
          </div>

          <div className="col-span-12">
            <Link
                href="/cold-room"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
                <ColdRoomStatus rooms={coldRoomStatusData} />
            </Link>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <Link
              href="/shipments"
              className="block h-full transition-transform hover:scale-[1.02]"
            >
              <ShipmentVolumeChart data={shipmentVolumeData} />
            </Link>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <Link
              href="/financials"
              className="block h-full transition-transform hover:scale-[1.02]"
            >
              <CostAnalysisChart data={costAnalysisData} />
            </Link>
          </div>

          <div className="col-span-12">
            <Link
              href="/shipments"
              className="block h-full transition-transform hover:scale-[1.02]"
            >
              <CarrierPerformanceChart data={carrierPerformanceData} />
            </Link>
          </div>
          
          <div className="col-span-12">
            <Link
                href="/cold-room"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
                <ColdChainChart data={coldChainData} />
            </Link>
          </div>

          <div className="col-span-12">
            <Link
                href="/cold-room"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
              <DwellTime locations={dwellTimeData} />
            </Link>
          </div>
          
          <div className="col-span-12">
             <Link
                href="/warehouse"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
                <ProcessingStationStatus />
            </Link>
          </div>

          <div className="col-span-12">
            <Link
                href="/employees"
                className="block h-full transition-transform hover:scale-[1.02]"
            >
                <EmployeePerformanceChart data={employeePerformanceData} />
            </Link>
          </div>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


'use client';

import { useState, useMemo } from 'react';
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
import { customerData, type CustomerDocument, type Customer } from '@/lib/data';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { FileText, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { ContractsDataTable } from '@/components/dashboard/contracts-data-table';

type ContractWithCustomer = CustomerDocument & {
  customer: {
    id: string;
    name: string;
  };
};

export default function ContractsPage() {
  const allContracts: ContractWithCustomer[] = useMemo(() => {
    return customerData.flatMap(customer =>
      customer.documents
        .filter(doc => doc.type === 'Contract' || doc.type === 'SLA')
        .map(doc => ({
          ...doc,
          customer: { id: customer.id, name: customer.name },
        }))
    );
  }, []);

  const activeContracts = allContracts.filter(c => c.status === 'Active').length;
  
  const expiringSoonContracts = allContracts.filter(c => {
    if (c.status !== 'Active' || !c.expiryDate) return false;
    const daysLeft = differenceInDays(new Date(c.expiryDate), new Date());
    return daysLeft >= 0 && daysLeft <= 30;
  }).length;

  const kpiData = {
    activeContracts: {
      title: 'Active Contracts & SLAs',
      value: String(activeContracts),
      change: 'across all clients',
      changeType: 'increase' as const,
    },
    expiringSoon: {
      title: 'Expiring Soon (30 days)',
      value: String(expiringSoonContracts),
      change: 'require attention',
      changeType: 'increase' as const,
    },
  };

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
                <h2 className="text-2xl font-bold tracking-tight">
                    Contract & SLA Management
                </h2>
                <p className="text-muted-foreground">
                    A centralized repository for all client service agreements.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <OverviewCard data={kpiData.activeContracts} icon={FileText} />
              <OverviewCard data={kpiData.expiringSoon} icon={AlertTriangle} />
            </div>

            <ContractsDataTable contracts={allContracts} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

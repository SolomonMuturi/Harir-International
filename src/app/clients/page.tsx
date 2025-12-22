
'use client';

import { useState } from 'react';
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
import { clientData } from '@/lib/data';
import type { Client, ClientFormValues } from '@/lib/data';
import { ClientDataTable } from '@/components/dashboard/client-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateClientForm } from '@/components/dashboard/create-client-form';
import { PlusCircle, Users, UserPlus } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { format } from 'date-fns';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(clientData);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const isEditDialogOpen = !!editingClient;

  const handleAddClient = (newClient: ClientFormValues) => {
    const newClientWithDefaults: Client = {
      ...newClient,
      id: `client-${Date.now()}`,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'New',
    };
    setClients(prev => [newClientWithDefaults, ...prev]);
    setIsCreateDialogOpen(false);
  };

  const handleUpdateClient = (updatedClientData: ClientFormValues) => {
    if (!editingClient) return;
    setClients(prev =>
      prev.map(client =>
        client.id === editingClient.id
          ? { ...client, ...updatedClientData }
          : client
      )
    );
    setEditingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
  };

  const closeEditDialog = () => {
    setEditingClient(null);
  };
  
  const activeClients = clients.filter(c => c.status === 'Active').length;
  const newClients = clients.filter(c => c.status === 'New').length;

  const kpiData = {
    totalClients: {
      title: 'Active Clients',
      value: String(activeClients),
      change: 'on the platform',
      changeType: 'increase' as const,
    },
    newClients: {
      title: 'New Clients (QTD)',
      value: String(newClients),
      change: 'pending onboarding',
      changeType: 'increase' as const,
    },
  };

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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Client Management
                    </h2>
                    <p className="text-muted-foreground">
                        View, add, and manage client accounts for the platform.
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Add Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Create New Client Account</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to add a new client to the system.
                        </DialogDescription>
                        </DialogHeader>
                        <CreateClientForm onSubmit={handleAddClient} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <OverviewCard data={kpiData.totalClients} icon={Users} />
              <OverviewCard data={kpiData.newClients} icon={UserPlus} />
            </div>

          <ClientDataTable clients={clients} onEditClient={openEditDialog} />
        </main>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent>
              <DialogHeader>
              <DialogTitle>Edit Client Account</DialogTitle>
              <DialogDescription>
                  Update the details for {editingClient?.name}.
              </DialogDescription>
              </DialogHeader>
              <CreateClientForm
                client={editingClient}
                onSubmit={handleUpdateClient}
              />
          </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

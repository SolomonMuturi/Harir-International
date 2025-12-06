

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
import { customerData } from '@/lib/data';
import type { Customer, CustomerFormValues } from '@/lib/data';
import { CustomerDataTable } from '@/components/dashboard/customer-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateCustomerForm } from '@/components/dashboard/create-customer-form';
import { PlusCircle, Users, TrendingUp, UserPlus, Filter } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const uniqueTags = Array.from(new Set(customerData.flatMap(c => c.tags)));
const uniqueLocations = Array.from(new Set(customerData.map(c => c.location)));

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(customerData);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');


  const isEditDialogOpen = !!editingCustomer;

  const handleAddCustomer = (newCustomerData: CustomerFormValues) => {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustomerData.name,
      location: newCustomerData.location,
      tags: newCustomerData.tags || [],
      website: newCustomerData.website || '',
      ytdSales: 0,
      lastOrder: new Date().toISOString().split('T')[0],
      status: 'new',
      outstandingBalance: 0,
      openInvoices: 0,
      logoUrl: `https://i.pravatar.cc/150?u=cust-${Date.now()}`,
      contacts: [{
          name: newCustomerData.primaryContactName,
          role: newCustomerData.primaryContactRole,
          email: newCustomerData.primaryContactEmail,
          phone: newCustomerData.primaryContactPhone || '',
          isPrimary: true,
      }],
      activity: [],
      orderHistory: [],
      documents: [],
    };
    setCustomers(prev => [newCustomer, ...prev]);
    setIsCreateDialogOpen(false);
  };

  const handleUpdateCustomer = (updatedCustomerData: CustomerFormValues) => {
    if (!editingCustomer) return;
    
    // Create a new object with all required fields from Customer type
    const updatedCustomer: Customer = {
      ...editingCustomer, // Start with existing customer data
      name: updatedCustomerData.name,
      location: updatedCustomerData.location,
      tags: updatedCustomerData.tags || [],
      status: updatedCustomerData.status || editingCustomer.status,
      website: updatedCustomerData.website || editingCustomer.website,
      contacts: [{
          name: updatedCustomerData.primaryContactName,
          role: updatedCustomerData.primaryContactRole,
          email: updatedCustomerData.primaryContactEmail,
          phone: updatedCustomerData.primaryContactPhone || '',
          isPrimary: true,
      }, ...editingCustomer.contacts.slice(1)]
    };

    setCustomers(prev =>
      prev.map(cust =>
        cust.id === editingCustomer.id
          ? updatedCustomer
          : cust
      )
    );
    setEditingCustomer(null);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const closeEditDialog = () => {
    setEditingCustomer(null);
  };
  
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalYtdSales = customers.reduce((acc, c) => acc + c.ytdSales, 0);
  const newCustomers = customers.filter(c => c.status === 'new').length;

  const kpiData = {
    totalCustomers: {
      title: 'Active Customers',
      value: String(activeCustomers),
      change: 'on record',
      changeType: 'increase' as const,
    },
    totalSales: {
      title: 'Total YTD Sales',
      value: `KES ${Math.round(totalYtdSales / 1000000)}M`,
      change: 'across all customers',
      changeType: 'increase' as const,
    },
    newCustomers: {
      title: 'New Customers (QTD)',
      value: String(newCustomers),
      change: 'awaiting first order',
      changeType: 'increase' as const,
    },
  };
  
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const statusMatch = statusFilter === 'all' || customer.status === statusFilter;
      const tagMatch = tagFilter === 'all' || customer.tags.includes(tagFilter);
      const locationMatch = locationFilter === 'all' || customer.location === locationFilter;
      return statusMatch && tagMatch && locationMatch;
    });
  }, [customers, statusFilter, tagFilter, locationFilter]);


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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Customer Management
                    </h2>
                    <p className="text-muted-foreground">
                        View, add, and manage customer accounts.
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                        <DialogTitle>Create New Customer</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to add a new customer to the system.
                        </DialogDescription>
                        </DialogHeader>
                        <CreateCustomerForm onCreate={handleAddCustomer} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <OverviewCard data={kpiData.totalCustomers} icon={Users} />
              <OverviewCard data={kpiData.totalSales} icon={TrendingUp} />
              <OverviewCard data={kpiData.newCustomers} icon={UserPlus} />
            </div>

            <Card className="mb-6">
              <div className="p-4 flex flex-wrap items-center gap-4">
                  <Label className="font-semibold flex items-center gap-2"><Filter /> Filters:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                  </Select>
                   <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by Location" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {uniqueLocations.map(location => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by Tag" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Tags</SelectItem>
                          {uniqueTags.map(tag => (
                              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
            </Card>

          <CustomerDataTable customers={filteredCustomers} onEditCustomer={openEditDialog} />
        </main>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                  Update the details for {editingCustomer?.name}.
              </DialogDescription>
              </DialogHeader>
              <CreateCustomerForm
                customer={editingCustomer}
                onUpdate={handleUpdateCustomer}
              />
          </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

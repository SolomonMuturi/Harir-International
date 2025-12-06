'use client';

import { useState, useEffect } from 'react';
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
import type { Supplier, SupplierFormValues } from '@/lib/data';
import { SupplierDataTable } from '@/components/dashboard/supplier-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateSupplierForm } from '@/components/dashboard/create-supplier-form';
import { PlusCircle, Grape, FileText } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface DatabaseSupplier {
  id: string;
  name: string;
  location: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  produce_types: string;
  status: string;
  logo_url: string;
  active_contracts: number;
  supplier_code: string;
  kra_pin: string;
  vehicle_number_plate: string;
  driver_name: string;
  driver_id_number: string;
  mpesa_paybill: string;
  mpesa_account_number: string;
  bank_name: string;
  bank_account_number: string;
  password: string;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch suppliers from database
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data: DatabaseSupplier[] = await response.json();
        const convertedSuppliers: Supplier[] = data.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          location: supplier.location,
          contactName: supplier.contact_name,
          contactEmail: supplier.contact_email,
          contactPhone: supplier.contact_phone,
          // FIX: Safely parse produce_types to ensure it's always an array
          produceTypes: supplier.produce_types 
            ? (typeof supplier.produce_types === 'string' 
                ? JSON.parse(supplier.produce_types)
                : supplier.produce_types)
            : [],
          status: supplier.status as 'Active' | 'Inactive' | 'Onboarding',
          logoUrl: supplier.logo_url,
          activeContracts: supplier.active_contracts,
          supplierCode: supplier.supplier_code,
          kraPin: supplier.kra_pin,
          vehicleNumberPlate: supplier.vehicle_number_plate,
          driverName: supplier.driver_name,
          driverIdNumber: supplier.driver_id_number,
          mpesaPaybill: supplier.mpesa_paybill,
          mpesaAccountNumber: supplier.mpesa_account_number,
          bankName: supplier.bank_name,
          bankAccountNumber: supplier.bank_account_number
        }));
        setSuppliers(convertedSuppliers);
      } else {
        throw new Error('Failed to fetch suppliers');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEditDialogOpen = !!editingSupplier;

  // Get existing supplier codes for sequential generation
  const existingSupplierCodes = suppliers.map(s => s.supplierCode);

  const handleAddSupplier = async (values: SupplierFormValues) => {
    try {
      console.log('🔄 Sending POST request to /api/suppliers with:', values);
      
      // Transform data to match database schema (with correct field names)
      const apiData = {
        name: values.name || '',
        location: values.location || '',
        contact_name: values.contactName || '',
        contact_email: '',
        contact_phone: values.contactPhone || '',
        produce_types: values.produceTypes || [],
        status: 'Active',
        supplier_code: values.supplierCode || '',
        kra_pin: values.kraPin || '',
        bank_name: values.bankName || '',
        bank_account_number: values.bankAccountNumber || '',
        mpesa_paybill: values.mpesaName || '',
        mpesa_account_number: values.mpesaNumber || '',
        vehicle_number_plate: '',
        driver_name: '',
        driver_id_number: '',
        password: '',
        logo_url: '',
        active_contracts: 0,
      };

      console.log('📤 Transformed API data:', apiData);

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const responseData = await response.json();
      console.log('📥 API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to create supplier');
      }

      await fetchSuppliers(); // Refresh the list

      toast({
        title: 'Supplier Created',
        description: `${values.name} has been successfully added.`,
      });
      
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('❌ Error creating supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create supplier',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSupplier = async (values: SupplierFormValues) => {
    if (!editingSupplier) return;
    
    try {
      console.log('🔄 Sending PUT request to /api/suppliers with:', values);
      
      // Transform data to match database schema
      const apiData = {
        name: values.name || '',
        location: values.location || '',
        contact_name: values.contactName || '',
        contact_email: editingSupplier.contactEmail || '',
        contact_phone: values.contactPhone || '',
        produce_types: values.produceTypes || [],
        status: 'Active',
        supplier_code: values.supplierCode || '',
        kra_pin: values.kraPin || '',
        bank_name: values.bankName || '',
        bank_account_number: values.bankAccountNumber || '',
        mpesa_paybill: values.mpesaName || '',
        mpesa_account_number: values.mpesaNumber || '',
        vehicle_number_plate: editingSupplier.vehicleNumberPlate || '',
        driver_name: editingSupplier.driverName || '',
        driver_id_number: editingSupplier.driverIdNumber || '',
      };

      console.log('📤 Transformed API data:', apiData);

      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const responseData = await response.json();
      console.log('📥 API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update supplier');
      }

      await fetchSuppliers(); // Refresh the list

      toast({
        title: 'Supplier Updated',
        description: `${values.name} has been successfully updated.`,
      });
      
      setEditingSupplier(null);
    } catch (error: any) {
      console.error('❌ Error updating supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update supplier',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
  };

  const closeEditDialog = () => {
    setEditingSupplier(null);
  };
  
  const totalSuppliers = suppliers.length;
  const activeContracts = suppliers.reduce((acc, s) => acc + s.activeContracts, 0);

  const kpiData = {
    totalSuppliers: {
      title: 'Total Suppliers',
      value: String(totalSuppliers),
      change: 'in the system',
      changeType: 'increase' as const,
    },
    activeContracts: {
      title: 'Active Contracts',
      value: String(activeContracts),
      change: 'across all suppliers',
      changeType: 'increase' as const,
    },
  };

  if (isLoading) {
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
          <main className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Supplier Management
                </h2>
                <p className="text-muted-foreground">
                  Loading suppliers...
                </p>
              </div>
              <Button disabled>
                <PlusCircle className="mr-2" />
                Add Supplier
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
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
        <main className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Supplier Management
                    </h2>
                    <p className="text-muted-foreground">
                        View, add, and manage your fresh produce suppliers.
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Add Supplier
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                        <DialogTitle>Create New Supplier</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to add a new supplier.
                        </DialogDescription>
                        </DialogHeader>
                        <CreateSupplierForm 
                          onSubmit={handleAddSupplier}
                          existingSupplierCodes={existingSupplierCodes}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Link href="/suppliers" className="block transition-transform hover:scale-[1.02]">
                <OverviewCard data={kpiData.totalSuppliers} icon={Grape} />
              </Link>
            {/*  <Link href="/contracts" className="block transition-transform hover:scale-[1.02]">
                <OverviewCard data={kpiData.activeContracts} icon={FileText} />
              </Link>  */}
            </div>

          <SupplierDataTable suppliers={suppliers} onEditSupplier={openEditDialog} />
        </main>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                  Update the details for {editingSupplier?.name}.
              </DialogDescription>
              </DialogHeader>
              <CreateSupplierForm
                supplier={editingSupplier}
                onSubmit={handleUpdateSupplier}
                existingSupplierCodes={existingSupplierCodes}
              />
          </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
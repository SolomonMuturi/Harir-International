
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
import { branchData, employeeData } from '@/lib/data';
import type { Branch } from '@/lib/data';
import { BranchDataTable } from '@/components/dashboard/branch-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateBranchForm } from '@/components/dashboard/create-branch-form';
import { PlusCircle, Building, Users } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(branchData);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const isEditDialogOpen = !!editingBranch;

  const handleAddBranch = (newBranchValues: Omit<Branch, 'id' | 'status'>) => {
    const newBranch: Branch = {
      ...newBranchValues,
      id: `branch-${Date.now()}`,
      status: 'Active',
    };
    setBranches(prev => [newBranch, ...prev]);
    setIsCreateDialogOpen(false);
  };

  const handleUpdateBranch = (updatedBranchData: Omit<Branch, 'id' | 'status'>) => {
    if (!editingBranch) return;
    setBranches(prev =>
      prev.map(branch =>
        branch.id === editingBranch.id
          ? { ...branch, ...updatedBranchData }
          : branch
      )
    );
    setEditingBranch(null);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
  };

  const closeEditDialog = () => {
    setEditingBranch(null);
  };
  
  const totalBranches = branches.length;
  const totalEmployees = branches.reduce((acc, b) => acc + b.employees, 0);

  const kpiData = {
    totalBranches: {
      title: 'Total Branches',
      value: String(totalBranches),
      change: 'nationwide',
      changeType: 'increase' as const,
    },
    totalEmployees: {
      title: 'Total Employees',
      value: String(totalEmployees),
      change: 'across all branches',
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
                        Branch Management
                    </h2>
                    <p className="text-muted-foreground">
                        View, add, and manage your operational branches.
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Add Branch
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Create New Branch</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to add a new branch to the system.
                        </DialogDescription>
                        </DialogHeader>
                        <CreateBranchForm 
                            managers={employeeData.filter(e => e.role === 'Manager')}
                            onSubmit={handleAddBranch} 
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <OverviewCard data={kpiData.totalBranches} icon={Building} />
              <OverviewCard data={kpiData.totalEmployees} icon={Users} />
            </div>

          <BranchDataTable branches={branches} onEditBranch={openEditDialog} />
        </main>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent>
              <DialogHeader>
              <DialogTitle>Edit Branch</DialogTitle>
              <DialogDescription>
                  Update the details for the {editingBranch?.name} branch.
              </DialogDescription>
              </DialogHeader>
              <CreateBranchForm
                managers={employeeData.filter(e => e.role === 'Manager')}
                branch={editingBranch}
                onSubmit={handleUpdateBranch}
              />
          </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

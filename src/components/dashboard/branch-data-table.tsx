
'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Pencil, Users } from 'lucide-react';
import type { Branch } from '@/lib/data';
import { employeeData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface BranchDataTableProps {
  branches: Branch[];
  onEditBranch: (branch: Branch) => void;
}

export function BranchDataTable({ branches, onEditBranch }: BranchDataTableProps) {
  const router = useRouter();
  const statusVariant = {
    Active: 'default',
    Inactive: 'destructive',
  } as const;
  
  const getManagerName = (managerId: string) => {
    return employeeData.find(e => e.id === managerId)?.name || 'Unassigned';
  }

  const handleRowClick = (branchId: string) => {
    router.push(`/branches/${branchId}`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" />
          Company Branches
        </CardTitle>
        <CardDescription>
          Overview of all operational branches. Click a row for more details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-24rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-center">Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow 
                  key={branch.id} 
                  onClick={() => handleRowClick(branch.id)}
                  className={cn(
                    'cursor-pointer',
                    branch.status === 'Inactive' && 'bg-destructive/10'
                  )}
                >
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell className="text-muted-foreground">{branch.location}</TableCell>
                  <TableCell>{getManagerName(branch.managerId)}</TableCell>
                  <TableCell className="text-center">{branch.employees}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[branch.status]}
                      className="capitalize"
                    >
                      {branch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => onEditBranch(branch)}>
                        <Pencil className="mr-2" />
                        Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

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
import { Grape, Pencil } from 'lucide-react';
import type { Supplier } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

interface SupplierDataTableProps {
  suppliers: Supplier[];
  onEditSupplier: (supplier: Supplier) => void;
}

export function SupplierDataTable({ suppliers, onEditSupplier }: SupplierDataTableProps) {
  const router = useRouter();
  const statusVariant = {
    Active: 'default',
    Inactive: 'destructive',
    Onboarding: 'secondary',
  } as const;

  const handleRowClick = (supplierId: string) => {
    router.push(`/suppliers/${supplierId}`);
  };
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grape className="w-5 h-5 text-primary" />
          Suppliers
        </CardTitle>
        <CardDescription>
          Overview of all produce suppliers. Click a row for more details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-24rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Supplier Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Key Produce</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow 
                  key={supplier.id} 
                  onClick={() => handleRowClick(supplier.id)}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    supplier.status === 'Inactive' && 'bg-destructive/10'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={supplier.logoUrl} />
                            <AvatarFallback>{getInitials(supplier.name)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{supplier.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{supplier.supplierCode}</TableCell>
                  <TableCell>{supplier.location}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {/* FIX: Ensure produceTypes is an array before using .slice() */}
                      {Array.isArray(supplier.produceTypes) && supplier.produceTypes.length > 0 ? (
                        supplier.produceTypes.slice(0, 3).map(p => (
                          <Badge key={p} variant="outline">{p}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No produce types</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[supplier.status]}
                      className="capitalize"
                    >
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => onEditSupplier(supplier)}>
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
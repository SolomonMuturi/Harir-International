
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
import { Users, Pencil } from 'lucide-react';
import type { Customer } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { format } from 'date-fns';

interface CustomerDataTableProps {
  customers: Customer[];
  onEditCustomer: (customer: Customer) => void;
}

export function CustomerDataTable({ customers, onEditCustomer }: CustomerDataTableProps) {
  const router = useRouter();
  const statusVariant = {
    active: 'default',
    new: 'secondary',
    inactive: 'destructive',
  } as const;

  const handleRowClick = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Customer Accounts
        </CardTitle>
        <CardDescription>
          Overview of customer sales and activity. Click a row for more details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  onClick={() => handleRowClick(customer.id)}
                  className={cn(
                    'cursor-pointer',
                    customer.status === 'inactive' && 'bg-destructive/10'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={customer.logoUrl} />
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{customer.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.location}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(customer.lastOrder), 'PPP')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[customer.status]}
                      className="capitalize"
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => onEditCustomer(customer)}>
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


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
import { FileText, User, Eye } from 'lucide-react';
import type { CustomerDocument, Customer } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';

type ContractWithCustomer = CustomerDocument & {
  customer: {
    id: string;
    name: string;
  };
};

interface ContractsDataTableProps {
  contracts: ContractWithCustomer[];
}

export function ContractsDataTable({ contracts }: ContractsDataTableProps) {
  const router = useRouter();

  const statusVariant = {
    Active: 'default',
    Expired: 'destructive',
    Terminated: 'destructive',
  } as const;
  
  const handleViewCustomer = (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation();
    router.push(`/customers/${customerId}`);
  };

  const handleViewContract = (customerId: string, docName: string) => {
    // This action navigates to the customer's page and focuses on the correct tab and document
    router.push(`/customers/${customerId}?tab=contracts&doc=${encodeURIComponent(docName)}`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          All Contracts & SLAs
        </CardTitle>
        <CardDescription>
          Browse and manage all agreements across your client base.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-28rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => {
                const daysToExpire = contract.expiryDate ? differenceInDays(new Date(contract.expiryDate), new Date()) : null;
                const isExpiringSoon = daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 30;

                return (
                  <TableRow
                    key={`${contract.customer.id}-${contract.name}`}
                    onClick={() => handleViewContract(contract.customer.id, contract.name)}
                    className={cn(
                        "cursor-pointer",
                        isExpiringSoon && "bg-destructive/10"
                    )}
                  >
                    <TableCell className="font-medium">
                        <p>{contract.name}</p>
                        <Badge variant="outline" className="text-xs">{contract.type}</Badge>
                    </TableCell>
                    <TableCell>{contract.customer.name}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[contract.status || 'Active']}>
                        {contract.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(isExpiringSoon && "text-destructive font-semibold")}>
                        {contract.expiryDate ? format(new Date(contract.expiryDate), 'PPP') : 'N/A'}
                        {isExpiringSoon && ` (${daysToExpire} days left)`}
                    </TableCell>
                    <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" onClick={(e) => handleViewCustomer(e, contract.customer.id)}>
                            <User className="mr-2" />
                            View Client
                        </Button>
                        <Button size="sm" onClick={() => handleViewContract(contract.customer.id, contract.name)}>
                            <Eye className="mr-2" />
                            View
                        </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

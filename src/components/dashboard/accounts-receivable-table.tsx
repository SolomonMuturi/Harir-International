
'use client';

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
import { DollarSign } from 'lucide-react';
import type { AccountsReceivableEntry } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';

interface AccountsReceivableTableProps {
  data: AccountsReceivableEntry[];
}

export function AccountsReceivableTable({ data }: AccountsReceivableTableProps) {
    const router = useRouter();
    const statusVariant = {
        'On Time': 'default',
        'At Risk': 'secondary',
        'Late': 'destructive',
      } as const;
      
    const handleRowClick = (invoiceId: string) => {
        router.push(`/financials/invoices/${invoiceId}`);
    }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Accounts Receivable
        </CardTitle>
        <CardDescription>
          Aging report of outstanding invoices. Click row to view invoice.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Amount (KES)</TableHead>
                <TableHead className="text-right">Aging Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.id} onClick={() => handleRowClick(entry.id)} className="cursor-pointer">
                  <TableCell>
                    <div className="font-medium">{entry.customer}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground font-mono">
                      {entry.invoiceId}
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.amount.toLocaleString('en-KE', {
                      style: 'currency',
                      currency: 'KES',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={statusVariant[entry.agingStatus]}
                      className="capitalize"
                    >
                      {entry.agingStatus}
                    </Badge>
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


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
import { FileCheck2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { PodReconciliationEntry } from '@/lib/data';
import { accountsReceivableData } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface PodReconciliationProps {
  reconciliations: PodReconciliationEntry[];
}

export function PodReconciliation({ reconciliations }: PodReconciliationProps) {
  const router = useRouter();

  const statusInfo = {
    matched: {
      variant: 'default',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      text: 'text-green-500',
    },
    pending: {
      variant: 'secondary',
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      text: 'text-yellow-500',
    },
    mismatch: {
      variant: 'destructive',
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      text: 'text-red-500',
    },
  } as const;
  
  const handleRowClick = (invoiceId: string) => {
    const arEntry = accountsReceivableData.find(ar => ar.invoiceId === invoiceId);
    if (arEntry) {
      router.push(`/financials/invoices/${arEntry.id}`);
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-primary" />
          POD Reconciliation
        </CardTitle>
        <CardDescription>
          Verify delivery against shipments. Click row to view invoice.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[280px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Shipment ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.map((pod) => (
                <TableRow 
                  key={pod.id}
                  onClick={() => handleRowClick(pod.invoiceId)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-sm">{pod.shipmentId}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusInfo[pod.status].variant}
                      className="capitalize flex items-center gap-1 w-fit"
                    >
                      {statusInfo[pod.status].icon}
                      <span>{pod.status}</span>
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


'use client';

import { FreshTraceLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../ui/table';
import { Badge } from '../ui/badge';
import type { Customer, CustomerDocument, CustomerOrder, CustomerContact, AccountsReceivableEntry } from '@/lib/data';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useMemo } from 'react';

interface PrintableCustomerReportProps {
  customer: Customer;
  receivables: AccountsReceivableEntry[];
}

export function PrintableCustomerReport({ customer, receivables }: PrintableCustomerReportProps) {
  
  const arStatusVariant = {
    'On Time': 'default',
    'At Risk': 'secondary',
    Late: 'destructive',
  } as const;

  const orderStatusVariant = {
    'Delivered': 'default',
    'In-Transit': 'secondary',
    'Processing': 'outline',
  } as const;
  
  const ytdSalesOverview = {
    title: 'YTD Sales',
    value: customer.ytdSales.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }),
  }

  const outstandingBalance = {
    title: 'Outstanding Balance',
    value: customer.outstandingBalance.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }),
  }
  
  const totalReceivables = receivables.reduce((sum, item) => sum + item.amount, 0);

  const reportId = `CUST-${new Date().getFullYear()}-${String(customer.id).slice(-4).toUpperCase()}`;


  return (
    <div className="p-8 bg-white text-black">
      <header className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshTraceLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Customer Report: {customer.name}</h1>
            <p className="text-sm text-gray-500">
              Generated on: {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="text-right">
            <p className="font-bold">FreshTrace Inc.</p>
            <p className="text-sm">info@freshtrace.co.ke | www.freshtrace.co.ke</p>
            <p className="font-mono text-xs mt-1">{reportId}</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Financial Summary</h2>
        <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gray-50 text-black"><CardHeader><CardTitle className="text-sm font-medium text-gray-700">{ytdSalesOverview.title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{ytdSalesOverview.value}</p></CardContent></Card>
            <Card className="bg-gray-50 text-black"><CardHeader><CardTitle className="text-sm font-medium text-gray-700">{outstandingBalance.title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{outstandingBalance.value}</p></CardContent></Card>
        </div>
      </section>
      
       <section className="mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h2 className="text-xl font-semibold mb-2">Order History</h2>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Value (KES)</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customer.orderHistory.map(order => (
                    <TableRow key={order.orderId}>
                        <TableCell className="font-mono">{order.orderId}</TableCell>
                        <TableCell>{format(new Date(order.date), 'PPP')}</TableCell>
                        <TableCell className="font-mono">{order.value.toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant={orderStatusVariant[order.status]}>{order.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </section>

      <section className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Accounts Receivable</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount (KES)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivables.map((entry) => (
                <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.invoiceId}</TableCell>
                    <TableCell>{entry.dueDate}</TableCell>
                    <TableCell>
                    <Badge
                        variant={arStatusVariant[entry.agingStatus]}
                        className="capitalize"
                    >
                        {entry.agingStatus}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{entry.amount.toLocaleString()}</TableCell>
                </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">Total Unpaid</TableCell>
                <TableCell className="text-right font-bold font-mono">{totalReceivables.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </section>

    </div>
  );
}


'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { PettyCashTransaction } from '@/lib/data';
import { format } from 'date-fns';

interface PrintablePettyCashReportProps {
  transactions: PettyCashTransaction[];
}

export function PrintablePettyCashReport({ transactions }: PrintablePettyCashReportProps) {
  
  const reportId = `PC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';

  const balance = transactions.reduce((acc, tx) => {
    return tx.type === 'in' ? acc + tx.amount : acc - tx.amount;
  }, 0);
  
  const totalIn = transactions.filter(t => t.type === 'in').reduce((acc, tx) => acc + tx.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'out').reduce((acc, tx) => acc + tx.amount, 0);


  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Petty Cash & Expenses Report</h1>
            <p className="text-sm text-gray-500">
              Date: {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
            <div className="text-right">
                <p className="font-bold">FreshTrace Inc.</p>
                <p className="text-sm">info@freshtrace.co.ke | www.freshtrace.co.ke</p>
                <p className="font-mono text-xs mt-1">{reportId}</p>
            </div>
             <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationUrl)}`} 
                alt="QR Code for report verification"
                className="w-20 h-20"
            />
        </div>
      </div>
      
       <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
         <div className="grid grid-cols-3 gap-4">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total In</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">KES {totalIn.toLocaleString()}</div></CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Out</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">KES {totalOut.toLocaleString()}</div></CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Current Balance</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">KES {balance.toLocaleString()}</div></CardContent>
            </Card>
        </div>
      </div>

      <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Transaction Log</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead className="text-right">Cash In (KES)</TableHead>
              <TableHead className="text-right">Cash Out (KES)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs">{format(new Date(tx.timestamp), 'yyyy-MM-dd HH:mm')}</TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell>{tx.recipient || '-'}</TableCell>
                <TableCell className="text-right font-mono text-green-600">
                    {tx.type === 'in' ? tx.amount.toLocaleString() : '-'}
                </TableCell>
                <TableCell className="text-right font-mono text-red-600">
                    {tx.type === 'out' ? tx.amount.toLocaleString() : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

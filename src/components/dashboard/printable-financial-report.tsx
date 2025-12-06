
'use client';

import { FreshTraceLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../ui/table';
import { Badge } from '../ui/badge';
import type { AccountsReceivableEntry, GeneralLedgerEntry } from '@/lib/data';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useMemo } from 'react';
import { overviewData } from '@/lib/data';

interface PrintableFinancialReportProps {
  accountsReceivableData: AccountsReceivableEntry[];
  generalLedgerData: GeneralLedgerEntry[];
}

export function PrintableFinancialReport({ accountsReceivableData, generalLedgerData }: PrintableFinancialReportProps) {
  
  const statusVariant = {
    'On Time': 'default',
    'At Risk': 'secondary',
    Late: 'destructive',
  } as const;

  const { revenue, opex, capex, netIncome, opexBreakdown } = useMemo(() => {
    const revenue = generalLedgerData
      .filter(entry => entry.type === 'Revenue')
      .reduce((sum, entry) => sum + entry.credit, 0);

    const opexEntries = generalLedgerData.filter(entry => entry.type === 'OPEX');
    const capexEntries = generalLedgerData.filter(entry => entry.type === 'CAPEX');

    const opexBreakdown = opexEntries.reduce((acc, entry) => {
        const key = entry.account.replace(' Expense', '');
        acc[key] = (acc[key] || 0) + entry.debit;
        return acc;
      }, {} as Record<string, number>);

    const opex = opexEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const capex = capexEntries.reduce((sum, entry) => sum + entry.debit, 0);

    const netIncome = revenue - opex;

    return { revenue, opex, capex, netIncome, opexBreakdown };
  }, [generalLedgerData]);

  const totalAR = accountsReceivableData.reduce((sum, item) => sum + item.amount, 0);

  const reportId = `FIN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';


  return (
    <div className="p-8 bg-white text-black">
      <header className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshTraceLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Comprehensive Financial Report</h1>
            <p className="text-sm text-gray-500">
              Generated on: {format(new Date(), 'MMMM d, yyyy')}
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
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">High-Level Financial Health</h2>
        <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gray-50"><CardHeader><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{revenue.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p></CardContent></Card>
            <Card className="bg-gray-50"><CardHeader><CardTitle className="text-sm font-medium">Net Income (P/L)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{netIncome.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p></CardContent></Card>
            <Card className="bg-gray-50"><CardHeader><CardTitle className="text-sm font-medium">Total OPEX</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{opex.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p></CardContent></Card>
            <Card className="bg-gray-50"><CardHeader><CardTitle className="text-sm font-medium">Total CAPEX</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{capex.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p></CardContent></Card>
        </div>
      </section>
      
       <section className="mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h2 className="text-xl font-semibold mb-2">Profit & Loss Statement (Simplified)</h2>
         <Card>
            <CardContent className="p-6 grid grid-cols-1 gap-x-8">
                <div>
                    <h3 className="font-semibold mb-2">Revenue</h3>
                    <div className="flex justify-between py-2 border-b">
                        <span>Sales Revenue</span>
                        <span className="font-mono">{revenue.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold border-b-2 border-black">
                        <span>Total Revenue</span>
                        <span className="font-mono">{revenue.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                    </div>
                </div>
                 <div className="mt-4">
                    <h3 className="font-semibold mb-2">Operating Expenses (OPEX)</h3>
                    {Object.entries(opexBreakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1 border-b">
                            <span>{key}</span>
                            <span className="font-mono">{value.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold border-b-2 border-black">
                        <span>Total Operating Expenses</span>
                        <span className="font-mono text-red-600">({opex.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })})</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-6 bg-gray-50">
                 <div className="flex justify-between w-full font-bold text-lg">
                    <span>Net Income</span>
                    <span className={`font-mono ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netIncome.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                    </span>
                </div>
            </CardFooter>
        </Card>
      </section>

      <section className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Unpaid Invoices (Accounts Receivable)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount (KES)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsReceivableData.map((entry) => (
                <TableRow key={entry.id}>
                    <TableCell>{entry.customer}</TableCell>
                    <TableCell className="font-mono">{entry.invoiceId}</TableCell>
                    <TableCell>{entry.dueDate}</TableCell>
                    <TableCell>
                    <Badge
                        variant={statusVariant[entry.agingStatus]}
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
                <TableCell colSpan={4} className="text-right font-bold">Total Unpaid</TableCell>
                <TableCell className="text-right font-bold font-mono">{totalAR.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </section>

      <section className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">General Ledger Entries</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit (KES)</TableHead>
              <TableHead className="text-right">Credit (KES)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generalLedgerData.map((entry) => (
                <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.account}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell><Badge variant="outline">{entry.type}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-right font-mono">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

    </div>
  );
}

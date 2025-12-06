
'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import type { WeightEntry } from '@/lib/data';

interface PrintableWeightReportProps {
  weights: WeightEntry[];
}

export function PrintableWeightReport({ weights }: PrintableWeightReportProps) {
  
  const reportId = `WTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';

  const formatWeight = (weight: number) => {
    if (weight >= 1000) {
        return `${(weight / 1000).toFixed(2)} t`;
    }
    return `${weight.toFixed(1)} kg`;
  };

  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Weight Reconciliation Report</h1>
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
        <h2 className="text-xl font-semibold mb-2">Recorded Weights</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pallet ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Declared</TableHead>
              <TableHead className="text-right">Net Weighed</TableHead>
              <TableHead className="text-right">Discrepancy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weights.map(item => {
                const discrepancy = (item.netWeight || 0) - (item.declaredWeight || 0);
                return (
                    <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.palletId}</TableCell>
                        <TableCell>{item.product}</TableCell>
                        <TableCell>{item.client}</TableCell>
                        <TableCell className="text-right font-mono">{formatWeight(item.declaredWeight || 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatWeight(item.netWeight || 0)}</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${discrepancy < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {discrepancy.toFixed(2)} kg
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

    

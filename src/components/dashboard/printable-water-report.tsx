
'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import type { WaterQualityEntry } from '@/lib/data';

interface PrintableWaterReportProps {
  consumptionData: { date: string; consumption: number }[];
  breakdownData: { area: string; consumption: number, fill: string }[];
  qualityData: WaterQualityEntry[];
}

export function PrintableWaterReport({ consumptionData, breakdownData, qualityData }: PrintableWaterReportProps) {
  
  const reportId = `WTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';

  const totalConsumption = breakdownData.reduce((sum, item) => sum + item.consumption, 0);

  const qualityStatusVariant = {
    'Pass': 'default',
    'Fail': 'destructive',
  } as const;

  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Water Usage & Quality Report</h1>
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
        <h2 className="text-xl font-semibold mb-2">Water Consumption by Area</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead className="text-right">Consumption (m³)</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdownData.map(item => (
                <TableRow key={item.area}>
                    <TableCell className="font-medium">{item.area}</TableCell>
                    <TableCell className="text-right font-mono">{item.consumption.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{((item.consumption / totalConsumption) * 100).toFixed(1)}%</TableCell>
                </TableRow>
            ))}
             <TableRow className="font-bold bg-gray-50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right font-mono">{totalConsumption.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono">100.0%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

       <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Water Quality Test Results</h2>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>pH</TableHead>
                    <TableHead>Turbidity</TableHead>
                    <TableHead>Conductivity</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {qualityData.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>{item.source}</TableCell>
                        <TableCell className="font-mono text-xs">{item.date}</TableCell>
                        <TableCell className="font-mono">{item.pH.toFixed(2)}</TableCell>
                        <TableCell className="font-mono">{item.turbidity.toFixed(2)}</TableCell>
                        <TableCell className="font-mono">{item.conductivity.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={qualityStatusVariant[item.status]}>{item.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}

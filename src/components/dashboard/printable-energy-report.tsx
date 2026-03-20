
'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import { EnergyConsumptionChart } from './energy-consumption-chart';
import { EnergyBreakdownChart } from './energy-breakdown-chart';

interface PrintableEnergyReportProps {
  consumptionData: { hour: string; usage: number }[];
  breakdownData: { area: string; consumption: number, fill: string }[];
}

export function PrintableEnergyReport({ consumptionData, breakdownData }: PrintableEnergyReportProps) {
  
  const reportId = `ENG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';

  const totalConsumption = breakdownData.reduce((sum, item) => sum + item.consumption, 0);

  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Energy Usage Report</h1>
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
        <h2 className="text-xl font-semibold mb-2">Energy Consumption by Area</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead className="text-right">Consumption (kWh)</TableHead>
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
        <h2 className="text-xl font-semibold mb-2">Hourly Energy Usage</h2>
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Hour</TableHead>
                    <TableHead className="text-right">Usage (kWh)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {consumptionData.map(item => (
                    <TableRow key={item.hour}>
                        <TableCell>{item.hour}</TableCell>
                        <TableCell className="text-right font-mono">{item.usage}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}

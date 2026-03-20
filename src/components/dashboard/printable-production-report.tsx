
'use client';

import { FreshTraceLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../ui/table';
import { Badge } from '../ui/badge';
import type { ProductionReportData } from '@/lib/data';
import { format } from 'date-fns';

interface PrintableProductionReportProps {
  reportData: ProductionReportData;
}

export function PrintableProductionReport({ reportData }: PrintableProductionReportProps) {
  
  const reportId = `PROD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  const totalBoxes = reportData.productionDetails.reduce((sum, item) => sum + item.boxes, 0);

  return (
    <div className="p-12 bg-white text-black font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="text-center mb-10">
        <div className="flex items-center justify-center gap-4">
          <FreshTraceLogo className="h-16 w-16 text-green-600" />
          <h1 className="text-4xl font-bold text-gray-800">Production Report</h1>
        </div>
        <p className="text-lg text-gray-600 mt-2">{reportData.company}</p>
      </header>
      
      <div className="grid grid-cols-3 gap-4 mb-10 text-center">
        <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Report Date</p>
            <p className="text-lg font-semibold">{reportData.date}</p>
        </div>
         <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Shift</p>
            <p className="text-lg font-semibold">{reportData.shift}</p>
        </div>
         <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Report ID</p>
            <p className="text-lg font-semibold font-mono">{reportId}</p>
        </div>
      </div>

      <main>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Production Summary</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-lg">Product</TableHead>
              <TableHead className="text-right text-lg">Boxes Processed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.productionDetails.map((item, index) => (
                <TableRow key={index} className="text-base">
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell className="text-right font-mono">{item.boxes.toLocaleString()}</TableCell>
                </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="text-lg font-bold bg-gray-100">
                <TableCell>Total Boxes</TableCell>
                <TableCell className="text-right font-mono">{totalBoxes.toLocaleString()}</TableCell>
            </TableRow>
            <TableRow className="text-lg font-bold bg-gray-100">
                <TableCell>Labor Used</TableCell>
                <TableCell className="text-right font-mono">{reportData.laborUsed}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </main>

      <footer className="mt-16 text-center text-xs text-gray-400 pt-4 border-t">
        <p>This is an electronically generated report from the FreshTrace system.</p>
        <p>FreshTrace Inc. | P.O. Box 12345 - 00100, Nairobi</p>
      </footer>
    </div>
  );
}



'use client';

import * as React from 'react';
import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';

interface PrintableQualityReportProps {
  qcData: {
    category: string;
    score: number;
    breakdown: { metric: string; value: number }[];
  }[];
}

export function PrintableQualityReport({ qcData }: PrintableQualityReportProps) {

  const reportId = `QC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';

  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Quality Control Summary Report</h1>
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
        <h2 className="text-xl font-semibold mb-2">Operational Compliance Scores</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category / Metric</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qcData.map(item => (
                <React.Fragment key={item.category}>
                    <TableRow className="bg-gray-50">
                        <TableCell className="font-bold">{item.category}</TableCell>
                        <TableCell className="text-right font-bold">{item.score}%</TableCell>
                    </TableRow>
                    {item.breakdown.map(detail => (
                        <TableRow key={detail.metric}>
                            <TableCell className="pl-8 text-gray-600">{detail.metric}</TableCell>
                            <TableCell className="text-right text-gray-600">{detail.value}%</TableCell>
                        </TableRow>
                    ))}
                </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

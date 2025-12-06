
'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import type { DetailedIncident } from '@/lib/data';

interface PrintableIncidentReportProps {
  incidentTrendData: { month: string; incidents: number }[];
  detailedIncidentData: DetailedIncident[];
}

export function PrintableIncidentReport({ incidentTrendData, detailedIncidentData }: PrintableIncidentReportProps) {
  
  const reportId = `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';

  const severityVariant = {
    Low: 'secondary',
    Medium: 'default',
    High: 'outline',
    Critical: 'destructive',
  } as const;

  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">High-Risk Incident Report</h1>
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
        <h2 className="text-xl font-semibold mb-2">Monthly Incident Volume</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Number of Incidents</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidentTrendData.map(item => (
                <TableRow key={item.month}>
                    <TableCell className="font-medium">{item.month}</TableCell>
                    <TableCell className="text-right font-mono">{item.incidents}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Detailed Incident Log</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailedIncidentData.map(item => (
                <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{format(new Date(item.date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                    <TableCell className="text-xs">{item.description}</TableCell>
                    <TableCell><Badge variant={severityVariant[item.severity]}>{item.severity}</Badge></TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.location}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}

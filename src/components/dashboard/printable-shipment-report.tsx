'use client';

import { FreshTraceLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import type { Shipment } from '@/lib/data';
import { format } from 'date-fns';

interface PrintableShipmentReportProps {
  shipments: Shipment[];
}

export function PrintableShipmentReport({ shipments }: PrintableShipmentReportProps) {

  const statusVariant = {
    'Awaiting QC': 'destructive',
    'Receiving': 'secondary',
    'Processing': 'default',
    'Preparing for Dispatch': 'secondary',
    'Ready for Dispatch': 'default',
    'In-Transit': 'default',
    'Delivered': 'outline',
    'Delayed': 'destructive',
  } as const;
  
  const reportId = `SR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';


  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshTraceLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Shipment Report</h1>
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
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Shipment List ({shipments.length} items)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Expected Arrival</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map(shipment => {
              return (
                <TableRow key={shipment.id}>
                  <TableCell className="font-mono">{shipment.shipmentId}</TableCell>
                  <TableCell>{shipment.customer}</TableCell>
                  <TableCell>{shipment.origin} to {shipment.destination}</TableCell>
                  <TableCell>{shipment.product}</TableCell>
                  <TableCell>{shipment.expectedArrival ? format(new Date(shipment.expectedArrival), 'MMM d, HH:mm') : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[shipment.status]} className="capitalize">
                      {shipment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{shipment.weight}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

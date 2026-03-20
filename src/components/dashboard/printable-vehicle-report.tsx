'use client';

import { FreshTraceLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import type { Visitor, Shipment } from '@/lib/data';
import { employeeData } from '@/lib/data';
import { format } from 'date-fns';

interface PrintableVehicleReportProps {
  visitors?: Visitor[];
  shipments?: Shipment[];
}

export function PrintableVehicleReport({ visitors, shipments }: PrintableVehicleReportProps) {
  // Ensure arrays are never undefined
  const safeVisitors = visitors || [];
  const safeShipments = shipments || [];

  const visitorStatusVariant = {
    'Checked-in': 'default',
    'Pre-registered': 'secondary',
    'Checked-out': 'outline',
    'Pending Exit': 'destructive',
  } as const;

  const shipmentStatusVariant = {
    'Receiving': 'secondary',
    'Processing': 'default',
    'In-Transit': 'default',
    'Delivered': 'outline',
    'Delayed': 'destructive',
  } as const;
  
  const formatTimestamp = (ts?: string) => {
    return ts ? format(new Date(ts), 'HH:mm') : '-';
  }
  
  const formatExpectedTimestamp = (ts?: string) => {
    if (!ts) return '-';
    return format(new Date(ts), 'MMM d, HH:mm');
  };
  
  const getHostName = (hostId?: string) => {
    if (!hostId) return 'N/A';
    const host = employeeData.find(e => e.id === hostId);
    return host ? `${host.name} (${host.role})` : 'Unknown';
  };

  const reportId = `VR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';

  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshTraceLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Vehicle & Shipment Report</h1>
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
        <h2 className="text-xl font-semibold mb-2">Vehicle Log ({safeVisitors.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Host/Dept</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeVisitors.map(visitor => (
              <TableRow key={visitor.id}>
                <TableCell>
                  <p className="font-medium">{visitor.name}</p>
                  <p className="text-xs text-gray-500">{visitor.company}</p>
                </TableCell>
                <TableCell className="text-xs">{getHostName(visitor.hostId)}</TableCell>
                <TableCell className="font-mono text-xs">{visitor.vehiclePlate}</TableCell>
                <TableCell className="font-mono text-xs">{formatTimestamp(visitor.expectedCheckInTime)}</TableCell>
                <TableCell className="font-mono text-xs">{formatTimestamp(visitor.checkInTime)}</TableCell>
                <TableCell className="font-mono text-xs">{formatTimestamp(visitor.checkOutTime)}</TableCell>
                <TableCell>
                  <Badge variant={visitorStatusVariant[visitor.status]}>
                    {visitor.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

       <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Incoming Shipments ({safeShipments.length})</h2>
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Expected Arrival</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeShipments.map(shipment => {
              return (
                <TableRow key={shipment.id}>
                  <TableCell className="font-mono">{shipment.shipmentId}</TableCell>
                  <TableCell>{shipment.customer}</TableCell>
                  <TableCell>{shipment.origin} to {shipment.destination}</TableCell>
                  <TableCell>{shipment.product}</TableCell>
                  <TableCell className="font-mono text-xs">{formatExpectedTimestamp(shipment.expectedArrival)}</TableCell>
                  <TableCell>
                    <Badge variant={shipmentStatusVariant[shipment.status]} className="capitalize">
                      {shipment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
       </div>
    </div>
  );
}
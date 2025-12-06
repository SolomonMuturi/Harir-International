

'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import type { ColdRoomStatus, DwellTimeEntry, ExplainAnomalyInput } from '@/lib/data';
import { format } from 'date-fns';

type Alert = {
  id: string;
  time: string;
  type: 'Temperature Excursion' | 'Temperature Return';
  description: string;
};

interface PrintableColdRoomReportProps {
  rooms: ColdRoomStatus[];
  inventory: DwellTimeEntry[];
  alerts: ExplainAnomalyInput[];
}

export function PrintableColdRoomReport({ rooms, inventory, alerts }: PrintableColdRoomReportProps) {
  
  const roomStatusVariant = {
    Optimal: 'default',
    Warning: 'secondary',
    Alert: 'destructive',
  } as const;

  const dwellStatusVariant = {
    optimal: 'default',
    moderate: 'secondary',
    high: 'destructive',
  } as const;

  const reportId = `CRR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';


  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Cold Room Operations Report</h1>
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
        <h2 className="text-xl font-semibold mb-2">Cold Room Status Summary</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead className="text-center">Temperature</TableHead>
              <TableHead className="text-center">Humidity</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map(room => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell className="text-center font-mono">{room.temperature.toFixed(1)}°C</TableCell>
                <TableCell className="text-center font-mono">{room.humidity}%</TableCell>
                <TableCell className="text-right">
                    <Badge variant={roomStatusVariant[room.status]}>{room.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

       <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Inventory Dwell Time</h2>
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location / Pallet ID</TableHead>
              <TableHead>Primary Product</TableHead>
              <TableHead>Avg. Dwell Time</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map(item => (
                <TableRow key={item.id}>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.primaryProduct}</TableCell>
                    <TableCell className="font-mono">{item.avgDwellTime}</TableCell>
                    <TableCell className="text-right">
                         <Badge variant={dwellStatusVariant[item.status]}>{item.status}</Badge>
                    </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

       <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Recent Alerts</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.metricName + alert.timestamp}>
                <TableCell className="font-mono text-xs">{format(new Date(alert.timestamp), 'yyyy-MM-dd HH:mm')}</TableCell>
                <TableCell>
                  <Badge variant="destructive">{alert.metricName}</Badge>
                </TableCell>
                <TableCell className="text-xs">Value: {alert.metricValue} (Expected: {alert.expectedValue})</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import type { Visitor, Employee, TimeAttendance } from '@/lib/data';
import { format } from 'date-fns';

interface PrintableVisitorReportProps {
  visitors: Visitor[];
  employees: Employee[];
  attendance: TimeAttendance[];
}

export function PrintableVisitorReport({ visitors, employees, attendance }: PrintableVisitorReportProps) {

  const visitorStatusVariant = {
    'Checked-in': 'default',
    'Pre-registered': 'secondary',
    'Checked-out': 'outline',
    'Pending Exit': 'destructive'
  } as const;

  const attendanceStatusVariant = {
    'Present': 'default',
    'Absent': 'destructive',
    'On Leave': 'secondary',
  } as const;

  const formatTimestamp = (ts?: string) => {
    return ts ? format(new Date(ts), 'HH:mm') : '-';
  }

  const casualWorkers = employees.filter(e => e.contract === 'Contract');
  const casualAttendance = attendance.filter(a => casualWorkers.some(cw => cw.id === a.employeeId));

  const reportId = `PLOG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';
  
  const getHostName = (hostId?: string) => {
    if (!hostId) return 'N/A';
    const host = employees.find(e => e.id === hostId);
    return host ? `${host.name} (${host.role})` : 'Unknown';
  };


  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Daily Personnel Log</h1>
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
        <h2 className="text-xl font-semibold mb-2">Visitor Log ({visitors.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Host/Dept</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors.map(visitor => (
              <TableRow key={visitor.id}>
                <TableCell>
                  <p className="font-medium">{visitor.name}</p>
                  <p className="text-xs text-gray-500">{visitor.company}</p>
                </TableCell>
                <TableCell className="text-xs">{getHostName(visitor.hostId)}</TableCell>
                <TableCell className="font-mono text-xs">{visitor.vehiclePlate || 'N/A'}</TableCell>
                <TableCell className="text-xs max-w-[150px]">{visitor.cargoDescription || visitor.reasonForVisit || 'N/A'}</TableCell>
                <TableCell className="font-mono">{formatTimestamp(visitor.checkInTime)}</TableCell>
                <TableCell className="font-mono">{formatTimestamp(visitor.checkOutTime)}</TableCell>
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
        <h2 className="text-xl font-semibold mb-2">Casual Worker Attendance ({casualWorkers.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Clock-in</TableHead>
              <TableHead>Clock-out</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {casualWorkers.map(cw => {
                const att = casualAttendance.find(a => a.employeeId === cw.id);
                return (
                    <TableRow key={cw.id}>
                        <TableCell>{cw.name}</TableCell>
                        <TableCell>{cw.role}</TableCell>
                        <TableCell className="font-mono">{att ? formatTimestamp(att.clockInTime) : '-'}</TableCell>
                        <TableCell className="font-mono">{att ? formatTimestamp(att.clockOutTime) : '-'}</TableCell>
                        <TableCell>
                           {att ? (
                             <Badge variant={attendanceStatusVariant[att.status]}>
                                {att.status}
                             </Badge>
                           ) : (
                             <Badge variant="outline">No Record</Badge>
                           )}
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

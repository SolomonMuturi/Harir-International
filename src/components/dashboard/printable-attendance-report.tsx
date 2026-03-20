

'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import type { Employee, TimeAttendance } from '@/lib/data';
import { format } from 'date-fns';

interface PrintableAttendanceReportProps {
  employees: Employee[];
  attendance: TimeAttendance[];
}

export function PrintableAttendanceReport({ employees, attendance }: PrintableAttendanceReportProps) {
  const onDuty = attendance.filter(a => a.status === 'Present');
  const onLeave = attendance.filter(a => a.status === 'On Leave');
  const absent = attendance.filter(a => a.status === 'Absent');

  const getEmployee = (id: string) => employees.find(e => e.id === id);
  
  const reportId = `AR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';


  return (
    <div className="printable-attendance-report p-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Daily Employee Report</h1>
            <p className="text-sm text-muted-foreground">
              Date: {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
            <div className="text-right">
                <p className="font-bold">Harir Int.</p>
                <p className="text-sm">info@harirint.com | www.harirint.com</p>
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
        <h2 className="text-xl font-semibold mb-2">Employees On Duty ({onDuty.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {onDuty.map(att => {
              const emp = getEmployee(att.employeeId);
              if (!emp) return null;
              return (
                <TableRow key={att.employeeId}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>{att.clockInTime ? format(new Date(att.clockInTime), 'HH:mm') : '-'}</TableCell>
                  <TableCell>{att.clockOutTime ? format(new Date(att.clockOutTime), 'HH:mm') : 'Not yet'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Employees On Leave ({onLeave.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {onLeave.map(att => {
              const emp = getEmployee(att.employeeId);
              if (!emp) return null;
              return (
                <TableRow key={att.employeeId}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

       <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Absent Employees ({absent.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {absent.map(att => {
              const emp = getEmployee(att.employeeId);
              if (!emp) return null;
              return (
                <TableRow key={att.employeeId}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Overall Performance Summary</h2>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Rating</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {employees.map(emp => (
                    <TableRow key={emp.id}>
                        <TableCell>{emp.name}</TableCell>
                        <TableCell>{emp.role}</TableCell>
                        <TableCell>{emp.contract}</TableCell>
                        <TableCell>
                            <Badge variant={
                                emp.performance === 'Exceeds Expectations' ? 'default' :
                                emp.performance === 'Needs Improvement' ? 'destructive' :
                                'secondary'
                            }>
                                {emp.performance}
                            </Badge>
                        </TableCell>
                        <TableCell>{emp.rating}/5</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>

    </div>
  );
}

'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import type { Employee, AdvanceRequest } from '@/lib/data';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PrintablePayrollReportProps {
  employees: Employee[];
  requests: AdvanceRequest[];
  kpis: {
    totalPayroll: { title: string; value: string; };
    advancesPaid: { title: string; value: string; };
    netPay: { title: string; value: string; };
  }
}

export function PrintablePayrollReport({ employees, requests, kpis }: PrintablePayrollReportProps) {
  
  const statusVariant = {
    Pending: 'secondary',
    Approved: 'default',
    Rejected: 'destructive',
    Paid: 'outline',
  } as const;

  const reportId = `PR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/report/${reportId}` : '';


  return (
    <div className="p-8 bg-white text-black">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshViewLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Payroll Summary Report</h1>
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
        <h2 className="text-xl font-semibold mb-2">Key Payroll Metrics</h2>
         <div className="grid grid-cols-3 gap-4">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{kpis.totalPayroll.title}</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{kpis.totalPayroll.value}</div></CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{kpis.advancesPaid.title}</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{kpis.advancesPaid.value}</div></CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{kpis.netPay.title}</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{kpis.netPay.value}</div></CardContent>
            </Card>
        </div>
      </div>

      <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Payroll Details</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Contract</TableHead>
              <TableHead className="text-right">Gross Pay (KES)</TableHead>
              <TableHead className="text-right">Deductions (KES)</TableHead>
              <TableHead className="text-right">Net Pay (KES)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.filter(e => e.contract !== 'Contract').map((employee) => {
                const grossPay = employee.salary;
                const deductions = grossPay * 0.15;
                const netPay = grossPay - deductions;

                return (
                    <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.contract}</TableCell>
                        <TableCell className="text-right font-mono">{grossPay.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{deductions.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{netPay.toLocaleString()}</TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mb-8" style={{ pageBreakBefore: 'always' }}>
        <h2 className="text-xl font-semibold mb-2">Salary Advance Requests</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Amount (KES)</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
                <TableRow key={request.id}>
                    <TableCell className="font-medium">{employees.find(e=>e.id === request.employeeId)?.name}</TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell className="text-right font-mono">{request.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                         <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                    </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}

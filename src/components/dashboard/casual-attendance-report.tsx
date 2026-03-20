'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, Printer } from 'lucide-react';
import type { Employee, TimeAttendance } from '@/lib/data';
import { format, parseISO } from 'date-fns';

interface CasualAttendanceReportProps {
  employees: Employee[];
  attendance: TimeAttendance[];
}

// Casual rates by designation (in KES per day)
const casualRates: Record<string, number> = {
  'Quality Assurance': 1200,
  'Quality Control': 1100,
  'Packer': 900,
  'Porter': 850,
  'Dipping': 1000,
  'Palletizing': 950,
  'Loading': 1000
};

export function CasualAttendanceReport({ employees, attendance }: CasualAttendanceReportProps) {
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [designationFilter, setDesignationFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');

  // Get all casual employees
  const casualEmployees = useMemo(() => {
    return employees.filter(emp => emp.contract === 'Contract');
  }, [employees]);

  // Get unique dates from attendance
  const uniqueDates = useMemo(() => {
    const dates = new Set(attendance.map(a => a.date));
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [attendance]);

  // Filtered report data
  const reportData = useMemo(() => {
    const casualAttendance = attendance.filter(att => {
      const emp = casualEmployees.find(e => e.id === att.employeeId);
      if (!emp) return false;
      
      // Filter by date
      if (dateFilter !== 'all' && att.date !== dateFilter) return false;
      
      // Filter by designation
      if (designationFilter !== 'all' && att.designation !== designationFilter) return false;
      
      // Filter by shift
      if (shiftFilter !== 'all') {
        const empShift = emp.shift || 'Day';
        if (shiftFilter === 'Day' && empShift !== 'Day') return false;
        if (shiftFilter === 'Night' && empShift !== 'Night') return false;
      }
      
      return att.status === 'Present';
    });

    return casualAttendance.map(att => {
      const emp = casualEmployees.find(e => e.id === att.employeeId);
      const designation = att.designation || 'Not Specified';
      const rate = casualRates[designation] || 900;
      const shift = emp?.shift || 'Day';

      return {
        date: att.date,
        name: emp?.name || 'Unknown',
        phone: emp?.phone || 'N/A',
        idNumber: emp?.idNumber || 'N/A',
        designation,
        rate,
        shift,
        clockIn: att.clockInTime ? format(parseISO(att.clockInTime), 'HH:mm') : 'N/A',
        clockOut: att.clockOutTime ? format(parseISO(att.clockOutTime), 'HH:mm') : 'N/A'
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, casualEmployees, dateFilter, designationFilter, shiftFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalEmployees = new Set(reportData.map(r => r.name)).size;
    const totalDays = reportData.length;
    const totalAmount = reportData.reduce((sum, item) => sum + item.rate, 0);
    
    return { totalEmployees, totalDays, totalAmount };
  }, [reportData]);

  // Export to Excel/CSV
  const exportToCSV = () => {
    const headers = ['DATE', 'NAME', 'TELEPHONE NUMBER', 'ID NUMBER', 'DESIGNATION', 'RATE (KES)', 'SHIFT', 'CLOCK IN', 'CLOCK OUT'];
    const csvRows = reportData.map(row => [
      format(parseISO(row.date), 'yyyy-MM-dd'),
      row.name,
      row.phone,
      row.idNumber,
      row.designation,
      row.rate,
      row.shift,
      row.clockIn,
      row.clockOut
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = dateFilter !== 'all' ? `casuals-attendance-${dateFilter}.csv` : 'casuals-attendance-all-dates.csv';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export to Excel (using CSV with .xls extension for simplicity)
  const exportToExcel = () => {
    const headers = ['DATE', 'NAME', 'TELEPHONE NUMBER', 'ID NUMBER', 'DESIGNATION', 'RATE (KES)', 'SHIFT', 'CLOCK IN', 'CLOCK OUT'];
    const rows = reportData.map(row => [
      format(parseISO(row.date), 'yyyy-MM-dd'),
      row.name,
      row.phone,
      row.idNumber,
      row.designation,
      row.rate,
      row.shift,
      row.clockIn,
      row.clockOut
    ]);

    const worksheet = [headers, ...rows];
    let csvContent = '';
    
    worksheet.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = dateFilter !== 'all' ? `casuals-attendance-${dateFilter}.xls` : 'casuals-attendance-all-dates.xls';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Get unique designations from casual attendance
  const uniqueDesignations = useMemo(() => {
    const designations = new Set(attendance
      .filter(att => att.designation)
      .map(att => att.designation as string)
    );
    return Array.from(designations).sort();
  }, [attendance]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Casual Employees Attendance Report</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button size="sm" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            View and export attendance records for casual employees. Filter by date, designation, or shift.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="date-filter">Date</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date-filter">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {uniqueDates.map(date => (
                    <SelectItem key={date} value={date}>
                      {format(parseISO(date), 'PPP')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="designation-filter">Designation</Label>
              <Select value={designationFilter} onValueChange={setDesignationFilter}>
                <SelectTrigger id="designation-filter">
                  <SelectValue placeholder="All Designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {uniqueDesignations.map(designation => (
                    <SelectItem key={designation} value={designation}>
                      {designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shift-filter">Shift</Label>
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger id="shift-filter">
                  <SelectValue placeholder="All Shifts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="Day">Day Shift</SelectItem>
                  <SelectItem value="Night">Night Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Quick Stats</Label>
              <div className="text-sm text-muted-foreground">
                {dateFilter !== 'all' 
                  ? `Showing data for ${format(parseISO(dateFilter), 'PPP')}` 
                  : 'Showing all dates'}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totals.totalEmployees}</div>
                <p className="text-sm text-muted-foreground">Unique Casual Employees</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totals.totalDays}</div>
                <p className="text-sm text-muted-foreground">Total Work Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">KES {totals.totalAmount.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </CardContent>
            </Card>
          </div>

          {/* Report Table */}
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">DATE</TableHead>
                    <TableHead className="font-bold">NAME</TableHead>
                    <TableHead className="font-bold">TELEPHONE NUMBER</TableHead>
                    <TableHead className="font-bold">ID NUMBER</TableHead>
                    <TableHead className="font-bold">DESIGNATION</TableHead>
                    <TableHead className="font-bold">RATE (KES)</TableHead>
                    <TableHead className="font-bold">SHIFT</TableHead>
                    <TableHead className="font-bold">CLOCK IN</TableHead>
                    <TableHead className="font-bold">CLOCK OUT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.length > 0 ? (
                    reportData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {format(parseISO(row.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>{row.idNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.designation}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          KES {row.rate.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.shift === 'Day' ? 'default' : 'secondary'}>
                            {row.shift}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.clockIn}</TableCell>
                        <TableCell>{row.clockOut}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No attendance records found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary Footer */}
          {reportData.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Report Summary</h4>
                  <ul className="text-sm space-y-1">
                    <li>Date Range: {dateFilter !== 'all'
                      ? format(parseISO(dateFilter), 'PPP')
                      : `${format(parseISO(uniqueDates[uniqueDates.length - 1] || new Date().toISOString()), 'PPP')} - ${format(parseISO(uniqueDates[0] || new Date().toISOString()), 'PPP')}`
                    }</li>
                    <li>Designation: {designationFilter === 'all' ? 'All' : designationFilter}</li>
                    <li>Shift: {shiftFilter === 'all' ? 'All' : shiftFilter}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Financial Summary</h4>
                  <ul className="text-sm space-y-1">
                    <li>Total Work Days: {totals.totalDays}</li>
                    <li>Total Employees: {totals.totalEmployees}</li>
                    <li>Average Rate: KES {Math.round(totals.totalAmount / Math.max(totals.totalDays, 1)).toLocaleString()}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Export Options</h4>
                  <p className="text-sm mb-2">Export this report for payroll processing</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportToCSV}>
                      CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportToExcel}>
                      Excel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
        }
      `}</style>
    </div>
  );
}
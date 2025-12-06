'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import {
  shiftData,
  dailyRosterData,
  preShiftChecklistItems,
  payrollDistributionData,
  payrollTrendData,
} from '@/lib/data';
import { sopData } from '@/lib/sop-data';
import type { Employee, TimeAttendance, Shift, EmployeeFormValues, AdvanceRequest, SOP } from '@/lib/data';
import { EmployeeDataTable } from '@/components/dashboard/employee-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { CreateEmployeeForm } from '@/components/dashboard/create-employee-form';
import {
  PlusCircle, Users, CheckCircle, LogOut, TrendingUp, Printer, LogIn, ClipboardCheck, Settings, XCircle, CreditCard, Wallet, HandCoins, Award, UserCheck, ShieldAlert, BookCheck
} from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { useToast } from '@/hooks/use-toast';
import { EmployeeDetailCard } from '@/components/dashboard/employee-detail-card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrintableAttendanceReport } from '@/components/dashboard/printable-attendance-report';
import { EmployeeIdCardDialog } from '@/components/dashboard/employee-id-card-dialog';
import { addYears, format, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { EmployeePerformanceChart } from '@/components/dashboard/employee-performance-chart';
import { employeePerformanceData } from '@/lib/data';
import { EmployeePerformanceOverviewChart } from '@/components/dashboard/employee-performance-overview-chart';
import { AdvanceRequests } from '@/components/dashboard/advance-requests';
import { PayrollTable } from '@/components/dashboard/payroll-table';
import { LaborBreakdown } from '@/components/dashboard/labor-breakdown';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PayrollDistributionChart } from '@/components/dashboard/payroll-distribution-chart';
import { PayrollTrendChart } from '@/components/dashboard/payroll-trend-chart';

const getInitials = (name: string) => (name || '').split(' ').map((n) => n[0]).join('');

const statusInfo = {
  Present: { icon: <CheckCircle className="w-5 h-5 text-green-500" />, variant: 'default' as const },
  Absent: { icon: <XCircle className="w-5 h-5 text-destructive" />, variant: 'destructive' as const },
  'On Leave': { icon: <LogOut className="w-5 h-5 text-muted-foreground" />, variant: 'secondary' as const },
};

// Casual designations
const casualDesignations = [
  'Quality Assurance',
  'Quality Control', 
  'Packer',
  'Porter',
  'Dipping',
  'Palletizing',
  'Loading'
] as const;

type CasualDesignation = typeof casualDesignations[number];

const guardPerformanceData = [
    { name: 'Patrols', score: 28, other: 12 },
    { name: 'Reports', score: 35, other: 15 },
    { name: 'Incidents', score: 10, other: 5 },
    { name: 'Compliance', score: 38, other: 2 },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<TimeAttendance[]>([]);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Full-time' | 'Part-time' | 'Contract'>('All');
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  // Roll Call state
  const [activeTab, setActiveTab] = useState('shift-1');
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [checklistQueue, setChecklistQueue] = useState<Employee[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  
  // Casual attendance state
  const [casualDesignationsMap, setCasualDesignationsMap] = useState<Record<string, CasualDesignation>>({});

  const [logDateFilter, setLogDateFilter] = useState<string>('all');
  const [logShiftFilter, setLogShiftFilter] = useState<string>('all');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  
  const [isClient, setIsClient] = useState(false);
  const [today, setToday] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch employees from database
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        if (data.length > 0) {
          setSelectedEmployee(data[0]);
        }
      } else {
        throw new Error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    setIsClient(true);
    setToday(format(new Date(), 'yyyy-MM-dd'));
  }, [toast]);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch('/api/attendance');
        if (response.ok) {
          const data = await response.json();
          setAttendance(data);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };

    if (isClient) {
      fetchAttendance();
    }
  }, [isClient]);

  const kpiData = useMemo(() => {
    if (!isClient || isLoading) return null;
    const attendanceForToday = (attendance ?? []).filter(att => att.date === today);
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const totalPayroll = (employees ?? []).reduce((acc, emp) => {
        if (emp.contract === 'Full-time' || emp.contract === 'Part-time') return acc + (emp.salary || 0);
        return acc;
    }, 0);
    const advancesPaid = (advanceRequests ?? []).filter(req => req.status === 'Paid' || req.status === 'Approved').reduce((acc, req) => acc + req.amount, 0);

    return {
      totalEmployees: {
        title: 'Active Employees',
        value: String((employees ?? []).filter(e => e.status === 'active').length),
        change: 'on payroll',
        changeType: 'increase' as const,
      },
      presentToday: {
        title: 'Present Today',
        value: String(attendanceForToday.filter(a => a.status === 'Present').length),
        change: `as of ${currentTime}`,
        changeType: 'increase' as const,
      },
      onLeave: {
        title: 'On Leave',
        value: String(attendanceForToday.filter(a => a.status === 'On Leave').length),
        change: 'scheduled today',
        changeType: 'decrease' as const,
      },
       turnover: {
        title: 'Employee Turnover',
        value: '4.5%',
        change: 'Quarterly Rate',
        changeType: 'increase' as const,
      },
       totalPayroll: {
        title: 'Total Payroll (July)',
        value: `KES ${totalPayroll.toLocaleString()}`,
        change: 'for salaried employees',
        changeType: 'increase' as const,
      },
      advancesPaid: {
        title: 'Advances Paid (Month)',
        value: `KES ${advancesPaid.toLocaleString()}`,
        change: 'across all employees',
        changeType: 'increase' as const,
      },
      netPay: {
        title: 'Estimated Net Pay',
        value: `KES ${(totalPayroll - advancesPaid).toLocaleString()}`,
        change: 'after deductions',
        changeType: 'increase' as const,
      },
      topPerformer: {
        title: 'Top Performer',
        value: 'John Omondi',
        change: '98% rating',
        changeType: 'increase' as const,
      },
      attendanceRate: {
        title: 'Attendance Rate',
        value: '96%',
        change: 'This month',
        changeType: 'increase' as const,
      },
    };
  }, [isClient, today, employees, attendance, advanceRequests, isLoading]);

  const todaysAttendance = useMemo(() => (attendance ?? []).filter(att => att.date === today), [attendance, today]);

  const rosterForShift = useMemo(() => {
    if (!today || !employees) return [];
    if (activeTab === 'casuals') {
      return (employees ?? []).filter(e => e.contract === 'Contract');
    }
    const rosterForShiftData = dailyRosterData.find((r) => r.date === today && r.shiftId === activeTab);
    return rosterForShiftData
      ? (employees ?? []).filter((e) => rosterForShiftData.employeeIds.includes(e.id))
      : [];
  }, [activeTab, today, employees]);
  
  const absentEmployeesOnShift = useMemo(() => {
    return rosterForShift.filter(emp => !todaysAttendance.some(att => att.employeeId === emp.id && att.status === 'Present'));
  }, [rosterForShift, todaysAttendance]);

  const isEditDialogOpen = !!editingEmployee;

  const handleAddEmployee = async (newEmployeeData: EmployeeFormValues) => {
    try {
      console.log('🔄 Sending POST request to /api/employees with:', newEmployeeData);
      
      // Transform data to match database schema
      const apiData = {
        name: newEmployeeData.name || '',
        email: '', // Default empty email
        role: newEmployeeData.role || 'Driver',
        status: 'active',
        performance: 'Meets_Expectations',
        rating: 3,
        contract: newEmployeeData.contract === 'Full-time' ? 'Full_time' : 
                 newEmployeeData.contract === 'Part-time' ? 'Part_time' : 'Contract',
        salary: '0',
        image: '',
        id_number: newEmployeeData.idNumber || '',
        phone: newEmployeeData.phone || '',
        issue_date: null,
        expiry_date: null,
        company: '',
        // Additional fields from the form
        timeIn: newEmployeeData.timeIn || '',
        timeOut: newEmployeeData.timeOut || '',
        shift: newEmployeeData.shift || 'Day',
        date: newEmployeeData.date || format(new Date(), 'yyyy-MM-dd'),
      };

      console.log('📤 Transformed API data:', apiData);

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const responseData = await response.json();
      console.log('📥 API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to create employee');
      }

      // Refresh employees list
      await fetch('/api/employees').then(async (res) => {
        if (res.ok) {
          const updatedEmployees = await res.json();
          setEmployees(updatedEmployees);
          if (updatedEmployees.length > 0) {
            setSelectedEmployee(updatedEmployees[0]);
          }
        }
      });

      toast({
        title: 'Employee Created',
        description: `${newEmployeeData.name} has been successfully added.`,
      });
      
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('❌ Error creating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee',
        variant: 'destructive',
      });
      // Re-throw to let form handle it
      throw error;
    }
  };

  const handleUpdateEmployee = async (updatedEmployeeData: EmployeeFormValues) => {
    if (!editingEmployee) return;
    
    try {
      console.log('🔄 Sending PUT request to /api/employees with:', updatedEmployeeData);
      
      // Transform data to match database schema
      const apiData = {
        name: updatedEmployeeData.name || editingEmployee.name,
        email: editingEmployee.email || '',
        role: updatedEmployeeData.role || editingEmployee.role,
        status: editingEmployee.status || 'active',
        performance: editingEmployee.performance || 'Meets_Expectations',
        rating: editingEmployee.rating || 3,
        contract: updatedEmployeeData.contract === 'Full-time' ? 'Full_time' : 
                 updatedEmployeeData.contract === 'Part-time' ? 'Part_time' : 'Contract',
        salary: editingEmployee.salary?.toString() || '0',
        image: editingEmployee.image || '',
        id_number: updatedEmployeeData.idNumber || editingEmployee.idNumber || '',
        phone: updatedEmployeeData.phone || editingEmployee.phone || '',
        issue_date: editingEmployee.issueDate ? new Date(editingEmployee.issueDate).toISOString() : null,
        expiry_date: editingEmployee.expiryDate ? new Date(editingEmployee.expiryDate).toISOString() : null,
        company: editingEmployee.company || '',
        // Additional fields from the form
        timeIn: updatedEmployeeData.timeIn || editingEmployee.timeIn || '',
        timeOut: updatedEmployeeData.timeOut || editingEmployee.timeOut || '',
        shift: updatedEmployeeData.shift || editingEmployee.shift || 'Day',
        date: updatedEmployeeData.date || editingEmployee.date || format(new Date(), 'yyyy-MM-dd'),
      };

      console.log('📤 Transformed API data:', apiData);

      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const responseData = await response.json();
      console.log('📥 API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update employee');
      }

      // Refresh employees list
      await fetch('/api/employees').then(async (res) => {
        if (res.ok) {
          const updatedEmployees = await res.json();
          setEmployees(updatedEmployees);
          // Update selected employee if it's the one being edited
          const updatedEmployee = updatedEmployees.find((e: Employee) => e.id === editingEmployee.id);
          if (updatedEmployee) {
            setSelectedEmployee(updatedEmployee);
          }
        }
      });

      toast({
        title: 'Employee Updated',
        description: `${updatedEmployeeData.name} has been successfully updated.`,
      });
      
      setEditingEmployee(null);
    } catch (error: any) {
      console.error('❌ Error updating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update employee',
        variant: 'destructive',
      });
      // Re-throw to let form handle it
      throw error;
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleAction = (action: string, employeeName: string) => {
    toast({
      title: `Action: ${action}`,
      description: `Action '${action}' has been logged for ${employeeName}.`,
    });
  };

  const handlePrintReport = () => {
    const printableElement = document.querySelector('.printable-attendance-report');
    if (printableElement) {
      document.body.classList.add('printing-active');
      window.print();
      document.body.classList.remove('printing-active');
    }
  };

  const filteredEmployees = useMemo(() => {
    return (employees ?? []).filter(employee => {
        if (activeFilter === 'All') return true;
        return employee.contract === activeFilter;
    });
  }, [employees, activeFilter]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedForBatch([]);
  };

  const handleMarkAbsent = (employeeId: string) => {
    if (!today) return;
    setAttendance(prev => {
      const existingIndex = prev.findIndex(a => a.employeeId === employeeId && a.date === today);
      if (existingIndex > -1) {
        const newAttendance = [...prev];
        newAttendance[existingIndex] = { ...newAttendance[existingIndex], status: 'Absent', clockInTime: undefined, clockOutTime: undefined, date: today };
        return newAttendance;
      }
      return [...prev, { employeeId, status: 'Absent', date: today }];
    });
    toast({
      title: 'Marked Absent',
      description: `${(employees ?? []).find(e => e.id === employeeId)?.name} has been marked as absent.`,
      variant: 'destructive',
    });
  };

  const handleCheckIn = (employeeId: string, designation?: CasualDesignation) => {
    if (!today) return;
    
    setAttendance(prev => {
      const existingIndex = prev.findIndex(a => a.employeeId === employeeId && a.date === today);
      if (existingIndex > -1) {
        const newAttendance = [...prev];
        newAttendance[existingIndex] = { 
          ...newAttendance[existingIndex], 
          status: 'Present', 
          clockInTime: new Date().toISOString(), 
          date: today,
          designation: designation || undefined
        };
        return newAttendance;
      }
      return [...prev, { 
        employeeId, 
        status: 'Present', 
        date: today, 
        clockInTime: new Date().toISOString(),
        designation: designation || undefined
      }];
    });
    
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      const message = designation 
        ? `${employee.name} has been checked in as ${designation}.`
        : `${employee.name} has been checked in.`;
      
      toast({
        title: 'Checked In',
        description: message,
      });
    }
  };
  
  const handleCheckOut = (employeeId: string) => {
    if (!today) return;
    setAttendance(prev => prev.map(a => a.employeeId === employeeId && a.date === today ? { ...a, status: 'Present', clockOutTime: new Date().toISOString() } : a));
    toast({
      title: 'Checked Out',
      description: `${(employees ?? []).find(e => e.id === employeeId)?.name} has been checked out.`,
    });
  };

  const startBatchCheckIn = () => {
    const employeesToProcess = rosterForShift.filter(e => selectedForBatch.includes(e.id));
    if (employeesToProcess.length > 0) {
      setChecklistQueue(employeesToProcess);
      setIsChecklistOpen(true);
    }
  };

  const handleConfirmCheckIn = () => {
    const currentEmployee = checklistQueue[0];
    if (currentEmployee) {
      const employeeId = currentEmployee.id;
      handleCheckIn(employeeId);
      const nextQueue = checklistQueue.slice(1);
      setChecklistQueue(nextQueue);
      setCheckedItems({});
      setSelectedForBatch(prev => prev.filter(id => id !== employeeId));
      if (nextQueue.length === 0) {
        setIsChecklistOpen(false);
      }
    }
  };

  const handleSelect = (employeeId: string, isSelected: boolean) => {
    setSelectedForBatch(prev =>
      isSelected ? [...prev, employeeId] : prev.filter(id => id !== employeeId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedForBatch(checked ? absentEmployeesOnShift.map(e => e.id) : []);
  };

  const allChecked = preShiftChecklistItems.every((item) => checkedItems[item.id]);
  const currentChecklistEmployee = checklistQueue[0];

  const uniqueLogDates = useMemo(() => {
    const dates = new Set((attendance ?? []).map(att => att.date));
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [attendance]);

  const filteredLogData = useMemo(() => {
    return (attendance ?? []).filter(att => {
      if (logDateFilter !== 'all' && att.date !== logDateFilter) return false;
      if (logStatusFilter !== 'all' && att.status !== logStatusFilter) return false;
      if (logShiftFilter === 'all') return true;
      const emp = (employees ?? []).find(e => e.id === att.employeeId);
      if (!emp) return false;
      if (logShiftFilter === 'casuals') return emp.contract === 'Contract';
      const rosterEntry = dailyRosterData.find(r => r.date === att.date && r.employeeIds.includes(att.employeeId));
      return rosterEntry?.shiftId === logShiftFilter;
    });
  }, [attendance, logDateFilter, logShiftFilter, logStatusFilter, employees]);
  
  const handleAdvanceAction = (requestId: string, action: 'approve' | 'reject' | 'pay') => {
    const request = advanceRequests.find(r => r.id === requestId);
    if (!request) return;

    if (action === 'pay') {
        toast({
            title: 'M-Pesa Payment Initiated',
            description: `Sending KES ${request.amount} to ${(employees ?? []).find(e=>e.id === request.employeeId)?.name}. You will receive an SMS confirmation.`,
        });
        setAdvanceRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Paid' } : r));
    } else {
        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
        setAdvanceRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
        toast({
            title: `Request ${newStatus}`,
            description: `Advance request for KES ${request.amount} has been ${newStatus.toLowerCase()}.`,
        });
    }
  };
  
  const handleSubmitForApproval = (employeeIds: string[], totalAmount: number) => {
     toast({
        title: 'Payroll Submitted for Approval',
        description: `Payroll for ${employeeIds.length} employees (Total: KES ${totalAmount.toLocaleString()}) has been sent to the CEO for approval.`,
    });
  };

  // Handle casual designation selection
  const handleCasualDesignationChange = (employeeId: string, designation: CasualDesignation) => {
    setCasualDesignationsMap(prev => ({
      ...prev,
      [employeeId]: designation
    }));
  };

  // Casual Check-in dialog state
  const [selectedCasualForCheckIn, setSelectedCasualForCheckIn] = useState<Employee | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<CasualDesignation>('Quality Assurance');

  const openCasualCheckInDialog = (employee: Employee) => {
    setSelectedCasualForCheckIn(employee);
    // Set default designation from map or default
    setSelectedDesignation(casualDesignationsMap[employee.id] || 'Quality Assurance');
  };

  const handleCasualCheckIn = () => {
    if (!selectedCasualForCheckIn || !today) return;
    
    const employeeId = selectedCasualForCheckIn.id;
    handleCheckIn(employeeId, selectedDesignation);
    
    // Store the designation for this employee
    setCasualDesignationsMap(prev => ({
      ...prev,
      [employeeId]: selectedDesignation
    }));
    
    setSelectedCasualForCheckIn(null);
  };
  
  if (!isClient || isLoading) {
    return (
        <SidebarProvider>
            <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                <FreshViewLogo className="w-8 h-8 text-primary" />
                <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                    FreshTrace
                </h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarNav />
            </SidebarContent>
            </Sidebar>
            <SidebarInset>
            <Header />
            <main className="p-4 md:p-6 lg:p-8 space-y-6">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-[98px] w-full" />
                    <Skeleton className="h-[98px] w-full" />
                    <Skeleton className="h-[98px] w-full" />
                    <Skeleton className="h-[98px] w-full" />
                </div>
                 <Skeleton className="h-[500px] w-full" />
            </main>
            </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshViewLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                FreshTrace
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Employee Management
                </h2>
                <p className="text-muted-foreground">
                  View, add, and manage employee records, attendance, and performance.
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Employee</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to add a new employee to the system.
                      </DialogDescription>
                    </DialogHeader>
                    <CreateEmployeeForm onCreate={handleAddEmployee} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="roll-call">Roll Call</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="sop-compliance">SOP Compliance</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
                <TabsTrigger value="report">Report</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {!kpiData ? (
                      <>
                        <Skeleton className="h-[98px]" />
                        <Skeleton className="h-[98px]" />
                        <Skeleton className="h-[98px]" />
                        <Skeleton className="h-[98px]" />
                      </>
                    ) : (
                      <>
                        <OverviewCard data={kpiData.totalEmployees} icon={Users} />
                        <OverviewCard data={kpiData.presentToday} icon={CheckCircle} />
                        <OverviewCard data={kpiData.onLeave} icon={LogOut} />
                        <Link href="?tab=performance" className="block transition-transform hover:scale-[1.02]">
                            <OverviewCard data={kpiData.turnover} icon={TrendingUp} />
                        </Link>
                      </>
                    )}
                </div>
                <div className="mb-4">
                  <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
                    <TabsList>
                      <TabsTrigger value="All">All ({employees.length})</TabsTrigger>
                      <TabsTrigger value="Full-time">Full-time ({employees.filter(e => e.contract === 'Full-time').length})</TabsTrigger>
                      <TabsTrigger value="Part-time">Part-time ({employees.filter(e => e.contract === 'Part-time').length})</TabsTrigger>
                      <TabsTrigger value="Contract">Casuals ({employees.filter(e => e.contract === 'Contract').length})</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <EmployeeDataTable employees={filteredEmployees} onSelectEmployee={setSelectedEmployee} selectedEmployeeId={selectedEmployee?.id} />
                  </div>
                  <div className="lg:col-span-2">
                    {selectedEmployee ? (
                      <EmployeeDetailCard
                        employee={selectedEmployee}
                        onEdit={() => openEditDialog(selectedEmployee)}
                        onAction={(action) => handleAction(action, selectedEmployee.name)}
                        onPrintId={() => {
                          setSelectedEmployee(selectedEmployee);
                          setIsIdCardOpen(true);
                        }}
                        attendance={attendance.filter(a => a.employeeId === selectedEmployee.id)}
                        onCheckIn={handleCheckIn}
                        onCheckOut={handleCheckOut}
                      />
                    ) : (
                      <Card className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Select an employee to see details</p>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="roll-call" className="mt-6">
                 <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList>
                        {shiftData.map(shift => (
                            <TabsTrigger key={shift.id} value={shift.id}>{shift.name}</TabsTrigger>
                        ))}
                        <TabsTrigger value="casuals">Casuals</TabsTrigger>
                        <TabsTrigger value="log">Attendance Log</TabsTrigger>
                    </TabsList>
                    
                    {shiftData.map(shift => (
                        <TabsContent key={shift.id} value={shift.id} className="mt-4">
                            <Card>
                                <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{shift.name} Roster ({rosterForShift.length} employees)</span>
                                    <div className="flex items-center gap-2">
                                    <Checkbox
                                        id={`select-all-${shift.id}`}
                                        checked={selectedForBatch.length > 0 && selectedForBatch.length === absentEmployeesOnShift.length}
                                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                        disabled={absentEmployeesOnShift.length === 0}
                                    />
                                    <Label htmlFor={`select-all-${shift.id}`}>Select All Absent ({absentEmployeesOnShift.length})</Label>
                                    <Button onClick={startBatchCheckIn} disabled={selectedForBatch.length === 0}>
                                        <LogIn className="mr-2" />
                                        Batch Check-in ({selectedForBatch.length})
                                    </Button>
                                    </div>
                                </CardTitle>
                                </CardHeader>
                                <CardContent>
                                <ScrollArea className="h-[calc(100vh-28rem)]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {rosterForShift.map((emp) => {
                                        const att = todaysAttendance.find((a) => a.employeeId === emp.id);
                                        const isPresent = att?.status === 'Present';

                                        return (
                                            <Card key={emp.id} className={cn('overflow-hidden', isPresent && 'bg-primary/10')}>
                                                <CardHeader className="p-4 flex flex-row items-center gap-4">
                                                {!isPresent && (
                                                    <Checkbox
                                                    checked={selectedForBatch.includes(emp.id)}
                                                    onCheckedChange={(checked) => handleSelect(emp.id, Boolean(checked))}
                                                    aria-label={`Select ${emp.name}`}
                                                    />
                                                )}
                                                <Avatar>
                                                        <AvatarImage src={emp.image} />
                                                        <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{emp.name}</p>
                                                        <p className="text-sm text-muted-foreground">{emp.role}</p>
                                                    </div>
                                                </CardHeader>
                                                <CardFooter className="p-2 bg-muted/50 grid grid-cols-2 gap-2">
                                                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {setChecklistQueue([emp]); setIsChecklistOpen(true);}} disabled={isPresent} >
                                                        <CheckCircle className="mr-2" /> Present
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleMarkAbsent(emp.id)} disabled={isPresent} >
                                                        <XCircle className="mr-2" /> Absent
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                    </div>
                                </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                    
                    {/* Casuals Tab Content */}
                    <TabsContent key="casuals" value="casuals" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Casuals - {rosterForShift.length} employees</span>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => {
                                            // Batch check-in for all casuals
                                            const casualsToProcess = rosterForShift.filter(e => !todaysAttendance.some(a => a.employeeId === e.id && a.status === 'Present'));
                                            if (casualsToProcess.length > 0) {
                                                setChecklistQueue(casualsToProcess);
                                                setIsChecklistOpen(true);
                                            }
                                        }} disabled={rosterForShift.length === 0}>
                                            <LogIn className="mr-2" />
                                            Batch Check-in ({rosterForShift.filter(e => !todaysAttendance.some(a => a.employeeId === e.id && a.status === 'Present')).length})
                                        </Button>
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    Casual employees - Select designation before check-in
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[calc(100vh-28rem)]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {rosterForShift.map((emp) => {
                                        const att = todaysAttendance.find((a) => a.employeeId === emp.id);
                                        const isPresent = att?.status === 'Present';
                                        const currentDesignation = casualDesignationsMap[emp.id] || att?.designation;

                                        return (
                                            <Card key={emp.id} className={cn('overflow-hidden', isPresent && 'bg-primary/10')}>
                                                <CardHeader className="p-4 flex flex-row items-center gap-4">
                                                    <Avatar>
                                                        <AvatarImage src={emp.image} />
                                                        <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{emp.name}</p>
                                                        <p className="text-sm text-muted-foreground">{emp.role}</p>
                                                        {currentDesignation && (
                                                            <Badge variant="outline" className="mt-1">
                                                                {currentDesignation}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardFooter className="p-3 bg-muted/50 flex flex-col gap-2">
                                                    {!isPresent ? (
                                                        <>
                                                            <div className="w-full">
                                                                <Select 
                                                                    value={casualDesignationsMap[emp.id] || 'Quality Assurance'}
                                                                    onValueChange={(value) => handleCasualDesignationChange(emp.id, value as CasualDesignation)}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Select designation" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {casualDesignations.map(designation => (
                                                                            <SelectItem key={designation} value={designation}>
                                                                                {designation}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 w-full">
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="default" 
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => {
                                                                        const designation = casualDesignationsMap[emp.id] || 'Quality Assurance';
                                                                        handleCheckIn(emp.id, designation);
                                                                    }}
                                                                >
                                                                    <CheckCircle className="mr-2" /> Check-in
                                                                </Button>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="destructive" 
                                                                    onClick={() => handleMarkAbsent(emp.id)}
                                                                >
                                                                    <XCircle className="mr-2" /> Absent
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full">
                                                            <div className="flex items-center justify-between">
                                                                <Badge variant="default" className="mr-2">
                                                                    Present
                                                                </Badge>
                                                                {att.designation && (
                                                                    <Badge variant="secondary">
                                                                        {att.designation}
                                                                    </Badge>
                                                                )}
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    onClick={() => handleCheckOut(emp.id)}
                                                                    className="ml-2"
                                                                >
                                                                    Check-out
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent key="log" value="log" className="mt-4 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendance Log & Filters</CardTitle>
                                <CardDescription>Review historical attendance data.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Select value={logDateFilter} onValueChange={setLogDateFilter}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Dates</SelectItem>
                                            {uniqueLogDates.map(date => <SelectItem key={date} value={date}>{format(parseISO(date), 'PPP')}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Shift</Label>
                                    <Select value={logShiftFilter} onValueChange={setLogShiftFilter}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Shifts</SelectItem>
                                            {shiftData.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            <SelectItem value="casuals">Casuals</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {Object.keys(statusInfo).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Clock In</TableHead>
                                <TableHead>Clock Out</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogData.map((att, i) => {
                                const emp = employees.find(e => e.id === att.employeeId);
                                return (
                                    <TableRow key={`${att.employeeId}-${att.date}-${i}`}>
                                    <TableCell>{emp?.name}</TableCell>
                                    <TableCell>{format(parseISO(att.date), 'PPP')}</TableCell>
                                    <TableCell>{att.clockInTime ? format(parseISO(att.clockInTime), 'p') : 'N/A'}</TableCell>
                                    <TableCell>{att.clockOutTime ? format(parseISO(att.clockOutTime), 'p') : 'N/A'}</TableCell>
                                    <TableCell>{att.designation || 'N/A'}</TableCell>
                                    <TableCell><Badge variant={statusInfo[att.status].variant}>{att.status}</Badge></TableCell>
                                    </TableRow>
                                )
                                })}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="performance" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {kpiData && <>
                    <OverviewCard data={kpiData.topPerformer} icon={Award} />
                    <OverviewCard data={kpiData.attendanceRate} icon={UserCheck} />
                    <OverviewCard data={kpiData.turnover} icon={ShieldAlert} />
                  </>}
                </div>
                <EmployeePerformanceChart data={employeePerformanceData} />
              </TabsContent>

              <TabsContent value="sop-compliance" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookCheck />
                            SOP Compliance Matrix
                        </CardTitle>
                        <CardDescription>
                            Track which employees have read and acknowledged company SOPs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-22rem)]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-card">
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        {sopData.map(sop => (
                                            <TableHead key={sop.id} className="text-center">{sop.title.split(':')[0]}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map(emp => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-medium">{emp.name}</TableCell>
                                            {sopData.map(sop => {
                                                const hasRead = sop.readBy.includes(emp.id);
                                                return (
                                                    <TableCell key={`${emp.id}-${sop.id}`} className="text-center">
                                                        <Badge variant={hasRead ? 'default' : 'secondary'}>
                                                            {hasRead ? 'Read' : 'Pending'}
                                                        </Badge>
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payroll" className="mt-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {kpiData && <>
                        <OverviewCard data={kpiData.totalPayroll} icon={Wallet} />
                        <OverviewCard data={kpiData.advancesPaid} icon={HandCoins} />
                        <OverviewCard data={kpiData.netPay} icon={Wallet} />
                    </>}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <AdvanceRequests requests={advanceRequests} onAction={handleAdvanceAction} />
                    </div>
                    <div className="lg:col-span-2">
                        <PayrollTable employees={employees} onSubmitForApproval={handleSubmitForApproval} />
                    </div>
                </div>
                <LaborBreakdown />
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">
                        Payroll Analytics
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2">
                            <PayrollDistributionChart data={payrollDistributionData} />
                        </div>
                        <div className="lg:col-span-3">
                            <PayrollTrendChart data={payrollTrendData} />
                        </div>
                    </div>
                </div>
              </TabsContent>
               <TabsContent value="report" className="mt-6 space-y-6">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handlePrintReport}>
                    <Printer className="mr-2" />
                    Print Full Report
                  </Button>
                </div>
                <div className="printable-attendance-report-container border rounded-lg" ref={printRef}>
                  <PrintableAttendanceReport employees={employees} attendance={attendance} />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>

        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && setEditingEmployee(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update the details for {editingEmployee?.name}.
              </DialogDescription>
            </DialogHeader>
            <CreateEmployeeForm employee={editingEmployee} onUpdate={handleUpdateEmployee} />
          </DialogContent>
        </Dialog>

        {selectedEmployee && (
          <EmployeeIdCardDialog isOpen={isIdCardOpen} onOpenChange={setIsIdCardOpen} employee={selectedEmployee} onEdit={() => { setIsIdCardOpen(false); setEditingEmployee(selectedEmployee); }} />
        )}
        
         <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardCheck />
                            Pre-Shift Check: {currentChecklistEmployee?.name}
                        </DialogTitle>
                        <Button variant="outline" size="sm" onClick={() => router.push('/settings/workflows/pre-shift-checklist')}>
                            <Settings className="mr-2" />
                            Edit Checklist
                        </Button>
                    </div>
                    <DialogDescription>
                        Confirm all safety checks are complete. ({checklistQueue.length} employees remaining in batch)
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {preShiftChecklistItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`checklist-${item.id}`}
                                checked={!!checkedItems[item.id]}
                                onCheckedChange={(checked) => {
                                    setCheckedItems(prev => ({ ...prev, [item.id]: !!checked }));
                                }}
                            />
                            <Label htmlFor={`checklist-${item.id}`} className="text-sm font-medium">
                                {item.label}
                            </Label>
                        </div>
                    ))}
                </div>
                <DialogFooter className="justify-between">
                    <Button variant="ghost" onClick={() => setIsChecklistOpen(false)}>Cancel</Button>
                    <div className="flex gap-2">
                        <Button onClick={handleConfirmCheckIn} disabled={!allChecked}>
                            Confirm & Check-in
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Casual Check-in Dialog */}
        <Dialog open={!!selectedCasualForCheckIn} onOpenChange={(open) => !open && setSelectedCasualForCheckIn(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="text-green-500" />
                        Check-in Casual Employee
                    </DialogTitle>
                    <DialogDescription>
                        Select designation for {selectedCasualForCheckIn?.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="designation">Designation</Label>
                        <Select 
                            value={selectedDesignation} 
                            onValueChange={(value) => setSelectedDesignation(value as CasualDesignation)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select designation" />
                            </SelectTrigger>
                            <SelectContent>
                                {casualDesignations.map(designation => (
                                    <SelectItem key={designation} value={designation}>
                                        {designation}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setSelectedCasualForCheckIn(null)}>Cancel</Button>
                    <Button onClick={handleCasualCheckIn}>Confirm Check-in</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </SidebarProvider>
    </>
  );
}
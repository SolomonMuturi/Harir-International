'use client';

import { useState, useMemo, useEffect } from 'react';
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
  PlusCircle, Users, CheckCircle, LogOut, TrendingUp, Printer, LogIn,
  Settings, XCircle, Clock, ChevronDown, ChevronUp, Calendar,
  AlertCircle, Search, RefreshCw, Eye, Edit, Trash2, User, Briefcase,
  Phone, Mail, Building, BadgeCheck, Award, DollarSign, CalendarDays,
  Shield, FileText, Download, Filter, MoreVertical
} from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { useToast } from '@/hooks/use-toast';
import { EmployeeDetailCard } from '@/components/dashboard/employee-detail-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format, parseISO, isToday, isAfter, isBefore, differenceInHours } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

// Types
interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  performance?: string;
  rating?: number;
  contract: 'Full-time' | 'Part-time' | 'Contract';
  salary?: string;
  image?: string;
  id_number?: string;
  phone?: string;
  issue_date?: string;
  expiry_date?: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Early Departure';
  clockInTime?: string;
  clockOutTime?: string;
  designation?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

interface EmployeeFormValues {
  name: string;
  email: string;
  role: string;
  contract: 'Full-time' | 'Part-time' | 'Contract';
  idNumber: string;
  phone: string;
  status: string;
  performance?: string;
  rating?: number;
  salary?: string;
  image?: string;
  issueDate?: string;
  expiryDate?: string;
  company?: string;
}

const getInitials = (name: string) => (name || '').split(' ').map((n) => n[0]).join('').toUpperCase();

const statusInfo = {
  Present: { 
    color: 'bg-green-100 text-green-800 border-green-300', 
    icon: CheckCircle,
    variant: 'default' as const
  },
  Absent: { 
    color: 'bg-red-100 text-red-800 border-red-300', 
    icon: XCircle,
    variant: 'destructive' as const
  },
  Late: { 
    color: 'bg-amber-100 text-amber-800 border-amber-300', 
    icon: AlertCircle,
    variant: 'secondary' as const
  },
  'On Leave': { 
    color: 'bg-blue-100 text-blue-800 border-blue-300', 
    icon: Calendar,
    variant: 'secondary' as const
  },
  'Early Departure': { 
    color: 'bg-purple-100 text-purple-800 border-purple-300', 
    icon: LogOut,
    variant: 'secondary' as const
  },
};

// Shift data - only Day and Night shifts
const shiftData = [
  { id: 'day-shift', name: 'Day Shift', timeRange: '06:00 - 18:00', startHour: 6, endHour: 18 },
  { id: 'night-shift', name: 'Night Shift', timeRange: '18:00 - 06:00', startHour: 18, endHour: 6 }
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Full-time' | 'Part-time' | 'Contract'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  // Roll Call state
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedShifts, setExpandedShifts] = useState<Record<string, boolean>>({
    'day-shift': true,
    'night-shift': true
  });
  
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch employees and attendance
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      console.log('🔄 Fetching employees...');
      
      // Fetch employees
      const employeesResponse = await fetch('/api/employees');
      
      if (!employeesResponse.ok) {
        const errorData = await employeesResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch employees: ${employeesResponse.status}`);
      }
      
      const employeesData = await employeesResponse.json();
      console.log(`✅ Loaded ${employeesData.length} employees`);
      setEmployees(employeesData);
      
      if (employeesData.length > 0 && !selectedEmployee) {
        setSelectedEmployee(employeesData[0]);
      }
      
      // Fetch today's attendance
      const todayDate = format(new Date(), 'yyyy-MM-dd');
      console.log('🔄 Fetching attendance for:', todayDate);
      
      try {
        const attendanceResponse = await fetch(`/api/attendance?date=${todayDate}`);
        
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          console.log(`✅ Loaded ${attendanceData.length} attendance records`);
          setAttendance(attendanceData);
        } else {
          console.warn('⚠️ Could not fetch attendance:', attendanceResponse.status);
        }
      } catch (attendanceError) {
        console.warn('⚠️ Attendance fetch failed:', attendanceError);
        // Continue without attendance data
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      
      const errorMessage = error.message || 'Failed to load employee data';
      setFetchError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Set empty arrays to prevent further errors
      setEmployees([]);
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setIsClient(true);
    setToday(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // Handle refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      toast({
        title: 'Data Refreshed',
        description: 'Latest data has been loaded.',
      });
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Organize employees by shift
  const shiftEmployees = useMemo(() => {
    const dayShift: Employee[] = [];
    const nightShift: Employee[] = [];
    
    employees.forEach(employee => {
      // Simple assignment: Full-time = Day shift, Part-time/Contract = Night shift
      if (employee.contract === 'Full-time') {
        dayShift.push(employee);
      } else {
        nightShift.push(employee);
      }
    });
    
    return {
      'day-shift': dayShift,
      'night-shift': nightShift
    };
  }, [employees]);

  // Calculate shift statistics
  const shiftStats = useMemo(() => {
    const dayShiftAttendance = shiftEmployees['day-shift'].map(emp => {
      const att = attendance.find(a => a.employeeId === emp.id && a.date === today);
      return {
        employee: emp,
        attendance: att,
        isPresent: att?.status === 'Present',
        isCheckedOut: !!att?.clockOutTime,
        isLate: att?.status === 'Late',
        isAbsent: att?.status === 'Absent',
        isOnLeave: att?.status === 'On Leave'
      };
    });
    
    const nightShiftAttendance = shiftEmployees['night-shift'].map(emp => {
      const att = attendance.find(a => a.employeeId === emp.id && a.date === today);
      return {
        employee: emp,
        attendance: att,
        isPresent: att?.status === 'Present',
        isCheckedOut: !!att?.clockOutTime,
        isLate: att?.status === 'Late',
        isAbsent: att?.status === 'Absent',
        isOnLeave: att?.status === 'On Leave'
      };
    });

    return {
      dayShift: {
        total: dayShiftAttendance.length,
        present: dayShiftAttendance.filter(e => e.isPresent && !e.isCheckedOut).length,
        checkedOut: dayShiftAttendance.filter(e => e.isCheckedOut).length,
        absent: dayShiftAttendance.filter(e => e.isAbsent).length,
        late: dayShiftAttendance.filter(e => e.isLate).length,
        onLeave: dayShiftAttendance.filter(e => e.isOnLeave).length
      },
      nightShift: {
        total: nightShiftAttendance.length,
        present: nightShiftAttendance.filter(e => e.isPresent && !e.isCheckedOut).length,
        checkedOut: nightShiftAttendance.filter(e => e.isCheckedOut).length,
        absent: nightShiftAttendance.filter(e => e.isAbsent).length,
        late: nightShiftAttendance.filter(e => e.isLate).length,
        onLeave: nightShiftAttendance.filter(e => e.isOnLeave).length
      },
      overall: {
        totalEmployees: employees.length,
        presentToday: attendance.filter(a => a.status === 'Present' && !a.clockOutTime).length,
        checkedOutToday: attendance.filter(a => a.clockOutTime).length,
        absentToday: attendance.filter(a => a.status === 'Absent').length,
        onLeave: attendance.filter(a => a.status === 'On Leave').length,
        lateToday: attendance.filter(a => a.status === 'Late').length
      }
    };
  }, [shiftEmployees, attendance, employees, today]);

  // Calculate KPI data
  const kpiData = useMemo(() => {
    if (!isClient || isLoading) return null;
    
    const attendanceRate = employees.length > 0 
      ? Math.round((shiftStats.overall.presentToday / employees.length) * 100)
      : 0;
    
    return {
      totalEmployees: {
        title: 'Total Employees',
        value: String(employees.length),
        change: `${shiftStats.overall.presentToday} present today`,
        changeType: 'increase' as const,
      },
      presentToday: {
        title: 'Present Today',
        value: String(shiftStats.overall.presentToday),
        change: `as of ${format(currentTime, 'HH:mm')}`,
        changeType: 'increase' as const,
      },
      onLeave: {
        title: 'On Leave',
        value: String(shiftStats.overall.onLeave),
        change: 'scheduled today',
        changeType: 'decrease' as const,
      },
      attendanceRate: {
        title: 'Attendance Rate',
        value: `${attendanceRate}%`,
        change: 'Today',
        changeType: attendanceRate > 85 ? 'increase' : 'decrease' as const,
      },
    };
  }, [isClient, isLoading, employees, shiftStats, currentTime]);

  // Handle check-in (persists to database)
  const handleCheckIn = async (employeeId: string, isLate: boolean = false) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee not found',
          variant: 'destructive',
        });
        return;
      }

      const checkInTime = new Date().toISOString();
      const status = isLate ? 'Late' : 'Present';
      
      console.log('🔄 Checking in employee:', {
        employeeId,
        employeeName: employee.name,
        date: today,
        status,
        checkInTime
      });
      
      // Save to database via API
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          date: today,
          status,
          clockInTime: checkInTime
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error:', responseData);
        let errorMessage = 'Failed to save check-in';
        if (responseData.error) {
          errorMessage = responseData.error;
          if (responseData.details) {
            errorMessage += `: ${responseData.details}`;
          }
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Check-in successful:', responseData);
      
      // Update local state immediately
      const newAttendance: Attendance = {
        id: responseData.id,
        employeeId,
        date: today,
        status,
        clockInTime: checkInTime,
        createdAt: responseData.createdAt || new Date().toISOString(),
        updatedAt: responseData.updatedAt || new Date().toISOString(),
        employee
      };
      
      // Update attendance state
      setAttendance(prev => {
        // Remove any existing attendance for this employee today
        const filtered = prev.filter(a => !(a.employeeId === employeeId && a.date === today));
        return [...filtered, newAttendance];
      });

      toast({
        title: '✅ Checked In',
        description: `${employee.name} has been checked in${isLate ? ' (Late)' : ''} at ${format(new Date(), 'HH:mm')}.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error checking in:', error);
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Failed to save check-in. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle check-out (persists to database)
  const handleCheckOut = async (employeeId: string) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee not found',
          variant: 'destructive',
        });
        return;
      }

      const checkOutTime = new Date().toISOString();
      
      // Find existing attendance record
      const existingAttendance = attendance.find(a => 
        a.employeeId === employeeId && a.date === today
      );
      
      if (!existingAttendance) {
        toast({
          title: 'Error',
          description: 'No check-in record found for today. Please check in first.',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('🔄 Checking out employee:', {
        employeeId,
        employeeName: employee.name,
        attendanceId: existingAttendance.id,
        checkOutTime
      });
      
      // Update in database using PUT with attendance ID
      const response = await fetch(`/api/attendance?id=${existingAttendance.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: existingAttendance.status,
          clockOutTime: checkOutTime
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error:', responseData);
        let errorMessage = 'Failed to save check-out';
        if (responseData.error) {
          errorMessage = responseData.error;
          if (responseData.details) {
            errorMessage += `: ${responseData.details}`;
          }
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Check-out successful:', responseData);
      
      // Update local state
      setAttendance(prev => prev.map(a => 
        a.id === existingAttendance.id 
          ? { 
              ...a, 
              clockOutTime: checkOutTime, 
              updatedAt: responseData.updatedAt || new Date().toISOString() 
            } 
          : a
      ));

      toast({
        title: '✅ Checked Out',
        description: `${employee.name} has been checked out at ${format(new Date(), 'HH:mm')}.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error checking out:', error);
      toast({
        title: 'Check-out Failed',
        description: error.message || 'Failed to save check-out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle mark as absent
  const handleMarkAbsent = async (employeeId: string) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) {
        toast({
          title: 'Error',
          description: 'Employee not found',
          variant: 'destructive',
        });
        return;
      }
      
      // Save absent record to database
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          date: today,
          status: 'Absent'
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error:', responseData);
        let errorMessage = 'Failed to mark as absent';
        if (responseData.error) {
          errorMessage = responseData.error;
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Marked absent:', responseData);
      
      // Update local state
      const newAttendance: Attendance = {
        id: responseData.id,
        employeeId,
        date: today,
        status: 'Absent',
        createdAt: responseData.createdAt || new Date().toISOString(),
        updatedAt: responseData.updatedAt || new Date().toISOString(),
        employee
      };
      
      setAttendance(prev => {
        const filtered = prev.filter(a => !(a.employeeId === employeeId && a.date === today));
        return [...filtered, newAttendance];
      });

      toast({
        title: 'Marked Absent',
        description: `${employee.name} has been marked as absent.`,
        variant: 'destructive',
      });
      
    } catch (error: any) {
      console.error('❌ Error marking absent:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as absent',
        variant: 'destructive',
      });
    }
  };

  // Handle mark as on leave
  const handleMarkOnLeave = async (employeeId: string) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;
      
      // Save on leave record to database
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          date: today,
          status: 'On Leave'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as on leave');
      }

      const responseData = await response.json();
      
      // Update local state
      const newAttendance: Attendance = {
        id: responseData.id,
        employeeId,
        date: today,
        status: 'On Leave',
        createdAt: responseData.createdAt || new Date().toISOString(),
        updatedAt: responseData.updatedAt || new Date().toISOString(),
        employee
      };
      
      setAttendance(prev => {
        const filtered = prev.filter(a => !(a.employeeId === employeeId && a.date === today));
        return [...filtered, newAttendance];
      });

      toast({
        title: 'Marked On Leave',
        description: `${employee.name} has been marked as on leave.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error marking on leave:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as on leave',
        variant: 'destructive',
      });
    }
  };

  // Handle check-in all for shift
  const handleCheckInAll = async (shiftId: string) => {
    try {
      const shiftEmployeesList = shiftEmployees[shiftId as keyof typeof shiftEmployees];
      const employeesToCheckIn = shiftEmployeesList.filter(emp => {
        const att = attendance.find(a => a.employeeId === emp.id && a.date === today);
        return !att || (att.status !== 'Present' && att.status !== 'Late');
      });

      let successCount = 0;
      let failedCount = 0;
      
      for (const employee of employeesToCheckIn) {
        try {
          await handleCheckIn(employee.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to check in ${employee.name}:`, error);
          failedCount++;
        }
      }

      toast({
        title: 'Bulk Check-in Complete',
        description: `Successfully checked in ${successCount} out of ${employeesToCheckIn.length} employees.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });
    } catch (error: any) {
      console.error('❌ Error in bulk check-in:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in all employees',
        variant: 'destructive',
      });
    }
  };

  // Handle check-out all for shift
  const handleCheckOutAll = async (shiftId: string) => {
    try {
      const shiftEmployeesList = shiftEmployees[shiftId as keyof typeof shiftEmployees];
      const employeesToCheckOut = shiftEmployeesList.filter(emp => {
        const att = attendance.find(a => a.employeeId === emp.id && a.date === today);
        return att?.status === 'Present' && !att.clockOutTime;
      });

      let successCount = 0;
      let failedCount = 0;
      
      for (const employee of employeesToCheckOut) {
        try {
          await handleCheckOut(employee.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to check out ${employee.name}:`, error);
          failedCount++;
        }
      }

      toast({
        title: 'Bulk Check-out Complete',
        description: `Successfully checked out ${successCount} out of ${employeesToCheckOut.length} employees.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });
    } catch (error: any) {
      console.error('❌ Error in bulk check-out:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check out all employees',
        variant: 'destructive',
      });
    }
  };

  // Handle create employee
  const handleCreateEmployee = async (formData: EmployeeFormValues) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create employee');
      }

      await fetchData();
      
      toast({
        title: 'Employee Created',
        description: `${formData.name} has been successfully added.`,
      });
      
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Handle update employee
  const handleUpdateEmployee = async (formData: EmployeeFormValues) => {
    if (!editingEmployee) return;
    
    try {
      const response = await fetch(`/api/employees?id=${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      await fetchData();
      
      toast({
        title: 'Employee Updated',
        description: `${formData.name} has been successfully updated.`,
      });
      
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update employee',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      await fetchData();
      
      toast({
        title: 'Employee Deleted',
        description: 'Employee has been successfully deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  // Toggle shift expansion
  const toggleShiftExpansion = (shiftId: string) => {
    setExpandedShifts(prev => ({
      ...prev,
      [shiftId]: !prev[shiftId]
    }));
  };

  // Filter employees based on search and contract type
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Contract filter
      if (activeFilter !== 'All' && employee.contract !== activeFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          employee.name.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query) ||
          employee.role.toLowerCase().includes(query) ||
          (employee.id_number && employee.id_number.toLowerCase().includes(query)) ||
          (employee.phone && employee.phone.toLowerCase().includes(query)) ||
          (employee.company && employee.company.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [employees, activeFilter, searchQuery]);

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
          {/* Error Display */}
          {fetchError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Database Error</AlertTitle>
              <AlertDescription>
                {fetchError}. Click "Refresh" to try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Employee Management</h2>
              <p className="text-muted-foreground">
                View, add, and manage employee records, attendance, and performance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Employee</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new employee to the system.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateEmployeeForm onCreate={handleCreateEmployee} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roll-call">Roll Call</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="attendance">Attendance Log</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData ? (
                  <>
                    <OverviewCard data={kpiData.totalEmployees} icon={Users} />
                    <OverviewCard data={kpiData.presentToday} icon={CheckCircle} />
                    <OverviewCard data={kpiData.onLeave} icon={Calendar} />
                    <OverviewCard data={kpiData.attendanceRate} icon={TrendingUp} />
                  </>
                ) : (
                  <>
                    <Skeleton className="h-[98px]" />
                    <Skeleton className="h-[98px]" />
                    <Skeleton className="h-[98px]" />
                    <Skeleton className="h-[98px]" />
                  </>
                )}
              </div>

              {/* Quick Employee Stats */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Employee Directory</CardTitle>
                      <CardDescription>
                        Browse and manage all employees
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search employees..."
                          className="pl-8 w-full md:w-[250px]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filter by contract" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Contracts</SelectItem>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Contract</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Today's Attendance</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.slice(0, 10).map((employee) => {
                          const empAttendance = attendance.find(a => a.employeeId === employee.id && a.date === today);
                          const StatusIcon = statusInfo[empAttendance?.status as keyof typeof statusInfo]?.icon || XCircle;
                          
                          return (
                            <TableRow 
                              key={employee.id} 
                              className={cn(
                                'cursor-pointer hover:bg-muted/50',
                                selectedEmployee?.id === employee.id && 'bg-muted'
                              )}
                              onClick={() => setSelectedEmployee(employee)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={employee.image} />
                                    <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{employee.name}</p>
                                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{employee.role}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{employee.contract}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                                  {employee.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {empAttendance ? (
                                  <div className="flex items-center gap-2">
                                    <StatusIcon className="w-4 h-4" />
                                    <span>{empAttendance.status}</span>
                                    {empAttendance.clockInTime && (
                                      <span className="text-xs text-muted-foreground">
                                        ({format(parseISO(empAttendance.clockInTime), 'HH:mm')})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No record</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEmployee(employee);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingEmployee(employee);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Employee Detail Card */}
              {selectedEmployee && (
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={selectedEmployee.image} />
                            <AvatarFallback className="text-lg">
                              {getInitials(selectedEmployee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">{selectedEmployee.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedEmployee.role}</p>
                            <Badge variant="outline">{selectedEmployee.contract}</Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{selectedEmployee.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{selectedEmployee.phone || 'No phone'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{selectedEmployee.company || 'FreshTrace'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Performance</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {selectedEmployee.performance || 'Meets Expectations'}
                            </Badge>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Award
                                  key={i}
                                  className={cn(
                                    'w-4 h-4',
                                    i < (selectedEmployee.rating || 0) 
                                      ? 'text-amber-500 fill-amber-500' 
                                      : 'text-muted-foreground'
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Status</h4>
                          <Badge variant={selectedEmployee.status === 'active' ? 'default' : 'secondary'}>
                            {selectedEmployee.status}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Salary</h4>
                          <p className="text-lg font-semibold">
                            {selectedEmployee.salary ? `KES ${parseInt(selectedEmployee.salary).toLocaleString()}` : 'Not set'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Today's Attendance</h4>
                          {(() => {
                            const todayAttendance = attendance.find(a => 
                              a.employeeId === selectedEmployee.id && a.date === today
                            );
                            
                            if (!todayAttendance) {
                              return (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">No attendance record</span>
                                </div>
                              );
                            }
                            
                            const StatusIcon = statusInfo[todayAttendance.status as keyof typeof statusInfo]?.icon;
                            
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {StatusIcon && <StatusIcon className="w-4 h-4" />}
                                  <Badge variant={statusInfo[todayAttendance.status as keyof typeof statusInfo]?.variant}>
                                    {todayAttendance.status}
                                  </Badge>
                                </div>
                                
                                {todayAttendance.clockInTime && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span>In: {format(parseISO(todayAttendance.clockInTime), 'HH:mm')}</span>
                                  </div>
                                )}
                                
                                {todayAttendance.clockOutTime && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <LogOut className="w-4 h-4 text-muted-foreground" />
                                    <span>Out: {format(parseISO(todayAttendance.clockOutTime), 'HH:mm')}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const todayAttendance = attendance.find(a => 
                                a.employeeId === selectedEmployee.id && a.date === today
                              );
                              
                              if (!todayAttendance || todayAttendance.status !== 'Present') {
                                handleCheckIn(selectedEmployee.id);
                              } else if (!todayAttendance.clockOutTime) {
                                handleCheckOut(selectedEmployee.id);
                              }
                            }}
                            disabled={(() => {
                              const todayAttendance = attendance.find(a => 
                                a.employeeId === selectedEmployee.id && a.date === today
                              );
                              return todayAttendance?.status === 'Absent' || todayAttendance?.status === 'On Leave';
                            })()}
                          >
                            {(() => {
                              const todayAttendance = attendance.find(a => 
                                a.employeeId === selectedEmployee.id && a.date === today
                              );
                              
                              if (!todayAttendance || todayAttendance.status !== 'Present') {
                                return (
                                  <>
                                    <LogIn className="mr-2 w-4 h-4" />
                                    Check In
                                  </>
                                );
                              } else if (!todayAttendance.clockOutTime) {
                                return (
                                  <>
                                    <LogOut className="mr-2 w-4 h-4" />
                                    Check Out
                                  </>
                                );
                              } else {
                                return 'Completed';
                              }
                            })()}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAbsent(selectedEmployee.id)}
                          >
                            <XCircle className="mr-2 w-4 h-4" />
                            Mark Absent
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedEmployee(null)}
                    >
                      Close Details
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingEmployee(selectedEmployee);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-2 w-4 h-4" />
                        Edit Employee
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                      >
                        <Trash2 className="mr-2 w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            {/* Roll Call Tab */}
            <TabsContent value="roll-call" className="mt-6 space-y-6">
              {/* Quick Stats Bar */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>Today's Roll Call - {format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current Time: {format(currentTime, 'HH:mm:ss')}
                    </div>
                  </div>
                  <CardDescription>
                    Manage check-in and check-out for all employees by shift
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Total Employees</div>
                      <div className="text-2xl font-bold">{shiftStats.overall.totalEmployees}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Present Today</div>
                      <div className="text-2xl font-bold text-green-600">{shiftStats.overall.presentToday}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Checked Out</div>
                      <div className="text-2xl font-bold text-amber-600">{shiftStats.overall.checkedOutToday}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">On Leave</div>
                      <div className="text-2xl font-bold text-blue-600">{shiftStats.overall.onLeave}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="default" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        // Check in all not checked in
                        const employeesToCheckIn = employees.filter(emp => {
                          const att = attendance.find(a => a.employeeId === emp.id && a.date === today);
                          return !att || (att.status !== 'Present' && att.status !== 'Late');
                        });
                        
                        for (const employee of employeesToCheckIn) {
                          await handleCheckIn(employee.id);
                        }
                      }}
                    >
                      <LogIn className="mr-2" />
                      Check-in All Employees
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-amber-600 text-amber-600 hover:bg-amber-50"
                      onClick={async () => {
                        // Check out all present
                        const employeesToCheckOut = attendance
                          .filter(a => a.status === 'Present' && !a.clockOutTime && a.date === today)
                          .map(a => a.employeeId);
                        
                        for (const employeeId of employeesToCheckOut) {
                          await handleCheckOut(employeeId);
                        }
                      }}
                    >
                      <LogOut className="mr-2" />
                      Check-out All Present
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Shift Cards */}
              <div className="space-y-6">
                {shiftData.map((shift) => {
                  const shiftEmployeesList = shiftEmployees[shift.id as keyof typeof shiftEmployees];
                  const shiftStat = shiftStats[shift.id === 'day-shift' ? 'dayShift' : 'nightShift'];
                  
                  return (
                    <Card key={shift.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-8 w-8"
                              onClick={() => toggleShiftExpansion(shift.id)}
                            >
                              {expandedShifts[shift.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {shift.name}
                                <Badge variant="outline" className={
                                  shift.id === 'day-shift' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }>
                                  {shift.timeRange}
                                </Badge>
                              </CardTitle>
                              <CardDescription className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {shiftEmployeesList.length} employees
                                </span>
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  {shiftStat.present} present
                                </span>
                                <span className="flex items-center gap-1 text-amber-600">
                                  <LogOut className="w-3 h-3" />
                                  {shiftStat.checkedOut} checked out
                                </span>
                                {shiftStat.late > 0 && (
                                  <span className="flex items-center gap-1 text-amber-600">
                                    <AlertCircle className="w-3 h-3" />
                                    {shiftStat.late} late
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-3 h-3" />
                                  {shiftStat.absent} absent
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-600 text-green-600 hover:bg-green-50"
                              onClick={() => handleCheckInAll(shift.id)}
                            >
                              <LogIn className="mr-2 w-3 h-3" />
                              Check-in All
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-600 text-amber-600 hover:bg-amber-50"
                              onClick={() => handleCheckOutAll(shift.id)}
                              disabled={shiftStat.present === 0}
                            >
                              <LogOut className="mr-2 w-3 h-3" />
                              Check-out All
                            </Button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Attendance Progress</span>
                            <span>{shiftStat.present + shiftStat.checkedOut}/{shiftStat.total} ({shiftStat.total > 0 ? Math.round(((shiftStat.present + shiftStat.checkedOut) / shiftStat.total) * 100) : 0}%)</span>
                          </div>
                          <Progress 
                            value={shiftStat.total > 0 ? ((shiftStat.present + shiftStat.checkedOut) / shiftStat.total) * 100 : 0} 
                            className="h-2"
                          />
                        </div>
                      </CardHeader>
                      
                      {expandedShifts[shift.id] && (
                        <CardContent className="pt-6">
                          {shiftEmployeesList.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No employees assigned to this shift.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {shiftEmployeesList.map((employee) => {
                                const empAttendance = attendance.find(a => a.employeeId === employee.id && a.date === today);
                                const isPresent = empAttendance?.status === 'Present';
                                const isCheckedOut = !!empAttendance?.clockOutTime;
                                const isLate = empAttendance?.status === 'Late';
                                const isAbsent = empAttendance?.status === 'Absent';
                                const isOnLeave = empAttendance?.status === 'On Leave';
                                
                                return (
                                  <Card key={employee.id} className={cn(
                                    'overflow-hidden transition-all hover:shadow-md',
                                    isPresent && !isCheckedOut && 'border-green-300 bg-green-50/30',
                                    isCheckedOut && 'border-gray-300 bg-gray-50/30',
                                    isAbsent && 'border-red-100 bg-red-50/20',
                                    isLate && 'border-amber-300 bg-amber-50/30',
                                    isOnLeave && 'border-blue-100 bg-blue-50/20'
                                  )}>
                                    <CardHeader className="p-4 flex flex-row items-start gap-3">
                                      <Avatar className={cn(
                                        'ring-2',
                                        isPresent && !isCheckedOut && 'ring-green-500',
                                        isCheckedOut && 'ring-gray-400',
                                        isAbsent && 'ring-red-300',
                                        isLate && 'ring-amber-500',
                                        isOnLeave && 'ring-blue-300'
                                      )}>
                                        <AvatarImage src={employee.image} />
                                        <AvatarFallback className={cn(
                                          isPresent && !isCheckedOut && 'bg-green-100 text-green-800',
                                          isCheckedOut && 'bg-gray-100 text-gray-800',
                                          isAbsent && 'bg-red-100 text-red-800',
                                          isLate && 'bg-amber-100 text-amber-800',
                                          isOnLeave && 'bg-blue-100 text-blue-800'
                                        )}>
                                          {getInitials(employee.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{employee.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{employee.role}</p>
                                        <Badge variant="outline" className="mt-1 text-xs px-2 py-0.5">
                                          {employee.contract}
                                        </Badge>
                                        {empAttendance?.clockInTime && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            In: {format(parseISO(empAttendance.clockInTime), 'HH:mm')}
                                          </p>
                                        )}
                                        {empAttendance?.clockOutTime && (
                                          <p className="text-xs text-muted-foreground">
                                            Out: {format(parseISO(empAttendance.clockOutTime), 'HH:mm')}
                                          </p>
                                        )}
                                      </div>
                                    </CardHeader>
                                    
                                    <CardFooter className="p-3 bg-muted/20 flex flex-col gap-2">
                                      {!empAttendance || isAbsent || isOnLeave ? (
                                        <div className="grid grid-cols-2 gap-2 w-full">
                                          <Button 
                                            size="sm" 
                                            variant="default" 
                                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                                            onClick={() => handleCheckIn(employee.id)}
                                            disabled={isOnLeave}
                                          >
                                            <LogIn className="mr-1 w-3 h-3" /> 
                                            In
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="destructive" 
                                            className="h-8"
                                            onClick={() => handleMarkAbsent(employee.id)}
                                            disabled={isOnLeave}
                                          >
                                            <XCircle className="mr-1 w-3 h-3" /> 
                                            Absent
                                          </Button>
                                        </div>
                                      ) : isCheckedOut ? (
                                        <div className="w-full">
                                          <Badge variant="secondary" className="w-full justify-center py-2">
                                            <CheckCircle className="mr-2 w-3 h-3" />
                                            Checked Out
                                          </Badge>
                                        </div>
                                      ) : (
                                        <div className="w-full space-y-2">
                                          <div className="flex items-center justify-between">
                                            <Badge variant="default" className="flex items-center gap-1">
                                              <CheckCircle className="w-3 h-3" />
                                              {isLate ? 'Late' : 'Present'}
                                            </Badge>
                                          </div>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="text-amber-600 border-amber-600 hover:bg-amber-50 h-8 w-full"
                                            onClick={() => handleCheckOut(employee.id)}
                                          >
                                            <LogOut className="mr-1 w-3 h-3" />
                                            Check Out
                                          </Button>
                                        </div>
                                      )}
                                    </CardFooter>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Employees Tab */}
            <TabsContent value="employees" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>All Employees</CardTitle>
                      <CardDescription>
                        Manage your employee directory
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search employees..."
                          className="pl-8 w-full md:w-[250px]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filter by contract" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Contracts</SelectItem>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {employees.length > 0 ? (
                    <EmployeeDataTable 
                      employees={filteredEmployees} 
                      onSelectEmployee={setSelectedEmployee} 
                      selectedEmployeeId={selectedEmployee?.id} 
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                      <p className="text-muted-foreground mb-4">Add your first employee to get started</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2" />
                        Add Employee
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendance Log Tab */}
            <TabsContent value="attendance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Log</CardTitle>
                  <CardDescription>
                    View historical attendance records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attendance.length > 0 ? (
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendance.map((record) => {
                            const employee = employees.find(e => e.id === record.employeeId);
                            // Determine shift based on check-in time
                            let shift = 'Unknown';
                            if (record.clockInTime) {
                              const hour = parseISO(record.clockInTime).getHours();
                              shift = hour >= 6 && hour < 18 ? 'Day Shift' : 'Night Shift';
                            }
                            
                            // Calculate hours worked
                            let hoursWorked = 'N/A';
                            if (record.clockInTime && record.clockOutTime) {
                              const inTime = parseISO(record.clockInTime);
                              const outTime = parseISO(record.clockOutTime);
                              const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
                              hoursWorked = hours.toFixed(1) + ' hrs';
                            }
                            
                            const StatusIcon = statusInfo[record.status as keyof typeof statusInfo]?.icon || XCircle;
                            
                            return (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                  {format(parseISO(record.date), 'PP')}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={employee?.image} />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(employee?.name || '')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{employee?.name || 'Unknown'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{shift}</TableCell>
                                <TableCell>
                                  {record.clockInTime ? format(parseISO(record.clockInTime), 'HH:mm') : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {record.clockOutTime ? format(parseISO(record.clockOutTime), 'HH:mm') : 'N/A'}
                                </TableCell>
                                <TableCell>{hoursWorked}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                    <StatusIcon className="w-3 h-3" />
                                    {record.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No attendance records</h3>
                      <p className="text-muted-foreground">Attendance records will appear here after check-ins</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Employee Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>
                  Update the details for {editingEmployee?.name}.
                </DialogDescription>
              </DialogHeader>
              <CreateEmployeeForm 
                employee={editingEmployee} 
                onUpdate={handleUpdateEmployee} 
              />
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
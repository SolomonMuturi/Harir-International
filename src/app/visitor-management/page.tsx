

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { visitorData, overviewData, shipmentData, type Visitor, type Shipment, employeeData, timeAttendanceData, type Employee, type EmployeeFormValues } from '@/lib/data';
import { VisitorDataTable } from '@/components/dashboard/visitor-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateVisitorForm, type VisitorFormValues } from '@/components/dashboard/create-visitor-form';
import { PlusCircle, Clock, Truck, Users, QrCode, Printer, Calendar as CalendarIcon, CreditCard, Edit, AlertTriangle, Send, RefreshCw } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { GatePassDialog } from '@/components/dashboard/gate-pass-dialog';
import { VisitorDetailDialog } from '@/components/dashboard/visitor-detail-dialog';
import { CheckInDialog } from '@/components/dashboard/check-in-dialog';
import { useToast } from '@/hooks/use-toast';
import { RegistrationSuccess } from '@/components/dashboard/registration-success';
import { PrintableVisitorReport } from '@/components/dashboard/printable-visitor-report';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO, add, differenceInDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeIdCardDialog } from '@/components/dashboard/employee-id-card-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { CreateEmployeeForm } from '@/components/dashboard/create-employee-form';

type VisitorStatusFilter = 'All' | 'Pre-registered' | 'Checked-in' | 'Checked-out' | 'Pending Exit';

export default function VisitorManagementPage() {
  const [visitors, setVisitors] = useState<Visitor[]>(visitorData);
  const [shipments, setShipments] = useState<Shipment[]>(shipmentData);
  const [employees, setEmployees] = useState<Employee[]>(employeeData);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newlyRegisteredVisitor, setNewlyRegisteredVisitor] = useState<Visitor | null>(null);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<VisitorStatusFilter>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const printRef = useRef<HTMLDivElement>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const handleAddVisitor = (values: VisitorFormValues) => {
    const newVisitor: Visitor = {
      id: `vis-${Date.now()}`,
      visitorCode: `VIST-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status: 'Pre-registered',
      name: values.name,
      hostId: values.hostId,
      idNumber: values.idNumber,
      company: values.company,
      email: values.email,
      phone: values.phone,
      expectedCheckInTime: values.expectedCheckInTime,
      vehiclePlate: values.vehiclePlate || 'N/A',
      vehicleType: values.vehicleType || 'N/A',
      cargoDescription: values.cargoDescription,
    };
    setVisitors(prev => [newVisitor, ...prev]);
    setNewlyRegisteredVisitor(newVisitor);

    if (values.logShipment && values.customer && values.origin && values.destination && values.product) {
      const newShipment: Shipment = {
        id: `ship-${Date.now()}`,
        shipmentId: `SH-${Math.floor(Math.random() * 90000) + 10000}`,
        customer: values.customer,
        origin: values.origin,
        destination: values.destination,
        status: 'Receiving',
        product: values.product,
        tags: 'Not tagged',
        weight: 'Not weighed',
        expectedArrival: values.expectedCheckInTime,
      };
      setShipments(prev => [newShipment, ...prev]);
       toast({
        title: 'Visitor & Shipment Registered',
        description: `${newVisitor.name} has been pre-registered and shipment ${newShipment.shipmentId} has been created.`,
      });
    } else {
       toast({
        title: 'Visitor Registered',
        description: `${newVisitor.name} has been pre-registered.`,
      });
    }
  };
  
  const handleUpdateEmployee = (updatedEmployeeData: EmployeeFormValues) => {
    if (!selectedEmployee) return;
    const updatedEmployeeWithDates = {
      ...updatedEmployeeData,
      issueDate: updatedEmployeeData.issueDate ? new Date(updatedEmployeeData.issueDate).toISOString() : undefined,
      expiryDate: updatedEmployeeData.expiryDate ? new Date(updatedEmployeeData.expiryDate).toISOString() : undefined,
    }

    setEmployees(prev =>
      prev.map(emp =>
        emp.id === selectedEmployee.id
          ? { ...emp, ...updatedEmployeeWithDates }
          : emp
      )
    );
    setSelectedEmployee(prev => prev ? ({...prev, ...updatedEmployeeWithDates}) : null);
    setIsEditDialogOpen(false);
     toast({
      title: 'Employee Updated',
      description: `${selectedEmployee.name}'s details have been updated.`,
    });
  };

  const handleRegistrationDialogClose = (open: boolean) => {
    if (!open) {
      setNewlyRegisteredVisitor(null);
    }
    setIsRegisterDialogOpen(open);
  }

  const handleCheckIn = (visitorId: string) => {
    const visitor = visitors.find(v => v.id === visitorId);
    if (!visitor) return;

    setVisitors(prev => prev.map(v => v.id === visitorId ? { ...v, status: 'Checked-in', checkInTime: new Date().toISOString() } : v));
    setIsCheckInDialogOpen(false);
    
    const host = employeeData.find(e => e.id === visitor.hostId);
    toast({
        title: "Visitor Checked In",
        description: `${visitor.name} has been checked in. ${host ? `Host (${host.name}) has been notified.` : ''}`,
    });

    if (visitor.vehiclePlate && visitor.vehiclePlate !== 'N/A') {
        setSelectedVisitor({ ...visitor, status: 'Checked-in' });
        setIsGatePassOpen(true);
        toast({
          title: "Vehicle Badge Generated",
          description: `A printable vehicle badge for ${visitor.vehiclePlate} is ready.`
        })
    }
  };

  const handleCheckOut = (visitorId: string, final: boolean = false) => {
    const visitor = visitors.find(v => v.id === visitorId);
    if (!visitor) return;

    if (final) {
        // Final verification step at the gate
        const updatedVisitor = { ...visitor, status: 'Checked-out' as const, checkOutTime: new Date().toISOString() };
        setSelectedVisitor(updatedVisitor);
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        setIsCheckInDialogOpen(false); // Close the check-in/verification dialog
        toast({
            title: "Visitor Verified for Exit",
            description: `${visitor.name} has been successfully checked out.`,
        });
    } else {
        // Initial checkout action (e.g., by host), sets status to 'Pending Exit'
        const updatedVisitor = { ...visitor, status: 'Pending Exit' as const };
        setSelectedVisitor(updatedVisitor);
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        
        toast({
            title: "Checkout Initiated",
            description: `${visitor.name} is now pending exit. A gate pass can be generated.`,
        });

        if(visitor.vehiclePlate && visitor.vehiclePlate !== 'N/A') {
            setSelectedVisitor(updatedVisitor);
            setIsGatePassOpen(true);
        }
    }
  };

  const handleRowClick = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setIsDetailDialogOpen(true);
  };

  const handlePrintReport = async () => {
    const element = printRef.current;
    if (element) {
        const canvas = await html2canvas(element, { scale: 2 });
        const data = canvas.toDataURL('image/jpeg');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`visitor-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    }
  };

  const handleIdCardClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsIdCardOpen(true);
  };
  
  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsIdCardOpen(false); // Close ID card dialog
    setIsEditDialogOpen(true); // Open Edit dialog
  };

  const handleSendReminder = (employeeName: string) => {
      toast({
          title: 'Reminder Sent',
          description: `An expiry reminder has been sent to ${employeeName}.`
      });
  }

  const handleRenewNow = (employee: Employee) => {
      if (employee.expiryDate) {
        const newExpiryDate = add(new Date(employee.expiryDate), { years: 1 });
        const updatedEmployee = { ...employee, expiryDate: newExpiryDate.toISOString() };

        setEmployees(prev => prev.map(e => e.id === employee.id ? updatedEmployee : e));
        
        toast({
            title: 'Badge Renewed',
            description: `${employee.name}'s badge has been renewed until ${format(newExpiryDate, 'PPP')}.`
        });
      }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const statusMatch = statusFilter === 'All' || visitor.status === statusFilter;
    
    let dateMatch = true;
    if (dateRange?.from && dateRange?.to) {
        const checkInTime = visitor.checkInTime ? parseISO(visitor.checkInTime) : null;
        dateMatch = checkInTime ? isWithinInterval(checkInTime, { start: dateRange.from, end: dateRange.to }) : false;
    } else if (dateRange?.from) {
        const checkInTime = visitor.checkInTime ? parseISO(visitor.checkInTime) : null;
        dateMatch = checkInTime ? checkInTime >= dateRange.from : false;
    }
    
    return statusMatch && dateMatch;
  });
  
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    employee.role.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const expiringBadges = employees.filter(employee => {
    if (!employee.expiryDate) return false;
    const daysUntilExpiry = differenceInDays(new Date(employee.expiryDate), new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  });
  
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

  const filterButtons: VisitorStatusFilter[] = ['All', 'Pre-registered', 'Checked-in', 'Pending Exit', 'Checked-out'];

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
          <div className="non-printable">
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                          Visitor Management
                      </h2>
                      <p className="text-muted-foreground">
                          Manage and track all visitors and vehicle deliveries.
                      </p>
                  </div>
              </div>
              
            <Tabs defaultValue="log" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="log">Live Log</TabsTrigger>
                    <TabsTrigger value="manifest">Manifest</TabsTrigger>
                    <TabsTrigger value="badges">Employee Badges</TabsTrigger>
                </TabsList>
                <TabsContent value="log" className="mt-6 space-y-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCheckInDialogOpen(true)}>
                          <QrCode className="mr-2" />
                          Check-in / Verify Exit
                      </Button>
                      <Dialog open={isRegisterDialogOpen} onOpenChange={handleRegistrationDialogClose}>
                          <DialogTrigger asChild>
                              <Button>
                                  <PlusCircle className="mr-2" />
                                  Pre-register Visitor
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            {!newlyRegisteredVisitor ? (
                                <>
                                  <DialogHeader>
                                  <DialogTitle>Pre-register New Visitor</DialogTitle>
                                  <DialogDescription>
                                      Fill in the details below. You can also log an incoming shipment.
                                  </DialogDescription>
                                  </DialogHeader>
                                  <CreateVisitorForm onSubmit={handleAddVisitor} />
                                </>
                            ) : (
                                  <RegistrationSuccess 
                                    visitor={newlyRegisteredVisitor}
                                    onDone={() => handleRegistrationDialogClose(false)}
                                  />
                            )}
                          </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Link href="/visitor-management" className="block transition-transform hover:scale-[1.02]">
                            <OverviewCard data={overviewData.visitorsToday} icon={Users} />
                        </Link>
                        <Link href="/vehicle-management" className="block transition-transform hover:scale-[1.02]">
                            <OverviewCard data={overviewData.vehiclesOnSite} icon={Truck} />
                        </Link>
                        <Link href="/visitor-management" className="block transition-transform hover:scale-[1.02]">
                            <OverviewCard data={overviewData.avgVisitDuration} icon={Clock} />
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {filterButtons.map(filter => (
                                <Button 
                                    key={filter}
                                    variant={statusFilter === filter ? 'default' : 'outline'}
                                    onClick={() => setStatusFilter(filter)}
                                    className={cn(
                                        filter === 'Pending Exit' && statusFilter === 'Pending Exit' && 'bg-destructive hover:bg-destructive/90'
                                    )}
                                >
                                    {filter}
                                </Button>
                            ))}
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                    ) : (
                                    format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <VisitorDataTable visitors={filteredVisitors} onCheckIn={() => setIsCheckInDialogOpen(true)} onCheckOut={handleCheckOut} onRowClick={handleRowClick} />
                </TabsContent>
                <TabsContent value="manifest" className="mt-6 space-y-6">
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={handlePrintReport}>
                          <Printer className="mr-2" />
                          Download Report
                      </Button>
                    </div>
                    <div className="border rounded-lg" ref={printRef}>
                      <PrintableVisitorReport visitors={filteredVisitors} employees={employees} attendance={timeAttendanceData} />
                    </div>
                </TabsContent>
                <TabsContent value="badges" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {employees.map(employee => (
                      <Card key={employee.id}>
                          <CardContent className="p-4 flex flex-col items-center text-center">
                              <Avatar className="h-16 w-16 mb-2">
                                <AvatarImage src={employee.image} alt={employee.name} />
                                <AvatarFallback className="text-2xl">{getInitials(employee.name)}</AvatarFallback>
                              </Avatar>
                              <p className="font-semibold">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">{employee.role}</p>
                              <p className="text-xs text-primary">{employee.company || 'FreshTrace'}</p>
                              <p className="text-xs text-muted-foreground mt-2">Expires: {employee.expiryDate ? format(new Date(employee.expiryDate), 'PPP') : 'N/A'}</p>
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2 p-2">
                              <Button className="w-full" onClick={() => handleIdCardClick(employee)}>
                                <CreditCard className="mr-2" />
                                Preview Badge
                              </Button>
                          </CardFooter>
                      </Card>
                    ))}
                  </div>

                  {expiringBadges.length > 0 && (
                      <Card className="bg-destructive/10 border-destructive">
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-destructive">
                                  <AlertTriangle />
                                  Badges Nearing Expiry
                              </CardTitle>
                              <CardDescription className="text-destructive/80">
                                  These ID badges will expire within the next 30 days. Please send renewal reminders.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                              {expiringBadges.map(employee => (
                                  <div key={employee.id} className="flex items-center justify-between p-3 rounded-md bg-background/50">
                                      <div>
                                          <p className="font-semibold">{employee.name}</p>
                                          <p className="text-sm text-muted-foreground">{employee.role} - Expires on <span className="text-destructive font-medium">{employee.expiryDate ? format(new Date(employee.expiryDate), 'PPP') : 'N/A'}</span></p>
                                      </div>
                                      <div className="flex gap-2">
                                          <Button variant="outline" size="sm" onClick={() => handleSendReminder(employee.name)}>
                                              <Send className="mr-2"/>
                                              Send Reminder
                                          </Button>
                                          <Button variant="default" size="sm" onClick={() => handleRenewNow(employee)}>
                                              <RefreshCw className="mr-2" />
                                              Renew Now
                                          </Button>
                                      </div>
                                  </div>
                              ))}
                          </CardContent>
                      </Card>
                  )}
                </TabsContent>
            </Tabs>
            
            <CheckInDialog
              isOpen={isCheckInDialogOpen}
              onOpenChange={setIsCheckInDialogOpen}
              visitors={visitors.filter(v => v.status === 'Pre-registered')}
              pendingExitVisitors={visitors.filter(v => v.status === 'Pending Exit')}
              onCheckIn={handleCheckIn}
              onVerifyExit={(visitorId) => handleCheckOut(visitorId, true)}
            />

            {selectedVisitor && (
              <GatePassDialog 
                  isOpen={isGatePassOpen} 
                  onOpenChange={setIsGatePassOpen} 
                  visitor={selectedVisitor} 
              />
            )}

            {selectedVisitor && (
              <VisitorDetailDialog
                isOpen={isDetailDialogOpen}
                onOpenChange={setIsDetailDialogOpen}
                visitor={selectedVisitor}
              />
            )}

            {selectedEmployee && (
              <EmployeeIdCardDialog
                isOpen={isIdCardOpen}
                onOpenChange={setIsIdCardOpen}
                employee={selectedEmployee}
                onEdit={() => handleEditClick(selectedEmployee)}
              />
            )}
            
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update the details for {selectedEmployee?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateEmployeeForm
                        employee={selectedEmployee}
                        onUpdate={handleUpdateEmployee}
                    />
                </DialogContent>
            </Dialog>

          </main>
        </SidebarInset>
      </SidebarProvider>
      <div className="hidden">
        <div ref={printRef}>
            <PrintableVisitorReport visitors={filteredVisitors} employees={employees} attendance={timeAttendanceData} />
        </div>
      </div>
    </>
  );
}

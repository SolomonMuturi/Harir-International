

'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '../ui/star-rating';
import type { Employee, TimeAttendance } from '@/lib/data';
import { Briefcase, Calendar, Edit, Mail, Phone, UserCheck, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimeAttendanceCard } from './time-attendance-card';
import { incidentTrendData } from '@/lib/data';
import { EmployeePerformanceOverviewChart } from './employee-performance-overview-chart';
import { IncidentTrendChart } from './incident-trend-chart';

interface EmployeeDetailCardProps {
  employee: Employee;
  onEdit: () => void;
  onAction: (action: string) => void;
  onPrintId: () => void;
  attendance: TimeAttendance[];
  onCheckIn: (employeeId: string) => void;
  onCheckOut: (employeeId: string) => void;
}

const guardPerformanceData = [
    { name: 'Patrols', score: 28, other: 12 },
    { name: 'Reports', score: 35, other: 15 },
    { name: 'Incidents', score: 10, other: 5 },
    { name: 'Compliance', score: 38, other: 2 },
];


export function EmployeeDetailCard({ employee, onEdit, onAction, onPrintId, attendance, onCheckIn, onCheckOut }: EmployeeDetailCardProps) {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');
  
  const statusVariant = {
    active: 'default',
    'on-leave': 'secondary',
    inactive: 'outline',
  } as const;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={employee.image} alt={employee.name} />
          <AvatarFallback className="text-3xl">{getInitials(employee.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{employee.name}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onPrintId}>
                <CreditCard className="mr-2" />
                Print ID
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2" />
                Edit
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{employee.role}</Badge>
            <Badge variant={statusVariant[employee.status]} className="capitalize">{employee.status}</Badge>
          </div>
          <div className="mt-2">
            <StarRating rating={employee.rating} size={20} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-4">
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone /> {employee.phone || 'Not provided'}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail /> {employee.email}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Briefcase /> {employee.contract}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><UserCheck /> ID: {employee.idNumber || 'Not provided'}</div>
             </div>
             <div className="space-y-2">
                <h4 className="font-semibold">Salary</h4>
                <div className="font-mono text-lg p-2 bg-muted rounded-md w-fit">KES {employee.salary.toLocaleString()}</div>
            </div>
          </TabsContent>
           <TabsContent value="attendance">
                <TimeAttendanceCard 
                    attendance={attendance} 
                    onCheckIn={onCheckIn}
                    onCheckOut={onCheckOut}
                />
           </TabsContent>
            <TabsContent value="performance" className="space-y-4">
                 <EmployeePerformanceOverviewChart data={guardPerformanceData} />
                 <IncidentTrendChart data={incidentTrendData} />
            </TabsContent>
        </Tabs>
      </CardContent>
       <CardFooter className="gap-2">
            <Button className="w-full" onClick={() => onAction('Request Leave')}>
                <Calendar className="mr-2" />
                Request Leave
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => onAction('Assign Task')}>
                Assign Task
            </Button>
             <Button variant="destructive" className="w-full" onClick={() => onAction('Terminate')}>
                Terminate
            </Button>
        </CardFooter>
    </Card>
  );
}

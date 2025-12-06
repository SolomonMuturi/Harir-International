
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, LogOut, Clock, Printer, LogIn, ClipboardCheck } from 'lucide-react';
import { employeeData } from '@/lib/data';
import type { TimeAttendance } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

interface TimeAttendanceCardProps {
  attendance: TimeAttendance[];
  onCheckIn: (employeeId: string) => void;
  onCheckOut: (employeeId: string) => void;
}

const statusInfo = {
  Present: { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, variant: 'default' as const },
  Absent: { icon: <XCircle className="w-5 h-5 text-destructive" />, variant: 'destructive' as const },
  'On Leave': { icon: <LogOut className="w-5 h-5 text-muted-foreground" />, variant: 'secondary' as const },
};

const checklistItems = [
    { id: 'uniform', label: 'Correct Uniform Worn' },
    { id: 'gloves', label: 'Gloves On' },
    { id: 'overalls', label: 'Overalls/Apron Correct' },
];

export function TimeAttendanceCard({ attendance, onCheckIn, onCheckOut }: TimeAttendanceCardProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [checklistEmployee, setChecklistEmployee] = useState<TimeAttendance | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }
  
  const handleOpenChecklist = (att: TimeAttendance) => {
    setChecklistEmployee(att);
    setCheckedItems({}); // Reset checks
    setIsChecklistOpen(true);
  }

  const handleConfirmCheckIn = () => {
    if (checklistEmployee) {
      onCheckIn(checklistEmployee.employeeId);
    }
    setIsChecklistOpen(false);
    setChecklistEmployee(null);
  }
  
  const allChecked = checklistItems.every(item => checkedItems[item.id]);

  const formatTimestamp = (ts?: string) => {
    if (!hasMounted) return <Skeleton className="h-4 w-10 mt-1" />;
    return ts ? format(parseISO(ts), 'HH:mm') : '-';
  }
  
  const employeeForDialog = checklistEmployee ? employeeData.find(e => e.id === checklistEmployee.employeeId) : null;

  return (
    <>
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Clock />
            Time &amp; Attendance
        </CardTitle>
        <CardDescription>
            Today's roll call and clock-in/out status.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[300px]">
            <div className="space-y-4 p-4">
            {attendance.map(att => {
                const employee = employeeData.find(e => e.id === att.employeeId);
                if (!employee) return null;

                return (
                <div key={employee.id} className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={employee.image} />
                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.role}</div>
                    </div>
                     <div className="text-right flex flex-col items-end gap-1">
                        <Badge variant={statusInfo[att.status].variant} className="flex items-center gap-1.5 w-24 justify-center">
                            {statusInfo[att.status].icon}
                            {att.status}
                        </Badge>
                        {att.status === 'Present' && !att.clockOutTime && (
                             <Button size="sm" variant="outline" onClick={() => onCheckOut(att.employeeId)}>
                                <LogOut className="mr-2 h-3 w-3" />
                                Check-out
                            </Button>
                        )}
                        {att.status === 'Absent' && (
                             <Button size="sm" variant="outline" onClick={() => handleOpenChecklist(att)}>
                                <LogIn className="mr-2 h-3 w-3" />
                                Check-in
                            </Button>
                        )}
                        <div className="text-xs text-muted-foreground font-mono">
                            {att.clockInTime ? `In: ${formatTimestamp(att.clockInTime)}` : ''}
                            {att.clockOutTime ? ` / Out: ${formatTimestamp(att.clockOutTime)}` : ''}
                        </div>
                    </div>
                </div>
                );
            })}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>

    <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <ClipboardCheck />
                    Pre-Shift Check: {employeeForDialog?.name}
                </DialogTitle>
                <DialogDescription>
                    Confirm all safety and uniform checks are complete before clocking in the employee.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                {checklistItems.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={item.id}
                            checked={checkedItems[item.id]}
                            onCheckedChange={(checked) => {
                                setCheckedItems(prev => ({ ...prev, [item.id]: !!checked }));
                            }}
                        />
                        <Label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {item.label}
                        </Label>
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsChecklistOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmCheckIn} disabled={!allChecked}>
                    Confirm & Check-in
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

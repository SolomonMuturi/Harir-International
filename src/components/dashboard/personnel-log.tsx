

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, LogIn, LogOut, AlertTriangle, Clock } from 'lucide-react';
import type { ColdRoomPersonnelLog } from '@/lib/data';
import { employeeData } from '@/lib/data';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PersonnelLogProps {
  logs: ColdRoomPersonnelLog[];
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

type DwellStatus = 'Normal' | 'Warning' | 'Critical';

export function PersonnelLog({ logs }: PersonnelLogProps) {
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setHasMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(timer);
  }, []);

  const { employeesInside, triggeredAlerts } = useMemo(() => {
    const insideMap = new Map<string, { employeeId: string; coldRoomId: string; entryTime: Date }>();
    [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach(log => {
      const key = `${log.employeeId}-${log.coldRoomId}`;
      if (log.eventType === 'entry') {
        insideMap.set(key, { employeeId: log.employeeId, coldRoomId: log.coldRoomId, entryTime: new Date(log.timestamp) });
      } else {
        insideMap.delete(key);
      }
    });

    const triggeredAlerts = new Set<string>();

    const insideArray = Array.from(insideMap.values()).map(entry => {
      const employee = employeeData.find(e => e.id === entry.employeeId);
      const dwellTimeLimit = employee?.dwellTimeLimitMinutes || 20;
      const elapsedSeconds = (currentTime.getTime() - entry.entryTime.getTime()) / 1000;
      const elapsedMinutes = elapsedSeconds / 60;
      
      let status: DwellStatus = 'Normal';
      if (elapsedMinutes >= dwellTimeLimit) {
        status = 'Critical';
      } else if (elapsedMinutes >= dwellTimeLimit * 0.75) {
        status = 'Warning';
      }
      
      const warningKey = `${entry.employeeId}-warning`;
      const criticalKey = `${entry.employeeId}-critical`;
      
      if (status === 'Warning' && !triggeredAlerts.has(warningKey)) {
        toast({
          title: 'Dwell Time Warning',
          description: `${employee?.name} is approaching their cold room exposure limit.`,
          variant: 'default'
        });
        triggeredAlerts.add(warningKey);
      }
      
       if (status === 'Critical' && !triggeredAlerts.has(criticalKey)) {
        toast({
          title: 'Dwell Time Critical Alert!',
          description: `${employee?.name} has exceeded their cold room exposure limit. Immediate action required.`,
          variant: 'destructive'
        });
        triggeredAlerts.add(criticalKey);
      }

      return { ...entry, employee, status, elapsedSeconds };
    });

    return { employeesInside: insideArray, triggeredAlerts };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, currentTime]);

  const formatDwellTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const statusInfo = {
    Normal: { variant: 'secondary' as const, icon: null },
    Warning: { variant: 'default' as const, icon: <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" /> },
    Critical: { variant: 'destructive' as const, icon: <AlertTriangle className="h-4 w-4 mr-1" /> },
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Personnel Access Log
        </CardTitle>
        <CardDescription>
          Live view of employee movements and dwell time in cold rooms.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-2">Currently Inside ({employeesInside.length})</h3>
          <div className="flex flex-wrap gap-2">
            {employeesInside.map(({ employee, coldRoomId, status, elapsedSeconds }) => {
                if (!employee) return null;
                const statusConfig = statusInfo[status];
                return (
                    <div key={employee.id} className={cn("flex items-center gap-2 p-2 rounded-md border", 
                        status === 'Warning' && 'bg-yellow-500/10 border-yellow-500/50',
                        status === 'Critical' && 'bg-destructive/10 border-destructive/50 animate-pulse'
                    )}>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={employee.image} />
                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-xs">
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-muted-foreground">{coldRoomId.replace('cr-', 'Cold Room ')}</p>
                            <div className="flex items-center font-mono">
                                {statusConfig.icon}
                                {formatDwellTime(elapsedSeconds)} / {employee.dwellTimeLimitMinutes || 20}:00
                            </div>
                        </div>
                    </div>
                );
            })}
             {employeesInside.length === 0 && (
                <p className="text-sm text-muted-foreground">No employees currently inside cold rooms.</p>
            )}
          </div>
        </div>
        <ScrollArea className="h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const employee = employeeData.find(e => e.id === log.employeeId);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{employee?.name || log.employeeId}</div>
                      <div className="text-sm text-muted-foreground">{employee?.role}</div>
                    </TableCell>
                    <TableCell>{log.coldRoomId.replace('cr-', 'Cold Room ')}</TableCell>
                    <TableCell>
                        <Badge variant={log.eventType === 'entry' ? 'default' : 'secondary'} className="capitalize flex items-center gap-1">
                            {log.eventType === 'entry' ? <LogIn className="h-3 w-3"/> : <LogOut className="h-3 w-3" />}
                            {log.eventType}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {hasMounted ? formatDistanceToNowStrict(new Date(log.timestamp), { addSuffix: true }) : '...'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

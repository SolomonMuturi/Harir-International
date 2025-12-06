

'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, LogIn, LogOut, Eye, ShieldAlert } from 'lucide-react';
import type { Visitor } from '@/lib/data';
import { employeeData } from '@/lib/data';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

interface VisitorDataTableProps {
  visitors: Visitor[];
  onCheckIn: (visitorId: string) => void;
  onCheckOut: (visitorId: string, isFinal?: boolean) => void;
  onRowClick: (visitor: Visitor) => void;
}

export function VisitorDataTable({ visitors, onCheckIn, onCheckOut, onRowClick }: VisitorDataTableProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const statusVariant = {
    'Checked-in': 'default',
    'Pre-registered': 'secondary',
    'Checked-out': 'outline',
    'Pending Exit': 'destructive',
  } as const;

  const formatTimestamp = (ts?: string) => {
    if (!hasMounted) {
      return <Skeleton className="h-4 w-10" />;
    }
    return ts ? format(new Date(ts), 'HH:mm') : '-';
  }
  
  const getHostName = (hostId?: string) => {
    if (!hostId) return 'N/A';
    const host = employeeData.find(e => e.id === hostId);
    return host ? `${host.name} (${host.role})` : 'Unknown';
  };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Visitor Log
        </CardTitle>
        <CardDescription>
          Live log of all visitor and vehicle movements.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Host / Department</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map((visitor) => (
                <TableRow 
                    key={visitor.id} 
                    onClick={() => onRowClick(visitor)}
                    className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">{visitor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {visitor.company}
                    </div>
                     <div className="text-xs text-muted-foreground font-mono">
                      {visitor.visitorCode}
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="text-sm">{getHostName(visitor.hostId)}</div>
                  </TableCell>
                  <TableCell>
                    {visitor.vehiclePlate ? (
                        <div>
                            <div className="font-mono">{visitor.vehiclePlate}</div>
                            <div className="text-sm text-muted-foreground">{visitor.vehicleType}</div>
                        </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="font-mono">{formatTimestamp(visitor.expectedCheckInTime)}</TableCell>
                   <TableCell className="font-mono">{formatTimestamp(visitor.checkInTime)}</TableCell>
                   <TableCell className="font-mono">{formatTimestamp(visitor.checkOutTime)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[visitor.status]}
                      className="capitalize"
                    >
                      {visitor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onRowClick(visitor); }}>
                          <Eye className="mr-2" />
                          Details
                      </Button>
                      {visitor.status === 'Pre-registered' && user?.role === 'Security' && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onCheckIn(visitor.id); }}>
                              <LogIn className="mr-2" />
                              Check-in
                          </Button>
                      )}
                      {visitor.status === 'Checked-in' && visitor.hostId === user?.id && (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); onCheckOut(visitor.id); }}>
                              <LogOut className="mr-2" />
                              Check-out
                          </Button>
                      )}
                      {visitor.status === 'Pending Exit' && user?.role === 'Security' && (
                           <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onCheckOut(visitor.id, true); }}>
                              <ShieldAlert className="mr-2" />
                              Verify Exit
                          </Button>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

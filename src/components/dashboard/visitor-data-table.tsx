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
import { Users, Eye, ShieldAlert, Car, CheckCircle, Clock, Calendar } from 'lucide-react';
import type { Visitor } from '@/lib/data';
import { employeeData } from '@/lib/data';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

interface VisitorDataTableProps {
  visitors: Visitor[];
  highlightedVisitorId?: string;
  onCheckIn?: (visitorId: string) => void;
  onCheckOut?: (visitorId: string, isFinal?: boolean) => void;
  onRowClick: (visitor: Visitor) => void;
}

export function VisitorDataTable({ 
  visitors, 
  highlightedVisitorId, 
  onCheckIn, 
  onCheckOut, 
  onRowClick 
}: VisitorDataTableProps) {
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

  const isHighlighted = (visitorId: string) => {
    return highlightedVisitorId === visitorId;
  };

  // Get status icon
  const getStatusIcon = (status: Visitor['status']) => {
    switch (status) {
      case 'Checked-in':
        return <CheckCircle className="h-3 w-3" />;
      case 'Pre-registered':
        return <Calendar className="h-3 w-3" />;
      case 'Pending Exit':
        return <Clock className="h-3 w-3" />;
      case 'Checked-out':
        return <Calendar className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-primary" />
          Visitor List
        </CardTitle>
        <CardDescription>
          {visitors.length} visitor{visitors.length !== 1 ? 's' : ''} • Click to select
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card border-b">
              <TableRow>
                <TableHead className="font-semibold">Visitor</TableHead>
                <TableHead className="font-semibold">Host / Department</TableHead>
                <TableHead className="font-semibold">Vehicle</TableHead>
                <TableHead className="font-semibold">Expected</TableHead>
                <TableHead className="font-semibold">Check-in</TableHead>
                <TableHead className="font-semibold">Check-out</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map((visitor) => {
                const highlighted = isHighlighted(visitor.id);
                return (
                  <TableRow 
                    key={visitor.id} 
                    onClick={() => onRowClick(visitor)}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-gray-50 border-b",
                      highlighted 
                        ? "bg-gradient-to-r from-blue-50/80 to-blue-50/50 border-l-4 border-l-blue-500" 
                        : ""
                    )}
                  >
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          highlighted 
                            ? "bg-blue-500 animate-pulse" 
                            : "bg-gray-300"
                        )}></div>
                        <div>
                          <div className={cn(
                            "font-medium",
                            highlighted && "text-blue-700"
                          )}>
                            {visitor.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {visitor.company || 'Individual Visitor'}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-1">
                            ID: {visitor.visitorCode}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{getHostName(visitor.hostId)}</div>
                      {visitor.department && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {visitor.department}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {visitor.vehiclePlate ? (
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-mono font-medium">{visitor.vehiclePlate}</div>
                            <div className="text-sm text-muted-foreground">
                              {visitor.vehicleType || 'Car'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No vehicle</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{formatTimestamp(visitor.expectedCheckInTime)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{formatTimestamp(visitor.checkInTime)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{formatTimestamp(visitor.checkOutTime)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[visitor.status]}
                        className={cn(
                          "capitalize flex items-center gap-1 px-2 py-1",
                          highlighted && "ring-2 ring-blue-200"
                        )}
                      >
                        {getStatusIcon(visitor.status)}
                        {visitor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={cn(
                            "h-8 text-xs",
                            highlighted && "border-blue-300 text-blue-700 bg-blue-50"
                          )}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onRowClick(visitor); 
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        
                        {/* Only show verify button for security on pending exit status */}
                        {visitor.status === 'Pending Exit' && user?.role === 'Security' && onCheckOut && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="h-8 text-xs"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onCheckOut(visitor.id, true); 
                            }}
                          >
                            <ShieldAlert className="mr-1 h-3 w-3" />
                            Verify
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {visitors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">No visitors found</p>
                        <p className="text-sm text-gray-500 mt-1">No data available for this category</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
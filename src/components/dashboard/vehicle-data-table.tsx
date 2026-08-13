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
import { Truck, Eye, ShieldAlert, CheckCircle, Clock, Calendar } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

interface VehicleDataTableProps {
  vehicles: Vehicle[];
  highlightedVehicleId?: string;
  onCheckIn?: (vehicleId: string) => void;
  onCheckOut?: (vehicleId: string, isFinal?: boolean) => void;
  onRowClick: (vehicle: Vehicle) => void;
}

export function VehicleDataTable({ 
  vehicles, 
  highlightedVehicleId, 
  onCheckIn, 
  onCheckOut, 
  onRowClick 
}: VehicleDataTableProps) {
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
    return ts ? format(new Date(ts), 'dd MMM HH:mm') : '-';
  };

  const formatDuration = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return '-';
    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (isNaN(diffMs) || diffMs < 0) return '-';
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  const getStatusIcon = (status: Vehicle['status']) => {
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

  const getVehicleTypeBadge = (vehicleType?: string) => {
    if (!vehicleType) return null;
    
    const type = vehicleType.toLowerCase();
    let variant: "default" | "secondary" | "outline" = "outline";
    let color = "text-gray-600";
    
    if (type.includes('truck')) {
      variant = "default";
      color = "text-blue-700";
    } else if (type.includes('van') || type.includes('pickup')) {
      variant = "secondary";
      color = "text-green-700";
    } else if (type.includes('trailer')) {
      variant = "outline";
      color = "text-amber-700";
    }
    
    return (
      <Badge variant={variant} className={cn("text-xs", color)}>
        {vehicleType}
      </Badge>
    );
  };

  return (
    <Card className="h-full flex flex-col border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5 text-primary" />
          Vehicle List
        </CardTitle>
        <CardDescription>
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} • Click to select
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-340px)] min-h-[320px]">
          <Table className="min-w-[960px]">
            <TableHeader className="sticky top-0 bg-card border-b">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Driver & Vehicle</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Phone</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Registration</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Vehicle Type</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Check-in</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Check-out</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Duration</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => {
                const highlighted = highlightedVehicleId === vehicle.id;
                return (
                  <TableRow 
                    key={vehicle.id} 
                    onClick={() => onRowClick(vehicle)}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-blue-10 border-b",
                      highlighted 
                        ? "bg-gradient-to-r from-blue-50/80 to-blue-50/50 border-l-4 border-l-blue-500" 
                        : ""
                    )}
                  >
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          highlighted 
                            ? "bg-blue-500 animate-pulse" 
                            : "bg-gray-300"
                        )}></div>
                        <div>
                          <div className={cn(
                            "font-medium text-sm leading-tight",
                            highlighted && "text-blue-700"
                          )}>
                            {vehicle.driverName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {vehicle.vehicleCode}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap text-sm">
                      {vehicle.phone || 'N/A'}
                    </TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      {vehicle.vehiclePlate ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium text-sm bg-gray-100 px-2 py-0.5 rounded">
                            {vehicle.vehiclePlate}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {vehicle.idNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No vehicle</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      {getVehicleTypeBadge(vehicle.vehicleType)}
                    </TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      <div className="font-mono text-sm">{formatTimestamp(vehicle.checkInTime)}</div>
                    </TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      <div className="font-mono text-sm">{formatTimestamp(vehicle.checkOutTime)}</div>
                    </TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      <div className="font-mono text-sm">{formatDuration(vehicle.checkInTime, vehicle.checkOutTime)}</div>
                    </TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      <Badge
                        variant={statusVariant[vehicle.status]}
                        className={cn(
                          "capitalize flex items-center gap-1 px-2 py-0.5 text-xs",
                          highlighted && "ring-2 ring-blue-200"
                        )}
                      >
                        {getStatusIcon(vehicle.status)}
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={cn(
                            "h-7 px-2 text-xs",
                            highlighted && "border-blue-300 text-blue-700 bg-blue-50"
                          )}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onRowClick(vehicle); 
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        
                        {/* Only show verify button for security on pending exit status */}
                        {vehicle.status === 'Pending Exit' && user?.role === 'Security' && onCheckOut && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onCheckOut(vehicle.id, true); 
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
              
              {vehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Truck className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">No vehicles found</p>
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
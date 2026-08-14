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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Eye, ShieldAlert, CheckCircle, Clock, Calendar, Phone, IdCard, User as UserIcon, Car, Hash, FileText, Trash2 } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

interface VehicleDataTableProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onCheckIn?: (vehicleId: string) => void;
  onCheckOut?: (vehicleId: string, isFinal?: boolean) => void;
  onDeleteVehicle?: (vehicle: Vehicle) => Promise<void> | void;
  onRowClick: (vehicle: Vehicle) => void;
}

export function VehicleDataTable({ 
  vehicles, 
  selectedVehicleId, 
  onCheckIn, 
  onCheckOut, 
  onDeleteVehicle, 
  onRowClick 
}: VehicleDataTableProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [detailsVehicle, setDetailsVehicle] = useState<Vehicle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const formatFullTimestamp = (ts?: string) => {
    if (!ts) return '-';
    return format(new Date(ts), 'dd MMM yyyy HH:mm:ss');
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
    let color = "text-slate-600";
    
    if (type.includes('truck')) {
      color = "text-blue-700";
    } else if (type.includes('van') || type.includes('pickup')) {
      color = "text-green-700";
    } else if (type.includes('trailer')) {
      color = "text-amber-700";
    }
    
    return (
      <Badge variant="outline" className={cn("text-xs", color)}>
        {vehicleType}
      </Badge>
    );
  };

  const DetailRow = ({ icon: Icon, label, value, className }: { icon: React.ComponentType<{ className?: string }>, label: string, value: React.ReactNode, className?: string }) => (
    <div className={cn("flex items-start gap-3 py-2", className)}>
      <div className="shrink-0 p-2 text-muted-foreground">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-base font-semibold text-foreground mt-1 break-words">{value}</p>
      </div>
    </div>
  );

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
          <Table className="min-w-[680px]">
            <TableHeader className="sticky top-0 bg-card border-b">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Driver Name</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold hidden md:table-cell">Phone Number</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Vehicle Registration</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold hidden lg:table-cell">ID Number</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold hidden lg:table-cell">Vehicle Type</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Check-in</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Check-out</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold hidden lg:table-cell">Duration</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => {
                const selected = selectedVehicleId === vehicle.id;
                return (
                  <TableRow 
                    key={vehicle.id} 
                    onClick={() => onRowClick(vehicle)}
                    className={cn(
                      "cursor-pointer transition-all border-b",
                      "hover:shadow-[inset_1px_0_0_0_#4ade80,inset_-1px_0_0_0_#4ade80]",
                      selected && "shadow-[inset_1px_0_0_0_#4ade80,inset_-1px_0_0_0_#4ade80]"
                    )}
                  >
                    <TableCell className="py-4 px-3 whitespace-nowrap">
                      <div className="font-medium text-sm leading-tight">
                        {vehicle.driverName}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-3 whitespace-nowrap text-sm hidden md:table-cell">
                      {vehicle.phone || 'N/A'}
                    </TableCell>
                    <TableCell className="py-4 px-3 whitespace-nowrap">
                      {vehicle.vehiclePlate ? (
                        <span className="font-mono font-medium text-sm">
                          {vehicle.vehiclePlate}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No vehicle</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-3 whitespace-nowrap text-sm hidden lg:table-cell">
                      {vehicle.idNumber || '—'}
                    </TableCell>
                    <TableCell className="py-4 px-3 whitespace-nowrap hidden lg:table-cell">
                      {getVehicleTypeBadge(vehicle.vehicleType)}
                    </TableCell>
                    <TableCell className="py-4 px-3 whitespace-nowrap">
                      <div className="font-mono text-sm">{formatTimestamp(vehicle.checkInTime)}</div>
                    </TableCell>
                    <TableCell className="py-4 px-3 whitespace-nowrap">
                      <div className="font-mono text-sm">{formatTimestamp(vehicle.checkOutTime)}</div>
                    </TableCell>
                    <TableCell className="py-4 px-3 whitespace-nowrap hidden lg:table-cell">
                      <div className="font-mono text-sm">{formatDuration(vehicle.checkInTime, vehicle.checkOutTime)}</div>
                    </TableCell>
                    <TableCell className="py-4 px-3 whitespace-nowrap">
                      <Badge
                        variant={statusVariant[vehicle.status]}
                        className="capitalize flex items-center gap-1 px-2.5 py-1 text-xs"
                      >
                        {getStatusIcon(vehicle.status)}
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setDetailsVehicle(vehicle); 
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
                            className="h-8 px-3 text-xs"
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

      {/* Vehicle Details Dialog */}
      <Dialog open={!!detailsVehicle} onOpenChange={(open) => !open && setDetailsVehicle(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Truck className="w-5 h-5 text-primary" />
              Vehicle Details
            </DialogTitle>
            <DialogDescription>
              {detailsVehicle?.vehiclePlate || 'No plate'} • {detailsVehicle?.driverName || 'Unknown driver'}
            </DialogDescription>
          </DialogHeader>

          {detailsVehicle && (
            <div className="flex flex-col">
              <div className="flex justify-between items-center gap-3 mb-3">
                {detailsVehicle.visitNumber !== undefined && (
                  <span className="text-sm font-bold text-foreground">
                    Visit #{detailsVehicle.visitNumber}
                  </span>
                )}
                <Badge
                  variant={statusVariant[detailsVehicle.status]}
                  className="capitalize flex items-center gap-1 px-2.5 py-1 text-xs"
                >
                  {getStatusIcon(detailsVehicle.status)}
                  {detailsVehicle.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2">
                <DetailRow icon={UserIcon} label="Driver Name" value={detailsVehicle.driverName || '—'} />
                <DetailRow icon={Phone} label="Phone Number" value={detailsVehicle.phone || '—'} />
                <DetailRow icon={Car} label="Vehicle Registration" value={
                  detailsVehicle.vehiclePlate ? (
                    <span className="font-mono">{detailsVehicle.vehiclePlate}</span>
                  ) : '—'
                } />
                <DetailRow icon={IdCard} label="ID Number" value={detailsVehicle.idNumber || '—'} />
                <DetailRow icon={Car} label="Vehicle Type" value={detailsVehicle.vehicleType || '—'} />
                <DetailRow icon={Hash} label="Gate Entry ID" value={detailsVehicle.gateEntryId || '—'} />
                {detailsVehicle.cargoDescription && (
                  <DetailRow className="sm:col-span-2" icon={FileText} label="Cargo Description" value={detailsVehicle.cargoDescription} />
                )}
                <DetailRow icon={CheckCircle} label="Check-in" value={formatFullTimestamp(detailsVehicle.checkInTime)} />
                <DetailRow icon={CheckCircle} label="Check-out" value={formatFullTimestamp(detailsVehicle.checkOutTime)} />
                <DetailRow icon={Clock} label="Duration" value={formatDuration(detailsVehicle.checkInTime, detailsVehicle.checkOutTime)} />
              </div>

              {onDeleteVehicle && (
                <div className="flex justify-end pt-4 mt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vehicle visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete Visit #{detailsVehicle?.visitNumber}{' '}
              for {detailsVehicle?.driverName || detailsVehicle?.vehiclePlate || 'this vehicle'}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                setConfirmDelete(false);
                if (detailsVehicle && onDeleteVehicle) {
                  try {
                    await onDeleteVehicle(detailsVehicle);
                    setDetailsVehicle(null);
                  } catch {
                    // Parent handler shows the error toast; keep details open.
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

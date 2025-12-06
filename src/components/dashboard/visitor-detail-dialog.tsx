

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import type { Visitor } from '@/lib/data';
import { employeeData } from '@/lib/data';
import { Badge } from '../ui/badge';

interface VisitorDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: Visitor;
}

export function VisitorDetailDialog({
  isOpen,
  onOpenChange,
  visitor,
}: VisitorDetailDialogProps) {

  const statusVariant = {
    'Checked-in': 'default',
    'Pre-registered': 'secondary',
    'Checked-out': 'outline',
    'Pending Exit': 'destructive',
  } as const;
  
  const formatTimestamp = (ts?: string) => {
    return ts ? format(new Date(ts), 'MMM d, yyyy, h:mm a') : 'N/A';
  }
  
  const host = visitor.hostId ? employeeData.find(e => e.id === visitor.hostId) : null;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{visitor.name}</DialogTitle>
          <DialogDescription>
            {visitor.company} - {visitor.visitorCode}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className='flex justify-between items-center'>
                <h4 className="font-semibold">Status</h4>
                <Badge
                    variant={statusVariant[visitor.status]}
                    className="capitalize"
                >
                    {visitor.status}
                </Badge>
            </div>
             <Separator />
             <div>
                <h4 className="font-semibold mb-2">Host</h4>
                 <p>{host ? host.name : 'N/A'}</p>
             </div>
             <Separator />
            <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <p><span className="font-medium text-muted-foreground">ID Number:</span> {visitor.idNumber || 'N/A'}</p>
                <p><span className="font-medium text-muted-foreground">Email:</span> {visitor.email || 'N/A'}</p>
                <p><span className="font-medium text-muted-foreground">Phone:</span> {visitor.phone || 'N/A'}</p>
            </div>
            <Separator />
            <div>
                <h4 className="font-semibold mb-2">Timestamps</h4>
                <p><span className="font-medium text-muted-foreground">Expected:</span> {formatTimestamp(visitor.expectedCheckInTime)}</p>
                <p><span className="font-medium text-muted-foreground">Check-in:</span> {formatTimestamp(visitor.checkInTime)}</p>
                <p><span className="font-medium text-muted-foreground">Check-out:</span> {formatTimestamp(visitor.checkOutTime)}</p>
            </div>
            {visitor.vehiclePlate && (
                <>
                    <Separator />
                    <div>
                        <h4 className="font-semibold mb-2">Vehicle Details</h4>
                        <p><span className="font-medium text-muted-foreground">Plate:</span> {visitor.vehiclePlate}</p>
                        <p><span className="font-medium text-muted-foreground">Type:</span> {visitor.vehicleType}</p>
                    </div>
                </>
            )}
             {(visitor.cargoDescription || visitor.reasonForVisit) && (
                <>
                    <Separator />
                    <div>
                        <h4 className="font-semibold mb-2">Reason for Visit / Cargo</h4>
                        <p className="text-muted-foreground">{visitor.cargoDescription || visitor.reasonForVisit}</p>
                    </div>
                </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

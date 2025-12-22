

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FreshTraceLogo } from '@/components/icons';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import type { Visitor } from '@/lib/data';

interface GatePassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: Visitor;
}

export function GatePassDialog({ isOpen, onOpenChange, visitor }: GatePassDialogProps) {
  if (!visitor) return null;

  const isExitPass = visitor.status === 'Pending Exit';
  const title = isExitPass ? 'Gate Pass - Authorized Exit' : 'Vehicle Badge - On-Site Access';
  const dialogTitle = isExitPass ? 'Gate Pass Generated' : 'Vehicle Badge Generated';
  const dialogDescription = `A ${isExitPass ? 'gate pass' : 'vehicle badge'} has been generated for ${visitor.name}. You can now print it.`;

  const gatePassId = `${isExitPass ? 'GP' : 'VB'}-${new Date().getFullYear()}-${String(visitor.id).slice(-4).toUpperCase()}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/gp/${gatePassId}` : '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl non-printable">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="printable-gate-pass-area border rounded-lg">
          <div className="p-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <FreshTraceLogo className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="text-xl font-bold">Harir Int.</h3>
                  <p className="text-sm text-muted-foreground">info@harirint.com | www.harirint.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="text-right">
                    <h2 className="text-2xl font-bold">{isExitPass ? 'GATE PASS' : 'VEHICLE BADGE'}</h2>
                    <p className="text-muted-foreground font-mono">
                      {gatePassId}
                    </p>
                  </div>
                   <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className="block p-1 bg-white rounded-md w-20 h-20 shadow-md hover:shadow-lg transition-shadow">
                      <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`} 
                          alt="QR Code for verification"
                          className="w-full h-full object-contain"
                      />
                   </a>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h4 className="font-semibold mb-2">Driver Details:</h4>
                    <p><span className="font-medium text-muted-foreground">Name:</span> {visitor.name}</p>
                    <p><span className="font-medium text-muted-foreground">Company:</span> {visitor.company}</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Vehicle Details:</h4>
                    <p><span className="font-medium text-muted-foreground">Plate:</span> {visitor.vehiclePlate}</p>
                    <p><span className="font-medium text-muted-foreground">Type:</span> {visitor.vehicleType}</p>
                </div>
            </div>
             <div className="mt-6">
                <h4 className="font-semibold mb-2">Cargo Description:</h4>
                <p className="text-muted-foreground p-4 border rounded-md min-h-[60px]">
                    {visitor.cargoDescription || 'No items declared.'}
                </p>
            </div>
             <Separator className="my-6" />
             <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                    <p><span className="font-semibold">Check-in Time:</span> {visitor.checkInTime ? format(new Date(visitor.checkInTime), 'MMM d, yyyy, h:mm a') : 'N/A'}</p>
                    {isExitPass && <p><span className="font-semibold">Check-out Time:</span> {visitor.checkOutTime ? format(new Date(visitor.checkOutTime), 'MMM d, yyyy, h:mm a') : 'Pending Exit'}</p>}
                </div>
                 <div className="text-right">
                    <p className="font-semibold">Authorized By: [System]</p>
                 </div>
             </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={() => window.print()}>
                <Printer className="mr-2" />
                Print
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

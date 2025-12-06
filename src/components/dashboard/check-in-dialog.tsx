
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { QrCode, ScanLine, AlertTriangle, VideoOff, Loader2 } from 'lucide-react';
import type { Visitor } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { visitorData } from '@/lib/data';

interface CheckInDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  visitors: Visitor[];
  pendingExitVisitors: Visitor[];
  onCheckIn: (visitorId: string) => void;
  onVerifyExit: (visitorId: string) => void;
}

export function CheckInDialog({ isOpen, onOpenChange, visitors, pendingExitVisitors, onCheckIn, onVerifyExit }: CheckInDialogProps) {
  const { toast } = useToast();
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const readerId = "check-in-qr-reader";

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined' && !scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerId, {
            verbose: false
        });

        Html5Qrcode.getCameras().then(devices => {
          if (devices && devices.length) {
            setHasCameraPermission(true);
          }
        }).catch(() => {
          setHasCameraPermission(false);
        });
      }
    } else {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Cleanup failed to stop scanner.", err));
        setIsScanning(false);
      }
    }
  }, [isOpen]);

  const onScanSuccess = (decodedText: string) => {
    setIsLoading(true);
    stopScanner();

    const urlParts = decodedText.split('/');
    const visitorId = urlParts.find(part => part.startsWith('vis-'));
    const isGatePass = decodedText.includes('/gp/');

    const allVisitors = [...visitors, ...pendingExitVisitors, ...visitorData]; // Include all possible visitors
    const visitor = allVisitors.find(v => v.id === visitorId);
    
    if (visitor) {
        if (isGatePass && visitor.status === 'Pending Exit') {
            onVerifyExit(visitorId);
        } else if (!isGatePass && visitor.status === 'Pre-registered') {
            onCheckIn(visitorId);
        } else {
            toast({
                variant: 'destructive',
                title: 'Invalid Action',
                description: `${visitor.name} has a status of '${visitor.status}'. Scan is not applicable.`,
            });
        }
    } else {
        toast({
            variant: 'destructive',
            title: 'Invalid QR Code',
            description: 'This QR code does not correspond to a valid visitor or action.',
        });
    }

    setIsLoading(false);
  };
  
  const startScanner = () => {
    if (!scannerRef.current || isScanning || hasCameraPermission === false) return;

    setIsScanning(true);
    scannerRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      (errorMessage) => {}
    ).catch(err => {
      toast({
        variant: 'destructive',
        title: 'Scanner Error',
        description: 'Could not start the camera. Please check permissions.',
      });
      setIsScanning(false);
    });
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .then(() => setIsScanning(false))
        .catch(err => console.error("Failed to stop scanner.", err));
    }
  };

  const handleManualAction = () => {
    if (selectedVisitorId) {
      const visitor = [...visitors, ...pendingExitVisitors].find(v => v.id === selectedVisitorId);
      if (visitor?.status === 'Pending Exit') {
        onVerifyExit(selectedVisitorId);
      } else {
        onCheckIn(selectedVisitorId);
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
              <QrCode />
              Visitor Check-in / Verification
          </DialogTitle>
          <DialogDescription>
            Scan a pre-registration QR code to check-in, or scan a gate pass QR code to verify an exit.
          </DialogDescription>
        </DialogHeader>
        
        <div id={readerId} className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center text-muted-foreground">
          {isLoading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Verifying...</p>
            </div>
          )}
          {!isScanning && !isLoading && (
            <div className="text-center p-4">
              {hasCameraPermission === null && <Loader2 className="w-8 h-8 animate-spin" />}
              {hasCameraPermission === false && <AlertTriangle className="w-12 h-12 text-yellow-500" />}
              {hasCameraPermission === true && <VideoOff className="w-12 h-12" />}
              
              <p className="mt-2 text-sm">
                {hasCameraPermission === null && "Checking camera..."}
                {hasCameraPermission === false && "Camera permission denied."}
                {hasCameraPermission === true && "Scanner is ready."}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {isScanning ? (
            <Button onClick={stopScanner} variant="destructive" className="w-full" disabled={isLoading}>Stop Scanning</Button>
          ) : (
            <Button onClick={startScanner} disabled={!hasCameraPermission || isLoading} className="w-full">Start Scanner</Button>
          )}
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
        </div>


        <Command className="mt-4">
          <CommandInput placeholder="Or search visitor by name or code..." />
          <CommandList>
            <CommandEmpty>No matching visitors found.</CommandEmpty>
            <CommandGroup heading="Pending Exit">
              {pendingExitVisitors.map((visitor) => (
                <CommandItem
                  key={visitor.id}
                  value={`${visitor.name} ${visitor.visitorCode}`}
                  onSelect={() => setSelectedVisitorId(visitor.id)}
                  className={selectedVisitorId === visitor.id ? 'bg-accent' : ''}
                >
                  <div className="flex justify-between w-full">
                    <span>{visitor.name} <span className="text-muted-foreground font-mono text-xs">{visitor.visitorCode}</span></span>
                    <span>{visitor.company}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Pre-registered Visitors">
              {visitors.map((visitor) => (
                <CommandItem
                  key={visitor.id}
                  value={`${visitor.name} ${visitor.visitorCode}`}
                  onSelect={() => setSelectedVisitorId(visitor.id)}
                  className={selectedVisitorId === visitor.id ? 'bg-accent' : ''}
                >
                  <div className="flex justify-between w-full">
                    <span>{visitor.name} <span className="text-muted-foreground font-mono text-xs">{visitor.visitorCode}</span></span>
                    <span>{visitor.company}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="flex justify-end">
            <Button onClick={handleManualAction} disabled={!selectedVisitorId || isLoading}>
              {pendingExitVisitors.some(v => v.id === selectedVisitorId) ? 'Verify Exit' : 'Check-in Selected'}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}


'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, ScanLine, AlertTriangle, VideoOff, Loader2, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { weightData, produceData, coldRoomStatusData } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface QrScannerProps {
  onScan: (palletId: string) => void;
}

type ScanType = 'ENTRY' | 'EXIT';

async function logPackageToColdRoom(packageId: string, coldRoomId: string, scanType: ScanType) {
  const response = await fetch('/api/log-entry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      packageId: packageId,
      coldRoomId: coldRoomId,
      scanType: scanType,
    }),
  });

  if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(errorResult.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}


export function QrScanner({ onScan }: QrScannerProps) {
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanType, setScanType] = useState<ScanType>('ENTRY');
  const [coldRoomId, setColdRoomId] = useState<string>('cr-1');
  const readerId = "reader";

  useEffect(() => {
    if (typeof window !== 'undefined') {
      scannerRef.current = new Html5Qrcode(readerId);

      Html5Qrcode.getCameras().then(devices => {
        setHasCameraPermission(devices && devices.length > 0);
      }).catch(err => {
        console.error("Error getting camera devices:", err);
        setHasCameraPermission(false);
      });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on cleanup", err));
      }
    };
  }, []);

  const onScanSuccess = (decodedText: string) => {
    setIsLoading(true);
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
        handleLogEntry(decodedText);
      }).catch(err => {
        console.error("Failed to stop scanner after scan:", err);
        setIsLoading(false);
      });
    } else {
       handleLogEntry(decodedText);
    }
  };
  
  const handleLogEntry = async (packageId: string) => {
    try {
      // --- Zone Mapping & Mismatch Alert Logic ---
      const weightEntry = weightData.find(w => w.palletId.startsWith(packageId));
      const productInfo = produceData.find(p => p.name === weightEntry?.product);
      const roomInfo = coldRoomStatusData.find(r => r.id === coldRoomId);

      if (scanType === 'ENTRY' && productInfo && roomInfo && roomInfo.zoneType && productInfo.category !== roomInfo.zoneType) {
        toast({
            variant: 'destructive',
            title: 'Location Mismatch Alert!',
            description: `${productInfo.name} (${productInfo.category}) cannot be stored in ${roomInfo.name} (Zone: ${roomInfo.zoneType}).`,
            duration: 10000,
        });
        setIsLoading(false);
        return; // Stop further processing
      }
      // --- End of Zone Mapping Logic ---

      const result = await logPackageToColdRoom(packageId, coldRoomId, scanType);
      toast({
        title: "Log Successful",
        description: `Package ${packageId} ${scanType.toLowerCase()} logged for ${roomInfo?.name}.`,
      });
      onScan(packageId); 
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Log Failed',
        description: error.message || 'Could not log package. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const startScanner = () => {
    if (!scannerRef.current || isScanning || hasCameraPermission === false) return;

    setIsScanning(true);
    scannerRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText, decodedResult) => {
        onScanSuccess(decodedText);
      },
      (errorMessage) => {}
    ).catch(err => {
      console.error("Unable to start scanning.", err);
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

  const handleSimulateScan = () => {
    const randomEntry = weightData[Math.floor(Math.random() * weightData.length)];
    const rootPalletId = randomEntry.palletId.split('-').slice(0, 2).join('-');
    onScanSuccess(rootPalletId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Log Package Entry/Exit
        </CardTitle>
        <CardDescription>Scan a final box QR code to log its movement.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Event Type</Label>
                <RadioGroup defaultValue="ENTRY" value={scanType} onValueChange={(v) => setScanType(v as ScanType)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ENTRY" id="entry" />
                        <Label htmlFor="entry" className="flex items-center gap-2"><LogIn /> Log Entry</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="EXIT" id="exit" />
                        <Label htmlFor="exit" className="flex items-center gap-2"><LogOut /> Log Exit</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="space-y-2">
                <Label htmlFor="cold-room-select">Destination</Label>
                <Select value={coldRoomId} onValueChange={setColdRoomId}>
                    <SelectTrigger id="cold-room-select">
                        <SelectValue placeholder="Select a cold room" />
                    </SelectTrigger>
                    <SelectContent>
                    {coldRoomStatusData.map((room) => (
                        <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div id={readerId} className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center text-muted-foreground">
          {isLoading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Logging Scan...</p>
            </div>
          )}
          {!isScanning && !isLoading && (
            <div className="text-center p-4">
              {hasCameraPermission === false ? (
                 <div className="flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-400 mb-2" />
                  <h3 className="font-semibold">Camera Access Denied</h3>
                  <p className="text-xs">Please allow camera access.</p>
                </div>
              ) : (
                <VideoOff className="w-12 h-12" />
              )}
              <p className="text-sm">Scanner is off</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {isScanning ? (
            <Button onClick={stopScanner} variant="destructive" className="w-full" disabled={isLoading}>
              Stop Scanner
            </Button>
          ) : (
            <Button onClick={startScanner} disabled={hasCameraPermission === false || isLoading} className="w-full">
              Start Scanner
            </Button>
          )}

          <Button onClick={handleSimulateScan} variant="outline" className="w-full" disabled={isLoading}>
            <QrCode className="mr-2" />
            Simulate Scan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

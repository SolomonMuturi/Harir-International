

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, QrCode, Weight, Eye, Share2, FileText, FlaskConical, DollarSign, Loader2 } from 'lucide-react';
import type { Shipment, ShipmentStatus } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';
import { getShipmentLaborCost } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShipmentDataTableProps {
  shipments: Shipment[];
  onRecordWeight: (shipmentId: string) => void;
  onManageTags: (shipmentId: string) => void;
  onViewDetails: (shipmentId: string) => void;
  onViewNote?: (shipmentId: string) => void;
  onViewManifest?: (shipmentId: string) => void;
}

export function ShipmentDataTable({
  shipments,
  onRecordWeight,
  onManageTags,
  onViewDetails,
  onViewNote,
  onViewManifest,
}: ShipmentDataTableProps) {
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoadingCost, setIsLoadingCost] = useState<string | null>(null);
  const [costResult, setCostResult] = useState<any>(null);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);


  useEffect(() => {
    setHasMounted(true);
  }, []);

  const statusVariant: Record<ShipmentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    'Awaiting QC': 'destructive',
    'Receiving': 'secondary',
    'Processing': 'default',
    'Preparing for Dispatch': 'secondary',
    'Ready for Dispatch': 'default',
    'In-Transit': 'default',
    'Delivered': 'outline',
    'Delayed': 'destructive',
  };
  
  const handleShare = (shipment: Shipment) => {
    const shareUrl = `${window.location.origin}/shipments/${shipment.id}/details`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link Copied!',
      description: `A shareable link for shipment ${shipment.shipmentId} has been copied to your clipboard.`,
    });
  };
  
  const handleCalculateCost = async (shipment: Shipment) => {
    setIsLoadingCost(shipment.id);
    const weightMatch = shipment.weight.match(/(\d+(\.\d+)?)/);
    const weightKg = weightMatch ? parseFloat(weightMatch[0]) : 0;

    if (weightKg === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Calculate Cost',
        description: 'Shipment weight is not available.',
      });
      setIsLoadingCost(null);
      return;
    }
    
    const result = await getShipmentLaborCost({ product: shipment.product, weightKg });
    setCostResult(result);
    setIsCostDialogOpen(true);
    setIsLoadingCost(null);
  };


  const formatTimestamp = (ts?: string) => {
    if (!hasMounted) {
      return <Skeleton className="h-4 w-24" />;
    }
    return ts ? format(new Date(ts), 'MMM d, HH:mm') : '-';
  }


  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Shipment Notice Board
          </CardTitle>
          <CardDescription>
            An overview of shipments and their current status.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Expected Arrival</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow 
                    key={shipment.id}
                    onClick={() => onViewDetails(shipment.shipmentId)}
                    className={cn(
                      'cursor-pointer',
                      (shipment.status === 'Delayed' || shipment.status === 'Awaiting QC') && 'bg-destructive/10'
                    )}
                  >
                    <TableCell className="font-mono">{shipment.shipmentId}</TableCell>
                    <TableCell>{shipment.customer}</TableCell>
                    <TableCell>
                      <div className="font-medium">{shipment.origin}</div>
                      <div className="text-sm text-muted-foreground">{shipment.destination}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatTimestamp(shipment.expectedArrival)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[shipment.status]}>
                        {shipment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{shipment.weight}</TableCell>
                    <TableCell className='font-mono text-xs'>{shipment.tags}</TableCell>
                    <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      {onViewManifest && <Button size="sm" variant="outline" onClick={() => onViewManifest(shipment.id)}>Manifest</Button>}
                      <Button size="sm" onClick={() => onViewDetails(shipment.shipmentId)}>
                        <Eye />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estimated Labor Cost</DialogTitle>
            <DialogDescription>
              Labor cost estimation for processing this shipment.
            </DialogDescription>
          </DialogHeader>
          {costResult && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
                <p className="text-4xl font-bold">KES {costResult.estimatedCost.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Based on {costResult.estimatedHours.toFixed(1)} estimated labor hours.</p>
              </div>
              <div className="text-center">
                  <a href="#" className="text-sm text-primary underline">Download Detailed Report</a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

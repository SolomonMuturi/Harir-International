
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Copy, Printer, QrCode, Edit } from 'lucide-react';
import type { TagBatch } from '@/lib/data';
import { shipmentData, customerData, employeeData } from '@/lib/data';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface TagBatchTableProps {
  tagBatches: TagBatch[];
  onEdit: (batch: TagBatch) => void;
}

export function TagBatchTable({ tagBatches, onEdit }: TagBatchTableProps) {
  const router = useRouter();
  const [previewingBatch, setPreviewingBatch] = useState<TagBatch | null>(null);
  const { toast } = useToast();

  const statusVariant = {
    active: 'default',
    printed: 'secondary',
    archived: 'outline',
  } as const;
  
  const getShipmentIdFromShipmentIdentifier = (shipmentId: string | undefined) => {
    if (!shipmentId) return undefined;
    const shipment = shipmentData.find(s => s.shipmentId === shipmentId);
    return shipment ? shipment.id : undefined;
  }
  
  const getCustomerIdFromClientName = (clientName: string | undefined) => {
      if (!clientName) return undefined;
      return customerData.find(c => c.name === clientName)?.id;
  }

  const generateQrData = (batch: TagBatch, index: number) => {
    const officerName = employeeData.find(e => e.id === batch.officerId)?.name;
    const data = {
      tagId: `${batch.batchId}-${String(index + 1).padStart(4, '0')}`,
      batchId: batch.batchId,
      shipmentId: batch.shipmentId,
      client: batch.client,
      assetName: batch.product,
      officer: officerName,
    };
    return JSON.stringify(data);
  };

  const handlePrint = () => {
    const printableArea = document.querySelector('.printable-qr-area');
    if (printableArea) {
      document.body.classList.add('printing-active');
      window.print();
      document.body.classList.remove('printing-active');
    }
  };

  const handleSaveBatch = () => {
    if (previewingBatch) {
      // In a real app, this would be an API call. Here we just show a toast.
      toast({ title: 'Batch Saved', description: `Batch ${previewingBatch.batchId} would be saved here.` });
      setPreviewingBatch(null);
    }
  };


  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Recent Tag Batches &amp; Assets</CardTitle>
          <CardDescription>
            Overview of recently generated QR codes for products and equipment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-[450px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Product/Asset</TableHead>
                  <TableHead>Client / Shipment</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagBatches.map((batch) => {
                  const shipmentId = getShipmentIdFromShipmentIdentifier(batch.shipmentId);
                  const customerId = getCustomerIdFromClientName(batch.client);

                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-xs">
                        {batch.batchId}
                      </TableCell>
                      <TableCell>{batch.product}</TableCell>
                      <TableCell>
                        {batch.client && (
                          <Link
                            href={customerId ? `/customers/${customerId}` : '#'}
                            className="text-primary hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {batch.client}
                          </Link>
                        )}
                        {batch.shipmentId && (
                          <Link
                             href={shipmentId ? `/traceability?shipmentId=${batch.shipmentId}` : '#'}
                            className="block text-sm text-muted-foreground hover:underline font-mono"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {batch.shipmentId}
                          </Link>
                        )}
                         {!batch.client && !batch.shipmentId && (
                          <span className="text-sm text-muted-foreground">Internal Asset</span>
                        )}
                      </TableCell>
                      <TableCell>{batch.quantity}</TableCell>
                      <TableCell>
                        {format(new Date(batch.generatedAt), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[batch.status]}
                          className="capitalize"
                        >
                          {batch.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => onEdit(batch)}>
                            <Edit className="mr-2" />
                            Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Dialog open={!!previewingBatch} onOpenChange={(open) => !open && setPreviewingBatch(null)}>
        {previewingBatch && (
            <DialogContent className="sm:max-w-2xl non-printable">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        Preview QR Codes for Batch {previewingBatch.batchId}
                    </DialogTitle>
                    <DialogDescription>
                        Confirm the details below. Save the batch to add it to the main list.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/50 p-8">
                    <div className="absolute top-2 right-2 flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {}}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Print</span>
                        </Button>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                         <div className="bg-white p-2 rounded-md">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(generateQrData(previewingBatch, 0))}`}
                                alt={`QR Code 1`}
                                className="w-full h-full object-contain"
                            />
                         </div>
                        <div className="text-center">
                            <p className="font-semibold">{previewingBatch.product}</p>
                            <p className="text-sm text-muted-foreground">{previewingBatch.client}</p>
                            <p className="text-xs font-mono text-muted-foreground">{previewingBatch.batchId}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(previewingBatch.generatedAt), 'PPP p')}</p>
                        </div>
                    </div>
                     {previewingBatch.quantity > 1 && <p className="text-xs text-muted-foreground text-center mt-2">Showing 1 of {previewingBatch.quantity} unique QR codes. Use "Print" to get the full sheet.</p>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setPreviewingBatch(null)}>Cancel</Button>
                    <Button variant="secondary" onClick={handlePrint}>
                        <Printer className="mr-2" />
                        Print Codes
                    </Button>
                    <Button onClick={handleSaveBatch}>Save Batch</Button>
                </div>
            </DialogContent>
        )}
      </Dialog>

      {previewingBatch && (
         <div className="printable-area hidden">
            <div className="printable-qr-area">
                <h2 className='text-xl font-bold mb-4'>QR Codes for Batch {previewingBatch.batchId}</h2>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {Array.from({ length: previewingBatch.quantity }).map((_, i) => (
                        <div key={i} className="bg-white p-1 rounded-sm break-inside-avoid">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(generateQrData(previewingBatch, i))}`}
                                alt={`QR Code ${i+1}`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ))}
                </div>
            </div>
         </div>
      )}
    </>
  );
}

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FreshTraceLogo } from '@/components/icons';
import { format } from 'date-fns';
import { Printer, QrCode } from 'lucide-react';
import type { WeightEntry } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface FinalTagDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  weightEntry: WeightEntry;
}

export function FinalTagDialog({
  isOpen,
  onOpenChange,
  weightEntry,
}: FinalTagDialogProps) {
  if (!weightEntry) return null;

  // Safely get the net weight with fallback
  const getNetWeight = () => {
    const netWeight = weightEntry.netWeight || weightEntry.net_weight || 0;
    return typeof netWeight === 'number' ? netWeight : parseFloat(netWeight as any) || 0;
  };

  // Safely get the pallet ID with fallback
  const getPalletId = () => {
    return weightEntry.palletId || weightEntry.pallet_id || '';
  };

  // Safely get the unit
  const getUnit = () => {
    return weightEntry.unit || 'kg';
  };

  // Safely get the product
  const getProduct = () => {
    return weightEntry.product || '';
  };

  // Safely get the client
  const getClient = () => {
    return weightEntry.client || weightEntry.supplier || '';
  };

  // Safely get the timestamp
  const getTimestamp = () => {
    return weightEntry.timestamp || weightEntry.created_at || new Date().toISOString();
  };

  // Safely get products array
  const getProducts = () => {
    return weightEntry.products || [];
  };

  const generateQrData = () => {
    const data = {
      tagId: `${getPalletId()}-final`,
      palletId: getPalletId(),
      client: getClient(),
      product: getProduct(),
      weight: `${getNetWeight().toFixed(1)} ${getUnit()}`,
      timestamp: getTimestamp(),
      products: getProducts()
    };
    return JSON.stringify(data);
  };

  const verificationUrl = generateQrData();

  const handlePrint = () => {
    const printableArea = document.querySelector('.printable-final-tag-area');
    if (printableArea) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Tag</title>');
            printWindow.document.write('<style>@media print { @page { size: 4in 3in; margin: 0; } body { margin: 0; padding: 0.15rem; font-family: sans-serif; -webkit-print-color-adjust: exact; } .tag-card { border: 2px solid black; padding: 0.25rem; width: 100%; height: 100%; display: flex; flex-direction: column; } .logo { display: flex; align-items: center; gap: 0.5rem; } .logo-svg { width: 24px; height: 24px; } .logo-text { font-weight: bold; font-size: 14px; } .content-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 0.25rem; align-items: start; margin-top: 4px; } .qr-code { width: 100%; height: auto; } .details { font-size: 9px; } .details p { margin: 1px 0; } .weight-display { font-size: 1.5rem; font-weight: bold; text-align: right; } table { width: 100%; border-collapse: collapse; font-size: 8px; } th, td { border: 1px solid #ddd; padding: 1px 2px; text-align: left; } th { background-color: #f2f2f2; } }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printableArea.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { // Timeout to ensure content is rendered
              printWindow.print();
              printWindow.close();
            }, 250);
        }
    }
  };

  // Get the net weight value safely
  const netWeightValue = getNetWeight();
  const palletId = getPalletId();
  const unit = getUnit();
  const product = getProduct();
  const client = getClient();
  const timestamp = getTimestamp();
  const products = getProducts();

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md non-printable">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode />
            Final Pallet Sticker Ready
          </DialogTitle>
          <DialogDescription>
            The final sticker for pallet {palletId} is ready. Print this tag to apply to the pallet.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/50 p-8">
            <div className="bg-white p-2 rounded-md">
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`} 
                    alt="Final QR Code Tag"
                    className="w-full h-full object-contain"
                />
            </div>
            <div className='text-center'>
                <p className="font-bold text-lg">{product}</p>
                <p className="text-muted-foreground">{client}</p>
                <p className="font-mono text-sm">{palletId}</p>
                <p className="font-bold text-2xl">{netWeightValue.toFixed(1)} {unit}</p>
            </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2" />
            Print Sticker
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Hidden printable area */}
    <div className="printable-final-tag-area hidden">
        <div className="tag-card">
            <div className="logo">
                <FreshTraceLogo className="logo-svg" />
                <span className="logo-text">FreshTrace</span>
            </div>
            <div className="content-grid">
              <div>
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`} 
                    alt="Final QR Code Tag"
                    className="qr-code"
                />
              </div>
              <div className="details">
                  <p><b>Product:</b> {product}</p>
                  <p><b>Client:</b> {client}</p>
                  <p><b>ID:</b> {palletId}</p>
                  <p><b>Date:</b> {format(new Date(timestamp), 'yyyy-MM-dd HH:mm')}</p>
                  <p><b>Crates:</b> {weightEntry.number_of_crates || weightEntry.numberOfCrates || 30}</p>
                  <div className="weight-display">{netWeightValue.toFixed(1)} {unit}</div>
              </div>
            </div>
             {products && products.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Wt/Box</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p, i) => (
                                <tr key={i}>
                                    <td>{p.product}</td>
                                    <td>{p.quantity}</td>
                                    <td>{p.weight} kg</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
    </>
  );
}
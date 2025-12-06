

'use client';

import { useRef } from 'react';
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
import { Printer } from 'lucide-react';
import type { WeightEntry } from '@/lib/data';
import { employeeData } from '@/lib/data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Image from 'next/image';

interface PrintableWeightReceiptProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entry: WeightEntry;
}

export function PrintableWeightReceipt({
  isOpen,
  onOpenChange,
  entry,
}: PrintableWeightReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  if (!entry) return null;

  const ticketId = `WT-${new Date(entry.timestamp).getFullYear()}-${String(entry.palletId).slice(-5)}`;
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/wt/${ticketId}` : '';
  const driverDetails = employeeData.find(e => e.id === entry.driverId);
  const photoUrls = entry.photoEvidence ? entry.photoEvidence.map(file => URL.createObjectURL(file)) : [];

  const handlePrint = async () => {
    const element = printRef.current;
    if (element) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });
      const data = canvas.toDataURL('image/jpeg');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const pdfHeight = imgHeight * ratio;
      
      pdf.addImage(data, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${ticketId}.pdf`);
    }
  };
  
  const formatTruckId = (id: string | undefined) => {
    if (!id) return '';
    const match = id.match(/^([A-Z]{3})([0-9]{3}[A-Z])$/);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
    return id;
  };

  const renderReportContent = () => (
    <div className="font-sans text-black bg-white" style={{ width: '210mm', minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
        <div className="p-8">
            {/* Header */}
            <header className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <FreshTraceLogo className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold">Weight Ticket</h1>
                        <p className="text-xs text-gray-500">FreshTrace Inc.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="text-right">
                         <div className="bg-blue-600 px-4 py-2 rounded-md inline-block text-white">
                            <span className="font-bold">Tag Date:</span> {format(new Date(entry.timestamp), 'dd-MM-yyyy')} {' '}
                            <span className="font-bold">Time:</span> {format(new Date(entry.timestamp), 'HH:mm')}
                        </div>
                        <p className="font-mono text-xs mt-2">{ticketId}</p>
                    </div>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(verificationUrl)}`} 
                      alt="QR Code"
                      className="w-[70px] h-[70px]"
                    />
                </div>
            </header>

            {/* Details Section */}
            <section className="grid grid-cols-2 gap-8 mb-8 text-xs">
                <div className="space-y-2">
                    <h2 className="text-base font-semibold border-b pb-1 mb-2">Vehicle & Driver Details</h2>
                    <div className="flex justify-between"><span className="text-gray-600">Vehicle No.:</span> <span className="font-semibold">{formatTruckId(entry.truckId)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Driver:</span> <span className="font-semibold">{driverDetails?.name || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Driver ID:</span> <span className="font-semibold">{driverDetails?.idNumber || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Phone:</span> <span className="font-semibold">{driverDetails?.phone || 'N/A'}</span></div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-base font-semibold border-b pb-1 mb-2">Shipment Details</h2>
                    <div className="flex justify-between"><span className="text-gray-600">Supplier:</span> <span className="font-semibold">{entry.supplier || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Customer:</span> <span className="font-semibold">{entry.client || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Product:</span> <span className="font-semibold">{entry.product}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Shipment/Pallet ID:</span> <span className="font-mono">{entry.palletId}</span></div>
                </div>
            </section>

            {/* Weighment Section */}
            <section className="mb-8">
                <h2 className="text-base font-semibold border-b pb-1 mb-2">Weighment Details</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-xs text-gray-600">Gross Weight</p>
                        <p className="text-2xl font-bold font-mono">{(entry.grossWeight || 0).toLocaleString()} kg</p>
                    </div>
                     <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-xs text-gray-600">Tare Weight</p>
                        <p className="text-2xl font-bold font-mono">{(entry.tareWeight || 0).toLocaleString()} kg</p>
                    </div>
                     <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                        <p className="text-xs text-green-800">Net Weight</p>
                        <p className="text-2xl font-bold text-green-800 font-mono">{(entry.netWeight || 0).toLocaleString()} kg</p>
                    </div>
                </div>
            </section>
            
            {/* Photo & Signatures */}
            <section className="grid grid-cols-2 gap-8 pt-8" style={{ pageBreakInside: 'avoid' }}>
                <div>
                    <h2 className="text-base font-semibold mb-2">Photo Evidence</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {photoUrls.length > 0 ? (
                            photoUrls.map((url, index) => (
                               <div key={index} className="aspect-video w-full bg-gray-200 rounded-md border flex items-center justify-center">
                                    <img src={url} alt={`Evidence ${index + 1}`} className="object-contain max-h-full max-w-full" />
                               </div>
                            ))
                        ) : (
                             <>
                                <div className="aspect-video w-full bg-gray-200 rounded-md border flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">No Photo</span>
                                </div>
                                <div className="aspect-video w-full bg-gray-200 rounded-md border flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">No Photo</span>
                                </div>
                             </>
                        )}
                    </div>
                </div>
                <div className="flex flex-col">
                    <h2 className="text-base font-semibold mb-2">Signatures</h2>
                    <div className="space-y-16 mt-4 flex-grow flex flex-col justify-end">
                        <div>
                            <div className="border-b border-gray-400 mt-16"></div>
                            <p className="text-xs text-gray-600 mt-1">Weighbridge Operator</p>
                        </div>
                         <div>
                            <div className="border-b border-gray-400 mt-16"></div>
                            <p className="text-xs text-gray-600 mt-1">Driver</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
                This is an electronically generated report from the FreshTrace system.
            </footer>
        </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Weight Ticket</DialogTitle>
            <DialogDescription>
              Report for Vehicle No. {formatTruckId(entry.truckId)}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto border rounded-lg">
            <div ref={printRef}>
              {renderReportContent()}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

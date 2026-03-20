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
import { Printer, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define the type based on your database structure
interface QualityCheck {
  id: string;
  shipment_id: string;
  product: string;
  declared_weight: number;
  net_weight: number;
  rejected_weight: number;
  accepted_weight: number;
  arrival_temperature: number;
  packaging_status: string;
  freshness_status: string;
  seals_status: string;
  overall_status: string;
  notes?: string;
  processed_at: string;
  processed_by: string;
}

interface ProcessedShipment {
  id: string;
  shipment_id: string;
  customer: string;
  product: string;
  weight: string;
  finalStatus: string;
  processedAt: string;
  processedBy: string;
  qualityCheck: QualityCheck;
}

interface GoodsReceivedNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: ProcessedShipment | null;
}

// Define quality checklist items locally
const qualityChecklistItems = [
  { id: 'packaging', label: 'Packaging Check', description: 'Check for proper packaging and labeling' },
  { id: 'freshness', label: 'Freshness Check', description: 'Check product freshness and quality' },
  { id: 'seals', label: 'Seals Check', description: 'Check for proper seals and temperature indicators' },
];

export function GoodsReceivedNoteDialog({
  isOpen,
  onOpenChange,
  shipment,
}: GoodsReceivedNoteDialogProps) {
  const { user: receivingOfficer } = useUser();
  const printRef = useRef<HTMLDivElement>(null);

  if (!shipment) return null;

  const { qualityCheck } = shipment;
  const noteId = `GRN-${new Date().getFullYear()}-${String(shipment.id).slice(-4)}`;
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/grn/${noteId}`
    : '';

  // Calculate weights
  const rejectedWeight = qualityCheck.rejected_weight || 0;
  const acceptedWeight = qualityCheck.accepted_weight || 0;
  const declaredWeight = qualityCheck.declared_weight || 0;
  const netWeight = qualityCheck.net_weight || 0;

  // Create quality checks object from the database structure
  const qualityChecks = {
    packaging: {
      status: qualityCheck.packaging_status || 'accepted',
      rejectedWeight: qualityCheck.packaging_status === 'rejected' ? (rejectedWeight / 3) : 0,
      notes: qualityCheck.notes || '',
    },
    freshness: {
      status: qualityCheck.freshness_status || 'accepted',
      rejectedWeight: qualityCheck.freshness_status === 'rejected' ? (rejectedWeight / 3) : 0,
      notes: qualityCheck.notes || '',
    },
    seals: {
      status: qualityCheck.seals_status || 'accepted',
      rejectedWeight: qualityCheck.seals_status === 'rejected' ? (rejectedWeight / 3) : 0,
      notes: qualityCheck.notes || '',
    },
  };

  const rejectedItems = Object.entries(qualityChecks)
    .filter(([, value]) => value.status === 'rejected' && (value.rejectedWeight || 0) > 0)
    .map(([key, value]) => ({
      label: qualityChecklistItems.find(item => item.id === key)?.label,
      weight: value.rejectedWeight,
      notes: value.notes
    }));

  const totalRejectedWeight = rejectedItems.reduce((acc, item) => acc + (item.weight || 0), 0);

  const handlePrint = async () => {
    const element = printRef.current;
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = pdfWidth / imgWidth;
        const pdfHeight = imgHeight * ratio;
        
        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${noteId}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const renderNoteContent = () => (
    <div style={{ fontFamily: 'sans-serif', color: '#000', background: '#fff', minWidth: '210mm' }}>
        <div style={{ padding: '32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        <td style={{ verticalAlign: 'top', width: '50%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <FreshTraceLogo className="h-12 w-12 text-primary" />
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Harir Int.</h3>
                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>info@harirint.com | www.harirint.com</div>
                                </div>
                            </div>
                        </td>
                        <td style={{ verticalAlign: 'top', textAlign: 'right', width: '50%' }}>
                             <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Goods Received Note</h2>
                                    <div style={{ fontFamily: 'monospace', color: '#666' }}>{noteId}</div>
                                </div>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verificationUrl)}`} 
                                    alt="QR Code"
                                    style={{ width: '80px', height: '80px' }}
                                />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <hr style={{ margin: '24px 0', border: '0', borderTop: '1px solid #eee' }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                    <tr>
                        <td style={{ verticalAlign: 'top', paddingRight: '16px', width: '33.33%' }}>
                            <h4 style={{ fontWeight: '600', marginBottom: '8px', margin: 0 }}>Shipment Details</h4>
                            <div><span style={{ fontWeight: '500', color: '#666' }}>ID:</span> {shipment.shipment_id || 'N/A'}</div>
                            <div><span style={{ fontWeight: '500', color: '#666' }}>Product:</span> {shipment.product}</div>
                        </td>
                        <td style={{ verticalAlign: 'top', paddingRight: '16px', width: '33.33%' }}>
                            <h4 style={{ fontWeight: '600', marginBottom: '8px', margin: 0 }}>Customer</h4>
                            <div>{shipment.customer}</div>
                            <div>{shipment.weight}</div>
                        </td>
                        <td style={{ verticalAlign: 'top', width: '33.33%' }}>
                            <h4 style={{ fontWeight: '600', marginBottom: '8px', margin: 0 }}>Receiving Details</h4>
                            <div><span style={{ fontWeight: '500', color: '#666' }}>Date:</span> {format(new Date(shipment.processedAt), 'MMM d, yyyy, h:mm a')}</div>
                            <div><span style={{ fontWeight: '500', color: '#666' }}>Temp:</span> {qualityCheck.arrival_temperature || 0}°C</div>
                            <div><span style={{ fontWeight: '500', color: '#666' }}>Officer:</span> {shipment.processedBy}</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <hr style={{ margin: '24px 0', border: '0', borderTop: '1px solid #eee' }} />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                 <tbody>
                    <tr>
                        <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '16px' }}>
                            <h4 style={{ fontWeight: '600', marginBottom: '8px', margin: 0 }}>Weight Details</h4>
                            <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Declared Weight:</span> 
                                  <span>{declaredWeight.toFixed(2)} kg</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                  <span>Net Weighed:</span> 
                                  <span>{netWeight.toFixed(2)} kg</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 'bold', color: '#dc2626' }}>
                                  <span>Rejected Weight:</span> 
                                  <span>{totalRejectedWeight.toFixed(2)} kg</span>
                                </div>
                                <hr style={{ margin: '8px 0', border: '0', borderTop: '1px solid #eee' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                  <span>Accepted Weight:</span> 
                                  <span>{acceptedWeight.toFixed(2)} kg</span>
                                </div>
                            </div>
                        </td>
                         <td style={{ width: '50%', verticalAlign: 'top' }}>
                            <h4 style={{ fontWeight: '600', marginBottom: '8px', margin: 0 }}>Quality Control Summary</h4>
                            <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', fontSize: '0.875rem' }}>
                            {qualityChecklistItems.map((item) => {
                                const check = qualityChecks[item.id as keyof typeof qualityChecks];
                                const status = check?.status || 'accepted';
                                const rejectedWeight = check?.rejectedWeight || 0;
                                const notes = check?.notes;
                                
                                return (
                                <div key={item.id} style={{ marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{item.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          {getStatusIcon(status)}
                                          {status === 'accepted' ? (
                                              <span style={{ fontWeight: '500', color: '#16a34a' }}>Accepted</span>
                                          ) : (
                                              <span style={{ fontWeight: '500', color: '#dc2626' }}>
                                                Rejected ({rejectedWeight.toFixed(2)} kg)
                                              </span>
                                          )}
                                        </div>
                                    </div>
                                    {status === 'rejected' && notes && (
                                        <div style={{ fontSize: '0.75rem', color: '#666', paddingLeft: '8px', borderLeft: '2px solid #f87171', marginTop: '4px' }}>
                                            Note: {notes}
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                            <hr style={{ margin: '8px 0', border: '0', borderTop: '1px solid #eee' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', marginTop: '8px' }}>
                                <span>Overall Decision:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {getStatusIcon(qualityCheck.overall_status)}
                                    <span style={{ 
                                      color: qualityCheck.overall_status === 'approved' ? '#16a34a' : '#dc2626',
                                      textTransform: 'capitalize'
                                    }}>
                                      {qualityCheck.overall_status || 'pending'}
                                    </span>
                                </div>
                            </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ display: 'flex', width: '100%', pageBreakInside: 'avoid' }}>
                <div style={{ width: '50%', paddingRight: '16px' }}>
                    <h4 style={{ fontWeight: '600', marginBottom: '8px', margin: 0 }}>QC Notes</h4>
                    <div style={{ 
                      width: '100%', 
                      minHeight: '120px', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '8px', 
                      padding: '16px',
                      border: '1px solid #eee',
                      fontSize: '0.875rem'
                    }}>
                        {qualityCheck.notes ? (
                            <div>{qualityCheck.notes}</div>
                        ) : (
                            <span style={{ color: '#666' }}>No additional notes provided.</span>
                        )}
                    </div>
                </div>
                <div style={{ width: '50%' }}>
                    <h4 style={{ fontWeight: '600', marginBottom: '8px', margin: 0 }}>Signatures</h4>
                    <div style={{ marginTop: '24px' }}>
                        <div style={{ borderBottom: '1px dashed #999', paddingBottom: '32px' }}></div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Receiving Officer</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{shipment.processedBy}</div>
                    </div>
                    <div style={{ marginTop: '24px' }}>
                        <div style={{ borderBottom: '1px dashed #999', paddingBottom: '32px' }}></div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>QC Officer</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{receivingOfficer?.name || 'QC Officer'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          Date: {format(new Date(shipment.processedAt), 'MMM d, yyyy')}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#666', marginTop: '16px' }}>
                        Generated on: {format(new Date(), 'MMM d, yyyy, h:mm:ss a')}
                    </div>
                </div>
            </div>

            <hr style={{ margin: '24px 0', border: '0', borderTop: '1px solid #eee' }} />
            
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666' }}>
                <div>This document confirms receipt of the shipment subject to the quality checks and weights noted above.</div>
                <div>Verification URL: {verificationUrl}</div>
                <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                  Note: This is an electronically generated Goods Received Note.
                </div>
            </div>
        </div>
    </div>
  );

  return (
      <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                <DialogHeader>
                <DialogTitle>Goods Received Note Generated</DialogTitle>
                <DialogDescription>
                    A GRN has been generated for shipment{' '}
                    {shipment.shipment_id || shipment.id}. You can now print it for your records.
                </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                    <div ref={printRef} style={{ width: '100%' }}>
                       {renderNoteContent()}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
                        <Printer className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </>
  );
}
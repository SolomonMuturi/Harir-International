
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Copy, Printer, Share2 } from 'lucide-react';
import type { Visitor } from '@/lib/data';

interface RegistrationSuccessProps {
  visitor: Visitor;
  onDone: () => void;
}

export function RegistrationSuccess({ visitor, onDone }: RegistrationSuccessProps) {
  const { toast } = useToast();
  const registrationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/visitors/${visitor.id}/details` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl);
    toast({
      title: 'Link Copied',
      description: 'Registration link copied to clipboard.',
    });
  };

  const handlePrint = () => {
    // This is a simplified print. A real app would have a dedicated print view.
    const printContent = `
      <h1>Visitor Pre-registration</h1>
      <p><strong>Name:</strong> ${visitor.name}</p>
      <p><strong>Company:</strong> ${visitor.company}</p>
      <p><strong>Visitor Code:</strong> ${visitor.visitorCode}</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registrationUrl)}" alt="QR Code" />
    `;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Registration Successful</h2>
      <p className="text-muted-foreground mb-1">
        {visitor.name} from {visitor.company} has been pre-registered.
      </p>
      <p className="font-mono bg-muted rounded-md px-2 py-1 text-sm mb-6">
        Visitor Code: {visitor.visitorCode}
      </p>
      <div className="w-full flex flex-col items-center gap-4 border bg-muted/50 p-6 rounded-lg">
        <p className="text-sm">Share this registration with the visitor:</p>
         <div className="bg-white p-2 rounded-md">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
              registrationUrl
            )}`}
            alt="QR Code for registration"
          />
        </div>
        <div className="flex gap-2 w-full">
            <Button variant="outline" className="w-full" onClick={handleCopy}>
                <Copy className="mr-2" />
                Copy Link
            </Button>
            <Button variant="outline" className="w-full" onClick={handlePrint}>
                <Printer className="mr-2" />
                Print
            </Button>
        </div>
      </div>
       <Button onClick={onDone} className="w-full mt-6">
        Done
      </Button>
    </div>
  );
}

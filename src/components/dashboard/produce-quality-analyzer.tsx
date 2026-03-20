
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, FileImage, ThumbsUp, ThumbsDown } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { productList, shipmentData } from '@/lib/data';
import { Textarea } from '../ui/textarea';

export function ProduceQualityAnalyzer() {
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedShipment, setSelectedShipment] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDecision = (decision: 'Approve' | 'Reject') => {
    if (!photoPreview || !selectedProduct || !selectedShipment) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please select a shipment, product, and upload a photo before making a decision.',
        });
        return;
    }

    toast({
        title: `Shipment Batch ${decision}d`,
        description: `Notes: "${notes || 'No notes provided.'}"`,
        variant: decision === 'Approve' ? 'default' : 'destructive'
    });
    // Reset form
    setPhotoPreview(null);
    setPhotoFile(null);
    setSelectedProduct('');
    setSelectedShipment('');
    setNotes('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Manual Produce Quality Assessment</CardTitle>
        <CardDescription>Upload a photo of produce to document your quality assessment before approving or rejecting a batch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="shipment-selector">Shipment ID</Label>
                <Select value={selectedShipment} onValueChange={setSelectedShipment}>
                    <SelectTrigger id="shipment-selector">
                        <SelectValue placeholder="Select a shipment" />
                    </SelectTrigger>
                    <SelectContent>
                        {shipmentData.filter(s => s.status === 'Awaiting QC').map(s => (
                            <SelectItem key={s.id} value={s.shipmentId}>{s.shipmentId}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="product-selector">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product-selector">
                        <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                        {productList.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="space-y-2">
          <Label>Photographic Evidence</Label>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
            {photoPreview ? (
              <Image src={photoPreview} alt="Produce evidence" fill style={{ objectFit: 'cover' }} />
            ) : (
              <FileImage className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('produce-photo-upload')?.click()}>
              <FileImage className="mr-2" /> Upload
            </Button>
            <Input type="file" id="produce-photo-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
             <Button type="button" className="w-full" disabled>
                <Camera className="mr-2" /> Use Camera
            </Button>
          </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="qc-notes">Notes / Description</Label>
            <Textarea 
                id="qc-notes"
                placeholder="Add a detailed description of the quality, any defects, or reasons for the decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2">
            <Button variant="destructive" onClick={() => handleDecision('Reject')} disabled={!photoPreview || !selectedProduct || !selectedShipment}>
                <ThumbsDown className="mr-2" /> Reject Batch
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision('Approve')} disabled={!photoPreview || !selectedProduct || !selectedShipment}>
                <ThumbsUp className="mr-2" /> Approve for Processing
            </Button>
      </CardFooter>
    </Card>
  );
}

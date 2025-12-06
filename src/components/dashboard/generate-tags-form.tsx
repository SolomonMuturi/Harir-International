
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { shipmentData, employeeData } from '@/lib/data';
import { QrCode, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Shipment, TagFormValues, TagBatch } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  product: z.string().min(1, { message: 'Please enter a product or asset name.' }),
  quantity: z.coerce.number().min(1, { message: 'Quantity must be at least 1.' }),
  weight: z.coerce.number().optional(),
  unit: z.enum(['kg']).default('kg').optional(),
  officerId: z.string().min(1, { message: 'Please select a logistics officer.' }),
});

interface GenerateTagsFormProps {
  onSubmit: (values: TagFormValues, shipment?: Shipment | null) => void;
  shipment?: Shipment | null;
  editingBatch?: TagBatch | null;
  onCancelEdit?: () => void;
}

export function GenerateTagsForm({ onSubmit, shipment: initialShipment, editingBatch, onCancelEdit }: GenerateTagsFormProps) {
  const { toast } = useToast();
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | undefined>(editingBatch?.shipmentId ? shipmentData.find(s => s.shipmentId === editingBatch.shipmentId)?.id : initialShipment?.id);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(initialShipment || null);
  
  const logisticsOfficers = employeeData.filter(e => e.role === 'Warehouse' || e.role === 'Manager' || e.role === 'Admin');
  
  const form = useForm<TagFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editingBatch || {
      product: initialShipment?.product || '',
      quantity: 1,
      unit: 'kg',
      weight: parseFloat(initialShipment?.weight || '0') || undefined,
      officerId: '',
    },
  });

  const watchAllFields = form.watch();

  useEffect(() => {
    if (editingBatch) {
      const shipmentForBatch = shipmentData.find(s => s.shipmentId === editingBatch.shipmentId);
      setSelectedShipmentId(shipmentForBatch?.id);
      setSelectedShipment(shipmentForBatch || null);
      form.reset({
        product: editingBatch.product,
        quantity: editingBatch.quantity,
        weight: editingBatch.weight,
        unit: editingBatch.unit,
        officerId: editingBatch.officerId,
      });
    }
  }, [editingBatch, form]);

  useEffect(() => {
    if (!editingBatch) {
        const shipmentToLoad = shipmentData.find(s => s.id === selectedShipmentId);
        setSelectedShipment(shipmentToLoad || null);

        if (shipmentToLoad) {
            const parsedWeight = parseFloat(shipmentToLoad.weight);
        form.reset({
            product: shipmentToLoad.product,
            quantity: 1, 
            weight: isNaN(parsedWeight) ? undefined : parsedWeight,
            unit: 'kg',
            officerId: '',
        });
        } else {
            form.reset({ product: '', quantity: 1, weight: undefined, unit: 'kg', officerId: '' });
        }
    }
  }, [selectedShipmentId, editingBatch, form]);


  const handleFormSubmit = (values: TagFormValues) => {
    onSubmit(values, selectedShipment);
    if (!editingBatch) {
      form.reset({
        product: '',
        quantity: 1,
        unit: 'kg',
        weight: undefined,
        officerId: '',
      });
      setSelectedShipmentId(undefined);
    }
  }
  
  const officerName = employeeData.find(e => e.id === watchAllFields.officerId)?.name;
  const previewData = {
      batchId: editingBatch?.batchId || `B-${new Date().toISOString().slice(0,7).replace('-','')}-XXX`,
      shipmentId: selectedShipment?.shipmentId,
      client: selectedShipment?.customer,
      assetName: watchAllFields.product,
      quantity: watchAllFields.quantity,
      weight: watchAllFields.weight,
      unit: watchAllFields.unit,
      officer: officerName,
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
         <div className="space-y-2">
          <FormLabel>Select Shipment (Optional)</FormLabel>
            <Select onValueChange={setSelectedShipmentId} value={selectedShipmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a shipment to pre-fill..." />
              </SelectTrigger>
              <SelectContent>
                {shipmentData.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.shipmentId} - {s.customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product or Asset Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Handheld Scanner, Roses" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="officerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><User /> Logistics Officer</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an officer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {logisticsOfficers.map(officer => (
                    <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Tags/Stickers</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Total Weight (kg, Opt.)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g. 250" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-2 pt-2 border-t">
          <FormLabel>Data Preview</FormLabel>
          <pre className="text-xs p-3 bg-muted rounded-md overflow-x-auto">
            <code>{JSON.stringify(previewData, null, 2)}</code>
          </pre>
        </div>

        <div className="flex gap-2">
            {editingBatch && (
                <Button type="button" variant="outline" onClick={onCancelEdit} className="w-full">
                    <X className="mr-2" />
                    Cancel
                </Button>
            )}
            <Button type="submit" className="w-full">
                <QrCode className="mr-2" />
                {editingBatch ? 'Save Changes' : 'Generate & Preview'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

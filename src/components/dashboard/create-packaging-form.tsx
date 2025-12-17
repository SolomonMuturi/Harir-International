// components/dashboard/create-packaging-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';

export interface PackagingFormValues {
  name: string;
  category: string;
  unit: 'pieces' | 'rolls' | 'units' | 'kg' | 'sheets' | 'meters';
  initialStock?: number;
  reorderLevel: number;
  dimensions?: string;
}

interface CreatePackagingFormProps {
  onSubmit: (values: PackagingFormValues) => void;
}

export function CreatePackagingForm({ onSubmit }: CreatePackagingFormProps) {
  const [formData, setFormData] = useState<PackagingFormValues>({
    name: '',
    category: 'Boxes',
    unit: 'pieces',
    initialStock: 0,
    reorderLevel: 10,
    dimensions: '',
  });

  const categories = [
    'Boxes',
    'Labels',
    'Wrapping',
    'Protective',
    'Tapes',
    'Straps',
    'Pallets',
    'Other'
  ];

  const units = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'rolls', label: 'Rolls' },
    { value: 'units', label: 'Units' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'sheets', label: 'Sheets' },
    { value: 'meters', label: 'Meters' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    
    // Reset form
    setFormData({
      name: '',
      category: 'Boxes',
      unit: 'pieces',
      initialStock: 0,
      reorderLevel: 10,
      dimensions: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Material Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Cardboard Boxes (Small)"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Select
            value={formData.unit}
            onValueChange={(value: any) => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger id="unit">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Reorder Level *</Label>
          <Input
            id="reorderLevel"
            type="number"
            min="0"
            value={formData.reorderLevel}
            onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
            placeholder="Minimum stock level"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="initialStock">Initial Stock (Optional)</Label>
          <Input
            id="initialStock"
            type="number"
            min="0"
            value={formData.initialStock}
            onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) || 0 })}
            placeholder="Starting quantity"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dimensions">Dimensions (Optional)</Label>
          <Input
            id="dimensions"
            value={formData.dimensions}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
            placeholder="e.g., 30x20x15 cm"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        <PlusCircle className="w-4 h-4 mr-2" />
        Add Packaging Material
      </Button>
    </form>
  );
}
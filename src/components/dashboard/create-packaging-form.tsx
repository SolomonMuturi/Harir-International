
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PackagingMaterial } from '@/lib/data';

const formSchema = z.object({
  name: z.string().min(2, "Material name is required."),
  category: z.enum(['Boxes & Crates', 'Labels & Printing', 'Pallets & Wraps', 'Miscellaneous']),
  unit: z.enum(['boxes', 'rolls', 'units']),
  reorderLevel: z.coerce.number().min(1, "Reorder level must be at least 1."),
  dimensions: z.string().optional(),
});

export type PackagingFormValues = z.infer<typeof formSchema>;

interface CreatePackagingFormProps {
  onSubmit: (values: PackagingFormValues) => void;
  initialData?: PackagingMaterial;
}

export function CreatePackagingForm({ onSubmit, initialData }: CreatePackagingFormProps) {
  const isEditMode = !!initialData;
  const form = useForm<PackagingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: 'Boxes & Crates',
      unit: 'boxes',
      reorderLevel: 100,
      dimensions: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);
  
  const handleSubmit = (values: PackagingFormValues) => {
    onSubmit(values);
    if (!isEditMode) {
      form.reset();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Avocado Box (Large)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Boxes & Crates">Boxes & Crates</SelectItem>
                        <SelectItem value="Labels & Printing">Labels & Printing</SelectItem>
                        <SelectItem value="Pallets & Wraps">Pallets & Wraps</SelectItem>
                        <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="rolls">Rolls</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="reorderLevel"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Reorder Level</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g. 500" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Dimensions (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. 40x30x10 cm" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full">
            {isEditMode ? 'Submit Changes for Approval' : 'Add Packaging Material'}
        </Button>
      </form>
    </Form>
  );
}

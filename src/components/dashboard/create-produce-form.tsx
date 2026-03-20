
'use client';

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
import type { Produce } from '@/lib/data';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Produce name must be at least 2 characters.',
  }),
  variety: z.string().min(2, {
    message: 'Variety must be at least 2 characters.',
  }),
  storageTemp: z.coerce.number(),
  category: z.enum(['Fruit', 'Vegetable', 'Flower', 'Other']),
});

type ProduceFormValues = z.infer<typeof formSchema>;

interface CreateProduceFormProps {
  onSubmit: (values: ProduceFormValues) => void;
  produce?: Produce | null;
}

export function CreateProduceForm({ onSubmit, produce }: CreateProduceFormProps) {
  const isEditMode = !!produce;
  
  const form = useForm<ProduceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode && produce ? {
      name: produce.name,
      variety: produce.variety,
      storageTemp: produce.storageTemp,
      category: produce.category,
    } : {
      name: '',
      variety: '',
      storageTemp: 4,
      category: 'Fruit',
    },
  });

  useEffect(() => {
    if (isEditMode && produce) {
      form.reset({
        name: produce.name,
        variety: produce.variety,
        storageTemp: produce.storageTemp,
        category: produce.category,
      });
    }
  }, [produce, isEditMode, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produce Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Avocado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="variety"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variety</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Hass" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Fruit">Fruit</SelectItem>
                  <SelectItem value="Vegetable">Vegetable</SelectItem>
                  <SelectItem value="Flower">Flower</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="storageTemp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ideal Storage Temperature (°C)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Produce'}</Button>
      </form>
    </Form>
  );
}

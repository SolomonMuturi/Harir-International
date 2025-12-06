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
import type { Carrier } from '@/lib/data';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(2, "Carrier name is required."),
  contact_name: z.string().min(2, "Contact name is required."), // snake_case
  id_number: z.string().optional(), // snake_case
  contact_email: z.string().email("Please enter a valid email."), // snake_case
  contact_phone: z.string().min(1, "Phone number is required."), // snake_case
  vehicle_registration: z.string().optional(), // snake_case
  status: z.enum(['Active', 'Inactive']),
});

// Type that matches your API
interface CarrierFormValues {
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'Active' | 'Inactive';
  id_number?: string;
  vehicle_registration?: string;
}

interface CreateCarrierFormProps {
  carrier?: Carrier | null;
  onSubmit: (values: CarrierFormValues) => void;
}

export function CreateCarrierForm({ carrier, onSubmit }: CreateCarrierFormProps) {
  const isEditMode = !!carrier;

  const form = useForm<CarrierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contact_name: '',
      id_number: '',
      contact_email: '',
      contact_phone: '',
      vehicle_registration: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (isEditMode && carrier) {
      // Transform carrier data from camelCase to snake_case
      form.reset({
        name: carrier.name,
        contact_name: carrier.contactName, // Transform here
        id_number: carrier.idNumber, // Transform here
        contact_email: carrier.contactEmail, // Transform here
        contact_phone: carrier.contactPhone, // Transform here
        vehicle_registration: carrier.vehicleRegistration, // Transform here
        status: carrier.status,
      });
    }
  }, [carrier, isEditMode, form]);

  const handleSubmit = (values: CarrierFormValues) => {
    onSubmit(values); // Data already in snake_case
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carrier Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. SpeedyLogistics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehicle_registration" // Updated field name
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Registration</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. KDA 123B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_name" // Updated field name
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Speed" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id_number" // Updated field name
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact ID Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_email" // Updated field name
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g. john@speedy.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_phone" // Updated field name
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="e.g. 0712345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditMode && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Carrier'}</Button>
      </form>
    </Form>
  );
}
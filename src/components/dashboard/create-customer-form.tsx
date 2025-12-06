

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
import type { Customer } from '@/lib/data';
import { useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters."),
  location: z.string().min(2, "Location is required."),
  tags: z.string().optional(),
  status: z.enum(['active', 'new', 'inactive']).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  vatNumber: z.string().optional(),
  primaryContactName: z.string().min(2, "Contact name is required."),
  primaryContactRole: z.string().min(2, "Contact role is required."),
  primaryContactEmail: z.string().email("Please enter a valid email for the contact."),
  primaryContactPhone: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof formSchema> & {
    // Adding optional fields that are not part of the form but might be passed
    logoUrl?: string;
    ytdSales?: number;
    lastOrder?: string;
    outstandingBalance?: number;
    openInvoices?: number;
    contacts?: any[];
    activity?: any[];
    orderHistory?: any[];
    documents?: any[];
};

interface CreateCustomerFormProps {
  customer?: Customer | null;
  onCreate?: (values: CustomerFormValues) => void;
  onUpdate?: (values: CustomerFormValues) => void;
}

export function CreateCustomerForm({ customer, onCreate, onUpdate }: CreateCustomerFormProps) {
  const isEditMode = !!customer;
  const primaryContact = customer?.contacts?.[0];

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      tags: '',
      status: 'new',
      website: '',
      vatNumber: '',
      primaryContactName: '',
      primaryContactRole: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
    },
  });

  useEffect(() => {
    if (isEditMode && customer) {
      form.reset({
        name: customer.name,
        location: customer.location,
        tags: customer.tags.join(', '),
        status: customer.status,
        website: customer.website || '',
        vatNumber: 'VAT-12345678', // Placeholder
        primaryContactName: primaryContact?.name || '',
        primaryContactRole: primaryContact?.role || '',
        primaryContactEmail: primaryContact?.email || '',
        primaryContactPhone: primaryContact?.phone || '',
      });
    }
  }, [customer, isEditMode, form, primaryContact]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const finalValues = {
        ...values,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
    };
    if (isEditMode) {
      onUpdate?.(finalValues as CustomerFormValues);
    } else {
      onCreate?.(finalValues as CustomerFormValues);
    }
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
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                      <Input placeholder="e.g. Kakuzi PLC" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                      <Input placeholder="e.g. Nairobi" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                      <Input placeholder="e.g. https://www.kakuzi.co.ke" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vatNumber"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>VAT / PIN</FormLabel>
                  <FormControl>
                      <Input placeholder="e.g. A001234567B" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
        </div>

        <Separator />
        
        <div>
          <h3 className="text-md font-medium mb-4">Primary Contact Person</h3>
          <div className="grid grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="primaryContactName"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="primaryContactRole"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                      <Input placeholder="e.g. Procurement Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="primaryContactEmail"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                      <Input type="email" placeholder="e.g. john@kakuzi.co.ke" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="primaryContactPhone"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                      <Input type="tel" placeholder="e.g. +254 712 345678" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                    <Textarea placeholder="e.g. Key Account, Supermarket, Export" {...field} />
                </FormControl>
                 <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
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
                            <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Customer'}</Button>
      </form>
    </Form>
  );
}

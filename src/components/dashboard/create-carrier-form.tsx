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

// Updated schema without email and rating
const formSchema = z.object({
  name: z.string().min(2, "Carrier name is required."),
  contact_name: z.string().min(2, "Contact name is required."),
  id_number: z.string().min(1, "ID number is required."),
  contact_phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  vehicle_registration: z.string().min(1, "Vehicle registration is required."),
  status: z.enum(['Active', 'Inactive']),
});

// Type that matches your API
interface CarrierFormValues {
  name: string;
  contact_name: string;
  contact_phone: string;
  status: 'Active' | 'Inactive';
  id_number: string;
  vehicle_registration: string;
}

interface CreateCarrierFormProps {
  carrier?: Carrier | null;
  onSubmit: (values: CarrierFormValues) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateCarrierForm({ carrier, onSubmit, isLoading = false }: CreateCarrierFormProps) {
  const isEditMode = !!carrier;

  const form = useForm<CarrierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contact_name: '',
      id_number: '',
      contact_phone: '',
      vehicle_registration: '',
      status: 'Active',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (isEditMode && carrier) {
      // Transform carrier data from camelCase to snake_case
      // Use actual database values from your carriers table
      form.reset({
        name: carrier.name || '',
        contact_name: carrier.contact_name || carrier.contactName || '',
        id_number: carrier.id_number || carrier.idNumber || '',
        contact_phone: carrier.contact_phone || carrier.contactPhone || '',
        vehicle_registration: carrier.vehicle_registration || carrier.vehicleRegistration || '',
        status: (carrier.status === 'Active' || carrier.status === 'Inactive') ? carrier.status : 'Active',
      });
    }
  }, [carrier, isEditMode, form]);

  const handleSubmit = async (values: CarrierFormValues) => {
    try {
      await onSubmit(values);
      if (!isEditMode) {
        form.reset(); // Reset form after successful submission for create mode
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Carrier Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Speedy Logistics" 
                    {...field} 
                    disabled={isLoading}
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="vehicle_registration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Vehicle Registration *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., KDA 123B" 
                    {...field} 
                    disabled={isLoading}
                    className="bg-white uppercase"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Contact Person *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., John Doe" 
                    {...field} 
                    disabled={isLoading}
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="id_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">ID/Passport Number *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 12345678" 
                    {...field} 
                    disabled={isLoading}
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Contact Phone *</FormLabel>
                <FormControl>
                  <Input 
                    type="tel" 
                    placeholder="e.g., 0712345678" 
                    {...field} 
                    disabled={isLoading}
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Status *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !form.formState.isValid}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isEditMode ? 'Saving...' : 'Creating...'}
              </span>
            ) : (
              <span>{isEditMode ? 'Save Changes' : 'Add Carrier'}</span>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground mt-4">
          <p className="font-medium mb-1">Database Fields:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>name: VARCHAR(255) - Carrier company name</li>
            <li>contact_name: VARCHAR(255) - Contact person</li>
            <li>contact_phone: VARCHAR(20) - Phone number</li>
            <li>id_number: VARCHAR(50) - ID/Passport number</li>
            <li>vehicle_registration: VARCHAR(20) - Vehicle plate</li>
            <li>status: ENUM('Active', 'Inactive') - Carrier status</li>
            <li>created_at: TIMESTAMP - Auto-generated</li>
            <li>updated_at: TIMESTAMP - Auto-updated</li>
          </ul>
        </div>
      </form>
    </Form>
  );
}
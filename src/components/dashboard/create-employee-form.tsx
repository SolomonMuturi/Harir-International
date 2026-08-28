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
import type { EmployeeFormValues, Employee } from '@/lib/data';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Casual name must be at least 2 characters.',
  }),
  phone: z.string().min(10, {
    message: 'Please enter a valid phone number.',
  }),
  idNumber: z.string().min(5, {
    message: 'ID number must be at least 5 characters.',
  }),
  date: z.string().min(1, {
    message: 'Date is required.',
  }),
  contract: z.enum(['Full-time', 'Part-time', 'Contract']),
  role: z.enum(['Manager', 'Driver', 'Warehouse', 'Admin', 'Security']),
});

interface CreateEmployeeFormProps {
  employee?: Employee | null;
  onCreate?: (values: EmployeeFormValues) => Promise<void> | void;
  onUpdate?: (values: EmployeeFormValues) => Promise<void> | void;
}

export function CreateEmployeeForm({ 
  employee, 
  onCreate, 
  onUpdate
}: CreateEmployeeFormProps) {
  const isEditMode = !!employee;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      idNumber: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      contract: 'Full-time',
      role: 'Driver',
    },
  });

  useEffect(() => {
    if (isEditMode && employee) {
      form.reset({
        name: employee.name || '',
        phone: employee.phone || '',
        idNumber: employee.idNumber || '',
        date: employee.date ? format(new Date(employee.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        contract: (employee.contract as 'Full-time' | 'Part-time' | 'Contract') || 'Full-time',
        role: (employee.role as 'Manager' | 'Driver' | 'Warehouse' | 'Admin' | 'Security') || 'Driver',
      });
    }
  }, [employee, isEditMode, form]);

  const handleSubmit = async (values: EmployeeFormValues) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);
      
      console.log('🔄 Form submitting:', values);
      
      // Only call the parent callback - let the parent handle the API call
      if (isEditMode) {
        await onUpdate?.(values);
      } else {
        await onCreate?.(values);
      }

      // Show success message
      setSubmitSuccess(isEditMode 
        ? `${values.name} has been updated successfully.`
        : `${values.name} has been created successfully.`);

      // Reset form if not in edit mode
      if (!isEditMode) {
        form.reset({
          name: '',
          phone: '',
          idNumber: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          contract: 'Full-time',
          role: 'Driver',
        });
      }

    } catch (error) {
      console.error('❌ Error saving employee:', error);
      
      // Show error message
      setSubmitError(error instanceof Error ? error.message : 'Failed to save casual. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {submitSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">{submitSuccess}</p>
          </div>
        )}
        
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {/* Employee Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Casual Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Casual Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Phone Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* ID Number */}
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter ID Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Casual'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
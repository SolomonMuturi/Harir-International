'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Supplier, SupplierFormValues } from '@/lib/data';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Updated schema with only required fields as compulsory
const formSchema = z.object({
  name: z.string().min(2, "Supplier name is required."),
  location: z.string().optional(),
  contactName: z.string().min(2, "Primary Contact name is required."),
  contactPhone: z.string().min(10, "A valid 10-digit phone number is required."),
  produceType: z.enum(['Fuerte', 'Hass', 'FuerteHass']),
  kraPin: z.string().optional(),
  supplierCode: z.string(),
  // Payment options - ALL made optional
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  mpesaName: z.string().optional(),
  mpesaNumber: z.string().optional(),
});

interface CreateSupplierFormProps {
  supplier?: Supplier | null;
  onSubmit: (values: SupplierFormValues) => void;
  existingSupplierCodes?: string[];
}

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <FormLabel>
    {children} <span className="text-destructive">*</span>
  </FormLabel>
);

const OptionalLabel = ({ children }: { children: React.ReactNode }) => (
  <FormLabel>
    {children} <span className="text-muted-foreground text-xs">(Optional)</span>
  </FormLabel>
);

export function CreateSupplierForm({ supplier, onSubmit, existingSupplierCodes = [] }: CreateSupplierFormProps) {
  const isEditMode = !!supplier;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const generateSupplierCode = () => {
    const prefix = 'SUP';
    
    if (isEditMode && supplier?.supplierCode) {
      return supplier.supplierCode;
    }
    
    if (existingSupplierCodes.length > 0) {
      const numbers = existingSupplierCodes
        .filter(code => code.startsWith(prefix))
        .map(code => {
          const numStr = code.replace(prefix, '');
          const num = parseInt(numStr, 10);
          return isNaN(num) ? 0 : num;
        })
        .filter(num => num > 0);
      
      const highestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      const nextNumber = highestNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      return `${prefix}${paddedNumber}`;
    }
    
    return 'SUP0001';
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      contactName: '',
      contactPhone: '',
      produceType: 'Fuerte',
      kraPin: '',
      supplierCode: generateSupplierCode(),
      bankName: '',
      bankAccountNumber: '',
      mpesaName: '',
      mpesaNumber: '',
    },
  });

  useEffect(() => {
    if (!isEditMode) {
      const newCode = generateSupplierCode();
      form.setValue('supplierCode', newCode);
    }
  }, [existingSupplierCodes]);

  useEffect(() => {
    if (isEditMode && supplier) {
      form.reset({
        name: supplier.name || '',
        location: supplier.location || '',
        contactName: supplier.contactName || '',
        contactPhone: supplier.contactPhone || '',
        produceType: (supplier.produceTypes?.[0] === 'Fuert' ? 'Fuerte' : supplier.produceTypes?.[0] as 'Fuerte' | 'Hass' | 'FuerteHass') || 'Fuerte',
        kraPin: supplier.kraPin || '',
        supplierCode: supplier.supplierCode || generateSupplierCode(),
        bankName: supplier.bankName || '',
        bankAccountNumber: supplier.bankAccountNumber || '',
        mpesaName: supplier.mpesaPaybill || '',
        mpesaNumber: supplier.mpesaAccountNumber || '',
      });
    }
  }, [supplier, isEditMode, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      console.log('📝 Form values before transformation:', values);

      const finalValues: SupplierFormValues = {
        // Required fields
        name: values.name,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        supplierCode: values.supplierCode,
        
        // Status is required
        status: 'Active',
        
        // Optional fields with defaults
        location: values.location || '',
        produceTypes: [values.produceType],
        kraPin: values.kraPin || '',
        bankName: values.bankName || '',
        bankAccountNumber: values.bankAccountNumber || '',
        mpesaName: values.mpesaName || '',
        mpesaNumber: values.mpesaNumber || '',
      };

      console.log('📤 Calling parent onSubmit with final values:', finalValues);
      await onSubmit(finalValues);

    } catch (error) {
      console.error('❌ Error in form submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Left Column - Supplier Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-4">Supplier Details</h3>
              <div className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>Supplier Name</RequiredLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="supplierCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="" 
                          {...field} 
                          readOnly 
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="kraPin" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>KRA PIN</OptionalLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <OptionalLabel>Location</OptionalLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contactName" render={({ field }) => (
                    <FormItem>
                      <RequiredLabel>Primary Contact</RequiredLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem>
                      <RequiredLabel>Contact Phone</RequiredLabel>
                      <FormControl>
                        <Input type="tel" placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <FormField control={form.control} name="produceType" render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>Produce Type</RequiredLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select produce type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fuerte">Fuerte Avocados</SelectItem>
                        <SelectItem value="Hass">Hass Avocados</SelectItem>
                        <SelectItem value="FuerteHass">Fuerte and Hass Avocados</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </div>

          {/* Right Column - Payment Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-4">Payment Details (Optional)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Provide either Bank or M-Pesa details (both optional)
              </p>
              
              {/* Bank Details Section */}
              <div className="space-y-4 mb-6 p-4 border rounded-md">
                <h4 className="text-sm font-medium">Bank Details</h4>
                <div className="space-y-3">
                  <FormField control={form.control} name="bankName" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>Bank Name</OptionalLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>Account Number</OptionalLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
              
              {/* OR Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>
              
              {/* M-Pesa Details Section */}
              <div className="space-y-4 p-4 border rounded-md">
                <h4 className="text-sm font-medium">M-Pesa Details</h4>
                <div className="space-y-3">
                  <FormField control={form.control} name="mpesaName" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>M-Pesa Account Name</OptionalLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="mpesaNumber" render={({ field }) => (
                    <FormItem>
                      <OptionalLabel>M-Pesa Phone Number</OptionalLabel>
                      <FormControl>
                        <Input type="tel" placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
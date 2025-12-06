'use client';

import { useState } from 'react';
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
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Printer, QrCode, Truck, User, Building, Clock, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

const formSchema = z.object({
  // Visitor/Supplier Type
  visitorType: z.enum(['visitor', 'supplier'], {
    required_error: "Please select visitor type",
  }),
  
  // Basic Information
  driverName: z.string().min(2, {
    message: 'Driver name must be at least 2 characters.',
  }),
  vehicleRegNo: z.string().min(1, {
    message: 'Vehicle registration number is required.',
  }),
  idNumber: z.string().min(5, {
    message: 'ID number must be at least 5 characters.',
  }),
  phoneNumber: z.string().min(10, {
    message: 'Phone number must be at least 10 digits.',
  }),
  
  // Time Information
  date: z.string().min(1, {
    message: 'Date is required.',
  }),
  signInTime: z.string().min(1, {
    message: 'Sign in time is required.',
  }),
  signOutTime: z.string().optional(),
  
  // Visitor-specific fields
  department: z.string().optional(),
  
  // Supplier-specific fields
  supplierName: z.string().optional(),
  cargoDescription: z.string().optional(),
}).refine(data => {
    if (data.visitorType === 'visitor' && !data.department) {
        return false;
    }
    return true;
}, {
    message: 'Department is required for visitors.',
    path: ['department'],
}).refine(data => {
    if (data.visitorType === 'supplier' && !data.supplierName) {
        return false;
    }
    return true;
}, {
    message: 'Supplier name is required for suppliers.',
    path: ['supplierName'],
});

export type VisitorFormValues = z.infer<typeof formSchema>;

interface CreateVisitorFormProps {
  onSubmit: (values: VisitorFormValues) => void;
}

export function CreateVisitorForm({ onSubmit }: CreateVisitorFormProps) {
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  
  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitorType: 'visitor',
      driverName: '',
      vehicleRegNo: '',
      idNumber: '',
      phoneNumber: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      signInTime: '',
      signOutTime: '',
      department: '',
      supplierName: '',
      cargoDescription: '',
    },
  });

  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/self-register` : '';
  const watchVisitorType = form.watch('visitorType');

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Visitor Type Selection */}
          <FormField
            control={form.control}
            name="visitorType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Visitor Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="visitor" id="visitor" />
                      <Label htmlFor="visitor" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Visitor
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="supplier" id="supplier" />
                      <Label htmlFor="supplier" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Supplier
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="driverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Driver Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vehicleRegNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Vehicle Registration No.
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. KDA 123B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 0712345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Date and Time Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="signInTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Sign In Time
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="signOutTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Sign Out Time (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Visitor/Supplier Specific Fields */}
          {watchVisitorType === 'visitor' && (
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Department
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="admin">Administration</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchVisitorType === 'supplier' && (
            <>
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Fresh Farms Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cargoDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the goods being delivered"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <Separator />

          {/* Form Actions */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQrDialogOpen(true)}
            >
              <QrCode className="mr-2" />
              Show Self-Registration QR
            </Button>
            <Button type="submit">
              Register Entry
            </Button>
          </div>
        </form>
      </Form>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Self-Registration QR Code</DialogTitle>
            <DialogDescription>
              Display or print this QR code at your gate for visitors to self-register.
            </DialogDescription>
          </DialogHeader>
          <div className="printable-qr-area flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/50 p-8">
            <div className="bg-white p-4 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  verificationUrl
                )}`}
                alt="QR Code for self-registration"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="font-bold text-lg">Scan to Register</p>
            <p className="text-sm text-muted-foreground text-center">
              Visitors can scan this code with their phone to begin the self-registration and check-in process.
            </p>
          </div>
          <div className="flex justify-end gap-2 non-printable">
            <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
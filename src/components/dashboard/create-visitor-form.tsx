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
import { Separator } from '../ui/separator';
import { Printer, QrCode, User, Building, Clock, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  // Basic Information
  visitorName: z.string().min(2, {
    message: 'Visitor name must be at least 2 characters.',
  }),
  vehicleRegNo: z.string().optional(),
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
  department: z.string().min(1, {
    message: 'Department is required.',
  }),
  purpose: z.string().optional(),
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
      visitorName: '',
      vehicleRegNo: '',
      idNumber: '',
      phoneNumber: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      signInTime: '',
      signOutTime: '',
      department: '',
      purpose: '',
    },
  });

  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/self-register` : '';

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="visitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Visitor Name
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
                      <circle cx="6.5" cy="16.5" r="2.5"/>
                      <circle cx="16.5" cy="16.5" r="2.5"/>
                    </svg>
                    Vehicle Registration No. (Optional)
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

          <Separator />

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

          <Separator />

          {/* Visitor Specific Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="it">IT Department</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Visit (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Meeting, Delivery, Interview" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
              Register Visitor
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
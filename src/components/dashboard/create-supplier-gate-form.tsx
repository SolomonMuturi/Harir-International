// components/dashboard/create-supplier-gate-form.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Printer, QrCode, User, Calendar, Truck, Phone, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  driverName: z.string().min(2, {
    message: 'Driver name must be at least 2 characters.',
  }),
  phoneNumber: z.string().min(10, {
    message: 'Phone number must be at least 10 digits.',
  }),
  vehicleRegNo: z.string().min(3, {
    message: 'Vehicle registration number is required.',
  }),
  vehicleType: z.string().min(1, {
    message: 'Vehicle type is required.',
  }),
  idNumber: z.string().min(5, {
    message: 'ID number must be at least 5 characters.',
  }),
  date: z.string().min(1, {
    message: 'Date is required.',
  }),
});

export type SupplierFormValues = z.infer<typeof formSchema>;

interface CreateSupplierGateFormProps {
  onSubmit: (values: SupplierFormValues) => void;
}

interface DriverOption {
  name: string;
  phone: string;
  id: string;
}

export function CreateSupplierGateForm({ onSubmit }: CreateSupplierGateFormProps) {
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/vehicle-visits/drivers')
      .then(res => (res.ok ? res.json() : { drivers: [] }))
      .then(data => {
        if (active) setDrivers(data.drivers || []);
      })
      .catch(() => {
        if (active) setDrivers([]);
      });
    return () => {
      active = false;
    };
  }, []);
  
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverName: '',
      phoneNumber: '',
      vehicleRegNo: '',
      vehicleType: 'Truck',
      idNumber: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/self-register` : '';

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Driver Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Driver Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Driver's Name *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="e.g. John Doe"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setDriverDropdownOpen(true);
                            const exact = drivers.find(
                              d => d.name.toLowerCase() === e.target.value.trim().toLowerCase()
                            );
                            if (exact) {
                              if (exact.phone) form.setValue('phoneNumber', exact.phone);
                              if (exact.id) form.setValue('idNumber', exact.id);
                            }
                          }}
                          onFocus={() => setDriverDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setDriverDropdownOpen(false), 150)}
                          className="pr-9"
                          autoComplete="off"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                        {driverDropdownOpen && (
                          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                            {drivers
                              .filter(d => d.name.toLowerCase().includes((field.value || '').toLowerCase()))
                              .map(driver => (
                                <button
                                  type="button"
                                  key={driver.name + driver.phone}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    field.onChange(driver.name);
                                    if (driver.phone) form.setValue('phoneNumber', driver.phone);
                                    if (driver.id) form.setValue('idNumber', driver.id);
                                    setDriverDropdownOpen(false);
                                  }}
                                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                >
                                  <span className="truncate">{driver.name}</span>
                                  <span className="shrink-0 text-xs text-muted-foreground">
                                    {driver.phone || ''}
                                  </span>
                                </button>
                              ))}
                            {drivers.filter(d => d.name.toLowerCase().includes((field.value || '').toLowerCase())).length === 0 && (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                No matching drivers. Enter a new name.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 0712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Vehicle Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Vehicle Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleRegNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Vehicle Registration No. *
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
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Vehicle Type *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Truck">Probox</SelectItem>
                        <SelectItem value="Pickup">Pickup</SelectItem>
                        <SelectItem value="Lorry">Canter</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Trailer">Trailer</SelectItem>
                        <SelectItem value="Refrigerated Truck">Refrigerated Truck</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver ID Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Date Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Date Information</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Arrival Date *
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              Show QR Code
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Clear Form
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Register Vehicle
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vehicle Registration QR Code</DialogTitle>
            <DialogDescription>
              Display this QR code for vehicle self-registration.
            </DialogDescription>
          </DialogHeader>
          <div className="printable-qr-area flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/50 p-8">
            <div className="bg-white p-4 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  verificationUrl
                )}`}
                alt="QR Code for vehicle registration"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="font-bold text-lg">Vehicle Registration Portal</p>
            <p className="text-sm text-muted-foreground text-center">
              Scan to register vehicle at the gate.
            </p>
          </div>
          <div className="flex justify-end gap-2 non-printable">
            <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2" />
              Print QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
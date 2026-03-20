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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { employeeData, vmsIotData } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Truck, Thermometer, User, Weight } from 'lucide-react';
import { useEffect } from 'react';

// Define the shipment type for this form
interface FormShipment {
  id: string;
  shipmentId: string;
  customer: string;
  product: string;
  weight: string;
  carrier?: string;
  status: string;
}

// Define form data type
interface OutboundShipmentFormData {
  shipmentId: string;
  carrier: string;
  departureTemperature: number;
  driverId: string;
  truckId?: string;
  finalChecks: Record<string, 'pass' | 'fail'>;
  palletCount: number;
  boxCount: number;
  dispatchWeight: number;
}

const qualityChecklistItems = [
  { id: 'sealIntegrity', label: 'Truck seals are intact and match records' },
  { id: 'documentation', label: 'All shipping documents are present and correct' },
  { id: 'loading', label: 'Load is secure and correctly stacked' },
];

const formSchema = z.object({
  shipmentId: z.string().min(1, 'Please select a shipment to dispatch.'),
  carrier: z.string().min(1, 'Carrier name is required.'),
  departureTemperature: z.coerce.number().min(-20).max(20, 'Temperature must be between -20°C and 20°C'),
  driverId: z.string().min(1, 'Please select a driver.'),
  truckId: z.string().optional(),
  finalChecks: z.record(z.enum(['pass', 'fail'])),
  palletCount: z.coerce.number().min(0, 'Pallet count cannot be negative'),
  boxCount: z.coerce.number().min(0, 'Box count cannot be negative'),
  dispatchWeight: z.coerce.number().min(0.1, 'Dispatch weight must be greater than 0'),
});

interface CreateOutboundShipmentFormProps {
  shipments: FormShipment[];
  onSubmit: (values: OutboundShipmentFormData) => void;
}

export function CreateOutboundShipmentForm({ shipments, onSubmit }: CreateOutboundShipmentFormProps) {
  const form = useForm<OutboundShipmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shipmentId: '',
      carrier: '',
      departureTemperature: 3.0,
      driverId: '',
      truckId: '',
      finalChecks: qualityChecklistItems.reduce((acc, item) => ({
        ...acc,
        [item.id]: 'pass'
      }), {}),
      palletCount: 0,
      boxCount: 0,
      dispatchWeight: 0,
    },
  });

  const selectedShipmentId = form.watch('shipmentId');

  useEffect(() => {
    if (selectedShipmentId) {
      const shipment = shipments.find(s => s.id === selectedShipmentId);
      if (shipment) {
        // Parse weight from string to number
        const weight = parseFloat(shipment.weight);
        if (!isNaN(weight) && weight > 0) {
          form.setValue('dispatchWeight', weight);
        }
        // Auto-set carrier if available
        if (shipment.carrier && shipment.carrier.trim()) {
          form.setValue('carrier', shipment.carrier);
        }
      }
    }
  }, [selectedShipmentId, shipments, form]);

  const truckDrivers = employeeData.filter(e => e.role === 'Driver');
  const trucks = vmsIotData.filter(v => v.name.includes('Truck'));

  // Get carrier options - ensure no empty strings
  const getCarrierOptions = () => {
    const carriersFromShipments = Array.from(
      new Set(
        shipments
          .map(s => s.carrier)
          .filter(Boolean)
          .filter(c => c && c.trim() !== '')
      )
    );
    
    return carriersFromShipments.length > 0 
      ? carriersFromShipments 
      : ['FedEx', 'UPS', 'DHL', 'Local Carrier'];
  };

  const carrierOptions = getCarrierOptions();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="shipmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipment to Dispatch</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shipment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shipments.length === 0 ? (
                      <SelectItem value="no-shipments" disabled>
                        No shipments available for dispatch
                      </SelectItem>
                    ) : (
                      shipments.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.shipmentId} ({s.product} for {s.customer})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
                {shipments.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Only shipments in "Preparing for Dispatch" or "Ready for Dispatch" status appear here.
                  </p>
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="carrier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Carrier
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {carrierOptions.map((carrier, index) => (
                      <SelectItem key={index} value={carrier as string}>
                        {carrier as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="driverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Driver
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {truckDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="truckId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Truck/Vehicle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select truck (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="not-specified">Not specified</SelectItem>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="departureTemperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" /> Departure Temp (°C)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 3.5" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="palletCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pallet Count</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="boxCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Box Count</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dispatchWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Weight className="h-4 w-4" /> Weight (kg)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 3000" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <FormLabel className="text-base font-semibold">Pre-Departure Quality Checks</FormLabel>
          <div className="p-4 border rounded-md space-y-4">
            {qualityChecklistItems.map((item) => (
              <FormField
                key={item.id}
                control={form.control}
                name={`finalChecks.${item.id}`}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-normal">
                      {item.label}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pass" id={`${item.id}-pass`} />
                          <label 
                            htmlFor={`${item.id}-pass`} 
                            className="text-sm font-medium text-green-600 cursor-pointer"
                          >
                            Pass
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fail" id={`${item.id}-fail`} />
                          <label 
                            htmlFor={`${item.id}-fail`} 
                            className="text-sm font-medium text-red-600 cursor-pointer"
                          >
                            Fail
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={shipments.length === 0}
        >
          {shipments.length === 0 ? 'No Shipments Available' : 'Confirm & Generate Outbound Manifest'}
        </Button>
        
        {shipments.length === 0 && (
          <p className="text-sm text-center text-muted-foreground">
            There are no shipments available for dispatch. 
            Only shipments in "Preparing for Dispatch" or "Ready for Dispatch" status can be processed here.
          </p>
        )}
      </form>
    </Form>
  );
}
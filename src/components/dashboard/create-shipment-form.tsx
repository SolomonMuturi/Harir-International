'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define form schema
const formSchema = z.object({
  shipmentId: z.string().min(1, 'Shipment ID is required'),
  customer: z.string().min(1, 'Customer is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  product: z.string().min(1, 'Product is required'),
  declaredWeight: z.number().min(0.1, 'Declared weight must be greater than 0'),
  netWeight: z.number().min(0.1, 'Net weight must be greater than 0'),
  arrivalTemperature: z.number().optional(),
  driverId: z.string().optional(),
  truckId: z.string().optional(),
  palletId: z.string().optional(),
  notes: z.string().optional(),
  qualityChecks: z.object({
    packaging: z.object({
      status: z.enum(['accepted', 'rejected']),
      rejectedWeight: z.number().optional(),
      notes: z.string().optional(),
    }),
    freshness: z.object({
      status: z.enum(['accepted', 'rejected']),
      rejectedWeight: z.number().optional(),
      notes: z.string().optional(),
    }),
    seals: z.object({
      status: z.enum(['accepted', 'rejected']),
      rejectedWeight: z.number().optional(),
      notes: z.string().optional(),
    }),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface CreateShipmentFormProps {
  onSubmit: (data: FormData) => void;
  shipments?: any[];
  isLoading?: boolean;
}

export default function CreateShipmentForm({ 
  onSubmit, 
  shipments = [], 
  isLoading = false 
}: CreateShipmentFormProps) {
  const { toast } = useToast();
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize form with default values for all fields
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shipmentId: '',
      customer: '',
      origin: '',
      destination: '',
      product: '',
      declaredWeight: 0,
      netWeight: 0,
      arrivalTemperature: undefined,
      driverId: '',
      truckId: '',
      palletId: '',
      notes: '',
      qualityChecks: {
        packaging: {
          status: 'accepted' as const,
          rejectedWeight: 0,
          notes: '',
        },
        freshness: {
          status: 'accepted' as const,
          rejectedWeight: 0,
          notes: '',
        },
        seals: {
          status: 'accepted' as const,
          rejectedWeight: 0,
          notes: '',
        },
      },
    },
  });

  // Watch form values
  const selectedShipmentId = form.watch('shipmentId');
  const qualityChecks = form.watch('qualityChecks');
  const netWeightValue = form.watch('netWeight');

  // Calculate rejected weight
  const totalRejectedWeight = isClient ? Object.values(qualityChecks).reduce(
    (acc, check) => acc + (check.rejectedWeight || 0),
    0
  ) : 0;

  // Calculate accepted weight
  const acceptedWeight = isClient ? (netWeightValue || 0) - totalRejectedWeight : 0;

  // When shipment is selected, populate form fields
  useEffect(() => {
    if (selectedShipmentId && shipments.length > 0 && isClient) {
      const shipment = shipments.find(s => s.id === selectedShipmentId);
      if (shipment) {
        setSelectedShipment(shipment);
        form.setValue('customer', shipment.customers?.name || shipment.customer);
        form.setValue('origin', shipment.origin || '');
        form.setValue('destination', shipment.destination || '');
        form.setValue('product', shipment.product || '');
        
        // Parse weight string to number
        const weightMatch = shipment.weight?.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[1]) : 0;
        form.setValue('declaredWeight', weightValue);
        form.setValue('netWeight', weightValue);
      }
    }
  }, [selectedShipmentId, shipments, form, isClient]);

  const handleSubmit = (data: FormData) => {
    try {
      onSubmit(data);
      toast({
        title: 'Shipment Processed',
        description: 'Quality check completed successfully.',
      });
      // Reset form after successful submission
      form.reset();
      setSelectedShipment(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process shipment.',
        variant: 'destructive',
      });
    }
  };

  // Don't render on server to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shipmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Shipment</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ''}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoading ? "Loading shipments..." : "Select a shipment"} />
                    </SelectTrigger>
                  </FormControl>          
                  <SelectContent>
                  {shipments.map((shipment) => (
                    <SelectItem key={shipment.id} value={shipment.id}>
                      {shipment.shipment_id} - {shipment.product} ({shipment.customers?.name || shipment.customer})
                    </SelectItem>
                  ))}
                  {shipments.length === 0 && !isLoading && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No shipments available
                    </div>
                  )}
                </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="palletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pallet ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., PAL-001" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedShipment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Shipment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedShipment.customers?.name || selectedShipment.customer}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Product</p>
                <p className="font-medium">{selectedShipment.product}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Origin</p>
                <p className="font-medium">{selectedShipment.origin}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p className="font-medium">{selectedShipment.destination}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="declaredWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Declared Weight (kg)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="e.g., 1000"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    value={field.value === 0 ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="netWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Net Weight (kg)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="e.g., 980"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    value={field.value === 0 ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="arrivalTemperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arrival Temperature (°C)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="e.g., 4.5"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      field.onChange(isNaN(value as number) ? undefined : value);
                    }}
                    value={field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Quality Checks Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quality Checks</h3>
          <div className="space-y-4">
            {(['packaging', 'freshness', 'seals'] as const).map((checkType) => (
              <Card key={checkType}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium capitalize">
                    {checkType} Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`qualityChecks.${checkType}.status`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || 'accepted'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="accepted">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Accepted
                              </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                Rejected
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {qualityChecks[checkType].status === 'rejected' && (
                    <FormField
                      control={form.control}
                      name={`qualityChecks.${checkType}.rejectedWeight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rejected Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="e.g., 20"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                              value={field.value === 0 ? '' : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name={`qualityChecks.${checkType}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={`${checkType} check notes...`}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">QC Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Net Weight</p>
                <p className="text-xl font-bold">{netWeightValue.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Rejected</p>
                <p className="text-xl font-bold text-red-600">{totalRejectedWeight.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Accepted Weight</p>
                <p className="text-xl font-bold text-green-600">{acceptedWeight.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                {totalRejectedWeight === 0 ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    All Passed
                  </Badge>
                ) : totalRejectedWeight > (netWeightValue || 0) * 0.1 ? (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    <XCircle className="w-3 h-3 mr-1" />
                    Major Rejection
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Minor Rejection
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="driverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driver ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., DRV-001" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="truckId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Truck ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., TRK-001" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>General Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes..."
                  {...field}
                  value={field.value || ''}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              setSelectedShipment(null);
            }}
          >
            Reset
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !form.formState.isValid}
          >
            {isLoading ? 'Processing...' : 'Complete Quality Check'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
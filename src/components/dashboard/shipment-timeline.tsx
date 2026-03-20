

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package,
  Warehouse,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { ShipmentDetails, ShipmentEvent } from '@/lib/data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

const iconMap = {
  Package: <Package className="h-5 w-5" />,
  Warehouse: <Warehouse className="h-5 w-5" />,
  Truck: <Truck className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  AlertCircle: <AlertCircle className="h-5 w-5" />,
};

interface ShipmentTimelineProps {
  shipment: ShipmentDetails;
}

export function ShipmentTimeline({ shipment }: ShipmentTimelineProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Shipment History</CardTitle>
        <CardDescription>
          ID: <span className="font-mono">{shipment.shipmentId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[450px]">
          <div className="p-6 space-y-8 relative">
            <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-border" />
            {shipment.events.map((event, index) => (
              <div key={event.id} className="flex items-start gap-4 relative">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center bg-card border-2 z-10',
                    event.status === 'completed' && 'border-primary bg-primary/20 text-primary',
                    event.status === 'in-progress' && 'border-yellow-500 bg-yellow-500/20 text-yellow-600',
                    event.status === 'pending' && 'border-muted-foreground bg-muted/20 text-muted-foreground'
                  )}
                >
                  {iconMap[event.icon as keyof typeof iconMap] || <Package className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-semibold">{event.description}</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                  <div className="text-xs text-muted-foreground">
                    {hasMounted ? (
                      format(new Date(event.timestamp), 'MMM d, yyyy, h:mm a')
                    ) : (
                      <Skeleton className="h-4 w-24" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

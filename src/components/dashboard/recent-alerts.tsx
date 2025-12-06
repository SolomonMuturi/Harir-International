
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bell, Thermometer, Truck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

interface RecentAlertsProps {
  alerts: {
    id: string;
    type: 'Temperature' | 'Delay' | 'Security';
    message: string;
    time: string;
  }[];
}

const alertIcons = {
  Temperature: <Thermometer className="h-4 w-4" />,
  Delay: <Truck className="h-4 w-4" />,
  Security: <Bell className="h-4 w-4" />,
};

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
        <CardDescription>Critical event notifications.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[240px]">
          <div className="p-6 pt-0 space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-4">
                <div className="bg-accent/20 text-accent p-2 rounded-full">
                  {alertIcons[alert.type]}
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {alert.type} Alert
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {hasMounted ? (
                      formatDistanceToNow(new Date(alert.time), { addSuffix: true })
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

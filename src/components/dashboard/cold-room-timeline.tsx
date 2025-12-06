
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

type TimelineEvent = {
  id: string;
  type: 'excursion' | 'return';
  title: string;
  time: string;
};

interface ColdRoomTimelineProps {
  events: TimelineEvent[];
}

const iconMap = {
  excursion: <AlertTriangle className="h-5 w-5" />,
  return: <CheckCircle className="h-5 w-5" />,
};

export function ColdRoomTimeline({ events }: ColdRoomTimelineProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          Recent temperature events.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[250px]">
          <div className="p-6 space-y-8 relative">
            <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-border" />
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 relative">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center bg-card border-2 z-10',
                    event.type === 'return' && 'border-green-500 bg-green-500/20 text-green-600',
                    event.type === 'excursion' && 'border-destructive bg-destructive/20 text-destructive',
                  )}
                >
                  {iconMap[event.type]}
                </div>
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <div className="text-xs text-muted-foreground">
                    {hasMounted ? (
                      format(new Date(event.time), 'yyyy-MM-dd HH:mm')
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

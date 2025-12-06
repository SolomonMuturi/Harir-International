'use client';

import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OverviewCardProps {
  data: {
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  icon: LucideIcon;
  cardClass?: string;
}

export function OverviewCard({ data, icon: Icon, cardClass }: OverviewCardProps) {

  return (
    <Card 
      className={cn(cardClass)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data.value}</div>
        <p
          className={cn(
            'text-xs text-muted-foreground',
            data.changeType === 'increase'
              ? 'text-green-600'
              : 'text-red-600'
          )}
        >
          {data.change}
        </p>
      </CardContent>
    </Card>
  );
}

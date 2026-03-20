
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer } from 'lucide-react';
import type { ColdRoomStatus as ColdRoomStatusType } from '@/lib/data';

interface ColdRoomStatusProps {
  rooms: ColdRoomStatusType[];
}

export function ColdRoomStatus({ rooms }: ColdRoomStatusProps) {
  const statusVariant = {
    Optimal: 'default',
    Warning: 'secondary',
    Alert: 'destructive',
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cold Room Status</CardTitle>
        <CardDescription>Live temperature and status of all cold rooms.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className="p-4 border rounded-lg flex flex-col items-center justify-center text-center">
            <h3 className="font-semibold">{room.name}</h3>
            <div className="flex items-center text-2xl font-bold my-2">
              <Thermometer className="w-6 h-6 mr-2" />
              <span>{room.temperature.toFixed(1)}°C</span>
            </div>
            <Badge variant={statusVariant[room.status]}>{room.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

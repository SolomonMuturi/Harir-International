

'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PackageCheck, ScanLine, Tags, Clock4, FlaskConical, Zap, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';

const stations = [
    { id: 'receiving-bay-1', name: 'Receiving Bay 1', status: 'Active', currentTask: 'Unloading SH-88122', icon: <ScanLine className="w-8 h-8 text-primary" /> },
    { id: 'quality-control', name: 'Quality Control', status: 'Active', currentTask: 'Inspecting Roses', icon: <FlaskConical className="w-8 h-8 text-primary" /> },
    { id: 'sorting-line-a', name: 'Sorting Line A', status: 'Active', currentTask: 'Sorting Strawberries', icon: <PackageCheck className="w-8 h-8 text-primary" /> },
    { id: 'packing-station-3', name: 'Packing Station 3', status: 'Idle', currentTask: 'Awaiting product', icon: <Clock4 className="w-8 h-8 text-primary" /> },
    { id: 'labeling-tagging', name: 'Labeling & Tagging', status: 'Active', currentTask: 'Applying B-202408-003', icon: <Tags className="w-8 h-8 text-primary" /> },
]

export function ProcessingStationStatus() {
  const router = useRouter();
  const statusVariant = {
    Active: 'default',
    Idle: 'secondary',
  } as const;
  
  const handleCardClick = (stationId: string) => {
    router.push(`/warehouse/stations/${stationId}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Station Status</CardTitle>
        <CardDescription>Live view of warehouse stations.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stations.map((station) => (
            <Card 
                key={station.name} 
                className="flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCardClick(station.id)}
            >
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">{station.name}</CardTitle>
                        <Badge variant={statusVariant[station.status as keyof typeof statusVariant]}>
                            {station.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center gap-2">
                    <div className="bg-primary/10 p-4 rounded-full">
                        {station.icon}
                    </div>
                    <p className="text-sm text-muted-foreground">{station.currentTask}</p>
                </CardContent>
            </Card>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

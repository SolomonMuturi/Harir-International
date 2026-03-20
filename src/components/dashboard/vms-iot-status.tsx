
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface VmsIotStatusProps {
  devices: {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'warning';
  }[];
}

export function VmsIotStatus({ devices }: VmsIotStatusProps) {
  const router = useRouter();
  const mapImage = PlaceHolderImages.find((img) => img.id === 'vms-map');

  const statusIcons = {
    online: <CheckCircle className="h-4 w-4 text-green-500" />,
    offline: <XCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  };

  const handleDeviceClick = (deviceId: string) => {
    router.push('/vehicle-management');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>VMS / IoT Status</CardTitle>
        <CardDescription>
          Live vehicle location and IoT device health.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          {mapImage && (
            <Image
              src={mapImage.imageUrl}
              alt={mapImage.description}
              fill
              className="object-cover"
              data-ai-hint={mapImage.imageHint}
            />
          )}
        </div>
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Device Status</h3>
          <div className="space-y-3">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => handleDeviceClick(device.id)}
              >
                <span className="text-sm text-muted-foreground">{device.name}</span>
                <div className="flex items-center gap-2">
                  {statusIcons[device.status]}
                  <span className="text-sm font-medium capitalize">{device.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

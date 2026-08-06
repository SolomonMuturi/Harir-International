'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { FreshViewLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateContainerPdf } from '@/lib/container-pdf';
import {
  ArrowLeft,
  Download,
  MapPin,
  Thermometer,
  CalendarDays,
  Ship,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContainerUpdate {
  id: string;
  current_location: string | null;
  current_temperature: string | null;
  arrival_date: string | null;
  updated_at: string;
}

interface ContainerRecord {
  id: string;
  shipment_number: string;
  invoice_number: string | null;
  bl_number: string | null;
  container_number: string;
  current_location: string | null;
  current_temperature: string | null;
  arrival_date: string | null;
  destination: string | null;
  created_at: string;
  updated_at: string;
  updates?: ContainerUpdate[];
}

export default function ContainerDetailsPage() {
  const params = useParams();
  const containerId = params.id as string;
  const { toast } = useToast();

  const [container, setContainer] = useState<ContainerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchContainer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/containers/${containerId}`);
      if (!response.ok) throw new Error('Failed to fetch container');
      const data = await response.json();
      setContainer(data);
    } catch (error) {
      console.error('Error fetching container:', error);
      setContainer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (containerId) fetchContainer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  const handleDownloadPdf = async () => {
    if (!container) return;
    try {
      setDownloading(true);
      await generateContainerPdf(container);
      toast({ title: 'PDF downloaded', description: `Tracking PDF for ${container.container_number} downloaded.` });
    } catch (error) {
      console.error('Error downloading container PDF:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <FreshViewLogo className="w-12 h-12 text-primary mb-4" />
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading container details...</p>
      </div>
    );
  }

  if (!container) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <FreshViewLogo className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Container Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The container you are looking for does not exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/shipments">
            <ArrowLeft className="mr-2" />
            Back to Container Tracking
          </Link>
        </Button>
      </div>
    );
  }

  const arrived = container.arrival_date
    ? new Date(container.arrival_date).getTime() <= Date.now()
    : false;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <FreshViewLogo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-headline font-bold text-foreground">
            Harir International - Container Tracking
          </h1>
          <div className="ml-auto">
            <Button asChild variant="outline" size="sm">
              <Link href="/shipments">
                <ArrowLeft className="mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-xl">
                  <span className="inline-flex items-center gap-2">
                    <Ship className="w-5 h-5" />
                    {container.shipment_number}
                  </span>
                </CardTitle>
                <CardDescription>
                  Container <span className="font-mono font-bold">{container.container_number}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {container.arrival_date && (
                  <Badge className={cn(arrived ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100')}>
                    {arrived ? 'Arrived' : 'In Transit'}
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
                  <Download className={cn('mr-2', downloading && 'animate-pulse')} />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">Shipment Number</span>
                <span className="font-medium">{container.shipment_number}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">Container Number</span>
                <span className="font-medium font-mono">{container.container_number}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-medium">{container.invoice_number || '-'}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">B/L Number</span>
                <span className="font-medium">{container.bl_number || '-'}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-medium">{container.destination || '-'}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {format(new Date(container.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">
                  {format(new Date(container.updated_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">Arrival Date</span>
                <span className="font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 text-muted-foreground" />
                    {container.arrival_date
                      ? format(new Date(container.arrival_date), 'dd/MM/yyyy')
                      : '-'}
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <MapPin className="w-4 h-4" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-green-900">
                    {container.current_location || 'Not updated'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <Thermometer className="w-4 h-4" />
                    Current Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-blue-900">
                    {container.current_temperature || 'Not updated'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Inbox className="w-5 h-5" />
                Location &amp; Temperature Update History
              </h3>
              {container.updates && container.updates.length > 0 ? (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left">
                          <th className="px-4 py-2 font-medium">Date &amp; Time</th>
                          <th className="px-4 py-2 font-medium">Arrival Date</th>
                          <th className="px-4 py-2 font-medium">Location</th>
                          <th className="px-4 py-2 font-medium">Temperature</th>
                        </tr>
                      </thead>
                      <tbody>
                        {container.updates.map((update) => (
                          <tr key={update.id} className="border-b last:border-0">
                            <td className="px-4 py-2">
                              {format(new Date(update.updated_at), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="px-4 py-2">
                              {update.arrival_date
                                ? format(new Date(update.arrival_date), 'dd/MM/yyyy')
                                : '-'}
                            </td>
                            <td className="px-4 py-2">{update.current_location || '-'}</td>
                            <td className="px-4 py-2">{update.current_temperature || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No updates recorded yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

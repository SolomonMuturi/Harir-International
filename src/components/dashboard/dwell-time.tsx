

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, AlertTriangle, PlusCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DwellTimeEntry } from '@/lib/data';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Skeleton } from '../ui/skeleton';


interface DwellTimeProps {
  locations: DwellTimeEntry[];
  onRowClick?: (entry: DwellTimeEntry) => void;
  scannedId?: string;
}

const initialThresholds = {
  'Mixed Greens': { warning: 2, alert: 4 },
  'Vaccines - Batch 401': { warning: 24, alert: 48 },
  'Frozen Seafood': { warning: 48, alert: 72 },
  'Blueberries': { warning: 8, alert: 12 },
  'Organic Strawberries': { warning: 4, alert: 8 },
  'Roses': { warning: 6, alert: 10 },
  'Hass Avocados': { warning: 12, alert: 24 },
};

// Helper to convert dwell time string 'Xh Ym' to total hours
const parseDwellTime = (time: string): number => {
  const hoursMatch = time.match(/(\d+)h/);
  const minsMatch = time.match(/(\d+)m/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minsMatch ? parseInt(minsMatch[1], 10) / 60 : 0;
  return hours + minutes;
};

export function DwellTime({ locations, onRowClick, scannedId }: DwellTimeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [thresholds, setThresholds] = useState(initialThresholds);
  const { toast } = useToast();
  const router = useRouter();

  const [newProduct, setNewProduct] = useState('');
  const [newWarning, setNewWarning] = useState('');
  const [newAlert, setNewAlert] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  useEffect(() => {
    if (scannedId) {
      setSearchQuery(scannedId);
    }
  }, [scannedId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
        const dateA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
        const dateB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
        return dateA - dateB;
    });
  }, [locations]);


  const filteredLocations = useMemo(() => {
    const baseList = sortedLocations;
    if (!searchQuery) return baseList;
    return baseList.filter(loc => 
      loc.location.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
      loc.primaryProduct.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedLocations, searchQuery]);


  const getStatus = (product: string, dwellTime: string): 'optimal' | 'moderate' | 'high' => {
    const hours = parseDwellTime(dwellTime);
    const productThresholds = thresholds[product as keyof typeof thresholds] || { warning: 9999, alert: 9999 };
    
    if (hours >= productThresholds.alert) return 'high';
    if (hours >= productThresholds.warning) return 'moderate';
    return 'optimal';
  };
  
  const getAgeStatus = (entryDate: string): 'Fresh' | 'Aging' | 'Stale' => {
    const hours = (new Date().getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60);
    if (hours > 72) return 'Stale';
    if (hours > 24) return 'Aging';
    return 'Fresh';
  };
  
  const ageStatusVariant = {
    Fresh: 'default',
    Aging: 'secondary',
    Stale: 'destructive',
  } as const;

  const statusInfo = {
    optimal: { text: 'text-green-600', variant: 'default' as const },
    moderate: { text: 'text-yellow-600', variant: 'secondary' as const },
    high: { text: 'text-red-600', variant: 'destructive' as const },
  };

  const handleThresholdChange = (product: string, type: 'warning' | 'alert', value: string) => {
    setThresholds(prev => ({
      ...prev,
      [product]: {
        ...prev[product as keyof typeof prev],
        [type]: Number(value)
      }
    }));
  };

  const handleAddThreshold = () => {
    if (newProduct && newWarning && newAlert) {
      if (thresholds[newProduct as keyof typeof thresholds]) {
        toast({
          variant: 'destructive',
          title: 'Product Exists',
          description: `A threshold for "${newProduct}" already exists.`,
        });
        return;
      }
      setThresholds(prev => ({
        ...prev,
        [newProduct]: {
          warning: Number(newWarning),
          alert: Number(newAlert)
        }
      }));
      setNewProduct('');
      setNewWarning('');
      setNewAlert('');
      toast({
        title: 'Threshold Added',
        description: `New threshold for "${newProduct}" has been added.`,
      });
    } else {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill out all fields for the new threshold.',
        });
    }
  };

  const handleActionClick = (e: React.MouseEvent, location: string, action: string) => {
    e.stopPropagation(); // Prevent row click from firing
    toast({
      title: 'Action Initiated',
      description: `Action '${action}' for location '${location}' has been logged.`,
    });
  };

  const handleRowAction = (entry: DwellTimeEntry) => {
    if (onRowClick) {
      onRowClick(entry);
    } else {
      router.push('/cold-room');
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Cold Room Inventory (FIFO)
                    </CardTitle>
                    <CardDescription>
                    Pallets prioritized by entry date (First-In, First-Out). Oldest items are at the top.
                    </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Scan or search Pallet ID..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={handleInputChange}
                        />
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Settings />
                        </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Manage Dwell Time Thresholds</DialogTitle>
                            <DialogDescription>
                            Set the warning and alert thresholds (in hours) for each product type.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <ScrollArea className="h-[250px] pr-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                        <TableHead>Product Type</TableHead>
                                        <TableHead className="text-center">Warning (hrs)</TableHead>
                                        <TableHead className="text-center">Alert (hrs)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(thresholds).map(([product, {warning, alert}]) => (
                                        <TableRow key={product}>
                                            <TableCell className="font-medium">{product}</TableCell>
                                            <TableCell>
                                            <Input 
                                                type="number" 
                                                value={warning} 
                                                onChange={(e) => handleThresholdChange(product, 'warning', e.target.value)}
                                                className="text-center"
                                            />
                                            </TableCell>
                                            <TableCell>
                                            <Input 
                                                type="number" 
                                                value={alert} 
                                                onChange={(e) => handleThresholdChange(product, 'alert', e.target.value)}
                                                className="text-center"
                                            />
                                            </TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            <Separator />
                            <div>
                            <h4 className="text-sm font-medium mb-2">Add New Threshold</h4>
                            <div className="grid grid-cols-4 gap-2 items-center">
                                <Input 
                                placeholder="Product Name" 
                                value={newProduct}
                                onChange={(e) => setNewProduct(e.target.value)}
                                className="col-span-2"
                                />
                                <Input 
                                type="number" 
                                placeholder="Warn" 
                                value={newWarning}
                                onChange={(e) => setNewWarning(e.target.value)}
                                className="text-center"
                                />
                                <Input 
                                type="number" 
                                placeholder="Alert" 
                                value={newAlert}
                                onChange={(e) => setNewAlert(e.target.value)}
                                className="text-center"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleAddThreshold}>
                                <PlusCircle className="mr-2" />
                                Add Threshold
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={() => { setIsDialogOpen(false); toast({ title: 'Thresholds Saved', description: 'Dwell time thresholds have been updated.' })}}>Save Changes</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-[250px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Pallet ID (QR)</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Weight</TableHead>
                   <TableHead>Age / Entry Date</TableHead>
                  <TableHead className="text-right">Next Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((loc) => {
                  const status = getStatus(loc.primaryProduct, loc.avgDwellTime);
                  const entryDate = loc.entryDate || new Date(Date.now() - parseDwellTime(loc.avgDwellTime) * 60 * 60 * 1000).toISOString();
                  const ageStatus = getAgeStatus(entryDate);
                  
                  return (
                    <TableRow
                        key={loc.id}
                        onClick={() => handleRowAction(loc)}
                        className={cn(
                            'cursor-pointer',
                            status === 'high' && 'bg-destructive/10',
                            scannedId && loc.location.startsWith(scannedId) && 'bg-primary/20 ring-2 ring-primary'
                        )}
                    >
                        <TableCell>
                        <div className="font-medium">{loc.location}</div>
                        </TableCell>
                        <TableCell>{loc.primaryProduct}</TableCell>
                        <TableCell className="font-mono">
                            {loc.weight ? `${loc.weight} kg` : '-'}
                        </TableCell>
                         <TableCell>
                            <Badge variant={ageStatusVariant[ageStatus]} className="capitalize">{ageStatus}</Badge>
                         </TableCell>
                        <TableCell className="text-right">
                        {status === 'high' && loc.nextAction && (
                            <Button variant="destructive" size="sm" onClick={(e) => handleActionClick(e, loc.location, loc.nextAction!)}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            {loc.nextAction}
                            </Button>
                        )}
                        </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}

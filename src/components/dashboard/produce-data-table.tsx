

'use client';

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
import { Leaf, Warehouse, Truck, Pencil } from 'lucide-react';
import type { Produce } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Badge } from '../ui/badge';

interface ProduceDataTableProps {
  produce: Produce[];
}

export function ProduceDataTable({ produce }: ProduceDataTableProps) {
  const router = useRouter();

  const formatWeight = (weight: number) => {
    if (weight === 0) return '-';
    if (weight < 1000) return `${weight.toFixed(0)} kg`;
    return `${(weight / 1000).toFixed(1)} t`;
  }
  
  const handleRowClick = (itemName: string) => {
    router.push(`/shipments?product=${encodeURIComponent(itemName)}`);
  }

  const handleEditClick = (e: React.MouseEvent, produceId: string) => {
    e.stopPropagation();
    router.push(`/produce/${produceId}/edit`);
  }


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          Produce Catalog & Inventory
        </CardTitle>
        <CardDescription>
          A list of all produce types managed in the system with live inventory levels.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-24rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Produce Name</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ideal Temp</TableHead>
                <TableHead>Active Shipments</TableHead>
                <TableHead className="text-right">In Cold Room / Processing</TableHead>
                <TableHead className="text-right">Incoming Shipments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produce.map((item) => (
                <TableRow 
                  key={item.id} 
                  onClick={() => handleRowClick(item.name)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.variety}</TableCell>
                  <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell className="font-mono">{item.storageTemp.toFixed(1)}°C</TableCell>
                  <TableCell>
                    <Link href={`/shipments?product=${encodeURIComponent(item.name)}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="link" className="p-0 h-auto">
                        {item.shipmentCount}
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end gap-2">
                      <Warehouse className="w-4 h-4 text-muted-foreground" />
                      <span>{formatWeight(item.weightInProcessing)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                     <div className="flex items-center justify-end gap-2">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span>{formatWeight(item.weightIncoming)}</span>
                    </div>
                  </TableCell>
                   <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEditClick(e, item.id)}
                    >
                      <Pencil className="mr-2" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

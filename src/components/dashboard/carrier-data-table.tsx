
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Pencil } from 'lucide-react';
import type { Carrier } from '@/lib/data';
import { cn } from '@/lib/utils';
import { StarRating } from '../ui/star-rating';

interface CarrierDataTableProps {
  carriers: Carrier[];
  onEditCarrier: (carrier: Carrier) => void;
}

export function CarrierDataTable({ carriers, onEditCarrier }: CarrierDataTableProps) {
  const router = useRouter();
  const statusVariant = {
    Active: 'default',
    Inactive: 'destructive',
  } as const;

  const handleRowClick = (carrierId: string) => {
    router.push(`/carriers/${carrierId}`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          Carriers
        </CardTitle>
        <CardDescription>
          A list of all logistics partners.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Carrier Name</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carriers.map((carrier) => (
              <TableRow 
                key={carrier.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(carrier.id)}
              >
                <TableCell className="font-medium">{carrier.name}</TableCell>
                <TableCell>
                  <div className="text-sm">{carrier.contactName}</div>
                  <div className="text-xs text-muted-foreground">{carrier.contactEmail}</div>
                </TableCell>
                <TableCell>
                  <StarRating rating={carrier.rating} />
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[carrier.status]}>
                    {carrier.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => onEditCarrier(carrier)}>
                    <Pencil className="mr-2" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

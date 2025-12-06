
'use client';

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
import { TestTube } from 'lucide-react';
import type { WaterQualityEntry } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';

interface WaterQualityTableProps {
  data: WaterQualityEntry[];
}

export function WaterQualityTable({ data }: WaterQualityTableProps) {
    const statusVariant = {
        'Pass': 'default',
        'Fail': 'destructive',
      } as const;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-primary" />
          Water Quality Monitoring
        </CardTitle>
        <CardDescription>
          Recent water quality test results from various sources.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[250px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>pH</TableHead>
                <TableHead>Turbidity (NTU)</TableHead>
                <TableHead>Conductivity (µS/cm)</TableHead>
                <TableHead className="text-right">Overall Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium">{entry.source}</div>
                    <div className="text-xs text-muted-foreground">{entry.date}</div>
                  </TableCell>
                  <TableCell className="font-mono">{entry.pH.toFixed(2)}</TableCell>
                  <TableCell className="font-mono">{entry.turbidity.toFixed(2)}</TableCell>
                  <TableCell className="font-mono">{entry.conductivity.toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={statusVariant[entry.status]}
                      className="capitalize"
                    >
                      {entry.status}
                    </Badge>
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


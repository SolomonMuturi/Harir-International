
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Alert = {
  id: string;
  time: string;
  type: 'Temperature Excursion' | 'Temperature Return';
  description: string;
};

interface ColdRoomAlertsProps {
  alerts: Alert[];
}

export function ColdRoomAlerts({ alerts }: ColdRoomAlertsProps) {
  const getBadgeVariant = (type: Alert['type']) => {
    if (type === 'Temperature Excursion') return 'destructive';
    if (type === 'Temperature Return') return 'secondary';
    return 'default';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <CardDescription>A log of recent temperature alerts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-mono text-xs">{alert.time}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(alert.type)}>{alert.type}</Badge>
                </TableCell>
                <TableCell>{alert.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

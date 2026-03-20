
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
import { Button } from '@/components/ui/button';
import { BrainCircuit, Settings } from 'lucide-react';
import type { PredictiveMaintenanceAlert } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface PredictiveMaintenanceProps {
  alerts: PredictiveMaintenanceAlert[];
}

export function PredictiveMaintenance({ alerts }: PredictiveMaintenanceProps) {
    const { toast } = useToast();
    
    const riskVariant = {
        High: 'destructive',
        Medium: 'secondary',
        Low: 'outline',
    } as const;

    const handleAction = (alert: PredictiveMaintenanceAlert) => {
        toast({
            title: `Action Logged for ${alert.asset}`,
            description: `"${alert.nextAction}" has been scheduled.`,
        });
    }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          Predictive Maintenance
        </CardTitle>
        <CardDescription>
          AI-driven alerts for potential equipment failures.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Predicted Issue</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id} className={alert.riskLevel === 'High' ? 'bg-destructive/10' : ''}>
                  <TableCell className="font-medium">{alert.asset}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.location}</TableCell>
                  <TableCell>{alert.issue}</TableCell>
                  <TableCell>
                    <Badge variant={riskVariant[alert.riskLevel]}>
                        {alert.riskLevel} ({alert.confidence * 100}%)
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleAction(alert)}>
                        <Settings className="mr-2" />
                        {alert.nextAction}
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

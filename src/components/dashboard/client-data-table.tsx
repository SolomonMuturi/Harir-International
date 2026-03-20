
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
import { Users2, Pencil, BarChart } from 'lucide-react';
import type { Client } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';

interface ClientDataTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
}

export function ClientDataTable({ clients, onEditClient }: ClientDataTableProps) {
  const router = useRouter();
  const statusVariant = {
    Active: 'default',
    New: 'secondary',
    Suspended: 'destructive',
  } as const;

  const handleRowClick = (client: Client) => {
    // In a real app, this would navigate to a client-specific dashboard
    // For now, it will navigate to the main dashboard as a placeholder
    router.push('/');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-primary" />
          Client Accounts
        </CardTitle>
        <CardDescription>
          Overview of all client accounts on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-24rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow 
                  key={client.id}
                  className={cn(
                    'cursor-pointer',
                    client.status === 'Suspended' && 'bg-destructive/10'
                  )}
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{client.contactName}</div>
                    <div className="text-xs text-muted-foreground">{client.contactEmail}</div>
                  </TableCell>
                  <TableCell>
                      <Badge variant="outline">{client.subscriptionTier}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(client.joinDate), 'PPP')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[client.status]}
                      className="capitalize"
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleRowClick(client)}>
                        <BarChart className="mr-2" />
                        Dashboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEditClient(client)}>
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

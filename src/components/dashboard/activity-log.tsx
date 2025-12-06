
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListCollapse, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { ActivityLog as ActivityLogType } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

interface ActivityLogProps {
  logs: ActivityLogType[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
    
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const statusVariant = {
    success: 'default',
    failure: 'destructive',
    pending: 'secondary',
  } as const;

  const statusIcon = {
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    failure: <AlertCircle className="w-4 h-4 text-red-500" />,
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
  } as const;
  
  const getInitials = (name: string) => {
    if (name === 'System') return 'SYS';
    return name.split(' ').map(n => n[0]).join('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListCollapse className="w-5 h-5" />
          User Activity Log
        </CardTitle>
        <CardDescription>
          A log of recent user and system activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[370px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={log.avatar} />
                        <AvatarFallback>{getInitials(log.user)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {hasMounted ? (
                      formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                    ) : (
                      <Skeleton className="h-4 w-24" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusVariant[log.status]} className="capitalize flex items-center gap-1 w-fit ml-auto">
                        {statusIcon[log.status]}
                        <span>{log.status}</span>
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

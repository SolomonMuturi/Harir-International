

'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { ListCollapse, CheckCircle, AlertCircle, Clock, Search } from 'lucide-react';
import type { ActivityLog as ActivityLogType } from '@/lib/data';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ColdRoomLogTableProps {
  logs: ActivityLogType[];
  onRowClick: (log: ActivityLogType) => void;
}

export function ColdRoomLogTable({ logs, onRowClick }: ColdRoomLogTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

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
  };

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                <ListCollapse className="w-5 h-5" />
                Activity Log
                </CardTitle>
                <CardDescription>
                A detailed log of all system and user activities related to cold chain.
                </CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-26rem)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} onClick={() => onRowClick(log)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), 'PPP p')}
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


'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ActivityLog } from '@/lib/data';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';

interface LogDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  log: ActivityLog | null;
}

export function LogDetailDialog({ isOpen, onOpenChange, log }: LogDetailDialogProps) {
  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Details</DialogTitle>
          <DialogDescription>
            Detailed information for log entry #{log.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">User:</span>
            <span className="font-semibold">{log.user}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Action:</span>
            <span className="font-semibold">{log.action}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Timestamp:</span>
            <span className="font-mono">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">IP Address:</span>
            <span className="font-mono">{log.ip}</span>
          </div>
          <Separator />
           <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="capitalize">{log.status}</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

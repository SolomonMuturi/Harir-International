// src/components/dashboard/activity-log.tsx
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ListCollapse, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Loader2,
  User,
  Shield,
  LogIn,
  Package,
  Truck,
  Thermometer,
  FileText,
  Banknote,
  Settings,
  Database,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { Button } from '../ui/button';

// Interface matching your Prisma schema
interface ActivityLogEntry {
  id: string;
  user: string | null;
  avatar: string | null;
  action: string | null;
  ip: string | null;
  timestamp: Date | null;
  status: 'success' | 'failure' | 'pending';
  created_at: Date;
}

// Action to icon mapping
const getActionIcon = (action: string | null) => {
  if (!action) return <ListCollapse className="w-4 h-4" />;
  
  const lowerAction = action.toLowerCase();
  
  if (lowerAction.includes('login') || lowerAction.includes('logout') || lowerAction.includes('auth')) {
    return <LogIn className="w-4 h-4" />;
  }
  if (lowerAction.includes('user') || lowerAction.includes('admin') || lowerAction.includes('role')) {
    return <User className="w-4 h-4" />;
  }
  if (lowerAction.includes('cold') || lowerAction.includes('temperature') || lowerAction.includes('humidity')) {
    return <Thermometer className="w-4 h-4" />;
  }
  if (lowerAction.includes('shipment') || lowerAction.includes('carrier') || lowerAction.includes('truck')) {
    return <Truck className="w-4 h-4" />;
  }
  if (lowerAction.includes('package') || lowerAction.includes('inventory') || lowerAction.includes('weight') || lowerAction.includes('box')) {
    return <Package className="w-4 h-4" />;
  }
  if (lowerAction.includes('invoice') || lowerAction.includes('payment') || lowerAction.includes('account')) {
    return <Banknote className="w-4 h-4" />;
  }
  if (lowerAction.includes('report') || lowerAction.includes('document') || lowerAction.includes('file')) {
    return <FileText className="w-4 h-4" />;
  }
  if (lowerAction.includes('security') || lowerAction.includes('permission') || lowerAction.includes('access')) {
    return <Shield className="w-4 h-4" />;
  }
  if (lowerAction.includes('system') || lowerAction.includes('database') || lowerAction.includes('backup')) {
    return <Database className="w-4 h-4" />;
  }
  if (lowerAction.includes('setting') || lowerAction.includes('config')) {
    return <Settings className="w-4 h-4" />;
  }
  if (lowerAction.includes('error') || lowerAction.includes('fail') || lowerAction.includes('warning')) {
    return <AlertTriangle className="w-4 h-4" />;
  }
  
  return <ListCollapse className="w-4 h-4" />;
};

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/activity-logs');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch activity logs`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load activity logs');
      }
      
      setLogs(data.logs || []);
      
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      setError(error.message);
      toast.error('Failed to load activity logs');
      setLogs([]); // Ensure empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivityLogs();
  };

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

  const getInitials = (name: string | null) => {
    if (!name || name.trim() === '') return 'SYS';
    if (name.toLowerCase() === 'system') return 'SYS';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const formatAction = (action: string | null) => {
    if (!action) return 'System Activity';
    
    // Replace underscores with spaces and capitalize each word
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  // Function to manually seed some activity logs if table is empty
  const seedSampleLogs = async () => {
    try {
      const response = await fetch('/api/activity-logs/seed', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Added sample activity logs');
        fetchActivityLogs();
      } else {
        throw new Error('Failed to seed logs');
      }
    } catch (error) {
      toast.error('Failed to seed activity logs');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListCollapse className="w-5 h-5" />
            <CardTitle className="text-lg">Activity Log</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="h-8 px-2"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
        <CardDescription className="text-xs">
          System and user activities
          {logs.length > 0 && ` • ${logs.length} recent entries`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[340px]">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <AlertTriangle className="w-12 h-12 text-destructive mb-3" />
              <h3 className="font-medium mb-1">Database Connection Error</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {error}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchActivityLogs}
                >
                  Retry
                </Button>
                <Button 
                  size="sm"
                  onClick={seedSampleLogs}
                >
                  Add Sample Data
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Database className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No Activity Logs Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your activity_logs table is empty. Actions will appear here as users interact with the system.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchActivityLogs}
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Refresh
                </Button>
                <Button 
                  size="sm"
                  onClick={seedSampleLogs}
                >
                  Add Sample Data
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-10">
                  <TableHead className="h-8 px-3 py-2">Action</TableHead>
                  <TableHead className="h-8 px-3 py-2">User</TableHead>
                  <TableHead className="h-8 px-3 py-2">Time</TableHead>
                  <TableHead className="h-8 px-3 py-2 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="h-12 hover:bg-muted/50">
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[150px]">
                            {formatAction(log.action)}
                          </span>
                          {log.ip && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {log.ip}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {getInitials(log.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate max-w-[80px]">
                          {log.user || 'System'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      {hasMounted && log.timestamp ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                          <span className="text-[10px] opacity-75">
                            {new Date(log.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      ) : (
                        <Skeleton className="h-3 w-16" />
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <Badge
                        variant={statusVariant[log.status]}
                        className="capitalize flex items-center gap-1 w-fit ml-auto text-[10px] px-1.5 py-0.5"
                      >
                        <span className="w-1.5 h-1.5">
                          {statusIcon[log.status]}
                        </span>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
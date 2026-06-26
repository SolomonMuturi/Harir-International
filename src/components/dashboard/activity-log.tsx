// src/components/dashboard/activity-log.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar as CalendarIcon, Search, X, Eye, RefreshCw } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Icons
import {
  ListCollapse,
  CheckCircle,
  AlertCircle,
  Clock,
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
  AlertTriangle,
  Users,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Mail,
  Bell,
  Key,
  Lock,
  Unlock,
  Globe,
  Server,
  HardDrive,
  Network,
  Cpu,
  MessageSquare,
  FileSearch,
  CreditCard,
  ShoppingCart,
  Home,
  Menu,
  MoreHorizontal,
} from 'lucide-react';

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

  // Authentication & Security
  if (lowerAction.includes('login')) return <LogIn className="w-4 h-4" />;
  if (lowerAction.includes('logout')) return <LogIn className="w-4 h-4 rotate-180" />;
  if (lowerAction.includes('register') || lowerAction.includes('signup')) return <Users className="w-4 h-4" />;
  if (lowerAction.includes('password') || lowerAction.includes('reset')) return <Key className="w-4 h-4" />;
  if (lowerAction.includes('lock') || lowerAction.includes('block')) return <Lock className="w-4 h-4" />;
  if (lowerAction.includes('unlock') || lowerAction.includes('unblock')) return <Unlock className="w-4 h-4" />;
  if (lowerAction.includes('error')) return <AlertCircle className="w-4 h-4" />;

  // User Management
  if (lowerAction.includes('user')) {
    if (lowerAction.includes('create') || lowerAction.includes('add')) return <Plus className="w-4 h-4 text-green-500" />;
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return <Edit className="w-4 h-4 text-blue-500" />;
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return <Trash2 className="w-4 h-4 text-red-500" />;
    return <User className="w-4 h-4" />;
  }

  // Role & Permissions
  if (lowerAction.includes('role') || lowerAction.includes('permission')) {
    return <Shield className="w-4 h-4" />;
  }

  // Shipments
  if (lowerAction.includes('shipment') || lowerAction.includes('carrier')) {
    if (lowerAction.includes('create')) return <Plus className="w-4 h-4 text-green-500" />;
    if (lowerAction.includes('update')) return <Edit className="w-4 h-4 text-blue-500" />;
    if (lowerAction.includes('delete')) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (lowerAction.includes('deliver')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (lowerAction.includes('delay')) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Truck className="w-4 h-4" />;
  }

  // Temperature & Cold Rooms
  if (lowerAction.includes('temperature') || lowerAction.includes('humidity') || lowerAction.includes('coldroom')) {
    return <Thermometer className="w-4 h-4" />;
  }

  // Inventory & Packages
  if (lowerAction.includes('package') || lowerAction.includes('inventory') || lowerAction.includes('stock') || lowerAction.includes('box')) {
    if (lowerAction.includes('add')) return <Plus className="w-4 h-4 text-green-500" />;
    if (lowerAction.includes('remove')) return <Trash2 className="w-4 h-4 text-red-500" />;
    return <Package className="w-4 h-4" />;
  }

  // Financial
  if (lowerAction.includes('invoice') || lowerAction.includes('payment') || lowerAction.includes('transaction')) {
    if (lowerAction.includes('create')) return <Plus className="w-4 h-4 text-green-500" />;
    if (lowerAction.includes('failed')) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Banknote className="w-4 h-4" />;
  }

  // Documents & Reports
  if (lowerAction.includes('report') || lowerAction.includes('document') || lowerAction.includes('file')) {
    if (lowerAction.includes('download')) return <Download className="w-4 h-4" />;
    if (lowerAction.includes('upload')) return <Upload className="w-4 h-4" />;
    if (lowerAction.includes('generate')) return <FileSearch className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  }

  // Suppliers
  if (lowerAction.includes('supplier')) {
    if (lowerAction.includes('check_in') || lowerAction.includes('checkin')) return <LogIn className="w-4 h-4 text-green-500" />;
    if (lowerAction.includes('check_out') || lowerAction.includes('checkout')) return <LogIn className="w-4 h-4 rotate-180 text-red-500" />;
    if (lowerAction.includes('weight')) return <Package className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  }

  // Weight Entries
  if (lowerAction.includes('weight')) {
    return <Package className="w-4 h-4" />;
  }

  // Counting Records
  if (lowerAction.includes('counting')) {
    return <FileText className="w-4 h-4" />;
  }

  // System
  if (lowerAction.includes('system') || lowerAction.includes('database')) {
    if (lowerAction.includes('backup')) return <HardDrive className="w-4 h-4" />;
    return <Database className="w-4 h-4" />;
  }
  if (lowerAction.includes('setting') || lowerAction.includes('config')) {
    return <Settings className="w-4 h-4" />;
  }

  // Communication
  if (lowerAction.includes('email') || lowerAction.includes('mail')) return <Mail className="w-4 h-4" />;
  if (lowerAction.includes('message') || lowerAction.includes('chat')) return <MessageSquare className="w-4 h-4" />;
  if (lowerAction.includes('notification')) return <Bell className="w-4 h-4" />;

  // Search & View
  if (lowerAction.includes('search') || lowerAction.includes('view') || lowerAction.includes('read')) {
    return <FileSearch className="w-4 h-4" />;
  }

  // Network & API
  if (lowerAction.includes('api') || lowerAction.includes('webhook')) return <Globe className="w-4 h-4" />;
  if (lowerAction.includes('server')) return <Server className="w-4 h-4" />;
  if (lowerAction.includes('network')) return <Network className="w-4 h-4" />;
  if (lowerAction.includes('cpu') || lowerAction.includes('memory')) return <Cpu className="w-4 h-4" />;

  // Generic CRUD
  if (lowerAction.includes('create') || lowerAction.includes('add')) return <Plus className="w-4 h-4 text-green-500" />;
  if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('modify')) {
    return <Edit className="w-4 h-4 text-blue-500" />;
  }
  if (lowerAction.includes('delete') || lowerAction.includes('remove')) return <Trash2 className="w-4 h-4 text-red-500" />;

  return <ListCollapse className="w-4 h-4" />;
};

// Status configuration
const statusConfig = {
  success: {
    variant: 'default' as const,
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Success',
    className: 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200',
  },
  failure: {
    variant: 'destructive' as const,
    icon: <AlertCircle className="w-3 h-3" />,
    label: 'Failed',
    className: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200',
  },
  pending: {
    variant: 'secondary' as const,
    icon: <Clock className="w-3 h-3" />,
    label: 'Pending',
    className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-200',
  },
};

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [statusCounts, setStatusCounts] = useState({
    success: 0,
    failure: 0,
    pending: 0,
  });

  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (dateRange.from) params.append('from', dateRange.from.toISOString());
      if (dateRange.to) params.append('to', dateRange.to.toISOString());

      const response = await fetch(`/api/activity-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load activity logs');
      }
      
      setLogs(data.logs || []);
      setFilteredLogs(data.logs || []);
      setStatusCounts(data.counts || { success: 0, failure: 0, pending: 0 });
      
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      toast.error('Failed to load activity logs');
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchTerm, dateRange]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivityLogs();
    toast.success('Activity logs refreshed');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

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
    if (!action) return 'Unknown Action';
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateRange.from;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListCollapse className="w-5 h-5" />
              <CardTitle className="text-lg">Activity Log</CardTitle>
              <Badge variant="secondary" className="ml-2">
                {filteredLogs.length} / {logs.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                  ✓ {statusCounts.success}
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                  ✗ {statusCounts.failure}
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400">
                  ⏳ {statusCounts.pending}
                </Badge>
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
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Search actions, users, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">✓ Success</SelectItem>
                <SelectItem value="failure">✗ Failed</SelectItem>
                <SelectItem value="pending">⏳ Pending</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-sm"
                >
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM d')
                    )
                  ) : (
                    'Date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <CardDescription className="text-xs mt-2">
          System and user activities with advanced filtering
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Database className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No Activity Logs Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'No logs match your filters. Try adjusting your search criteria.'
                  : 'Actions will appear here as users interact with the system.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-10 bg-muted/50">
                  <TableHead className="h-8 px-3 py-2">Action</TableHead>
                  <TableHead className="h-8 px-3 py-2">User</TableHead>
                  <TableHead className="h-8 px-3 py-2">Time</TableHead>
                  <TableHead className="h-8 px-3 py-2 text-center">Status</TableHead>
                  <TableHead className="h-8 px-3 py-2 text-right w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="h-12 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedLog(log);
                      setIsDetailOpen(true);
                    }}
                  >
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {formatAction(log.action)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {getInitials(log.user || log.avatar)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate max-w-[80px]">
                          {log.user || 'System'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp 
                            ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
                            : 'N/A'}
                        </span>
                        <span className="text-[10px] opacity-75">
                          {log.timestamp 
                            ? format(new Date(log.timestamp), 'MMM d, HH:mm:ss')
                            : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      <Badge
                        variant={statusConfig[log.status].variant}
                        className={cn(
                          'capitalize flex items-center gap-1 w-fit mx-auto text-[10px] px-1.5 py-0.5',
                          statusConfig[log.status].className
                        )}
                      >
                        {statusConfig[log.status].icon}
                        {statusConfig[log.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && (
                <>
                  <div className="p-1 rounded bg-primary/10 text-primary">
                    {getActionIcon(selectedLog.action)}
                  </div>
                  Activity Details
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed information about the activity
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Action</h4>
                  <p className="text-sm mt-1 font-medium">{formatAction(selectedLog.action)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <Badge
                    variant={statusConfig[selectedLog.status].variant}
                    className={cn(
                      'capitalize flex items-center gap-1 mt-1 w-fit',
                      statusConfig[selectedLog.status].className
                    )}
                  >
                    {statusConfig[selectedLog.status].icon}
                    {statusConfig[selectedLog.status].label}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">User</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {getInitials(selectedLog.user || selectedLog.avatar)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm">{selectedLog.user || 'System'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Timestamp</h4>
                  <p className="text-sm mt-1">
                    {selectedLog.timestamp 
                      ? format(new Date(selectedLog.timestamp), 'PPPppp')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">IP Address</h4>
                  <p className="text-sm mt-1 font-mono">{selectedLog.ip || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Created At</h4>
                  <p className="text-sm mt-1">
                    {selectedLog.created_at 
                      ? format(new Date(selectedLog.created_at), 'PPPppp')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
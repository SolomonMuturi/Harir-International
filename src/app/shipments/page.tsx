'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshTraceLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';
import { generateContainerPdf } from '@/lib/container-pdf';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  PlusCircle,
  RefreshCw,
  Search,
  Container as ContainerIcon,
  MapPin,
  Thermometer,
  CalendarDays,
  Download,
  Pencil,
  Trash2,
  Eye,
  Inbox,
  Ship,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';

interface ContainerUpdate {
  id: string;
  current_location: string | null;
  current_temperature: string | null;
  arrival_date: string | null;
  updated_at: string;
}

interface ContainerRecord {
  id: string;
  shipment_number: string;
  invoice_number: string | null;
  bl_number: string | null;
  container_number: string;
  current_location: string | null;
  current_temperature: string | null;
  arrival_date: string | null;
  destination: string | null;
  created_at: string;
  updated_at: string;
  updates?: ContainerUpdate[];
}

interface ContainerForm {
  shipmentNumber: string;
  invoiceNumber: string;
  blNumber: string;
  containerNumber: string;
  currentLocation: string;
  currentTemperature: string;
  arrivalDate: string;
  destination: string;
}

const emptyForm: ContainerForm = {
  shipmentNumber: '',
  invoiceNumber: '',
  blNumber: '',
  containerNumber: '',
  currentLocation: '',
  currentTemperature: '',
  arrivalDate: '',
  destination: '',
};

const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return session?.user || { name: 'System', id: 'system' };
  } catch (error) {
    return { name: 'System', id: 'system' };
  }
};

function isArrived(container: ContainerRecord): boolean {
  if (!container.arrival_date) return false;
  return new Date(container.arrival_date).getTime() <= Date.now();
}

function ContainersContent() {
  const { toast } = useToast();
  const [containers, setContainers] = useState<ContainerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_transit' | 'arrived'>('all');

  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [createForm, setCreateForm] = useState<ContainerForm>(emptyForm);
  const [selected, setSelected] = useState<ContainerRecord | null>(null);
  const [updateForm, setUpdateForm] = useState<ContainerForm>(emptyForm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchContainers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/containers${params.toString() ? '?' + params.toString() : ''}`);
      if (!response.ok) throw new Error('Failed to fetch containers');

      const data = await response.json();
      setContainers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching containers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load containers.',
        variant: 'destructive',
      });
      setContainers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, toast]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  const fetchContainerDetail = async (id: string): Promise<ContainerRecord | null> => {
    try {
      const response = await fetch(`/api/containers/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching container detail:', error);
      return null;
    }
  };

  const handleOpenCreate = () => {
    setCreateForm(emptyForm);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.shipmentNumber.trim() || !createForm.containerNumber.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Shipment number and container number are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          arrivalDate: createForm.arrivalDate
            ? new Date(createForm.arrivalDate).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create container');
      }

      const currentUser = await getCurrentUser();
      await logActivity({
        user: currentUser?.name || 'System',
        action: 'CONTAINER_CREATED',
        status: 'success',
        metadata: {
          userId: currentUser?.id,
          containerNumber: createForm.containerNumber,
          shipmentNumber: createForm.shipmentNumber,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: 'Container created',
        description: `Container ${createForm.containerNumber} has been added.`,
      });

      setShowCreate(false);
      setCreateForm(emptyForm);
      fetchContainers();
    } catch (error: any) {
      console.error('Error creating container:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create container.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenUpdate = async (container: ContainerRecord) => {
    const detail = await fetchContainerDetail(container.id);
    const target = detail || container;
    setSelected(target);
    setUpdateForm({
      shipmentNumber: target.shipment_number,
      invoiceNumber: target.invoice_number || '',
      blNumber: target.bl_number || '',
      containerNumber: target.container_number,
      currentLocation: target.current_location || '',
      currentTemperature: target.current_temperature || '',
      arrivalDate: target.arrival_date
        ? format(new Date(target.arrival_date), 'yyyy-MM-dd')
        : '',
      destination: target.destination || '',
    });
    setShowUpdate(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/containers/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLocation: updateForm.currentLocation,
          currentTemperature: updateForm.currentTemperature,
          arrivalDate: updateForm.arrivalDate
            ? new Date(updateForm.arrivalDate).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update container');
      }

      const currentUser = await getCurrentUser();
      await logActivity({
        user: currentUser?.name || 'System',
        action: 'CONTAINER_UPDATED',
        status: 'success',
        metadata: {
          userId: currentUser?.id,
          containerNumber: selected.container_number,
          currentLocation: updateForm.currentLocation,
          currentTemperature: updateForm.currentTemperature,
          arrivalDate: updateForm.arrivalDate,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: 'Container updated',
        description: `Location, temperature and arrival date for ${selected.container_number} saved.`,
      });

      setShowUpdate(false);
      setSelected(null);
      fetchContainers();
    } catch (error: any) {
      console.error('Error updating container:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update container.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDetails = async (container: ContainerRecord) => {
    const detail = await fetchContainerDetail(container.id);
    setSelected(detail || container);
    setShowDetails(true);
  };

  const handleDelete = async (container: ContainerRecord) => {
    try {
      setDeletingId(container.id);
      const response = await fetch(`/api/containers/${container.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete container');

      const currentUser = await getCurrentUser();
      await logActivity({
        user: currentUser?.name || 'System',
        action: 'CONTAINER_DELETED',
        status: 'success',
        metadata: {
          userId: currentUser?.id,
          containerNumber: container.container_number,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: 'Container deleted',
        description: `${container.container_number} has been removed.`,
      });

      fetchContainers();
    } catch (error: any) {
      console.error('Error deleting container:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete container.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPdf = async (container: ContainerRecord) => {
    try {
      setDownloadingId(container.id);
      const detail = await fetchContainerDetail(container.id);
      const data = detail || container;

      await generateContainerPdf({
        id: data.id,
        shipment_number: data.shipment_number,
        invoice_number: data.invoice_number,
        bl_number: data.bl_number,
        container_number: data.container_number,
        current_location: data.current_location,
        current_temperature: data.current_temperature,
        arrival_date: data.arrival_date,
        destination: data.destination,
        created_at: data.created_at,
        updates: data.updates || [],
      });

      const currentUser = await getCurrentUser();
      await logActivity({
        user: currentUser?.name || 'System',
        action: 'CONTAINER_PDF_DOWNLOADED',
        status: 'success',
        metadata: {
          userId: currentUser?.id,
          containerNumber: data.container_number,
          fileType: 'PDF',
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: 'PDF downloaded',
        description: `Tracking PDF for ${data.container_number} downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading container PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const XLSX = await import('xlsx');
      const rows: Record<string, string>[] = containers.map((c) => ({
        'SHIPMENT NUMBER': c.shipment_number,
        'INVOICE NUMBER': c.invoice_number || '',
        'B/L NUMBER': c.bl_number || '',
        CONTAINER: c.container_number,
        LOCATION: c.current_location || '',
        TEMPERATURE: c.current_temperature || '',
        'ARRIVAL DATE': c.arrival_date
          ? format(new Date(c.arrival_date), 'dd/MM/yyyy')
          : '',
        DESTINATION: c.destination || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');

      const headers = rows.length > 0 ? Object.keys(rows[0]) : [
        'SHIPMENT NUMBER', 'INVOICE NUMBER', 'B/L NUMBER', 'CONTAINER',
        'LOCATION', 'TEMPERATURE', 'ARRIVAL DATE', 'DESTINATION',
      ];
      worksheet['!cols'] = headers.map((key) => ({
        wch: Math.max(
          key.length,
          ...rows.map((r) => String(r[key] || '').length)
        ) + 2,
      }));

      XLSX.writeFile(workbook, `containers_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

      const currentUser = await getCurrentUser();
      await logActivity({
        user: currentUser?.name || 'System',
        action: 'CONTAINER_EXCEL_EXPORTED',
        status: 'success',
        metadata: {
          userId: currentUser?.id,
          count: containers.length,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: 'Excel exported',
        description: `${containers.length} container(s) exported to Excel.`,
      });
    } catch (error) {
      console.error('Error exporting containers to Excel:', error);
      toast({
        title: 'Error',
        description: 'Failed to export containers to Excel.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const total = containers.length;
  const arrived = containers.filter(isArrived).length;
  const inTransit = total - arrived;

  const statusButtons: { value: typeof statusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'arrived', label: 'Arrived' },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
              Harir International
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="non-printable">
          <Header />
        </div>
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Container Tracking</h2>
              <p className="text-muted-foreground">
                Track containers by shipment, location, temperature and arrival date
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchContainers} disabled={loading}>
                <RefreshCw className={cn('mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={exporting || containers.length === 0}
              >
                <FileSpreadsheet className={cn('mr-2', exporting && 'animate-pulse')} />
                {exporting ? 'Exporting...' : 'Excel'}
              </Button>
              <Button onClick={handleOpenCreate}>
                <PlusCircle className="mr-2" />
                Add Container
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <Ship className="w-4 h-4" />
                  Total Containers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{total}</div>
                <p className="text-xs text-blue-500 mt-1">All tracked containers</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <ContainerIcon className="w-4 h-4" />
                  In Transit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-700">{inTransit}</div>
                <p className="text-xs text-amber-500 mt-1">Awaiting arrival</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <Inbox className="w-4 h-4" />
                  Arrived
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{arrived}</div>
                <p className="text-xs text-green-600 mt-1">Arrival date reached or passed</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shipment, container, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant={statusFilter === btn.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(btn.value)}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground ml-auto">
              {containers.length} container(s)
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Containers</CardTitle>
              <CardDescription>
                Container records with the latest location, temperature and arrival date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : containers.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <ContainerIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No containers found</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Add your first container to begin tracking.
                  </p>
                  <Button onClick={handleOpenCreate}>
                    <PlusCircle className="mr-2" />
                    Add Container
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shipment No</TableHead>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>B/L Number</TableHead>
                        <TableHead>Container No</TableHead>
                        <TableHead>Current Location</TableHead>
                        <TableHead>Temperature</TableHead>
                        <TableHead>Arrival Date</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {containers.map((container) => {
                        const arrivedNow = isArrived(container);
                        return (
                          <TableRow key={container.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              {container.shipment_number}
                            </TableCell>
                            <TableCell>{container.invoice_number || '-'}</TableCell>
                            <TableCell>{container.bl_number || '-'}</TableCell>
                            <TableCell className="font-mono">
                              {container.container_number}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {container.current_location || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1">
                                <Thermometer className="h-3 w-3 text-blue-500" />
                                {container.current_temperature || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                {container.arrival_date
                                  ? format(new Date(container.arrival_date), 'dd/MM/yyyy')
                                  : '-'}
                              </span>
                              {container.arrival_date && (
                                <Badge
                                  className={cn(
                                    'ml-2',
                                    arrivedNow
                                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                      : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                  )}
                                >
                                  {arrivedNow ? 'Arrived' : 'In Transit'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{container.destination || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="View details"
                                  onClick={() => handleOpenDetails(container)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Update location / temperature / arrival"
                                  onClick={() => handleOpenUpdate(container)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Download PDF"
                                  disabled={downloadingId === container.id}
                                  onClick={() => handleDownloadPdf(container)}
                                >
                                  <Download className={cn('h-4 w-4', downloadingId === container.id && 'animate-pulse')} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete"
                                  disabled={deletingId === container.id}
                                  onClick={() => handleDelete(container)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>

      {/* Create Container Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Container</DialogTitle>
            <DialogDescription>
              Enter the container details. Shipment, invoice, B/L, container number and
              destination remain constant after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shipment Number *</Label>
              <Input
                placeholder="e.g. SH-2026-001"
                value={createForm.shipmentNumber}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, shipmentNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Container Number *</Label>
              <Input
                placeholder="e.g. MSKU1234567"
                value={createForm.containerNumber}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, containerNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                placeholder="e.g. INV-2026-001"
                value={createForm.invoiceNumber}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>B/L Number</Label>
              <Input
                placeholder="e.g. BL-2026-001"
                value={createForm.blNumber}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, blNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input
                placeholder="e.g. Rotterdam"
                value={createForm.destination}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, destination: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Arrival Date</Label>
              <Input
                type="date"
                value={createForm.arrivalDate}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, arrivalDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Current Location</Label>
              <Input
                placeholder="e.g. Mombasa Port"
                value={createForm.currentLocation}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, currentLocation: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Current Temperature (°C)</Label>
              <Input
                placeholder="e.g. -1.5"
                value={createForm.currentTemperature}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, currentTemperature: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Saving...' : 'Add Container'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Container Dialog */}
      <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Container</DialogTitle>
            <DialogDescription>
              Update the current location, temperature and arrival date. Other details remain
              constant for the container.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipment No</span>
                  <span className="font-medium">{selected.shipment_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Container No</span>
                  <span className="font-medium font-mono">{selected.container_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice No</span>
                  <span className="font-medium">{selected.invoice_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">B/L Number</span>
                  <span className="font-medium">{selected.bl_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-medium">{selected.destination || '-'}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Location</Label>
                  <Input
                    placeholder="e.g. Djibouti Port"
                    value={updateForm.currentLocation}
                    onChange={(e) =>
                      setUpdateForm((prev) => ({ ...prev, currentLocation: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Temperature (°C)</Label>
                  <Input
                    placeholder="e.g. -1.0"
                    value={updateForm.currentTemperature}
                    onChange={(e) =>
                      setUpdateForm((prev) => ({ ...prev, currentTemperature: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arrival Date</Label>
                  <Input
                    type="date"
                    value={updateForm.arrivalDate}
                    onChange={(e) =>
                      setUpdateForm((prev) => ({ ...prev, arrivalDate: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdate(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Updates'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Container Details</DialogTitle>
            <DialogDescription>
              Full tracking information and update history for the container.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Shipment No</span>
                  <span className="font-medium">{selected.shipment_number}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Container No</span>
                  <span className="font-medium font-mono">{selected.container_number}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Invoice No</span>
                  <span className="font-medium">{selected.invoice_number || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">B/L Number</span>
                  <span className="font-medium">{selected.bl_number || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-medium">{selected.destination || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Arrival Date</span>
                  <span className="font-medium">
                    {selected.arrival_date
                      ? format(new Date(selected.arrival_date), 'dd/MM/yyyy')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Current Location</span>
                  <span className="font-medium">{selected.current_location || '-'}</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Current Temperature</span>
                  <span className="font-medium">{selected.current_temperature || '-'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Update History</h4>
                {selected.updates && selected.updates.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date &amp; Time</TableHead>
                          <TableHead>Arrival Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Temperature</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.updates.map((update) => (
                          <TableRow key={update.id}>
                            <TableCell>
                              {format(new Date(update.updated_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              {update.arrival_date
                                ? format(new Date(update.arrival_date), 'dd/MM/yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell>{update.current_location || '-'}</TableCell>
                            <TableCell>{update.current_temperature || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No updates recorded yet.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                    handleOpenUpdate(selected);
                  }}
                >
                  <Pencil className="mr-2" />
                  Update
                </Button>
                <Button
                  variant="outline"
                  disabled={downloadingId === selected.id}
                  onClick={() => handleDownloadPdf(selected)}
                >
                  <Download className={cn('mr-2', downloadingId === selected.id && 'animate-pulse')} />
                  Download PDF
                </Button>
                <Button asChild>
                  <Link href={`/shipments/${selected.id}/details`}>
                    <Eye className="mr-2" />
                    Full Details
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function ContainersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading Container Tracking...</h2>
          <p className="text-muted-foreground">Please wait while we load the container tracking system.</p>
        </div>
      </div>
    }>
      <ContainersContent />
    </Suspense>
  );
}

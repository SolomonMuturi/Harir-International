'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Search, Edit, Trash2, Phone, Mail, Truck, Star, RefreshCw, Download, FileText, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Carrier {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  rating: number;
  status: string;
  id_number: string;
  vehicle_registration: string;
  created_at: string;
  updated_at: string;
  _count?: {
    shipments: number;
  };
  shipments?: Array<{
    created_at: string;
    shipment_id: string;
    status: string;
  }>;
}

// CSV Export utility function with date filtering
const exportCarriersToCSV = (carriers: Carrier[], filters: any, filename: string = 'carriers-list') => {
  if (!carriers || carriers.length === 0) {
    return;
  }

  // Filter carriers by date range if specified
  let filteredCarriers = [...carriers];
  
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filteredCarriers = filteredCarriers.filter(carrier => {
      const carrierDate = new Date(carrier.created_at);
      return carrierDate >= fromDate;
    });
  }
  
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    filteredCarriers = filteredCarriers.filter(carrier => {
      const carrierDate = new Date(carrier.created_at);
      return carrierDate <= toDate;
    });
  }

  if (filteredCarriers.length === 0) {
    alert('No carriers match the selected date range');
    return;
  }

  // Create summary section
  const activeCarriers = filteredCarriers.filter(c => c.status === 'Active').length;
  const inactiveCarriers = filteredCarriers.filter(c => c.status === 'Inactive').length;
  const totalShipments = filteredCarriers.reduce((sum, c) => sum + (c._count?.shipments || 0), 0);
  const avgRating = filteredCarriers.length > 0 
    ? (filteredCarriers.reduce((sum, c) => sum + (c.rating || 0), 0) / filteredCarriers.length).toFixed(1)
    : '0.0';

  const summarySection = [
    ['CARRIERS MANAGEMENT REPORT'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['FILTER CRITERIA:'],
    [`Search Term: ${filters.searchTerm || 'None'}`],
    [`Status Filter: ${filters.statusFilter}`],
    [`Date Range: ${filters.dateFrom || 'Any'} to ${filters.dateTo || 'Any'}`],
    [''],
    ['REPORT SUMMARY:'],
    [`Total Carriers: ${filteredCarriers.length}`],
    [`Active Carriers: ${activeCarriers}`],
    [`Inactive Carriers: ${inactiveCarriers}`],
    [`Average Rating: ${avgRating}`],
    [`Total Shipments: ${totalShipments}`],
    [''],
    ['CARRIER DETAILS:'],
    [''] // Empty line before headers
  ];

  // Define CSV headers
  const headers = [
    'Carrier ID',
    'Name',
    'Contact Name',
    'Contact Email',
    'Contact Phone',
    'ID Number',
    'Vehicle Registration',
    'Rating',
    'Status',
    'Total Shipments',
    'Created Date',
    'Created Time',
    'Last Updated'
  ];

  // Convert data to CSV rows
  const rows = filteredCarriers.map((carrier) => {
    const createdDate = carrier.created_at ? new Date(carrier.created_at) : null;
    const createdDateStr = createdDate ? createdDate.toLocaleDateString() : '';
    const createdTimeStr = createdDate ? createdDate.toLocaleTimeString() : '';
    const updatedDate = carrier.updated_at ? new Date(carrier.updated_at).toLocaleDateString() : '';
    
    return [
      `"${carrier.id || ''}"`,
      `"${carrier.name || ''}"`,
      `"${carrier.contact_name || ''}"`,
      `"${carrier.contact_email || ''}"`,
      `"${carrier.contact_phone || ''}"`,
      `"${carrier.id_number || ''}"`,
      `"${carrier.vehicle_registration || ''}"`,
      `"${carrier.rating || 0}"`,
      `"${carrier.status || ''}"`,
      `"${carrier._count?.shipments || 0}"`,
      `"${createdDateStr}"`,
      `"${createdTimeStr}"`,
      `"${updatedDate}"`
    ].join(',');
  });

  // Combine all sections
  const csvContent = [
    ...summarySection.map(row => Array.isArray(row) ? row.join(',') : row),
    headers.join(','),
    ...rows
  ].join('\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Generate filename with date range if specified
  let downloadFilename = filename;
  if (filters.dateFrom) {
    downloadFilename += `_from_${filters.dateFrom}`;
  }
  if (filters.dateTo) {
    downloadFilename += `_to_${filters.dateTo}`;
  }
  downloadFilename += `_${new Date().toISOString().split('T')[0]}`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${downloadFilename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  
  return filteredCarriers.length;
};

// Helper function to format date for input
const formatDateForInput = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newCarrier, setNewCarrier] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    rating: 0,
    status: 'Active',
    id_number: '',
    vehicle_registration: ''
  });
  
  const router = useRouter();

  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      
      if (dateTo) {
        params.append('dateTo', dateTo);
      }
      
      console.log('🌐 Fetching carriers...');
      const response = await fetch(`/api/carriers${params.toString() ? '?' + params.toString() : ''}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 API Response:', data);
      
      if (data.success) {
        setCarriers(data.data || []);
      } else {
        console.error('API error:', data.error);
        setCarriers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching carriers:', error);
      // Fallback mock data for testing
      setCarriers([
        {
          id: '1',
          name: 'Fast Express Logistics',
          contact_name: 'John Doe',
          contact_email: 'john@fastexpress.com',
          contact_phone: '+254712345678',
          rating: 4.5,
          status: 'Active',
          id_number: 'CAR001',
          vehicle_registration: 'KAA123X',
          created_at: new Date('2024-01-15').toISOString(),
          updated_at: new Date('2024-01-20').toISOString(),
          _count: { shipments: 5 }
        },
        {
          id: '2',
          name: 'Premium Transport Ltd',
          contact_name: 'Jane Smith',
          contact_email: 'jane@premiumtrans.com',
          contact_phone: '+254723456789',
          rating: 4.2,
          status: 'Active',
          id_number: 'CAR002',
          vehicle_registration: 'KAB456Y',
          created_at: new Date('2024-02-10').toISOString(),
          updated_at: new Date('2024-02-15').toISOString(),
          _count: { shipments: 12 }
        },
        {
          id: '3',
          name: 'Reliable Haulers Inc',
          contact_name: 'Robert Johnson',
          contact_email: 'robert@reliablehaul.com',
          contact_phone: '+254734567890',
          rating: 3.8,
          status: 'Inactive',
          id_number: 'CAR003',
          vehicle_registration: 'KAC789Z',
          created_at: new Date('2024-03-05').toISOString(),
          updated_at: new Date('2024-03-10').toISOString(),
          _count: { shipments: 8 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🚀 Adding new carrier:', newCarrier);
      
      const response = await fetch('/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCarrier)
      });
      
      const result = await response.json();
      console.log('📥 Add carrier response:', result);
      
      if (result.success) {
        alert('✅ Carrier added successfully!');
        setIsAdding(false);
        setNewCarrier({
          name: '',
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          rating: 0,
          status: 'Active',
          id_number: '',
          vehicle_registration: ''
        });
        fetchCarriers(); // Refresh the list
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error: any) {
      console.error('🔴 Error adding carrier:', error);
      alert('🔴 Network error: ' + error.message);
    }
  };

  const handleDeleteCarrier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this carrier?')) return;
    
    try {
      const response = await fetch(`/api/carriers?id=${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Carrier deleted successfully!');
        fetchCarriers();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      alert('Error deleting carrier: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchCarriers();
    }
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    if (carriers.length === 0) {
      alert('No carriers data to export');
      return;
    }
    
    try {
      const count = exportCarriersToCSV(carriers, { 
        searchTerm, 
        statusFilter,
        dateFrom,
        dateTo 
      }, 'carriers-list');
      
      if (count) {
        alert(`Downloaded ${count} carriers as CSV file`);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Could not generate CSV file. Please try again.');
    }
  };

  // Apply date range preset
  const applyDateRangePreset = (preset: string) => {
    const today = new Date();
    let fromDate = '';
    let toDate = '';
    
    switch (preset) {
      case 'today':
        fromDate = formatDateForInput(today);
        toDate = formatDateForInput(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        fromDate = formatDateForInput(yesterday);
        toDate = formatDateForInput(yesterday);
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        fromDate = formatDateForInput(startOfWeek);
        toDate = formatDateForInput(today);
        break;
      case 'lastWeek':
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        fromDate = formatDateForInput(startOfLastWeek);
        toDate = formatDateForInput(endOfLastWeek);
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        fromDate = formatDateForInput(startOfMonth);
        toDate = formatDateForInput(today);
        break;
      case 'lastMonth':
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        fromDate = formatDateForInput(startOfLastMonth);
        toDate = formatDateForInput(endOfLastMonth);
        break;
      case 'all':
        // Clear dates
        fromDate = '';
        toDate = '';
        break;
    }
    
    setDateFrom(fromDate);
    setDateTo(toDate);
    setDateRangePreset(preset);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setDateFrom('');
    setDateTo('');
    setDateRangePreset('all');
    fetchCarriers();
  };

  if (loading) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                FreshTrace
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
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading carriers...</span>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
              FreshTrace
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
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Carriers Management</h1>
              <p className="text-muted-foreground">
                Manage your shipping carriers and track their performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleDownloadCSV}
                disabled={carriers.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={fetchCarriers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsAdding(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Carrier
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Carriers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{carriers.length}</div>
                <p className="text-xs text-muted-foreground">All carriers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {carriers.filter(c => c.status === 'Active').length}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {carriers.length > 0 
                    ? (carriers.reduce((sum, c) => sum + (c.rating || 0), 0) / carriers.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {carriers.reduce((sum, c) => sum + (c._count?.shipments || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all carriers</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Quick Date Presets */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Quick Date Range
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Time' },
                      { value: 'today', label: 'Today' },
                      { value: 'yesterday', label: 'Yesterday' },
                      { value: 'thisWeek', label: 'This Week' },
                      { value: 'lastWeek', label: 'Last Week' },
                      { value: 'thisMonth', label: 'This Month' },
                      { value: 'lastMonth', label: 'Last Month' }
                    ].map((preset) => (
                      <Button
                        key={preset.value}
                        variant={dateRangePreset === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyDateRangePreset(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom Date Range</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">From Date</label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => {
                            setDateFrom(e.target.value);
                            setDateRangePreset('custom');
                          }}
                          max={dateTo || formatDateForInput(new Date())}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">To Date</label>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => {
                            setDateTo(e.target.value);
                            setDateRangePreset('custom');
                          }}
                          min={dateFrom}
                          max={formatDateForInput(new Date())}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by name, contact, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                      />
                      <Button 
                        variant="outline"
                        onClick={fetchCarriers}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status Filter</label>
                    <div className="flex gap-2">
                      <Button
                        variant={statusFilter === 'All' ? 'default' : 'outline'}
                        onClick={() => {
                          setStatusFilter('All');
                          fetchCarriers();
                        }}
                      >
                        All
                      </Button>
                      <Button
                        variant={statusFilter === 'Active' ? 'default' : 'outline'}
                        onClick={() => {
                          setStatusFilter('Active');
                          fetchCarriers();
                        }}
                      >
                        Active
                      </Button>
                      <Button
                        variant={statusFilter === 'Inactive' ? 'default' : 'outline'}
                        onClick={() => {
                          setStatusFilter('Inactive');
                          fetchCarriers();
                        }}
                      >
                        Inactive
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {carriers.length} carrier(s)
                    {(dateFrom || dateTo) && (
                      <span className="ml-2">
                        • Date range: {dateFrom || 'Any'} to {dateTo || 'Any'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      size="sm"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Clear All Filters
                    </Button>
                    <Button
                      onClick={fetchCarriers}
                      size="sm"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Carrier Form */}
          {isAdding && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Carrier</CardTitle>
                <CardDescription>Enter carrier details below</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCarrier} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name *</label>
                      <Input
                        required
                        value={newCarrier.name}
                        onChange={(e) => setNewCarrier({...newCarrier, name: e.target.value})}
                        placeholder="Fast Express Logistics"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Contact Name</label>
                      <Input
                        value={newCarrier.contact_name}
                        onChange={(e) => setNewCarrier({...newCarrier, contact_name: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Contact Email</label>
                      <Input
                        type="email"
                        value={newCarrier.contact_email}
                        onChange={(e) => setNewCarrier({...newCarrier, contact_email: e.target.value})}
                        placeholder="contact@carrier.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Contact Phone</label>
                      <Input
                        value={newCarrier.contact_phone}
                        onChange={(e) => setNewCarrier({...newCarrier, contact_phone: e.target.value})}
                        placeholder="+254712345678"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Rating (0-5)</label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={newCarrier.rating}
                        onChange={(e) => setNewCarrier({...newCarrier, rating: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Status</label>
                      <select
                        value={newCarrier.status}
                        onChange={(e) => setNewCarrier({...newCarrier, status: e.target.value})}
                        className="w-full p-2 border rounded"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">ID Number</label>
                      <Input
                        value={newCarrier.id_number}
                        onChange={(e) => setNewCarrier({...newCarrier, id_number: e.target.value})}
                        placeholder="CAR001"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Vehicle Registration</label>
                      <Input
                        value={newCarrier.vehicle_registration}
                        onChange={(e) => setNewCarrier({...newCarrier, vehicle_registration: e.target.value})}
                        placeholder="KAA123X"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Carrier</Button>
                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Export Options Card */}
          {carriers.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <h3 className="font-medium text-blue-800 text-lg mb-1">Export Options</h3>
                    <p className="text-sm text-blue-600">
                      Download carrier data with filters and date range
                    </p>
                    {(dateFrom || dateTo) && (
                      <p className="text-xs text-blue-500 mt-1">
                        Current date range: {dateFrom || 'Any'} to {dateTo || 'Any'}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleDownloadCSV}
                      className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Export with Current Filters
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const activeCarriers = carriers.filter(c => c.status === 'Active');
                        const count = exportCarriersToCSV(
                          activeCarriers, 
                          { searchTerm, statusFilter: 'Active', dateFrom, dateTo }, 
                          'active-carriers'
                        );
                        if (count) {
                          alert(`Downloaded ${count} active carriers`);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Active Only
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Export for this month
                        const startOfMonth = new Date();
                        startOfMonth.setDate(1);
                        const endOfMonth = new Date();
                        
                        const monthCarriers = carriers.filter(carrier => {
                          const carrierDate = new Date(carrier.created_at);
                          return carrierDate >= startOfMonth && carrierDate <= endOfMonth;
                        });
                        
                        const count = exportCarriersToCSV(
                          monthCarriers,
                          { 
                            searchTerm, 
                            statusFilter,
                            dateFrom: formatDateForInput(startOfMonth),
                            dateTo: formatDateForInput(endOfMonth)
                          },
                          'carriers-this-month'
                        );
                        
                        if (count) {
                          alert(`Downloaded ${count} carriers from this month`);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      This Month
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Carriers List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">All Carriers ({carriers.length})</h2>
              <div className="text-sm text-muted-foreground">
                {carriers.length > 0 && (
                  <span className="flex items-center gap-2">
                    <span>Sorted by: Created Date (Newest First)</span>
                    {dateFrom || dateTo ? (
                      <Badge variant="outline" className="ml-2">
                        Filtered by Date
                      </Badge>
                    ) : null}
                  </span>
                )}
              </div>
            </div>

            {carriers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No carriers found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'All' || dateFrom || dateTo
                      ? 'Try changing your search or filter criteria'
                      : 'Get started by adding your first carrier'
                    }
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setIsAdding(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add First Carrier
                    </Button>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...carriers]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((carrier) => (
                  <Card key={carrier.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" />
                            {carrier.name}
                          </CardTitle>
                          <CardDescription className="flex flex-col gap-1">
                            <span>ID: {carrier.id_number || 'Not specified'}</span>
                            <span className="text-xs">
                              Added: {new Date(carrier.created_at).toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(carrier.status)}>
                          {carrier.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {carrier.contact_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Contact:</span>
                            <span>{carrier.contact_name}</span>
                          </div>
                        )}
                        
                        {carrier.contact_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{carrier.contact_phone}</span>
                          </div>
                        )}
                        
                        {carrier.contact_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{carrier.contact_email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{carrier.rating || 0}</span>
                            <span className="text-muted-foreground">/5</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {carrier._count?.shipments || 0} shipments
                          </div>
                        </div>
                        
                        {carrier.vehicle_registration && (
                          <div className="text-sm text-muted-foreground">
                            Vehicle: {carrier.vehicle_registration}
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/shipments?carrierId=${carrier.id}`)}
                          >
                            View Shipments
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCarrier(carrier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
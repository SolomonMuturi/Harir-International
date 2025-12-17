'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { employeeData } from '@/lib/data';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Truck, PackageCheck, Clock, RefreshCw, Printer, Download, FileText, BarChart3, Layers, Users, Calendar, Grid, Plus, Trash2, Save, Loader2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShipmentDataTable } from '@/components/dashboard/shipment-data-table';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define API response type
interface DatabaseShipment {
  id: string;
  shipment_id: string;
  customer_id?: string | null;
  origin?: string | null;
  destination?: string | null;
  status: string;
  product?: string | null;
  tags?: string | null;
  weight?: string | null;
  carrier?: string | null;
  expected_arrival?: string | null;
  created_at: string;
  customers?: {
    id: string;
    name: string;
    location?: string | null;
  } | null;
}

// Define Shipment type for frontend
interface Shipment {
  id: string;
  shipmentId: string;
  customer: string;
  origin: string;
  destination: string;
  status: string;
  product: string;
  weight: string;
  temperature: string;
  humidity: string;
  tags: string;
  expectedArrival: string;
  driver: string;
  carrier: string;
  priority: string;
  notes: string;
}

// Loading Sheet Types
interface LoadingSheetData {
  exporter: string;
  client: string;
  shippingLine: string;
  billNumber: string;
  container: string;
  seal1: string;
  seal2: string;
  truck: string;
  vessel: string;
  etaMSA: string;
  etdMSA: string;
  port: string;
  etaPort: string;
  tempRec1: string;
  tempRec2: string;
  loadingDate: string;
  pallets: {
    palletNo: number;
    temp: string;
    traceCode: string;
    sizes: {
      size12: number;
      size14: number;
      size16: number;
      size18: number;
      size20: number;
      size22: number;
      size24: number;
      size26: number;
      size28: number;
      size30: number;
    };
    total: number;
  }[];
}

// Database Loading Sheet Types
interface DatabaseLoadingSheet {
  id: string;
  exporter: string;
  client: string;
  shipping_line: string;
  bill_number: string;
  container: string;
  seal1: string;
  seal2: string;
  truck: string;
  vessel: string;
  eta_msa: string | null;
  etd_msa: string | null;
  port: string;
  eta_port: string | null;
  temp_rec1: string;
  temp_rec2: string;
  loading_date: string;
  loaded_by: string | null;
  checked_by: string | null;
  remarks: string | null;
  created_at: string;
  loading_pallets: {
    id: string;
    pallet_no: number;
    temp: string;
    trace_code: string;
    size12: number;
    size14: number;
    size16: number;
    size18: number;
    size20: number;
    size22: number;
    size24: number;
    size26: number;
    size28: number;
    size30: number;
    total: number;
  }[];
}

// Helper function to convert database status to display format
function convertDbStatusToDisplay(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'Awaiting_QC': 'Awaiting QC',
    'Processing': 'Processing',
    'Receiving': 'Receiving',
    'Preparing_for_Dispatch': 'Preparing for Dispatch',
    'Ready_for_Dispatch': 'Ready for Dispatch',
    'In_Transit': 'In-Transit',
    'Delayed': 'Delayed',
    'Delivered': 'Delivered'
  };
  
  return statusMap[dbStatus] || 'Awaiting QC';
}

// Loading Sheet Component
function LoadingSheet() {
  const defaultData: LoadingSheetData = {
    exporter: 'HARIR INTERNATIONAL LTD',
    client: '',
    shippingLine: '',
    billNumber: '',
    container: '',
    seal1: '',
    seal2: '',
    truck: '',
    vessel: '',
    etaMSA: '',
    etdMSA: '',
    port: '',
    etaPort: '',
    tempRec1: '',
    tempRec2: '',
    loadingDate: new Date().toISOString().split('T')[0],
    pallets: Array.from({ length: 20 }, (_, i) => ({
      palletNo: i + 1,
      temp: '',
      traceCode: '',
      sizes: {
        size12: 0,
        size14: 0,
        size16: 0,
        size18: 0,
        size20: 0,
        size22: 0,
        size24: 0,
        size26: 0,
        size28: 0,
        size30: 0,
      },
      total: 0,
    })),
  };

  const [sheetData, setSheetData] = useState<LoadingSheetData>(defaultData);
  const [saving, setSaving] = useState(false);
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [existingSheets, setExistingSheets] = useState<DatabaseLoadingSheet[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(true);

  // Fetch existing loading sheets
  const fetchLoadingSheets = useCallback(async () => {
    try {
      setLoadingSheets(true);
      const response = await fetch('/api/loading-sheets?limit=50');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch loading sheets: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setExistingSheets(result.data);
        console.log('📋 Loaded', result.data.length, 'existing loading sheets');
      }
    } catch (error) {
      console.error('Error fetching loading sheets:', error);
    } finally {
      setLoadingSheets(false);
    }
  }, []);

  useEffect(() => {
    fetchLoadingSheets();
  }, [fetchLoadingSheets]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const text = generateCSV();
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `loading-sheet-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get form values
      const loadedByInput = document.querySelector('input[placeholder="Loader\'s name & signature"]') as HTMLInputElement;
      const checkedByInput = document.querySelector('input[placeholder="Supervisor\'s name & signature"]') as HTMLInputElement;
      const remarksInput = document.querySelector('textarea[placeholder="Special instructions or notes"]') as HTMLTextAreaElement;

      // Prepare the data for saving
      const saveData = {
        exporter: sheetData.exporter,
        client: sheetData.client,
        shippingLine: sheetData.shippingLine,
        billNumber: sheetData.billNumber,
        container: sheetData.container,
        seal1: sheetData.seal1,
        seal2: sheetData.seal2,
        truck: sheetData.truck,
        vessel: sheetData.vessel,
        etaMSA: sheetData.etaMSA || undefined,
        etdMSA: sheetData.etdMSA || undefined,
        port: sheetData.port,
        etaPort: sheetData.etaPort || undefined,
        tempRec1: sheetData.tempRec1,
        tempRec2: sheetData.tempRec2,
        loadingDate: sheetData.loadingDate,
        loadedBy: loadedByInput?.value || '',
        checkedBy: checkedByInput?.value || '',
        remarks: remarksInput?.value || '',
        pallets: sheetData.pallets.map(pallet => ({
          palletNo: pallet.palletNo,
          temp: pallet.temp,
          traceCode: pallet.traceCode,
          sizes: pallet.sizes,
          total: pallet.total
        }))
      };

      console.log('📤 Saving loading sheet to database...', saveData);

      // Determine if we're creating new or updating existing
      const method = currentSheetId ? 'PUT' : 'POST';
      const url = currentSheetId 
        ? `/api/loading-sheets?id=${currentSheetId}`
        : '/api/loading-sheets';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to save loading sheet');
      }

      console.log('✅ Loading sheet saved successfully:', result);
      
      // Update current sheet ID if it's a new sheet
      if (!currentSheetId && result.data?.id) {
        setCurrentSheetId(result.data.id);
      }
      
      // Show success message
      const action = currentSheetId ? 'updated' : 'saved';
      alert(`✅ Loading sheet ${action} successfully!\nBill Number: ${result.data?.bill_number || 'N/A'}\nID: ${result.data?.id}`);
      
      // Refresh the list of existing sheets
      await fetchLoadingSheets();

    } catch (error: any) {
      console.error('❌ Error saving loading sheet:', error);
      alert(`❌ Failed to save loading sheet: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSheet = (sheetId: string) => {
    const selectedSheet = existingSheets.find(sheet => sheet.id === sheetId);
    if (selectedSheet) {
      // Convert database format to component format
      const convertedSheet: LoadingSheetData = {
        exporter: selectedSheet.exporter,
        client: selectedSheet.client,
        shippingLine: selectedSheet.shipping_line || '',
        billNumber: selectedSheet.bill_number || '',
        container: selectedSheet.container || '',
        seal1: selectedSheet.seal1 || '',
        seal2: selectedSheet.seal2 || '',
        truck: selectedSheet.truck || '',
        vessel: selectedSheet.vessel || '',
        etaMSA: selectedSheet.eta_msa ? new Date(selectedSheet.eta_msa).toLocaleDateString('en-GB') : '',
        etdMSA: selectedSheet.etd_msa ? new Date(selectedSheet.etd_msa).toLocaleDateString('en-GB') : '',
        port: selectedSheet.port || '',
        etaPort: selectedSheet.eta_port ? new Date(selectedSheet.eta_port).toLocaleDateString('en-GB') : '',
        tempRec1: selectedSheet.temp_rec1 || '',
        tempRec2: selectedSheet.temp_rec2 || '',
        loadingDate: selectedSheet.loading_date ? 
          new Date(selectedSheet.loading_date).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        pallets: selectedSheet.loading_pallets?.map(pallet => ({
          palletNo: pallet.pallet_no,
          temp: pallet.temp || '',
          traceCode: pallet.trace_code || '',
          sizes: {
            size12: pallet.size12,
            size14: pallet.size14,
            size16: pallet.size16,
            size18: pallet.size18,
            size20: pallet.size20,
            size22: pallet.size22,
            size24: pallet.size24,
            size26: pallet.size26,
            size28: pallet.size28,
            size30: pallet.size30
          },
          total: pallet.total
        })) || defaultData.pallets.slice(0, 20)
      };
      
      setSheetData(convertedSheet);
      setCurrentSheetId(selectedSheet.id);
      
      // Fill in the signature fields if they exist in the sheet
      setTimeout(() => {
        if (selectedSheet.loaded_by) {
          const loadedByInput = document.querySelector('input[placeholder="Loader\'s name & signature"]') as HTMLInputElement;
          if (loadedByInput) loadedByInput.value = selectedSheet.loaded_by;
        }
        if (selectedSheet.checked_by) {
          const checkedByInput = document.querySelector('input[placeholder="Supervisor\'s name & signature"]') as HTMLInputElement;
          if (checkedByInput) checkedByInput.value = selectedSheet.checked_by;
        }
        if (selectedSheet.remarks) {
          const remarksInput = document.querySelector('textarea[placeholder="Special instructions or notes"]') as HTMLTextAreaElement;
          if (remarksInput) remarksInput.value = selectedSheet.remarks;
        }
      }, 100);
    }
  };

  const handleNewSheet = () => {
    if (!currentSheetId || window.confirm('Create a new loading sheet? Current unsaved changes will be lost.')) {
      setSheetData({
        ...defaultData,
        loadingDate: new Date().toISOString().split('T')[0],
      });
      setCurrentSheetId(null);
      
      // Clear signature fields
      setTimeout(() => {
        const loadedByInput = document.querySelector('input[placeholder="Loader\'s name & signature"]') as HTMLInputElement;
        const checkedByInput = document.querySelector('input[placeholder="Supervisor\'s name & signature"]') as HTMLInputElement;
        const remarksInput = document.querySelector('textarea[placeholder="Special instructions or notes"]') as HTMLTextAreaElement;
        
        if (loadedByInput) loadedByInput.value = '';
        if (checkedByInput) checkedByInput.value = '';
        if (remarksInput) remarksInput.value = '';
      }, 100);
    }
  };

  const generateCSV = () => {
    const headers = ['LOADING SHEET\n\n'];
    headers.push(`EXPORTER,${sheetData.exporter},LOADING DATE,${sheetData.loadingDate}`);
    headers.push(`CLIENT,${sheetData.client},VESSEL,${sheetData.vessel}`);
    headers.push(`SHIPPING LINE,${sheetData.shippingLine},ETA MSA,${sheetData.etaMSA}`);
    headers.push(`BILL NUMBER,${sheetData.billNumber},ETD MSA,${sheetData.etdMSA}`);
    headers.push(`CONTAINER,${sheetData.container},PORT,${sheetData.port}`);
    headers.push(`SEAL 1,${sheetData.seal1},ETA PORT,${sheetData.etaPort}`);
    headers.push(`SEAL 2,${sheetData.seal2},TEMP REC 1,${sheetData.tempRec1}`);
    headers.push(`TRUCK,${sheetData.truck},TEMP REC 2,${sheetData.tempRec2}\n`);
    
    const tableHeaders = ['PALLET NO', 'TEMP', 'TRACE CODE', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30', 'Total'];
    headers.push(tableHeaders.join(','));
    
    const rows = sheetData.pallets.map(pallet => [
      pallet.palletNo,
      pallet.temp,
      pallet.traceCode,
      pallet.sizes.size12,
      pallet.sizes.size14,
      pallet.sizes.size16,
      pallet.sizes.size18,
      pallet.sizes.size20,
      pallet.sizes.size22,
      pallet.sizes.size24,
      pallet.sizes.size26,
      pallet.sizes.size28,
      pallet.sizes.size30,
      pallet.total,
    ].join(','));
    
    headers.push(...rows);
    
    const totals = sheetData.pallets.reduce(
      (acc, pallet) => {
        acc.size12 += pallet.sizes.size12;
        acc.size14 += pallet.sizes.size14;
        acc.size16 += pallet.sizes.size16;
        acc.size18 += pallet.sizes.size18;
        acc.size20 += pallet.sizes.size20;
        acc.size22 += pallet.sizes.size22;
        acc.size24 += pallet.sizes.size24;
        acc.size26 += pallet.sizes.size26;
        acc.size28 += pallet.sizes.size28;
        acc.size30 += pallet.sizes.size30;
        acc.grandTotal += pallet.total;
        return acc;
      },
      { 
        size12: 0, size14: 0, size16: 0, size18: 0, size20: 0, 
        size22: 0, size24: 0, size26: 0, size28: 0, size30: 0,
        grandTotal: 0 
      }
    );
    
    headers.push(`TOTAL,,,,${totals.size12},${totals.size14},${totals.size16},${totals.size18},${totals.size20},${totals.size22},${totals.size24},${totals.size26},${totals.size28},${totals.size30},${totals.grandTotal}\n`);
    headers.push('SUMMARY');
    headers.push(`12,${totals.size12}`);
    headers.push(`14,${totals.size14},Loaded by,`);
    headers.push(`16,${totals.size16}`);
    headers.push(`18,${totals.size18}`);
    headers.push(`20,${totals.size20}`);
    headers.push(`22,${totals.size22}`);
    headers.push(`24,${totals.size24}`);
    headers.push(`26,${totals.size26}`);
    headers.push(`28,${totals.size28}`);
    headers.push(`30,${totals.size30}`);
    
    return headers.join('\n');
  };

  const calculatePalletTotal = (sizes: LoadingSheetData['pallets'][0]['sizes']) => {
    return Object.values(sizes).reduce((sum, value) => sum + value, 0);
  };

  const updatePalletData = (palletIndex: number, field: keyof LoadingSheetData['pallets'][0], value: any) => {
    const newPallets = [...sheetData.pallets];
    
    if (field === 'sizes') {
      newPallets[palletIndex].sizes = { ...newPallets[palletIndex].sizes, ...value };
      newPallets[palletIndex].total = calculatePalletTotal(newPallets[palletIndex].sizes);
    } else {
      (newPallets[palletIndex] as any)[field] = value;
    }
    
    setSheetData({ ...sheetData, pallets: newPallets });
  };

  const updateField = (field: keyof LoadingSheetData, value: string) => {
    setSheetData({ ...sheetData, [field]: value });
  };

  const addPallet = () => {
    const newPalletNo = sheetData.pallets.length + 1;
    setSheetData({
      ...sheetData,
      pallets: [
        ...sheetData.pallets,
        {
          palletNo: newPalletNo,
          temp: '',
          traceCode: '',
          sizes: {
            size12: 0,
            size14: 0,
            size16: 0,
            size18: 0,
            size20: 0,
            size22: 0,
            size24: 0,
            size26: 0,
            size28: 0,
            size30: 0,
          },
          total: 0,
        }
      ]
    });
  };

  const removePallet = (index: number) => {
    if (sheetData.pallets.length <= 1) return;
    const newPallets = sheetData.pallets.filter((_, i) => i !== index);
    const renumberedPallets = newPallets.map((pallet, i) => ({
      ...pallet,
      palletNo: i + 1
    }));
    setSheetData({ ...sheetData, pallets: renumberedPallets });
  };

  const clearPallet = (index: number) => {
    const newPallets = [...sheetData.pallets];
    newPallets[index] = {
      palletNo: newPallets[index].palletNo,
      temp: '',
      traceCode: '',
      sizes: {
        size12: 0,
        size14: 0,
        size16: 0,
        size18: 0,
        size20: 0,
        size22: 0,
        size24: 0,
        size26: 0,
        size28: 0,
        size30: 0,
      },
      total: 0,
    };
    setSheetData({ ...sheetData, pallets: newPallets });
  };

  const totals = sheetData.pallets.reduce(
    (acc, pallet) => {
      acc.size12 += pallet.sizes.size12;
      acc.size14 += pallet.sizes.size14;
      acc.size16 += pallet.sizes.size16;
      acc.size18 += pallet.sizes.size18;
      acc.size20 += pallet.sizes.size20;
      acc.size22 += pallet.sizes.size22;
      acc.size24 += pallet.sizes.size24;
      acc.size26 += pallet.sizes.size26;
      acc.size28 += pallet.sizes.size28;
      acc.size30 += pallet.sizes.size30;
      acc.grandTotal += pallet.total;
      return acc;
    },
    { 
      size12: 0, size14: 0, size16: 0, size18: 0, size20: 0, 
      size22: 0, size24: 0, size26: 0, size28: 0, size30: 0,
      grandTotal: 0 
    }
  );

  return (
    <Card className="print:p-0 print:border-0 print:shadow-none">
      <CardHeader className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Grid className="h-6 w-6 text-primary" />
              Loading Sheet Generator
              {currentSheetId && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Editing: {currentSheetId.substring(0, 8)}...)
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete loading sheet with pallet tracking and size breakdown
            </p>
            
            {/* Loading sheet selector */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Label htmlFor="sheet-selector" className="text-xs font-medium">Load existing:</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    {loadingSheets ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-2" />
                        Select sheet ({existingSheets.length})
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Saved Loading Sheets</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {existingSheets.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No saved sheets found
                    </DropdownMenuItem>
                  ) : (
                    existingSheets.slice(0, 10).map(sheet => (
                      <DropdownMenuItem 
                        key={sheet.id} 
                        onClick={() => handleLoadSheet(sheet.id)}
                        className="flex flex-col items-start"
                      >
                        <div className="font-medium">{sheet.bill_number || 'No Bill'}</div>
                        <div className="text-xs text-muted-foreground">
                          {sheet.client || 'No Client'} • {new Date(sheet.loading_date).toLocaleDateString()}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  {existingSheets.length > 10 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>
                        +{existingSheets.length - 10} more sheets
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewSheet}
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {currentSheetId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {currentSheetId ? 'Update' : 'Save'}
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 print:p-0">
        <div className="loading-sheet print:p-4">
          {/* Header */}
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-1 print:text-2xl">
              LOADING SHEET
            </h1>
            <div className="w-24 h-0.5 bg-black mx-auto"></div>
          </div>
          
          {/* TWO-COLUMN HEADER INFORMATION */}
          <div className="grid grid-cols-2 gap-6 mb-8 print:mb-6">
            {/* Left Column */}
            <div className="space-y-3">
              {/* Row 1: EXPORTER + LOADING DATE */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">EXPORTER</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.exporter}
                    onChange={(e) => updateField('exporter', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium text-sm print:border-0 print:p-0"
                  />
                </div>
              </div>
              
              {/* Row 2: CLIENT + VESSEL */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">CLIENT</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.client}
                    onChange={(e) => updateField('client', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Client name"
                  />
                </div>
              </div>
              
              {/* Row 3: SHIPPING LINE + ETA MSA */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">SHIPPING LINE</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.shippingLine}
                    onChange={(e) => updateField('shippingLine', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Shipping line"
                  />
                </div>
              </div>
              
              {/* Row 4: BILL NUMBER + ETD MSA */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">BILL NUMBER</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.billNumber}
                    onChange={(e) => updateField('billNumber', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Bill number"
                  />
                </div>
              </div>
              
              {/* Row 5: CONTAINER + PORT */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">CONTAINER</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.container}
                    onChange={(e) => updateField('container', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Container number"
                  />
                </div>
              </div>
              
              {/* Row 6: SEAL 1 + ETA PORT */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">SEAL 1</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.seal1}
                    onChange={(e) => updateField('seal1', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Seal number"
                  />
                </div>
              </div>
              
              {/* Row 7: SEAL 2 + TEMP REC 1 */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">SEAL 2</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.seal2}
                    onChange={(e) => updateField('seal2', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Second seal"
                  />
                </div>
              </div>
              
              {/* Row 8: TRUCK + TEMP REC 2 */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">TRUCK</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.truck}
                    onChange={(e) => updateField('truck', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Truck registration"
                  />
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-3">
              {/* Row 1: LOADING DATE */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">LOADING DATE</div>
                <div className="w-2/3">
                  <Input
                    type="date"
                    value={sheetData.loadingDate}
                    onChange={(e) => updateField('loadingDate', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                  />
                </div>
              </div>
              
              {/* Row 2: VESSEL */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">VESSEL</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.vessel}
                    onChange={(e) => updateField('vessel', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Vessel name"
                  />
                </div>
              </div>
              
              {/* Row 3: ETA MSA */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">ETA MSA</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.etaMSA}
                    onChange={(e) => updateField('etaMSA', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="ETA at MSA"
                  />
                </div>
              </div>
              
              {/* Row 4: ETD MSA */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">ETD MSA</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.etdMSA}
                    onChange={(e) => updateField('etdMSA', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="ETD from MSA"
                  />
                </div>
              </div>
              
              {/* Row 5: PORT */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">PORT</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.port}
                    onChange={(e) => updateField('port', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Destination port"
                  />
                </div>
              </div>
              
              {/* Row 6: ETA PORT */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">ETA PORT</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.etaPort}
                    onChange={(e) => updateField('etaPort', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="ETA at port"
                  />
                </div>
              </div>
              
              {/* Row 7: TEMP REC 1 */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">TEMP REC 1</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.tempRec1}
                    onChange={(e) => updateField('tempRec1', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Temperature record 1"
                  />
                </div>
              </div>
              
              {/* Row 8: TEMP REC 2 */}
              <div className="flex items-center border-b pb-1">
                <div className="w-1/3 font-bold text-sm uppercase tracking-wide">TEMP REC 2</div>
                <div className="w-2/3">
                  <Input
                    value={sheetData.tempRec2}
                    onChange={(e) => updateField('tempRec2', e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm print:border-0 print:p-0"
                    placeholder="Temperature record 2"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Pallet Management Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 print:hidden">
            <div>
              <h3 className="text-lg font-semibold">Pallet Details</h3>
              <p className="text-sm text-muted-foreground">Temperature, trace codes, and quantity per size</p>
            </div>
            <Button variant="outline" size="sm" onClick={addPallet}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pallet
            </Button>
          </div>
          
          {/* Pallet Table */}
          <div className="overflow-x-auto mb-6 print:mb-4">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-black-100">
                  <th className="border border-gray-300 p-2 text-left font-bold text-sm uppercase">PALLET NO</th>
                  <th className="border border-gray-300 p-2 text-left font-bold text-sm uppercase">TEMP</th>
                  <th className="border border-gray-300 p-2 text-left font-bold text-sm uppercase">TRACE CODE</th>
                  {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                    <th key={size} className="border border-gray-300 p-2 text-center font-bold text-sm uppercase">{size}</th>
                  ))}
                  <th className="border border-gray-300 p-2 text-center font-bold text-sm uppercase">TOTAL</th>
                  <th className="border border-gray-300 p-2 text-center font-bold text-sm uppercase print:hidden">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sheetData.pallets.slice(0, 20).map((pallet, index) => (
                  <tr key={pallet.palletNo} className="hover:bg-black-50">
                    <td className="border border-gray-300 p-2 text-center font-medium">{pallet.palletNo}</td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="text"
                        value={pallet.temp}
                        onChange={(e) => updatePalletData(index, 'temp', e.target.value)}
                        className="w-full border-0 p-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-sm print:border-0 print:p-0"
                        placeholder="0.0"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <Input
                        type="text"
                        value={pallet.traceCode}
                        onChange={(e) => updatePalletData(index, 'traceCode', e.target.value)}
                        className="w-full border-0 p-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-sm print:border-0 print:p-0"
                        placeholder="TRACE-001"
                      />
                    </td>
                    {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                      <td key={size} className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          min="0"
                          value={pallet.sizes[`size${size}` as keyof typeof pallet.sizes]}
                          onChange={(e) => updatePalletData(index, 'sizes', {
                            ...pallet.sizes,
                            [`size${size}`]: parseInt(e.target.value) || 0,
                          })}
                          className="w-full border-0 p-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-sm print:border-0 print:p-0"
                        />
                      </td>
                    ))}
                    <td className="border border-gray-300 p-2 text-center font-bold bg-black-50">
                      {pallet.total}
                    </td>
                    <td className="border border-gray-300 p-1 print:hidden">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearPallet(index)}
                          className="h-6 w-6 p-0 text-xs"
                          title="Clear"
                        >
                          ×
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePallet(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          title="Delete"
                          disabled={sheetData.pallets.length <= 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-black-100 font-bold">
                  <td colSpan={3} className="border border-gray-300 p-2 text-right pr-4">TOTAL</td>
                  {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                    <td key={size} className="border border-gray-300 p-2 text-center">
                      {totals[`size${size}` as keyof typeof totals]}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-2 text-center bg-black-200">
                    {totals.grandTotal}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4">
              <h3 className="font-bold text-lg mb-3 border-b pb-2">SUMMARY</h3>
              <div className="grid grid-cols-2 gap-2">
                {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                  <div key={size} className="flex justify-between border-b pb-1">
                    <span className="font-medium">Size {size}</span>
                    <span className="font-bold">{totals[`size${size}` as keyof typeof totals]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border border-gray-300 p-4">
              <h3 className="font-bold text-lg mb-3 border-b pb-2">LOADING DETAILS</h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium mb-1">Loaded by:</div>
                  <Input 
                    className="border-0 p-2 focus-visible:ring-0 focus-visible:ring-offset-0 border-b print:border-0" 
                    placeholder="Loader's name & signature" 
                  />
                </div>
                <div>
                  <div className="font-medium mb-1">Checked by:</div>
                  <Input 
                    className="border-0 p-2 focus-visible:ring-0 focus-visible:ring-offset-0 border-b print:border-0" 
                    placeholder="Supervisor's name & signature" 
                  />
                </div>
                <div>
                  <div className="font-medium mb-1">Remarks:</div>
                  <textarea 
                    className="w-full border border-black p-2 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm resize-none bg-white text-black placeholder:text-gray-500 print:border-black" 
                    rows={2}
                    placeholder="Special instructions or notes"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-3 border-t text-center text-xs text-gray-500 print:mt-4">
            <p>Generated by FreshTrace Logistics System • Document ID: {currentSheetId || `LS-${new Date().getTime().toString().slice(-6)}`}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OutboundPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  // Fetch shipments from API
  const fetchShipments = useCallback(async () => {
    try {
      console.log('📡 Fetching shipments for outbound page...');
      setLoading(true);
      
      const response = await fetch('/api/shipments');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch shipments: ${response.status}`);
      }
      
      const data: DatabaseShipment[] = await response.json();
      console.log('✅ Outbound API returned', data.length, 'shipments');
      
      // Transform database data
      const transformedData: Shipment[] = data.map(shipment => {
        const displayStatus = convertDbStatusToDisplay(shipment.status);
        
        const formatDate = (dateString?: string | null) => {
          if (!dateString) return 'N/A';
          try {
            return new Date(dateString).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch {
            return 'N/A';
          }
        };
        
        // Format weight consistently
        const weight = shipment.weight || '0';
        const formattedWeight = `${parseFloat(weight).toFixed(0)} kg`;
        
        return {
          id: shipment.id,
          shipmentId: shipment.shipment_id,
          customer: shipment.customers?.name || 'Unknown Customer',
          origin: shipment.origin || 'N/A',
          destination: shipment.destination || 'N/A',
          status: displayStatus,
          product: shipment.product || 'N/A',
          weight: formattedWeight,
          temperature: 'N/A',
          humidity: 'N/A',
          tags: shipment.tags || 'Not tagged',
          expectedArrival: formatDate(shipment.expected_arrival),
          driver: 'Not assigned',
          carrier: shipment.carrier || 'N/A',
          priority: 'Medium',
          notes: ''
        };
      });
      
      setShipments(transformedData);
    } catch (error) {
      console.error('❌ Error fetching shipments for outbound:', error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Statistics Calculations
  const totalShipments = shipments.length;
  const activeShipments = shipments.filter(s => 
    ['Preparing for Dispatch', 'Ready for Dispatch', 'In-Transit'].includes(s.status)
  ).length;
  const delayedShipments = shipments.filter(s => s.status === 'Delayed').length;
  const deliveredShipments = shipments.filter(s => s.status === 'Delivered').length;
  
  // Customer statistics
  const uniqueCustomers = new Set(shipments.map(s => s.customer)).size;
  
  // Status distribution
  const statusDistribution = {
    'Preparing': shipments.filter(s => s.status === 'Preparing for Dispatch').length,
    'Ready': shipments.filter(s => s.status === 'Ready for Dispatch').length,
    'In Transit': shipments.filter(s => s.status === 'In-Transit').length,
    'Delayed': shipments.filter(s => s.status === 'Delayed').length,
    'Delivered': shipments.filter(s => s.status === 'Delivered').length,
  };
  
  // Filter shipments for outbound processing
  const shipmentsForOutbound = shipments.filter(
    s => s.status === 'Preparing for Dispatch' || s.status === 'Ready for Dispatch'
  );
  
  const handleRecordWeight = (shipmentId: string) => router.push(`/weight-capture?shipmentId=${shipmentId}`);
  const handleManageTags = (shipmentId: string) => router.push(`/tag-management?shipmentId=${shipmentId}`);
  const handleViewDetails = (shipmentId: string) => router.push(`/traceability?shipmentId=${shipmentId}`);
  const handleViewNote = (shipmentId: string) => router.push(`/outbound/dispatch-note/${shipmentId}`);
  const handleViewManifest = (shipmentId: string) => router.push(`/outbound/manifest/${shipmentId}`);

  const handleRefresh = () => {
    console.log('🔄 Refreshing outbound shipments...');
    fetchShipments();
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
          <Header />
          <main className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading outbound shipments from database...</p>
              </div>
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
        <Header />
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Truck />
                Outbound Logistics Dashboard
              </h2>
              <p className="text-muted-foreground">
                Comprehensive statistics and loading sheet management for outbound operations
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("mr-2", loading && "animate-spin")} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="loading-sheet">
                <Grid className="h-4 w-4 mr-2" />
                Loading Sheet
              </TabsTrigger>
              <TabsTrigger value="shipments">
                <PackageCheck className="h-4 w-4 mr-2" />
                Shipments ({shipmentsForOutbound.length})
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Total Shipments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalShipments}</div>
                    <p className="text-xs text-muted-foreground">All outbound shipments</p>
                    <div className="mt-2 text-sm">
                      <span className="text-green-600">↑ {activeShipments} active</span>
                      <span className="text-amber-600 ml-2">• {delayedShipments} delayed</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Active Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{uniqueCustomers}</div>
                    <p className="text-xs text-muted-foreground">Unique clients</p>
                    <div className="mt-2">
                      <div className="flex items-center text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (uniqueCustomers / Math.max(totalShipments, 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <PackageCheck className="h-4 w-4" />
                      Ready for Dispatch
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {shipments.filter(s => s.status === 'Ready for Dispatch').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting carrier pickup</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <PackageCheck className="mr-1 h-3 w-3" />
                        Ready to load
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      In Transit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {shipments.filter(s => s.status === 'In-Transit').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Currently on the road</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        <Truck className="mr-1 h-3 w-3" />
                        En route
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Status Distribution</CardTitle>
                  <CardDescription>Overview of all shipment statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(statusDistribution).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'Preparing' ? 'bg-yellow-500' :
                            status === 'Ready' ? 'bg-green-500' :
                            status === 'In Transit' ? 'bg-blue-500' :
                            status === 'Delayed' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="font-medium">{status}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{count}</span>
                          <div className="w-48 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                status === 'Preparing' ? 'bg-yellow-500' :
                                status === 'Ready' ? 'bg-green-500' :
                                status === 'In Transit' ? 'bg-blue-500' :
                                status === 'Delayed' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`}
                              style={{ width: `${(count / Math.max(totalShipments, 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {totalShipments > 0 ? Math.round((count / totalShipments) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Shipments</CardTitle>
                  <CardDescription>Latest outbound shipments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shipments.slice(0, 5).map((shipment) => (
                      <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{shipment.shipmentId}</div>
                          <div className="text-sm text-muted-foreground">{shipment.customer}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shipment.status === 'Ready for Dispatch' ? 'bg-green-100 text-green-800' :
                            shipment.status === 'Preparing for Dispatch' ? 'bg-yellow-100 text-yellow-800' :
                            shipment.status === 'In-Transit' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shipment.status}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/outbound/manifest/${shipment.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Loading Sheet Tab */}
            <TabsContent value="loading-sheet">
              <LoadingSheet />
            </TabsContent>

            {/* Shipments Tab */}
            <TabsContent value="shipments" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Shipments Ready for Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    {shipmentsForOutbound.length} shipments ready for dispatch
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open('/api/shipments', '_blank')}
                  title="View raw API data"
                >
                  View API
                </Button>
              </div>
              
              {shipmentsForOutbound.length > 0 ? (
                <ShipmentDataTable 
                  shipments={shipmentsForOutbound} 
                  onRecordWeight={handleRecordWeight}
                  onManageTags={handleManageTags}
                  onViewDetails={handleViewDetails}
                  onViewNote={handleViewNote}
                  onViewManifest={handleViewManifest}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <PackageCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No shipments ready for outbound processing</h3>
                    <p className="text-muted-foreground mb-4">
                      All shipments are either in transit, delivered, or in other statuses
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline"
                        onClick={handleRefresh}
                      >
                        Refresh Data
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/shipments')}
                      >
                        View All Shipments
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
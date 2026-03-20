'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Check, ListTodo, PlusCircle, Package as PackageIcon, Loader2, AlertCircle, RefreshCw, Boxes, TrendingUp, AlertTriangle, Truck, Warehouse, Snowflake, Package, Minus, Plus, BarChart, Download, Calendar, Filter, X, Thermometer, BarChart3, Weight, Box, Layers, Palette, Trash2, Eye, Info, FileSpreadsheet, Layers2 } from 'lucide-react';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatePackagingForm, type PackagingFormValues } from '@/components/dashboard/create-packaging-form';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

// Avocado Inventory Types
interface ColdRoomBox {
  id: string;
  variety: 'fuerte' | 'hass';
  box_type: '4kg' | '10kg';
  size: string;
  grade: 'class1' | 'class2';
  quantity: number;
  cold_room_id: string;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
  pallet_id?: string;
  region?: string;
  counting_record_id?: string;
  is_in_pallet?: boolean;
  converted_to_pallet_at?: string;
  loading_sheet_id?: string | null;
  converted_to_pallet_date?: string;
  original_box_count?: number;
}

interface PackagingMaterial {
  id: string;
  name: string;
  category: string;
  unit: 'pieces' | 'rolls' | 'units' | 'kg' | 'sheets' | 'meters';
  currentStock: number;
  reorderLevel: number;
  dimensions?: string;
  lastUsedDate: string;
  consumptionRate: 'high' | 'medium' | 'low';
  createdAt?: string;
  updatedAt?: string;
}

interface InventoryKPIs {
  totalAvocadoBoxes: number;
  total4kgBoxes: number;
  total10kgBoxes: number;
  fuerteBoxes: number;
  hassBoxes: number;
  totalPackagingItems: number;
  itemsBelowReorder: number;
  fastMovingItems: number;
  packagingCategories: Record<string, number>;
  avocadoDistribution: {
    fuerte: number;
    hass: number;
    class1: number;
    class2: number;
    '4kg': number;
    '10kg': number;
  };
}

interface Pallet {
  id: string;
  variety: string;
  box_type: string;
  size: string;
  grade: string;
  pallet_count: number;
  cold_room_id: string;
  pallet_name?: string;
  is_manual: boolean;
  created_at: string;
  last_updated: string;
  boxes?: ColdRoomBox[];
  total_boxes?: number;
  boxes_per_pallet: number;
  loading_sheet_id?: string | null;
  conversion_date?: string;
  original_box_ids?: string[];
}

interface TemperatureLog {
  id: string;
  cold_room_id: string;
  temperature: number;
  timestamp: string;
  recorded_by: string;
}

// Format size for display
const formatSize = (size: string) => {
  return size.replace('size', 'Size ');
};

// Get variety display name
const getVarietyDisplay = (variety: string): string => {
  return variety === 'fuerte' ? 'Fuerte' : 'Hass';
};

// Get grade display name
const getGradeDisplay = (grade: string): string => {
  return grade === 'class1' ? 'Class 1' : 'Class 2';
};

// Safe toFixed function
const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = Number(value);
  return isNaN(num) ? '0.'.padEnd(decimals + 2, '0') : num.toFixed(decimals);
};

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Box sizes
const BOX_SIZES = [
  'size32', 'size30', 'size28', 'size26', 'size24',
  'size22', 'size20', 'size18', 'size16', 'size14', 'size12'
];

export default function InventoryPage() {
  const [stockTakeMode, setStockTakeMode] = useState(false);
  const [coldRoomBoxes, setColdRoomBoxes] = useState<ColdRoomBox[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  const [inventoryKPIs, setInventoryKPIs] = useState<InventoryKPIs | null>(null);
  const [isLoading, setIsLoading] = useState({
    boxes: true,
    pallets: true,
    packaging: true,
    stats: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [bulkUpdateQuantity, setBulkUpdateQuantity] = useState<number>(0);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  
  // Date filter states
  const [dateFilter, setDateFilter] = useState<{
    avocado: string;
    packaging: string;
    packagingStartDate: string;
    packagingEndDate: string;
  }>({
    avocado: '',
    packaging: 'all',
    packagingStartDate: '',
    packagingEndDate: '',
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColdRoom, setSelectedColdRoom] = useState<string>('all');
  const [expandedPallets, setExpandedPallets] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();

  // Calculate available boxes (not in pallets and not assigned to loading sheets)
  const calculateAvailableBoxes = (boxes: ColdRoomBox[]) => {
    return boxes.filter(box => 
      !box.loading_sheet_id && 
      !box.is_in_pallet
    );
  };

  // Calculate available pallets (not assigned to loading sheets)
  const calculateAvailablePallets = (pallets: Pallet[]) => {
    return pallets.filter(pallet => !pallet.loading_sheet_id);
  };

  // Calculate real-time stats
  const calculateRealTimeStats = () => {
    const availableBoxes = calculateAvailableBoxes(coldRoomBoxes);
    const availablePallets = calculateAvailablePallets(pallets);
    
    const totalAvailableBoxes = availableBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
    const totalAssignedBoxes = coldRoomBoxes
      .filter(box => box.loading_sheet_id || box.is_in_pallet)
      .reduce((sum, box) => sum + (box.quantity || 0), 0);
    
    const boxesInPallets = coldRoomBoxes
      .filter(box => box.is_in_pallet)
      .reduce((sum, box) => sum + (box.quantity || 0), 0);
    
    const boxesInAssignedPallets = pallets
      .filter(pallet => pallet.loading_sheet_id)
      .reduce((sum, pallet) => sum + (pallet.total_boxes || 0), 0);
    
    return {
      totalAvailableBoxes,
      totalAssignedBoxes,
      availableBoxes,
      availablePallets,
      boxesInPallets,
      boxesInAssignedPallets,
      totalBoxesInColdRoom: coldRoomBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0)
    };
  };

  // Fetch cold room boxes from database
  const fetchColdRoomBoxes = async () => {
    try {
      setIsLoading(prev => ({ ...prev, boxes: true }));
      const response = await fetch('/api/cold-room?action=boxes');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cold room boxes: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const boxesData = result.data.map((box: any) => ({
          id: box.id,
          variety: box.variety,
          box_type: box.boxType || box.box_type,
          size: box.size,
          grade: box.grade,
          quantity: Number(box.quantity) || 0,
          cold_room_id: box.cold_room_id,
          created_at: box.created_at,
          updated_at: box.updated_at,
          supplier_name: box.supplier_name,
          pallet_id: box.pallet_id,
          region: box.region,
          counting_record_id: box.counting_record_id,
          is_in_pallet: box.is_in_pallet || false,
          converted_to_pallet_at: box.converted_to_pallet_at,
          loading_sheet_id: box.loading_sheet_id || null,
          converted_to_pallet_date: box.converted_to_pallet_date,
          original_box_count: box.original_box_count || 0
        }));
        setColdRoomBoxes(boxesData);
      } else {
        setColdRoomBoxes([]);
      }
    } catch (error: any) {
      console.error('Error fetching cold room boxes:', error);
      setError(error.message || 'Failed to load avocado inventory');
      setColdRoomBoxes([]);
    } finally {
      setIsLoading(prev => ({ ...prev, boxes: false }));
    }
  };

  // Fetch pallets from database
  const fetchPallets = async () => {
    try {
      setIsLoading(prev => ({ ...prev, pallets: true }));
      const response = await fetch('/api/cold-room?action=pallets');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const palletsData = await Promise.all(
          result.data.map(async (pallet: any) => {
            let boxes: ColdRoomBox[] = [];
            try {
              const boxesResponse = await fetch(`/api/cold-room?action=pallet-boxes&palletId=${pallet.id}`);
              const boxesResult = await boxesResponse.json();
              
              if (boxesResult.success && Array.isArray(boxesResult.data)) {
                boxes = boxesResult.data.map((box: any) => ({
                  id: box.id,
                  variety: box.variety,
                  box_type: box.boxType || box.box_type,
                  size: box.size,
                  grade: box.grade,
                  quantity: Number(box.quantity) || 0,
                  cold_room_id: box.cold_room_id,
                  created_at: box.created_at,
                  updated_at: box.updated_at,
                  supplier_name: box.supplier_name,
                  pallet_id: box.pallet_id,
                  region: box.region,
                  counting_record_id: box.counting_record_id,
                  is_in_pallet: box.is_in_pallet || false,
                  converted_to_pallet_at: box.converted_to_pallet_at,
                  loading_sheet_id: box.loading_sheet_id || null,
                  converted_to_pallet_date: box.converted_to_pallet_date,
                  original_box_count: box.original_box_count || 0
                }));
              }
            } catch (error) {
              console.warn(`Could not fetch boxes for pallet ${pallet.id}:`, error);
            }
            
            const totalBoxes = boxes.reduce((sum: number, box: ColdRoomBox) => sum + (box.quantity || 0), 0);
            
            return {
              id: pallet.id,
              variety: pallet.variety,
              box_type: pallet.boxType || pallet.box_type,
              size: pallet.size,
              grade: pallet.grade,
              pallet_count: Number(pallet.pallet_count) || 0,
              cold_room_id: pallet.cold_room_id,
              pallet_name: pallet.pallet_name,
              is_manual: pallet.is_manual || false,
              created_at: pallet.created_at,
              last_updated: pallet.last_updated,
              boxes: boxes,
              total_boxes: totalBoxes,
              boxes_per_pallet: pallet.boxes_per_pallet || (pallet.box_type === '10kg' ? 120 : 288),
              loading_sheet_id: pallet.loading_sheet_id || null,
              conversion_date: pallet.conversion_date || pallet.created_at,
              original_box_ids: pallet.original_box_ids || []
            };
          })
        );
        
        setPallets(palletsData);
      } else {
        setPallets([]);
      }
    } catch (error: any) {
      console.error('Error fetching pallets:', error);
      setPallets([]);
    } finally {
      setIsLoading(prev => ({ ...prev, pallets: false }));
    }
  };

  // Fetch packaging materials from database
  const fetchPackagingMaterials = async () => {
    try {
      setIsLoading(prev => ({ ...prev, packaging: true }));
      const response = await fetch('/api/inventory/packaging');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch packaging materials: ${response.statusText}`);
      }
      
      const data: PackagingMaterial[] = await response.json();
      setPackagingMaterials(data);
    } catch (error: any) {
      console.error('Error fetching packaging materials:', error);
      setError(error.message || 'Failed to load packaging materials');
      setPackagingMaterials([]);
    } finally {
      setIsLoading(prev => ({ ...prev, packaging: false }));
    }
  };

  // Calculate inventory KPIs
  const calculateKPIs = () => {
    // Calculate avocado statistics - ONLY AVAILABLE BOXES (not in pallets or loading sheets)
    const availableBoxes = calculateAvailableBoxes(coldRoomBoxes);
    
    const totalAvocadoBoxes = availableBoxes.reduce((sum, item) => sum + item.quantity, 0);
    const total4kgBoxes = availableBoxes
      .filter(item => item.box_type === '4kg')
      .reduce((sum, item) => sum + item.quantity, 0);
    const total10kgBoxes = availableBoxes
      .filter(item => item.box_type === '10kg')
      .reduce((sum, item) => sum + item.quantity, 0);
    const fuerteBoxes = availableBoxes
      .filter(item => item.variety === 'fuerte')
      .reduce((sum, item) => sum + item.quantity, 0);
    const hassBoxes = availableBoxes
      .filter(item => item.variety === 'hass')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate packaging statistics
    const totalPackagingItems = packagingMaterials.reduce((sum, item) => sum + item.currentStock, 0);
    const itemsBelowReorder = packagingMaterials.filter(item => item.currentStock <= item.reorderLevel).length;
    const fastMovingItems = packagingMaterials.filter(item => item.consumptionRate === 'high').length;
    
    // Calculate avocado distribution
    const avocadoDistribution = {
      fuerte: fuerteBoxes,
      hass: hassBoxes,
      class1: availableBoxes.filter(item => item.grade === 'class1').reduce((sum, item) => sum + item.quantity, 0),
      class2: availableBoxes.filter(item => item.grade === 'class2').reduce((sum, item) => sum + item.quantity, 0),
      '4kg': total4kgBoxes,
      '10kg': total10kgBoxes,
    };
    
    // Calculate packaging categories
    const packagingCategories: Record<string, number> = {};
    packagingMaterials.forEach(item => {
      packagingCategories[item.category] = (packagingCategories[item.category] || 0) + item.currentStock;
    });
    
    return {
      totalAvocadoBoxes,
      total4kgBoxes,
      total10kgBoxes,
      fuerteBoxes,
      hassBoxes,
      totalPackagingItems,
      itemsBelowReorder,
      fastMovingItems,
      packagingCategories,
      avocadoDistribution,
    };
  };

  // Load all data
  const loadData = async () => {
    try {
      await Promise.all([
        fetchColdRoomBoxes(),
        fetchPallets(),
        fetchPackagingMaterials(),
      ]);
      
      // Calculate KPIs after data is loaded
      const kpis = calculateKPIs();
      setInventoryKPIs(kpis);
    } catch (error: any) {
      setError(error.message || 'Failed to load inventory data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter boxes by cold room
  const getFilteredBoxes = () => {
    let filtered = calculateAvailableBoxes(coldRoomBoxes); // Only show available boxes
    
    // Filter by cold room
    if (selectedColdRoom !== 'all') {
      filtered = filtered.filter(box => box.cold_room_id === selectedColdRoom);
    }
    
    // Filter by date
    if (dateFilter.avocado) {
      filtered = filtered.filter(box => {
        const boxDate = new Date(box.created_at).toISOString().split('T')[0];
        return boxDate === dateFilter.avocado;
      });
    }
    
    return filtered;
  };

  // Get inventory breakdown by variety and size
  const getInventoryBreakdown = () => {
    const availableBoxes = getFilteredBoxes();
    const breakdown: Record<string, any> = {};
    
    availableBoxes.forEach(box => {
      const key = `${box.cold_room_id}_${box.variety}_${box.box_type}_${box.grade}_${box.size}`;
      if (!breakdown[key]) {
        breakdown[key] = {
          cold_room_id: box.cold_room_id,
          variety: box.variety,
          box_type: box.box_type,
          grade: box.grade,
          size: box.size,
          totalQuantity: 0,
          boxes: []
        };
      }
      breakdown[key].totalQuantity += box.quantity || 0;
      breakdown[key].boxes.push(box);
    });
    
    return Object.values(breakdown);
  };

  // Calculate pallets
  const calculatePallets = (quantity: number, boxType: string) => {
    const boxesPerPallet = boxType === '4kg' ? 288 : 120;
    return Math.floor(quantity / boxesPerPallet);
  };

  // Handle bulk update of packaging material quantity
  const handleBulkUpdate = async (action: 'add' | 'subtract') => {
    if (!selectedMaterialId || bulkUpdateQuantity <= 0) {
      toast({
        title: 'Invalid input',
        description: 'Please select a material and enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    const material = packagingMaterials.find(m => m.id === selectedMaterialId);
    if (!material) return;

    const newQuantity = action === 'add' 
      ? material.currentStock + bulkUpdateQuantity
      : Math.max(0, material.currentStock - bulkUpdateQuantity);

    try {
      // Update in database
      const response = await fetch(`/api/inventory/packaging/${selectedMaterialId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentStock: newQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock in database');
      }

      const updatedMaterial = await response.json();
      
      // Update local state
      setPackagingMaterials(prev => 
        prev.map(m => 
          m.id === selectedMaterialId ? updatedMaterial : m
        )
      );

      toast({
        title: 'Stock Updated',
        description: `${material.name} stock updated to ${newQuantity} ${material.unit}`,
      });

      // Reset form
      setBulkUpdateQuantity(0);
      setSelectedMaterialId('');
      
      // Recalculate KPIs
      const kpis = calculateKPIs();
      setInventoryKPIs(kpis);
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update stock',
        variant: 'destructive',
      });
    }
  };

  // Handle add packaging material
  const handleAddPackaging = async (values: PackagingFormValues) => {
    try {
      const response = await fetch('/api/inventory/packaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          category: values.category,
          unit: values.unit,
          currentStock: values.initialStock || 0,
          reorderLevel: values.reorderLevel,
          dimensions: values.dimensions,
          lastUsedDate: new Date().toISOString(),
          consumptionRate: 'medium',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add packaging material');
      }

      const newMaterial: PackagingMaterial = await response.json();
      setPackagingMaterials(prev => [newMaterial, ...prev]);
      
      toast({
        title: 'Packaging Material Added',
        description: `${values.name} has been added to your inventory.`,
      });

      // Recalculate KPIs
      const kpis = calculateKPIs();
      setInventoryKPIs(kpis);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add packaging material',
        variant: 'destructive',
      });
    }
  };

  // Filter packaging materials based on date filter, search term, etc.
  const getFilteredPackagingMaterials = () => {
    let filtered = [...packagingMaterials];

    // Apply date filter
    if (dateFilter.packaging !== 'all') {
      filtered = filtered.filter(material => {
        const materialDate = material.createdAt ? new Date(material.createdAt) : new Date(material.lastUsedDate);
        
        switch (dateFilter.packaging) {
          case 'specific':
            if (!dateFilter.avocado) return true;
            const specific = new Date(dateFilter.avocado);
            return materialDate.toDateString() === specific.toDateString();
          case 'range':
            if (!dateFilter.packagingStartDate || !dateFilter.packagingEndDate) return true;
            const start = new Date(dateFilter.packagingStartDate);
            const end = new Date(dateFilter.packagingEndDate);
            return materialDate >= start && materialDate <= end;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(material => 
        material.name.toLowerCase().includes(searchLower) ||
        material.category.toLowerCase().includes(searchLower) ||
        material.unit.toLowerCase().includes(searchLower) ||
        material.consumptionRate.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  // Download packaging materials as CSV
  const downloadPackagingCSV = () => {
    const filteredMaterials = getFilteredPackagingMaterials();
    
    // CSV headers
    const headers = [
      'ID',
      'Name',
      'Category',
      'Unit',
      'Current Stock',
      'Reorder Level',
      'Status',
      'Consumption Rate',
      'Dimensions',
      'Last Used Date',
      'Created Date'
    ];
    
    // CSV rows
    const rows = filteredMaterials.map(material => [
      material.id,
      material.name,
      material.category,
      material.unit,
      material.currentStock,
      material.reorderLevel,
      material.currentStock <= material.reorderLevel ? 'Low Stock' : 'In Stock',
      material.consumptionRate,
      material.dimensions || 'N/A',
      new Date(material.lastUsedDate).toLocaleDateString('en-GB'),
      material.createdAt ? new Date(material.createdAt).toLocaleDateString('en-GB') : 'N/A'
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename with date range
    let fileName = 'packaging-materials';
    if (dateFilter.packaging === 'specific' && dateFilter.avocado) {
      const dateStr = new Date(dateFilter.avocado).toISOString().split('T')[0];
      fileName += `_${dateStr}`;
    } else if (dateFilter.packaging === 'range' && dateFilter.packagingStartDate && dateFilter.packagingEndDate) {
      const startStr = new Date(dateFilter.packagingStartDate).toISOString().split('T')[0];
      const endStr = new Date(dateFilter.packagingEndDate).toISOString().split('T')[0];
      fileName += `_${startStr}_to_${endStr}`;
    }
    fileName += `_${new Date().toISOString().split('T')[0]}.csv`;
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'CSV Downloaded',
      description: `Downloaded ${filteredMaterials.length} packaging materials`,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setDateFilter({
      avocado: '',
      packaging: 'all',
      packagingStartDate: '',
      packagingEndDate: '',
    });
    setSearchTerm('');
    setSelectedColdRoom('all');
  };

  // Prepare KPI data for OverviewCards
  const inventoryKpis = {
    totalAvocadoBoxes: {
      title: 'Available Avocado Boxes',
      value: inventoryKPIs ? inventoryKPIs.totalAvocadoBoxes.toString() : '0',
      change: 'in cold storage (not assigned)',
      changeType: 'increase' as const,
      icon: Boxes,
    },
    total4kgBoxes: {
      title: 'Available 4kg Boxes',
      value: inventoryKPIs ? inventoryKPIs.total4kgBoxes.toString() : '0',
      change: 'standard boxes (not assigned)',
      changeType: 'increase' as const,
      icon: Package,
    },
    total10kgBoxes: {
      title: 'Available 10kg Boxes',
      value: inventoryKPIs ? inventoryKPIs.total10kgBoxes.toString() : '0',
      change: 'large crates (not assigned)',
      changeType: 'increase' as const,
      icon: Package,
    },
    totalPackagingItems: {
      title: 'Packaging Items',
      value: inventoryKPIs ? inventoryKPIs.totalPackagingItems.toString() : '0',
      change: 'total units in stock',
      changeType: 'increase' as const,
      icon: PackageIcon,
    },
    itemsBelowReorder: {
      title: 'Low Stock Items',
      value: inventoryKPIs ? inventoryKPIs.itemsBelowReorder.toString() : '0',
      change: 'need reordering',
      changeType: inventoryKPIs?.itemsBelowReorder > 0 ? 'increase' as const : 'decrease' as const,
      icon: AlertTriangle,
    },
    fastMovingItems: {
      title: 'Fast-Moving Items',
      value: inventoryKPIs ? inventoryKPIs.fastMovingItems.toString() : '0',
      change: 'high consumption rate',
      changeType: 'increase' as const,
      icon: TrendingUp,
    },
  };

  // Calculate avocado totals for display
  const realTimeStats = calculateRealTimeStats();
  
  // Get available pallets
  const availablePallets = calculateAvailablePallets(pallets);

  // Get low stock packaging materials
  const lowStockMaterials = packagingMaterials.filter(m => m.currentStock <= m.reorderLevel);
  const fastMovingPackaging = packagingMaterials.filter(m => m.consumptionRate === 'high');

  // Get filtered materials for display
  const filteredPackagingMaterials = getFilteredPackagingMaterials();

  // Check if any filters are active
  const hasActiveFilters = dateFilter.avocado !== '' || dateFilter.packaging !== 'all' || searchTerm.trim() !== '' || selectedColdRoom !== 'all';

  const handleTogglePalletExpansion = (palletId: string) => {
    const newExpanded = new Set(expandedPallets);
    if (newExpanded.has(palletId)) {
      newExpanded.delete(palletId);
    } else {
      newExpanded.add(palletId);
    }
    setExpandedPallets(newExpanded);
  };

  const handleViewLoadingSheet = (loadingSheetId: string) => {
    window.open(`/outbound?tab=loading-sheet&sheet=${loadingSheetId}`, '_blank');
  };

  if (isLoading.boxes || isLoading.pallets || isLoading.packaging) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshViewLogo className="w-8 h-8 text-primary" />
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
          <Header />
          <main className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Loading inventory data...</p>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch your inventory</p>
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
            <FreshViewLogo className="w-8 h-8 text-primary" />
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
        <Header />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Inventory Management
              </h2>
              <p className="text-muted-foreground">
                Track AVAILABLE avocado varieties in cold storage (not in pallets or loading sheets) and manage packaging material stock.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => loadData()} variant="outline" size="sm" disabled={isLoading.boxes || isLoading.pallets || isLoading.packaging}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading.boxes || isLoading.pallets || isLoading.packaging ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => setStockTakeMode(!stockTakeMode)} 
                disabled={isLoading.boxes || isLoading.pallets || isLoading.packaging}
                variant={stockTakeMode ? "destructive" : "default"}
              >
                {stockTakeMode ? (
                  <>
                    <Check className="mr-2" />
                    Exit Stock Take
                  </>
                ) : (
                  <>
                    <ListTodo className="mr-2" />
                    Start Stock Take
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{error}</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Some data may not be available. Check your API configuration.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <OverviewCard data={inventoryKpis.totalAvocadoBoxes} icon={Boxes} />
            <OverviewCard data={inventoryKpis.total4kgBoxes} icon={Package} />
            <OverviewCard data={inventoryKpis.total10kgBoxes} icon={Package} />
            <OverviewCard data={inventoryKpis.totalPackagingItems} icon={PackageIcon} />
            <OverviewCard data={inventoryKpis.itemsBelowReorder} icon={AlertTriangle} />
            <OverviewCard data={inventoryKpis.fastMovingItems} icon={TrendingUp} />
          </div>

          <Tabs defaultValue="produce">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="produce">Available Avocado Inventory</TabsTrigger>
              <TabsTrigger value="packaging">Packaging Materials</TabsTrigger>
            </TabsList>
            
            {/* Avocado Inventory Tab - SHOWS ONLY AVAILABLE BOXES */}
            <TabsContent value="produce" className="mt-6">
              <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5" />
                        Available Avocado Boxes in Cold Storage
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                          ✅ Real-time Available Stock
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Only shows boxes that are NOT in pallets and NOT assigned to loading sheets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="coldroom-select">Filter by Cold Room</Label>
                            <Select value={selectedColdRoom} onValueChange={setSelectedColdRoom}>
                              <SelectTrigger id="coldroom-select">
                                <SelectValue placeholder="Select cold room" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Cold Rooms</SelectItem>
                                <SelectItem value="coldroom1">❄️ Cold Room 1</SelectItem>
                                <SelectItem value="coldroom2">❄️ Cold Room 2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="avocado-date-filter">Filter by Date</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="avocado-date-filter"
                                type="date"
                                value={dateFilter.avocado}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, avocado: e.target.value }))}
                                className="flex-1"
                              />
                              {dateFilter.avocado && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDateFilter(prev => ({ ...prev, avocado: '' }))}
                                  className="h-10 w-10 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {hasActiveFilters && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Showing filtered results • 
                              {dateFilter.avocado && ` Date: ${dateFilter.avocado}`}
                              {selectedColdRoom !== 'all' && ` • Cold Room: ${selectedColdRoom === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}`}
                            </div>
                            <Button
                              onClick={clearFilters}
                              variant="outline"
                              size="sm"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Filters
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {getFilteredBoxes().length === 0 ? (
                        <div className="text-center py-8">
                          <PackageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">
                            {selectedColdRoom !== 'all' || dateFilter.avocado 
                              ? 'No available avocado boxes match your filters'
                              : 'No available avocado boxes in cold storage'
                            }
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            All boxes may be in pallets or assigned to loading sheets
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Cold Room</TableHead>
                                <TableHead>Variety</TableHead>
                                <TableHead>Box Type</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Pallets</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Added Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getFilteredBoxes().map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      <Snowflake className="w-3 h-3 mr-1" />
                                      {item.cold_room_id === 'coldroom1' ? 'CR1' : 'CR2'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium capitalize">
                                    {getVarietyDisplay(item.variety)}
                                  </TableCell>
                                  <TableCell>{item.box_type}</TableCell>
                                  <TableCell>{formatSize(item.size)}</TableCell>
                                  <TableCell>
                                    <Badge variant={item.grade === 'class1' ? 'default' : 'secondary'}>
                                      {getGradeDisplay(item.grade)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {item.quantity.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {calculatePallets(item.quantity, item.box_type)}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {item.supplier_name || 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {formatDate(item.created_at)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Available Pallets Section */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Available Pallets in Cold Rooms
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                          ✅ Ready for Loading Sheets
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Pallets that are in the coldroom and their box contents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {availablePallets.length === 0 ? (
                        <div className="text-center py-8 border rounded">
                          <Palette className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No available pallets</p>
                          <p className="text-sm text-gray-400 mt-1">
                            All pallets are assigned to loading sheets. Create new pallets or wait for existing ones to become available.
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {availablePallets.map((pallet) => {
                              const isExpanded = expandedPallets.has(pallet.id);
                              const palletName = pallet.pallet_name || `Pallet ${pallet.id.substring(0, 8)}`;
                              
                              return (
                                <Card key={pallet.id} className="overflow-hidden border-green-200">
                                  <div 
                                    className="p-4 cursor-pointer hover:bg-black-50 transition-colors"
                                    onClick={() => handleTogglePalletExpansion(pallet.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                          <Layers className="w-5 h-5 text-gray-400" />
                                        ) : (
                                          <Layers2 className="w-5 h-5 text-gray-400" />
                                        )}
                                        <div>
                                          <div className="font-medium flex items-center gap-2">
                                            {palletName}
                                            {pallet.is_manual && (
                                              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                                                Manual
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <Snowflake className="w-3 h-3" />
                                            {pallet.cold_room_id === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2'}
                                            <span className="mx-1">•</span>
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(pallet.conversion_date || pallet.created_at)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-lg">{pallet.pallet_count} pallet{pallet.pallet_count !== 1 ? 's' : ''}</div>
                                        <div className="text-sm text-gray-500">
                                          {pallet.total_boxes?.toLocaleString() || 0} boxes
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {isExpanded && (
                                    <div className="border-t">
                                      <div className="p-4 bg-black-50">
                                        <div className="mb-4">
                                          <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <Box className="w-4 h-4" />
                                            Boxes in this Pallet ({pallet.boxes?.length || 0})
                                          </h4>
                                          
                                          {pallet.boxes && pallet.boxes.length > 0 ? (
                                            <div className="border rounded overflow-hidden">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow className="bg-black-50">
                                                    <TableHead>Size</TableHead>
                                                    <TableHead>Variety</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Grade</TableHead>
                                                    <TableHead className="text-right">Quantity</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {pallet.boxes.map((box) => {
                                                    return (
                                                      <TableRow key={box.id}>
                                                        <TableCell>
                                                          <Badge variant="outline">{formatSize(box.size)}</Badge>
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                          {getVarietyDisplay(box.variety)}
                                                        </TableCell>
                                                        <TableCell>{box.box_type}</TableCell>
                                                        <TableCell>
                                                          {getGradeDisplay(box.grade)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                          {box.quantity.toLocaleString()}
                                                        </TableCell>
                                                      </TableRow>
                                                    );
                                                  })}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          ) : (
                                            <div className="text-center py-6 border rounded bg-white">
                                              <Box className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                              <p className="text-gray-500">No boxes assigned to this pallet</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Avocado Summary Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Inventory Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-3 bg-green-50">
                          <div className="text-sm text-gray-500 mb-1">Available Boxes</div>
                          <div className="text-2xl font-bold text-green-600">
                            {realTimeStats.totalAvailableBoxes.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-500 mt-1">
                            Ready for outbound
                          </div>
                        </div>
                        <div className="border rounded-lg p-3 bg-blue-50">
                          <div className="text-sm text-gray-500 mb-1">Available Pallets</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {availablePallets.length}
                          </div>
                          <div className="text-xs text-blue-500 mt-1">
                            Ready for loading sheets
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Status Breakdown</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">✅ Available Boxes:</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {realTimeStats.totalAvailableBoxes.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">📦 Boxes in Pallets:</span>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700">
                              {realTimeStats.boxesInPallets.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">📋 Assigned to Loading:</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {realTimeStats.boxesInAssignedPallets.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="text-sm font-medium mb-2">By Variety</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Fuerte</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {getInventoryBreakdown()
                                .filter(item => item.variety === 'fuerte')
                                .reduce((sum, item) => sum + item.totalQuantity, 0)
                                .toLocaleString()} boxes
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Hass</span>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {getInventoryBreakdown()
                                .filter(item => item.variety === 'hass')
                                .reduce((sum, item) => sum + item.totalQuantity, 0)
                                .toLocaleString()} boxes
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">By Box Type</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">4kg Boxes</span>
                            <span className="font-medium">
                              {getInventoryBreakdown()
                                .filter(item => item.box_type === '4kg')
                                .reduce((sum, item) => sum + item.totalQuantity, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">10kg Crates</span>
                            <span className="font-medium">
                              {getInventoryBreakdown()
                                .filter(item => item.box_type === '10kg')
                                .reduce((sum, item) => sum + item.totalQuantity, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Note:</span>
                        </div>
                        <p className="text-xs text-amber-600">
                          This view shows ONLY AVAILABLE boxes in cold rooms.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Snowflake className="w-5 h-5" />
                        Cold Room Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {['coldroom1', 'coldroom2'].map(roomId => {
                          const availableBoxesInRoom = calculateAvailableBoxes(coldRoomBoxes)
                            .filter(box => box.cold_room_id === roomId);
                          const totalBoxes = availableBoxesInRoom.reduce((sum, box) => sum + (box.quantity || 0), 0);
                          const roomName = roomId === 'coldroom1' ? 'Cold Room 1' : 'Cold Room 2';
                          
                          return (
                            <div key={roomId} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Snowflake className="w-4 h-4 text-blue-500" />
                                <span className="text-sm">{roomName}</span>
                              </div>
                              <Badge variant="outline">
                                {totalBoxes.toLocaleString()} available boxes
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Packaging Materials Tab */}
            <TabsContent value="packaging" className="mt-6">
              <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* Filters and Download Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filters & Export
                          </CardTitle>
                          <CardDescription>
                            Filter packaging materials by date and export as CSV
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {(dateFilter.packaging !== 'all' || searchTerm.trim() !== '') && (
                            <Button 
                              onClick={clearFilters} 
                              variant="outline" 
                              size="sm"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Filters
                            </Button>
                          )}
                          <Button 
                            onClick={downloadPackagingCSV} 
                            disabled={filteredPackagingMaterials.length === 0}
                            className="ml-2"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV ({filteredPackagingMaterials.length})
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="search">Search Materials</Label>
                            <div className="relative">
                              <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="search"
                                placeholder="Search by name, category..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="date-filter">Date Filter</Label>
                            <Select 
                              value={dateFilter.packaging} 
                              onValueChange={(value: any) => setDateFilter(prev => ({ ...prev, packaging: value }))}
                            >
                              <SelectTrigger id="date-filter">
                                <SelectValue placeholder="Select date filter" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Dates</SelectItem>
                                <SelectItem value="specific">Specific Date</SelectItem>
                                <SelectItem value="range">Date Range</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {dateFilter.packaging === 'specific' && (
                          <div className="p-4 border rounded-lg">
                            <Label htmlFor="specific-date">Select Date</Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Input
                                id="specific-date"
                                type="date"
                                value={dateFilter.avocado}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, avocado: e.target.value }))}
                                className="flex-1"
                              />
                              {dateFilter.avocado && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDateFilter(prev => ({ ...prev, avocado: '' }))}
                                  className="h-10 w-10 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Filter materials added/used on this specific date
                            </p>
                          </div>
                        )}

                        {dateFilter.packaging === 'range' && (
                          <div className="p-4 border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="start-date">Start Date</Label>
                                <div className="flex items-center gap-2 mt-2">
                                  <Input
                                    id="start-date"
                                    type="date"
                                    value={dateFilter.packagingStartDate}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, packagingStartDate: e.target.value }))}
                                    className="flex-1"
                                  />
                                  {dateFilter.packagingStartDate && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDateFilter(prev => ({ ...prev, packagingStartDate: '' }))}
                                      className="h-10 w-10 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="end-date">End Date</Label>
                                <div className="flex items-center gap-2 mt-2">
                                  <Input
                                    id="end-date"
                                    type="date"
                                    value={dateFilter.packagingEndDate}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, packagingEndDate: e.target.value }))}
                                    className="flex-1"
                                  />
                                  {dateFilter.packagingEndDate && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDateFilter(prev => ({ ...prev, packagingEndDate: '' }))}
                                      className="h-10 w-10 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Filter materials added/used between these dates
                            </p>
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                          Showing {filteredPackagingMaterials.length} of {packagingMaterials.length} packaging materials
                          {dateFilter.packaging === 'specific' && dateFilter.avocado && (
                            <span> • Filtered by date: {new Date(dateFilter.avocado).toLocaleDateString('en-GB')}</span>
                          )}
                          {dateFilter.packaging === 'range' && dateFilter.packagingStartDate && dateFilter.packagingEndDate && (
                            <span> • Filtered from {new Date(dateFilter.packagingStartDate).toLocaleDateString('en-GB')} to {new Date(dateFilter.packagingEndDate).toLocaleDateString('en-GB')}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Bulk Update Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Bulk Stock Update
                      </CardTitle>
                      <CardDescription>
                        Quickly add or subtract large quantities from packaging materials
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="material-select">Select Material</Label>
                            <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                              <SelectTrigger id="material-select">
                                <SelectValue placeholder="Choose a material" />
                              </SelectTrigger>
                              <SelectContent>
                                {packagingMaterials.map(material => (
                                  <SelectItem key={material.id} value={material.id}>
                                    <div className="flex items-center justify-between">
                                      <span className="truncate">{material.name}</span>
                                      <span className="text-sm text-muted-foreground ml-2">
                                        {material.currentStock} {material.unit}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="bulk-quantity">Quantity</Label>
                            <Input
                              id="bulk-quantity"
                              type="number"
                              min="0"
                              value={bulkUpdateQuantity}
                              onChange={(e) => setBulkUpdateQuantity(parseInt(e.target.value) || 0)}
                              placeholder="Enter quantity"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleBulkUpdate('add')}
                            className="flex-1"
                            disabled={!selectedMaterialId || bulkUpdateQuantity <= 0}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Stock
                          </Button>
                          <Button
                            onClick={() => handleBulkUpdate('subtract')}
                            className="flex-1"
                            variant="outline"
                            disabled={!selectedMaterialId || bulkUpdateQuantity <= 0}
                          >
                            <Minus className="w-4 h-4 mr-2" />
                            Subtract Stock
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Packaging Materials Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PackageIcon className="w-5 h-5" />
                        Packaging Materials Stock
                      </CardTitle>
                      <CardDescription>
                        Current stock levels and consumption rates
                        {dateFilter.packaging === 'specific' && dateFilter.avocado && ` • Filtered by date: ${new Date(dateFilter.avocado).toLocaleDateString('en-GB')}`}
                        {dateFilter.packaging === 'range' && dateFilter.packagingStartDate && dateFilter.packagingEndDate && ` • Filtered from ${new Date(dateFilter.packagingStartDate).toLocaleDateString('en-GB')} to ${new Date(dateFilter.packagingEndDate).toLocaleDateString('en-GB')}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredPackagingMaterials.length === 0 ? (
                        <div className="text-center py-8">
                          <PackageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No packaging materials found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {searchTerm || dateFilter.packaging !== 'all' ? 'Try adjusting your filters' : 'Add packaging materials to get started'}
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Current Stock</TableHead>
                                <TableHead className="text-right">Reorder Level</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead>Created</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredPackagingMaterials.map((material) => (
                                <TableRow key={material.id}>
                                  <TableCell className="font-medium">
                                    {material.name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {material.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{material.unit}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {material.currentStock.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {material.reorderLevel.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        material.currentStock <= material.reorderLevel 
                                          ? "destructive" 
                                          : "outline"
                                      }
                                    >
                                      {material.currentStock <= material.reorderLevel 
                                        ? "Low Stock" 
                                        : "In Stock"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline"
                                      className={
                                        material.consumptionRate === 'high' 
                                          ? "bg-green-50 text-green-700 border-green-200" 
                                          : material.consumptionRate === 'low'
                                          ? "bg-gray-50 text-gray-700 border-gray-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      }
                                    >
                                      {material.consumptionRate}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {new Date(material.lastUsedDate).toLocaleDateString('en-GB')}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {material.createdAt 
                                      ? new Date(material.createdAt).toLocaleDateString('en-GB')
                                      : 'N/A'
                                    }
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Add New Packaging Material */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlusCircle />
                        Add New Packaging Material
                      </CardTitle>
                      <CardDescription>
                        Add a new type of box, label, or wrap to the inventory system
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CreatePackagingForm onSubmit={handleAddPackaging} />
                    </CardContent>
                  </Card>
                </div>
                
                {/* Packaging Summary Sidebar */}
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Packaging Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-3">
                          <div className="text-sm text-gray-500 mb-1">Total Items</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {packagingMaterials.reduce((sum, m) => sum + m.currentStock, 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="border rounded-lg p-3">
                          <div className="text-sm text-gray-500 mb-1">Unique Types</div>
                          <div className="text-2xl font-bold text-green-600">
                            {packagingMaterials.length}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Stock Status</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">In Stock</span>
                            <Badge variant="outline">
                              {packagingMaterials.filter(m => m.currentStock > m.reorderLevel).length} items
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Low Stock</span>
                            <Badge variant="destructive">
                              {lowStockMaterials.length} items
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Current Filter</div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Date Filter:</span>
                            <span className="text-sm font-medium">
                              {dateFilter.packaging === 'all' ? 'All Dates' : 
                               dateFilter.packaging === 'specific' ? 'Specific Date' : 
                               'Date Range'}
                            </span>
                          </div>
                          {dateFilter.packaging === 'specific' && dateFilter.avocado && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Date:</span>
                              <span className="text-sm font-medium">
                                {new Date(dateFilter.avocado).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                          )}
                          {dateFilter.packaging === 'range' && dateFilter.packagingStartDate && dateFilter.packagingEndDate && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">From:</span>
                                <span className="text-sm font-medium">
                                  {new Date(dateFilter.packagingStartDate).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">To:</span>
                                <span className="text-sm font-medium">
                                  {new Date(dateFilter.packagingEndDate).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Showing:</span>
                            <span className="text-sm font-medium">
                              {filteredPackagingMaterials.length} of {packagingMaterials.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Categories Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="w-5 h-5" />
                        Categories Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          packagingMaterials.reduce((acc, m) => {
                            acc[m.category] = (acc[m.category] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([category, count]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-sm">{category}</span>
                            <Badge variant="outline">{count} types</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Low Stock Alert */}
                  {lowStockMaterials.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="w-5 h-5" />
                          Low Stock Alert
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {lowStockMaterials.slice(0, 3).map(material => (
                            <div key={material.id} className="text-sm">
                              <div className="font-medium">{material.name}</div>
                              <div className="text-red-600">
                                Only {material.currentStock} {material.unit} left
                                (Reorder at {material.reorderLevel})
                              </div>
                            </div>
                          ))}
                          {lowStockMaterials.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{lowStockMaterials.length - 3} more items low
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Consumption Rate Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Consumption Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">Fast Moving</span>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {fastMovingPackaging.length} items
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm">Medium</span>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {packagingMaterials.filter(m => m.consumptionRate === 'medium').length} items
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            <span className="text-sm">Slow Moving</span>
                          </div>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700">
                            {packagingMaterials.filter(m => m.consumptionRate === 'low').length} items
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
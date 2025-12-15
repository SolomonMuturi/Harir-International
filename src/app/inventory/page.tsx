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
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { ColdRoomInventory } from '@/components/dashboard/cold-room-inventory';
import { PackagingMaterialStock } from '@/components/dashboard/packaging-material-stock';
import { Button } from '@/components/ui/button';
import { Check, ListTodo, PlusCircle, Package as PackageIcon, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { InventorySummaryCard } from '@/components/dashboard/inventory-summary-card';
import { PackagingSummaryCard } from '@/components/dashboard/packaging-summary-card';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Weight, Boxes, TrendingUp, Archive } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatePackagingForm, type PackagingFormValues } from '@/components/dashboard/create-packaging-form';
import { useToast } from '@/hooks/use-toast';
import type { ColdRoomInventory as ColdRoomInventoryType, PackagingMaterial } from '@/lib/data';

// Avocado Inventory Types
interface AvocadoInventoryAPI {
  id: string;
  product: string;
  variety: 'Fuerte' | 'Hass';
  size: string;
  boxType: '4kg' | '10kg';
  class: 'Class 1' | 'Class 2';
  quantity: number;
  unit: 'boxes' | 'crates' | 'pallets';
  location: string;
  temperature: number;
  humidity: number;
  entryDate: string;
  expiryDate: string;
  status: 'fresh' | 'aging' | 'expiring';
  supplier: string;
  palletId: string;
}

interface PackagingMaterialAPI {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  dimensions?: string;
  lastUsedDate: string;
  consumptionRate: 'high' | 'medium' | 'low';
}

interface InventoryKPIs {
  totalValue: number;
  itemsBelowReorder: number;
  inventoryTurnover: number;
  totalAvocadoBoxes: number;
  fuerteBoxes: number;
  hassBoxes: number;
}

export default function InventoryPage() {
  const [stockTakeMode, setStockTakeMode] = useState(false);
  const [coldRoomInventory, setColdRoomInventory] = useState<ColdRoomInventoryType[]>([]);
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
  const [inventoryKPIs, setInventoryKPIs] = useState<InventoryKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingStockTake, setIsProcessingStockTake] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // Sample avocado inventory data for fallback
  const sampleAvocadoInventory: ColdRoomInventoryType[] = [
    {
      id: '1',
      product: 'Avocado Fuerte',
      quantity: 50,
      unit: 'boxes',
      location: 'A1',
      temperature: 4,
      humidity: 85,
      entryDate: '2024-01-15',
      expiryDate: '2024-02-15',
      status: 'fresh',
      supplier: 'Green Valley Farms',
    },
    {
      id: '2',
      product: 'Avocado Hass',
      quantity: 30,
      unit: 'crates',
      location: 'A2',
      temperature: 4,
      humidity: 85,
      entryDate: '2024-01-14',
      expiryDate: '2024-02-14',
      status: 'fresh',
      supplier: 'Sunshine Orchards',
    },
    {
      id: '3',
      product: 'Avocado Fuerte',
      quantity: 45,
      unit: 'boxes',
      location: 'B1',
      temperature: 4,
      humidity: 85,
      entryDate: '2024-01-10',
      expiryDate: '2024-02-10',
      status: 'aging',
      supplier: 'Mountain View Farms',
    },
    {
      id: '4',
      product: 'Avocado Hass',
      quantity: 25,
      unit: 'crates',
      location: 'B2',
      temperature: 4,
      humidity: 85,
      entryDate: '2024-01-05',
      expiryDate: '2024-02-05',
      status: 'expiring',
      supplier: 'Tropical Fruits Ltd',
    }
  ];

  // Transform API data to match ColdRoomInventoryType
  const transformAvocadoInventory = (data: AvocadoInventoryAPI[]): ColdRoomInventoryType[] => {
    return data.map(item => ({
      id: item.id,
      product: `${item.variety} Avocado - Size ${item.size} - ${item.boxType} - ${item.class}`,
      quantity: item.quantity,
      unit: item.boxType === '4kg' ? 'boxes' : 'crates',
      location: item.location,
      temperature: item.temperature,
      humidity: item.humidity,
      entryDate: item.entryDate,
      expiryDate: item.expiryDate,
      status: item.status,
      supplier: item.supplier,
    }));
  };

  // Fetch avocado inventory from database
  const fetchColdRoomInventory = async () => {
    try {
      const response = await fetch('/api/inventory/avocado');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch avocado inventory: ${response.statusText}`);
      }
      
      const data: AvocadoInventoryAPI[] = await response.json();
      const transformedInventory = transformAvocadoInventory(data);
      setColdRoomInventory(transformedInventory);
    } catch (error: any) {
      console.error('Error fetching avocado inventory:', error);
      setError(error.message || 'Failed to load avocado inventory');
      // Use sample data as fallback
      setColdRoomInventory(sampleAvocadoInventory);
    }
  };

  // Fetch packaging materials from database
  const fetchPackagingMaterials = async () => {
    try {
      const response = await fetch('/api/inventory/packaging');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch packaging materials: ${response.statusText}`);
      }
      
      const data: PackagingMaterialAPI[] = await response.json();
      
      // Transform to match PackagingMaterial type
      const transformedMaterials: PackagingMaterial[] = data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock || 0,
        reorderLevel: item.reorderLevel || 0,
        dimensions: item.dimensions,
        lastUsedDate: item.lastUsedDate,
        consumptionRate: item.consumptionRate || 'medium',
      }));
      
      setPackagingMaterials(transformedMaterials);
    } catch (error: any) {
      console.error('Error fetching packaging materials:', error);
      setError(error.message || 'Failed to load packaging materials');
      // Use empty array as fallback
      setPackagingMaterials([]);
    }
  };

  // Fetch inventory KPIs
  const fetchInventoryKPIs = async () => {
    try {
      const response = await fetch('/api/inventory/kpi');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory KPIs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setInventoryKPIs({
        totalValue: data.totalValue || 0,
        itemsBelowReorder: data.itemsBelowReorder || 0,
        inventoryTurnover: data.inventoryTurnover || 0,
        totalAvocadoBoxes: data.totalAvocadoBoxes || coldRoomInventory.reduce((sum, item) => sum + item.quantity, 0),
        fuerteBoxes: data.fuerteBoxes || coldRoomInventory.filter(item => item.product.includes('Fuerte')).reduce((sum, item) => sum + item.quantity, 0),
        hassBoxes: data.hassBoxes || coldRoomInventory.filter(item => item.product.includes('Hass')).reduce((sum, item) => sum + item.quantity, 0),
      });
    } catch (error: any) {
      console.error('Error fetching inventory KPIs:', error);
      // Calculate from current inventory
      const totalAvocadoBoxes = coldRoomInventory.reduce((sum, item) => sum + item.quantity, 0);
      const fuerteBoxes = coldRoomInventory.filter(item => item.product.includes('Fuerte')).reduce((sum, item) => sum + item.quantity, 0);
      const hassBoxes = coldRoomInventory.filter(item => item.product.includes('Hass')).reduce((sum, item) => sum + item.quantity, 0);
      
      setInventoryKPIs({
        totalValue: 25400000,
        itemsBelowReorder: 3,
        inventoryTurnover: 5.2,
        totalAvocadoBoxes,
        fuerteBoxes,
        hassBoxes,
      });
    }
  };

  // Load all data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchColdRoomInventory(),
        fetchPackagingMaterials(),
        fetchInventoryKPIs(),
      ]);
    } catch (error: any) {
      setError(error.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRowClick = (item: ColdRoomInventoryType) => {
    router.push(`/cold-room?palletId=${item.location}`);
  };
  
  // Handle complete stock take
  const handleCompleteStockTake = async (counts: Record<string, number>) => {
    setIsProcessingStockTake(true);
    
    try {
      // Prepare data for API
      const stockTakeItems = Object.entries(counts).map(([id, counted]) => {
        const item = coldRoomInventory.find(i => i.id === id);
        return {
          id,
          product: item?.product || 'Unknown',
          expected: item?.quantity || 0,
          counted,
          variance: counted - (item?.quantity || 0),
          location: item?.location || 'Unknown',
        };
      });
      
      const response = await fetch('/api/inventory/stock-take', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          counts: stockTakeItems,
          userId: 'user-123', // Replace with actual user ID
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save stock take results');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Stock Take Completed Successfully',
        description: `${result.summary.totalItems} items processed. ${result.summary.exactMatches} exact matches, ${result.summary.variances} variances found.`,
      });
      
      // Exit stock take mode
      setStockTakeMode(false);
      
      // Refresh inventory data to reflect any updates
      await fetchColdRoomInventory();
      
    } catch (error: any) {
      console.error('Error completing stock take:', error);
      toast({
        title: 'Stock Take Failed',
        description: error.message || 'Could not save stock take results',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingStockTake(false);
    }
  };
  
  // Handle cancel stock take
  const handleCancelStockTake = () => {
    setStockTakeMode(false);
    toast({
      title: 'Stock Take Cancelled',
      description: 'No changes were saved',
    });
  };
  
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
          currentStock: 0,
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
      
    } catch (error: any) {
      console.error('Error adding packaging material:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add packaging material',
        variant: 'destructive',
      });
      
      // Fallback: add to local state
      const fallbackMaterial: PackagingMaterial = {
        id: `pkg-${Date.now()}`,
        name: values.name,
        category: values.category,
        unit: values.unit,
        currentStock: 0,
        reorderLevel: values.reorderLevel,
        dimensions: values.dimensions,
        lastUsedDate: new Date().toISOString(),
        consumptionRate: 'medium',
      };
      setPackagingMaterials(prev => [fallbackMaterial, ...prev]);
    }
  };

  const inventoryKpis = {
    totalValue: {
      title: 'Total Inventory Value',
      value: inventoryKPIs ? `KES ${(inventoryKPIs.totalValue / 1000000).toFixed(1)}M` : 'KES 0M',
      change: 'estimated value on hand',
      changeType: 'increase' as const,
    },
    totalAvocadoBoxes: {
      title: 'Avocado Boxes',
      value: inventoryKPIs ? inventoryKPIs.totalAvocadoBoxes.toString() : '0',
      change: 'in cold storage',
      changeType: 'increase' as const,
    },
    itemsLow: {
      title: 'Items Below Reorder',
      value: inventoryKPIs ? inventoryKPIs.itemsBelowReorder.toString() : '0',
      change: 'produce & packaging',
      changeType: inventoryKPIs?.itemsBelowReorder > 0 ? 'increase' as const : 'decrease' as const,
    },
    fuerteBoxes: {
      title: 'Fuerte Boxes',
      value: inventoryKPIs ? inventoryKPIs.fuerteBoxes.toString() : '0',
      change: '4kg & 10kg',
      changeType: 'increase' as const,
    },
    hassBoxes: {
      title: 'Hass Boxes',
      value: inventoryKPIs ? inventoryKPIs.hassBoxes.toString() : '0',
      change: '4kg & 10kg',
      changeType: 'increase' as const,
    },
    inventoryTurnover: {
      title: 'Inventory Turnover Rate',
      value: inventoryKPIs ? inventoryKPIs.inventoryTurnover.toFixed(1) : '0.0',
      change: 'per month',
      changeType: 'increase' as const,
    }
  };

  const fastMovingPackaging = packagingMaterials.filter(m => m.consumptionRate === 'high');
  const deadStockPackaging = packagingMaterials.filter(m => m.consumptionRate === 'low');

  if (isLoading) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshViewLogo className="w-8 h-8 text-primary" />
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Inventory Management
              </h2>
              <p className="text-muted-foreground">
                Track avocado varieties in cold storage and manage packaging material stock.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => loadData()} variant="outline" size="sm" disabled={isLoading || isProcessingStockTake}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => setStockTakeMode(!stockTakeMode)} 
                disabled={isLoading || isProcessingStockTake}
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
                    Using cached or mock data. Check your API configuration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {stockTakeMode && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ListTodo className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Stock Take Mode Active</p>
                  <p className="text-xs text-blue-700">
                    Enter actual counts for each inventory item. Click "Exit Stock Take" to cancel or complete counts.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <OverviewCard data={inventoryKpis.totalValue} icon={Weight} />
            <OverviewCard data={inventoryKpis.totalAvocadoBoxes} icon={Boxes} />
            <OverviewCard data={inventoryKpis.itemsLow} icon={PackageIcon} />
            <OverviewCard data={inventoryKpis.fuerteBoxes} icon={Boxes} />
            <OverviewCard data={inventoryKpis.hassBoxes} icon={Boxes} />
            <OverviewCard data={inventoryKpis.inventoryTurnover} icon={TrendingUp} />
          </div>

          <Tabs defaultValue="produce">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="produce">Avocado Inventory</TabsTrigger>
              <TabsTrigger value="packaging">Packaging Materials</TabsTrigger>
            </TabsList>
            <TabsContent value="produce" className="mt-6">
              <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ColdRoomInventory 
                    inventory={coldRoomInventory} 
                    stockTakeMode={stockTakeMode} 
                    onRowClick={handleRowClick}
                    onCompleteStockTake={handleCompleteStockTake}
                    onCancelStockTake={handleCancelStockTake}
                  />
                </div>
                <div className="space-y-6">
                  <InventorySummaryCard inventory={coldRoomInventory} />
                  <Card>
                    <CardHeader>
                      <CardTitle>Avocado Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Fuerte Avocados</div>
                          <div className="flex justify-between items-center">
                            <div className="text-lg font-bold text-blue-600">
                              {coldRoomInventory
                                .filter(item => item.product.includes('Fuerte'))
                                .reduce((sum, item) => sum + item.quantity, 0)}
                            </div>
                            <div className="text-sm text-gray-500">boxes</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Hass Avocados</div>
                          <div className="flex justify-between items-center">
                            <div className="text-lg font-bold text-green-600">
                              {coldRoomInventory
                                .filter(item => item.product.includes('Hass'))
                                .reduce((sum, item) => sum + item.quantity, 0)}
                            </div>
                            <div className="text-sm text-gray-500">boxes</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="packaging" className="mt-6">
              <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <PackagingMaterialStock 
                    materials={packagingMaterials} 
                    stockTakeMode={stockTakeMode} 
                    setMaterials={setPackagingMaterials} 
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlusCircle />
                        Add New Packaging Material
                      </CardTitle>
                      <CardDescription>
                        Add a new type of box, label, or wrap to the inventory system.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CreatePackagingForm onSubmit={handleAddPackaging} />
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <PackagingSummaryCard materials={packagingMaterials} />
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp/>
                        Fast-Moving Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {fastMovingPackaging.length > 0 ? (
                        fastMovingPackaging.map(item => (
                          <p key={item.id} className="text-sm text-muted-foreground">{item.name}</p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No fast-moving items</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Archive/>
                        Dead Stock / Slow Movers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {deadStockPackaging.length > 0 ? (
                        deadStockPackaging.map(item => (
                          <p key={item.id} className="text-sm text-muted-foreground">{item.name}</p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No dead stock items</p>
                      )}
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
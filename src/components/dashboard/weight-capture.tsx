'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Scale, Package, Truck, User, Phone, MapPin, Camera, Plus, X, CheckCircle, Building, CreditCard, Trash2, ChevronDown, ChevronRight, Calendar, FileText, BarChart, RefreshCw, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './image-upload';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface CheckedInSupplier {
  id: string;
  supplier_code: string;
  company_name: string;
  driver_name: string;
  phone_number: string;
  id_number: string;
  vehicle_plate: string;
  fruit_varieties: string[];
  region: string;
  check_in_time: string;
  status?: 'pending' | 'weighed';
}

interface FruitVariety {
  name: string;
  weight: number;
  crates: number;
}

interface WeightCaptureFormData {
  // From selected supplier (auto-filled)
  supplier_id: string;
  driver_name: string;
  driver_phone: string;
  vehicle_plate: string;
  driver_id_number: string;
  
  // Supplier details (to be filled manually)
  supplier_name: string;
  supplier_phone: string;
  region: string;
  
  // Fruit varieties with weights
  fruit_varieties: FruitVariety[];
  
  // Weight information (auto-generated)
  pallet_id: string;
  product: string;
  
  // Additional
  image_url: string;
  notes: string;
}

interface SupplierIntakeRecord {
  id: string;
  pallet_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  total_weight: number;
  fruit_varieties: FruitVariety[];
  region: string;
  timestamp: string;
  status: 'pending' | 'processed' | 'rejected';
}

interface WeightCaptureProps {
  onAddWeight: (data: any) => void;
  isLoading: boolean;
  onRefreshSuppliers?: () => void;
  processedSupplierIds?: Set<string>;
}

export function WeightCapture({ onAddWeight, isLoading, onRefreshSuppliers, processedSupplierIds = new Set() }: WeightCaptureProps) {
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<CheckedInSupplier | null>(null);
  const [checkedInSuppliers, setCheckedInSuppliers] = useState<CheckedInSupplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierIntakeRecords, setSupplierIntakeRecords] = useState<SupplierIntakeRecord[]>([]);
  const [intakeLoading, setIntakeLoading] = useState(true);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<WeightCaptureFormData>({
    supplier_id: '',
    driver_name: '',
    driver_phone: '',
    vehicle_plate: '',
    driver_id_number: '',
    supplier_name: '',
    supplier_phone: '',
    region: '',
    fruit_varieties: [],
    pallet_id: '',
    product: '',
    image_url: '',
    notes: '',
  });
  const [currentFruitName, setCurrentFruitName] = useState('');
  const [currentFruitWeight, setCurrentFruitWeight] = useState('');
  const [currentFruitCrates, setCurrentFruitCrates] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Generate pallet ID
  const generatePalletId = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SUP${randomNum}/${dateStr}`;
  };

  // Fetch checked-in suppliers on component mount
  useEffect(() => {
    fetchCheckedInSuppliers();
    fetchSupplierIntakeRecords();
  }, []);

  // Update supplier list when processedSupplierIds changes
// Update supplier list when processedSupplierIds changes
useEffect(() => {
  if (checkedInSuppliers.length > 0) {
    // Only update if there are actually suppliers to filter
    const pendingSuppliers = checkedInSuppliers.filter(supplier => 
      !processedSupplierIds.has(supplier.id)
    );
    
    // Only update if the filtered list is different
    if (pendingSuppliers.length !== checkedInSuppliers.length) {
      setCheckedInSuppliers(pendingSuppliers);
    }
  }
}, [processedSupplierIds, checkedInSuppliers]);
  // Auto-fill form when supplier is selected
  useEffect(() => {
    if (selectedSupplier) {
      const palletId = generatePalletId();
      
      setFormData(prev => ({
        ...prev,
        supplier_id: selectedSupplier.id,
        driver_name: selectedSupplier.driver_name,
        driver_phone: selectedSupplier.phone_number,
        vehicle_plate: selectedSupplier.vehicle_plate,
        driver_id_number: selectedSupplier.id_number,
        pallet_id: palletId,
        // Pre-fill supplier name from company name
        supplier_name: selectedSupplier.company_name,
        // Pre-fill region
        region: selectedSupplier.region,
      }));
    }
  }, [selectedSupplier]);

  // Update pallet ID when region changes
  useEffect(() => {
    if (formData.region) {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const regionCode = formData.region.substring(0, 3).toUpperCase();
      setFormData(prev => ({
        ...prev,
        pallet_id: `SUP${randomNum}/${dateStr}/${regionCode}`,
      }));
    }
  }, [formData.region]);

  const fetchCheckedInSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      
      const response = await fetch('/api/suppliers/checked-in');
      
      if (!response.ok) {
        throw new Error('Failed to fetch checked-in suppliers');
      }
      
      const data: CheckedInSupplier[] = await response.json();
      
      // Filter out suppliers that have already been weighed
      const pendingSuppliers = data.filter(supplier => 
        !processedSupplierIds.has(supplier.id)
      );
      
      // Set only pending suppliers with 'pending' status
      const suppliersWithStatus = pendingSuppliers.map(supplier => ({
        ...supplier,
        status: 'pending' as const
      }));
      
      setCheckedInSuppliers(suppliersWithStatus);
    } catch (error: any) {
      console.error('Error fetching checked-in suppliers:', error);
      toast({
        title: 'Warning',
        description: 'Could not load checked-in suppliers. You can still enter data manually.',
        variant: 'destructive',
      });
      setCheckedInSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchSupplierIntakeRecords = async () => {
    try {
      setIntakeLoading(true);
      
      // Fetch recent weight entries from the API
      const response = await fetch('/api/weights?limit=100&order=desc');
      
      if (!response.ok) {
        throw new Error('Failed to fetch supplier intake records');
      }
      
      const weightEntries = await response.json();
      
      // Transform weight entries into supplier intake records
      const intakeRecords: SupplierIntakeRecord[] = weightEntries.map((entry: any) => {
        // Extract fruit varieties from the API response
        let fruitVarieties: FruitVariety[] = [];
        let totalWeightFromVarieties = 0;
        
        // First try to parse fruit_variety from the API
        if (entry.fruit_variety) {
          try {
            if (typeof entry.fruit_variety === 'string') {
              // Try to parse JSON string
              const parsed = JSON.parse(entry.fruit_variety);
              if (Array.isArray(parsed)) {
                if (typeof parsed[0] === 'string') {
                  // Array of strings
                  fruitVarieties = parsed.map((name: string) => ({ 
                    name, 
                    weight: 0, 
                    crates: 0 
                  }));
                } else if (typeof parsed[0] === 'object') {
                  // Array of objects with weight property
                  fruitVarieties = parsed.map((item: any) => ({
                    name: item.name || item.product || 'Unknown',
                    weight: item.weight || 0,
                    crates: item.crates || 0
                  }));
                  totalWeightFromVarieties = fruitVarieties.reduce((sum, v) => sum + v.weight, 0);
                }
              }
            } else if (Array.isArray(entry.fruit_variety)) {
              // Already an array
              if (typeof entry.fruit_variety[0] === 'string') {
                fruitVarieties = entry.fruit_variety.map((name: string) => ({ 
                  name, 
                  weight: 0, 
                  crates: 0 
                }));
              } else if (typeof entry.fruit_variety[0] === 'object') {
                fruitVarieties = entry.fruit_variety.map((item: any) => ({
                  name: item.name || item.product || 'Unknown',
                  weight: item.weight || 0,
                  crates: item.crates || 0
                }));
                totalWeightFromVarieties = fruitVarieties.reduce((sum, v) => sum + v.weight, 0);
              }
            }
          } catch (parseError) {
            console.error('Error parsing fruit_variety:', parseError);
            // Fallback to product field
            fruitVarieties = [{
              name: entry.product || 'Unknown',
              weight: 0,
              crates: 0
            }];
          }
        } else if (entry.product) {
          // Fallback to product field
          fruitVarieties = [{
            name: entry.product,
            weight: 0,
            crates: 0
          }];
        }
        
        // Calculate the total weight - prioritize in this order:
        // 1. Total weight from fruit varieties (if they have weights)
        // 2. net_weight from API
        // 3. netWeight from API
        // 4. weight from API
        let totalWeight = 0;
        
        if (totalWeightFromVarieties > 0) {
          totalWeight = totalWeightFromVarieties;
        } else if (entry.net_weight !== undefined && entry.net_weight !== null) {
          totalWeight = typeof entry.net_weight === 'number' ? entry.net_weight : parseFloat(entry.net_weight) || 0;
        } else if (entry.netWeight !== undefined && entry.netWeight !== null) {
          totalWeight = typeof entry.netWeight === 'number' ? entry.netWeight : parseFloat(entry.netWeight) || 0;
        } else if (entry.weight !== undefined && entry.weight !== null) {
          totalWeight = typeof entry.weight === 'number' ? entry.weight : parseFloat(entry.weight) || 0;
        }
        
        return {
          id: entry.id,
          pallet_id: entry.pallet_id || entry.palletId || '',
          supplier_name: entry.supplier || entry.supplier_name || 'Unknown Supplier',
          driver_name: entry.driver_name || entry.driverId || entry.driver_id || '',
          vehicle_plate: entry.vehicle_plate || entry.truck_id || entry.truckId || '',
          total_weight: totalWeight,
          fruit_varieties: fruitVarieties,
          region: entry.region || '',
          timestamp: entry.timestamp || entry.created_at,
          status: 'processed'
        };
      });
      
      setSupplierIntakeRecords(intakeRecords);
    } catch (error: any) {
      console.error('Error fetching supplier intake records:', error);
      toast({
        title: 'Info',
        description: 'Could not load intake records. Showing sample data.',
      });
      // Fallback to sample data
      setSupplierIntakeRecords(getSampleIntakeRecords());
    } finally {
      setIntakeLoading(false);
    }
  };

  const getSampleIntakeRecords = (): SupplierIntakeRecord[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      {
        id: 'record-1',
        pallet_id: 'PAL001/0801',
        supplier_name: 'Green Valley Farms',
        driver_name: 'John Kamau',
        vehicle_plate: 'KDA 123A',
        total_weight: 450.5,
        fruit_varieties: [
          { name: 'Avocados', weight: 250, crates: 25 },
          { name: 'Mangoes', weight: 200.5, crates: 20 }
        ],
        region: 'Central',
        timestamp: today.toISOString(),
        status: 'processed'
      },
      {
        id: 'record-2',
        pallet_id: 'PAL002/0801',
        supplier_name: 'Rift Valley Orchards',
        driver_name: 'Jane Wanjiku',
        vehicle_plate: 'KDB 456B',
        total_weight: 320.75,
        fruit_varieties: [
          { name: 'Blueberries', weight: 150.25, crates: 15 },
          { name: 'Strawberries', weight: 170.5, crates: 17 }
        ],
        region: 'Rift Valley',
        timestamp: today.toISOString(),
        status: 'processed'
      },
      {
        id: 'record-3',
        pallet_id: 'PAL003/0731',
        supplier_name: 'Coastal Produce Ltd',
        driver_name: 'Mohammed Ali',
        vehicle_plate: 'KDC 789C',
        total_weight: 280.3,
        fruit_varieties: [
          { name: 'Pineapples', weight: 150, crates: 15 },
          { name: 'Coconuts', weight: 130.3, crates: 13 }
        ],
        region: 'Coast',
        timestamp: yesterday.toISOString(),
        status: 'processed'
      }
    ];
  };

  const toggleSupplierExpansion = (supplierName: string) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
    }
    setExpandedSuppliers(newExpanded);
  };

  // Group intake records by supplier
  const groupedIntakeRecords = supplierIntakeRecords.reduce((acc, record) => {
    if (!acc[record.supplier_name]) {
      acc[record.supplier_name] = [];
    }
    acc[record.supplier_name].push(record);
    return acc;
  }, {} as Record<string, SupplierIntakeRecord[]>);

  // Calculate totals for each supplier
  const supplierTotals = Object.entries(groupedIntakeRecords).map(([supplierName, records]) => {
    const totalWeight = records.reduce((sum, record) => sum + record.total_weight, 0);
    const totalDeliveries = records.length;
    const lastDelivery = records[0]?.timestamp || '';
    
    return {
      supplier_name: supplierName,
      total_weight: totalWeight,
      total_deliveries: totalDeliveries,
      last_delivery: lastDelivery,
      records: records
    };
  });

  // Sort suppliers by total weight (descending)
  supplierTotals.sort((a, b) => b.total_weight - a.total_weight);

  const handleSupplierSelect = (supplier: CheckedInSupplier) => {
    // Since weighed suppliers are now filtered out, this check is redundant
    // but kept as a safety measure
    if (processedSupplierIds.has(supplier.id)) {
      toast({
        title: "Supplier Already Processed",
        description: `${supplier.driver_name} has already been weighed and moved to intake records`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedSupplier(supplier);
    toast({
      title: "Supplier Selected",
      description: `${supplier.driver_name}'s details have been loaded`,
    });
  };

  const handleAddFruitVariety = () => {
    if (currentFruitName.trim() && currentFruitWeight) {
      // Check if fruit already exists
      const exists = formData.fruit_varieties.some(v => v.name.toLowerCase() === currentFruitName.trim().toLowerCase());
      
      if (!exists) {
        const newVariety: FruitVariety = {
          name: currentFruitName.trim(),
          weight: parseFloat(currentFruitWeight) || 0,
          crates: parseInt(currentFruitCrates) || 0
        };
        
        setFormData(prev => ({
          ...prev,
          fruit_varieties: [...prev.fruit_varieties, newVariety],
        }));
        
        // Clear inputs
        setCurrentFruitName('');
        setCurrentFruitWeight('');
        setCurrentFruitCrates('');
        
        toast({
          title: "Fruit Variety Added",
          description: `${newVariety.name} added with ${newVariety.weight}kg`,
        });
      } else {
        toast({
          title: "Duplicate Fruit",
          description: `${currentFruitName.trim()} is already in the list`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please enter fruit name and weight",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFruitVariety = (index: number) => {
    const removedVariety = formData.fruit_varieties[index];
    setFormData(prev => ({
      ...prev,
      fruit_varieties: prev.fruit_varieties.filter((_, i) => i !== index),
    }));
    
    toast({
      title: "Fruit Variety Removed",
      description: `${removedVariety.name} removed from list`,
    });
  };

  const handleFruitWeightChange = (index: number, value: string) => {
    const newVarieties = [...formData.fruit_varieties];
    newVarieties[index] = {
      ...newVarieties[index],
      weight: parseFloat(value) || 0
    };
    
    setFormData(prev => ({
      ...prev,
      fruit_varieties: newVarieties
    }));
  };

  const handleFruitCratesChange = (index: number, value: string) => {
    const newVarieties = [...formData.fruit_varieties];
    newVarieties[index] = {
      ...newVarieties[index],
      crates: parseInt(value) || 0
    };
    
    setFormData(prev => ({
      ...prev,
      fruit_varieties: newVarieties
    }));
  };

  // Calculate total weight from fruit varieties
  const calculateTotalFruitWeight = () => {
    return formData.fruit_varieties.reduce((total, variety) => total + variety.weight, 0);
  };

  // Calculate total crates from fruit varieties
  const calculateTotalCrates = () => {
    return formData.fruit_varieties.reduce((total, variety) => total + variety.crates, 0);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      setFormData(prev => ({ ...prev, image_url: data.url }));
      
      toast({
        title: "Image Uploaded",
        description: "Pictorial evidence has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.pallet_id) {
        toast({
          title: "Validation Error",
          description: "Pallet ID is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.supplier_name || !formData.supplier_phone) {
        toast({
          title: "Supplier Details Required",
          description: "Please enter supplier name and phone number",
          variant: "destructive",
        });
        return;
      }

      if (!formData.region) {
        toast({
          title: "Region Required",
          description: "Please enter region",
          variant: "destructive",
        });
        return;
      }

      // Validate fruit varieties
      if (formData.fruit_varieties.length === 0) {
        toast({
          title: "Fruit Varieties Required",
          description: "Please add at least one fruit variety with weight",
          variant: "destructive",
        });
        return;
      }

      // Check if all varieties have weight
      const hasZeroWeight = formData.fruit_varieties.some(v => v.weight <= 0);
      if (hasZeroWeight) {
        toast({
          title: "Weight Required",
          description: "Please enter weight for all fruit varieties",
          variant: "destructive",
        });
        return;
      }

      // Calculate totals
      const totalFruitWeight = calculateTotalFruitWeight();
      const totalCrates = calculateTotalCrates();

      // Prepare data for API
      const weightData = {
        pallet_id: formData.pallet_id,
        product: formData.product || formData.fruit_varieties.map(v => v.name).join(', ') || 'Fresh Produce',
        weight: totalFruitWeight, // Send as main weight field
        unit: 'kg' as const,
        timestamp: new Date().toISOString(),
        
        // Supplier details
        supplier: formData.supplier_name,
        supplier_id: formData.supplier_id,
        supplier_phone: formData.supplier_phone,
        // Send fruit varieties as JSON string
        fruit_variety: JSON.stringify(formData.fruit_varieties.map(v => ({
          name: v.name,
          weight: v.weight,
          crates: v.crates
        }))),
        number_of_crates: totalCrates,
        region: formData.region,
        image_url: formData.image_url,
        
        // Driver/vehicle details (from check-in)
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        driver_id_number: formData.driver_id_number,
        vehicle_plate: formData.vehicle_plate,
        truck_id: formData.vehicle_plate, // Map vehicle_plate to truck_id for consistency
        
        // Weight fields for compatibility
        gross_weight: totalFruitWeight,
        net_weight: totalFruitWeight,
        declared_weight: totalFruitWeight,
        
        notes: formData.notes,
      };

      // Call the parent handler
      onAddWeight(weightData);
      
      // Refresh intake records after successful submission
      setTimeout(() => {
        fetchSupplierIntakeRecords();
        fetchCheckedInSuppliers(); // This will refresh and filter out the weighed supplier
      }, 1500);
      
      // Call the refresh suppliers callback if provided
      if (onRefreshSuppliers) {
        setTimeout(() => {
          onRefreshSuppliers();
        }, 1000);
      }
      
      // Reset form
      setFormData({
        supplier_id: '',
        driver_name: '',
        driver_phone: '',
        vehicle_plate: '',
        driver_id_number: '',
        supplier_name: '',
        supplier_phone: '',
        region: '',
        fruit_varieties: [],
        pallet_id: generatePalletId(),
        product: '',
        image_url: '',
        notes: '',
      });
      setSelectedSupplier(null);
      
      toast({
        title: "Weight Entry Submitted",
        description: "Supplier intake has been recorded successfully and moved to intake records",
      });
      
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit weight data",
        variant: "destructive",
      });
    }
  };

  // Filter suppliers based on search - only show pending suppliers
  const filteredSuppliers = checkedInSuppliers.filter(supplier =>
    (supplier.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate totals for display
  const totalFruitWeight = calculateTotalFruitWeight();
  const totalCrates = calculateTotalCrates();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Count suppliers by status
  const pendingSuppliersCount = checkedInSuppliers.filter(s => s.status === 'pending').length;
  const weighedSuppliersCount = supplierIntakeRecords.length; // Now only from intake records

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Supplier Selection & Intake Tracking */}
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="suppliers">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="suppliers">
              <Truck className="w-4 h-4 mr-2" />
              Checked-in Suppliers
              {pendingSuppliersCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0">
                  {pendingSuppliersCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="intake">
              <BarChart className="w-4 h-4 mr-2" />
              Supplier Intake Records
              {weighedSuppliersCount > 0 && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                  {weighedSuppliersCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Checked-in Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Checked-in Suppliers Status</CardTitle>
                <CardDescription>
                  Select a pending supplier to weigh. Suppliers with completed intake are moved to intake records.
                </CardDescription>
                
                <div className="flex items-center gap-4 text-sm mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Pending Weighing ({pendingSuppliersCount})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Intake Complete ({weighedSuppliersCount})</span>
                  </div>
                </div>
                
                <div className="relative mt-2">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <Input
                    placeholder="Search by driver, vehicle plate, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {suppliersLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                      <p className="text-gray-500">Loading suppliers...</p>
                    </div>
                  ) : checkedInSuppliers.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                      <p className="text-gray-700 font-medium text-lg">All suppliers processed!</p>
                      <p className="text-gray-500 mt-2">
                        No pending suppliers for weighing. All checked-in suppliers have been processed.
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Check the "Supplier Intake Records" tab to view all processed suppliers.
                      </p>
                    </div>
                  ) : filteredSuppliers.length === 0 ? (
                    <div className="text-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-3">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <p className="text-gray-500 font-medium">No matching suppliers found</p>
                      <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSuppliers.map((supplier) => (
                        <div
                          key={supplier.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedSupplier?.id === supplier.id
                              ? 'ring-2 ring-primary/20' 
                              : 'hover:border-primary'
                          } border-blue-200 bg-black-50 hover:bg-black-100`}
                          onClick={() => handleSupplierSelect(supplier)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">{supplier.driver_name}</div>
                                {selectedSupplier?.id === supplier.id ? (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Selected
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-green-800 bg-white">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Truck className="w-3 h-3 text-gray-500" />
                                  <span className="font-medium">{supplier.vehicle_plate}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-3 h-3 text-gray-500" />
                                  <span className="font-mono text-xs">{supplier.id_number}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Building className="w-3 h-3 text-gray-500" />
                                  <span className="truncate">{supplier.company_name}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3 text-gray-500" />
                                  <span>{supplier.phone_number}</span>
                                </div>
                              </div>
                              
                              {supplier.fruit_varieties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {supplier.fruit_varieties.slice(0, 3).map((variety, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                      {variety}
                                    </Badge>
                                  ))}
                                  {supplier.fruit_varieties.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{supplier.fruit_varieties.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right text-sm text-gray-500">
                              <div>Checked in:</div>
                              <div className="font-mono font-medium text-xs">
                                {new Date(supplier.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <Badge variant="outline" className="mt-2 text-xs bg-black">
                                {supplier.supplier_code}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="mt-4 pt-4 border-t text-sm text-gray-500 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span>
                      {pendingSuppliersCount} pending supplier{pendingSuppliersCount !== 1 ? 's' : ''} to weigh
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs">Pending</span>
                    </div>
                  </div>
                  <Button
                    onClick={fetchCheckedInSuppliers}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    disabled={suppliersLoading}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Selected Supplier Summary */}
            {selectedSupplier && (
              <Card className="border-blue-200 bg-black-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Auto-filled Driver Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-500">Driver Name</div>
                      <div className="font-semibold">{selectedSupplier.driver_name}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Vehicle Plate</div>
                      <div className="font-semibold">{selectedSupplier.vehicle_plate}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">ID Number</div>
                      <div className="font-mono text-xs">{selectedSupplier.id_number}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Phone</div>
                      <div>{selectedSupplier.phone_number}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSupplier(null)}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear Selection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Supplier Intake Records Tab */}
          <TabsContent value="intake" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Supplier Intake Records
                </CardTitle>
                <CardDescription>
                  Track weight intake records by supplier with detailed breakdown
                </CardDescription>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={fetchSupplierIntakeRecords}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={intakeLoading}
                  >
                    {intakeLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Refresh Records
                  </Button>
                  <div className="text-xs text-gray-500 ml-auto">
                    Showing {supplierIntakeRecords.length} records from {supplierTotals.length} suppliers
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {intakeLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                      <p className="text-gray-500">Loading intake records...</p>
                    </div>
                  ) : supplierTotals.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No intake records found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Submit weight entries to see supplier intake records here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {supplierTotals.map((supplier) => (
                        <Collapsible
                          key={supplier.supplier_name}
                          open={expandedSuppliers.has(supplier.supplier_name)}
                          onOpenChange={() => toggleSupplierExpansion(supplier.supplier_name)}
                          className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900"
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`transition-transform ${expandedSuppliers.has(supplier.supplier_name) ? 'rotate-180' : ''}`}>
                                  <ChevronDown className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">{supplier.supplier_name}</h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-300">
                                    <span className="flex items-center gap-1">
                                      <Scale className="w-3 h-3" />
                                      {supplier.total_weight.toFixed(2)} kg total
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Truck className="w-3 h-3" />
                                      {supplier.total_deliveries} delivery{supplier.total_deliveries !== 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatDate(supplier.last_delivery)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <Badge className="bg-green-900/50 text-green-300 border-green-700">
                                <CheckCheck className="w-3 h-3 mr-1" />
                                Intake Complete
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="bg-black text-white">
                            <div className="p-4 border-t border-gray-800">
                              <div className="mb-4">
                                <h5 className="font-medium text-sm text-gray-300 mb-2">Delivery Records</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-800">
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Pallet ID</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Driver</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Vehicle</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Weight</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Date</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {supplier.records.map((record) => (
                                        <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-900">
                                          <td className="py-2 px-3 font-mono">{record.pallet_id}</td>
                                          <td className="py-2 px-3">{record.driver_name}</td>
                                          <td className="py-2 px-3 font-mono">{record.vehicle_plate}</td>
                                          <td className="py-2 px-3">
                                            <span className="font-bold text-white">{record.total_weight.toFixed(2)}</span> kg
                                          </td>
                                          <td className="py-2 px-3 text-sm text-gray-300">{formatDate(record.timestamp)}</td>
                                          <td className="py-2 px-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                              record.status === 'processed' 
                                                ? 'bg-green-900/30 text-green-400 border border-green-800' 
                                                : record.status === 'pending'
                                                ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                                                : 'bg-red-900/30 text-red-400 border border-red-800'
                                            }`}>
                                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h5 className="font-medium text-sm text-gray-300 mb-2">Fruit Varieties Summary</h5>
                                <div className="grid grid-cols-2 gap-3">
                                  {supplier.records.flatMap(record => record.fruit_varieties).reduce((acc, variety) => {
                                    const existing = acc.find(v => v.name === variety.name);
                                    if (existing) {
                                      existing.weight += variety.weight;
                                    } else {
                                      acc.push({ ...variety });
                                    }
                                    return acc;
                                  }, [] as FruitVariety[]).map((variety, index) => (
                                    <div key={index} className="border border-gray-800 rounded p-3 bg-gray-900">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-white">{variety.name}</span>
                                        <span className="font-bold text-blue-400">{variety.weight.toFixed(2)} kg</span>
                                      </div>
                                      {variety.crates > 0 && (
                                        <div className="text-sm text-gray-400 mt-1">
                                          {variety.crates} crate{variety.crates !== 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
                                <div className="flex justify-between">
                                  <span>Average weight per delivery:</span>
                                  <span className="font-semibold text-white">
                                    {(supplier.total_weight / supplier.total_deliveries).toFixed(2)} kg
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right Column: Weight Capture Form */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Weight Capture Form
            </CardTitle>
            <CardDescription>
              Fill in supplier details and weight information
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="supplier">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="supplier">Supplier Details</TabsTrigger>
                  <TabsTrigger value="weight">Weight Information</TabsTrigger>
                </TabsList>
                
                {/* Supplier Details Tab */}
                <TabsContent value="supplier" className="space-y-4 pt-4">
                  {/* Auto-filled driver details (read-only) */}
                  <div className="bg-black-50 p-4 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium mb-3 block">Auto-filled Driver Details</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Driver Name</div>
                        <div className="font-medium">{formData.driver_name || 'Not selected'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Vehicle Plate</div>
                        <div className="font-medium">{formData.vehicle_plate || 'Not selected'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">ID Number</div>
                        <div className="font-mono text-sm">{formData.driver_id_number || 'Not selected'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-medium">{formData.driver_phone || 'Not selected'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Supplier details to be filled manually */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier_name">Supplier Name *</Label>
                        <Input
                          id="supplier_name"
                          value={formData.supplier_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                          required
                          placeholder="Enter supplier company name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="supplier_phone">Supplier Phone *</Label>
                        <Input
                          id="supplier_phone"
                          value={formData.supplier_phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, supplier_phone: e.target.value }))}
                          required
                          placeholder="Enter supplier phone number"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="region">Region *</Label>
                      <Input
                        id="region"
                        value={formData.region}
                        onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                        required
                        placeholder="e.g., Central, Western, etc."
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {/* Weight Information Tab */}
                <TabsContent value="weight" className="space-y-4 pt-4">
                  {/* Auto-generated pallet ID */}
                  <div className="space-y-2">
                    <Label htmlFor="pallet_id">Pallet ID (Auto-generated) *</Label>
                    <Input
                      id="pallet_id"
                      value={formData.pallet_id}
                      readOnly
                      className="bg-black text-white font-mono font-bold"
                    />
                    <div className="text-xs text-black-900">
                    </div>
                  </div>
                  
                  {/* Fruit Varieties with Weight */}
                  <div className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4" />
                        Fruit Varieties with Weight *
                      </Label>
                      
                      {/* Add new fruit variety */}
                      <div className="bg-black-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="fruit-name" className="text-xs">Fruit Variety</Label>
                            <Input
                              id="fruit-name"
                              value={currentFruitName}
                              onChange={(e) => setCurrentFruitName(e.target.value)}
                              placeholder=""
                              className="h-8"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor="fruit-weight" className="text-xs">Weight (kg)</Label>
                            <Input
                              id="fruit-weight"
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentFruitWeight}
                              onChange={(e) => setCurrentFruitWeight(e.target.value)}
                              placeholder=""
                              className="h-8"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor="fruit-crates" className="text-xs">Crates in</Label>
                            <Input
                              id="fruit-crates"
                              type="number"
                              min="0"
                              value={currentFruitCrates}
                              onChange={(e) => setCurrentFruitCrates(e.target.value)}
                              placeholder=""
                              className="h-8"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddFruitVariety}
                          size="sm"
                          className="mt-3 gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Fruit Variety
                        </Button>
                      </div>
                      
                      {/* Display added fruit varieties */}
                      {formData.fruit_varieties.length > 0 ? (
                        <div className="space-y-3">
                          {/* Summary */}
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-700">Total Fruit Weight:</span>
                                <span className="font-bold ml-2 text-blue-700">{totalFruitWeight.toFixed(2)} kg</span>
                              </div>
                              <div>
                                <span className="text-gray-700">Total Crates:</span>
                                <span className="font-bold ml-2 text-blue-700">{totalCrates}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Fruit Varieties List */}
                          <div className="space-y-2">
                            {formData.fruit_varieties.map((variety, index) => (
                              <div key={index} className="border rounded-lg p-3 bg-back">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="font-medium flex items-center gap-2">
                                    <Package className="w-4 h-4 text-primary" />
                                    {variety.name}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveFruitVariety(index)}
                                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label htmlFor={`fruit-weight-${index}`} className="text-xs">
                                      Weight (kg)
                                    </Label>
                                    <Input
                                      id={`fruit-weight-${index}`}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={variety.weight || ''}
                                      onChange={(e) => handleFruitWeightChange(index, e.target.value)}
                                      required
                                      placeholder="0.00"
                                      className="h-8"
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <Label htmlFor={`fruit-crates-${index}`} className="text-xs">
                                      Number of Crates
                                    </Label>
                                    <Input
                                      id={`fruit-crates-${index}`}
                                      type="number"
                                      min="0"
                                      value={variety.crates || ''}
                                      onChange={(e) => handleFruitCratesChange(index, e.target.value)}
                                      placeholder="0"
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-black-200 rounded-lg">
                          <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500">No fruit varieties added yet</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Add fruit varieties above with their weights
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Pictorial Evidence */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Pictorial Evidence (Optional)
                    </Label>
                    <ImageUpload
                      onImageSelect={handleImageUpload}
                      isLoading={isUploading}
                    />
                    {formData.image_url && (
                      <div className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Image uploaded successfully
                      </div>
                    )}
                  </div> 
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm">
                  {selectedSupplier ? (
                    <div className="space-y-1">
                      <span className="flex items-center gap-2 text-blue-600">
                        <CheckCircle className="w-4 h-4" />
                        Driver details auto-filled from check-in system
                      </span>
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Ready for weighing
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-amber-600 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Select a checked-in supplier from the left panel
                      </span>
                      <span className="text-gray-500 text-xs">
                        To auto-fill driver details (Name, Vehicle, ID Number)
                      </span>
                    </div>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading || !formData.supplier_name || !formData.supplier_phone || !formData.region || !formData.pallet_id || formData.fruit_varieties.length === 0}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Scale className="w-4 h-4" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Weight Entry'}
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 pt-2">
                <p>* Required fields. All weight entries are logged and cannot be modified after submission.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Scale, Package, Truck, User, Phone, MapPin, Camera, Plus, X, CheckCircle, Building, CreditCard, Trash2, ChevronDown, ChevronRight, Calendar, FileText, BarChart, RefreshCw, CheckCheck, Clock, AlertCircle, Apple } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './image-upload';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

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

interface PerVarietyItem {
  id: string;
  variety: string;
  weight: string;
  crates: string;
}

interface WeightCaptureFormData {
  supplier_id: string;
  driver_name: string;
  driver_phone: string;
  vehicle_plate: string;
  driver_id_number: string;
  supplier_name: string;
  supplier_phone: string;
  region: string;
  fuerte_weight: string;
  fuerte_crates: string;
  hass_weight: string;
  hass_crates: string;
  pallet_id: string;
  product: string;
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
  fuerte_weight: number;
  fuerte_crates: number;
  hass_weight: number;
  hass_crates: number;
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
  selectedSupplier: any;
  onClearSelectedSupplier: () => void;
  palletCounter: number;
}

export function WeightCapture({ 
  onAddWeight, 
  isLoading, 
  onRefreshSuppliers, 
  processedSupplierIds = new Set(), 
  selectedSupplier,
  onClearSelectedSupplier,
  palletCounter 
}: WeightCaptureProps) {
  const { toast } = useToast();
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
    fuerte_weight: '',
    fuerte_crates: '',
    hass_weight: '',
    hass_crates: '',
    pallet_id: '',
    product: '',
    image_url: '',
    notes: '',
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const generatePalletId = () => {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const palletNum = palletCounter.toString().padStart(3, '0');
    return `PAL-${palletNum}/${dateStr}`;
  };

  useEffect(() => {
    fetchCheckedInSuppliers();
    fetchSupplierIntakeRecords();
  }, []);

  useEffect(() => {
    if (checkedInSuppliers.length > 0) {
      const pendingSuppliers = checkedInSuppliers.filter(supplier => 
        !processedSupplierIds.has(supplier.id)
      );
      
      if (pendingSuppliers.length !== checkedInSuppliers.length) {
        setCheckedInSuppliers(pendingSuppliers);
      }
    }
  }, [processedSupplierIds, checkedInSuppliers]);

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
        supplier_name: selectedSupplier.company_name,
        region: selectedSupplier.region,
        // Reset weights for new supplier
        fuerte_weight: '',
        fuerte_crates: '',
        hass_weight: '',
        hass_crates: ''
      }));
    }
  }, [selectedSupplier]);

  useEffect(() => {
    if (formData.region) {
      const today = new Date();
      const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const palletNum = palletCounter.toString().padStart(3, '0');
      const regionCode = formData.region.substring(0, 3).toUpperCase();
      setFormData(prev => ({
        ...prev,
        pallet_id: `PAL-${palletNum}/${dateStr}/${regionCode}`,
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
      
      const pendingSuppliers = data.filter(supplier => 
        !processedSupplierIds.has(supplier.id)
      );
      
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
      
      const response = await fetch('/api/weights?limit=100&order=desc');
      
      if (!response.ok) {
        throw new Error('Failed to fetch supplier intake records');
      }
      
      const weightEntries = await response.json();
      
      const intakeRecords: SupplierIntakeRecord[] = weightEntries.map((entry: any) => {
        const fuerteWeight = Number(entry.fuerte_weight) || 0;
        const fuerteCrates = Number(entry.fuerte_crates) || 0;
        const hassWeight = Number(entry.hass_weight) || 0;
        const hassCrates = Number(entry.hass_crates) || 0;
        
        const totalWeight = fuerteWeight + hassWeight;
        
        const fruitVarieties: FruitVariety[] = [];
        if (fuerteWeight > 0) {
          fruitVarieties.push({
            name: 'Fuerte',
            weight: fuerteWeight,
            crates: fuerteCrates
          });
        }
        if (hassWeight > 0) {
          fruitVarieties.push({
            name: 'Hass',
            weight: hassWeight,
            crates: hassCrates
          });
        }
        
        return {
          id: entry.id,
          pallet_id: entry.pallet_id || '',
          supplier_name: entry.supplier || entry.supplier_name || 'Unknown Supplier',
          driver_name: entry.driver_name || '',
          vehicle_plate: entry.vehicle_plate || entry.truck_id || '',
          total_weight: totalWeight,
          fuerte_weight: fuerteWeight,
          fuerte_crates: fuerteCrates,
          hass_weight: hassWeight,
          hass_crates: hassCrates,
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
        fuerte_weight: 250,
        fuerte_crates: 25,
        hass_weight: 200.5,
        hass_crates: 20,
        fruit_varieties: [
          { name: 'Fuerte', weight: 250, crates: 25 },
          { name: 'Hass', weight: 200.5, crates: 20 }
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
        fuerte_weight: 150.25,
        fuerte_crates: 15,
        hass_weight: 170.5,
        hass_crates: 17,
        fruit_varieties: [
          { name: 'Fuerte', weight: 150.25, crates: 15 },
          { name: 'Hass', weight: 170.5, crates: 17 }
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
        fuerte_weight: 150,
        fuerte_crates: 15,
        hass_weight: 130.3,
        hass_crates: 13,
        fruit_varieties: [
          { name: 'Fuerte', weight: 150, crates: 15 },
          { name: 'Hass', weight: 130.3, crates: 13 }
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

  const groupedIntakeRecords = supplierIntakeRecords.reduce((acc, record) => {
    if (!acc[record.supplier_name]) {
      acc[record.supplier_name] = [];
    }
    acc[record.supplier_name].push(record);
    return acc;
  }, {} as Record<string, SupplierIntakeRecord[]>);

  const supplierTotals = Object.entries(groupedIntakeRecords).map(([supplierName, records]) => {
    const totalWeight = records.reduce((sum, record) => sum + record.total_weight, 0);
    const totalFuerteWeight = records.reduce((sum, record) => sum + record.fuerte_weight, 0);
    const totalFuerteCrates = records.reduce((sum, record) => sum + record.fuerte_crates, 0);
    const totalHassWeight = records.reduce((sum, record) => sum + record.hass_weight, 0);
    const totalHassCrates = records.reduce((sum, record) => sum + record.hass_crates, 0);
    const totalDeliveries = records.length;
    const lastDelivery = records[0]?.timestamp || '';
    
    return {
      supplier_name: supplierName,
      total_weight: totalWeight,
      total_fuerte_weight: totalFuerteWeight,
      total_fuerte_crates: totalFuerteCrates,
      total_hass_weight: totalHassWeight,
      total_hass_crates: totalHassCrates,
      total_deliveries: totalDeliveries,
      last_delivery: lastDelivery,
      records: records
    };
  });

  supplierTotals.sort((a, b) => b.total_weight - a.totalWeight);

  const handleSupplierSelect = (supplier: CheckedInSupplier) => {
    if (processedSupplierIds.has(supplier.id)) {
      toast({
        title: "Supplier Already Processed",
        description: `${supplier.driver_name} has already been weighed and moved to intake records`,
        variant: "destructive",
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      supplier_id: supplier.id,
      driver_name: supplier.driver_name,
      driver_phone: supplier.phone_number,
      vehicle_plate: supplier.vehicle_plate,
      driver_id_number: supplier.id_number,
      supplier_name: supplier.company_name,
      region: supplier.region,
    }));
    
    toast({
      title: "Supplier Selected",
      description: `${supplier.driver_name}'s details have been loaded`,
    });
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
      console.log('=== FORM SUBMISSION STARTED ===');
      
      // Debug form data
      console.log('📝 Form Data:', {
        fuerte_weight: formData.fuerte_weight,
        fuerte_crates: formData.fuerte_crates,
        hass_weight: formData.hass_weight,
        hass_crates: formData.hass_crates,
        supplier_name: formData.supplier_name,
        supplier_phone: formData.supplier_phone,
      });
      
      // Basic validation
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

      // Parse values
      const fuerteWeight = parseFloat(formData.fuerte_weight) || 0;
      const fuerteCrates = parseInt(formData.fuerte_crates) || 0;
      const hassWeight = parseFloat(formData.hass_weight) || 0;
      const hassCrates = parseInt(formData.hass_crates) || 0;
      
      const totalWeight = fuerteWeight + hassWeight;
      const totalCrates = fuerteCrates + hassCrates;

      console.log('🧮 Parsed values:', {
        fuerteWeight,
        fuerteCrates,
        hassWeight,
        hassCrates,
        totalWeight,
        totalCrates
      });

      if (totalWeight <= 0) {
        toast({
          title: "Weight Required",
          description: "Please enter weight for at least one variety (Fuerte or Hass)",
          variant: "destructive",
        });
        return;
      }

      if (totalCrates <= 0) {
        toast({
          title: "Crates Required",
          description: "Please enter number of crates for at least one variety",
          variant: "destructive",
        });
        return;
      }

      // Create product description
      const productDesc = [];
      if (fuerteWeight > 0) productDesc.push('Fuerte');
      if (hassWeight > 0) productDesc.push('Hass');

      // Create fruit variety array for API
      const fruitVarieties = [];
      if (fuerteWeight > 0) fruitVarieties.push('Fuerte');
      if (hassWeight > 0) fruitVarieties.push('Hass');

      // Prepare data for API - FIXED VERSION
      const weightData = {
        // Pallet and product info
        pallet_id: formData.pallet_id || generatePalletId(),
        product: productDesc.join(', '),
        unit: 'kg',
        timestamp: new Date().toISOString(),
        
        // Individual fruit weights (as strings for backend parsing)
        fuerte_weight: formData.fuerte_weight || "0",
        fuerte_crates: formData.fuerte_crates || "0",
        hass_weight: formData.hass_weight || "0",
        hass_crates: formData.hass_crates || "0",
        
        // Fruit variety data - ADD THIS!
        fruit_variety: JSON.stringify(fruitVarieties),
        number_of_crates: totalCrates,
        
        // Supplier details
        supplier: formData.supplier_name,
        supplier_name: formData.supplier_name,
        supplier_id: formData.supplier_id,
        supplier_phone: formData.supplier_phone,
        
        // Region
        region: formData.region,
        
        // Driver/vehicle details
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        driver_id_number: formData.driver_id_number,
        vehicle_plate: formData.vehicle_plate,
        truck_id: formData.vehicle_plate,
        driver_id: formData.driver_id_number,
        
        // Weight totals - IMPORTANT: These should be numbers
        weight: totalWeight,
        net_weight: totalWeight,
        gross_weight: totalWeight,
        declared_weight: totalWeight,
        tare_weight: 0,
        rejected_weight: 0,
        
        // Optional fields
        image_url: formData.image_url || '',
        notes: formData.notes || '',
        
        // Per variety weights (optional, but API might expect it)
        perVarietyWeights: JSON.stringify([
          ...(fuerteWeight > 0 ? [{ variety: 'Fuerte', weight: fuerteWeight, crates: fuerteCrates }] : []),
          ...(hassWeight > 0 ? [{ variety: 'Hass', weight: hassWeight, crates: hassCrates }] : [])
        ]),
      };

      console.log('🚀 SENDING TO API ===');
      console.log('📦 Payload:', {
        fuerte_weight: weightData.fuerte_weight,
        hass_weight: weightData.hass_weight,
        fuerte_crates: weightData.fuerte_crates,
        hass_crates: weightData.hass_crates,
        fruit_variety: weightData.fruit_variety,
        weight: weightData.weight,
        net_weight: weightData.net_weight,
      });
      console.log('📄 Full Payload:', JSON.stringify(weightData, null, 2));

      // Call the parent handler
      onAddWeight(weightData);
      
      // Refresh data
      setTimeout(() => {
        fetchSupplierIntakeRecords();
        fetchCheckedInSuppliers();
      }, 1500);
      
      if (onRefreshSuppliers) {
        setTimeout(() => {
          onRefreshSuppliers();
        }, 1000);
      }
      
      // Reset form - keep the pallet_id generation
      const newPalletId = generatePalletId();
      setFormData({
        supplier_id: '',
        driver_name: '',
        driver_phone: '',
        vehicle_plate: '',
        driver_id_number: '',
        supplier_name: '',
        supplier_phone: '',
        region: '',
        fuerte_weight: '',
        fuerte_crates: '',
        hass_weight: '',
        hass_crates: '',
        pallet_id: newPalletId,
        product: '',
        image_url: '',
        notes: '',
      });
      
      onClearSelectedSupplier();
      
      toast({
        title: "Weight Entry Submitted",
        description: `Supplier intake recorded: ${totalWeight.toFixed(1)}kg (Fuerte: ${fuerteWeight.toFixed(1)}kg, Hass: ${hassWeight.toFixed(1)}kg)`,
      });
      
    } catch (error: any) {
      console.error('=== SUBMISSION ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit weight data",
        variant: "destructive",
      });
    }
  };

  const filteredSuppliers = checkedInSuppliers.filter(supplier =>
    (supplier.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate values for display
  const fuerteWeight = parseFloat(formData.fuerte_weight || '0');
  const fuerteCrates = parseInt(formData.fuerte_crates || '0');
  const hassWeight = parseFloat(formData.hass_weight || '0');
  const hassCrates = parseInt(formData.hass_crates || '0');
  const totalWeight = fuerteWeight + hassWeight;
  const totalCrates = fuerteCrates + hassCrates;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingSuppliersCount = checkedInSuppliers.filter(s => s.status === 'pending').length;
  const weighedSuppliersCount = supplierIntakeRecords.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            formData.supplier_id === supplier.id
                              ? 'ring-2 ring-primary/20' 
                              : 'hover:border-primary'
                          } border-blue-200 bg-black-50 hover:bg-black-100`}
                          onClick={() => handleSupplierSelect(supplier)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">{supplier.driver_name}</div>
                                {formData.supplier_id === supplier.id ? (
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
            
            {formData.driver_name && (
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
                      <div className="font-semibold">{formData.driver_name}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Vehicle Plate</div>
                      <div className="font-semibold">{formData.vehicle_plate}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">ID Number</div>
                      <div className="font-mono text-xs">{formData.driver_id_number}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Phone</div>
                      <div>{formData.driver_phone}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        supplier_id: '',
                        driver_name: '',
                        driver_phone: '',
                        vehicle_plate: '',
                        driver_id_number: '',
                      }));
                    }}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear Selection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="intake" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Supplier Intake Records
                </CardTitle>
                <CardDescription>
                  Track weight intake records by supplier with detailed Fuerte and Hass breakdown
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
                                      <Apple className="w-3 h-3 text-green-400" />
                                      Fuerte: {supplier.total_fuerte_weight.toFixed(2)}kg
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Apple className="w-3 h-3 text-purple-400" />
                                      Hass: {supplier.total_hass_weight.toFixed(2)}kg
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Truck className="w-3 h-3" />
                                      {supplier.total_deliveries} delivery{supplier.total_deliveries !== 1 ? 's' : ''}
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
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Fuerte</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Hass</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-400">Total</th>
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
                                            <div className="flex flex-col">
                                              <span className="font-medium text-green-300">{record.fuerte_weight.toFixed(2)} kg</span>
                                              <span className="text-xs text-gray-400">{record.fuerte_crates} crates</span>
                                            </div>
                                          </td>
                                          <td className="py-2 px-3">
                                            <div className="flex flex-col">
                                              <span className="font-medium text-purple-300">{record.hass_weight.toFixed(2)} kg</span>
                                              <span className="text-xs text-gray-400">{record.hass_crates} crates</span>
                                            </div>
                                          </td>
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
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="border border-green-800 rounded p-3 bg-green-900/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <h6 className="font-medium text-green-300 flex items-center gap-2">
                                      <Apple className="w-4 h-4" />
                                      Fuerte Total
                                    </h6>
                                    <span className="font-bold text-green-200">{supplier.total_fuerte_weight.toFixed(2)} kg</span>
                                  </div>
                                  <div className="text-sm text-green-400">
                                    {supplier.total_fuerte_crates} crates across {supplier.total_deliveries} deliveries
                                  </div>
                                  <div className="mt-2 text-xs text-gray-400">
                                    Avg: {(supplier.total_fuerte_weight / supplier.total_deliveries).toFixed(2)} kg per delivery
                                  </div>
                                </div>
                                
                                <div className="border border-purple-800 rounded p-3 bg-purple-900/20">
                                  <div className="flex items-center justify-between mb-2">
                                    <h6 className="font-medium text-purple-300 flex items-center gap-2">
                                      <Apple className="w-4 h-4" />
                                      Hass Total
                                    </h6>
                                    <span className="font-bold text-purple-200">{supplier.total_hass_weight.toFixed(2)} kg</span>
                                  </div>
                                  <div className="text-sm text-purple-400">
                                    {supplier.total_hass_crates} crates across {supplier.total_deliveries} deliveries
                                  </div>
                                  <div className="mt-2 text-xs text-gray-400">
                                    Avg: {(supplier.total_hass_weight / supplier.total_deliveries).toFixed(2)} kg per delivery
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-gray-800">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-400">Total Weight</div>
                                    <div className="font-bold text-xl text-white">{supplier.total_weight.toFixed(2)} kg</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Total Crates</div>
                                    <div className="font-bold text-xl text-white">{supplier.total_fuerte_crates + supplier.total_hass_crates}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Avg per Delivery</div>
                                    <div className="font-bold text-xl text-white">{(supplier.total_weight / supplier.total_deliveries).toFixed(2)} kg</div>
                                  </div>
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
      
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Weight Capture Form
            </CardTitle>
            <CardDescription>
              Enter Fuerte and Hass weights separately
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="supplier">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="supplier">Supplier Details</TabsTrigger>
                  <TabsTrigger value="weight">Weight Information</TabsTrigger>
                </TabsList>
                
                <TabsContent value="supplier" className="space-y-4 pt-4">
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
                
                <TabsContent value="weight" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="pallet_id">Pallet ID (Auto-generated) *</Label>
                    <Input
                      id="pallet_id"
                      value={formData.pallet_id || generatePalletId()}
                      readOnly
                      className="bg-black text-white font-mono font-bold"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2 mb-3">
                        <Apple className="w-4 h-4 text-green-500" />
                        Fuerte Avocado Details
                      </Label>
                      
                      <div className="border rounded-lg p-4 bg-black-50 border-green-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fuerte_weight" className="text-sm">
                              Weight (kg) *
                            </Label>
                            <Input
                              id="fuerte_weight"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.fuerte_weight}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only allow numbers and decimal points
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    fuerte_weight: value 
                                  }));
                                }
                              }}
                              placeholder="0.00"
                              className="h-10"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="fuerte_crates" className="text-sm">
                              Number of Crates *
                            </Label>
                            <Input
                              id="fuerte_crates"
                              type="number"
                              min="0"
                              value={formData.fuerte_crates}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only allow whole numbers
                                if (value === '' || /^\d*$/.test(value)) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    fuerte_crates: value 
                                  }));
                                }
                              }}
                              placeholder="0"
                              className="h-10"
                            />
                          </div>
                        </div>
                        
                        {parseFloat(formData.fuerte_weight || '0') > 0 && (
                          <div className="mt-3 text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              Fuerte: 
                              <span className="font-bold ml-1">
                                {parseFloat(formData.fuerte_weight || '0').toFixed(2)} kg
                              </span> 
                              in 
                              <span className="font-bold ml-1">
                                {parseInt(formData.fuerte_crates || '0')} 
                              </span> 
                              crates
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center gap-2 mb-3">
                        <Apple className="w-4 h-4 text-purple-500" />
                        Hass Avocado Details
                      </Label>
                      
                      <div className="border rounded-lg p-4 bg-black-50 border-purple-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hass_weight" className="text-sm">
                              Weight (kg) *
                            </Label>
                            <Input
                              id="hass_weight"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.hass_weight}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    hass_weight: value 
                                  }));
                                }
                              }}
                              placeholder="0.00"
                              className="h-10"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="hass_crates" className="text-sm">
                              Number of Crates *
                            </Label>
                            <Input
                              id="hass_crates"
                              type="number"
                              min="0"
                              value={formData.hass_crates}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*$/.test(value)) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    hass_crates: value 
                                  }));
                                }
                              }}
                              placeholder="0"
                              className="h-10"
                            />
                          </div>
                        </div>
                        
                        {parseFloat(formData.hass_weight || '0') > 0 && (
                          <div className="mt-3 text-sm text-purple-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              Hass: 
                              <span className="font-bold ml-1">
                                {parseFloat(formData.hass_weight || '0').toFixed(2)} kg
                              </span> 
                              in 
                              <span className="font-bold ml-1">
                                {parseInt(formData.hass_crates || '0')} 
                              </span> 
                              crates
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-blue-700 mb-1">Total Fruit Weight</div>
                          <div className="text-2xl font-bold text-blue-800">
                            {(
                              parseFloat(formData.fuerte_weight || '0') + 
                              parseFloat(formData.hass_weight || '0')
                            ).toFixed(2)} kg
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Fuerte: {parseFloat(formData.fuerte_weight || '0').toFixed(2)}kg + 
                            Hass: {parseFloat(formData.hass_weight || '0').toFixed(2)}kg
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-blue-700 mb-1">Total Crates</div>
                          <div className="text-2xl font-bold text-blue-800">
                            {parseInt(formData.fuerte_crates || '0') + parseInt(formData.hass_crates || '0')}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Fuerte: {parseInt(formData.fuerte_crates || '0')} + 
                            Hass: {parseInt(formData.hass_crates || '0')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Variety Breakdown:</span>
                          <div className="flex gap-4">
                            {parseFloat(formData.fuerte_weight || '0') > 0 && (
                              <span className="text-green-700 font-medium">
                                Fuerte: {(
                                  (parseFloat(formData.fuerte_weight || '0') / 
                                  (parseFloat(formData.fuerte_weight || '0') + parseFloat(formData.hass_weight || '0')) * 100) || 0
                                ).toFixed(1)}%
                              </span>
                            )}
                            {parseFloat(formData.hass_weight || '0') > 0 && (
                              <span className="text-purple-700 font-medium">
                                Hass: {(
                                  (parseFloat(formData.hass_weight || '0') / 
                                  (parseFloat(formData.fuerte_weight || '0') + parseFloat(formData.hass_weight || '0')) * 100) || 0
                                ).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes or comments..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm">
                  {formData.driver_name ? (
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
                        <AlertCircle className="w-4 h-4" />
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
                  disabled={
                    isLoading || 
                    !formData.supplier_name || 
                    !formData.supplier_phone || 
                    !formData.region || 
                    !formData.pallet_id || 
                    (parseFloat(formData.fuerte_weight || '0') <= 0 && parseFloat(formData.hass_weight || '0') <= 0) ||
                    (parseInt(formData.fuerte_crates || '0') <= 0 && parseInt(formData.hass_crates || '0') <= 0)
                  }
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
                <p>* Required fields. Enter weight and crates for Fuerte and/or Hass varieties.</p>
                <p className="mt-1">At least one variety must have weight &gt; 0 and crates &gt; 0</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
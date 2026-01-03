'use client';

import { useState, useEffect } from 'react';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  HardHat, Scale, Package, Truck, ChevronDown, CheckCircle, 
  RefreshCw, Calculator, Box, History, Search, Calendar, Filter, X, 
  BarChart3, Users, PackageOpen, TrendingUp, AlertTriangle, Check,
  Download, FileSpreadsheet, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CountingFormData } from '@/types/counting';
import { format } from 'date-fns';

interface SupplierIntakeRecord {
  id: string;
  pallet_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  total_weight: number;
  fruit_varieties: Array<{
    name: string;
    weight: number;
    crates: number;
  }>;
  region: string;
  timestamp: string;
  status: 'processed' | 'pending' | 'rejected';
}

interface QualityCheck {
  id: string;
  weight_entry_id: string;
  pallet_id: string;
  supplier_name: string;
  overall_status: 'approved' | 'rejected';
  processed_at: string;
  fuerte_class1: number;
  fuerte_class2: number;
  fuerte_overall: number;
  hass_class1: number;
  hass_class2: number;
  hass_overall: number;
}

interface CountingStats {
  total_processed: number;
  pending_coldroom: number;
  total_suppliers: number;
  fuerte_4kg: number;
  fuerte_10kg: number;
  hass_4kg: number;
  hass_10kg: number;
  recent_activity: {
    last_7_days: number;
    last_30_days: number;
  };
}

interface CountingRecord {
  id: string;
  supplier_id: string;
  supplier_name: string;
  pallet_id: string;
  region: string;
  total_weight: number;
  total_counted_weight: number;
  fuerte_4kg_total: number;
  fuerte_10kg_total: number;
  hass_4kg_total: number;
  hass_10kg_total: number;
  counting_data: any;
  totals: any;
  status: string;
  for_coldroom: boolean;
  submitted_at: string;
  processed_by: string;
  notes?: string;
}

interface CSVRow {
  date: string;
  supplier_name: string;
  region: string;
  pallet_id: string;
  driver_name: string;
  vehicle_plate: string;
  intake_weight_kg: number;
  counted_weight_kg: number;
  fuerte_4kg_boxes: number;
  fuerte_10kg_crates: number;
  hass_4kg_boxes: number;
  hass_10kg_crates: number;
  total_boxes: number;
  processed_by: string;
  notes: string;
}

const processingStages = [
  { id: 'intake', name: 'Intake', icon: Truck, description: 'Supplier intake & initial check-in.', tag: 'Pallet ID' },
  { id: 'quality', name: 'Quality Control', icon: Scale, description: 'Quality assessment and packability checks.', tag: 'QC Assessment' },
  { id: 'counting', name: 'Counting', icon: Calculator, description: 'Box counting and size classification.', tag: 'Box Count Form' },
  { id: 'history', name: 'History', icon: History, description: 'Completed processing records.', tag: 'Finalized' },
];

const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = Number(value);
  return isNaN(num) ? '0.'.padEnd(decimals + 2, '0') : num.toFixed(decimals);
};

const safeArray = <T,>(array: T[] | undefined | null): T[] => {
  return Array.isArray(array) ? array : [];
};

const parseCountingTotals = (countingTotals: any): any => {
  if (!countingTotals) return {};
  
  if (typeof countingTotals === 'string') {
    try {
      return JSON.parse(countingTotals);
    } catch (e) {
      console.error('Error parsing counting_totals:', e);
      return {};
    }
  }
  
  if (typeof countingTotals === 'object') {
    return countingTotals;
  }
  
  return {};
};

const getTotalBoxesFromCountingTotals = (countingTotals: any): number => {
  const totals = parseCountingTotals(countingTotals);
  
  const fuerte4kg = totals.fuerte_4kg_total || 0;
  const fuerte10kg = totals.fuerte_10kg_total || 0;
  const hass4kg = totals.hass_4kg_total || 0;
  const hass10kg = totals.hass_10kg_total || 0;
  
  return fuerte4kg + fuerte10kg + hass4kg + hass10kg;
};

const getBoxesSummary = (countingTotals: any): { 
  fuerte_4kg: number; 
  fuerte_10kg: number; 
  hass_4kg: number; 
  hass_10kg: number;
  total: number;
} => {
  const totals = parseCountingTotals(countingTotals);
  
  const fuerte_4kg = totals.fuerte_4kg_total || 0;
  const fuerte_10kg = totals.fuerte_10kg_total || 0;
  const hass_4kg = totals.hass_4kg_total || 0;
  const hass_10kg = totals.hass_10kg_total || 0;
  const total = fuerte_4kg + fuerte_10kg + hass_4kg + hass_10kg;
  
  return { fuerte_4kg, fuerte_10kg, hass_4kg, hass_10kg, total };
};

const getSupplierInfoFromCountingData = (countingData: any) => {
  if (!countingData) return { driver_name: '', vehicle_plate: '' };
  
  if (typeof countingData === 'string') {
    try {
      const parsed = JSON.parse(countingData);
      return {
        driver_name: parsed.driver_name || '',
        vehicle_plate: parsed.vehicle_plate || ''
      };
    } catch (e) {
      return { driver_name: '', vehicle_plate: '' };
    }
  }
  
  return {
    driver_name: countingData.driver_name || '',
    vehicle_plate: countingData.vehicle_plate || ''
  };
};

export default function WarehousePage() {
  const { toast } = useToast();
  const [supplierIntakeRecords, setSupplierIntakeRecords] = useState<SupplierIntakeRecord[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [countingRecords, setCountingRecords] = useState<CountingRecord[]>([]);
  const [stats, setStats] = useState<CountingStats>({
    total_processed: 0,
    pending_coldroom: 0,
    total_suppliers: 0,
    fuerte_4kg: 0,
    fuerte_10kg: 0,
    hass_4kg: 0,
    hass_10kg: 0,
    recent_activity: {
      last_7_days: 0,
      last_30_days: 0,
    },
  });
  const [isLoading, setIsLoading] = useState({ 
    intake: true, 
    quality: true, 
    counting: false,
    stats: false
  });
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [expandedIntake, setExpandedIntake] = useState<Set<string>>(new Set());
  const [expandedQuality, setExpandedQuality] = useState<Set<string>>(new Set());
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierIntakeRecord | null>(null);
  const [selectedQC, setSelectedQC] = useState<QualityCheck | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('quality');
  
  const [countingForm, setCountingForm] = useState<CountingFormData>({
    supplier_id: '',
    supplier_name: '',
    supplier_phone: '',
    region: '',
    fruits: [],
    fuerte_4kg_class1_size12: 0,
    fuerte_4kg_class1_size14: 0,
    fuerte_4kg_class1_size16: 0,
    fuerte_4kg_class1_size18: 0,
    fuerte_4kg_class1_size20: 0,
    fuerte_4kg_class1_size22: 0,
    fuerte_4kg_class1_size24: 0,
    fuerte_4kg_class1_size26: 0,
    fuerte_4kg_class2_size12: 0,
    fuerte_4kg_class2_size14: 0,
    fuerte_4kg_class2_size16: 0,
    fuerte_4kg_class2_size18: 0,
    fuerte_4kg_class2_size20: 0,
    fuerte_4kg_class2_size22: 0,
    fuerte_4kg_class2_size24: 0,
    fuerte_4kg_class2_size26: 0,
    fuerte_10kg_class1_size12: 0,
    fuerte_10kg_class1_size14: 0,
    fuerte_10kg_class1_size16: 0,
    fuerte_10kg_class1_size18: 0,
    fuerte_10kg_class1_size20: 0,
    fuerte_10kg_class1_size22: 0,
    fuerte_10kg_class1_size24: 0,
    fuerte_10kg_class1_size26: 0,
    fuerte_10kg_class1_size28: 0,
    fuerte_10kg_class1_size30: 0,
    fuerte_10kg_class1_size32: 0,
    fuerte_10kg_class2_size12: 0,
    fuerte_10kg_class2_size14: 0,
    fuerte_10kg_class2_size16: 0,
    fuerte_10kg_class2_size18: 0,
    fuerte_10kg_class2_size20: 0,
    fuerte_10kg_class2_size22: 0,
    fuerte_10kg_class2_size24: 0,
    fuerte_10kg_class2_size26: 0,
    fuerte_10kg_class2_size28: 0,
    fuerte_10kg_class2_size30: 0,
    fuerte_10kg_class2_size32: 0,
    hass_4kg_class1_size12: 0,
    hass_4kg_class1_size14: 0,
    hass_4kg_class1_size16: 0,
    hass_4kg_class1_size18: 0,
    hass_4kg_class1_size20: 0,
    hass_4kg_class1_size22: 0,
    hass_4kg_class1_size24: 0,
    hass_4kg_class1_size26: 0,
    hass_4kg_class2_size12: 0,
    hass_4kg_class2_size14: 0,
    hass_4kg_class2_size16: 0,
    hass_4kg_class2_size18: 0,
    hass_4kg_class2_size20: 0,
    hass_4kg_class2_size22: 0,
    hass_4kg_class2_size24: 0,
    hass_4kg_class2_size26: 0,
    hass_10kg_class1_size12: 0,
    hass_10kg_class1_size14: 0,
    hass_10kg_class1_size16: 0,
    hass_10kg_class1_size18: 0,
    hass_10kg_class1_size20: 0,
    hass_10kg_class1_size22: 0,
    hass_10kg_class1_size24: 0,
    hass_10kg_class1_size26: 0,
    hass_10kg_class1_size28: 0,
    hass_10kg_class1_size30: 0,
    hass_10kg_class1_size32: 0,
    hass_10kg_class2_size12: 0,
    hass_10kg_class2_size14: 0,
    hass_10kg_class2_size16: 0,
    hass_10kg_class2_size18: 0,
    hass_10kg_class2_size20: 0,
    hass_10kg_class2_size22: 0,
    hass_10kg_class2_size24: 0,
    hass_10kg_class2_size26: 0,
    hass_10kg_class2_size28: 0,
    hass_10kg_class2_size30: 0,
    hass_10kg_class2_size32: 0,
    notes: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // State for collapsible sections in counting form
  const [expandedFuerteClass2, setExpandedFuerteClass2] = useState(false);
  const [expandedFuerte10kg, setExpandedFuerte10kg] = useState(false);
  const [expandedHassClass2, setExpandedHassClass2] = useState(false);
  const [expandedHass10kg, setExpandedHass10kg] = useState(false);

  const fetchIntakeRecords = async () => {
    try {
      setIsLoading(prev => ({ ...prev, intake: true }));
      const response = await fetch('/api/weights?limit=100&order=desc');
      if (!response.ok) throw new Error('Failed to fetch intake records');
      const weightEntries = await response.json();
      
      const intakeRecords: SupplierIntakeRecord[] = weightEntries.map((entry: any) => ({
        id: entry.id,
        pallet_id: entry.pallet_id || `WE-${entry.id}`,
        supplier_name: entry.supplier || 'Unknown Supplier',
        driver_name: entry.driver_name || '',
        vehicle_plate: entry.vehicle_plate || entry.truck_id || '',
        total_weight: entry.net_weight || entry.weight || 0,
        fruit_varieties: Array.isArray(entry.fruit_variety) ? entry.fruit_variety.map((f: any) => ({
          name: f.name || f.product || 'Unknown',
          weight: f.weight || 0,
          crates: f.crates || 0
        })) : [{
          name: entry.product || 'Unknown',
          weight: 0,
          crates: 0
        }],
        region: entry.region || '',
        timestamp: entry.timestamp || entry.created_at || new Date().toISOString(),
        status: 'processed'
      }));
      
      setSupplierIntakeRecords(intakeRecords);
    } catch (err: any) {
      console.error('Error fetching intake records:', err);
      setError(`Failed to load intake records: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, intake: false }));
    }
  };

  const fetchQualityChecks = async () => {
    try {
      setIsLoading(prev => ({ ...prev, quality: true }));
      const response = await fetch('/api/quality-control');
      if (!response.ok) throw new Error('Failed to fetch quality checks');
      const qualityChecksData = await response.json();
      
      const transformedChecks: QualityCheck[] = qualityChecksData.map((qc: any) => ({
        id: qc.id,
        weight_entry_id: qc.weight_entry_id,
        pallet_id: qc.pallet_id || `WE-${qc.weight_entry_id}`,
        supplier_name: qc.supplier_name || 'Unknown Supplier',
        overall_status: qc.overall_status,
        processed_at: qc.processed_at || new Date().toISOString(),
        fuerte_class1: qc.fuerte_class1 || 0,
        fuerte_class2: qc.fuerte_class2 || 0,
        fuerte_overall: qc.fuerte_overall || 0,
        hass_class1: qc.hass_class1 || 0,
        hass_class2: qc.hass_class2 || 0,
        hass_overall: qc.hass_overall || 0
      }));
      
      setQualityChecks(transformedChecks);
    } catch (err: any) {
      console.error('Error fetching quality checks:', err);
      setError(`Failed to load quality checks: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, quality: false }));
    }
  };

  const fetchCountingRecords = async () => {
    try {
      setIsLoading(prev => ({ ...prev, counting: true }));
      const response = await fetch('/api/counting?action=history');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Process counting records
          const processedRecords = (result.data || []).map((record: any) => {
            let counting_data = record.counting_data;
            if (typeof counting_data === 'string') {
              try {
                counting_data = JSON.parse(counting_data);
              } catch (e) {
                console.error('Error parsing counting_data:', e);
                counting_data = {};
              }
            }
            
            let totals = record.totals;
            if (typeof totals === 'string') {
              try {
                totals = JSON.parse(totals);
              } catch (e) {
                console.error('Error parsing totals:', e);
                totals = {};
              }
            }
            
            return {
              ...record,
              counting_data,
              totals
            };
          });
          
          setCountingRecords(processedRecords);
        }
      }
    } catch (err: any) {
      console.error('Error fetching counting records:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, counting: false }));
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoading(prev => ({ ...prev, stats: true }));
      const response = await fetch('/api/counting?action=stats');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchAllData = async () => {
    setError(null);
    await Promise.all([
      fetchIntakeRecords(),
      fetchQualityChecks(),
      fetchCountingRecords(),
      fetchStats()
    ]);
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleIntakeExpansion = (supplierName: string) => {
    const newExpanded = new Set(expandedIntake);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
    }
    setExpandedIntake(newExpanded);
  };

  const toggleQualityExpansion = (supplierName: string) => {
    const newExpanded = new Set(expandedQuality);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
    }
    setExpandedQuality(newExpanded);
  };

  const toggleHistoryExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedHistory);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedHistory(newExpanded);
  };

  const acceptedSuppliers = supplierIntakeRecords.filter(intake => {
    const qc = qualityChecks.find(q => q.weight_entry_id === intake.id);
    const inCounting = countingRecords.some(record => record.supplier_id === intake.id);
    
    return qc && 
           qc.overall_status === 'approved' && 
           !inCounting;
  });

  const handleSelectSupplier = (supplier: SupplierIntakeRecord, qc: QualityCheck | null) => {
    setSelectedSupplier(supplier);
    setSelectedQC(qc);
    
    setCountingForm(prev => ({
      ...prev,
      supplier_id: supplier.id,
      supplier_name: supplier.supplier_name,
      region: supplier.region,
      fruits: safeArray(supplier.fruit_varieties).map(fv => ({
        name: fv.name,
        weight: fv.weight
      }))
    }));
    
    if (expandedQuality.has(supplier.supplier_name)) {
      const newExpanded = new Set(expandedQuality);
      newExpanded.delete(supplier.supplier_name);
      setExpandedQuality(newExpanded);
    }
    
    setActiveTab('counting');
    
    toast({
      title: "Supplier Selected",
      description: `${supplier.supplier_name} loaded for counting`,
    });
  };

  const handleInputChange = (field: keyof CountingFormData, value: string | number) => {
    setCountingForm(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const calculateSubtotal = (prefix: string, classType: 'class1' | 'class2', boxType: '4kg' | '10kg'): number => {
    const sizes = boxType === '4kg' 
      ? ['size12', 'size14', 'size16', 'size18', 'size20', 'size22', 'size24', 'size26']
      : ['size12', 'size14', 'size16', 'size18', 'size20', 'size22', 'size24', 'size26', 'size28', 'size30', 'size32'];
    
    return sizes.reduce((total, size) => {
      const fieldName = `${prefix}_${boxType}_${classType}_${size}` as keyof CountingFormData;
      return total + (Number(countingForm[fieldName]) || 0);
    }, 0);
  };

  const calculateTotalBoxes = (prefix: string, boxType: '4kg' | '10kg'): number => {
    const class1 = calculateSubtotal(prefix, 'class1', boxType);
    const class2 = calculateSubtotal(prefix, 'class2', boxType);
    return class1 + class2;
  };

  const handleSubmitCountingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplier) {
      toast({
        title: "No Supplier Selected",
        description: "Please select a supplier first",
        variant: "destructive",
      });
      return;
    }

    try {
      const totals = {
        fuerte_4kg_class1: calculateSubtotal('fuerte', 'class1', '4kg'),
        fuerte_4kg_class2: calculateSubtotal('fuerte', 'class2', '4kg'),
        fuerte_4kg_total: calculateTotalBoxes('fuerte', '4kg'),
        
        fuerte_10kg_class1: calculateSubtotal('fuerte', 'class1', '10kg'),
        fuerte_10kg_class2: calculateSubtotal('fuerte', 'class2', '10kg'),
        fuerte_10kg_total: calculateTotalBoxes('fuerte', '10kg'),
        
        hass_4kg_class1: calculateSubtotal('hass', 'class1', '4kg'),
        hass_4kg_class2: calculateSubtotal('hass', 'class2', '4kg'),
        hass_4kg_total: calculateTotalBoxes('hass', '4kg'),
        
        hass_10kg_class1: calculateSubtotal('hass', 'class1', '10kg'),
        hass_10kg_class2: calculateSubtotal('hass', 'class2', '10kg'),
        hass_10kg_total: calculateTotalBoxes('hass', '10kg'),
      };

      const calculateTotalWeight = () => {
        const fuerte4kgWeight = totals.fuerte_4kg_total * 4;
        const fuerte10kgWeight = totals.fuerte_10kg_total * 10;
        const hass4kgWeight = totals.hass_4kg_total * 4;
        const hass10kgWeight = totals.hass_10kg_total * 10;
        return fuerte4kgWeight + fuerte10kgWeight + hass4kgWeight + hass10kgWeight;
      };

      const countingData = {
        supplier_id: selectedSupplier.id,
        supplier_name: selectedSupplier.supplier_name,
        supplier_phone: countingForm.supplier_phone,
        region: selectedSupplier.region,
        pallet_id: selectedSupplier.pallet_id,
        total_weight: selectedSupplier.total_weight,
        counting_data: { ...countingForm },
        submitted_at: new Date().toISOString(),
        processed_by: "Warehouse Staff",
        totals,
        total_counted_weight: calculateTotalWeight(),
        status: 'pending_coldroom',
        for_coldroom: true,
      };

      console.log('📦 Saving counting data directly to history:', countingData);

      const response = await fetch('/api/counting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(countingData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save counting data');
      }

      const countingRecordId = result.data.id;
      
      localStorage.setItem('recentCountingData', JSON.stringify({
        id: countingRecordId,
        supplier_name: selectedSupplier.supplier_name,
        totals,
        counting_data: countingForm,
        timestamp: new Date().toISOString()
      }));
      
      localStorage.setItem('refreshColdRoom', 'true');
      console.log('✅ Set refreshColdRoom flag for cold room');

      setCountingRecords(prev => [result.data, ...prev]);
      
      setSelectedSupplier(null);
      setSelectedQC(null);
      
      // Reset counting form
      const resetForm: CountingFormData = {
        supplier_id: '',
        supplier_name: '',
        supplier_phone: '',
        region: '',
        fruits: [],
        fuerte_4kg_class1_size12: 0,
        fuerte_4kg_class1_size14: 0,
        fuerte_4kg_class1_size16: 0,
        fuerte_4kg_class1_size18: 0,
        fuerte_4kg_class1_size20: 0,
        fuerte_4kg_class1_size22: 0,
        fuerte_4kg_class1_size24: 0,
        fuerte_4kg_class1_size26: 0,
        fuerte_4kg_class2_size12: 0,
        fuerte_4kg_class2_size14: 0,
        fuerte_4kg_class2_size16: 0,
        fuerte_4kg_class2_size18: 0,
        fuerte_4kg_class2_size20: 0,
        fuerte_4kg_class2_size22: 0,
        fuerte_4kg_class2_size24: 0,
        fuerte_4kg_class2_size26: 0,
        fuerte_10kg_class1_size12: 0,
        fuerte_10kg_class1_size14: 0,
        fuerte_10kg_class1_size16: 0,
        fuerte_10kg_class1_size18: 0,
        fuerte_10kg_class1_size20: 0,
        fuerte_10kg_class1_size22: 0,
        fuerte_10kg_class1_size24: 0,
        fuerte_10kg_class1_size26: 0,
        fuerte_10kg_class1_size28: 0,
        fuerte_10kg_class1_size30: 0,
        fuerte_10kg_class1_size32: 0,
        fuerte_10kg_class2_size12: 0,
        fuerte_10kg_class2_size14: 0,
        fuerte_10kg_class2_size16: 0,
        fuerte_10kg_class2_size18: 0,
        fuerte_10kg_class2_size20: 0,
        fuerte_10kg_class2_size22: 0,
        fuerte_10kg_class2_size24: 0,
        fuerte_10kg_class2_size26: 0,
        fuerte_10kg_class2_size28: 0,
        fuerte_10kg_class2_size30: 0,
        fuerte_10kg_class2_size32: 0,
        hass_4kg_class1_size12: 0,
        hass_4kg_class1_size14: 0,
        hass_4kg_class1_size16: 0,
        hass_4kg_class1_size18: 0,
        hass_4kg_class1_size20: 0,
        hass_4kg_class1_size22: 0,
        hass_4kg_class1_size24: 0,
        hass_4kg_class1_size26: 0,
        hass_4kg_class2_size12: 0,
        hass_4kg_class2_size14: 0,
        hass_4kg_class2_size16: 0,
        hass_4kg_class2_size18: 0,
        hass_4kg_class2_size20: 0,
        hass_4kg_class2_size22: 0,
        hass_4kg_class2_size24: 0,
        hass_4kg_class2_size26: 0,
        hass_10kg_class1_size12: 0,
        hass_10kg_class1_size14: 0,
        hass_10kg_class1_size16: 0,
        hass_10kg_class1_size18: 0,
        hass_10kg_class1_size20: 0,
        hass_10kg_class1_size22: 0,
        hass_10kg_class1_size24: 0,
        hass_10kg_class1_size26: 0,
        hass_10kg_class1_size28: 0,
        hass_10kg_class1_size30: 0,
        hass_10kg_class1_size32: 0,
        hass_10kg_class2_size12: 0,
        hass_10kg_class2_size14: 0,
        hass_10kg_class2_size16: 0,
        hass_10kg_class2_size18: 0,
        hass_10kg_class2_size20: 0,
        hass_10kg_class2_size22: 0,
        hass_10kg_class2_size24: 0,
        hass_10kg_class2_size26: 0,
        hass_10kg_class2_size28: 0,
        hass_10kg_class2_size30: 0,
        hass_10kg_class2_size32: 0,
        notes: '',
      };
      
      // Reset collapsible sections
      setExpandedFuerteClass2(false);
      setExpandedFuerte10kg(false);
      setExpandedHassClass2(false);
      setExpandedHass10kg(false);
      
      setCountingForm(resetForm);
      
      fetchStats();
      setActiveTab('history');
      
      toast({
        title: "✅ Counting Data Saved Successfully!",
        description: (
          <div className="space-y-3">
            <p>{selectedSupplier.supplier_name} has been counted and is ready for cold room.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={() => {
                  window.open('/cold-room', '_blank');
                  localStorage.setItem('forceColdRoomRefresh', 'true');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                📦 Go to Cold Room
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({
                    id: countingRecordId,
                    supplier: selectedSupplier.supplier_name,
                    totals
                  }, null, 2));
                  toast({
                    title: "Copied!",
                    description: "Counting data copied to clipboard",
                  });
                }}
                className="bg-gray-600 hover:bg-gray-700"
              >
                📋 Copy Data
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Data ID: {countingRecordId?.substring(0, 8)}...
            </p>
          </div>
        ),
        duration: 10000,
      });
      
    } catch (err: any) {
      console.error('Error saving counting data:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to save counting data",
        variant: "destructive",
      });
    }
  };

  const filteredHistory = countingRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.pallet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = new Date(record.submitted_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    let matchesDate = true;
    if (start) {
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && recordDate >= start;
    }
    if (end) {
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && recordDate <= end;
    }
    
    return matchesSearch && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const clearSearchFilter = () => {
    setSearchTerm('');
  };

  const generateCSVData = (records: CountingRecord[]): CSVRow[] => {
    return records.map(record => {
      const boxesSummary = getBoxesSummary(record.totals);
      const supplierInfo = getSupplierInfoFromCountingData(record.counting_data);
      
      return {
        date: format(new Date(record.submitted_at), 'yyyy-MM-dd HH:mm:ss'),
        supplier_name: record.supplier_name,
        region: record.region,
        pallet_id: record.pallet_id,
        driver_name: supplierInfo.driver_name,
        vehicle_plate: supplierInfo.vehicle_plate,
        intake_weight_kg: record.total_weight,
        counted_weight_kg: record.total_counted_weight || 0,
        fuerte_4kg_boxes: boxesSummary.fuerte_4kg,
        fuerte_10kg_crates: boxesSummary.fuerte_10kg,
        hass_4kg_boxes: boxesSummary.hass_4kg,
        hass_10kg_crates: boxesSummary.hass_10kg,
        total_boxes: boxesSummary.total,
        processed_by: record.processed_by,
        notes: record.notes || ''
      };
    });
  };

  const downloadCSV = (records: CountingRecord[]) => {
    if (records.length === 0) {
      toast({
        title: 'No Data',
        description: 'No records available to download',
        variant: 'destructive',
      });
      return;
    }
    
    const csvData = generateCSVData(records);
    
    const headers = [
      'Date',
      'Supplier Name',
      'Region',
      'Pallet ID',
      'Driver Name',
      'Vehicle Plate',
      'Intake Weight (kg)',
      'Counted Weight (kg)',
      'Fuerte 4kg Boxes',
      'Fuerte 10kg Crates',
      'Hass 4kg Boxes',
      'Hass 10kg Crates',
      'Total Boxes',
      'Processed By',
      'Notes'
    ];
    
    const rows = csvData.map(row => [
      row.date,
      `"${row.supplier_name}"`,
      `"${row.region}"`,
      row.pallet_id,
      `"${row.driver_name}"`,
      `"${row.vehicle_plate}"`,
      row.intake_weight_kg.toFixed(2),
      row.counted_weight_kg.toFixed(2),
      row.fuerte_4kg_boxes,
      row.fuerte_10kg_crates,
      row.hass_4kg_boxes,
      row.hass_10kg_crates,
      row.total_boxes,
      `"${row.processed_by}"`,
      `"${row.notes.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'CSV Downloaded',
      description: `${records.length} records exported successfully`,
    });
  };

  const downloadAllHistory = () => {
    downloadCSV(countingRecords);
  };

  const downloadFilteredHistory = () => {
    downloadCSV(filteredHistory);
  };

  // UPDATED: Render size grid with better layout
  const renderSizeGrid = (prefix: string, boxType: '4kg' | '10kg', classType: 'class1' | 'class2') => {
    const sizes = boxType === '4kg' 
      ? ['12', '14', '16', '18', '20', '22', '24', '26']
      : ['12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32'];
    
    return (
      <div className="grid grid-cols-8 gap-2 mb-4">
        {sizes.map(size => {
          const fieldName = `${prefix}_${boxType}_${classType}_size${size}` as keyof CountingFormData;
          return (
            <div key={size} className="space-y-1">
              <Label htmlFor={fieldName} className="text-xs text-center block">Size {size}</Label>
              <Input
                id={fieldName}
                type="number"
                min="0"
                value={countingForm[fieldName]}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                className="h-8 text-center"
                placeholder="0"
              />
            </div>
          );
        })}
      </div>
    );
  };

  // UPDATED: Render collapsible section for counting form
  const renderCollapsibleSection = (
    title: string,
    isExpanded: boolean,
    onToggle: () => void,
    children: React.ReactNode,
    subtitle?: string
  ) => (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggle}
      className="border rounded-lg overflow-hidden mb-4"
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold">{title}</div>
              {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
            </div>
          </div>
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            {isExpanded ? 'Hide' : 'Show'}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 bg-black border-t">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

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
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading data</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={fetchAllData}
                    className="text-sm underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-sm hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <HardHat />
                Warehouse Processing Dashboard
              </h2>
              <p className="text-muted-foreground">
                Supplier intake, quality control, and box counting
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <div className="text-sm text-muted-foreground">
                  Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <button
                onClick={fetchAllData}
                disabled={isLoading.intake || isLoading.quality || isLoading.counting}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading.intake || isLoading.quality || isLoading.counting ? 'animate-spin' : ''}`} />
                {isLoading.intake || isLoading.quality || isLoading.counting ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Processing Statistics
              </CardTitle>
              <CardDescription>
                Real-time overview of warehouse processing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Total Processed</div>
                    <PackageOpen className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {stats.total_processed || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Completed counting sessions</div>
                </div>

                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Pending Coldroom</div>
                    <Package className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold text-orange-700">
                    {stats.pending_coldroom || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Ready for cold room loading</div>
                </div>

                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Fuerte Boxes</div>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">4kg:</span>
                      <span className="font-semibold text-green-700">
                        {stats.fuerte_4kg || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">10kg:</span>
                      <span className="font-semibold text-green-700">
                        {stats.fuerte_10kg || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="font-bold text-green-700">
                        {(stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-black-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Hass Boxes</div>
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">4kg:</span>
                      <span className="font-semibold text-purple-700">
                        {stats.hass_4kg || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">10kg:</span>
                      <span className="font-semibold text-purple-700">
                        {stats.hass_10kg || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="font-bold text-purple-700">
                        {(stats.hass_4kg || 0) + (stats.hass_10kg || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Total Boxes</div>
                    <div className="text-xl font-bold">
                      {(stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0) + (stats.hass_4kg || 0) + (stats.hass_10kg || 0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Fuerte Percentage</div>
                    <div className="text-xl font-bold">
                      {(() => {
                        const totalBoxes = (stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0) + (stats.hass_4kg || 0) + (stats.hass_10kg || 0);
                        const fuerteTotal = (stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0);
                        return totalBoxes > 0 ? `${Math.round((fuerteTotal / totalBoxes) * 100)}%` : '0%';
                      })()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Hass Percentage</div>
                    <div className="text-xl font-bold">
                      {(() => {
                        const totalBoxes = (stats.fuerte_4kg || 0) + (stats.fuerte_10kg || 0) + (stats.hass_4kg || 0) + (stats.hass_10kg || 0);
                        const hassTotal = (stats.hass_4kg || 0) + (stats.hass_10kg || 0);
                        return totalBoxes > 0 ? `${Math.round((hassTotal / totalBoxes) * 100)}%` : '0%';
                      })()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Recent Activity</div>
                    <div className="text-xl font-bold">{stats.recent_activity?.last_7_days || 0} (7 days)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Stages</CardTitle>
              <CardDescription>Supplier processing workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 text-center">
                {processingStages.map((stage, index) => (
                  <div key={stage.id} className="flex-1 flex flex-col items-center p-4">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                      <stage.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold">{stage.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded-md mt-2">{stage.tag}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="intake">Intake</TabsTrigger>
              <TabsTrigger value="quality">Quality Control</TabsTrigger>
              <TabsTrigger value="counting">Counting</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="intake" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Completed Intake Records
                  </CardTitle>
                  <CardDescription>
                    {supplierIntakeRecords.length} supplier(s) with completed intake
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {isLoading.intake ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading intake records...</p>
                      </div>
                    ) : supplierIntakeRecords.length === 0 ? (
                      <div className="text-center py-8">
                        <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No intake records found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Supplier intake records will appear here after weighing
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {supplierIntakeRecords.map((supplier) => (
                          <Collapsible
                            key={supplier.id}
                            open={expandedIntake.has(supplier.supplier_name)}
                            onOpenChange={() => toggleIntakeExpansion(supplier.supplier_name)}
                            className="border rounded-lg overflow-hidden"
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className={`transition-transform ${expandedIntake.has(supplier.supplier_name) ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-semibold">{supplier.supplier_name}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-4">
                                      <span>Pallet: {supplier.pallet_id}</span>
                                      <span>Weight: {supplier.total_weight} kg</span>
                                      <span>{formatDate(supplier.timestamp)}</span>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Intake Complete
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-4 bg-black border-t">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500">Driver</div>
                                  <div className="font-medium">{supplier.driver_name}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Vehicle Plate</div>
                                  <div className="font-medium">{supplier.vehicle_plate}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Region</div>
                                  <div className="font-medium">{supplier.region}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Total Weight</div>
                                  <div className="font-bold">{supplier.total_weight} kg</div>
                                </div>
                              </div>
                              {safeArray(supplier.fruit_varieties).length > 0 && (
                                <div className="mt-3">
                                  <div className="text-gray-500 mb-1">Fruit Varieties</div>
                                  <div className="flex flex-wrap gap-2">
                                    {safeArray(supplier.fruit_varieties).map((fruit, idx) => (
                                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {fruit.name}: {fruit.weight}kg ({fruit.crates} crates)
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Accepted Suppliers (QC Approved)
                  </CardTitle>
                  <CardDescription>
                    {acceptedSuppliers.length} supplier(s) approved for counting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {isLoading.quality ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading quality checks...</p>
                      </div>
                    ) : acceptedSuppliers.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No accepted suppliers pending counting</p>
                        <p className="text-sm text-gray-400 mt-1">
                          All QC-approved suppliers have been counted. Check the History tab.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {acceptedSuppliers.map((supplier) => {
                          const qc = qualityChecks.find(q => q.weight_entry_id === supplier.id);
                          return (
                            <Collapsible
                              key={supplier.id}
                              open={expandedQuality.has(supplier.supplier_name)}
                              onOpenChange={() => toggleQualityExpansion(supplier.supplier_name)}
                              className="border rounded-lg overflow-hidden"
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`transition-transform ${expandedQuality.has(supplier.supplier_name) ? 'rotate-180' : ''}`}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold">{supplier.supplier_name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-4">
                                        <span>Pallet: {supplier.pallet_id}</span>
                                        <span>QC Date: {qc ? formatDate(qc.processed_at) : 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectSupplier(supplier, qc || null);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Select for Counting
                                    </Button>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      QC Approved
                                    </Badge>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-4 bg-black border-t">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-500">Total Weight</div>
                                    <div className="font-bold">{supplier.total_weight} kg</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Region</div>
                                    <div className="font-medium">{supplier.region}</div>
                                  </div>
                                </div>
                                {qc && (qc.fuerte_overall > 0 || qc.hass_overall > 0) && (
                                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {qc.fuerte_overall > 0 && (
                                      <div className="bg-gray-50 p-3 rounded border">
                                        <div className="font-medium">Avocado Fuerte</div>
                                        <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                                          <div>
                                            <div className="text-gray-500">Class 1</div>
                                            <div className="font-semibold">{qc.fuerte_class1}%</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Class 2</div>
                                            <div className="font-semibold">{qc.fuerte_class2}%</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Overall</div>
                                            <div className="font-bold text-green-600">{qc.fuerte_overall}%</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {qc.hass_overall > 0 && (
                                      <div className="bg-gray-50 p-3 rounded border">
                                        <div className="font-medium">Avocado Hass</div>
                                        <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                                          <div>
                                            <div className="text-gray-500">Class 1</div>
                                            <div className="font-semibold">{qc.hass_class1}%</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Class 2</div>
                                            <div className="font-semibold">{qc.hass_class2}%</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">Overall</div>
                                            <div className="font-bold text-green-600">{qc.hass_overall}%</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {safeArray(supplier.fruit_varieties).length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-gray-500 mb-1">Fruit Varieties</div>
                                    <div className="flex flex-wrap gap-2">
                                      {safeArray(supplier.fruit_varieties).map((fruit, idx) => (
                                        <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {fruit.name}: {fruit.weight}kg
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* UPDATED: Counting Tab with Collapsible Sections */}
            <TabsContent value="counting" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Selected Supplier Information
                    </CardTitle>
                    <CardDescription>
                      {selectedSupplier ? `${selectedSupplier.supplier_name} - Ready for counting` : 'No supplier selected'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSupplier ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Supplier Name</div>
                            <div className="font-semibold">{selectedSupplier.supplier_name}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Region</div>
                            <div className="font-medium">{selectedSupplier.region}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Pallet ID</div>
                            <div className="font-mono">{selectedSupplier.pallet_id}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Total Weight</div>
                            <div className="font-bold">{selectedSupplier.total_weight} kg</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500 mb-2">Fruit Varieties</div>
                          <div className="flex flex-wrap gap-2">
                            {safeArray(selectedSupplier.fruit_varieties).map((fruit, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {fruit.name}: {fruit.weight}kg
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {selectedQC && (
                          <div>
                            <div className="text-sm text-gray-500 mb-2">QC Results</div>
                            <div className="flex gap-3">
                              {selectedQC.fuerte_overall > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Fuerte: {selectedQC.fuerte_overall}%
                                </Badge>
                              )}
                              {selectedQC.hass_overall > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Hass: {selectedQC.hass_overall}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t">
                          <Label htmlFor="supplier_phone" className="mb-2">Supplier Phone Number</Label>
                          <Input
                            id="supplier_phone"
                            value={countingForm.supplier_phone}
                            onChange={(e) => handleInputChange('supplier_phone', e.target.value)}
                            placeholder="Enter supplier phone number"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calculator className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No supplier selected</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Select a QC-approved supplier from the Quality Control tab to begin counting
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-5 h-5" />
                      Box Counting Form
                    </CardTitle>
                    <CardDescription>
                      Enter number of boxes per size and class. Class 1 (4kg) is default.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitCountingForm} className="space-y-6">
                      <ScrollArea className="h-[500px] pr-4">
                        {/* Fuerte Section */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-lg mb-4 text-green-700 border-b pb-2">Fuerte Avocado</h3>
                          
                          {/* Fuerte 4kg Class 1 - DEFAULT VISIBLE */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-green-600">4kg Boxes - Class 1</h4>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Default
                              </Badge>
                            </div>
                            {renderSizeGrid('fuerte', '4kg', 'class1')}
                            <div className="text-right text-sm mt-2">
                              <span className="font-medium">Sub-Total: </span>
                              <span className="font-bold text-green-700">{calculateSubtotal('fuerte', 'class1', '4kg')} boxes</span>
                            </div>
                          </div>

                          {/* Fuerte 4kg Class 2 - COLLAPSIBLE */}
                          {renderCollapsibleSection(
                            "Fuerte 4kg Boxes - Class 2",
                            expandedFuerteClass2,
                            () => setExpandedFuerteClass2(!expandedFuerteClass2),
                            <>
                              {renderSizeGrid('fuerte', '4kg', 'class2')}
                              <div className="text-right text-sm mt-2">
                                <span className="font-medium">Sub-Total: </span>
                                <span className="font-bold text-green-700">{calculateSubtotal('fuerte', 'class2', '4kg')} boxes</span>
                              </div>
                            </>,
                            "Secondary quality boxes"
                          )}

                          {/* Fuerte 10kg - COLLAPSIBLE */}
                          {renderCollapsibleSection(
                            "Fuerte 10kg Crates",
                            expandedFuerte10kg,
                            () => setExpandedFuerte10kg(!expandedFuerte10kg),
                            <>
                              {/* Fuerte 10kg Class 1 */}
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Class 1</h5>
                                {renderSizeGrid('fuerte', '10kg', 'class1')}
                                <div className="text-right text-sm mt-2">
                                  <span className="font-medium">Sub-Total: </span>
                                  <span className="font-bold text-green-700">{calculateSubtotal('fuerte', 'class1', '10kg')} crates</span>
                                </div>
                              </div>
                              
                              {/* Fuerte 10kg Class 2 */}
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Class 2</h5>
                                {renderSizeGrid('fuerte', '10kg', 'class2')}
                                <div className="text-right text-sm mt-2">
                                  <span className="font-medium">Sub-Total: </span>
                                  <span className="font-bold text-green-700">{calculateSubtotal('fuerte', 'class2', '10kg')} crates</span>
                                </div>
                              </div>
                            </>,
                            "Large crates (Class 1 & Class 2)"
                          )}

                          {/* Fuerte Total Summary */}
                          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-green-800">Fuerte Total 4kg:</span>
                              <span className="font-bold text-lg text-green-900">{calculateTotalBoxes('fuerte', '4kg')} boxes</span>
                            </div>
                            {calculateTotalBoxes('fuerte', '10kg') > 0 && (
                              <div className="flex justify-between items-center mt-2">
                                <span className="font-semibold text-green-800">Fuerte Total 10kg:</span>
                                <span className="font-bold text-lg text-green-900">{calculateTotalBoxes('fuerte', '10kg')} crates</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-300">
                              <span className="font-bold text-green-900">Fuerte Total All:</span>
                              <span className="font-bold text-xl text-green-900">
                                {calculateTotalBoxes('fuerte', '4kg') + calculateTotalBoxes('fuerte', '10kg')} boxes/crates
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hass Section */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-lg mb-4 text-purple-700 border-b pb-2">Hass Avocado</h3>
                          
                          {/* Hass 4kg Class 1 - DEFAULT VISIBLE */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-purple-600">4kg Boxes - Class 1</h4>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                Default
                              </Badge>
                            </div>
                            {renderSizeGrid('hass', '4kg', 'class1')}
                            <div className="text-right text-sm mt-2">
                              <span className="font-medium">Sub-Total: </span>
                              <span className="font-bold text-purple-700">{calculateSubtotal('hass', 'class1', '4kg')} boxes</span>
                            </div>
                          </div>

                          {/* Hass 4kg Class 2 - COLLAPSIBLE */}
                          {renderCollapsibleSection(
                            "Hass 4kg Boxes - Class 2",
                            expandedHassClass2,
                            () => setExpandedHassClass2(!expandedHassClass2),
                            <>
                              {renderSizeGrid('hass', '4kg', 'class2')}
                              <div className="text-right text-sm mt-2">
                                <span className="font-medium">Sub-Total: </span>
                                <span className="font-bold text-purple-700">{calculateSubtotal('hass', 'class2', '4kg')} boxes</span>
                              </div>
                            </>,
                            "Secondary quality boxes"
                          )}

                          {/* Hass 10kg - COLLAPSIBLE */}
                          {renderCollapsibleSection(
                            "Hass 10kg Crates",
                            expandedHass10kg,
                            () => setExpandedHass10kg(!expandedHass10kg),
                            <>
                              {/* Hass 10kg Class 1 */}
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Class 1</h5>
                                {renderSizeGrid('hass', '10kg', 'class1')}
                                <div className="text-right text-sm mt-2">
                                  <span className="font-medium">Sub-Total: </span>
                                  <span className="font-bold text-purple-700">{calculateSubtotal('hass', 'class1', '10kg')} crates</span>
                                </div>
                              </div>
                              
                              {/* Hass 10kg Class 2 */}
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">Class 2</h5>
                                {renderSizeGrid('hass', '10kg', 'class2')}
                                <div className="text-right text-sm mt-2">
                                  <span className="font-medium">Sub-Total: </span>
                                  <span className="font-bold text-purple-700">{calculateSubtotal('hass', 'class2', '10kg')} crates</span>
                                </div>
                              </div>
                            </>,
                            "Large crates (Class 1 & Class 2)"
                          )}

                          {/* Hass Total Summary */}
                          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-purple-800">Hass Total 4kg:</span>
                              <span className="font-bold text-lg text-purple-900">{calculateTotalBoxes('hass', '4kg')} boxes</span>
                            </div>
                            {calculateTotalBoxes('hass', '10kg') > 0 && (
                              <div className="flex justify-between items-center mt-2">
                                <span className="font-semibold text-purple-800">Hass Total 10kg:</span>
                                <span className="font-bold text-lg text-purple-900">{calculateTotalBoxes('hass', '10kg')} crates</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-300">
                              <span className="font-bold text-purple-900">Hass Total All:</span>
                              <span className="font-bold text-xl text-purple-900">
                                {calculateTotalBoxes('hass', '4kg') + calculateTotalBoxes('hass', '10kg')} boxes/crates
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Overall Summary */}
                        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-3">Overall Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-blue-600">Fuerte Total Boxes:</div>
                              <div className="font-bold text-blue-800">
                                {calculateTotalBoxes('fuerte', '4kg') + calculateTotalBoxes('fuerte', '10kg')}
                              </div>
                            </div>
                            <div>
                              <div className="text-purple-600">Hass Total Boxes:</div>
                              <div className="font-bold text-purple-800">
                                {calculateTotalBoxes('hass', '4kg') + calculateTotalBoxes('hass', '10kg')}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-300">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-900">Total All Boxes/Crates:</span>
                              <span className="font-bold text-2xl text-blue-900">
                                {calculateTotalBoxes('fuerte', '4kg') + calculateTotalBoxes('fuerte', '10kg') + 
                                 calculateTotalBoxes('hass', '4kg') + calculateTotalBoxes('hass', '10kg')}
                              </span>
                            </div>
                            <div className="text-right text-xs text-blue-600 mt-1">
                              Estimated Weight: {(calculateTotalBoxes('fuerte', '4kg') + calculateTotalBoxes('hass', '4kg')) * 4 + 
                                              (calculateTotalBoxes('fuerte', '10kg') + calculateTotalBoxes('hass', '10kg')) * 10} kg
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-6">
                          <Label htmlFor="notes" className="mb-2">Notes</Label>
                          <Input
                            id="notes"
                            value={countingForm.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Additional notes (optional)"
                          />
                        </div>
                      </ScrollArea>

                      <div className="pt-4 border-t">
                        <Button
                          type="submit"
                          disabled={!selectedSupplier}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Counting Data to History
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Counting History & Export
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadFilteredHistory}
                        disabled={filteredHistory.length === 0 || isLoading.counting}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Filtered
                      </Button>
                      <Button
                        onClick={downloadAllHistory}
                        disabled={countingRecords.length === 0 || isLoading.counting}
                        variant="outline"
                        className="gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export All
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {filteredHistory.length} completed counting record(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="search-history">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="search-history"
                            placeholder="Search by supplier, pallet ID, or region..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                          {searchTerm && (
                            <button
                              onClick={clearSearchFilter}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {filteredHistory.length} of {countingRecords.length} records
                        {(startDate || endDate) && ' • Date filter applied'}
                        {searchTerm && ' • Search filter applied'}
                      </div>
                      <div className="flex gap-2">
                        {(startDate || endDate) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearDateFilter}
                          >
                            <Filter className="w-4 h-4 mr-2" />
                            Clear Dates
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchAllData}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[500px] pr-4">
                    {isLoading.counting ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading history...</p>
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No counting history found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchTerm || startDate || endDate ? 'Try adjusting your filters' : 'Completed counting records will appear here'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredHistory.map((record) => {
                          const boxesSummary = getBoxesSummary(record.totals);
                          const supplierInfo = getSupplierInfoFromCountingData(record.counting_data);
                          return (
                            <Collapsible
                              key={record.id}
                              open={expandedHistory.has(record.id)}
                              onOpenChange={() => toggleHistoryExpansion(record.id)}
                              className="border rounded-lg overflow-hidden"
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center justify-between p-4 bg-black-50 hover:bg-black-100 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`transition-transform ${expandedHistory.has(record.id) ? 'rotate-180' : ''}`}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold">{record.supplier_name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-4">
                                        <span>Pallet: {record.pallet_id}</span>
                                        <span>Boxes: {boxesSummary.total} boxes</span>
                                        <span>Weight: {safeToFixed(record.total_counted_weight)} kg</span>
                                        <span>{formatDate(record.submitted_at)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={
                                      record.for_coldroom && record.status === 'pending_coldroom' 
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : record.status === 'completed'
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                    }>
                                      {record.for_coldroom && record.status === 'pending_coldroom' 
                                        ? 'Ready for Cold Room'
                                        : record.status === 'completed'
                                        ? 'Loaded to Cold Room'
                                        : 'Pending'}
                                    </Badge>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-4 bg-black border-t">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <div className="text-gray-500">Supplier</div>
                                      <div className="font-semibold">{record.supplier_name}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Pallet ID</div>
                                      <div className="font-medium">{record.pallet_id}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Region</div>
                                      <div className="font-medium">{record.region}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Processed By</div>
                                      <div className="font-medium">{record.processed_by}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Driver</div>
                                      <div className="font-medium">{supplierInfo.driver_name || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Vehicle Plate</div>
                                      <div className="font-medium">{supplierInfo.vehicle_plate || 'N/A'}</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Intake Weight</div>
                                      <div className="font-bold text-lg">{record.total_weight} kg</div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Counted Weight</div>
                                      <div className="font-bold text-lg">{safeToFixed(record.total_counted_weight)} kg</div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Status</div>
                                      <div className={`font-bold text-lg ${
                                        record.for_coldroom && record.status === 'pending_coldroom' 
                                          ? 'text-green-700'
                                          : record.status === 'completed'
                                          ? 'text-blue-700'
                                          : 'text-gray-700'
                                      }`}>
                                        {record.for_coldroom && record.status === 'pending_coldroom' 
                                          ? 'Ready for Cold Room'
                                          : record.status === 'completed'
                                          ? 'Loaded to Cold Room'
                                          : record.status}
                                      </div>
                                    </div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="text-gray-500">Cold Room Ready</div>
                                      <div className="font-bold text-lg">
                                        {record.for_coldroom ? 'Yes' : 'No'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-black-50 p-3 rounded border">
                                    <div className="font-medium mb-2">Boxes Summary</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <div className="text-gray-500">Fuerte 4kg</div>
                                        <div className="font-semibold text-green-700">{boxesSummary.fuerte_4kg} boxes</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Fuerte 10kg</div>
                                        <div className="font-semibold text-green-700">{boxesSummary.fuerte_10kg} crates</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Hass 4kg</div>
                                        <div className="font-semibold text-purple-700">{boxesSummary.hass_4kg} boxes</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Hass 10kg</div>
                                        <div className="font-semibold text-purple-700">{boxesSummary.hass_10kg} crates</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Boxes:</span>
                                        <span className="font-bold">{boxesSummary.total} boxes/crates</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-gray-500 mb-2">Detailed Box Counts</div>
                                    <div className="bg-black-50 p-3 rounded border">
                                      <div className="grid grid-cols-4 gap-2 text-sm mb-2 font-medium">
                                        <div>Type</div>
                                        <div>Class 1</div>
                                        <div>Class 2</div>
                                        <div>Total</div>
                                      </div>
                                      {boxesSummary.fuerte_4kg > 0 && (
                                        <div className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                          <div className="font-medium">Fuerte 4kg</div>
                                          <div>{parseCountingTotals(record.totals).fuerte_4kg_class1 || 0}</div>
                                          <div>{parseCountingTotals(record.totals).fuerte_4kg_class2 || 0}</div>
                                          <div className="font-bold">{boxesSummary.fuerte_4kg}</div>
                                        </div>
                                      )}
                                      {boxesSummary.fuerte_10kg > 0 && (
                                        <div className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                          <div className="font-medium">Fuerte 10kg</div>
                                          <div>{parseCountingTotals(record.totals).fuerte_10kg_class1 || 0}</div>
                                          <div>{parseCountingTotals(record.totals).fuerte_10kg_class2 || 0}</div>
                                          <div className="font-bold">{boxesSummary.fuerte_10kg}</div>
                                        </div>
                                      )}
                                      {boxesSummary.hass_4kg > 0 && (
                                        <div className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                          <div className="font-medium">Hass 4kg</div>
                                          <div>{parseCountingTotals(record.totals).hass_4kg_class1 || 0}</div>
                                          <div>{parseCountingTotals(record.totals).hass_4kg_class2 || 0}</div>
                                          <div className="font-bold">{boxesSummary.hass_4kg}</div>
                                        </div>
                                      )}
                                      {boxesSummary.hass_10kg > 0 && (
                                        <div className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                                          <div className="font-medium">Hass 10kg</div>
                                          <div>{parseCountingTotals(record.totals).hass_10kg_class1 || 0}</div>
                                          <div>{parseCountingTotals(record.totals).hass_10kg_class2 || 0}</div>
                                          <div className="font-bold">{boxesSummary.hass_10kg}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {record.notes && (
                                    <div>
                                      <div className="text-gray-500 mb-2">Notes</div>
                                      <div className="bg-gray-50 p-3 rounded border text-sm">
                                        {record.notes}
                                      </div>
                                    </div>
                                  )}

                                  {record.for_coldroom && record.status === 'pending_coldroom' && (
                                    <div className="bg-green-50 p-3 rounded border border-green-200">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <div className="font-medium text-green-800">Ready for Cold Room</div>
                                          <div className="text-sm text-green-600">This record can be loaded to cold room</div>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            window.open('/cold-room', '_blank');
                                            localStorage.setItem('coldRoomSupplierData', JSON.stringify({
                                              id: record.id,
                                              supplier_name: record.supplier_name,
                                              pallet_id: record.pallet_id,
                                              region: record.region,
                                              counting_data: record.counting_data,
                                              counting_totals: record.totals,
                                              total_weight: record.total_weight,
                                              total_counted_weight: record.total_counted_weight
                                            }));
                                          }}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Load to Cold Room
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
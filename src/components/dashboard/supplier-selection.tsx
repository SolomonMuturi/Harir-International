'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Truck, User, Phone, CreditCard, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
}

interface SupplierSelectionProps {
  onSupplierSelect: (supplier: CheckedInSupplier) => void;
  selectedSupplierId?: string;
}

export function SupplierSelection({ onSupplierSelect, selectedSupplierId }: SupplierSelectionProps) {
  const [suppliers, setSuppliers] = useState<CheckedInSupplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<CheckedInSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckedInSuppliers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchTerm, suppliers]);

  const fetchCheckedInSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/suppliers/checked-in');
      
      if (!response.ok) {
        throw new Error('Failed to fetch checked-in suppliers');
      }
      
      const data = await response.json();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error: any) {
      console.error('Error fetching checked-in suppliers:', error);
      setError(error.message || 'Could not load checked-in suppliers');
      setSuppliers([]);
      setFilteredSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Loading Suppliers...
          </CardTitle>
          <CardDescription>Fetching checked-in suppliers from the system</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Suppliers</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={fetchCheckedInSuppliers}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Checked-in Suppliers
        </CardTitle>
        <CardDescription>
          Select a supplier vehicle that has checked in to pre-fill details
        </CardDescription>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by driver, vehicle plate, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No checked-in suppliers found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm ? 'Try a different search term' : 'No suppliers have checked in yet'}
              </p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className={`cursor-pointer transition-all hover:shadow-md border ${
                  selectedSupplierId === supplier.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200'
                }`}
                onClick={() => onSupplierSelect(supplier)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-lg">{supplier.driver_name}</div>
                        {selectedSupplierId === supplier.id && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="w-3 h-3 text-gray-500" />
                          <span className="font-medium">{supplier.vehicle_plate}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3 h-3 text-gray-500" />
                          <span className="font-mono">{supplier.id_number}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3 text-gray-500" />
                          <span>{supplier.company_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-500" />
                          <span>{supplier.phone_number}</span>
                        </div>
                      </div>
                      
                      {supplier.fruit_varieties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {supplier.fruit_varieties.slice(0, 3).map((variety, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
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
                      <div className="font-mono font-medium">
                        {formatTime(supplier.check_in_time)}
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {supplier.supplier_code}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t text-sm text-gray-500 flex items-center justify-between">
          <span>
            {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
          </span>
          <Button
            onClick={fetchCheckedInSuppliers}
            variant="ghost"
            size="sm"
            className="h-8"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
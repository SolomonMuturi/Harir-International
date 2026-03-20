'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Thermometer, Droplets, Calendar, Truck, AlertCircle } from 'lucide-react';
import type { ColdRoomInventory as ColdRoomInventoryType } from '@/lib/data';

interface ColdRoomInventoryProps {
  inventory: ColdRoomInventoryType[];
  stockTakeMode?: boolean;
  onRowClick?: (item: ColdRoomInventoryType) => void;
  onCompleteStockTake?: (counts: Record<string, number>) => Promise<void>;
  onCancelStockTake?: () => void;
}

export function ColdRoomInventory({ 
  inventory, 
  stockTakeMode = false, 
  onRowClick,
  onCompleteStockTake,
  onCancelStockTake 
}: ColdRoomInventoryProps) {
  const [stockTakeData, setStockTakeData] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStockTakeChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setStockTakeData(prev => ({
      ...prev,
      [id]: numValue,
    }));
    setError(null);
  };

  const handleCompleteCount = async () => {
    if (Object.keys(stockTakeData).length === 0) {
      setError('Please count at least one item before completing stock take');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      if (onCompleteStockTake) {
        await onCompleteStockTake(stockTakeData);
      }
      setStockTakeData({});
    } catch (error: any) {
      setError(error.message || 'Failed to complete stock take');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCount = () => {
    if (Object.keys(stockTakeData).length > 0) {
      if (window.confirm('Are you sure you want to cancel? All counted values will be lost.')) {
        setStockTakeData({});
        setError(null);
        if (onCancelStockTake) {
          onCancelStockTake();
        }
      }
    } else {
      setStockTakeData({});
      if (onCancelStockTake) {
        onCancelStockTake();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'aging':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'expiring':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const calculateDaysRemaining = (expiryDate: string | undefined) => {
    if (!expiryDate) return 'N/A';
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? `${diffDays}d` : 'Expired';
    } catch {
      return 'N/A';
    }
  };

  const countedItems = Object.keys(stockTakeData).length;
  const totalVariance = inventory.reduce((sum, item) => {
    const stockTakeValue = stockTakeData[item.id];
    if (stockTakeValue !== undefined) {
      return sum + Math.abs(stockTakeValue - (item.quantity || 0));
    }
    return sum;
  }, 0);
  
  const itemsWithVariance = inventory.filter(item => {
    const stockTakeValue = stockTakeData[item.id];
    return stockTakeValue !== undefined && stockTakeValue !== (item.quantity || 0);
  }).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cold Room Inventory</span>
          {stockTakeMode && (
            <Badge variant="outline" className="border-amber-500 text-amber-700 animate-pulse">
              Stock Take Mode
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Real-time tracking of produce in cold storage facilities
          {stockTakeMode && (
            <span className="block mt-1 text-amber-700">
              Counting mode active - enter actual counts for each item
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Supplier</TableHead>
                {stockTakeMode && <TableHead className="text-right">Actual Count</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={stockTakeMode ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    No inventory data available
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => {
                  const quantity = item.quantity || 0;
                  const stockTakeValue = stockTakeData[item.id];
                  const hasVariance = stockTakeMode && stockTakeValue !== undefined && stockTakeValue !== quantity;
                  
                  return (
                    <TableRow 
                      key={item.id} 
                      className={`${onRowClick && !stockTakeMode ? 'cursor-pointer hover:bg-muted/50' : ''} ${hasVariance ? 'bg-amber-50' : ''}`}
                      onClick={() => {
                        if (!stockTakeMode) { // Only navigate if NOT in stock take mode
                          onRowClick?.(item);
                        }
                      }}
                    >
                      <TableCell className="font-medium">
                        {item.product || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{(quantity || 0).toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.unit || 'N/A'}
                          </Badge>
                          {hasVariance && (
                            <span className="text-xs text-amber-600">
                              ({stockTakeValue?.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {item.location || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          <span>{item.temperature || 0}°C</span>
                          <Droplets className="w-3 h-3 ml-2" />
                          <span>{item.humidity || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status || 'fresh')}>
                          {item.status || 'fresh'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.expiryDate)}</span>
                          <span className="text-xs text-muted-foreground">
                            ({calculateDaysRemaining(item.expiryDate)})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{item.supplier || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      {stockTakeMode && (
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={stockTakeValue !== undefined ? stockTakeValue : ''}
                            onChange={(e) => handleStockTakeChange(item.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            className="w-24 text-right"
                            min="0"
                            placeholder={quantity.toString()}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {stockTakeMode && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <p className="text-sm font-medium text-amber-800">Items Counted</p>
                <p className="text-2xl font-bold text-amber-900">{countedItems} / {inventory.length}</p>
              </div>
              <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <p className="text-sm font-medium text-amber-800">Variances Found</p>
                <p className="text-2xl font-bold text-amber-900">{itemsWithVariance}</p>
              </div>
              <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <p className="text-sm font-medium text-amber-800">Total Variance</p>
                <p className="text-2xl font-bold text-amber-900">{totalVariance.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Stock Take in Progress</p>
                    <p className="text-xs text-amber-700">
                      {countedItems} items counted • {itemsWithVariance} variances detected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={handleCancelCount}
                    disabled={isSubmitting}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel Stock Take
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleCompleteCount}
                    disabled={isSubmitting || countedItems === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Complete Stock Take
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {countedItems > 0 && (
                <div className="mt-4 pt-4 border-t border-amber-300">
                  <p className="text-xs text-amber-700 mb-2">Counted Items:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stockTakeData).map(([id, count]) => {
                      const item = inventory.find(i => i.id === id);
                      if (!item) return null;
                      const variance = count - (item.quantity || 0);
                      return (
                        <Badge 
                          key={id} 
                          variant="outline" 
                          className={`text-xs ${variance === 0 ? 'border-green-300 text-green-700' : 'border-amber-300 text-amber-700'}`}
                        >
                          {item.product}: {count} {variance !== 0 && `(${variance > 0 ? '+' : ''}${variance})`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
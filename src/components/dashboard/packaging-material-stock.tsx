
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Boxes, AlertCircle, Save, Plus, Minus, Edit, Send } from 'lucide-react';
import type { PackagingMaterial } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { CreatePackagingForm } from './create-packaging-form';
import type { PackagingFormValues } from './create-packaging-form';

interface PackagingMaterialStockProps {
  materials: PackagingMaterial[];
  stockTakeMode: boolean;
  setMaterials: React.Dispatch<React.SetStateAction<PackagingMaterial[]>>;
}

export function PackagingMaterialStock({ materials, stockTakeMode, setMaterials }: PackagingMaterialStockProps) {
  const { toast } = useToast();
  const [countedStock, setCountedStock] = useState<Record<string, number | undefined>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<PackagingMaterial | null>(null);

  useEffect(() => {
    if (!stockTakeMode) {
      setCountedStock({});
    }
  }, [stockTakeMode]);

  const handleCountChange = (id: string, value: string) => {
    setCountedStock(prev => ({
      ...prev,
      [id]: value === '' ? undefined : Number(value),
    }));
  };
  
  const handleReorderLevelChange = (id: string, value: string) => {
    setIsEditing(true);
    setMaterials(prev => 
      prev.map(m => m.id === id ? { ...m, reorderLevel: Number(value) } : m)
    );
  }

  const handleStockChange = (id: string, amount: number) => {
    setIsEditing(true);
    setMaterials(prev => 
        prev.map(m => m.id === id ? { ...m, currentStock: Math.max(0, m.currentStock + amount) } : m)
    );
  };


  const handleSaveChanges = () => {
    setIsEditing(false);
    toast({
        title: 'Changes Saved',
        description: 'Packaging material stock levels and reorder points have been updated.',
    });
    // Here you would typically make an API call to save the changes to your backend
  };

  const handleReorder = (materialName: string) => {
    toast({
      title: 'Reorder Placed',
      description: `A purchase order for ${materialName} has been created.`,
    });
  };

  const handleUpdatePackaging = (values: PackagingFormValues) => {
    if (!editingItem) return;
    
    setMaterials(prev =>
        prev.map(item =>
            item.id === editingItem.id ? { ...item, ...values } : item
        )
    );

    setEditingItem(null);
    toast({
        title: 'Update Submitted for Approval',
        description: `Changes to ${values.name} have been sent to the stock keeper for approval.`,
    });
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes />
          Packaging Materials
        </CardTitle>
        <CardDescription>
          Current stock levels of packaging materials.
          {stockTakeMode && <span className="text-primary font-semibold"> (Stock Take Mode)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {materials.map((material) => {
          const stockPercentage = (material.currentStock / (material.reorderLevel * 2)) * 100;
          const isLow = material.currentStock <= material.reorderLevel;
          const counted = countedStock[material.id];
          const discrepancy = counted !== undefined ? counted - material.currentStock : undefined;

          return (
            <div 
              key={material.id} 
              className={cn('p-3 rounded-md border', isLow ? 'border-destructive/20 bg-destructive/5' : 'bg-muted/30')}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="font-medium">{material.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{material.category}</Badge>
                      {material.dimensions && (
                          <p className="text-xs text-muted-foreground">{material.dimensions}</p>
                      )}
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStockChange(material.id, -1)}><Minus className="w-4 h-4" /></Button>
                  <span className={`text-lg font-bold ${isLow ? 'text-destructive' : ''}`}>
                    {material.currentStock}
                  </span>
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStockChange(material.id, 1)}><Plus className="w-4 h-4" /></Button>
                  <span className="text-sm text-muted-foreground">/ {material.reorderLevel * 2} {material.unit}</span>
                 </div>
              </div>
              <Progress value={stockPercentage} className={isLow ? '[&>div]:bg-destructive' : ''} />
              
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                      <span>Reorder at:</span>
                      <Input 
                        type="number"
                        value={material.reorderLevel}
                        onChange={(e) => handleReorderLevelChange(material.id, e.target.value)}
                        className="h-7 w-20 text-center"
                      />
                  </div>
                   <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingItem(material)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    {isLow && (
                        <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReorder(material.name);
                            }}
                        >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Reorder Now
                        </Button>
                    )}
                   </div>
              </div>

              {stockTakeMode && (
                <div className="grid grid-cols-2 gap-4 items-center mt-2 border-t pt-2">
                  <Input 
                    type="number" 
                    placeholder="Counted qty..." 
                    value={counted === undefined ? '' : counted}
                    onChange={(e) => handleCountChange(material.id, e.target.value)}
                    className="h-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className={cn(
                    "text-sm font-bold text-right",
                     discrepancy === 0 && "text-green-600",
                     discrepancy !== undefined && discrepancy !== 0 && "text-destructive"
                  )}>
                    {discrepancy !== undefined ? `Discrepancy: ${discrepancy}` : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
       {isEditing && (
        <CardFooter className="justify-end border-t pt-4">
            <Button onClick={handleSaveChanges}>
                <Save className="mr-2" />
                Save Changes
            </Button>
        </CardFooter>
      )}
    </Card>

    <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Packaging Material</DialogTitle>
            <DialogDescription>
              Submit changes for approval by the stock keeper.
            </DialogDescription>
          </DialogHeader>
          <CreatePackagingForm onSubmit={handleUpdatePackaging} initialData={editingItem || undefined} />
        </DialogContent>
      </Dialog>
    </>
  );
}


'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Weight, Package } from 'lucide-react';
import type { ColdRoomInventory } from '@/lib/data';
import { useMemo } from 'react';
import { Separator } from '../ui/separator';

interface InventorySummaryCardProps {
  inventory: ColdRoomInventory[];
}

const WEIGHT_CONVERSIONS = {
  pallets: 1000, // Average weight of a pallet in kg
  tonnes: 1000,  // 1 tonne is 1000 kg
  boxes: 20,     // Average weight of a box in kg
};

export function InventorySummaryCard({ inventory }: InventorySummaryCardProps) {
  const { bulkWeight, packagedBoxes } = useMemo(() => {
    let bulkWeight = 0;
    let packagedBoxes = 0;
    
    inventory.forEach((item) => {
      if (item.unit === 'pallets' || item.unit === 'tonnes') {
        const weightPerUnit = WEIGHT_CONVERSIONS[item.unit] || 0;
        bulkWeight += item.quantity * weightPerUnit;
      } else if (item.unit === 'boxes') {
        packagedBoxes += item.quantity;
      }
    });

    return { bulkWeight, packagedBoxes };
  }, [inventory]);

  return (
    <Card className='cursor-pointer'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Weight />
          Produce Summary
        </CardTitle>
        <CardDescription>
          Total estimated produce in all cold rooms.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">
            {(bulkWeight / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Tonnes (Bulk)
          </p>
        </div>
         <div>
          <p className="text-2xl font-bold">
            {packagedBoxes.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-muted-foreground">
            Packaged Boxes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

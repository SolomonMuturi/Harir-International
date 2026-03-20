
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Boxes } from 'lucide-react';
import type { PackagingMaterial } from '@/lib/data';
import { useMemo } from 'react';

interface PackagingSummaryCardProps {
  materials: PackagingMaterial[];
}

export function PackagingSummaryCard({ materials }: PackagingSummaryCardProps) {
  const { categorizedMaterials } = useMemo(() => {
    const categorized: Record<string, { total: number; items: { name: string; stock: number }[] }> = {
      boxes: { total: 0, items: [] },
      rolls: { total: 0, items: [] },
      units: { total: 0, items: [] },
    };

    materials.forEach((material) => {
      const category = material.unit;
      if (categorized[category]) {
        categorized[category].total += material.currentStock;
        categorized[category].items.push({ name: material.name, stock: material.currentStock });
      }
    });

    return { categorizedMaterials: categorized };
  }, [materials]);

  const CategoryDisplay = ({ category, label }: { category: 'boxes' | 'rolls' | 'units', label: string }) => {
    const data = categorizedMaterials[category];
    if (!data) return null;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer p-2 rounded-md hover:bg-muted/50">
            <p className="text-2xl font-bold">
              {data.total.toLocaleString('en-US')}
            </p>
            <p className="text-sm text-muted-foreground">
              {label}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="p-2 space-y-2">
            <p className="font-bold text-center mb-2">{label} Breakdown</p>
            {data.items.length > 0 ? (
              data.items.map(item => (
                <div key={item.name} className="flex justify-between gap-4 text-xs">
                  <span>{item.name}</span>
                  <span className="font-mono font-bold">{item.stock.toLocaleString('en-US')}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No items in this category.</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes />
            Packaging Material Summary
          </CardTitle>
          <CardDescription>
            Total stock of packaging materials. Hover for details.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-center">
            <CategoryDisplay category="boxes" label="Total Boxes" />
            <CategoryDisplay category="rolls" label="Total Rolls" />
            <CategoryDisplay category="units" label="Other Units" />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

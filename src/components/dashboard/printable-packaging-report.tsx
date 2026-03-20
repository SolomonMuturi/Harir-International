
'use client';

import { FreshTraceLogo } from '../icons';
import { format } from 'date-fns';
import type { PackagingMaterial } from '@/lib/data';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface PrintablePackagingReportProps {
  materials: PackagingMaterial[];
}

export function PrintablePackagingReport({ materials }: PrintablePackagingReportProps) {
  
  const reportId = `PKG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  return (
    <div className="p-8 bg-white text-black font-sans">
      <header className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <FreshTraceLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Packaging Inventory Report</h1>
            <p className="text-sm text-gray-500">
              Date: {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="text-right">
            <p className="font-bold text-lg">FreshTrace Inc.</p>
            <p className="text-sm text-gray-600">info@freshtrace.co.ke | www.freshtrace.co.ke</p>
            <p className="font-mono text-xs mt-2 text-gray-500">{reportId}</p>
        </div>
      </header>
      
      <main>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Current Stock Levels</h2>
        
        <div className="grid grid-cols-4 items-center mb-2 px-4 text-sm font-medium text-gray-500">
            <div className="col-span-1">Material Name</div>
            <div className="col-span-1 text-center">Stock Level</div>
            <div className="col-span-1 text-center">Current / Reorder</div>
            <div className="col-span-1 text-center">Status</div>
        </div>
        <Separator className="mb-4" />

        <div className="space-y-4">
            {materials.map(item => {
                const stockPercentage = Math.min((item.currentStock / (item.reorderLevel * 2)) * 100, 100);
                const isLow = item.currentStock <= item.reorderLevel;
                return (
                    <div key={item.id} className="grid grid-cols-4 items-center px-4 py-3 hover:bg-gray-50 rounded-lg">
                        <div className="col-span-1">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.dimensions || item.unit}</p>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                            <Progress value={stockPercentage} className={`w-3/4 h-3 ${isLow ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`} />
                        </div>
                        <div className="col-span-1 text-center font-mono text-gray-700">
                           {item.currentStock.toLocaleString()} / {item.reorderLevel.toLocaleString()}
                        </div>
                        <div className="col-span-1 flex justify-center">
                            <Badge variant={isLow ? 'destructive' : 'default'} className={isLow ? 'bg-red-500' : 'bg-green-600'}>
                                {isLow ? 'Low Stock' : 'OK'}
                            </Badge>
                        </div>
                    </div>
                )
            })}
        </div>
      </main>
    </div>
  );
}

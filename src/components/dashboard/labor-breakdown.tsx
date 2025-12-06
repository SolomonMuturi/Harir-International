
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

export function LaborBreakdown() {
  const salariedOnShift = 8;
  const casualsOnShift = 27;
  const totalLabor = salariedOnShift + casualsOnShift;

  const salariedCost = 55000;
  const casualCost = 42500;
  const totalCost = salariedCost + casualCost;

  return (
    <>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Labor Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
            <div className="border-r pr-4">
                 <p className="text-xs text-muted-foreground">Salaried</p>
                 <div className="flex flex-col items-center gap-2 mt-2">
                    <div>
                        <p className="text-xs text-muted-foreground">On Shift</p>
                        <p className="font-mono font-semibold">{salariedOnShift}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Est. Cost</p>
                        <p className="font-mono font-semibold">KES {salariedCost.toLocaleString()}</p>
                    </div>
                 </div>
            </div>
             <div>
                 <p className="text-xs text-muted-foreground">Casuals</p>
                 <div className="flex flex-col items-center gap-2 mt-2">
                    <div>
                        <p className="text-xs text-muted-foreground">On Shift</p>
                        <p className="font-mono font-semibold">{casualsOnShift}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Est. Cost</p>
                        <p className="font-mono font-semibold">KES {casualCost.toLocaleString()}</p>
                    </div>
                 </div>
            </div>
            <div className="col-span-2 pt-4 border-t">
                <p className="text-xs text-muted-foreground">Total Labor</p>
                <div className="flex justify-center items-baseline gap-6 mt-1">
                    <p className="text-xl font-bold text-primary">{totalLabor} Employees</p>
                    <p className="text-xl font-bold text-primary">KES {totalCost.toLocaleString()}</p>
                </div>
            </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/employees?tab=payroll">View Payroll Details</Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}

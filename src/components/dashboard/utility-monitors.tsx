
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Zap, Droplet, Fuel, Save } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';

export function UtilityMonitors() {
    const { toast } = useToast();
    const [powerOpening, setPowerOpening] = useState('195352');
    const [powerClosing, setPowerClosing] = useState('195407');
    const [waterOpening, setWaterOpening] = useState('642');
    const [waterClosing, setWaterClosing] = useState('642');
    const [dieselLevel, setDieselLevel] = useState('75');
    const [dieselRefill, setDieselRefill] = useState('');

    const powerConsumed = (Number(powerClosing) || 0) - (Number(powerOpening) || 0);
    const waterConsumed = (Number(waterClosing) || 0) - (Number(waterOpening) || 0);
    
    const handleSaveChanges = () => {
        toast({
            title: 'Readings Saved',
            description: 'Manual utility readings have been successfully saved.'
        });
    }

  return (
    <>
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-center gap-2">
            Manual Utility Meter Readings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Power */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-yellow-500"><Zap /> Power Usage</h3>
                <div className="space-y-2">
                    <Label htmlFor="power-opening">Opening Reading (kWh)</Label>
                    <Input id="power-opening" type="number" value={powerOpening} onChange={(e) => setPowerOpening(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="power-closing">Closing Reading (kWh)</Label>
                    <Input id="power-closing" type="number" value={powerClosing} onChange={(e) => setPowerClosing(e.target.value)} />
                </div>
                 <div className="text-center bg-muted p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Consumed Today</p>
                    <p className="text-xl font-bold">{powerConsumed.toLocaleString()} kWh</p>
                </div>
            </div>
            {/* Water */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-blue-500"><Droplet /> Water Usage</h3>
                <div className="space-y-2">
                    <Label htmlFor="water-opening">Opening Reading (m³)</Label>
                    <Input id="water-opening" type="number" value={waterOpening} onChange={(e) => setWaterOpening(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="water-closing">Closing Reading (m³)</Label>
                    <Input id="water-closing" type="number" value={waterClosing} onChange={(e) => setWaterClosing(e.target.value)} />
                </div>
                <div className="text-center bg-muted p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Consumed Today</p>
                    <p className="text-xl font-bold">{waterConsumed.toLocaleString()} m³</p>
                </div>
            </div>
             {/* Diesel */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium flex items-center gap-2 text-orange-500"><Fuel /> Generator Diesel</h3>
                <div className="space-y-2">
                    <Label htmlFor="diesel-level">Current Level (%)</Label>
                    <Input id="diesel-level" type="number" value={dieselLevel} onChange={(e) => setDieselLevel(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="diesel-refill">Last Refill Amount (L)</Label>
                    <Input id="diesel-refill" type="number" placeholder="e.g., 500" value={dieselRefill} onChange={(e) => setDieselRefill(e.target.value)} />
                </div>
                 <div className="text-center bg-muted p-2 rounded-md">
                     <Link href="/utility/diesel-analytics" className="w-full">
                        <Button variant="link">View Detailed Breakdown</Button>
                    </Link>
                </div>
            </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2" />
            Save All Readings
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}


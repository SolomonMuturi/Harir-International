'use client';

import { FreshViewLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { ColdRoomInventory } from '@/lib/data';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';

interface PrintableInventoryReportProps {
  inventory: ColdRoomInventory[];
  dateRange: {
    from: Date;
    to: Date;
  };
  shift: 'day' | 'night';
  productionDetails: {
    fuerte?: {
      europeBoxes: number;
      dubaiBoxes: number;
      crates: number;
    };
    hass?: {
      europeBoxes: number;
      dubaiBoxes: number;
      crates: number;
    };
  };
  labourCount: number;
  powerReadings: {
    opening: number;
    closing: number;
    units: number;
  };
  waterReadings: {
    opening: number;
    closing: number;
    units: number;
  };
}

export function PrintableInventoryReport({ 
  inventory = [],
  dateRange = { from: new Date(), to: new Date() },
  shift = 'day',
  productionDetails = { 
    fuerte: { europeBoxes: 0, dubaiBoxes: 0, crates: 0 }, 
    hass: { europeBoxes: 0, dubaiBoxes: 0, crates: 0 } 
  },
  labourCount = 0,
  powerReadings = { opening: 0, closing: 0, units: 0 },
  waterReadings = { opening: 0, closing: 0, units: 0 }
}: PrintableInventoryReportProps) {
  
  const reportId = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  // Safely access production details with defaults
  const fuerteDetails = productionDetails?.fuerte || { europeBoxes: 0, dubaiBoxes: 0, crates: 0 };
  const hassDetails = productionDetails?.hass || { europeBoxes: 0, dubaiBoxes: 0, crates: 0 };
  
  const hasFuerte = fuerteDetails.europeBoxes > 0 || fuerteDetails.dubaiBoxes > 0 || fuerteDetails.crates > 0;
  const hasHass = hassDetails.europeBoxes > 0 || hassDetails.dubaiBoxes > 0 || hassDetails.crates > 0;

  // Calculate totals with safe defaults
  const totalEuropeBoxes = (fuerteDetails.europeBoxes || 0) + (hassDetails.europeBoxes || 0);
  const totalDubaiBoxes = (fuerteDetails.dubaiBoxes || 0) + (hassDetails.dubaiBoxes || 0);
  const totalCrates = (fuerteDetails.crates || 0) + (hassDetails.crates || 0);

  // Calculate inventory summary
  const inventorySummary = inventory.reduce((acc, item) => {
    const productLower = (item.product || '').toLowerCase();
    if (productLower.includes('fuerte')) {
      acc.fuerte += item.quantity || 0;
    } else if (productLower.includes('hass')) {
      acc.hass += item.quantity || 0;
    }
    acc.total += item.quantity || 0;
    return acc;
  }, { fuerte: 0, hass: 0, total: 0 });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div className="p-8 bg-white text-black border rounded-lg shadow-lg print:shadow-none print:border-0">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <FreshViewLogo className="h-12 w-12 text-primary print:text-black" />
            <div>
              <h1 className="text-2xl font-bold">Cold Room Inventory Report</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-500">
                  Period: {format(dateRange.from, 'MMMM d, yyyy')} - {format(dateRange.to, 'MMMM d, yyyy')}
                </p>
                <Badge variant="outline" className="capitalize">
                  {shift} Shift
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">Harir International</p>
            <p className="text-sm">info@harir.co.ke</p>
            <p className="font-mono text-xs mt-1">{reportId}</p>
          </div>
        </div>
        
        {/* Production Details */}
        <Card className="mb-6 print:border print:shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">Production Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hasFuerte && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-700">Fuerte Avocado</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Europe Boxes</p>
                      <p className="font-bold text-lg">{fuerteDetails.europeBoxes}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Dubai Boxes</p>
                      <p className="font-bold text-lg">{fuerteDetails.dubaiBoxes}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Crates</p>
                      <p className="font-bold text-lg">{fuerteDetails.crates}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {hasHass && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-purple-700">Hass Avocado</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Europe Boxes</p>
                      <p className="font-bold text-lg">{hassDetails.europeBoxes}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Dubai Boxes</p>
                      <p className="font-bold text-lg">{hassDetails.dubaiBoxes}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Crates</p>
                      <p className="font-bold text-lg">{hassDetails.crates}</p>
                    </div>
                  </div>
                </div>
              )}

              {!hasFuerte && !hasHass && (
                <div className="col-span-2 text-center py-4 text-gray-500">
                  No production details available for this period
                </div>
              )}
            </div>

            {/* Totals */}
            {(hasFuerte || hasHass) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-lg print:bg-gray-100">
                  <div>
                    <p className="text-gray-500">Total Europe Boxes</p>
                    <p className="font-bold">{totalEuropeBoxes}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Dubai Boxes</p>
                    <p className="font-bold">{totalDubaiBoxes}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Crates</p>
                    <p className="font-bold">{totalCrates}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Labour & Utilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="print:border print:shadow-none">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-gray-500">Labour Used</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{labourCount} employees</p>
            </CardContent>
          </Card>

          <Card className="print:border print:shadow-none">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-gray-500">Power Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Opening:</span>
                  <span className="font-medium">{powerReadings.opening} kWh</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Closing:</span>
                  <span className="font-medium">{powerReadings.closing} kWh</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                  <span>Units:</span>
                  <span className="text-green-600">{powerReadings.units} kWh</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="print:border print:shadow-none">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-gray-500">Water Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Opening:</span>
                  <span className="font-medium">{waterReadings.opening} m³</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Closing:</span>
                  <span className="font-medium">{waterReadings.closing} m³</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                  <span>Units:</span>
                  <span className="text-blue-600">{waterReadings.units} m³</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Inventory Table */}
        <Card className="print:border print:shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">Current Inventory ({inventory.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Entry Date</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="print:border print:text-black">{item.category || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{item.location || 'N/A'}</TableCell>
                    <TableCell>{item.entryDate ? format(new Date(item.entryDate), 'PPP p') : 'N/A'}</TableCell>
                    <TableCell className="text-right font-mono">{item.quantity || 0} {item.unit || 'units'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Inventory Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-lg print:bg-gray-100">
                <div>
                  <p className="text-gray-500">Fuerte Total</p>
                  <p className="font-bold">{inventorySummary.fuerte} units</p>
                </div>
                <div>
                  <p className="text-gray-500">Hass Total</p>
                  <p className="font-bold">{inventorySummary.hass} units</p>
                </div>
                <div>
                  <p className="text-gray-500">Grand Total</p>
                  <p className="font-bold">{inventorySummary.total} units</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-4 text-center border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Generated by Harir International System • {format(new Date(), 'MMMM d, yyyy HH:mm:ss')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Report ID: {reportId} • This is a computer-generated document
          </p>
        </div>
      </div>
    </div>
  );
}
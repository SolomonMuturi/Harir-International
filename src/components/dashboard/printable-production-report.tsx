
'use client';

import { FreshTraceLogo } from '../icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

interface ProductionReportData {
  dateRange: {
    from: Date;
    to: Date;
  };
  timeRange?: {
    from: string;
    to: string;
  };
  suppliersCount: number;
  totalCratesReceived: number;
  totalRejects: number;
  employees: Array<{
    name: string;
    designation: string;
  }>;
  labourCounts?: {
    QC: number;
    Packers: number;
    Dipping: number;
    Porters: number;
    Palletizers: number;
  };
  totalBoxesCounted: number;
  utilityData: {
    electricity: {
      initial: number;
      final: number;
      units: number;
    };
    water: {
      initial: number;
      final: number;
      units: number;
    };
  };
}

interface PrintableProductionReportProps {
  reportData: ProductionReportData;
}

export function PrintableProductionReport({ reportData }: PrintableProductionReportProps) {
  
  const reportId = `PROD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  return (
    <div className="p-8 bg-white text-black font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="text-center mb-8">
        <div className="flex items-center justify-center gap-4">
          <FreshTraceLogo className="h-12 w-12 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-800">Production Report</h1>
        </div>
        <p className="text-lg text-gray-600 mt-2">Harir International</p>
        <p className="text-sm text-gray-500 mt-1">Comprehensive Production Summary</p>
      </header>
      
      <div className="grid grid-cols-3 gap-4 mb-8 text-center">
        <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Report Period</p>
            <p className="text-lg font-semibold">{format(reportData.dateRange.from, 'MMM dd, yyyy')} - {format(reportData.dateRange.to, 'MMM dd, yyyy')}</p>
            {reportData.timeRange && (
              <p className="text-sm text-gray-600">{reportData.timeRange.from} to {reportData.timeRange.to}</p>
            )}
        </div>
         <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Generated</p>
            <p className="text-lg font-semibold">{format(new Date(), 'MMM dd, yyyy')}</p>
        </div>
         <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Report ID</p>
            <p className="text-lg font-semibold font-mono">{reportId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Suppliers and Intake Summary */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700 border-b pb-2">Intake Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Suppliers:</span>
              <span className="font-semibold text-lg">{reportData.suppliersCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Crates Received:</span>
              <span className="font-semibold text-lg">{reportData.totalCratesReceived.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Rejects:</span>
              <span className="font-semibold text-lg text-red-600">{reportData.totalRejects.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Warehouse Summary */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700 border-b pb-2">Warehouse Operations</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Boxes Counted:</span>
              <span className="font-semibold text-lg">{reportData.totalBoxesCounted.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Utility Consumption */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-700 border-b pb-2">Utility Consumption</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-3 text-yellow-700">Electricity (kWh)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Initial Reading:</span>
                <span className="font-mono">{reportData.utilityData.electricity.initial.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Final Reading:</span>
                <span className="font-mono">{reportData.utilityData.electricity.final.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Units Used:</span>
                <span className="font-semibold font-mono">{reportData.utilityData.electricity.units.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3 text-blue-700">Water (Liters)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Initial Reading:</span>
                <span className="font-mono">{reportData.utilityData.water.initial.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Final Reading:</span>
                <span className="font-mono">{reportData.utilityData.water.final.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Units Used:</span>
                <span className="font-semibold font-mono">{reportData.utilityData.water.units.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Labour Used */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">Labour Used</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">QC</span>
            <span className="font-semibold">{reportData.labourCounts?.QC ?? 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Packers</span>
            <span className="font-semibold">{reportData.labourCounts?.Packers ?? 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Dipping</span>
            <span className="font-semibold">{reportData.labourCounts?.Dipping ?? 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Porters</span>
            <span className="font-semibold">{reportData.labourCounts?.Porters ?? 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Palletizers</span>
            <span className="font-semibold">{reportData.labourCounts?.Palletizers ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">Employee Directory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.employees.map((employee, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">{employee.name}</span>
              <Badge variant="outline" className="text-xs">
                {employee.designation}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-gray-600">
          Total Employees: {reportData.employees.length}
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-gray-400 pt-4 border-t">
        <p>This is an electronically generated production report from the FreshTrace system.</p>
        <p>Harir International | P.O. Box 12345 - 00100, Nairobi | Generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
      </footer>
    </div>
  );
}

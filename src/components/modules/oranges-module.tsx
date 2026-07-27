'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileSpreadsheet, Download, RefreshCw, Truck, Apple, Package, Scale, Calculator } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface OrangeMovementEntry {
  id: string;
  salesPersonName: string;
  salesPersonPhone: string;
  vehiclePlate: string;
  // Lemons with classes
  lemonsClass1: number;
  lemonsClass2: number;
  lemonsClass3: number;
  lemonsTotalBoxes: number;
  lemonsTotalWeight: number;
  // Citrus/Tangerines with classes
  citrusClass1: number;
  citrusClass2: number;
  citrusClass3: number;
  citrusTotalBoxes: number;
  citrusTotalWeight: number;
  // Oranges with classes
  orangesClass1: number;
  orangesClass2: number;
  orangesClass3: number;
  orangesTotalBoxes: number;
  orangesTotalWeight: number;
  // Grand totals
  grandTotalBoxes: number;
  grandTotalWeight: number;
  notes: string;
  createdAt: string;
}

export function OrangesModule() {
  const { toast } = useToast();

  // Orange Carry Form with Classes
  const [orangeCarryForm, setOrangeCarryForm] = useState({
    salesPersonName: '',
    salesPersonPhone: '',
    vehiclePlate: '',
    // Lemons
    lemonsClass1: '',
    lemonsClass2: '',
    lemonsClass3: '',
    // Citrus/Tangerines
    citrusClass1: '',
    citrusClass2: '',
    citrusClass3: '',
    // Oranges
    orangesClass1: '',
    orangesClass2: '',
    orangesClass3: '',
    notes: '',
  });

  const [orangeCarryEntries, setOrangeCarryEntries] = useState<OrangeMovementEntry[]>([]);
  const [editingOrangeCarryEntryId, setEditingOrangeCarryEntryId] = useState<string | null>(null);
  const [orangeCarryEditForm, setOrangeCarryEditForm] = useState({
    salesPersonName: '',
    salesPersonPhone: '',
    vehiclePlate: '',
    lemonsClass1: '',
    lemonsClass2: '',
    lemonsClass3: '',
    citrusClass1: '',
    citrusClass2: '',
    citrusClass3: '',
    orangesClass1: '',
    orangesClass2: '',
    orangesClass3: '',
    notes: '',
  });

  // Orange Return Form with Classes
  const [orangeReturnForm, setOrangeReturnForm] = useState({
    salesPersonName: '',
    salesPersonPhone: '',
    vehiclePlate: '',
    lemonsClass1: '',
    lemonsClass2: '',
    lemonsClass3: '',
    citrusClass1: '',
    citrusClass2: '',
    citrusClass3: '',
    orangesClass1: '',
    orangesClass2: '',
    orangesClass3: '',
    notes: '',
  });

  const [orangeReturnEntries, setOrangeReturnEntries] = useState<OrangeMovementEntry[]>([]);
  const [orangeTransactionsFilterDate, setOrangeTransactionsFilterDate] = useState('');
  const [orangeActiveTab, setOrangeActiveTab] = useState<'carry' | 'returns' | 'transactions' | 'stock'>('carry');

  // Helper function to calculate totals from form data
  const calculateTotals = (formData: any) => {
    const lemonsClass1 = Number(formData.lemonsClass1) || 0;
    const lemonsClass2 = Number(formData.lemonsClass2) || 0;
    const lemonsClass3 = Number(formData.lemonsClass3) || 0;
    const lemonsTotalBoxes = lemonsClass1 + lemonsClass2 + lemonsClass3;
    const lemonsTotalWeight = lemonsTotalBoxes * 15; // 15kg per box

    const citrusClass1 = Number(formData.citrusClass1) || 0;
    const citrusClass2 = Number(formData.citrusClass2) || 0;
    const citrusClass3 = Number(formData.citrusClass3) || 0;
    const citrusTotalBoxes = citrusClass1 + citrusClass2 + citrusClass3;
    const citrusTotalWeight = citrusTotalBoxes * 20; // 20kg per box for tangerines

    const orangesClass1 = Number(formData.orangesClass1) || 0;
    const orangesClass2 = Number(formData.orangesClass2) || 0;
    const orangesClass3 = Number(formData.orangesClass3) || 0;
    const orangesTotalBoxes = orangesClass1 + orangesClass2 + orangesClass3;
    const orangesTotalWeight = orangesTotalBoxes * 15; // 15kg per box

    const grandTotalBoxes = lemonsTotalBoxes + citrusTotalBoxes + orangesTotalBoxes;
    const grandTotalWeight = lemonsTotalWeight + citrusTotalWeight + orangesTotalWeight;

    return {
      lemons: { class1: lemonsClass1, class2: lemonsClass2, class3: lemonsClass3, totalBoxes: lemonsTotalBoxes, totalWeight: lemonsTotalWeight },
      citrus: { class1: citrusClass1, class2: citrusClass2, class3: citrusClass3, totalBoxes: citrusTotalBoxes, totalWeight: citrusTotalWeight },
      oranges: { class1: orangesClass1, class2: orangesClass2, class3: orangesClass3, totalBoxes: orangesTotalBoxes, totalWeight: orangesTotalWeight },
      grandTotal: { boxes: grandTotalBoxes, weight: grandTotalWeight }
    };
  };

  // Helper to create entry from form data
  const createEntryFromForm = (formData: any, id: string, createdAt: string): OrangeMovementEntry => {
    const totals = calculateTotals(formData);
    return {
      id,
      salesPersonName: formData.salesPersonName.trim(),
      salesPersonPhone: formData.salesPersonPhone.trim(),
      vehiclePlate: formData.vehiclePlate.trim(),
      lemonsClass1: totals.lemons.class1,
      lemonsClass2: totals.lemons.class2,
      lemonsClass3: totals.lemons.class3,
      lemonsTotalBoxes: totals.lemons.totalBoxes,
      lemonsTotalWeight: totals.lemons.totalWeight,
      citrusClass1: totals.citrus.class1,
      citrusClass2: totals.citrus.class2,
      citrusClass3: totals.citrus.class3,
      citrusTotalBoxes: totals.citrus.totalBoxes,
      citrusTotalWeight: totals.citrus.totalWeight,
      orangesClass1: totals.oranges.class1,
      orangesClass2: totals.oranges.class2,
      orangesClass3: totals.oranges.class3,
      orangesTotalBoxes: totals.oranges.totalBoxes,
      orangesTotalWeight: totals.oranges.totalWeight,
      grandTotalBoxes: totals.grandTotal.boxes,
      grandTotalWeight: totals.grandTotal.weight,
      notes: formData.notes.trim(),
      createdAt,
    };
  };

  const orangeIntakeTotals = { weight: 0, boxes: 0 };

  const orangeCarryTotals = orangeCarryEntries.reduce(
    (totals, entry) => {
      totals.weight += entry.orangesTotalWeight;
      totals.boxes += entry.orangesTotalBoxes;
      return totals;
    },
    { weight: 0, boxes: 0 }
  );

  const orangeReturnTotals = orangeReturnEntries.reduce(
    (totals, entry) => {
      totals.weight += entry.orangesTotalWeight;
      totals.boxes += entry.orangesTotalBoxes;
      return totals;
    },
    { weight: 0, boxes: 0 }
  );

  const orangeSalesTotals = {
    weight: Math.max(0, orangeCarryTotals.weight - orangeReturnTotals.weight),
    boxes: Math.max(0, orangeCarryTotals.boxes - orangeReturnTotals.boxes),
  };

  const orangeMarketReturnsTotals = {
    weight: Math.max(0, orangeCarryTotals.weight - orangeSalesTotals.weight),
    boxes: Math.max(0, orangeCarryTotals.boxes - orangeSalesTotals.boxes),
  };

  const orangeCurrentStock = {
    weight: Math.max(0, orangeIntakeTotals.weight - orangeSalesTotals.weight),
    boxes: Math.max(0, orangeIntakeTotals.boxes - orangeSalesTotals.boxes),
  };

  const orangeTransactionRows = [
    ...orangeCarryEntries.map((entry) => ({ ...entry, type: 'Carry' as const })),
    ...orangeReturnEntries.map((entry) => ({ ...entry, type: 'Return' as const })),
  ].filter((entry) => {
    if (!orangeTransactionsFilterDate) {
      return true;
    }
    return format(new Date(entry.createdAt), 'yyyy-MM-dd') === orangeTransactionsFilterDate;
  });

  const handleAddOrangeCarry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orangeCarryForm.salesPersonName.trim()) {
      toast({
        title: 'Missing sales person',
        description: 'Please enter the sales person name before saving the carry entry.',
        variant: 'destructive',
      });
      return;
    }

    const newEntry = createEntryFromForm(
      orangeCarryForm,
      `${Date.now()}`,
      new Date().toISOString()
    );

    setOrangeCarryEntries((prev) => [newEntry, ...prev]);
    setOrangeCarryForm({
      salesPersonName: '',
      salesPersonPhone: '',
      vehiclePlate: '',
      lemonsClass1: '',
      lemonsClass2: '',
      lemonsClass3: '',
      citrusClass1: '',
      citrusClass2: '',
      citrusClass3: '',
      orangesClass1: '',
      orangesClass2: '',
      orangesClass3: '',
      notes: '',
    });

    toast({
      title: 'Carry entry saved',
      description: `${newEntry.salesPersonName} has been added to the orange carry log. Total: ${newEntry.grandTotalWeight.toFixed(1)} kg / ${newEntry.grandTotalBoxes} boxes`,
    });
  };

  const handleAddOrangeReturn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orangeReturnForm.salesPersonName.trim()) {
      toast({
        title: 'Missing sales person',
        description: 'Please enter the sales person name before saving the return entry.',
        variant: 'destructive',
      });
      return;
    }

    const newEntry = createEntryFromForm(
      orangeReturnForm,
      `${Date.now()}`,
      new Date().toISOString()
    );

    setOrangeReturnEntries((prev) => [newEntry, ...prev]);
    setOrangeReturnForm({
      salesPersonName: '',
      salesPersonPhone: '',
      vehiclePlate: '',
      lemonsClass1: '',
      lemonsClass2: '',
      lemonsClass3: '',
      citrusClass1: '',
      citrusClass2: '',
      citrusClass3: '',
      orangesClass1: '',
      orangesClass2: '',
      orangesClass3: '',
      notes: '',
    });

    toast({
      title: 'Return entry saved',
      description: `${newEntry.salesPersonName} has been added to the orange returns log. Total: ${newEntry.grandTotalWeight.toFixed(1)} kg / ${newEntry.grandTotalBoxes} boxes`,
    });
  };

  const handleStartOrangeCarryEdit = (entry: OrangeMovementEntry) => {
    setEditingOrangeCarryEntryId(entry.id);
    setOrangeCarryEditForm({
      salesPersonName: entry.salesPersonName,
      salesPersonPhone: entry.salesPersonPhone,
      vehiclePlate: entry.vehiclePlate,
      lemonsClass1: String(entry.lemonsClass1),
      lemonsClass2: String(entry.lemonsClass2),
      lemonsClass3: String(entry.lemonsClass3),
      citrusClass1: String(entry.citrusClass1),
      citrusClass2: String(entry.citrusClass2),
      citrusClass3: String(entry.citrusClass3),
      orangesClass1: String(entry.orangesClass1),
      orangesClass2: String(entry.orangesClass2),
      orangesClass3: String(entry.orangesClass3),
      notes: entry.notes,
    });
  };

  const handleSaveOrangeCarryEdit = (entryId: string) => {
    const updatedTotals = calculateTotals(orangeCarryEditForm);
    
    setOrangeCarryEntries((prev) => prev.map((entry) => {
      if (entry.id !== entryId) {
        return entry;
      }

      return {
        ...entry,
        salesPersonName: orangeCarryEditForm.salesPersonName.trim(),
        salesPersonPhone: orangeCarryEditForm.salesPersonPhone.trim(),
        vehiclePlate: orangeCarryEditForm.vehiclePlate.trim(),
        lemonsClass1: updatedTotals.lemons.class1,
        lemonsClass2: updatedTotals.lemons.class2,
        lemonsClass3: updatedTotals.lemons.class3,
        lemonsTotalBoxes: updatedTotals.lemons.totalBoxes,
        lemonsTotalWeight: updatedTotals.lemons.totalWeight,
        citrusClass1: updatedTotals.citrus.class1,
        citrusClass2: updatedTotals.citrus.class2,
        citrusClass3: updatedTotals.citrus.class3,
        citrusTotalBoxes: updatedTotals.citrus.totalBoxes,
        citrusTotalWeight: updatedTotals.citrus.totalWeight,
        orangesClass1: updatedTotals.oranges.class1,
        orangesClass2: updatedTotals.oranges.class2,
        orangesClass3: updatedTotals.oranges.class3,
        orangesTotalBoxes: updatedTotals.oranges.totalBoxes,
        orangesTotalWeight: updatedTotals.oranges.totalWeight,
        grandTotalBoxes: updatedTotals.grandTotal.boxes,
        grandTotalWeight: updatedTotals.grandTotal.weight,
        notes: orangeCarryEditForm.notes.trim(),
      };
    }));

    setEditingOrangeCarryEntryId(null);
    setOrangeCarryEditForm({
      salesPersonName: '',
      salesPersonPhone: '',
      vehiclePlate: '',
      lemonsClass1: '',
      lemonsClass2: '',
      lemonsClass3: '',
      citrusClass1: '',
      citrusClass2: '',
      citrusClass3: '',
      orangesClass1: '',
      orangesClass2: '',
      orangesClass3: '',
      notes: '',
    });

    toast({
      title: 'Carry entry updated',
      description: 'The orange carry entry has been updated.',
    });
  };

  const handleCancelOrangeCarryEdit = () => {
    setEditingOrangeCarryEntryId(null);
    setOrangeCarryEditForm({
      salesPersonName: '',
      salesPersonPhone: '',
      vehiclePlate: '',
      lemonsClass1: '',
      lemonsClass2: '',
      lemonsClass3: '',
      citrusClass1: '',
      citrusClass2: '',
      citrusClass3: '',
      orangesClass1: '',
      orangesClass2: '',
      orangesClass3: '',
      notes: '',
    });
  };

  const handleDownloadOrangeGrn = (entry: OrangeMovementEntry) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    doc.setFontSize(16);
    doc.text('Delivery Note / GRN', 14, 14);
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(entry.createdAt), 'dd MMM yyyy HH:mm')}`, 14, 24);
    doc.text(`Sales person: ${entry.salesPersonName || 'N/A'}`, 14, 32);
    doc.text(`Phone: ${entry.salesPersonPhone || 'N/A'}`, 14, 38);
    doc.text(`Vehicle: ${entry.vehiclePlate || 'N/A'}`, 14, 44);
    
    let yPos = 54;
    doc.text('--- Product Details ---', 14, yPos);
    yPos += 6;
    
    // Lemons
    doc.text(`Lemons:`, 14, yPos);
    doc.text(`  Class 1: ${entry.lemonsClass1} boxes`, 14, yPos + 5);
    doc.text(`  Class 2: ${entry.lemonsClass2} boxes`, 14, yPos + 10);
    doc.text(`  Class 3: ${entry.lemonsClass3} boxes`, 14, yPos + 15);
    doc.text(`  Total: ${entry.lemonsTotalBoxes} boxes / ${entry.lemonsTotalWeight.toFixed(1)} kg`, 14, yPos + 20);
    yPos += 26;
    
    // Citrus/Tangerines
    doc.text(`Tangerines:`, 14, yPos);
    doc.text(`  Class 1: ${entry.citrusClass1} boxes`, 14, yPos + 5);
    doc.text(`  Class 2: ${entry.citrusClass2} boxes`, 14, yPos + 10);
    doc.text(`  Class 3: ${entry.citrusClass3} boxes`, 14, yPos + 15);
    doc.text(`  Total: ${entry.citrusTotalBoxes} boxes / ${entry.citrusTotalWeight.toFixed(1)} kg`, 14, yPos + 20);
    yPos += 26;
    
    // Oranges
    doc.text(`Oranges:`, 14, yPos);
    doc.text(`  Class 1: ${entry.orangesClass1} boxes`, 14, yPos + 5);
    doc.text(`  Class 2: ${entry.orangesClass2} boxes`, 14, yPos + 10);
    doc.text(`  Class 3: ${entry.orangesClass3} boxes`, 14, yPos + 15);
    doc.text(`  Total: ${entry.orangesTotalBoxes} boxes / ${entry.orangesTotalWeight.toFixed(1)} kg`, 14, yPos + 20);
    yPos += 30;
    
    doc.text(`GRAND TOTAL: ${entry.grandTotalBoxes} boxes / ${entry.grandTotalWeight.toFixed(1)} kg`, 14, yPos);
    yPos += 8;
    doc.text(`Notes: ${entry.notes || 'N/A'}`, 14, yPos);
    
    doc.save(`orange-grn-${entry.id}.pdf`);
  };

  const handleExportOrangeTransactions = () => {
    const exportRows = orangeTransactionRows.map((entry) => ({
      date: format(new Date(entry.createdAt), 'dd MMM yyyy HH:mm'),
      type: entry.type,
      salesPersonName: entry.salesPersonName,
      salesPersonPhone: entry.salesPersonPhone,
      vehiclePlate: entry.vehiclePlate,
      'Lemons Class 1': entry.lemonsClass1,
      'Lemons Class 2': entry.lemonsClass2,
      'Lemons Class 3': entry.lemonsClass3,
      'Lemons Total Boxes': entry.lemonsTotalBoxes,
      'Lemons Total Weight': entry.lemonsTotalWeight,
      'Tangerines Class 1': entry.citrusClass1,
      'Tangerines Class 2': entry.citrusClass2,
      'Tangerines Class 3': entry.citrusClass3,
      'Tangerines Total Boxes': entry.citrusTotalBoxes,
      'Tangerines Total Weight': entry.citrusTotalWeight,
      'Oranges Class 1': entry.orangesClass1,
      'Oranges Class 2': entry.orangesClass2,
      'Oranges Class 3': entry.orangesClass3,
      'Oranges Total Boxes': entry.orangesTotalBoxes,
      'Oranges Total Weight': entry.orangesTotalWeight,
      'Grand Total Boxes': entry.grandTotalBoxes,
      'Grand Total Weight': entry.grandTotalWeight,
      notes: entry.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orange Transactions');
    XLSX.writeFile(workbook, 'orange-transactions.xlsx');
  };

  // Render class input fields for a fruit type
  const renderClassInputs = (prefix: string, label: string, form: any, setForm: any, boxWeight: number) => {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-300">{label} ({boxWeight}kg boxes)</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-class1`}>Class 1 (boxes)</Label>
            <Input
              id={`${prefix}-class1`}
              type="number"
              min="0"
              value={form[`${prefix}Class1`]}
              onChange={(event) => setForm((prev: any) => ({ ...prev, [`${prefix}Class1`]: event.target.value }))}
              placeholder="0"
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-class2`}>Class 2 (boxes)</Label>
            <Input
              id={`${prefix}-class2`}
              type="number"
              min="0"
              value={form[`${prefix}Class2`]}
              onChange={(event) => setForm((prev: any) => ({ ...prev, [`${prefix}Class2`]: event.target.value }))}
              placeholder="0"
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-class3`}>Class 3 (boxes)</Label>
            <Input
              id={`${prefix}-class3`}
              type="number"
              min="0"
              value={form[`${prefix}Class3`]}
              onChange={(event) => setForm((prev: any) => ({ ...prev, [`${prefix}Class3`]: event.target.value }))}
              placeholder="0"
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
        <div className="mt-3 text-right text-sm text-gray-400">
          Subtotal: {(() => {
            const total = (Number(form[`${prefix}Class1`]) || 0) + 
                         (Number(form[`${prefix}Class2`]) || 0) + 
                         (Number(form[`${prefix}Class3`]) || 0);
            return `${total} boxes = ${total * boxWeight} kg`;
          })()}
        </div>
      </div>
    );
  };

  // Render entry details for display
  const renderEntryDetails = (entry: OrangeMovementEntry) => {
    return (
      <div className="grid gap-2 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="font-semibold text-orange-400">Oranges (15kg)</p>
            <p className="text-gray-400">C1: {entry.orangesClass1}</p>
            <p className="text-gray-400">C2: {entry.orangesClass2}</p>
            <p className="text-gray-400">C3: {entry.orangesClass3}</p>
            <p className="text-white font-semibold">Total: {entry.orangesTotalBoxes} boxes / {entry.orangesTotalWeight.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="font-semibold text-yellow-400">Lemons (15kg)</p>
            <p className="text-gray-400">C1: {entry.lemonsClass1}</p>
            <p className="text-gray-400">C2: {entry.lemonsClass2}</p>
            <p className="text-gray-400">C3: {entry.lemonsClass3}</p>
            <p className="text-white font-semibold">Total: {entry.lemonsTotalBoxes} boxes / {entry.lemonsTotalWeight.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="font-semibold text-amber-400">Tangerines (20kg)</p>
            <p className="text-gray-400">C1: {entry.citrusClass1}</p>
            <p className="text-gray-400">C2: {entry.citrusClass2}</p>
            <p className="text-gray-400">C3: {entry.citrusClass3}</p>
            <p className="text-white font-semibold">Total: {entry.citrusTotalBoxes} boxes / {entry.citrusTotalWeight.toFixed(1)} kg</p>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-2 mt-2">
          <p className="font-bold text-purple-400">
            GRAND TOTAL: {entry.grandTotalBoxes} boxes = {entry.grandTotalWeight.toFixed(1)} kg
          </p>
        </div>
      </div>
    );
  };

  // Render edit form fields
  const renderEditFields = (form: any, setForm: any) => {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Sales person</Label>
            <Input 
              value={form.salesPersonName} 
              onChange={(event) => setForm((prev: any) => ({ ...prev, salesPersonName: event.target.value }))}
              className="bg-black border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input 
              value={form.salesPersonPhone} 
              onChange={(event) => setForm((prev: any) => ({ ...prev, salesPersonPhone: event.target.value }))}
              className="bg-black border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Vehicle plate</Label>
            <Input 
              value={form.vehiclePlate} 
              onChange={(event) => setForm((prev: any) => ({ ...prev, vehiclePlate: event.target.value }))}
              className="bg-black border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Edit Oranges */}
        <div className="border border-gray-700 rounded-lg p-3">
          <p className="font-semibold text-orange-400 mb-2">Oranges (15kg boxes)</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 1</Label>
              <Input type="number" value={form.orangesClass1} onChange={(e) => setForm((prev: any) => ({ ...prev, orangesClass1: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 2</Label>
              <Input type="number" value={form.orangesClass2} onChange={(e) => setForm((prev: any) => ({ ...prev, orangesClass2: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 3</Label>
              <Input type="number" value={form.orangesClass3} onChange={(e) => setForm((prev: any) => ({ ...prev, orangesClass3: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
          </div>
        </div>

        {/* Edit Lemons */}
        <div className="border border-gray-700 rounded-lg p-3">
          <p className="font-semibold text-yellow-400 mb-2">Lemons (15kg boxes)</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 1</Label>
              <Input type="number" value={form.lemonsClass1} onChange={(e) => setForm((prev: any) => ({ ...prev, lemonsClass1: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 2</Label>
              <Input type="number" value={form.lemonsClass2} onChange={(e) => setForm((prev: any) => ({ ...prev, lemonsClass2: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 3</Label>
              <Input type="number" value={form.lemonsClass3} onChange={(e) => setForm((prev: any) => ({ ...prev, lemonsClass3: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
          </div>
        </div>

        {/* Edit Tangerines */}
        <div className="border border-gray-700 rounded-lg p-3">
          <p className="font-semibold text-amber-400 mb-2">Tangerines (20kg boxes)</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 1</Label>
              <Input type="number" value={form.citrusClass1} onChange={(e) => setForm((prev: any) => ({ ...prev, citrusClass1: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 2</Label>
              <Input type="number" value={form.citrusClass2} onChange={(e) => setForm((prev: any) => ({ ...prev, citrusClass2: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Class 3</Label>
              <Input type="number" value={form.citrusClass3} onChange={(e) => setForm((prev: any) => ({ ...prev, citrusClass3: e.target.value }))} className="bg-black border-gray-700 text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea 
            value={form.notes} 
            onChange={(event) => setForm((prev: any) => ({ ...prev, notes: event.target.value }))}
            className="bg-black border-gray-700 text-white"
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-700 bg-[#111827] shadow-sm min-h-[calc(100vh-8rem)]">
      <CardHeader className="border-b border-slate-700 bg-slate-950 text-white">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
          <Apple className="h-5 w-5 text-amber-400" />
          Oranges Operations Module
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-slate-300">
          Record carry-outs, returns, and sales with Class 1, 2, 3 grading. Oranges & Lemons: 15kg boxes, Tangerines: 20kg boxes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-300">Orange intake</p>
            <p className="mt-2 text-2xl font-semibold text-white">{orangeIntakeTotals.weight.toFixed(1)} kg</p>
            <p className="text-sm text-slate-400">{orangeIntakeTotals.boxes} boxes</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-300">Carried</p>
            <p className="mt-2 text-2xl font-semibold text-white">{orangeCarryTotals.weight.toFixed(1)} kg</p>
            <p className="text-sm text-slate-400">{orangeCarryTotals.boxes} boxes</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-300">Returns from market</p>
            <p className="mt-2 text-2xl font-semibold text-white">{orangeMarketReturnsTotals.weight.toFixed(1)} kg</p>
            <p className="text-sm text-slate-400">{orangeMarketReturnsTotals.boxes} boxes</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-300">Current stock</p>
            <p className="mt-2 text-2xl font-semibold text-white">{orangeCurrentStock.weight.toFixed(1)} kg</p>
            <p className="text-sm text-slate-400">{orangeCurrentStock.boxes} boxes</p>
          </div>
        </div>

        <Tabs value={orangeActiveTab} onValueChange={(value) => setOrangeActiveTab(value as 'carry' | 'returns' | 'transactions' | 'stock')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-900/80 p-1 rounded-xl">
            <TabsTrigger value="carry">Carry</TabsTrigger>
            <TabsTrigger value="returns">Returns</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="carry" className="mt-6 space-y-6 rounded-2xl bg-slate-950/40 p-2 sm:p-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-slate-900 p-2 text-white">
                  <Truck className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white">Carry-out details</h3>
              </div>
              <form onSubmit={handleAddOrangeCarry} className="space-y-4">
                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-300">Sales details</h4>
                  <p className="mb-3 text-sm text-slate-400">Capture the sales person, phone, and vehicle details before recording movement.</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="orange-carry-salesperson" className="text-gray-300">Sales person name</Label>
                      <Input 
                        id="orange-carry-salesperson" 
                        value={orangeCarryForm.salesPersonName} 
                        onChange={(event) => setOrangeCarryForm((prev) => ({ ...prev, salesPersonName: event.target.value }))} 
                        placeholder="Name"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orange-carry-phone" className="text-gray-300">Phone number</Label>
                      <Input 
                        id="orange-carry-phone" 
                        value={orangeCarryForm.salesPersonPhone} 
                        onChange={(event) => setOrangeCarryForm((prev) => ({ ...prev, salesPersonPhone: event.target.value }))} 
                        placeholder="Phone"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orange-carry-vehicle" className="text-gray-300">Vehicle plate number</Label>
                      <Input 
                        id="orange-carry-vehicle" 
                        value={orangeCarryForm.vehiclePlate} 
                        onChange={(event) => setOrangeCarryForm((prev) => ({ ...prev, vehiclePlate: event.target.value }))} 
                        placeholder="KAA 000A"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Oranges */}
                {renderClassInputs('oranges', 'Oranges', orangeCarryForm, setOrangeCarryForm, 15)}

                {/* Lemons */}
                {renderClassInputs('lemons', 'Lemons', orangeCarryForm, setOrangeCarryForm, 15)}

                {/* Tangerines */}
                {renderClassInputs('citrus', 'Tangerines', orangeCarryForm, setOrangeCarryForm, 20)}

                {/* Grand Total Preview */}
                <div className="rounded-xl border border-purple-700 bg-purple-950/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-purple-400" />
                    <h4 className="text-sm font-semibold text-purple-300">Grand Total Preview</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-purple-300">Oranges</div>
                      <div className="font-bold text-white">
                        {(Number(orangeCarryForm.orangesClass1) || 0) + (Number(orangeCarryForm.orangesClass2) || 0) + (Number(orangeCarryForm.orangesClass3) || 0)} boxes
                      </div>
                      <div className="text-xs text-purple-300">
                        {((Number(orangeCarryForm.orangesClass1) || 0) + (Number(orangeCarryForm.orangesClass2) || 0) + (Number(orangeCarryForm.orangesClass3) || 0)) * 15} kg
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-300">Lemons</div>
                      <div className="font-bold text-white">
                        {(Number(orangeCarryForm.lemonsClass1) || 0) + (Number(orangeCarryForm.lemonsClass2) || 0) + (Number(orangeCarryForm.lemonsClass3) || 0)} boxes
                      </div>
                      <div className="text-xs text-purple-300">
                        {((Number(orangeCarryForm.lemonsClass1) || 0) + (Number(orangeCarryForm.lemonsClass2) || 0) + (Number(orangeCarryForm.lemonsClass3) || 0)) * 15} kg
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-300">Tangerines</div>
                      <div className="font-bold text-white">
                        {(Number(orangeCarryForm.citrusClass1) || 0) + (Number(orangeCarryForm.citrusClass2) || 0) + (Number(orangeCarryForm.citrusClass3) || 0)} boxes
                      </div>
                      <div className="text-xs text-purple-300">
                        {((Number(orangeCarryForm.citrusClass1) || 0) + (Number(orangeCarryForm.citrusClass2) || 0) + (Number(orangeCarryForm.citrusClass3) || 0)) * 20} kg
                      </div>
                    </div>
                    <div className="text-center border-l border-purple-700 pl-4">
                      <div className="text-xs text-purple-300">GRAND TOTAL</div>
                      <div className="font-bold text-xl text-purple-300">
                        {(() => {
                          const orangesBoxes = (Number(orangeCarryForm.orangesClass1) || 0) + (Number(orangeCarryForm.orangesClass2) || 0) + (Number(orangeCarryForm.orangesClass3) || 0);
                          const lemonsBoxes = (Number(orangeCarryForm.lemonsClass1) || 0) + (Number(orangeCarryForm.lemonsClass2) || 0) + (Number(orangeCarryForm.lemonsClass3) || 0);
                          const citrusBoxes = (Number(orangeCarryForm.citrusClass1) || 0) + (Number(orangeCarryForm.citrusClass2) || 0) + (Number(orangeCarryForm.citrusClass3) || 0);
                          const totalBoxes = orangesBoxes + lemonsBoxes + citrusBoxes;
                          const totalWeight = (orangesBoxes * 15) + (lemonsBoxes * 15) + (citrusBoxes * 20);
                          return `${totalBoxes} boxes = ${totalWeight} kg`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orange-carry-notes" className="text-gray-300">Notes</Label>
                  <Textarea 
                    id="orange-carry-notes" 
                    value={orangeCarryForm.notes} 
                    onChange={(event) => setOrangeCarryForm((prev) => ({ ...prev, notes: event.target.value }))} 
                    placeholder="Any relevant notes"
                    className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">Save carry entry</Button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Carry history</h3>
                <Badge variant="secondary" className="bg-slate-800 text-gray-300">{orangeCarryEntries.length}</Badge>
              </div>
              {orangeCarryEntries.length > 0 ? (
                <div className="space-y-3">
                  {orangeCarryEntries.map((entry) => {
                    const isEditing = editingOrangeCarryEntryId === entry.id;
                    return (
                      <div key={entry.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
                        {isEditing ? (
                          <div className="space-y-3">
                            {renderEditFields(orangeCarryEditForm, setOrangeCarryEditForm)}
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" onClick={() => handleSaveOrangeCarryEdit(entry.id)}>Save</Button>
                              <Button type="button" variant="outline" size="sm" onClick={handleCancelOrangeCarryEdit}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="font-semibold text-white">{entry.salesPersonName}</p>
                              <p className="text-sm text-gray-400">{entry.salesPersonPhone || 'No phone'} • {entry.vehiclePlate || 'No plate'}</p>
                              <p className="text-sm text-gray-400">{format(new Date(entry.createdAt), 'dd MMM yyyy • HH:mm')}</p>
                              {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                            </div>
                            <div className="flex-1">
                              {renderEntryDetails(entry)}
                            </div>
                          </div>
                        )}
                        {!isEditing && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => handleStartOrangeCarryEdit(entry)} className="border-gray-700 text-gray-300 hover:bg-slate-800">Edit</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadOrangeGrn(entry)} className="border-gray-700 text-gray-300 hover:bg-slate-800">
                              <Download className="mr-2 h-4 w-4" />GRN (A5)
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">No carry entries have been recorded yet.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="returns" className="mt-6 space-y-6 rounded-2xl bg-slate-950/40 p-2 sm:p-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-slate-900 p-2 text-white">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white">Returns details</h3>
              </div>
              <form onSubmit={handleAddOrangeReturn} className="space-y-4">
                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-300">Sales details</h4>
                  <p className="mb-3 text-sm text-slate-400">Capture the sales person, phone, and vehicle details before recording movement.</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="orange-return-salesperson" className="text-gray-300">Sales person name</Label>
                      <Input 
                        id="orange-return-salesperson" 
                        value={orangeReturnForm.salesPersonName} 
                        onChange={(event) => setOrangeReturnForm((prev) => ({ ...prev, salesPersonName: event.target.value }))} 
                        placeholder="Name"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orange-return-phone" className="text-gray-300">Phone number</Label>
                      <Input 
                        id="orange-return-phone" 
                        value={orangeReturnForm.salesPersonPhone} 
                        onChange={(event) => setOrangeReturnForm((prev) => ({ ...prev, salesPersonPhone: event.target.value }))} 
                        placeholder="Phone"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orange-return-vehicle" className="text-gray-300">Vehicle plate number</Label>
                      <Input 
                        id="orange-return-vehicle" 
                        value={orangeReturnForm.vehiclePlate} 
                        onChange={(event) => setOrangeReturnForm((prev) => ({ ...prev, vehiclePlate: event.target.value }))} 
                        placeholder="KAA 000A"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Oranges */}
                {renderClassInputs('oranges', 'Oranges', orangeReturnForm, setOrangeReturnForm, 15)}

                {/* Lemons */}
                {renderClassInputs('lemons', 'Lemons', orangeReturnForm, setOrangeReturnForm, 15)}

                {/* Tangerines */}
                {renderClassInputs('citrus', 'Tangerines', orangeReturnForm, setOrangeReturnForm, 20)}

                {/* Grand Total Preview */}
                <div className="rounded-xl border border-purple-700 bg-purple-950/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-purple-400" />
                    <h4 className="text-sm font-semibold text-purple-300">Grand Total Preview</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-purple-300">Oranges</div>
                      <div className="font-bold text-white">
                        {(Number(orangeReturnForm.orangesClass1) || 0) + (Number(orangeReturnForm.orangesClass2) || 0) + (Number(orangeReturnForm.orangesClass3) || 0)} boxes
                      </div>
                      <div className="text-xs text-purple-300">
                        {((Number(orangeReturnForm.orangesClass1) || 0) + (Number(orangeReturnForm.orangesClass2) || 0) + (Number(orangeReturnForm.orangesClass3) || 0)) * 15} kg
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-300">Lemons</div>
                      <div className="font-bold text-white">
                        {(Number(orangeReturnForm.lemonsClass1) || 0) + (Number(orangeReturnForm.lemonsClass2) || 0) + (Number(orangeReturnForm.lemonsClass3) || 0)} boxes
                      </div>
                      <div className="text-xs text-purple-300">
                        {((Number(orangeReturnForm.lemonsClass1) || 0) + (Number(orangeReturnForm.lemonsClass2) || 0) + (Number(orangeReturnForm.lemonsClass3) || 0)) * 15} kg
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-purple-300">Tangerines</div>
                      <div className="font-bold text-white">
                        {(Number(orangeReturnForm.citrusClass1) || 0) + (Number(orangeReturnForm.citrusClass2) || 0) + (Number(orangeReturnForm.citrusClass3) || 0)} boxes
                      </div>
                      <div className="text-xs text-purple-300">
                        {((Number(orangeReturnForm.citrusClass1) || 0) + (Number(orangeReturnForm.citrusClass2) || 0) + (Number(orangeReturnForm.citrusClass3) || 0)) * 20} kg
                      </div>
                    </div>
                    <div className="text-center border-l border-purple-700 pl-4">
                      <div className="text-xs text-purple-300">GRAND TOTAL</div>
                      <div className="font-bold text-xl text-purple-300">
                        {(() => {
                          const orangesBoxes = (Number(orangeReturnForm.orangesClass1) || 0) + (Number(orangeReturnForm.orangesClass2) || 0) + (Number(orangeReturnForm.orangesClass3) || 0);
                          const lemonsBoxes = (Number(orangeReturnForm.lemonsClass1) || 0) + (Number(orangeReturnForm.lemonsClass2) || 0) + (Number(orangeReturnForm.lemonsClass3) || 0);
                          const citrusBoxes = (Number(orangeReturnForm.citrusClass1) || 0) + (Number(orangeReturnForm.citrusClass2) || 0) + (Number(orangeReturnForm.citrusClass3) || 0);
                          const totalBoxes = orangesBoxes + lemonsBoxes + citrusBoxes;
                          const totalWeight = (orangesBoxes * 15) + (lemonsBoxes * 15) + (citrusBoxes * 20);
                          return `${totalBoxes} boxes = ${totalWeight} kg`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orange-return-notes" className="text-gray-300">Notes</Label>
                  <Textarea 
                    id="orange-return-notes" 
                    value={orangeReturnForm.notes} 
                    onChange={(event) => setOrangeReturnForm((prev) => ({ ...prev, notes: event.target.value }))} 
                    placeholder="Any relevant notes"
                    className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">Save return entry</Button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Return history</h3>
                <Badge variant="secondary" className="bg-slate-800 text-gray-300">{orangeReturnEntries.length}</Badge>
              </div>
              {orangeReturnEntries.length > 0 ? (
                <div className="space-y-3">
                  {orangeReturnEntries.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-semibold text-white">{entry.salesPersonName}</p>
                          <p className="text-sm text-gray-400">{entry.salesPersonPhone || 'No phone'} • {entry.vehiclePlate || 'No plate'}</p>
                          <p className="text-sm text-gray-400">{format(new Date(entry.createdAt), 'dd MMM yyyy • HH:mm')}</p>
                          {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                        </div>
                        <div className="flex-1">
                          {renderEntryDetails(entry)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">No return entries have been recorded yet.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6 space-y-6 rounded-2xl bg-slate-950/40 p-2 sm:p-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">All transactions</h3>
                  <p className="text-sm text-slate-400">Returns are the market returns after sales, so sales = carried - returns.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input 
                    type="date" 
                    value={orangeTransactionsFilterDate} 
                    onChange={(event) => setOrangeTransactionsFilterDate(event.target.value)} 
                    className="w-auto bg-black border-gray-700 text-white"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setOrangeTransactionsFilterDate('')} className="border-gray-700 text-gray-300 hover:bg-slate-800">Clear</Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleExportOrangeTransactions} className="border-gray-700 text-gray-300 hover:bg-slate-800">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />Export Excel
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-blue-900 bg-blue-950/50 p-3">
                  <p className="text-sm text-blue-300">Total carried</p>
                  <p className="text-xl font-semibold text-white">{orangeCarryTotals.weight.toFixed(1)} kg</p>
                  <p className="text-sm text-slate-400">{orangeCarryTotals.boxes} boxes</p>
                </div>
                <div className="rounded-lg border border-amber-900 bg-amber-950/50 p-3">
                  <p className="text-sm text-amber-300">Total returns</p>
                  <p className="text-xl font-semibold text-white">{orangeMarketReturnsTotals.weight.toFixed(1)} kg</p>
                  <p className="text-sm text-slate-400">{orangeMarketReturnsTotals.boxes} boxes</p>
                </div>
                <div className="rounded-lg border border-emerald-900 bg-emerald-950/50 p-3">
                  <p className="text-sm text-emerald-300">Total sales</p>
                  <p className="text-xl font-semibold text-white">{orangeSalesTotals.weight.toFixed(1)} kg</p>
                  <p className="text-sm text-slate-400">{orangeSalesTotals.boxes} boxes</p>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Type</TableHead>
                      <TableHead className="text-gray-300">Sales person</TableHead>
                      <TableHead className="text-gray-300">Vehicle</TableHead>
                      <TableHead className="text-gray-300">Oranges</TableHead>
                      <TableHead className="text-gray-300">Lemons</TableHead>
                      <TableHead className="text-gray-300">Tangerines</TableHead>
                      <TableHead className="text-gray-300">Grand Total</TableHead>
                      <TableHead className="text-gray-300">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orangeTransactionRows.length > 0 ? orangeTransactionRows.map((entry) => (
                      <TableRow key={`${entry.type}-${entry.id}`}>
                        <TableCell className="text-gray-300">{format(new Date(entry.createdAt), 'dd MMM yyyy • HH:mm')}</TableCell>
                        <TableCell>
                          <Badge variant={entry.type === 'Carry' ? 'default' : 'secondary'} className={entry.type === 'Carry' ? 'bg-blue-600' : 'bg-amber-600'}>
                            {entry.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{entry.salesPersonName}</TableCell>
                        <TableCell className="text-gray-300">{entry.vehiclePlate || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">{entry.orangesTotalBoxes} boxes / {entry.orangesTotalWeight.toFixed(1)} kg</TableCell>
                        <TableCell className="text-gray-300">{entry.lemonsTotalBoxes} boxes / {entry.lemonsTotalWeight.toFixed(1)} kg</TableCell>
                        <TableCell className="text-gray-300">{entry.citrusTotalBoxes} boxes / {entry.citrusTotalWeight.toFixed(1)} kg</TableCell>
                        <TableCell className="text-purple-400 font-semibold">{entry.grandTotalBoxes} boxes / {entry.grandTotalWeight.toFixed(1)} kg</TableCell>
                        <TableCell className="max-w-[220px] whitespace-normal text-gray-400">{entry.notes || '—'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-sm text-gray-500">No transactions for the selected date.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="mt-6 space-y-6 rounded-2xl bg-slate-950/40 p-2 sm:p-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-300">Current remaining stock</h3>
                  <p className="text-sm text-emerald-400">Calculated from orange intake minus sales.</p>
                </div>
                <div className="rounded-lg border border-emerald-800 bg-slate-950/70 p-3 text-sm">
                  <p className="font-semibold text-white">{orangeCurrentStock.weight.toFixed(1)} kg</p>
                  <p className="text-slate-400">{orangeCurrentStock.boxes} boxes</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <p className="text-sm text-slate-400">Orange intake</p>
                  <p className="text-xl font-semibold text-white">{orangeIntakeTotals.weight.toFixed(1)} kg</p>
                  <p className="text-sm text-slate-400">{orangeIntakeTotals.boxes} boxes</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <p className="text-sm text-slate-400">Sales</p>
                  <p className="text-xl font-semibold text-white">{orangeSalesTotals.weight.toFixed(1)} kg</p>
                  <p className="text-sm text-slate-400">{orangeSalesTotals.boxes} boxes</p>
                </div>
                <div className="rounded-lg border border-emerald-800 bg-slate-950/60 p-3">
                  <p className="text-sm text-slate-400">Remaining</p>
                  <p className="text-xl font-semibold text-white">{orangeCurrentStock.weight.toFixed(1)} kg</p>
                  <p className="text-sm text-slate-400">{orangeCurrentStock.boxes} boxes</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
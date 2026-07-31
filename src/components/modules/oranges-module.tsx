'use client';

import { useState, useCallback, useEffect, Fragment } from 'react';
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
import { logActivity, ActivityTypes } from '@/lib/activity-logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface OrangeMovementEntry {
  id: string;
  carryId?: string;
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

const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return session?.user || { name: 'System', id: 'system' };
  } catch (error) {
    return { name: 'System', id: 'system' };
  }
};

export function OrangesModule() {
  const { toast } = useToast();

  // Orange Carry-out Form with Classes
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
  const [editingOrangeReturnEntryId, setEditingOrangeReturnEntryId] = useState<string | null>(null);
  const [orangeReturnEditForm, setOrangeReturnEditForm] = useState({
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
  const [selectedCarryForReturn, setSelectedCarryForReturn] = useState<OrangeMovementEntry | null>(null);
  const [selectedCarryDetail, setSelectedCarryDetail] = useState<OrangeMovementEntry | null>(null);
  const [orangeCarryFilterDate, setOrangeCarryFilterDate] = useState('');
  const [orangeTransactionsFilterDate, setOrangeTransactionsFilterDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<OrangeTransactionRow | null>(null);
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

  const [intakeTotals, setIntakeTotals] = useState({
    weight: 0, boxes: 0,
    orangesWeight: 0, orangesBoxes: 0, orangesC1: 0, orangesC2: 0, orangesC3: 0,
    lemonsWeight: 0, lemonsBoxes: 0, lemonsC1: 0, lemonsC2: 0, lemonsC3: 0,
    tangerinesWeight: 0, tangerinesBoxes: 0, tangerinesC1: 0, tangerinesC2: 0, tangerinesC3: 0,
  });

  const fetchCitrusIntake = useCallback(async () => {
    try {
      const response = await fetch('/api/citrus-intake?limit=500&order=desc');
      if (response.ok) {
        const data = await response.json();
        const totals = data.reduce(
          (acc: any, entry: any) => {
            acc.weight += entry.grand_total_weight || 0;
            acc.boxes += entry.grand_total_boxes || 0;
            acc.orangesWeight += entry.oranges_total_weight || 0;
            acc.orangesBoxes += entry.oranges_total_boxes || 0;
            acc.orangesC1 += entry.oranges_class1 || 0;
            acc.orangesC2 += entry.oranges_class2 || 0;
            acc.orangesC3 += entry.oranges_class3 || 0;
            acc.lemonsWeight += entry.lemons_total_weight || 0;
            acc.lemonsBoxes += entry.lemons_total_boxes || 0;
            acc.lemonsC1 += entry.lemons_class1 || 0;
            acc.lemonsC2 += entry.lemons_class2 || 0;
            acc.lemonsC3 += entry.lemons_class3 || 0;
            acc.tangerinesWeight += entry.tangerines_total_weight || 0;
            acc.tangerinesBoxes += entry.tangerines_total_boxes || 0;
            acc.tangerinesC1 += entry.tangerines_class1 || 0;
            acc.tangerinesC2 += entry.tangerines_class2 || 0;
            acc.tangerinesC3 += entry.tangerines_class3 || 0;
            return acc;
          },
          { weight: 0, boxes: 0, orangesWeight: 0, orangesBoxes: 0, orangesC1: 0, orangesC2: 0, orangesC3: 0, lemonsWeight: 0, lemonsBoxes: 0, lemonsC1: 0, lemonsC2: 0, lemonsC3: 0, tangerinesWeight: 0, tangerinesBoxes: 0, tangerinesC1: 0, tangerinesC2: 0, tangerinesC3: 0 }
        );
        setIntakeTotals(totals);
      }
    } catch (error: any) {
      console.error('Error fetching citrus intake:', error);
    }
  }, []);

  const mapMovement = (entry: any): OrangeMovementEntry => ({
    id: entry.id,
    carryId: entry.carry_id || undefined,
    salesPersonName: entry.sales_person_name,
    salesPersonPhone: entry.sales_person_phone || '',
    vehiclePlate: entry.vehicle_plate || '',
    lemonsClass1: entry.lemons_class1, lemonsClass2: entry.lemons_class2, lemonsClass3: entry.lemons_class3,
    lemonsTotalBoxes: entry.lemons_total_boxes, lemonsTotalWeight: entry.lemons_total_weight,
    citrusClass1: entry.tangerines_class1, citrusClass2: entry.tangerines_class2, citrusClass3: entry.tangerines_class3,
    citrusTotalBoxes: entry.tangerines_total_boxes, citrusTotalWeight: entry.tangerines_total_weight,
    orangesClass1: entry.oranges_class1, orangesClass2: entry.oranges_class2, orangesClass3: entry.oranges_class3,
    orangesTotalBoxes: entry.oranges_total_boxes, orangesTotalWeight: entry.oranges_total_weight,
    grandTotalBoxes: entry.grand_total_boxes, grandTotalWeight: entry.grand_total_weight,
    notes: entry.notes || '',
    createdAt: entry.created_at,
  });

  const fetchMovements = useCallback(async () => {
    try {
      const [carryRes, returnRes] = await Promise.all([
        fetch('/api/citrus-movements?type=carry&limit=500'),
        fetch('/api/citrus-movements?type=return&limit=500'),
      ]);
      if (carryRes.ok) {
        const data = await carryRes.json();
        setOrangeCarryEntries(data.map(mapMovement));
      }
      if (returnRes.ok) {
        const data = await returnRes.json();
        setOrangeReturnEntries(data.map(mapMovement));
      }
    } catch (error: any) {
      console.error('Error fetching movements:', error);
    }
  }, []);

  const deleteMovement = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/citrus-movements?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error || 'Failed to delete' };
      }
      return { ok: true };
    } catch (error: any) {
      console.error('Error deleting movement:', error);
      return { ok: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchCitrusIntake();
    fetchMovements();
  }, [fetchCitrusIntake, fetchMovements]);

  const orangeIntakeTotals = { weight: intakeTotals.weight, boxes: intakeTotals.boxes };

  const orangeCarryTotals = orangeCarryEntries.reduce(
    (totals, entry) => {
      totals.weight += entry.grandTotalWeight;
      totals.boxes += entry.grandTotalBoxes;
      return totals;
    },
    { weight: 0, boxes: 0 }
  );

  const orangeReturnTotals = orangeReturnEntries.reduce(
    (totals, entry) => {
      totals.weight += entry.grandTotalWeight;
      totals.boxes += entry.grandTotalBoxes;
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

  interface OrangeTransactionRow {
    carry: OrangeMovementEntry;
    returns: OrangeMovementEntry[];
    netOranges: number;
    netLemons: number;
    netTangerines: number;
    netBoxes: number;
    netWeight: number;
  }

  const orangeTransactionRows: OrangeTransactionRow[] = orangeCarryEntries
    .filter((carry) => {
      if (!orangeTransactionsFilterDate) return true;
      return format(new Date(carry.createdAt), 'yyyy-MM-dd') === orangeTransactionsFilterDate;
    })
    .map((carry) => {
      const linkedReturns = orangeReturnEntries.filter((r) => r.carryId === carry.id);
      const netOranges = Math.max(0, carry.orangesTotalBoxes - linkedReturns.reduce((s, r) => s + r.orangesTotalBoxes, 0));
      const netLemons = Math.max(0, carry.lemonsTotalBoxes - linkedReturns.reduce((s, r) => s + r.lemonsTotalBoxes, 0));
      const netTangerines = Math.max(0, carry.citrusTotalBoxes - linkedReturns.reduce((s, r) => s + r.citrusTotalBoxes, 0));
      const netBoxes = netOranges + netLemons + netTangerines;
      const netWeight = (netOranges * 15) + (netLemons * 15) + (netTangerines * 20);
      return { carry, returns: linkedReturns, netOranges, netLemons, netTangerines, netBoxes, netWeight };
    });

  const handleAddOrangeCarry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orangeCarryForm.salesPersonName.trim()) {
      toast({
        title: 'Missing sales person',
        description: 'Please enter the sales person name before saving the carry entry.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/citrus-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orangeCarryForm, type: 'carry' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save carry entry');
      }

      const saved = await res.json();
      const newEntry = mapMovement(saved);

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
        title: 'Carry-out entry saved',
        description: `${newEntry.salesPersonName} has been added to the carry log. Total: ${newEntry.grandTotalWeight.toFixed(1)} kg / ${newEntry.grandTotalBoxes} boxes`,
      });

      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_CARRY_CREATED,
        status: 'success',
        metadata: {
          carryId: newEntry.id,
          salesPersonName: newEntry.salesPersonName,
          vehiclePlate: newEntry.vehiclePlate,
          orangesBoxes: newEntry.orangesTotalBoxes,
          lemonsBoxes: newEntry.lemonsTotalBoxes,
          tangerinesBoxes: newEntry.citrusTotalBoxes,
          totalBoxes: newEntry.grandTotalBoxes,
          totalWeight: newEntry.grandTotalWeight,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      toast({
        title: 'Error saving carry entry',
        description: error.message,
        variant: 'destructive',
      });
      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_CARRY_CREATED,
        status: 'failure',
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  const handleAddOrangeReturn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCarryForReturn) {
      toast({
        title: 'No carry selected',
        description: 'Please select a carry transaction before adding a return.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/citrus-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orangeReturnForm,
          salesPersonName: selectedCarryForReturn.salesPersonName,
          salesPersonPhone: selectedCarryForReturn.salesPersonPhone,
          vehiclePlate: selectedCarryForReturn.vehiclePlate,
          type: 'return',
          carryId: selectedCarryForReturn.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save return entry');
      }

      const saved = await res.json();
      const newEntry = mapMovement(saved);

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
        description: `Return of ${newEntry.grandTotalWeight.toFixed(1)} kg recorded against ${selectedCarryForReturn.salesPersonName}.`,
      });

      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_RETURN_CREATED,
        status: 'success',
        metadata: {
          returnId: newEntry.id,
          carryId: selectedCarryForReturn.id,
          salesPersonName: selectedCarryForReturn.salesPersonName,
          orangesBoxes: newEntry.orangesTotalBoxes,
          lemonsBoxes: newEntry.lemonsTotalBoxes,
          tangerinesBoxes: newEntry.citrusTotalBoxes,
          totalBoxes: newEntry.grandTotalBoxes,
          totalWeight: newEntry.grandTotalWeight,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      toast({
        title: 'Error saving return entry',
        description: error.message,
        variant: 'destructive',
      });
      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_RETURN_CREATED,
        status: 'failure',
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  const handleDeleteOrangeCarry = async (id: string) => {
    const linkedCount = orangeReturnEntries.filter(r => r.carryId === id).length;
    if (linkedCount > 0) {
      toast({
        title: 'Cannot delete',
        description: `This carry has ${linkedCount} return(s) linked to it. Delete the returns first.`,
        variant: 'destructive',
      });
      return;
    }
    if (!confirm('Delete this carry entry?')) return;
    const target = orangeCarryEntries.find((e) => e.id === id);
    const result = await deleteMovement(id);
    if (result.ok) {
      setOrangeCarryEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: 'Carry-out entry deleted', description: 'The carry-out entry has been removed.' });
      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_CARRY_DELETED,
        status: 'success',
        metadata: {
          carryId: id,
          salesPersonName: target?.salesPersonName,
          totalBoxes: target?.grandTotalBoxes,
          totalWeight: target?.grandTotalWeight,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete carry entry.', variant: 'destructive' });
      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_CARRY_DELETED,
        status: 'failure',
        metadata: {
          carryId: id,
          error: result.error || 'Failed to delete carry entry',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  const handleDeleteOrangeReturn = async (id: string) => {
    if (!confirm('Delete this return entry?')) return;
    const target = orangeReturnEntries.find((e) => e.id === id);
    const result = await deleteMovement(id);
    if (result.ok) {
      setOrangeReturnEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: 'Return entry deleted', description: 'The return entry has been removed.' });
      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_RETURN_DELETED,
        status: 'success',
        metadata: {
          returnId: id,
          carryId: target?.carryId,
          salesPersonName: target?.salesPersonName,
          totalBoxes: target?.grandTotalBoxes,
          totalWeight: target?.grandTotalWeight,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete return entry.', variant: 'destructive' });
      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_RETURN_DELETED,
        status: 'failure',
        metadata: {
          returnId: id,
          error: result.error || 'Failed to delete return entry',
          timestamp: new Date().toISOString(),
        },
      });
    }
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

  const handleSaveOrangeCarryEdit = async (entryId: string) => {
    try {
      const res = await fetch('/api/citrus-movements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId, ...orangeCarryEditForm }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update carry entry');
      }

      const saved = await res.json();
      const updated = mapMovement(saved);

      setOrangeCarryEntries((prev) => prev.map((entry) => entry.id === entryId ? updated : entry));
      setEditingOrangeCarryEntryId(null);
      setOrangeCarryEditForm({
        salesPersonName: '', salesPersonPhone: '', vehiclePlate: '',
        lemonsClass1: '', lemonsClass2: '', lemonsClass3: '',
        citrusClass1: '', citrusClass2: '', citrusClass3: '',
        orangesClass1: '', orangesClass2: '', orangesClass3: '',
        notes: '',
      });

      toast({
        title: 'Carry-out entry updated',
        description: 'The carry entry has been updated.',
      });

      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_CARRY_UPDATED,
        status: 'success',
        metadata: {
          carryId: entryId,
          salesPersonName: updated.salesPersonName,
          totalBoxes: updated.grandTotalBoxes,
          totalWeight: updated.grandTotalWeight,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      toast({
        title: 'Error updating carry entry',
        description: error.message,
        variant: 'destructive',
      });
      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_CARRY_UPDATED,
        status: 'failure',
        metadata: {
          carryId: entryId,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
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

  const handleStartOrangeReturnEdit = (entry: OrangeMovementEntry) => {
    setEditingOrangeReturnEntryId(entry.id);
    setOrangeReturnEditForm({
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

  const handleSaveOrangeReturnEdit = async (entryId: string) => {
    try {
      const res = await fetch('/api/citrus-movements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId, ...orangeReturnEditForm }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update return entry');
      }

      const saved = await res.json();
      const updated = mapMovement(saved);

      setOrangeReturnEntries((prev) => prev.map((entry) => entry.id === entryId ? updated : entry));
      setEditingOrangeReturnEntryId(null);
      setOrangeReturnEditForm({
        salesPersonName: '', salesPersonPhone: '', vehiclePlate: '',
        lemonsClass1: '', lemonsClass2: '', lemonsClass3: '',
        citrusClass1: '', citrusClass2: '', citrusClass3: '',
        orangesClass1: '', orangesClass2: '', orangesClass3: '',
        notes: '',
      });

      toast({
        title: 'Return entry updated',
        description: 'The return entry has been updated.',
      });

      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_RETURN_UPDATED,
        status: 'success',
        metadata: {
          returnId: entryId,
          carryId: updated.carryId,
          salesPersonName: updated.salesPersonName,
          totalBoxes: updated.grandTotalBoxes,
          totalWeight: updated.grandTotalWeight,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      toast({
        title: 'Error updating return entry',
        description: error.message,
        variant: 'destructive',
      });
      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_RETURN_UPDATED,
        status: 'failure',
        metadata: {
          returnId: entryId,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  const handleCancelOrangeReturnEdit = () => {
    setEditingOrangeReturnEntryId(null);
    setOrangeReturnEditForm({
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

  const handleDownloadOrangeGrn = async (entry: OrangeMovementEntry) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a5');

      // Logo
      let hasLogo = false;
      let logoHeight = 0;
      const pageWidth = 148;
      const leftMargin = 8;
      const contentWidth = pageWidth - 2 * leftMargin;

      const logoPaths = [
        '/images/HLogo.png',
        '/Harirlogo.svg',
        '/Harirlogo.png',
        '/Harirlogo.jpg',
        '/logo.png',
        '/logo.jpg',
        '/favicon.ico',
      ];

      for (const path of logoPaths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const blob = await response.blob();
            const base64String = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            const logoWidth = 80;
            const logoHeightRect = 14;
            const x = (pageWidth - logoWidth) / 2;
            doc.addImage(base64String as string, 'PNG', x, 6, logoWidth, logoHeightRect);
            hasLogo = true;
            logoHeight = 15;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!hasLogo) {
        doc.setFillColor(34, 139, 34);
        doc.circle(pageWidth / 2, 17.5, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('HI', pageWidth / 2, 19.5, { align: 'center' });
        logoHeight = 15;
      }

      const startY = 24;
      doc.setDrawColor(34, 139, 34);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, startY, pageWidth - leftMargin, startY);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('DELIVERY NOTE - CITRUS', pageWidth / 2, startY + 7, { align: 'center' });
      let yPos = startY + 13;

      // Document details
      doc.setFillColor(248, 249, 250);
      doc.rect(leftMargin, yPos, contentWidth, 10, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Document Details', leftMargin + 2, yPos + 4);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');

      doc.text(`Date: ${format(new Date(entry.createdAt), 'dd/MM/yyyy')}`, leftMargin + 50, yPos + 8);
      doc.text(`Time: ${format(new Date(entry.createdAt), 'HH:mm')}`, leftMargin + 95, yPos + 8);
      yPos += 13;

      // Sales person info
      doc.setFillColor(233, 236, 239);
      doc.rect(leftMargin, yPos, contentWidth, 10, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Person Information', leftMargin + 2, yPos + 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Sales person: ${entry.salesPersonName}`, leftMargin + 2, yPos + 7);
      doc.text(`Phone: ${entry.salesPersonPhone || 'N/A'}`, leftMargin + 50, yPos + 7);
      doc.text(`Vehicle: ${entry.vehiclePlate || 'N/A'}`, leftMargin + 95, yPos + 7);
      yPos += 13;

      // Summary
      doc.setFillColor(220, 252, 231);
      doc.rect(leftMargin, yPos, contentWidth, 10, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', leftMargin + 2, yPos + 5);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total: ${entry.grandTotalBoxes} boxes`, leftMargin + 2, yPos + 9);
      doc.text(`Weight: ${entry.grandTotalWeight.toFixed(1)} kg`, leftMargin + 50, yPos + 9);
      yPos += 13;

      // Product breakdown table
      doc.setFillColor(52, 58, 64);
      doc.rect(leftMargin, yPos, contentWidth, 6, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('PRODUCT BREAKDOWN', leftMargin + 2, yPos + 4.5);
      yPos += 9;

      const productRows: { label: string; c1: number; c2: number; c3: number; totalBoxes: number; totalWeight: number }[] = [];

      if (entry.orangesTotalBoxes > 0) {
        productRows.push({
          label: 'Oranges (15kg)',
          c1: entry.orangesClass1, c2: entry.orangesClass2, c3: entry.orangesClass3,
          totalBoxes: entry.orangesTotalBoxes, totalWeight: entry.orangesTotalWeight,
        });
      }
      if (entry.lemonsTotalBoxes > 0) {
        productRows.push({
          label: 'Lemons (15kg)',
          c1: entry.lemonsClass1, c2: entry.lemonsClass2, c3: entry.lemonsClass3,
          totalBoxes: entry.lemonsTotalBoxes, totalWeight: entry.lemonsTotalWeight,
        });
      }
      if (entry.citrusTotalBoxes > 0) {
        productRows.push({
          label: 'Tangerines (20kg)',
          c1: entry.citrusClass1, c2: entry.citrusClass2, c3: entry.citrusClass3,
          totalBoxes: entry.citrusTotalBoxes, totalWeight: entry.citrusTotalWeight,
        });
      }

      // Manual table to avoid autoTable dependency
      const col1 = leftMargin;
      const colW = contentWidth / 6;
      const col2 = col1 + colW;
      const col3 = col2 + colW;
      const col4 = col3 + colW;
      const col5 = col4 + colW;
      const col6 = col5 + colW;

      // Header
      doc.setFillColor(108, 117, 125);
      doc.rect(col1, yPos, contentWidth, 6, 'F');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Product', col1 + 1, yPos + 4);
      doc.text('Class 1', col2 + 1, yPos + 4);
      doc.text('Class 2', col3 + 1, yPos + 4);
      doc.text('Class 3', col4 + 1, yPos + 4);
      doc.text('Boxes', col5 + 1, yPos + 4);
      doc.text('Weight', col6 + 1, yPos + 4);
      yPos += 7;

      // Rows
      productRows.forEach((row, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, 249, 250);
        doc.rect(col1, yPos, contentWidth, 6, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(row.label, col1 + 1, yPos + 4);
        doc.text(row.c1.toString(), col2 + 1, yPos + 4);
        doc.text(row.c2.toString(), col3 + 1, yPos + 4);
        doc.text(row.c3.toString(), col4 + 1, yPos + 4);
        doc.text(row.totalBoxes.toString(), col5 + 1, yPos + 4);
        doc.text(`${row.totalWeight.toFixed(1)} kg`, col6 + 1, yPos + 4);
        yPos += 7;
      });

      // Grand total row
      doc.setFillColor(173, 216, 230);
      doc.rect(col1, yPos, contentWidth, 6, 'F');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const totalC1 = productRows.reduce((s, r) => s + r.c1, 0);
      const totalC2 = productRows.reduce((s, r) => s + r.c2, 0);
      const totalC3 = productRows.reduce((s, r) => s + r.c3, 0);
      doc.text('GRAND TOTAL', col1 + 1, yPos + 4);
      doc.text(totalC1 > 0 ? totalC1.toString() : '', col2 + 1, yPos + 4);
      doc.text(totalC2 > 0 ? totalC2.toString() : '', col3 + 1, yPos + 4);
      doc.text(totalC3 > 0 ? totalC3.toString() : '', col4 + 1, yPos + 4);
      doc.text(entry.grandTotalBoxes.toString(), col5 + 1, yPos + 4);
      doc.text(`${entry.grandTotalWeight.toFixed(1)} kg`, col6 + 1, yPos + 4);
      yPos += 10;

      // Notes
      if (entry.notes && entry.notes.trim() !== '') {
        doc.setFillColor(255, 248, 225);
        doc.rect(leftMargin, yPos, contentWidth, 10, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Notes', leftMargin + 2, yPos + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        const notes = entry.notes;
        const maxLength = 70;
        let notesY = yPos + 9;
        for (let i = 0; i < notes.length; i += maxLength) {
          const line = notes.substring(i, Math.min(i + maxLength, notes.length));
          doc.text(line, leftMargin + 2, notesY);
          notesY += 3;
        }
        yPos = notesY + 3;
      }

      // Signature section
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      const signatureX = pageWidth / 2 - 40;
      doc.line(signatureX, yPos, signatureX + 70, yPos);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text('Receiver Name & Signature', signatureX + 35, yPos + 3, { align: 'center' });
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, signatureX + 35, yPos + 6, { align: 'center' });

      yPos += 10;

      // Footer
      doc.setFontSize(5);
      doc.setTextColor(128, 128, 128);
      const docInfo1 = `Harir International - Delivery Note • Document: DN-${entry.id.slice(0, 8).toUpperCase()}`;
      const docInfo2 = `Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')} • This is a computer-generated document`;
      doc.text(docInfo1, pageWidth / 2, yPos, { align: 'center' });
      doc.text(docInfo2, pageWidth / 2, yPos + 2.5, { align: 'center' });

      doc.save(`Delivery-Note-${entry.salesPersonName.replace(/\s+/g, '-')}-${format(new Date(entry.createdAt), 'dd-MMM-yyyy')}.pdf`);

      await logActivity({
        user: (await getCurrentUser())?.name || 'System',
        action: ActivityTypes.CITRUS_DELIVERY_NOTE_DOWNLOADED,
        status: 'success',
        metadata: {
          carryId: entry.id,
          salesPersonName: entry.salesPersonName,
          totalBoxes: entry.grandTotalBoxes,
          totalWeight: entry.grandTotalWeight,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleExportOrangeTransactions = async () => {
    const exportRows = orangeTransactionRows.map((row) => ({
      date: format(new Date(row.carry.createdAt), 'dd MMM yyyy HH:mm'),
      salesPersonName: row.carry.salesPersonName,
      salesPersonPhone: row.carry.salesPersonPhone,
      vehiclePlate: row.carry.vehiclePlate,
      'Carry-out Oranges': row.carry.orangesTotalBoxes,
      'Carry-out Lemons': row.carry.lemonsTotalBoxes,
      'Carry-out Tangerines': row.carry.citrusTotalBoxes,
      'Carry-out Total Boxes': row.carry.grandTotalBoxes,
      'Carry-out Total Weight': row.carry.grandTotalWeight,
      'Return Boxes': row.returns.reduce((s, r) => s + r.grandTotalBoxes, 0),
      'Return Weight': row.returns.reduce((s, r) => s + r.grandTotalWeight, 0),
      'Net Sales Boxes': row.netBoxes,
      'Net Sales Weight': row.netWeight,
      notes: row.carry.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orange Transactions');
    XLSX.writeFile(workbook, 'orange-transactions.xlsx');

    await logActivity({
      user: (await getCurrentUser())?.name || 'System',
      action: ActivityTypes.CITRUS_TRANSACTIONS_EXPORTED,
      status: 'success',
      metadata: {
        rowCount: exportRows.length,
        timestamp: new Date().toISOString(),
      },
    });
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
    <>
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
            <p className="text-sm font-medium uppercase tracking-wide text-slate-300">Citrus intake</p>
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
            <TabsTrigger value="carry">Carry-out</TabsTrigger>
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
                  <Button type="submit" className="bg-green-700 hover:bg-green-600 text-white">Save carry entry</Button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Carry-out history</h3>
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={orangeCarryFilterDate} 
                    onChange={(e) => setOrangeCarryFilterDate(e.target.value)} 
                    className="w-auto bg-black border-gray-700 text-white text-xs h-8"
                  />
                  <Badge variant="secondary" className="bg-slate-800 text-gray-300">{orangeCarryEntries.length}</Badge>
                </div>
              </div>
              {(() => {
                const filtered = orangeCarryFilterDate
                  ? orangeCarryEntries.filter((c) => format(new Date(c.createdAt), 'yyyy-MM-dd') === orangeCarryFilterDate)
                  : orangeCarryEntries;
                if (filtered.length === 0) {
                  return <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">No carry entries have been recorded yet.</div>;
                }
                return (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/70">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-gray-300">Date</TableHead>
                            <TableHead className="text-gray-300">Sales person</TableHead>
                            <TableHead className="text-gray-300">Phone</TableHead>
                            <TableHead className="text-gray-300">Vehicle</TableHead>
                            <TableHead className="text-gray-300">Oranges</TableHead>
                            <TableHead className="text-gray-300">Lemons</TableHead>
                            <TableHead className="text-gray-300">Tangerines</TableHead>
                            <TableHead className="text-gray-300">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((entry) => (
                            <Fragment key={entry.id}>
                              <TableRow
                                className={`cursor-pointer ${selectedCarryDetail?.id === entry.id ? 'bg-sky-950/30 ring-1 ring-sky-500' : 'hover:bg-slate-800/50'}`}
                                onClick={() => setSelectedCarryDetail(selectedCarryDetail?.id === entry.id ? null : entry)}
                              >
                                <TableCell className="text-gray-300">{format(new Date(entry.createdAt), 'dd MMM yy')}</TableCell>
                                <TableCell className="text-white font-medium">{entry.salesPersonName}</TableCell>
                                <TableCell className="text-gray-400">{entry.salesPersonPhone || '—'}</TableCell>
                                <TableCell className="text-gray-400">{entry.vehiclePlate || '—'}</TableCell>
                                <TableCell className="text-gray-300">{entry.orangesTotalBoxes} b</TableCell>
                                <TableCell className="text-gray-300">{entry.lemonsTotalBoxes} b</TableCell>
                                <TableCell className="text-gray-300">{entry.citrusTotalBoxes} b</TableCell>
                                <TableCell className="text-blue-400 font-semibold">{entry.grandTotalBoxes} b / {entry.grandTotalWeight.toFixed(1)} kg</TableCell>
                              </TableRow>
                              {selectedCarryDetail?.id === entry.id && (
                                <TableRow>
                                  <TableCell colSpan={8} className="p-4 bg-sky-950/10 border-b border-sky-800/30">
                                    {(() => {
                                      const isEditing = editingOrangeCarryEntryId === selectedCarryDetail.id;
                                      if (isEditing) {
                                        return (
                                          <div>
                                            <h4 className="font-semibold text-white text-base mb-3">Editing: {selectedCarryDetail.salesPersonName}</h4>
                                            {renderEditFields(orangeCarryEditForm, setOrangeCarryEditForm)}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                              <Button type="button" size="sm" onClick={() => handleSaveOrangeCarryEdit(selectedCarryDetail.id)}>Save</Button>
                                              <Button type="button" variant="outline" size="sm" onClick={() => { handleCancelOrangeCarryEdit(); setSelectedCarryDetail(null); }}>Cancel</Button>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div>
                                          <div className="flex items-start justify-between mb-3">
                                            <div>
                                              <h4 className="font-semibold text-white text-base">{selectedCarryDetail.salesPersonName}</h4>
                                              <p className="text-sm text-gray-400">{selectedCarryDetail.salesPersonPhone || 'No phone'} &bull; {selectedCarryDetail.vehiclePlate || 'No plate'}</p>
                                              <p className="text-sm text-gray-400">{format(new Date(selectedCarryDetail.createdAt), "dd MMM yyyy '•' HH:mm")}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              <Button type="button" variant="outline" size="sm" onClick={() => { setEditingOrangeCarryEntryId(selectedCarryDetail.id); setOrangeCarryEditForm({ salesPersonName: selectedCarryDetail.salesPersonName, salesPersonPhone: selectedCarryDetail.salesPersonPhone, vehiclePlate: selectedCarryDetail.vehiclePlate, lemonsClass1: String(selectedCarryDetail.lemonsClass1), lemonsClass2: String(selectedCarryDetail.lemonsClass2), lemonsClass3: String(selectedCarryDetail.lemonsClass3), citrusClass1: String(selectedCarryDetail.citrusClass1), citrusClass2: String(selectedCarryDetail.citrusClass2), citrusClass3: String(selectedCarryDetail.citrusClass3), orangesClass1: String(selectedCarryDetail.orangesClass1), orangesClass2: String(selectedCarryDetail.orangesClass2), orangesClass3: String(selectedCarryDetail.orangesClass3), notes: selectedCarryDetail.notes, }); }} className="border-gray-700 text-gray-300 hover:bg-slate-800">Edit</Button>
                                              <Button type="button" variant="outline" size="sm" onClick={() => handleDeleteOrangeCarry(selectedCarryDetail.id)} className="border-red-800 text-red-400 hover:bg-red-950">Delete</Button>
                                              <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadOrangeGrn(selectedCarryDetail)} className="border-gray-700 text-gray-300 hover:bg-slate-800">
                                                <Download className="mr-2 h-4 w-4" />Delivery Note
                                              </Button>
                                            </div>
                                          </div>
                                          {selectedCarryDetail.notes && <p className="text-sm text-gray-400 mb-3 italic">{selectedCarryDetail.notes}</p>}
                                          {renderEntryDetails(selectedCarryDetail)}
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="returns" className="mt-6 space-y-6 rounded-2xl bg-slate-950/40 p-2 sm:p-4">
            {/* Carry-out selector */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                <h3 className="text-base font-semibold text-white">Select a carry transaction</h3>
                <Input 
                  type="date" 
                  value={orangeCarryFilterDate} 
                  onChange={(e) => setOrangeCarryFilterDate(e.target.value)} 
                  className="w-auto bg-black border-gray-700 text-white"
                />
              </div>
              {(() => {
                const filtered = orangeCarryFilterDate
                  ? orangeCarryEntries.filter((c) => format(new Date(c.createdAt), 'yyyy-MM-dd') === orangeCarryFilterDate)
                  : orangeCarryEntries;
                if (filtered.length === 0) {
                  return <p className="text-sm text-gray-500">No carry transactions available. Record a carry first.</p>;
                }
                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gray-300">Date</TableHead>
                          <TableHead className="text-gray-300">Sales person</TableHead>
                          <TableHead className="text-gray-300">Phone</TableHead>
                          <TableHead className="text-gray-300">Vehicle</TableHead>
                          <TableHead className="text-gray-300">Oranges</TableHead>
                          <TableHead className="text-gray-300">Lemons</TableHead>
                          <TableHead className="text-gray-300">Tangerines</TableHead>
                          <TableHead className="text-gray-300">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((carry) => (
                          <TableRow
                            key={carry.id}
                            className={`cursor-pointer ${selectedCarryForReturn?.id === carry.id ? 'bg-amber-950/30 ring-1 ring-amber-500' : 'hover:bg-slate-800/50'}`}
                            onClick={() => {
                              setSelectedCarryForReturn(carry);
                              setOrangeReturnForm({
                                salesPersonName: '', salesPersonPhone: '', vehiclePlate: '',
                                lemonsClass1: '', lemonsClass2: '', lemonsClass3: '',
                                citrusClass1: '', citrusClass2: '', citrusClass3: '',
                                orangesClass1: '', orangesClass2: '', orangesClass3: '',
                                notes: '',
                              });
                            }}
                          >
                            <TableCell className="text-gray-300">{format(new Date(carry.createdAt), 'dd MMM yy')}</TableCell>
                            <TableCell className="text-white font-medium">{carry.salesPersonName}</TableCell>
                            <TableCell className="text-gray-400">{carry.salesPersonPhone || '—'}</TableCell>
                            <TableCell className="text-gray-400">{carry.vehiclePlate || '—'}</TableCell>
                            <TableCell className="text-gray-300">{carry.orangesTotalBoxes} b</TableCell>
                            <TableCell className="text-gray-300">{carry.lemonsTotalBoxes} b</TableCell>
                            <TableCell className="text-gray-300">{carry.citrusTotalBoxes} b</TableCell>
                            <TableCell className="text-amber-400 font-semibold">{carry.grandTotalBoxes} b / {carry.grandTotalWeight.toFixed(1)} kg</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </div>

            {/* Selected carry details + return form */}
            {selectedCarryForReturn ? (
              <>
                <div className="rounded-2xl border border-amber-700 bg-amber-950/20 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-amber-400" />
                      <h3 className="text-base font-semibold text-amber-300">Return against: {selectedCarryForReturn.salesPersonName}</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedCarryForReturn(null); setOrangeReturnForm({ salesPersonName: '', salesPersonPhone: '', vehiclePlate: '', lemonsClass1: '', lemonsClass2: '', lemonsClass3: '', citrusClass1: '', citrusClass2: '', citrusClass3: '', orangesClass1: '', orangesClass2: '', orangesClass3: '', notes: '' }); }} className="border-gray-700 text-gray-300 hover:bg-slate-800">Change carry</Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 mb-4">
                    <div className="text-sm"><span className="text-gray-400">Carry-out date:</span> <span className="text-white">{format(new Date(selectedCarryForReturn.createdAt), 'dd MMM yyyy HH:mm')}</span></div>
                    <div className="text-sm"><span className="text-gray-400">Phone:</span> <span className="text-white">{selectedCarryForReturn.salesPersonPhone || 'N/A'}</span></div>
                    <div className="text-sm"><span className="text-gray-400">Vehicle:</span> <span className="text-white">{selectedCarryForReturn.vehiclePlate || 'N/A'}</span></div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 text-sm">
                    <div className="bg-slate-950/60 rounded-lg p-2"><span className="text-orange-400">Oranges: </span><span className="text-white">{selectedCarryForReturn.orangesTotalBoxes} boxes / {selectedCarryForReturn.orangesTotalWeight.toFixed(1)} kg</span></div>
                    <div className="bg-slate-950/60 rounded-lg p-2"><span className="text-yellow-400">Lemons: </span><span className="text-white">{selectedCarryForReturn.lemonsTotalBoxes} boxes / {selectedCarryForReturn.lemonsTotalWeight.toFixed(1)} kg</span></div>
                    <div className="bg-slate-950/60 rounded-lg p-2"><span className="text-amber-400">Tangerines: </span><span className="text-white">{selectedCarryForReturn.citrusTotalBoxes} boxes / {selectedCarryForReturn.citrusTotalWeight.toFixed(1)} kg</span></div>
                  </div>
                </div>

                {/* Return form */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-full bg-slate-900 p-2 text-white">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-semibold text-white">Add return</h3>
                  </div>
                  <form onSubmit={handleAddOrangeReturn} className="space-y-4">
                    <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                      <p className="text-sm text-slate-400">Return quantities for each fruit class. Leave zero for no returns in a category.</p>
                    </div>

                    {renderClassInputs('oranges', 'Oranges', orangeReturnForm, setOrangeReturnForm, 15)}
                    {renderClassInputs('lemons', 'Lemons', orangeReturnForm, setOrangeReturnForm, 15)}
                    {renderClassInputs('citrus', 'Tangerines', orangeReturnForm, setOrangeReturnForm, 20)}

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
                              const o = (Number(orangeReturnForm.orangesClass1) || 0) + (Number(orangeReturnForm.orangesClass2) || 0) + (Number(orangeReturnForm.orangesClass3) || 0);
                              const l = (Number(orangeReturnForm.lemonsClass1) || 0) + (Number(orangeReturnForm.lemonsClass2) || 0) + (Number(orangeReturnForm.lemonsClass3) || 0);
                              const t = (Number(orangeReturnForm.citrusClass1) || 0) + (Number(orangeReturnForm.citrusClass2) || 0) + (Number(orangeReturnForm.citrusClass3) || 0);
                              return `${(o + l + t)} boxes = ${(o * 15) + (l * 15) + (t * 20)} kg`;
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
                      <Button type="submit" className="bg-green-700 hover:bg-green-600 text-white">Save return entry</Button>
                    </div>
                  </form>
                </div>

                {/* Returns for this carry */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Returns for this carry</h3>
                  {(() => {
                    const carryReturns = orangeReturnEntries.filter(r => r.carryId === selectedCarryForReturn.id);
                    if (carryReturns.length === 0) {
                      return <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">No returns recorded for this carry yet.</div>;
                    }
                    const totalReturnBoxes = carryReturns.reduce((s, r) => s + r.grandTotalBoxes, 0);
                    const totalReturnWeight = carryReturns.reduce((s, r) => s + r.grandTotalWeight, 0);
                    return (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm">
                          <span className="text-amber-300 font-semibold">Total returns: </span>
                          <span className="text-white">{totalReturnBoxes} boxes / {totalReturnWeight.toFixed(1)} kg</span>
                          <span className="text-amber-300 font-semibold ml-4">Net sales: </span>
                          <span className="text-emerald-400 font-semibold">
                            {Math.max(0, selectedCarryForReturn.grandTotalBoxes - totalReturnBoxes)} boxes / {Math.max(0, selectedCarryForReturn.grandTotalWeight - totalReturnWeight).toFixed(1)} kg
                          </span>
                        </div>
                        {carryReturns.map((entry) => {
                          const isEditing = editingOrangeReturnEntryId === entry.id;
                          return (
                            <div key={entry.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
                              {isEditing ? (
                                <div className="space-y-3">
                                  {renderEditFields(orangeReturnEditForm, setOrangeReturnEditForm)}
                                  <div className="flex flex-wrap gap-2">
                                    <Button type="button" size="sm" onClick={() => handleSaveOrangeReturnEdit(entry.id)}>Save</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleCancelOrangeReturnEdit}>Cancel</Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-gray-400">{format(new Date(entry.createdAt), 'dd MMM yyyy • HH:mm')}</p>
                                  {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                                  {renderEntryDetails(entry)}
                                </div>
                              )}
                              {!isEditing && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => handleStartOrangeReturnEdit(entry)} className="border-gray-700 text-gray-300 hover:bg-slate-800">Edit</Button>
                                  <Button type="button" variant="outline" size="sm" onClick={() => handleDeleteOrangeReturn(entry.id)} className="border-red-800 text-red-400 hover:bg-red-950">Delete</Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-gray-500">
                <RefreshCw className="mx-auto h-8 w-8 mb-2 text-gray-600" />
                Select a carry transaction above to add returns against it.
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-6 space-y-6 rounded-2xl bg-slate-950/40 p-2 sm:p-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">All transactions</h3>
                  <p className="text-sm text-slate-400">Each carry is shown with its linked returns. Net sales = carry - returns.</p>
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
                      <TableHead className="text-gray-300">Sales person</TableHead>
                      <TableHead className="text-gray-300">Vehicle</TableHead>
                      <TableHead className="text-gray-300">Carry-out Total</TableHead>
                      <TableHead className="text-gray-300">Returns</TableHead>
                      <TableHead className="text-gray-300">Net Sales</TableHead>
                      <TableHead className="text-gray-300">Details</TableHead>
                      <TableHead className="text-gray-300">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orangeTransactionRows.length > 0 ? orangeTransactionRows.map((row) => (
                      <TableRow key={row.carry.id} className="cursor-pointer hover:bg-slate-800/50" onClick={() => setSelectedTransaction(row)}>
                        <TableCell className="text-gray-300">{format(new Date(row.carry.createdAt), 'dd MMM yyyy • HH:mm')}</TableCell>
                        <TableCell className="text-gray-300">{row.carry.salesPersonName}</TableCell>
                        <TableCell className="text-gray-300">{row.carry.vehiclePlate || 'N/A'}</TableCell>
                        <TableCell className="text-blue-400 font-semibold">{row.carry.grandTotalBoxes} b / {row.carry.grandTotalWeight.toFixed(1)} kg</TableCell>
                        <TableCell className="text-amber-400">
                          {row.returns.length > 0
                            ? `${row.returns.reduce((s, r) => s + r.grandTotalBoxes, 0)} b / ${row.returns.reduce((s, r) => s + r.grandTotalWeight, 0).toFixed(1)} kg`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-emerald-400 font-semibold">{row.netBoxes} b / {row.netWeight.toFixed(1)} kg</TableCell>
                        <TableCell className="text-xs text-gray-400">
                          <div>O:{row.netOranges} L:{row.netLemons} T:{row.netTangerines}</div>
                        </TableCell>
                        <TableCell className="max-w-[200px] whitespace-normal text-gray-400">{row.carry.notes || '—'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-gray-500">No transactions for the selected date.</TableCell>
                      </TableRow>
                    )}
                    {orangeTransactionRows.length > 0 && (
                      <TableRow className="border-t-2 border-emerald-700 bg-emerald-950/20">
                        <TableCell className="text-emerald-400 font-semibold" colSpan={3}>
                          <span className="flex items-center gap-1">
                            <Scale className="h-4 w-4" /> Totals
                          </span>
                        </TableCell>
                        <TableCell className="text-blue-400 font-semibold">{orangeCarryTotals.boxes} b / {orangeCarryTotals.weight.toFixed(1)} kg</TableCell>
                        <TableCell className="text-amber-400 font-semibold">{orangeReturnTotals.boxes} b / {orangeReturnTotals.weight.toFixed(1)} kg</TableCell>
                        <TableCell className="text-emerald-400 font-semibold">{orangeSalesTotals.boxes} b / {orangeSalesTotals.weight.toFixed(1)} kg</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {(() => {
                const legacyReturns = orangeReturnEntries.filter(r => !r.carryId);
                if (legacyReturns.length === 0) return null;
                return (
                  <div className="mt-4 rounded-lg border border-amber-800 bg-amber-950/20 p-3">
                    <p className="text-sm font-semibold text-amber-300 mb-2">Legacy returns (not linked to a carry)</p>
                    <div className="space-y-2">
                      {legacyReturns.map((r) => (
                        <div key={r.id} className="text-xs text-gray-400 flex gap-4">
                          <span>{format(new Date(r.createdAt), 'dd MMM yy')}</span>
                          <span>{r.salesPersonName}</span>
                          <span className="text-amber-400">{r.grandTotalBoxes} b / {r.grandTotalWeight.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="stock" className="mt-6 space-y-6 rounded-2xl bg-slate-950/40 p-2 sm:p-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-300">Current remaining stock</h3>
                  <p className="text-sm text-emerald-400">Calculated from citrus intake minus sales.</p>
                </div>
                <div className="rounded-lg border border-emerald-800 bg-slate-950/70 p-3 text-sm">
                  <p className="font-semibold text-white">{orangeCurrentStock.weight.toFixed(1)} kg</p>
                  <p className="text-slate-400">{orangeCurrentStock.boxes} boxes</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-orange-800 bg-orange-950/30 p-3">
                  <p className="text-sm font-semibold text-orange-400 mb-2">Oranges intake</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-orange-300"><span>Class 1</span><span>{intakeTotals.orangesC1} boxes</span></div>
                    <div className="flex justify-between text-orange-300"><span>Class 2</span><span>{intakeTotals.orangesC2} boxes</span></div>
                    <div className="flex justify-between text-orange-300"><span>Class 3</span><span>{intakeTotals.orangesC3} boxes</span></div>
                    <div className="border-t border-orange-800 pt-1 mt-1 flex justify-between font-semibold text-white">
                      <span>Total</span><span>{intakeTotals.orangesBoxes} boxes / {intakeTotals.orangesWeight.toFixed(1)} kg</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-yellow-800 bg-yellow-950/30 p-3">
                  <p className="text-sm font-semibold text-yellow-400 mb-2">Lemons intake</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-yellow-300"><span>Class 1</span><span>{intakeTotals.lemonsC1} boxes</span></div>
                    <div className="flex justify-between text-yellow-300"><span>Class 2</span><span>{intakeTotals.lemonsC2} boxes</span></div>
                    <div className="flex justify-between text-yellow-300"><span>Class 3</span><span>{intakeTotals.lemonsC3} boxes</span></div>
                    <div className="border-t border-yellow-800 pt-1 mt-1 flex justify-between font-semibold text-white">
                      <span>Total</span><span>{intakeTotals.lemonsBoxes} boxes / {intakeTotals.lemonsWeight.toFixed(1)} kg</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3">
                  <p className="text-sm font-semibold text-amber-400 mb-2">Tangerines intake</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-amber-300"><span>Class 1</span><span>{intakeTotals.tangerinesC1} boxes</span></div>
                    <div className="flex justify-between text-amber-300"><span>Class 2</span><span>{intakeTotals.tangerinesC2} boxes</span></div>
                    <div className="flex justify-between text-amber-300"><span>Class 3</span><span>{intakeTotals.tangerinesC3} boxes</span></div>
                    <div className="border-t border-amber-800 pt-1 mt-1 flex justify-between font-semibold text-white">
                      <span>Total</span><span>{intakeTotals.tangerinesBoxes} boxes / {intakeTotals.tangerinesWeight.toFixed(1)} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <p className="text-sm text-slate-400">Total intake</p>
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

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => { if (!open) setSelectedTransaction(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 text-white">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white text-lg">Transaction: {selectedTransaction.carry.salesPersonName}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {format(new Date(selectedTransaction.carry.createdAt), 'dd MMM yyyy HH:mm')} &middot; {selectedTransaction.carry.vehiclePlate || 'No vehicle'}
                </DialogDescription>
              </DialogHeader>

              {/* Carry-out details */}
              <div className="rounded-lg border border-blue-800 bg-blue-950/20 p-3">
                <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Carry-out
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div><span className="text-gray-400">Phone:</span> <span className="text-white">{selectedTransaction.carry.salesPersonPhone || 'N/A'}</span></div>
                  <div><span className="text-gray-400">Vehicle:</span> <span className="text-white">{selectedTransaction.carry.vehiclePlate || 'N/A'}</span></div>
                  <div><span className="text-gray-400">Total:</span> <span className="text-white font-semibold">{selectedTransaction.carry.grandTotalBoxes} boxes / {selectedTransaction.carry.grandTotalWeight.toFixed(1)} kg</span></div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-950/60 rounded-lg p-2">
                    <p className="text-orange-400 font-semibold mb-1">Oranges</p>
                    <p className="text-gray-400">C1: {selectedTransaction.carry.orangesClass1} &middot; C2: {selectedTransaction.carry.orangesClass2} &middot; C3: {selectedTransaction.carry.orangesClass3}</p>
                    <p className="text-white">{selectedTransaction.carry.orangesTotalBoxes} boxes = {selectedTransaction.carry.orangesTotalWeight.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-slate-950/60 rounded-lg p-2">
                    <p className="text-yellow-400 font-semibold mb-1">Lemons</p>
                    <p className="text-gray-400">C1: {selectedTransaction.carry.lemonsClass1} &middot; C2: {selectedTransaction.carry.lemonsClass2} &middot; C3: {selectedTransaction.carry.lemonsClass3}</p>
                    <p className="text-white">{selectedTransaction.carry.lemonsTotalBoxes} boxes = {selectedTransaction.carry.lemonsTotalWeight.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-slate-950/60 rounded-lg p-2">
                    <p className="text-amber-400 font-semibold mb-1">Tangerines</p>
                    <p className="text-gray-400">C1: {selectedTransaction.carry.citrusClass1} &middot; C2: {selectedTransaction.carry.citrusClass2} &middot; C3: {selectedTransaction.carry.citrusClass3}</p>
                    <p className="text-white">{selectedTransaction.carry.citrusTotalBoxes} boxes = {selectedTransaction.carry.citrusTotalWeight.toFixed(1)} kg</p>
                  </div>
                </div>
                {selectedTransaction.carry.notes && (
                  <p className="text-sm text-gray-400 mt-2 italic">{selectedTransaction.carry.notes}</p>
                )}
              </div>

              {/* Returns */}
              {selectedTransaction.returns.length > 0 && (
                <div className="rounded-lg border border-amber-800 bg-amber-950/20 p-3">
                  <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Returns ({selectedTransaction.returns.length})
                  </h4>
                  {selectedTransaction.returns.map((ret, idx) => (
                    <div key={ret.id} className={`${idx > 0 ? 'border-t border-amber-800/50 mt-2 pt-2' : ''}`}>
                      <p className="text-xs text-gray-400 mb-1">{format(new Date(ret.createdAt), 'dd MMM yyyy HH:mm')}{ret.notes ? ` — ${ret.notes}` : ''}</p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">Oranges: <span className="text-white">{ret.orangesTotalBoxes} b / {ret.orangesTotalWeight.toFixed(1)} kg</span></p>
                          <p className="text-xs text-gray-500">C1:{ret.orangesClass1} C2:{ret.orangesClass2} C3:{ret.orangesClass3}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Lemons: <span className="text-white">{ret.lemonsTotalBoxes} b / {ret.lemonsTotalWeight.toFixed(1)} kg</span></p>
                          <p className="text-xs text-gray-500">C1:{ret.lemonsClass1} C2:{ret.lemonsClass2} C3:{ret.lemonsClass3}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Tangerines: <span className="text-white">{ret.citrusTotalBoxes} b / {ret.citrusTotalWeight.toFixed(1)} kg</span></p>
                          <p className="text-xs text-gray-500">C1:{ret.citrusClass1} C2:{ret.citrusClass2} C3:{ret.citrusClass3}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-amber-800/50 mt-2 pt-2 text-sm">
                    <span className="text-amber-300 font-semibold">Total returns: </span>
                    <span className="text-white">{selectedTransaction.returns.reduce((s, r) => s + r.grandTotalBoxes, 0)} boxes / {selectedTransaction.returns.reduce((s, r) => s + r.grandTotalWeight, 0).toFixed(1)} kg</span>
                  </div>
                </div>
              )}

              {/* Net Sales */}
              <div className="rounded-lg border border-emerald-800 bg-emerald-950/20 p-3">
                <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Net Sales (Carry-out - Returns)
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-orange-400">Oranges</p>
                    <p className="text-white">{selectedTransaction.netOranges} boxes = {(selectedTransaction.netOranges * 15).toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-yellow-400">Lemons</p>
                    <p className="text-white">{selectedTransaction.netLemons} boxes = {(selectedTransaction.netLemons * 15).toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-amber-400">Tangerines</p>
                    <p className="text-white">{selectedTransaction.netTangerines} boxes = {(selectedTransaction.netTangerines * 20).toFixed(1)} kg</p>
                  </div>
                </div>
                <div className="border-t border-emerald-800/50 mt-2 pt-2 text-sm font-bold">
                  <span className="text-emerald-300">Grand total: </span>
                  <span className="text-emerald-400">{selectedTransaction.netBoxes} boxes / {selectedTransaction.netWeight.toFixed(1)} kg</span>
                </div>
              </div>

              {/* GRN Download */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleDownloadOrangeGrn(selectedTransaction.carry)}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Delivery Note
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
'use client';

import { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshTraceLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Download,
  Users,
  Truck,
  BarChart,
  ListChecks,
  Weight,
  Calendar as CalendarIcon,
  UserCheck,
  Clock,
  Loader2,
  Factory,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { downloadXlsx, type XlsxColumn } from '@/lib/xlsx-export';

const pdfReportTypes = [
  { id: 'supplierReport', label: 'Suppliers Report', icon: UserCheck, href: '/suppliers' },
  { id: 'visitorLogReport', label: 'Visitor Log Report', icon: Users, href: '/visitor-management' },
  { id: 'vehicleLogReport', label: 'Vehicle Log Report', icon: Truck, href: '/vehicle-management' },
  { id: 'intakeReport', label: 'Intake Report', icon: Weight, href: '/weight-capture' },
  { id: 'countingReport', label: 'Counting Report', icon: ListChecks, href: '/warehouse' },
  { id: 'casualsReport', label: 'Casuals Attendance Report', icon: Clock, href: '/employees' },
  { id: 'productionReport', label: 'Production Report', icon: Factory, href: '/reports' },
];

const xlsReportTypes = [
  { id: 'supplierReport', label: 'Suppliers Report', icon: UserCheck },
  { id: 'visitorLogReport', label: 'Visitor Log Report', icon: Users },
  { id: 'vehicleLogReport', label: 'Vehicle Log Report', icon: Truck },
  { id: 'intakeReport', label: 'Intake Report', icon: Weight },
  { id: 'countingReport', label: 'Counting Report', icon: ListChecks },
  { id: 'casualsReport', label: 'Casuals Attendance Report', icon: Clock },
];

const designationLabelMap: Record<string, string> = {
  packing: 'Packer',
  dipping: 'Dipping',
  palletizing: 'Palletizing',
  qualityControl: 'Quality Control',
  loading: 'Loading',
  counting: 'Counting',
  intake: 'Intake',
  porter: 'Porter',
};

const casualDesignationOrder = ['Packer', 'Dipping', 'Palletizing', 'Quality Control', 'Loading', 'Counting', 'Intake', 'Porter'];

const formatDesignationLabel = (value: string) => {
  if (!value) return 'N/A';
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  for (const [key, label] of Object.entries(designationLabelMap)) {
    if (key.replace(/[\s_-]+/g, '').toLowerCase() === normalized) return label;
  }
  return value;
};

export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedPdfReport, setSelectedPdfReport] = useState<string>('');
  const [selectedXlsReport, setSelectedXlsReport] = useState<string>('supplierReport');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeRange, setTimeRange] = useState({ from: '00:00', to: '23:59' });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const getDateTimeBounds = (range: DateRange | undefined, currentTimeRange: { from: string; to: string }) => {
    if (!range?.from) return null;
    const start = new Date(range.from);
    const end = range.to ? new Date(range.to) : new Date(range.from);
    const [startHour, startMinute] = currentTimeRange.from.split(':').map(Number);
    const [endHour, endMinute] = currentTimeRange.to.split(':').map(Number);
    start.setHours(startHour, startMinute, 0, 0);
    end.setHours(endHour, endMinute, 59, 999);
    return { start, end };
  };

  const formatDateTimeFilterLabel = (range: DateRange | undefined, currentTimeRange: { from: string; to: string }) => {
    if (!range?.from) return 'Pick a date range';
    const fromLabel = `${format(range.from, 'LLL dd, y')} ${currentTimeRange.from}`;
    if (!range?.to) return fromLabel;
    return `${fromLabel} - ${format(range.to, 'LLL dd, y')} ${currentTimeRange.to}`;
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
        setIsDatePickerOpen(false);
    }
  };

  const generateSupplierReportPDF = async (suppliers: any[], range: DateRange | undefined) => {
    const [{ default: jsPDFLandscape }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const pdf = new jsPDFLandscape('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 10;
    const contentWidth = pageWidth - 2 * leftMargin;

    const logoPaths = [
      '/images/HLogo.png',
      '/Harirlogo.svg',
      '/Harirlogo.png',
      '/Harirlogo.jpg',
      '/logo.png',
      '/logo.jpg',
      '/favicon.ico',
      '/public/favicon.ico'
    ];

    let hasLogo = false;
    for (const path of logoPaths) {
      try {
        const response = await fetch(path);
        if (!response.ok) continue;
        const blob = await response.blob();
        const base64String = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        const logoWidth = 110;
        const logoHeight = 18;
        pdf.addImage(base64String, 'PNG', (pageWidth - logoWidth) / 2, 4, logoWidth, logoHeight);
        hasLogo = true;
        break;
      } catch (error) {
        continue;
      }
    }

    let yPos = hasLogo ? 28 : 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(120, 120, 120);
    pdf.text('SUPPLIERS REPORT', pageWidth / 2, yPos, { align: 'center' });

    pdf.setDrawColor(120, 120, 120);
    pdf.setLineWidth(0.4);
    pdf.line(leftMargin, yPos + 3, pageWidth - leftMargin, yPos + 3);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const rangeLabel = range?.from
      ? `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to || range.from, 'MMM dd, yyyy')}`
      : 'All time';
    pdf.text(`Period: ${rangeLabel}`, pageWidth / 2, yPos + 9, { align: 'center' });

    yPos += 14;

    const active = suppliers.filter(s => s.status === 'Active').length;
    const inactive = suppliers.filter(s => s.status === 'Inactive').length;
    const onboarding = suppliers.filter(s => s.status === 'Onboarding').length;
    const withBank = suppliers.filter(s => s.bank_name && s.bank_account_number).length;
    const withMpesa = suppliers.filter(s => s.mpesa_paybill && s.mpesa_account_number).length;

    pdf.setFillColor(248, 249, 250);
    pdf.rect(leftMargin, yPos, contentWidth, 12, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUMMARY', leftMargin + 2, yPos + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Suppliers: ${suppliers.length}`, leftMargin + 2, yPos + 9);
    pdf.text(`Active: ${active}`, leftMargin + 45, yPos + 9);
    pdf.text(`Inactive: ${inactive}`, leftMargin + 90, yPos + 9);
    pdf.text(`Onboarding: ${onboarding}`, leftMargin + 135, yPos + 9);
    pdf.text(`Bank Details: ${withBank}`, leftMargin + 190, yPos + 9);
    pdf.text(`M-PESA Details: ${withMpesa}`, leftMargin + 240, yPos + 9);

    yPos += 16;

    autoTable(pdf, {
      startY: yPos,
      head: [[
        'Supplier Code', 'Supplier Name', 'Phone Number', 'Email', 'Location', 'Status',
        'KRA PIN', 'Bank Name', 'Bank Account', 'M-PESA Paybill', 'M-PESA Account', 'Created At'
      ]],
      body: suppliers.map((s: any) => [
        s.supplier_code || 'N/A',
        s.name || 'N/A',
        s.contact_phone || 'N/A',
        s.contact_email || 'N/A',
        s.location || 'N/A',
        s.status || 'N/A',
        s.kra_pin || 'N/A',
        s.bank_name || 'N/A',
        s.bank_account_number || 'N/A',
        s.mpesa_paybill || 'N/A',
        s.mpesa_account_number || 'N/A',
        s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [178, 235, 178], textColor: [33, 63, 33], fontSize: 6.5, fontStyle: 'bold' },
      styles: { fontSize: 6.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 36 },
        2: { cellWidth: 24 },
        3: { cellWidth: 34 },
        4: { cellWidth: 24 },
        5: { cellWidth: 16 },
        6: { cellWidth: 18 },
        7: { cellWidth: 22 },
        8: { cellWidth: 22 },
        9: { cellWidth: 18 },
        10: { cellWidth: 18 },
        11: { cellWidth: 20 },
      },
    });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')} by Harir International System`, pageWidth / 2, pageHeight - 8, { align: 'center' });

    pdf.save(`suppliers_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const generateModuleReportPdf = async (options: {
    title: string;
    headers: string[];
    body: (string | number)[][];
    columnStyles?: Record<number, Record<string, unknown>>;
    summary?: string[];
    filename: string;
    totalsRow?: boolean;
  }) => {
    const { title, headers, body, columnStyles, summary, filename, totalsRow } = options;
    const [{ default: jsPDFLandscape }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const pdf = new jsPDFLandscape('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 10;
    const contentWidth = pageWidth - 2 * leftMargin;

    const logoPaths = [
      '/images/HLogo.png',
      '/Harirlogo.svg',
      '/Harirlogo.png',
      '/Harirlogo.jpg',
      '/logo.png',
      '/logo.jpg',
      '/favicon.ico',
      '/public/favicon.ico'
    ];

    let hasLogo = false;
    for (const path of logoPaths) {
      try {
        const response = await fetch(path);
        if (!response.ok) continue;
        const blob = await response.blob();
        const base64String = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        pdf.addImage(base64String, 'PNG', (pageWidth - 110) / 2, 4, 110, 18);
        hasLogo = true;
        break;
      } catch (error) {
        continue;
      }
    }

    let yPos = hasLogo ? 28 : 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(120, 120, 120);
    pdf.text(title, pageWidth / 2, yPos, { align: 'center' });

    pdf.setDrawColor(120, 120, 120);
    pdf.setLineWidth(0.4);
    pdf.line(leftMargin, yPos + 3, pageWidth - leftMargin, yPos + 3);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const periodLabel = dateRange?.from
      ? `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to || dateRange.from, 'MMM dd, yyyy')}`
      : 'All time';
    pdf.text(`Period: ${periodLabel}`, pageWidth / 2, yPos + 9, { align: 'center' });

    yPos += 14;

    if (summary && summary.length > 0) {
      pdf.setFillColor(248, 249, 250);
      pdf.rect(leftMargin, yPos, contentWidth, 12, 'F');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUMMARY', leftMargin + 2, yPos + 4);
      pdf.setFont('helvetica', 'normal');
      summary.forEach((line, i) => {
        pdf.text(line, leftMargin + 2 + i * 46, yPos + 9);
      });
      yPos += 16;
    }

    autoTable(pdf, {
      startY: yPos,
      head: [headers],
      body,
      theme: 'grid',
      headStyles: { fillColor: [178, 235, 178], textColor: [33, 63, 33], fontSize: 6.5, fontStyle: 'bold' },
      styles: { fontSize: 6.5, cellPadding: 1.5 },
      ...(columnStyles ? { columnStyles } : {}),
      ...(totalsRow
        ? {
            didParseCell: (data: any) => {
              if (data.section === 'body' && data.row.index === body.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [40, 167, 69];
                data.cell.styles.textColor = 255;
              }
            },
          }
        : {}),
    });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')} by Harir International System`, pageWidth / 2, pageHeight - 8, { align: 'center' });

    pdf.save(filename);
  };

  const safeDateTime = (value?: string | null) => {
    if (!value) return 'N/A';
    try {
      return format(parseISO(value), 'yyyy-MM-dd HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const buildVisitorRows = async () => {
    const res = await fetch('/api/visitors');
    if (!res.ok) throw new Error('Failed to fetch visitor data');
    const visitors = await res.json();
    const bounds = getDateTimeBounds(dateRange, timeRange);
    const list = Array.isArray(visitors) ? visitors : [];
    const filtered = bounds
      ? list.filter((v: any) =>
          isWithinInterval(parseISO(v.check_in_time || v.created_at), { start: bounds.start, end: bounds.end })
        )
      : list;
    return filtered.map((v: any) => ({
      date: v.check_in_time ? format(parseISO(v.check_in_time), 'yyyy-MM-dd') : '',
      visitorId: v.visitor_code || '',
      name: v.name || '',
      idNumber: v.id_number || '',
      phone: v.phone || '',
      company: v.company || '',
      vehiclePlate: v.vehicle_plate || '',
      status: v.status || '',
      checkInTime: v.check_in_time ? safeDateTime(v.check_in_time) : 'N/A',
      checkOutTime: v.check_out_time ? safeDateTime(v.check_out_time) : 'N/A',
      expectedCheckInTime: v.expected_check_in_time ? safeDateTime(v.expected_check_in_time) : 'N/A',
      department: v.department || '',
      purpose: v.cargo_description || '',
      visitorType: v.visitor_type || '',
      hostName: v.host_id || v.company || '',
    }));
  };

  const buildVehicleRows = async () => {
    const params = new URLSearchParams({ limit: '1000' });
    if (dateRange?.from && dateRange?.to) {
      params.set('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      params.set('endDate', format(dateRange.to, 'yyyy-MM-dd'));
    }
    const res = await fetch(`/api/vehicle-visits?${params}`);
    if (!res.ok) throw new Error('Failed to fetch vehicle visit data');
    const data = await res.json();
    const visits = Array.isArray(data) ? data : (data.visits || []);
    return visits.map((v: any) => {
      const checkIn = v.check_in_time ? new Date(v.check_in_time) : null;
      const checkOut = v.check_out_time ? new Date(v.check_out_time) : null;
      let duration = '';
      if (checkIn && checkOut && checkOut > checkIn) {
        const mins = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
      return {
        visitNumber: `#${v.visit_number || 1}`,
        gateEntryId: v.gate_entry_id || 'Not checked in',
        driverName: v.driver_name || 'Unknown Driver',
        idNumber: v.driver_id_number || '',
        phone: v.phone_number || v.contact_phone || '',
        vehiclePlate: v.vehicle_plate || 'None',
        vehicleType: v.vehicle_type || 'Truck',
        cargoDescription: v.cargo_description || 'Avocado Delivery',
        status: v.status || 'Pre-registered',
        registeredAt: safeDateTime(v.registered_at || v.created_at),
        checkInTime: v.check_in_time ? safeDateTime(v.check_in_time) : 'N/A',
        checkOutTime: v.check_out_time ? safeDateTime(v.check_out_time) : 'N/A',
        duration,
        visitType: (v.visit_number || 1) > 1 ? 'Returning' : 'New',
        recheckIn: v.is_recheck_in ? 'Yes' : 'No',
      };
    });
  };

  const buildIntakeRows = async () => {
    const params = new URLSearchParams({ limit: '1000' });
    if (dateRange?.from && dateRange?.to) {
      params.set('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      params.set('endDate', format(dateRange.to, 'yyyy-MM-dd'));
      params.set('startTime', timeRange.from);
      params.set('endTime', timeRange.to);
    }
    const [weightsRes, rejectsRes] = await Promise.all([
      fetch(`/api/weights?${params}`),
      fetch(`/api/rejects?${params}`),
    ]);
    if (!weightsRes.ok) throw new Error('Failed to fetch intake data');
    const weightsData = await weightsRes.json();
    const weights = Array.isArray(weightsData) ? weightsData : (weightsData.weights || []);
    const rejectsData = rejectsRes.ok ? await rejectsRes.json() : [];
    const rejectList = Array.isArray(rejectsData) ? rejectsData : [];

    const rejectMap = new Map<string, number>();
    rejectList.forEach((reject: any) => {
      const date = new Date(reject.rejected_at).toISOString().split('T')[0];
      const rSupplier = (reject.supplier_name || '').trim().toLowerCase();
      const rVehicle = (reject.vehicle_plate || '').trim().toLowerCase();
      const key = `${date}_${rSupplier}_${rVehicle}`;
      rejectMap.set(key, (rejectMap.get(key) || 0) + (reject.total_rejected_crates || 0));
    });

    const supplierMap = new Map<string, any>();
    weights.forEach((entry: any) => {
      const entryDate = new Date(entry.created_at || entry.timestamp);
      const date = entryDate.toISOString().split('T')[0];
      const time = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const supplierKey = entry.supplier || entry.driver_name || 'Enter Supplier Name';
      const phoneKey = entry.supplier_phone || entry.driver_phone || '';
      const vehicleKey = entry.vehicle_plate || '';
      const regionKey = entry.region || '';
      const gateKey = entry.gate_entry_id || '';
      const key = `${date}_${time}_${supplierKey}_${vehicleKey}`;
      const rejectKey = `${date}_${supplierKey.trim().toLowerCase()}_${vehicleKey.trim().toLowerCase()}`;

      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          date,
          time,
          supplier_name: supplierKey,
          phone_number: phoneKey,
          vehicle_plate_number: vehicleKey,
          gate_entry_id: gateKey,
          fuerte_weight: 0,
          hass_weight: 0,
          fuerte_crates_in: 0,
          hass_crates_in: 0,
          total_crates: 0,
          rejected_crates: 0,
          processed_crates: 0,
          region: regionKey,
        });
      }

      const row = supplierMap.get(key);
      row.fuerte_weight += entry.fuerte_weight || 0;
      row.hass_weight += entry.hass_weight || 0;
      row.fuerte_crates_in += entry.fuerte_crates || 0;
      row.hass_crates_in += entry.hass_crates || 0;
      row.total_crates = row.fuerte_crates_in + row.hass_crates_in;
      row.rejected_crates = rejectMap.get(rejectKey) || 0;
      row.processed_crates = row.total_crates - row.rejected_crates;
    });

    return Array.from(supplierMap.values());
  };

  const buildCountingRows = async () => {
    const [historyRes, weightsRes, rejectsRes] = await Promise.all([
      fetch('/api/counting?action=history&limit=1000'),
      fetch('/api/weights?limit=1000'),
      fetch('/api/rejects?limit=1000'),
    ]);
    if (!historyRes.ok) throw new Error('Failed to fetch counting data');
    const result = await historyRes.json();
    const records = result.success ? (result.data || []) : [];
    const weightsData = weightsRes.ok ? await weightsRes.json() : [];
    const weightEntries = Array.isArray(weightsData) ? weightsData : (weightsData.weights || []);
    const rejectsData = rejectsRes.ok ? await rejectsRes.json() : [];
    const rejectList = Array.isArray(rejectsData) ? rejectsData : [];

    const weightMap = new Map();
    weightEntries.forEach((weight: any) => {
      weightMap.set(weight.id, weight);
      weightMap.set(weight.pallet_id, weight);
      if (weight.supplier) weightMap.set(weight.supplier.toLowerCase(), weight);
    });

    const bounds = getDateTimeBounds(dateRange, timeRange);
    return records
      .filter((record: any) => {
        if (!bounds) return true;
        return isWithinInterval(parseISO(record.submitted_at), { start: bounds.start, end: bounds.end });
      })
      .map((record: any) => {
        let countingData = record.counting_data;
        if (typeof countingData === 'string') {
          try {
            countingData = JSON.parse(countingData);
          } catch {
            countingData = {};
          }
        }

        let intakeTotalCrates = 0;
        const weightEntry = weightMap.get(record.supplier_id) ||
          weightMap.get(record.pallet_id) ||
          weightMap.get(record.supplier_name?.toLowerCase());
        if (weightEntry) {
          intakeTotalCrates = (weightEntry.fuerte_crates || 0) + (weightEntry.hass_crates || 0);
        } else {
          intakeTotalCrates = (countingData.fuerte_crates || 0) + (countingData.hass_crates || 0);
        }

        const rejection = rejectList.find((r: any) =>
          r.weight_entry_id === record.id ||
          r.pallet_id === record.pallet_id ||
          r.supplier_id === record.supplier_id
        );
        const rejectedCrates = rejection ? (rejection.total_rejected_crates || 0) : 0;
        const submitted = new Date(record.submitted_at);

        return {
          date: format(submitted, 'yyyy-MM-dd'),
          time: format(submitted, 'HH:mm'),
          supplier_name: record.supplier_name || '',
          region: record.region || '',
          fuerte_4kg: record.fuerte_4kg_total || 0,
          fuerte_10kg: record.fuerte_10kg_total || 0,
          hass_4kg: record.hass_4kg_total || 0,
          hass_10kg: record.hass_10kg_total || 0,
          fuerte_4kg_class1: record.fuerte_4kg_class1 ?? record.totals?.fuerte_4kg_class1 ?? 0,
          fuerte_4kg_class2: record.fuerte_4kg_class2 ?? record.totals?.fuerte_4kg_class2 ?? 0,
          fuerte_10kg_class1: record.fuerte_10kg_class1 ?? record.totals?.fuerte_10kg_class1 ?? 0,
          fuerte_10kg_class2: record.fuerte_10kg_class2 ?? record.totals?.fuerte_10kg_class2 ?? 0,
          hass_4kg_class1: record.hass_4kg_class1 ?? record.totals?.hass_4kg_class1 ?? 0,
          hass_4kg_class2: record.hass_4kg_class2 ?? record.totals?.hass_4kg_class2 ?? 0,
          hass_10kg_class1: record.hass_10kg_class1 ?? record.totals?.hass_10kg_class1 ?? 0,
          hass_10kg_class2: record.hass_10kg_class2 ?? record.totals?.hass_10kg_class2 ?? 0,
          intake_total_crates: intakeTotalCrates,
          rejected_crates: rejectedCrates,
          processed_crates: intakeTotalCrates - rejectedCrates,
        };
      });
  };

  const buildCasualRows = async () => {
    const params = new URLSearchParams();
    if (dateRange?.from && dateRange?.to) {
      params.set('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      params.set('endDate', format(dateRange.to, 'yyyy-MM-dd'));
    }
    const [attendanceRes, employeesRes] = await Promise.all([
      fetch(`/api/attendance?${params}`),
      fetch('/api/employees'),
    ]);
    if (!attendanceRes.ok) throw new Error('Failed to fetch attendance data');
    const attendance = await attendanceRes.json();
    const employeesData = employeesRes.ok ? await employeesRes.json() : [];
    const empMap = new Map<string, any>();
    (Array.isArray(employeesData) ? employeesData : []).forEach((e: any) => empMap.set(e.id, e));

    const list = Array.isArray(attendance) ? attendance : [];
    return list.map((record: any) => {
      const emp = empMap.get(record.employeeId) || record.employee || {};
      return {
        date: record.date || '',
        name: emp.name || record.employee_name || '',
        idNumber: emp.id_number || record.id_number || '',
        phone: emp.phone || record.phone || '',
        designation: record.designation || emp.position || emp.role || emp.designation || 'N/A',
        status: record.status || '',
        checkIn: record.clockInTime ? format(new Date(record.clockInTime), 'HH:mm:ss') : '',
        checkOut: record.clockOutTime ? format(new Date(record.clockOutTime), 'HH:mm:ss') : '',
      };
    });
  };

  const statusBreakdownRows = (counts: Record<string, number>) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => [key || 'Unknown', String(value)] as [string, string]);

  const buildProductionSummary = async () => {
    const [vehicleRows, intakeRows, countingRows, casualRows, utilityRes] = await Promise.all([
      buildVehicleRows(),
      buildIntakeRows(),
      buildCountingRows(),
      buildCasualRows(),
      (async () => {
        if (!dateRange?.from || !dateRange?.to) return null;
        const params = new URLSearchParams({
          startDate: format(dateRange.from, 'yyyy-MM-dd'),
          endDate: format(dateRange.to, 'yyyy-MM-dd'),
        });
        const res = await fetch(`/api/utility-readings?${params}`);
        return res.ok ? res.json() : null;
      })(),
    ]);

    const vehicleStatusCounts: Record<string, number> = {};
    vehicleRows.forEach((v: any) => {
      const key = v.status || 'Unknown';
      vehicleStatusCounts[key] = (vehicleStatusCounts[key] || 0) + 1;
    });

    const intakeTotals = intakeRows.reduce(
      (acc, row: any) => {
        acc.fuerteWeight += row.fuerte_weight || 0;
        acc.hassWeight += row.hass_weight || 0;
        acc.fuerteCrates += row.fuerte_crates_in || 0;
        acc.hassCrates += row.hass_crates_in || 0;
        acc.totalCrates += row.total_crates || 0;
        acc.rejectedCrates += row.rejected_crates || 0;
        acc.processedCrates += row.processed_crates || 0;
        return acc;
      },
      { fuerteWeight: 0, hassWeight: 0, fuerteCrates: 0, hassCrates: 0, totalCrates: 0, rejectedCrates: 0, processedCrates: 0 }
    );

    const countingTotals = countingRows.reduce(
      (acc, row: any) => {
        acc.fuerte4 += row.fuerte_4kg || 0;
        acc.fuerte10 += row.fuerte_10kg || 0;
        acc.hass4 += row.hass_4kg || 0;
        acc.hass10 += row.hass_10kg || 0;
        acc.fuerte4c1 += row.fuerte_4kg_class1 || 0;
        acc.fuerte4c2 += row.fuerte_4kg_class2 || 0;
        acc.fuerte10c1 += row.fuerte_10kg_class1 || 0;
        acc.fuerte10c2 += row.fuerte_10kg_class2 || 0;
        acc.hass4c1 += row.hass_4kg_class1 || 0;
        acc.hass4c2 += row.hass_4kg_class2 || 0;
        acc.hass10c1 += row.hass_10kg_class1 || 0;
        acc.hass10c2 += row.hass_10kg_class2 || 0;
        acc.intake += row.intake_total_crates || 0;
        acc.rejected += row.rejected_crates || 0;
        acc.processed += row.processed_crates || 0;
        return acc;
      },
      { fuerte4: 0, fuerte10: 0, hass4: 0, hass10: 0, fuerte4c1: 0, fuerte4c2: 0, fuerte10c1: 0, fuerte10c2: 0, hass4c1: 0, hass4c2: 0, hass10c1: 0, hass10c2: 0, intake: 0, rejected: 0, processed: 0 }
    );

    const attendanceStatusCounts: Record<string, number> = {};
    casualRows.forEach((r: any) => {
      const key = r.status || 'Unknown';
      attendanceStatusCounts[key] = (attendanceStatusCounts[key] || 0) + 1;
    });

    const attendanceDesignationCounts: Record<string, number> = {};
    casualRows.forEach((r: any) => {
      const key = formatDesignationLabel(r.designation);
      attendanceDesignationCounts[key] = (attendanceDesignationCounts[key] || 0) + 1;
    });

    const utilityReadingRows: any[] = Array.isArray(utilityRes?.readings) ? utilityRes.readings : [];
    const orderedUtilityReadings = [...utilityReadingRows].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const powerOpeningKeys = ['powerOfficeOpening', 'powerMachineOpening', 'powerColdroom1Opening', 'powerColdroom2Opening', 'powerOtherOpening'];
    const powerClosingKeys = ['powerOfficeClosing', 'powerMachineClosing', 'powerColdroom1Closing', 'powerColdroom2Closing', 'powerOtherClosing'];

    let electricityOpening = 0;
    let electricityClosing = 0;
    let waterOpening = 0;
    let waterClosing = 0;

    if (orderedUtilityReadings.length > 0) {
      const firstMeta = orderedUtilityReadings[0]?.metadata || {};
      const lastMeta = orderedUtilityReadings[orderedUtilityReadings.length - 1]?.metadata || {};

      electricityOpening = powerOpeningKeys.reduce((sum, key) => sum + Number(firstMeta[key] || 0), 0);
      electricityClosing = powerClosingKeys.reduce((sum, key) => sum + Number(lastMeta[key] || 0), 0);
      waterOpening = Number(firstMeta.waterMeter1Opening || 0) + Number(firstMeta.waterMeter2Opening || 0);
      waterClosing = Number(lastMeta.waterMeter1Closing || 0) + Number(lastMeta.waterMeter2Closing || 0);
    }

    const utilities = utilityRes
      ? {
          power: Number(utilityRes.totals?.power || 0),
          water: Number(utilityRes.totals?.water || 0),
          diesel: Number(utilityRes.totals?.diesel || 0),
          internet: Number(utilityRes.totals?.internet || 0),
          readings: Number(utilityRes.meta?.count || 0),
          electricityOpening,
          electricityClosing,
          waterOpening,
          waterClosing,
        }
      : { power: 0, water: 0, diesel: 0, internet: 0, readings: 0, electricityOpening: 0, electricityClosing: 0, waterOpening: 0, waterClosing: 0 };

    return {
      vehicle: { total: vehicleRows.length, byStatus: vehicleStatusCounts, rows: vehicleRows },
      intake: { deliveries: intakeRows.length, ...intakeTotals, rows: intakeRows },
      counting: { records: countingRows.length, ...countingTotals, rows: countingRows },
      attendance: { total: casualRows.length, byStatus: attendanceStatusCounts, byDesignation: attendanceDesignationCounts, rows: casualRows },
      utilities,
    };
  };

  const generateProductionReportPDF = async (summary: any, range: DateRange | undefined) => {
    const [{ default: jsPDFLandscape }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const pdf = new jsPDFLandscape('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 15;
    const contentWidth = pageWidth - 2 * leftMargin;

    const logoPaths = [
      '/images/HLogo.png',
      '/Harirlogo.svg',
      '/Harirlogo.png',
      '/Harirlogo.jpg',
      '/logo.png',
      '/logo.jpg',
      '/favicon.ico',
      '/public/favicon.ico'
    ];

    let hasLogo = false;
    for (const path of logoPaths) {
      try {
        const response = await fetch(path);
        if (!response.ok) continue;
        const blob = await response.blob();
        const base64String = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        pdf.addImage(base64String, 'PNG', (pageWidth - 110) / 2, 4, 110, 18);
        hasLogo = true;
        break;
      } catch (error) {
        continue;
      }
    }

    let yPos = hasLogo ? 28 : 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(120, 120, 120);
    pdf.text('PRODUCTION REPORT', pageWidth / 2, yPos, { align: 'center' });

    pdf.setDrawColor(120, 120, 120);
    pdf.setLineWidth(0.4);
    pdf.line(leftMargin, yPos + 3, pageWidth - leftMargin, yPos + 3);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const periodLabel =
      range?.from
        ? `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to || range.from, 'MMM dd, yyyy')}`
        : 'All time';
    pdf.text(`Period: ${periodLabel}`, pageWidth / 2, yPos + 9, { align: 'center' });

    const sections: { title: string; rows: [string, string][] }[] = [
      {
        title: 'VEHICLE LOG SUMMARY',
        rows: [
          ['Total Visits', String(summary.vehicle.total)],
          ...statusBreakdownRows(summary.vehicle.byStatus),
        ],
      },
      {
        title: 'INTAKE SUMMARY',
        rows: [
          ['Total Deliveries', String(summary.intake.deliveries)],
          ['Fuerte Crates In', summary.intake.fuerteCrates.toLocaleString()],
          ['Hass Crates In', summary.intake.hassCrates.toLocaleString()],
          ['Total Crates In', summary.intake.totalCrates.toLocaleString()],
          ['Rejected Crates', summary.intake.rejectedCrates.toLocaleString()],
          ['Processed Crates', summary.intake.processedCrates.toLocaleString()],
        ],
      },
      {
        title: 'COUNTING SUMMARY',
        rows: [
          ['Records', String(summary.counting.records)],
          ...([
            ['Fuerte 4kg Boxes Class 1', summary.counting.fuerte4c1],
            ['Fuerte 4kg Boxes Class 2', summary.counting.fuerte4c2],
            ['  Fuerte 4kg Subtotal', summary.counting.fuerte4],
            ['Fuerte 10kg Crates Class 1', summary.counting.fuerte10c1],
            ['Fuerte 10kg Crates Class 2', summary.counting.fuerte10c2],
            ['  Fuerte 10kg Subtotal', summary.counting.fuerte10],
            ['Hass 4kg Boxes Class 1', summary.counting.hass4c1],
            ['Hass 4kg Boxes Class 2', summary.counting.hass4c2],
            ['  Hass 4kg Subtotal', summary.counting.hass4],
            ['Hass 10kg Crates Class 1', summary.counting.hass10c1],
            ['Hass 10kg Crates Class 2', summary.counting.hass10c2],
            ['  Hass 10kg Subtotal', summary.counting.hass10],
          ] as [string, number][])
            .filter(([, value]) => value > 0)
            .map(([label, value]) => [label, value.toLocaleString()]),
        ],
      },
      {
        title: 'CASUALS ATTENDANCE SUMMARY',
        rows: [
          ['Total Records', String(summary.attendance.total)],
          ...casualDesignationOrder
            .filter(label => (summary.attendance.byDesignation[label] || 0) > 0)
            .map(label => [`  ${label}`, String(summary.attendance.byDesignation[label] || 0)]),
        ],
      },
      {
        title: 'UTILITY MANAGEMENT SUMMARY',
        rows: [
          ...([
            ['Electricity Consumed (kWh)', summary.utilities.power],
            ['Electricity Opening Reading (kWh)', summary.utilities.electricityOpening],
            ['Electricity Closing Reading (kWh)', summary.utilities.electricityClosing],
            ['Water Consumed (m³)', summary.utilities.water],
            ['Water Opening Reading (m³)', summary.utilities.waterOpening],
            ['Water Closing Reading (m³)', summary.utilities.waterClosing],
          ] as [string, number][])
            .filter(([, value]) => value > 0)
            .map(([label, value]) => [label, value.toLocaleString()]),
        ],
      },
    ];

    let cursor = yPos + 14;
    const pageBottom = pageHeight - 25;

    sections.forEach(section => {
      if (cursor > pageBottom) {
        pdf.addPage();
        cursor = 18;
      }
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 63, 33);
      pdf.text(section.title, leftMargin, cursor);
      autoTable(pdf, {
        startY: cursor + 3,
        head: [['Metric', 'Value']],
        body: section.rows,
        theme: 'grid',
        headStyles: { fillColor: [178, 235, 178], textColor: [33, 63, 33], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 1.8 },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.55 },
          1: { cellWidth: contentWidth * 0.45 },
        },
        margin: { left: leftMargin, right: leftMargin },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const label = String(data.row.cells[0]?.raw ?? '');
            if (label.startsWith('  ') && label.includes('Subtotal')) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [249, 115, 22];
            }
          }
        },
      });
      cursor = (pdf as any).lastAutoTable.finalY + 8;
    });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')} by Harir International System`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    pdf.save(`production_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleGeneratePdf = async () => {
    if (!selectedPdfReport) {
      toast({ variant: 'destructive', title: 'No Report Selected', description: 'Please select a PDF report to generate.' });
      return;
    }

    const reportType = pdfReportTypes.find(r => r.id === selectedPdfReport);
    if (!reportType) return;

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        variant: 'destructive',
        title: 'Date Range Required',
        description: 'Please select a date range to generate this report.',
      });
      return;
    }

    setIsGenerating(true);
    toast({ title: `Generating ${reportType.label}...`, description: 'Fetching module data and generating report.' });

    try {
      switch (selectedPdfReport) {
        case 'supplierReport': {
          const startDateStr = format(dateRange.from, 'yyyy-MM-dd');
          const endDateStr = format(dateRange.to, 'yyyy-MM-dd');
          const response = await fetch(`/api/suppliers?startDate=${startDateStr}&endDate=${endDateStr}`);

          if (!response.ok) {
            throw new Error(`Failed to fetch supplier data: ${response.statusText}`);
          }

          const suppliers = await response.json();

          if (suppliers.length === 0) {
            toast({
              variant: 'destructive',
              title: 'No Data Found',
              description: 'No suppliers found for the selected date range.',
            });
            break;
          }

          await generateSupplierReportPDF(suppliers, dateRange);
          toast({
            title: 'Suppliers Report Generated',
            description: `Suppliers report for ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')} has been downloaded.`,
          });
          break;
        }

        case 'visitorLogReport': {
          const rows = await buildVisitorRows();
          if (rows.length === 0) {
            toast({
              variant: 'destructive',
              title: 'No Data Found',
              description: 'No visitor records found for the selected date range.',
            });
            break;
          }
          await generateModuleReportPdf({
            title: 'VISITOR LOG REPORT',
            headers: ['Date', 'Visitor ID', 'Name', 'ID Number', 'Phone', 'Company', 'Vehicle Plate', 'Status', 'Check-in', 'Check-out', 'Department', 'Visitor Type'],
            body: rows.map(r => [
              r.date, r.visitorId, r.name, r.idNumber, r.phone, r.company, r.vehiclePlate,
              r.status, r.checkInTime, r.checkOutTime, r.department, r.visitorType
            ]),
            summary: [`Total Visitors: ${rows.length}`],
            columnStyles: {
              0: { cellWidth: 22 },
              1: { cellWidth: 22 },
              2: { cellWidth: 28 },
              3: { cellWidth: 24 },
              4: { cellWidth: 24 },
              5: { cellWidth: 26 },
              6: { cellWidth: 18 },
              7: { cellWidth: 18 },
              8: { cellWidth: 25 },
              9: { cellWidth: 25 },
              10: { cellWidth: 22 },
              11: { cellWidth: 20 },
            },
            filename: `visitor_log_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          });
          toast({
            title: 'Visitor Log Report Generated',
            description: `Visitor log for ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')} has been downloaded.`,
          });
          break;
        }

        case 'vehicleLogReport': {
          const rows = await buildVehicleRows();
          if (rows.length === 0) {
            toast({
              variant: 'destructive',
              title: 'No Data Found',
              description: 'No vehicle visits found for the selected date range.',
            });
            break;
          }
          await generateModuleReportPdf({
            title: 'VEHICLE VISITS REPORT',
            headers: ['Visit #', 'Gate Entry ID', 'Driver Name', 'ID Number', 'Phone', 'Vehicle Plate', 'Vehicle Type', 'Cargo Description', 'Status', 'Registered', 'Check-in', 'Check-out', 'Duration'],
            body: rows.map(r => [
              r.visitNumber, r.gateEntryId, r.driverName, r.idNumber, r.phone, r.vehiclePlate,
              r.vehicleType, r.cargoDescription, r.status, r.registeredAt, r.checkInTime,
              r.checkOutTime, r.duration
            ]),
            summary: [`Total Visits: ${rows.length}`],
            columnStyles: {
              0: { cellWidth: 13 },
              1: { cellWidth: 22 },
              2: { cellWidth: 24 },
              3: { cellWidth: 20 },
              4: { cellWidth: 20 },
              5: { cellWidth: 16 },
              6: { cellWidth: 16 },
              7: { cellWidth: 24 },
              8: { cellWidth: 18 },
              9: { cellWidth: 24 },
              10: { cellWidth: 24 },
              11: { cellWidth: 24 },
              12: { cellWidth: 14 },
            },
            filename: `vehicle_log_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          });
          toast({
            title: 'Vehicle Log Report Generated',
            description: `Vehicle log for ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')} has been downloaded.`,
          });
          break;
        }

        case 'intakeReport': {
          const rows = await buildIntakeRows();
          if (rows.length === 0) {
            toast({
              variant: 'destructive',
              title: 'No Data Found',
              description: 'No intake records found for the selected date range.',
            });
            break;
          }
          const totals = rows.reduce((acc, row) => {
            acc.fuerteWeight += row.fuerte_weight || 0;
            acc.hassWeight += row.hass_weight || 0;
            acc.fuerteCrates += row.fuerte_crates_in || 0;
            acc.hassCrates += row.hass_crates_in || 0;
            acc.totalCrates += row.total_crates || 0;
            acc.rejectedCrates += row.rejected_crates || 0;
            acc.processedCrates += row.processed_crates || 0;
            return acc;
          }, { fuerteWeight: 0, hassWeight: 0, fuerteCrates: 0, hassCrates: 0, totalCrates: 0, rejectedCrates: 0, processedCrates: 0 });

          const body = rows.map(r => [
            r.date, r.time, r.supplier_name, r.phone_number, r.vehicle_plate_number, r.gate_entry_id,
            Number(r.fuerte_weight).toFixed(2), Number(r.hass_weight).toFixed(2),
            r.fuerte_crates_in, r.hass_crates_in, r.total_crates, r.rejected_crates, r.processed_crates, r.region
          ]);
          body.push([
            'TOTALS', '', '', '', '', '',
            totals.fuerteWeight.toFixed(2), totals.hassWeight.toFixed(2),
            totals.fuerteCrates, totals.hassCrates, totals.totalCrates, totals.rejectedCrates, totals.processedCrates, ''
          ]);

          await generateModuleReportPdf({
            title: 'WEIGHT CAPTURE REPORT',
            headers: ['Date', 'Time', 'Supplier Name', 'Phone Number', 'Vehicle', 'Gate ID', 'Fuerte (kg)', 'Hass (kg)', 'Fuerte Crates', 'Hass Crates', 'Total Crates', 'Rejected Crates', 'Processed', 'Region'],
            body,
            summary: [`Total Records: ${rows.length}`],
            columnStyles: {
              0: { cellWidth: 22 },
              1: { cellWidth: 13 },
              2: { cellWidth: 33 },
              3: { cellWidth: 24 },
              4: { cellWidth: 16 },
              5: { cellWidth: 19 },
              6: { cellWidth: 19, halign: 'right' },
              7: { cellWidth: 19, halign: 'right' },
              8: { cellWidth: 16, halign: 'center' },
              9: { cellWidth: 16, halign: 'center' },
              10: { cellWidth: 15, halign: 'center' },
              11: { cellWidth: 17, halign: 'center' },
              12: { cellWidth: 18, halign: 'center' },
              13: { cellWidth: 17 },
            },
            filename: `intake_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
            totalsRow: true,
          });
          toast({
            title: 'Intake Report Generated',
            description: `Intake report for ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')} has been downloaded.`,
          });
          break;
        }

        case 'countingReport': {
          const rows = await buildCountingRows();
          if (rows.length === 0) {
            toast({
              variant: 'destructive',
              title: 'No Data Found',
              description: 'No counting records found for the selected date range.',
            });
            break;
          }
          const totals = rows.reduce((acc, row) => {
            acc.fuerte4 += row.fuerte_4kg || 0;
            acc.fuerte10 += row.fuerte_10kg || 0;
            acc.hass4 += row.hass_4kg || 0;
            acc.hass10 += row.hass_10kg || 0;
            acc.intake += row.intake_total_crates || 0;
            acc.rejected += row.rejected_crates || 0;
            acc.processed += row.processed_crates || 0;
            return acc;
          }, { fuerte4: 0, fuerte10: 0, hass4: 0, hass10: 0, intake: 0, rejected: 0, processed: 0 });

          const body = rows.map(r => [
            r.date, r.time, r.supplier_name, r.region,
            r.fuerte_4kg, r.fuerte_10kg, r.hass_4kg, r.hass_10kg,
            r.intake_total_crates, r.rejected_crates, r.processed_crates
          ]);
          body.push([
            'TOTALS', '', '', '',
            totals.fuerte4, totals.fuerte10, totals.hass4, totals.hass10,
            totals.intake, totals.rejected, totals.processed
          ]);

          await generateModuleReportPdf({
            title: 'COUNTING REPORT',
            headers: ['Date', 'Time', 'Supplier Name', 'Region', 'Fuerte 4kg', 'Fuerte 10kg', 'Hass 4kg', 'Hass 10kg', 'Intake Crates', 'Rejected Crates', 'Processed Crates'],
            body,
            summary: [`Total Records: ${rows.length}`],
            columnStyles: {
              0: { cellWidth: 24 },
              1: { cellWidth: 15 },
              2: { cellWidth: 44 },
              3: { cellWidth: 22 },
              4: { cellWidth: 16, halign: 'center' },
              5: { cellWidth: 16, halign: 'center' },
              6: { cellWidth: 16, halign: 'center' },
              7: { cellWidth: 16, halign: 'center' },
              8: { cellWidth: 20, halign: 'center' },
              9: { cellWidth: 20, halign: 'center' },
              10: { cellWidth: 24, halign: 'center' },
            },
            filename: `counting_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
            totalsRow: true,
          });
          toast({
            title: 'Counting Report Generated',
            description: `Counting report for ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')} has been downloaded.`,
          });
          break;
        }

        case 'casualsReport': {
          const rows = await buildCasualRows();
          if (rows.length === 0) {
            toast({
              variant: 'destructive',
              title: 'No Data Found',
              description: 'No attendance records found for the selected date range.',
            });
            break;
          }
          await generateModuleReportPdf({
            title: 'CASUALS ATTENDANCE REPORT',
            headers: ['Date', 'Name', 'ID Number', 'Phone', 'Designation', 'Status', 'Check In', 'Check Out'],
            body: rows.map(r => [
              r.date, r.name, r.idNumber, r.phone, r.designation, r.status, r.checkIn, r.checkOut
            ]),
            summary: [`Total Records: ${rows.length}`],
            columnStyles: {
              0: { cellWidth: 34 },
              1: { cellWidth: 44 },
              2: { cellWidth: 34 },
              3: { cellWidth: 34 },
              4: { cellWidth: 40 },
              5: { cellWidth: 30 },
              6: { cellWidth: 30 },
              7: { cellWidth: 30 },
            },
            filename: `casuals_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          });
          toast({
            title: 'Casuals Report Generated',
            description: `Casuals report for ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')} has been downloaded.`,
          });
          break;
        }

        case 'productionReport': {
          const summary = await buildProductionSummary();
          if (
            summary.vehicle.total === 0 &&
            summary.intake.deliveries === 0 &&
            summary.counting.records === 0 &&
            summary.attendance.total === 0
          ) {
            toast({
              variant: 'destructive',
              title: 'No Data Found',
              description: 'No production data found for the selected date range.',
            });
            break;
          }
          await generateProductionReportPDF(summary, dateRange);
          toast({
            title: 'Production Report Generated',
            description: `Production summary for ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')} has been downloaded.`,
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Failed to generate the report. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateXLS = async () => {
    const report = xlsReportTypes.find(r => r.id === selectedXlsReport);
    if (!report) return;

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        variant: 'destructive',
        title: 'Date Range Required',
        description: 'Please select a date range to generate this report.',
      });
      return;
    }

    setIsGenerating(true);
    toast({
      title: 'Generating Excel Report...',
      description: `Please wait while we generate the ${report.label} report.`
    });

    try {
      const startDateStr = format(dateRange.from, 'yyyy-MM-dd');
      const endDateStr = format(dateRange.to, 'yyyy-MM-dd');
      const dateLabel = `${startDateStr}_to_${endDateStr}`;
      const noData = (label: string) => {
        toast({
          variant: 'destructive',
          title: 'No Data Found',
          description: `No ${label} found for the selected date range.`,
        });
      };

      switch (report.id) {
        case 'supplierReport': {
          const startTimeStr = timeRange.from;
          const endTimeStr = timeRange.to;
          const response = await fetch(`/api/suppliers?startDate=${startDateStr}&endDate=${endDateStr}&startTime=${startTimeStr}&endTime=${endTimeStr}&format=xlsx`);

          if (!response.ok) {
            throw new Error(`Failed to fetch supplier data: ${response.statusText}`);
          }

          const blob = await response.blob();
          let downloadFilename = `suppliers_${dateLabel}.xlsx`;
          const contentDisposition = response.headers.get('Content-Disposition');
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^";]+)"?/);
            if (match) {
              downloadFilename = match[1];
            }
          }

          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", downloadFilename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: 'Excel Export Complete',
            description: `Supplier report for ${startDateStr} to ${endDateStr} has been downloaded.`,
          });
          break;
        }

        case 'visitorLogReport': {
          const rows = await buildVisitorRows();
          if (rows.length === 0) {
            noData('visitor records');
            break;
          }
          const columns: XlsxColumn[] = [
            { header: 'Date', key: 'date' },
            { header: 'Visitor ID', key: 'visitorId', text: true },
            { header: 'Name', key: 'name' },
            { header: 'ID Number', key: 'idNumber', text: true },
            { header: 'Phone', key: 'phone', text: true },
            { header: 'Company', key: 'company' },
            { header: 'Vehicle Plate', key: 'vehiclePlate' },
            { header: 'Status', key: 'status' },
            { header: 'Check-in Time', key: 'checkInTime' },
            { header: 'Check-out Time', key: 'checkOutTime' },
            { header: 'Expected Check-in Time', key: 'expectedCheckInTime' },
            { header: 'Department', key: 'department' },
            { header: 'Purpose', key: 'purpose' },
            { header: 'Visitor Type', key: 'visitorType' },
            { header: 'Host Name', key: 'hostName' },
          ];
          downloadXlsx(rows as Record<string, unknown>[], columns, `visitor_log_${dateLabel}.xlsx`, 'Visitors');
          toast({
            title: 'Excel Export Complete',
            description: `Visitor log for ${startDateStr} to ${endDateStr} has been downloaded.`,
          });
          break;
        }

        case 'vehicleLogReport': {
          const rows = await buildVehicleRows();
          if (rows.length === 0) {
            noData('vehicle visits');
            break;
          }
          const columns: XlsxColumn[] = [
            { header: 'Visit #', key: 'visitNumber', text: true },
            { header: 'Gate Entry ID', key: 'gateEntryId', text: true },
            { header: 'Driver Name', key: 'driverName' },
            { header: 'ID Number', key: 'idNumber', text: true },
            { header: 'Phone', key: 'phone', text: true },
            { header: 'Vehicle Plate', key: 'vehiclePlate' },
            { header: 'Vehicle Type', key: 'vehicleType' },
            { header: 'Cargo Description', key: 'cargoDescription' },
            { header: 'Status', key: 'status' },
            { header: 'Registered At', key: 'registeredAt' },
            { header: 'Check-in Time', key: 'checkInTime' },
            { header: 'Check-out Time', key: 'checkOutTime' },
            { header: 'Duration', key: 'duration' },
            { header: 'Visit Type', key: 'visitType' },
            { header: 'Recheck-in', key: 'recheckIn' },
          ];
          downloadXlsx(rows as Record<string, unknown>[], columns, `vehicle_log_${dateLabel}.xlsx`, 'Vehicle Visits');
          toast({
            title: 'Excel Export Complete',
            description: `Vehicle log for ${startDateStr} to ${endDateStr} has been downloaded.`,
          });
          break;
        }

        case 'intakeReport': {
          const rows = await buildIntakeRows();
          if (rows.length === 0) {
            noData('intake records');
            break;
          }
          const totals = rows.reduce((acc, row) => {
            acc.fuerteWeight += row.fuerte_weight || 0;
            acc.hassWeight += row.hass_weight || 0;
            acc.fuerteCrates += row.fuerte_crates_in || 0;
            acc.hassCrates += row.hass_crates_in || 0;
            acc.totalCrates += row.total_crates || 0;
            acc.rejectedCrates += row.rejected_crates || 0;
            acc.processedCrates += row.processed_crates || 0;
            return acc;
          }, { fuerteWeight: 0, hassWeight: 0, fuerteCrates: 0, hassCrates: 0, totalCrates: 0, rejectedCrates: 0, processedCrates: 0 });

          const columns: XlsxColumn[] = [
            { header: 'Date', key: 'date' },
            { header: 'Time', key: 'time' },
            { header: 'Supplier Name', key: 'supplier_name' },
            { header: 'Phone Number', key: 'phone_number', text: true },
            { header: 'Vehicle', key: 'vehicle_plate_number' },
            { header: 'Gate ID', key: 'gate_entry_id' },
            { header: 'Fuerte (kg)', key: 'fuerte_weight' },
            { header: 'Hass (kg)', key: 'hass_weight' },
            { header: 'Fuerte Crates', key: 'fuerte_crates_in' },
            { header: 'Hass Crates', key: 'hass_crates_in' },
            { header: 'Total Crates', key: 'total_crates' },
            { header: 'Rejected Crates', key: 'rejected_crates' },
            { header: 'Processed', key: 'processed_crates' },
            { header: 'Region', key: 'region' },
          ];
          const exportRows: Record<string, unknown>[] = rows.map(r => ({
            date: r.date,
            time: r.time,
            supplier_name: r.supplier_name,
            phone_number: r.phone_number,
            vehicle_plate_number: r.vehicle_plate_number,
            gate_entry_id: r.gate_entry_id,
            fuerte_weight: Number(r.fuerte_weight).toFixed(2),
            hass_weight: Number(r.hass_weight).toFixed(2),
            fuerte_crates_in: r.fuerte_crates_in,
            hass_crates_in: r.hass_crates_in,
            total_crates: r.total_crates,
            rejected_crates: r.rejected_crates,
            processed_crates: r.processed_crates,
            region: r.region,
          }));
          exportRows.push({
            date: 'TOTALS',
            time: '',
            supplier_name: '',
            phone_number: '',
            vehicle_plate_number: '',
            gate_entry_id: '',
            fuerte_weight: totals.fuerteWeight.toFixed(2),
            hass_weight: totals.hassWeight.toFixed(2),
            fuerte_crates_in: totals.fuerteCrates,
            hass_crates_in: totals.hassCrates,
            total_crates: totals.totalCrates,
            rejected_crates: totals.rejectedCrates,
            processed_crates: totals.processedCrates,
            region: '',
          });
          downloadXlsx(exportRows, columns, `intake_report_${dateLabel}.xlsx`, 'Intake');
          toast({
            title: 'Excel Export Complete',
            description: `Intake report for ${startDateStr} to ${endDateStr} has been downloaded.`,
          });
          break;
        }

        case 'countingReport': {
          const rows = await buildCountingRows();
          if (rows.length === 0) {
            noData('counting records');
            break;
          }
          const totals = rows.reduce((acc, row) => {
            acc.fuerte4 += row.fuerte_4kg || 0;
            acc.fuerte10 += row.fuerte_10kg || 0;
            acc.hass4 += row.hass_4kg || 0;
            acc.hass10 += row.hass_10kg || 0;
            acc.intake += row.intake_total_crates || 0;
            acc.rejected += row.rejected_crates || 0;
            acc.processed += row.processed_crates || 0;
            return acc;
          }, { fuerte4: 0, fuerte10: 0, hass4: 0, hass10: 0, intake: 0, rejected: 0, processed: 0 });

          const columns: XlsxColumn[] = [
            { header: 'Date', key: 'date' },
            { header: 'Time', key: 'time' },
            { header: 'Supplier Name', key: 'supplier_name' },
            { header: 'Region', key: 'region' },
            { header: 'Fuerte 4kg', key: 'fuerte_4kg' },
            { header: 'Fuerte 10kg', key: 'fuerte_10kg' },
            { header: 'Hass 4kg', key: 'hass_4kg' },
            { header: 'Hass 10kg', key: 'hass_10kg' },
            { header: 'Intake Crates', key: 'intake_total_crates' },
            { header: 'Rejected Crates', key: 'rejected_crates' },
            { header: 'Processed Crates', key: 'processed_crates' },
          ];
          const exportRows: Record<string, unknown>[] = rows.map(r => ({
            date: r.date,
            time: r.time,
            supplier_name: r.supplier_name,
            region: r.region,
            fuerte_4kg: r.fuerte_4kg,
            fuerte_10kg: r.fuerte_10kg,
            hass_4kg: r.hass_4kg,
            hass_10kg: r.hass_10kg,
            intake_total_crates: r.intake_total_crates,
            rejected_crates: r.rejected_crates,
            processed_crates: r.processed_crates,
          }));
          exportRows.push({
            date: 'TOTALS',
            time: '',
            supplier_name: '',
            region: '',
            fuerte_4kg: totals.fuerte4,
            fuerte_10kg: totals.fuerte10,
            hass_4kg: totals.hass4,
            hass_10kg: totals.hass10,
            intake_total_crates: totals.intake,
            rejected_crates: totals.rejected,
            processed_crates: totals.processed,
          });
          downloadXlsx(exportRows, columns, `counting_report_${dateLabel}.xlsx`, 'Counting');
          toast({
            title: 'Excel Export Complete',
            description: `Counting report for ${startDateStr} to ${endDateStr} has been downloaded.`,
          });
          break;
        }

        case 'casualsReport': {
          const rows = await buildCasualRows();
          if (rows.length === 0) {
            noData('attendance records');
            break;
          }
          const columns: XlsxColumn[] = [
            { header: 'Date', key: 'date' },
            { header: 'Name', key: 'name' },
            { header: 'ID Number', key: 'idNumber', text: true },
            { header: 'Phone', key: 'phone', text: true },
            { header: 'Designation', key: 'designation' },
            { header: 'Status', key: 'status' },
            { header: 'Check In', key: 'checkIn' },
            { header: 'Check Out', key: 'checkOut' },
          ];
          downloadXlsx(rows as Record<string, unknown>[], columns, `casuals_report_${dateLabel}.xlsx`, 'Casuals');
          toast({
            title: 'Excel Export Complete',
            description: `Casuals report for ${startDateStr} to ${endDateStr} has been downloaded.`,
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to generate Excel report. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshTraceLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
                Harir International
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="p-4 md:p-6 lg:p-8 space-y-6">

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                 <p className="text-muted-foreground">Generate custom PDF reports or export raw data as Excel.</p>
            </div>
             <div className="grid gap-4 p-4 border rounded-lg bg-muted/50 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                  <Label className="font-semibold">Global Date Filter:</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          formatDateTimeFilterLabel(dateRange, timeRange)
                        ) : (
                          <span>Pick a date range</span>
                        )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                        />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="report-start-time" className="text-sm font-medium">Start Time</Label>
                    <input
                      id="report-start-time"
                      type="time"
                      value={timeRange.from}
                      onChange={(e) => setTimeRange(prev => ({ ...prev, from: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="report-end-time" className="text-sm font-medium">End Time</Label>
                    <input
                      id="report-end-time"
                      type="time"
                      value={timeRange.to}
                      onChange={(e) => setTimeRange(prev => ({ ...prev, to: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground md:col-span-2">
                  Applies to all generated reports and exports. Required to generate any module report.
                </p>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText />
                    PDF Reports
                  </CardTitle>
                  <CardDescription>
                    Select a report to generate a downloadable, formatted PDF document.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-sm font-medium">Report Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {pdfReportTypes.map((report) => (
                      <div key={report.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={report.id}
                          checked={selectedPdfReport === report.id}
                          onCheckedChange={() => {
                            setSelectedPdfReport(report.id)
                          }}
                        />
                        <Label
                          htmlFor={report.id}
                          className="flex items-center gap-2 font-normal"
                        >
                          <report.icon className="w-4 h-4" />
                          {report.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" onClick={handleGeneratePdf} disabled={!selectedPdfReport || isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    {isGenerating ? 'Generating...' : 'Generate PDF Report'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart />
                    Data Exports (Excel)
                  </CardTitle>
                  <CardDescription>
                    Generate Excel exports for general operational data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-sm font-medium">Report Type</h3>
                  <div className="space-y-3">
                    {xlsReportTypes.map((report) => (
                      <div key={report.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`xls-${report.id}`}
                          checked={selectedXlsReport === report.id}
                          onCheckedChange={() => setSelectedXlsReport(report.id)}
                        />
                        <Label htmlFor={`xls-${report.id}`} className="font-normal">
                          {report.icon && <report.icon className="w-4 h-4 mr-2 inline" />}
                          {report.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleGenerateXLS} 
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    {isGenerating ? 'Generating...' : 'Generate & Download Excel'}
                  </Button>
                  {dateRange?.from && dateRange?.to && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Generating report for: {format(dateRange.from, 'MMM dd, yyyy')} {timeRange.from} to {format(dateRange.to, 'MMM dd, yyyy')} {timeRange.to}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
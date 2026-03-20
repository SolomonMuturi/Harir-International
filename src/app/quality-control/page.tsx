'use client';

import { useState, useEffect, useRef } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  History,
  Printer,
  Plus,
  Trash2,
  Layers,
  Sticker,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';

interface QualityCheck {
  id: string;
  weight_entry_id: string;
  pallet_id: string;
  supplier_name: string;
  driver_name: string;
  vehicle_plate: string;
  total_weight: number;
  overall_status: 'approved' | 'rejected';
  notes: string;
  processed_by: string;
  processed_at: string;
  fuerte_class1: number;
  fuerte_class2: number;
  fuerte_overall: number;
  hass_class1: number;
  hass_class2: number;
  hass_overall: number;
}

interface LabelItem {
  id: string;
  code: string;
  class: 'C1' | 'C2' | 'Reject';
}

export default function QualityControlPage() {
  const { toast } = useToast();
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accepted' | 'declined' | 'history' | 'print'>('accepted');
  
  // Print label state
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [currentCode, setCurrentCode] = useState('');
  const [currentClass, setCurrentClass] = useState<'C1' | 'C2' | 'Reject'>('C1');
  
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  // Load quality checks from database
  const loadQualityChecks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/quality-control');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quality checks: ${response.status}`);
      }
      
      const qualityChecksData = await response.json();
      
      // Transform quality checks data
      const transformedChecks: QualityCheck[] = qualityChecksData.map((qc: any) => ({
        id: qc.id,
        weight_entry_id: qc.weight_entry_id,
        pallet_id: qc.pallet_id || `WE-${qc.weight_entry_id}`,
        supplier_name: qc.supplier_name || 'Unknown Supplier',
        driver_name: qc.driver_name || '',
        vehicle_plate: qc.vehicle_plate || '',
        total_weight: qc.net_weight || 0,
        overall_status: qc.overall_status as 'approved' | 'rejected',
        notes: qc.notes || '',
        processed_by: qc.processed_by || 'QC Officer',
        processed_at: qc.processed_at || new Date().toISOString(),
        fuerte_class1: qc.fuerte_class1 || 0,
        fuerte_class2: qc.fuerte_class2 || 0,
        fuerte_overall: qc.fuerte_overall || 0,
        hass_class1: qc.hass_class1 || 0,
        hass_class2: qc.hass_class2 || 0,
        hass_overall: qc.hass_overall || 0
      }));
      
      setQualityChecks(transformedChecks);
      
    } catch (error) {
      console.error('Error fetching quality checks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quality check history.',
        variant: 'destructive',
      });
      setQualityChecks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadQualityChecks();
  }, [toast]);

  // Add a new label
  const addLabel = () => {
    if (!currentCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a code',
        variant: 'destructive',
      });
      return;
    }

    const newLabel: LabelItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      code: currentCode.trim(),
      class: currentClass,
    };

    setLabels([...labels, newLabel]);
    setCurrentCode('');
  };

  // Remove a label
  const removeLabel = (id: string) => {
    setLabels(labels.filter(label => label.id !== id));
  };

  // Clear all labels
  const clearAllLabels = () => {
    setLabels([]);
  };

  // Handle key press (Enter to add)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addLabel();
    }
  };

  // Use quality checks for Accepted/Declined tabs
  const acceptedQualityChecks = qualityChecks.filter(qc => qc.overall_status === 'approved');
  const declinedQualityChecks = qualityChecks.filter(qc => qc.overall_status === 'rejected');

  // Helper function to render packability details
  const renderPackability = (qc: QualityCheck) => (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
      {(qc.fuerte_overall > 0 || qc.hass_overall > 0) && (
        <>
          {qc.fuerte_overall > 0 && (
            <div className="bg-black p-2 rounded border text-sm">
              <div className="font-medium">Avocado Fuerte</div>
              <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                <div>
                  <div className="text-gray-500">Class 1</div>
                  <div className="font-semibold">{qc.fuerte_class1}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Class 2</div>
                  <div className="font-semibold">{qc.fuerte_class2}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Overall</div>
                  <div className={`font-bold ${qc.overall_status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                    {qc.fuerte_overall}%
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {qc.hass_overall > 0 && (
            <div className="bg-black p-2 rounded border text-sm">
              <div className="font-medium">Avocado Hass</div>
              <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                <div>
                  <div className="text-gray-500">Class 1</div>
                  <div className="font-semibold">{qc.hass_class1}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Class 2</div>
                  <div className="font-semibold">{qc.hass_class2}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Overall</div>
                  <div className={`font-bold ${qc.overall_status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                    {qc.hass_overall}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Printable Stickers Component - Full bleed A4 with 4 stickers (2x2 grid) - Even larger font
  const PrintableStickers = ({ labels }: { labels: LabelItem[] }) => (
    <div ref={printRef}>
      <style type="text/css" dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 210mm;
              height: 297mm;
              background: white;
            }
            .sticker-page {
              page-break-after: always;
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              position: relative;
            }
            .sticker-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
            }
            .sticker-cell {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              border: 2px solid #000;
              box-sizing: border-box;
              width: 105mm;
              height: 148.5mm;
              margin: 0;
              padding: 5mm;
            }
            .sticker-code {
              font-size: 56px;
              font-family: Arial, Helvetica, sans-serif;
              font-weight: bold;
              margin-bottom: 20px;
              text-align: center;
              word-break: break-word;
              line-height: 1.2;
            }
            .sticker-class {
              font-size: 84px;
              font-family: Arial, Helvetica, sans-serif;
              font-weight: bold;
              text-align: center;
              line-height: 1.2;
            }
            .sticker-cell.empty {
              border: 2px dashed #ccc;
            }
            .sticker-cell.empty .sticker-code {
              color: #ccc;
            }
          }
          .sticker-page {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: white;
          }
          .sticker-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
          }
          .sticker-cell {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border: 2px solid #000;
            box-sizing: border-box;
            width: 105mm;
            height: 148.5mm;
            margin: 0;
            padding: 5mm;
          }
          .sticker-code {
            font-size: 56px;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            word-break: break-word;
            line-height: 1.2;
          }
          .sticker-class {
            font-size: 84px;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: bold;
            text-align: center;
            line-height: 1.2;
          }
          .sticker-cell.empty {
            border: 2px dashed #ccc;
          }
          .print-header {
            display: none;
          }
        `
      }} />
      
      <div className="print-header mb-4 p-2 bg-gray-100 print:hidden">
        <h3 className="text-lg font-bold">Sticker Preview - {labels.length} Stickers</h3>
        <p className="text-sm text-gray-600">4 stickers per A4 sheet (full bleed) - 56pt code, 84pt class</p>
      </div>
      
      {/* Group stickers into pages of 4 */}
      {labels.length > 0 ? (
        Array.from({ length: Math.ceil(labels.length / 4) }).map((_, pageIndex) => (
          <div key={pageIndex} className="sticker-page">
            <div className="sticker-grid">
              {[0, 1, 2, 3].map((position) => {
                const labelIndex = pageIndex * 4 + position;
                const label = labels[labelIndex];
                
                return (
                  <div key={position} className={`sticker-cell ${!label ? 'empty' : ''}`}>
                    {label ? (
                      <>
                        <div className="sticker-code">{label.code}</div>
                        <div className="sticker-class">{label.class}</div>
                      </>
                    ) : (
                      <>
                        <div className="sticker-code">Empty</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          No stickers to print. Please add stickers first.
        </div>
      )}
    </div>
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="w-8 h-8 text-primary" />
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
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FlaskConical />
              Supplier Quality Control
            </h2>
            <p className="text-muted-foreground">
              View and manage quality control assessments
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="accepted" className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                Accepted ({acceptedQualityChecks.length})
              </TabsTrigger>
              <TabsTrigger value="declined" className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" />
                Declined ({declinedQualityChecks.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                QC History ({qualityChecks.length})
              </TabsTrigger>
              <TabsTrigger value="print" className="flex items-center gap-2">
                <Sticker className="w-4 h-4" />
                Print Stickers
              </TabsTrigger>
            </TabsList>

            {/* Accepted Suppliers Tab */}
            <TabsContent value="accepted" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    Accepted Suppliers
                  </CardTitle>
                  <CardDescription>
                    {acceptedQualityChecks.length} suppliers accepted after QC assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-gray-500 mt-2">Loading quality checks...</p>
                    </div>
                  ) : acceptedQualityChecks.length === 0 ? (
                    <div className="text-center py-8">
                      <ThumbsUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No accepted suppliers yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Accepted suppliers will appear here after QC assessment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {acceptedQualityChecks.map((qc) => (
                        <div key={qc.id} className="border rounded-lg p-4 bg-black-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {qc.supplier_name}
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Accepted
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                                <span>Pallet: {qc.pallet_id}</span>
                                <span>Vehicle: {qc.vehicle_plate}</span>
                                <span>Driver: {qc.driver_name}</span>
                                <span>QC Date: {qc.processed_at ? format(new Date(qc.processed_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Total Weight</div>
                              <div className="font-bold">{qc.total_weight} kg</div>
                            </div>
                          </div>
                          
                          {renderPackability(qc)}
                          
                          {qc.notes && (
                            <div className="mt-3 p-2 bg-black rounded text-sm">
                              <span className="text-gray-500">Notes:</span> {qc.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Declined Suppliers Tab */}
            <TabsContent value="declined" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4" />
                    Declined Suppliers
                  </CardTitle>
                  <CardDescription>
                    {declinedQualityChecks.length} suppliers declined after QC assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-gray-500 mt-2">Loading quality checks...</p>
                    </div>
                  ) : declinedQualityChecks.length === 0 ? (
                    <div className="text-center py-8">
                      <ThumbsDown className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No declined suppliers yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Declined suppliers will appear here after QC assessment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {declinedQualityChecks.map((qc) => (
                        <div key={qc.id} className="border rounded-lg p-4 bg-black-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {qc.supplier_name}
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Declined
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                                <span>Pallet: {qc.pallet_id}</span>
                                <span>Vehicle: {qc.vehicle_plate}</span>
                                <span>Driver: {qc.driver_name}</span>
                                <span>QC Date: {qc.processed_at ? format(new Date(qc.processed_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Total Weight</div>
                              <div className="font-bold">{qc.total_weight} kg</div>
                            </div>
                          </div>
                          
                          {renderPackability(qc)}
                          
                          {qc.notes && (
                            <div className="mt-3 p-2 bg-black rounded text-sm">
                              <span className="text-gray-500">Notes:</span> {qc.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* QC History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    QC History
                  </CardTitle>
                  <CardDescription>
                    Complete history of all QC assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-gray-500 mt-2">Loading quality checks...</p>
                    </div>
                  ) : qualityChecks.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No QC history available</p>
                      <p className="text-sm text-gray-400 mt-1">
                        QC assessments will appear here after they are submitted
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qualityChecks.map((qc) => (
                        <div key={qc.id} className="border rounded-lg p-3 bg-black-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold">{qc.supplier_name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Pallet: {qc.pallet_id} • {qc.overall_status === 'approved' ? 'Accepted' : 'Declined'} • {qc.processed_at ? format(new Date(qc.processed_at), 'MMM dd, yyyy') : 'N/A'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Weight</div>
                              <div className="font-bold">{qc.total_weight} kg</div>
                            </div>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            {qc.fuerte_overall > 0 && (
                              <div>
                                <span className="text-gray-500">Fuerte:</span> {qc.fuerte_overall}%
                              </div>
                            )}
                            {qc.hass_overall > 0 && (
                              <div>
                                <span className="text-gray-500">Hass:</span> {qc.hass_overall}%
                              </div>
                            )}
                          </div>
                          
                          {qc.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="text-gray-500">Note:</span> {qc.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Print Stickers Tab */}
            <TabsContent value="print" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sticker className="w-4 h-4" />
                    Print Stickers
                  </CardTitle>
                  <CardDescription>
                    Enter codes to print on stickers - 4 per A4 sheet (full bleed) - Large bold text (56pt code, 84pt class)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Input Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="code">Code / Number</Label>
                      <Input
                        id="code"
                        placeholder="Enter code (e.g., 0603202617)"
                        value={currentCode}
                        onChange={(e) => setCurrentCode(e.target.value)}
                        onKeyPress={handleKeyPress}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <Select value={currentClass} onValueChange={(value: any) => setCurrentClass(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="C1">C1</SelectItem>
                          <SelectItem value="C2">C2</SelectItem>
                          <SelectItem value="Reject">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={addLabel} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Sticker
                    </Button>
                    <Button variant="outline" onClick={clearAllLabels} className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </Button>
                    <Button 
                      onClick={handlePrint}
                      disabled={labels.length === 0}
                      className="flex items-center gap-2 ml-auto"
                      size="lg"
                    >
                      <Printer className="w-4 h-4" />
                      Print {labels.length} Sticker{labels.length !== 1 ? 's' : ''}
                    </Button>
                  </div>

                  {/* Stickers List */}
                  {labels.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Code</th>
                            <th className="px-4 py-2 text-left">Class</th>
                            <th className="px-4 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labels.map((label) => (
                            <tr key={label.id} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono">{label.code}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className={
                                  label.class === 'C1' ? 'bg-green-50 text-green-700 border-green-200' :
                                  label.class === 'C2' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }>
                                  {label.class}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLabel(label.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Statistics */}
                  {labels.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4" />
                        Sticker Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Total Stickers</div>
                          <div className="font-bold text-lg">{labels.length}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">C1</div>
                          <div className="font-bold text-lg text-green-600">{labels.filter(l => l.class === 'C1').length}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">C2</div>
                          <div className="font-bold text-lg text-blue-600">{labels.filter(l => l.class === 'C2').length}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Reject</div>
                          <div className="font-bold text-lg text-red-600">{labels.filter(l => l.class === 'Reject').length}</div>
                        </div>
                        <div className="col-span-2 md:col-span-4">
                          <div className="text-gray-600">Sheets (4 stickers per sheet)</div>
                          <div className="font-bold text-lg">{Math.ceil(labels.length / 4)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Printable Stickers Component - Hidden */}
          <div style={{ display: 'none' }}>
            <PrintableStickers labels={labels} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
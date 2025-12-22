

import type { ExplainAnomalyInput } from "@/ai/flows/explain-anomaly-detection";

export const overviewData = {
  accountsReceivable: {
    title: 'Accounts Receivable',
    value: 'KES 150M',
    change: '+5% from last month',
    changeType: 'increase' as const,
  },
  invoicesDue: {
    title: 'Invoices Due (30 days)',
    value: '214',
    change: '+12 from last week',
    changeType: 'increase' as const,
  },
  profitMargin: {
    title: 'Gross Profit Margin',
    value: '28.5%',
    change: '+1.2% from last quarter',
    changeType: 'increase' as const,
  },
  opex: {
    title: 'Operating Expenses (OPEX)',
    value: 'KES 12.8M',
    change: '-3% from last month',
    changeType: 'decrease' as const,
  },
  capex: {
    title: 'Capital Expenditures (CAPEX)',
    value: 'KES 3.2M',
    change: 'YTD',
    changeType: 'increase' as const,
  },
  podsPending: {
    title: 'PODs Pending',
    value: '78',
    change: '-5 from last week',
    changeType: 'decrease' as const,
  },
  newCustomers: {
    title: 'New Customers (QTD)',
    value: '12',
    change: '+3 since last quarter',
    changeType: 'increase' as const,
  },
  traceability: {
    title: "Traceability",
    value: "99.8%",
    change: "+0.2% from last month",
    changeType: "increase" as const,
  },
  coldChain: {
    title: "Cold Chain Compliance",
    value: "97.1%",
    change: "-0.5% from last month",
    changeType: "decrease" as const,
  },
  weight: {
    title: "Weight Accuracy",
    value: "99.92%",
    change: "+0.05% from last batch",
    changeType: "increase" as const,
  },
  vmsIot: {
    title: "Active Devices",
    value: "1,204",
    change: "+52 since last week",
    changeType: "increase" as const,
  },
  visitorsToday: {
    title: "Visitors Today",
    value: "42",
    change: "+5 from yesterday",
    changeType: "increase" as const,
  },
  vehiclesOnSite: {
    title: "Vehicles on Site",
    value: "15",
    change: "-2 from last hour",
    changeType: "decrease" as const,
  },
  avgVisitDuration: {
    title: "Avg. Visit Duration",
    value: "45 min",
    change: "+3 min from last week",
    changeType: "increase" as const,
  },
  esgScore: {
    title: "Overall ESG Score",
    value: "85/100",
    change: "+3 pts from last quarter",
    changeType: "increase" as const,
  },
  carbonFootprint: {
    title: "Carbon Footprint",
    value: "95 tCO2e",
    change: "-5% from last month",
    changeType: "decrease" as const,
  },
  waterRecycling: {
    title: "Water Recycling Rate",
    value: "15%",
    change: "+2% vs. last week",
    changeType: "increase" as const,
  },
  safetyIncidents: {
    title: "Safety Incident Rate",
    value: "0.4",
    change: "-0.7 from last month",
    changeType: "decrease" as const,
  },
};

export const coldChainData = [
  { time: "00:00", temperature: 2.5, humidity: 85 },
  { time: "02:00", temperature: 2.6, humidity: 84 },
  { time: "04:00", temperature: 2.4, humidity: 85 },
  { time: "06:00", temperature: 3.1, humidity: 82 },
  { time: "08:00", temperature: 2.8, humidity: 83 },
  { time: "10:00", temperature: 2.9, humidity: 84 },
  { time: "12:00", temperature: 2.7, humidity: 85 },
  { time: "14:00", temperature: 2.6, humidity: 86 },
  { time: "16:00", temperature: 2.8, humidity: 85 },
  { time: "18:00", temperature: 3.0, humidity: 83 },
  { time: "20:00", temperature: 2.9, humidity: 84 },
  { time: "22:00", temperature: 2.7, humidity: 85 },
];

export const costAnalysisData = [
  { name: 'Labor', value: 45000 },
  { name: 'Logistics', value: 32000 },
  { name: 'Packaging', value: 22000 },
  { name: 'Energy', value: 18000 },
  { name: 'Maintenance', value: 12000 },
  { name: 'Other', value: 8000 },
];

export const anomalyData: ExplainAnomalyInput[] = [
  {
    metricName: "Container Temperature",
    metricValue: 8.5,
    expectedValue: 4,
    timestamp: "2024-07-29T14:30:00Z",
    additionalContext: "Sensor ID: C-17B, Location: En route, outside temp: 32°C. Cooling unit appears to be malfunctioning.",
  },
  {
    metricName: "Unexpected Weight Drop",
    metricValue: 18500,
    expectedValue: 20000,
    timestamp: "2024-07-31T03:00:00Z",
    additionalContext: "Pallet Stack #PAL-001 in Cold Room 1. Sudden 1,500kg drop detected outside of scheduled movements. Potential theft or misplacement.",
  },
  {
    metricName: "Vehicle Humidity",
    metricValue: 98,
    expectedValue: 85,
    timestamp: "2024-07-29T11:15:00Z",
    additionalContext: "Sensor ID: H-04A, Location: Warehouse 3. Possible door seal leak detected.",
  },
];

export const coldRoomAnomalyData: ExplainAnomalyInput[] = [
  {
    metricName: "Cold Room 2 Temperature",
    metricValue: 6.2,
    expectedValue: 3,
    timestamp: "2024-07-31T18:00:00Z",
    additionalContext: "Sensor ID: CR2-T1. Door was left ajar for 15 minutes during shift change.",
  },
  {
    metricName: "Cold Room 1 Humidity",
    metricValue: 98,
    expectedValue: 90,
    timestamp: "2024-07-31T19:30:00Z",
    additionalContext: "Sensor ID: CR1-H1. Suspected condensation buildup near the sensor.",
  },
  {
    metricName: "Cold Room 3 Temp. Drift",
    metricValue: 4.8,
    expectedValue: 4.0,
    timestamp: "2024-07-31T20:00:00Z",
    additionalContext: "Sensor ID: CR3-T2. Temperature has been slowly climbing for the past hour. Predictive alert for potential compressor failure.",
  },
];


export const vmsIotData = [
  { id: "vms-1", name: "Truck #KDA 113", status: "online" as const },
  { id: "vms-2", name: "Container #C17B", status: "warning" as const },
  { id: "vms-3", name: "Warehouse Sensor #W3-T1", status: "online" as const },
  { id: "vms-4", name: "Truck #KDB 204", status: "offline" as const },
  { id: "vms-5", name: "Reefer Unit #R-45", status: "online" as const },
];

export const recentAlertsData = [
  {
    id: 'alert-1',
    type: 'Temperature' as const,
    message: 'Container #C17B exceeded max temp.',
    time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-2',
    type: 'Delay' as const,
    message: 'Truck #KDB 204 is 45 mins behind schedule.',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-3',
    type: 'Security' as const,
    message: 'Unauthorized access attempt on Warehouse 3.',
    time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

export type ProductItem = {
    product: string;
    quantity: number;
    weight: number;
};


export type WeightEntry = {
  id: string;
  palletId: string;
  product: string;
  products?: ProductItem[];
  weight: number;
  unit: 'kg' | 'lb';
  timestamp: string;
  supplier: string;
  truckId: string;
  driverId: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight: number;
  declaredWeight?: number;
  rejectedWeight?: number;
  photoEvidence?: File[] | null;
  client?: string;
  
  
  pallet_id?: string;
  gross_weight?: number;
  tare_weight?: number;
  net_weight?: number;
  declared_weight?: number;
  rejected_weight?: number;
  truck_id?: string;
  driver_id?: string;
};

export const weightData: WeightEntry[] = [
  { id: "w-1", palletId: "TICKET-319", product: "Roses", weight: 502.5, unit: "kg", timestamp: "2024-07-30T10:05:00Z", supplier: "Kakuzi PLC", truckId: "KCB785M", driverId: "emp-2", grossWeight: 6110, tareWeight: 3400, netWeight: 2710 },
  { id: "w-2", palletId: "PAL-002", product: "Hass Avocados", weight: 750.0, unit: "kg", timestamp: "2024-07-30T10:01:00Z", supplier: "Sunripe Ltd.", truckId: "KDB 204", driverId: "emp-5", grossWeight: 8750, tareWeight: 8000, netWeight: 750.0 },
  { id: "w-3", palletId: "PAL-003", product: "Organic Bananas", weight: 459.1, unit: "kg", timestamp: "2024-07-30T09:55:00Z", supplier: "Naivas Supermarket", truckId: "KDA 113", driverId: "emp-2", grossWeight: 4460, tareWeight: 4000.9, netWeight: 459.1 },
  { id: "w-4", palletId: "PAL-004", product: "Blueberries", weight: 450.0, unit: "kg", timestamp: "2024-07-30T09:52:00Z", supplier: "Zucchini GreenGrocers", truckId: "KDB 204", driverId: "emp-5", grossWeight: 3450, tareWeight: 3000, netWeight: 450.0 },
  { id: "w-5", palletId: "PAL-005", product: "Mangos", weight: 820.7, unit: "kg", timestamp: "2024-07-30T09:48:00Z", supplier: "Carrefour Kenya", truckId: "KDA 113", driverId: "emp-2", grossWeight: 7825, tareWeight: 7004.3, netWeight: 820.7, rejectedWeight: 4.3 },
];

export type DwellTimeEntry = {
  id: string;
  location: string;
  primaryProduct: string;
  avgDwellTime: string;
  items: number;
  status: 'optimal' | 'moderate' | 'high';
  nextAction?: string;
  entryDate?: string;
  weight?: number;
};

export const dwellTimeData: DwellTimeEntry[] = [
    { id: 'dt-1', location: 'PAL-001-A-1', primaryProduct: 'Roses', avgDwellTime: '4h 15m', items: 58, status: 'optimal', entryDate: '2024-07-31T10:00:00Z' },
    { id: 'dt-2', location: 'PAL-002-B-3', primaryProduct: 'Hass Avocados', avgDwellTime: '1h 30m', items: 112, status: 'optimal', entryDate: '2024-07-31T12:45:00Z' },
    { id: 'dt-3', location: 'PAL-003-C-8', primaryProduct: 'Mixed Greens', avgDwellTime: '45m', items: 25, status: 'moderate', entryDate: '2024-07-31T13:30:00Z' },
    { id: 'dt-4', location: 'Cold Room 2', primaryProduct: 'Vaccines - Batch 401', avgDwellTime: '18h 5m', items: 34, status: 'high', nextAction: 'Check Temperature Log', entryDate: '2024-07-30T20:10:00Z' },
    { id: 'dt-5', location: 'Customs Hold - Port', primaryProduct: 'Frozen Seafood', avgDwellTime: '72h 20m', items: 8, status: 'high', nextAction: 'Initiate Customs Escalation', entryDate: '2024-07-28T14:00:00Z' },
    { id: 'dt-6', location: 'QC Inspection', primaryProduct: 'Blueberries', avgDwellTime: '30m', items: 15, status: 'optimal', entryDate: '2024-07-31T13:45:00Z' },
];

export type CustomerFormValues = {
  name: string;
  website?: string;
  vatNumber?: string;
  primaryContactName: string;
  primaryContactRole: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  location: string;
  tags?: string[];
  status?: 'active' | 'new' | 'inactive';
};

type CustomerContact = {
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary?: boolean;
};

type CustomerActivity = {
  id: string;
  type: 'Order' | 'Shipment' | 'Invoice' | 'Payment' | 'Meeting' | 'Call' | 'Email' | 'Note';
  title: string;
  description: string;
  date: string;
  user: string;
};

type CustomerOrder = {
  orderId: string;
  shipmentId: string;
  date: string;
  value: number;
  status: 'Delivered' | 'In-Transit' | 'Processing';
};

export type CustomerDocument = {
  name: string;
  type: 'Contract' | 'NDA' | 'Pricing' | 'SLA' | 'PO' | 'Invoice' | 'GRN';
  uploadDate: string;
  url: string;
  status?: 'Active' | 'Expired' | 'Terminated';
  expiryDate?: string;
};

export type Customer = {
  id: string;
  name: string;
  location: string;
  tags: string[];
  logoUrl: string;
  website: string;
  ytdSales: number;
  lastOrder: string;
  status: 'active' | 'inactive' | 'new';
  outstandingBalance: number;
  openInvoices: number;
  contacts: CustomerContact[];
  activity: CustomerActivity[];
  orderHistory: CustomerOrder[];
  documents: CustomerDocument[];
};

export const customerData: Customer[] = [
  { 
    id: 'cust-1', name: 'Kakuzi PLC', location: 'Muranga', tags: ['Key Account', 'Export', 'Avocado'], ytdSales: 12540000, lastOrder: '2024-07-25', status: 'active', 
    logoUrl: 'https://i.pravatar.cc/150?u=cust-1', website: 'www.kakuzi.co.ke', outstandingBalance: 450000, openInvoices: 1,
    contacts: [
      { name: 'John K.', role: 'Procurement Manager', email: 'john.k@kakuzi.co.ke', phone: '0712345001', isPrimary: true },
      { name: 'Mary W.', role: 'Accounts Payable', email: 'mary.w@kakuzi.co.ke', phone: '0712345002' },
    ],
    activity: [
      { id: 'act-1-1', type: 'Order', title: 'Order #PO-5821 Received', description: 'Order for 10 pallets of avocados.', date: '2024-07-25T09:00:00Z', user: 'System' },
      { id: 'act-1-2', type: 'Shipment', title: 'Shipment SH-88120 Dispatched', description: 'Dispatched via SpeedyLogistics.', date: '2024-07-25T14:00:00Z', user: 'Jane Wanjiku' },
      { id: 'act-1-3', type: 'Invoice', title: 'Invoice INV-2024-1050 Sent', description: 'Invoice for KES 450,000 sent to accounts.', date: '2024-07-26T10:00:00Z', user: 'System' },
      { id: 'act-1-4', type: 'Note', title: 'Follow-up Call', description: 'Called John K. to confirm receipt of shipment schedule. All is on track.', date: '2024-07-26T11:30:00Z', user: 'Emily Adhiambo' },
    ],
    orderHistory: [
        { orderId: 'PO-5821', shipmentId: 'ship-1', date: '2024-07-25', value: 450000, status: 'In-Transit' },
        { orderId: 'PO-5799', shipmentId: 'ship-4', date: '2024-07-15', value: 320000, status: 'Delivered' },
        { orderId: 'PO-5798', shipmentId: 'ship-9', date: '2024-07-14', value: 890000, status: 'Processing' },
    ],
    documents: [
      { name: 'Supply Agreement 2024.pdf', type: 'Contract', uploadDate: '2024-01-10T00:00:00Z', url: '#', status: 'Active', expiryDate: '2024-08-30T00:00:00Z' },
      { name: 'Pricing Agreement Q3.pdf', type: 'Pricing', uploadDate: '2024-07-01T00:00:00Z', url: '#', },
      { name: 'Service Level Agreement.pdf', type: 'SLA', uploadDate: '2024-01-10T00:00:00Z', url: '#', status: 'Active', expiryDate: '2024-08-30T00:00:00Z' },
      { name: 'INV-2024-1050.pdf', type: 'Invoice', uploadDate: '2024-07-26T10:00:00Z', url: '/financials/invoices/ar-1' },
      { name: 'PO-5821.pdf', type: 'PO', uploadDate: '2024-07-25T09:00:00Z', url: '/financials/quotes/new' },
      { name: 'GRN-88120.pdf', type: 'GRN', uploadDate: '2024-07-28T11:00:00Z', url: '#' },
      { name: 'GRN-88116.pdf', type: 'GRN', uploadDate: '2024-07-18T10:30:00Z', url: '#' },
    ]
  },
  { 
    id: 'cust-2', name: 'Sunripe Ltd.', location: 'Nairobi', tags: ['Key Account', 'Export', 'Flowers'], ytdSales: 8920000, lastOrder: '2024-07-22', status: 'active',
    logoUrl: 'https://i.pravatar.cc/150?u=cust-2', website: 'www.sunripe.co.ke', outstandingBalance: 325000, openInvoices: 1,
    contacts: [
      { name: 'Peter M.', role: 'Logistics Head', email: 'peter.m@sunripe.co.ke', phone: '0722345003', isPrimary: true },
    ],
    activity: [
      { id: 'act-2-1', type: 'Shipment', title: 'Shipment SH-88115 Delivered', description: 'POD received and signed.', date: '2024-07-22T16:00:00Z', user: 'System' },
    ],
    orderHistory: [
      { orderId: 'PO-7743', shipmentId: 'ship-3', date: '2024-07-22', value: 325000, status: 'Delivered' },
      { orderId: 'PO-7740', shipmentId: 'ship-7', date: '2024-07-10', value: 280000, status: 'Delivered' },
    ],
    documents: [
      { name: 'Main Contract 2023.pdf', type: 'Contract', uploadDate: '2023-01-01T00:00:00Z', url: '#', status: 'Expired', expiryDate: '2023-12-31T00:00:00Z' },
      { name: 'GRN-88115.pdf', type: 'GRN', uploadDate: '2024-07-22T15:00:00Z', url: '#' },
      { name: 'GRN-88124.pdf', type: 'GRN', uploadDate: '2024-07-12T15:00:00Z', url: '#' },
    ]
  },
  { 
    id: 'cust-3', name: 'Zucchini GreenGrocers', location: 'Nairobi', tags: ['Supermarket', 'Local'], ytdSales: 2150000, lastOrder: '2024-07-30', status: 'new',
    logoUrl: 'https://i.pravatar.cc/150?u=cust-3', website: 'www.zucchini.co.ke', outstandingBalance: 115000, openInvoices: 1,
    contacts: [
        { name: 'Susan A.', role: 'Owner', email: 'susan.a@zucchini.co.ke', phone: '0733345005', isPrimary: true },
    ],
    activity: [
        { id: 'act-3-1', type: 'Email', title: 'Sent introductory email and brochure', description: 'Follow up next week.', date: '2024-07-30T15:00:00Z', user: 'Emily Adhiambo' },
    ],
    orderHistory: [
        { orderId: 'PO-ZUC-001', shipmentId: 'ship-5', date: '2024-07-30', value: 115000, status: 'Processing' },
    ],
    documents: [
      { name: 'GRN-88122.pdf', type: 'GRN', uploadDate: '2024-07-31T09:00:00Z', url: '#' },
      { name: 'PO-ZUC-001.pdf', type: 'PO', uploadDate: '2024-07-30T09:00:00Z', url: '#' },
    ]
  },
  { 
    id: 'cust-4', name: 'Naivas Supermarket', location: 'Nairobi', tags: ['Supermarket', 'Local', 'Key Account'], ytdSales: 25050000, lastOrder: '2024-07-28', status: 'active',
    logoUrl: 'https://i.pravatar.cc/150?u=cust-4', website: 'www.naivas.co.ke', outstandingBalance: 780000, openInvoices: 1,
    contacts: [
        { name: 'David R.', role: 'Category Manager', email: 'david.r@naivas.co.ke', phone: '0744345006', isPrimary: true },
    ],
    activity: [],
    orderHistory: [
       { orderId: 'PO-5830', shipmentId: 'ship-2', date: '2024-07-28', value: 780000, status: 'In-Transit' },
    ],
    documents: [
      { name: 'Vendor Agreement.pdf', type: 'Contract', uploadDate: '2022-06-01T00:00:00Z', url: '#', status: 'Active', expiryDate: '2025-05-31T00:00:00Z' },
      { name: 'PO-5830.pdf', type: 'PO', uploadDate: '2024-07-28T10:00:00Z', url: '#' },
      { name: 'GRN-88121.pdf', type: 'GRN', uploadDate: '2024-07-29T14:00:00Z', url: '#' },
    ]
  },
  { 
    id: 'cust-5', name: 'Chandarana Foodplus', location: 'Nairobi', tags: ['Supermarket', 'Local'], ytdSales: 1560000, lastOrder: '2024-05-12', status: 'inactive',
    logoUrl: 'https://i.pravatar.cc/150?u=cust-5', website: 'www.chandaranasupermarket.co.ke', outstandingBalance: 52000, openInvoices: 1,
    contacts: [
      { name: 'Priya S.', role: 'Purchasing', email: 'priya.s@chandarana.co.ke', phone: '0755345007', isPrimary: true },
    ],
    activity: [],
    orderHistory: [],
    documents: [
      { name: 'Vendor Application Form.pdf', type: 'NDA', uploadDate: '2024-04-10T00:00:00Z', url: '#' },
      { name: '2024 Service Agreement.pdf', type: 'SLA', uploadDate: '2024-04-15T00:00:00Z', url: '#', status: 'Terminated' },
    ]
  },
  { 
    id: 'cust-6', name: 'Carrefour Kenya', location: 'Nairobi', tags: ['Supermarket', 'Local'], ytdSales: 7630000, lastOrder: '2024-07-19', status: 'active',
    logoUrl: 'https://i.pravatar.cc/150?u=cust-6', website: 'www.carrefour.ke', outstandingBalance: 198000, openInvoices: 1,
    contacts: [
      { name: 'Fatuma H.', role: 'Supply Chain Manager', email: 'fatuma.h@carrefour.ke', phone: '0766345008', isPrimary: true },
    ],
    activity: [],
    orderHistory: [
       { orderId: 'PO-CAR-205', shipmentId: 'ship-6', date: '2024-07-19', value: 198000, status: 'Delivered' },
    ],
    documents: [
       { name: 'Master Supply Contract.pdf', type: 'Contract', uploadDate: '2023-02-01T00:00:00Z', url: '#', status: 'Active', expiryDate: '2025-01-31T00:00:00Z' },
       { name: 'Non-Disclosure Agreement.pdf', type: 'NDA', uploadDate: '2023-01-20T00:00:00Z', url: '#' },
       { name: 'GRN-88123.pdf', type: 'GRN', uploadDate: '2024-07-20T10:00:00Z', url: '#' },
    ]
  },
  { 
    id: 'cust-7', name: 'Quickmart', location: 'Nakuru', tags: ['Supermarket', 'Local'], ytdSales: 450000, lastOrder: '2024-06-01', status: 'inactive',
    logoUrl: 'https://i.pravatar.cc/150?u=cust-7', website: 'www.quickmart.co.ke', outstandingBalance: 0, openInvoices: 0,
    contacts: [
      { name: 'Brian O.', role: 'Manager', email: 'brian.o@quickmart.co.ke', phone: '0777345009', isPrimary: true },
    ],
    activity: [],
    orderHistory: [
       { orderId: 'PO-QMK-101', shipmentId: 'ship-11', date: '2024-06-01', value: 85000, status: 'Delivered' },
    ],
    documents: [
       { name: 'GRN-88128.pdf', type: 'GRN', uploadDate: '2024-06-02T11:00:00Z', url: '#' },
    ]
  },
];


export const invoiceStatusData = [
  { status: 'Paid', count: 852, fill: 'hsl(var(--chart-1))' },
  { status: 'Pending', count: 214, fill: 'hsl(var(--chart-4))' },
  { status: 'Overdue', count: 45, fill: 'hsl(var(--chart-5))' },
];

export type PodReconciliationEntry = {
  id: string;
  shipmentId: string;
  customer: string;
  deliveryDate: string;
  status: 'matched' | 'pending' | 'mismatch';
  invoiceId: string;
};

export const podReconciliationData: PodReconciliationEntry[] = [
    { id: 'pod-1', shipmentId: 'SH-88120', customer: 'Kakuzi PLC', deliveryDate: '2024-07-25', status: 'matched', invoiceId: 'INV-2024-1050' },
    { id: 'pod-2', shipmentId: 'SH-88121', customer: 'Naivas Supermarket', deliveryDate: '2024-07-28', status: 'pending', invoiceId: 'INV-2024-1051' },
    { id: 'pod-3', shipmentId: 'SH-88115', customer: 'Sunripe Ltd.', deliveryDate: '2024-07-22', status: 'mismatch', invoiceId: 'INV-2024-1048' },
    { id: 'pod-4', shipmentId: 'SH-88116', customer: 'Kakuzi PLC', deliveryDate: '2024-07-20', status: 'matched', invoiceId: 'INV-2024-1045' },
    { id: 'pod-5', shipmentId: 'SH-88122', customer: 'Zucchini GreenGrocers', deliveryDate: '2024-07-30', status: 'pending', invoiceId: 'INV-2024-1055' },
    { id: 'pod-6', shipmentId: 'SH-88118', customer: 'Carrefour Kenya', deliveryDate: '2024-07-19', status: 'matched', invoiceId: 'INV-2024-1042' },
];


export const shipmentVolumeData = [
  { month: 'Jan', shipped: 2400, delivered: 2350 },
  { month: 'Feb', shipped: 2210, delivered: 2180 },
  { month: 'Mar', shipped: 2290, delivered: 2250 },
  { month: 'Apr', shipped: 2000, delivered: 1980 },
  { month: 'May', shipped: 2181, delivered: 2150 },
  { month: 'Jun', shipped: 2500, delivered: 2450 },
  { month: 'Jul', shipped: 2100, delivered: 2080 },
];

export const carrierPerformanceData = [
  { carrier: 'SpeedyLogistics', onTime: 95, delayed: 5 },
  { carrier: 'QuickHaul', onTime: 92, delayed: 8 },
  { carrier: 'ReliableTrans', onTime: 98, delayed: 2 },
  { carrier: 'GlobalMovers', onTime: 88, delayed: 12 },
  { carrier: 'EcoFreight', onTime: 96, delayed: 4 },
];

export type EmployeeFormValues = {
  name: string;
  email: string;
  role: 'Manager' | 'Driver' | 'Warehouse' | 'Admin' | 'Security';
  performance: 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement';
  idNumber?: string;
  phone?: string;
  contract: 'Full-time' | 'Part-time' | 'Contract';
  salary: number;
  issueDate?: string;
  expiryDate?: string;
  company?: string;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: 'Manager' | 'Driver' | 'Warehouse' | 'Admin' | 'Security' | 'Supplier' | 'Carrier';
  status: 'active' | 'on-leave' | 'inactive';
  performance: 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement';
  rating: number;
  contract: 'Full-time' | 'Part-time' | 'Contract';
  salary: number;
  image: string;
  company?: string;
  idNumber?: string;
  phone?: string;
  issueDate?: string;
  expiryDate?: string;
  dwellTimeLimitMinutes?: number;
};

export const employeeData: Employee[] = [
  { id: 'emp-1', name: 'John Omondi', email: 'john.o@freshtrack.co.ke', role: 'Admin', status: 'active', performance: 'Exceeds Expectations', rating: 5, contract: 'Full-time', salary: 120000, image: 'https://i.pravatar.cc/150?u=emp-1', idNumber: '21345678', phone: '0711223344', issueDate: '2024-01-15T00:00:00Z', expiryDate: '2026-01-14T00:00:00Z', dwellTimeLimitMinutes: 30 },
  { id: 'emp-2', name: 'Jane Wanjiku', email: 'jane.w@freshtrack.co.ke', role: 'Driver', status: 'active', performance: 'Meets Expectations', rating: 4, contract: 'Full-time', salary: 65000, image: 'https://i.pravatar.cc/150?u=emp-2', idNumber: '22345678', phone: '0722334455', issueDate: '2023-08-20T00:00:00Z', expiryDate: '2024-08-19T00:00:00Z', dwellTimeLimitMinutes: 20 },
  { id: 'emp-3', name: 'Mike Kimani', email: 'mike.k@freshtrack.co.ke', role: 'Warehouse', status: 'on-leave', performance: 'Meets Expectations', rating: 3, contract: 'Full-time', salary: 55000, image: 'https://i.pravatar.cc/150?u=emp-3', idNumber: '23345678', phone: '0733445566', issueDate: '2024-03-10T00:00:00Z', expiryDate: '2025-03-09T00:00:00Z', dwellTimeLimitMinutes: 20 },
  { id: 'emp-4', name: 'Emily Adhiambo', email: 'emily.a@freshtrack.co.ke', role: 'Manager', status: 'active', performance: 'Exceeds Expectations', rating: 5, contract: 'Full-time', salary: 150000, image: 'https://i.pravatar.cc/150?u=emp-4', idNumber: '24345678', phone: '0744556677', issueDate: '2024-06-01T00:00:00Z', expiryDate: '2025-05-31T00:00:00Z', dwellTimeLimitMinutes: 30 },
  { id: 'emp-5', name: 'Chris Mwangi', email: 'chris.m@freshtrack.co.ke', role: 'Driver', status: 'inactive', performance: 'Needs Improvement', rating: 2, contract: 'Part-time', salary: 40000, image: 'https://i.pravatar.cc/150?u=emp-5', idNumber: '25345678', phone: '0755667788', issueDate: '2022-11-01T00:00:00Z', expiryDate: '2023-10-31T00:00:00Z', dwellTimeLimitMinutes: 20 },
  { id: 'emp-6', name: 'Peter Kamau', email: 'peter.k@freshtrack.co.ke', role: 'Security', status: 'active', performance: 'Meets Expectations', rating: 4, contract: 'Contract', salary: 45000, image: 'https://i.pravatar.cc/150?u=emp-6', idNumber: '26345678', phone: '0766778899', issueDate: '2024-07-15T00:00:00Z', expiryDate: '2025-07-14T00:00:00Z', dwellTimeLimitMinutes: 20 },
];

export const employeePerformanceData = [
    { name: 'John Omondi', onTimeDeliveries: 98, positiveFeedback: 95, safetyIncidents: 0 },
    { name: 'Jane Wanjiku', onTimeDeliveries: 92, positiveFeedback: 88, safetyIncidents: 2 },
    { name: 'Mike Kimani', onTimeDeliveries: 95, positiveFeedback: 91, safetyIncidents: 1 },
    { name: 'Emily Adhiambo', onTimeDeliveries: 99, positiveFeedback: 98, safetyIncidents: 0 },
    { name: 'Chris Mwangi', onTimeDeliveries: 85, positiveFeedback: 75, safetyIncidents: 4 },
];

export type TimeAttendance = {
  employeeId: string;
  status: 'Present' | 'Absent' | 'On Leave';
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
};

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const timeAttendanceData: TimeAttendance[] = [
  // Today's Data (mostly absent initially)
  { employeeId: 'emp-1', status: 'Absent', date: formatDate(today) },
  { employeeId: 'emp-2', status: 'Absent', date: formatDate(today) },
  { employeeId: 'emp-3', status: 'On Leave', date: formatDate(today) },
  { employeeId: 'emp-4', status: 'Absent', date: formatDate(today) },
  { employeeId: 'emp-5', status: 'Absent', date: formatDate(today) },
  { employeeId: 'emp-6', status: 'Absent', date: formatDate(today) },
  
  // Yesterday's Data
  { employeeId: 'emp-1', status: 'Present', date: formatDate(yesterday), clockInTime: new Date(new Date(yesterday).setHours(7, 1, 0)).toISOString(), clockOutTime: new Date(new Date(yesterday).setHours(19, 5, 0)).toISOString() },
  { employeeId: 'emp-2', status: 'Present', date: formatDate(yesterday), clockInTime: new Date(new Date(yesterday).setHours(7, 3, 0)).toISOString(), clockOutTime: new Date(new Date(yesterday).setHours(18, 55, 0)).toISOString() },
  { employeeId: 'emp-3', status: 'On Leave', date: formatDate(yesterday) },
  { employeeId: 'emp-4', status: 'Present', date: formatDate(yesterday), clockInTime: new Date(new Date(yesterday).setHours(7, 0, 0)).toISOString(), clockOutTime: new Date(new Date(yesterday).setHours(19, 2, 0)).toISOString() },
  { employeeId: 'emp-5', status: 'Absent', date: formatDate(yesterday) },
  { employeeId: 'emp-6', status: 'Present', date: formatDate(yesterday), clockInTime: new Date(new Date(yesterday).setHours(6, 58, 0)).toISOString(), clockOutTime: new Date(new Date(yesterday).setHours(19, 3, 0)).toISOString() },

  // Two Days Ago
  { employeeId: 'emp-1', status: 'Present', date: formatDate(twoDaysAgo), clockInTime: new Date(new Date(twoDaysAgo).setHours(7, 5, 0)).toISOString(), clockOutTime: new Date(new Date(twoDaysAgo).setHours(19, 0, 0)).toISOString() },
  { employeeId: 'emp-2', status: 'On Leave', date: formatDate(twoDaysAgo) },
  { employeeId: 'emp-3', status: 'Present', date: formatDate(twoDaysAgo), clockInTime: new Date(new Date(twoDaysAgo).setHours(6, 55, 0)).toISOString(), clockOutTime: new Date(new Date(twoDaysAgo).setHours(19, 1, 0)).toISOString() },
  { employeeId: 'emp-4', status: 'Present', date: formatDate(twoDaysAgo), clockInTime: new Date(new Date(twoDaysAgo).setHours(7, 2, 0)).toISOString(), clockOutTime: new Date(new Date(twoDaysAgo).setHours(19, 4, 0)).toISOString() },
  { employeeId: 'emp-5', status: 'Absent', date: formatDate(twoDaysAgo) },
  { employeeId: 'emp-6', status: 'Present', date: formatDate(twoDaysAgo), clockInTime: new Date(new Date(twoDaysAgo).setHours(7, 0, 0)).toISOString(), clockOutTime: new Date(new Date(twoDaysAgo).setHours(19, 0, 0)).toISOString() },
];


export type ShipmentEvent = {
  id: string;
  timestamp: string;
  location: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  icon: 'Package' | 'Warehouse' | 'Truck' | 'CheckCircle' | 'AlertCircle';
};

export type ShipmentDetails = {
  shipmentId: string;
  origin: string;
  destination: string;
  status: string;
  events: ShipmentEvent[];
};

export const traceabilityData: ShipmentDetails = {
  shipmentId: 'SH-88120',
  origin: 'Karen Roses, Nakuru',
  destination: 'FreshProduce KE, Nairobi',
  status: 'In Transit',
  events: [
    { id: 'ev-1', timestamp: '2024-07-23T08:00:00Z', location: 'Karen Roses, Nakuru', description: 'Order confirmed and packed', status: 'completed', icon: 'Package' },
    { id: 'ev-2', timestamp: '2024-07-23T11:30:00Z', location: 'Karen Roses, Nakuru', description: 'Picked up by carrier (SpeedyLogistics)', status: 'completed', icon: 'Truck' },
    { id: 'ev-3', timestamp: '2024-07-24T02:00:00Z', location: 'Processing Center, Naivasha', description: 'Arrived at processing center', status: 'completed', icon: 'Warehouse' },
    { id: 'ev-4', timestamp: '2024-07-24T09:15:00Z', location: 'Processing Center, Naivasha', description: 'Departed from processing center', status: 'completed', icon: 'Truck' },
    { id: 'ev-5', timestamp: '2024-07-25T14:00:00Z', location: 'JKIA, Nairobi', description: 'In transit - awaiting air freight', status: 'in-progress', icon: 'Warehouse' },
    { id: 'ev-6', timestamp: '2024-07-28T05:00:00Z', location: 'FreshProduce KE, Nairobi', description: 'Expected delivery', status: 'pending', icon: 'CheckCircle' },
  ],
};

export type AccountsReceivableEntry = {
  id: string;
  customer: string;
  invoiceId: string;
  amount: number;
  dueDate: string;
  agingStatus: 'On Time' | 'At Risk' | 'Late';
};

export const accountsReceivableData: AccountsReceivableEntry[] = [
  { id: 'ar-1', customer: 'Kakuzi PLC', invoiceId: 'INV-2024-1050', amount: 450000, dueDate: '2024-08-24', agingStatus: 'On Time' },
  { id: 'ar-2', customer: 'Naivas Supermarket', invoiceId: 'INV-2024-1051', amount: 780000, dueDate: '2024-08-27', agingStatus: 'On Time' },
  { id: 'ar-3', customer: 'Sunripe Ltd.', invoiceId: 'INV-2024-1048', amount: 325000, dueDate: '2024-08-21', agingStatus: 'At Risk' },
  { id: 'ar-4', customer: 'Chandarana Foodplus', invoiceId: 'INV-2024-0998', amount: 52000, dueDate: '2024-07-15', agingStatus: 'Late' },
  { id: 'ar-5', customer: 'Carrefour Kenya', invoiceId: 'INV-2024-1042', amount: 198000, dueDate: '2024-08-18', agingStatus: 'At Risk' },
  { id: 'ar-6', customer: 'Zucchini GreenGrocers', invoiceId: 'INV-2024-1055', amount: 115000, dueDate: '2024-08-29', agingStatus: 'On Time' },
];

export type Quote = {
  id: string;
  quoteId: string;
  customer: string;
  date: string;
  validUntil: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Expired';
};

export const quoteData: Quote[] = [
  { id: 'quote-1', quoteId: 'Q-2024-7950', customer: 'Kakuzi PLC', date: '2024-07-30', validUntil: '2024-08-30', amount: 640900, status: 'Sent' },
  { id: 'quote-2', quoteId: 'Q-2024-7951', customer: 'Sunripe Ltd.', date: '2024-07-28', validUntil: '2024-08-28', amount: 1250000, status: 'Draft' },
  { id: 'quote-3', quoteId: 'Q-2024-7949', customer: 'Zucchini GreenGrocers', date: '2024-07-25', validUntil: '2024-08-25', amount: 88000, status: 'Accepted' },
  { id: 'quote-4', quoteId: 'Q-2024-7940', customer: 'Naivas Supermarket', date: '2024-06-15', validUntil: '2024-07-15', amount: 1500000, status: 'Expired' },
];

export type TagFormValues = {
  product: string;
  quantity: number;
  weight?: number;
  unit?: 'kg';
  client?: string;
  shipmentId?: string;
  officerId: string;
};

export type TagBatch = {
  id: string;
  batchId: string;
  product: string;
  quantity: number;
  weight?: number;
  unit?: 'kg';
  generatedAt: string;
  status: 'active' | 'printed' | 'archived';
  shipmentId?: string;
  client?: string;
  officerId: string;
};

export const tagBatchData: TagBatch[] = [
    { id: 'tag-1', batchId: 'B-202408-001', product: 'Roses', quantity: 500, weight: 250, unit: 'kg', generatedAt: '2024-07-30T10:00:00Z', status: 'printed', shipmentId: 'SH-88120', client: 'Kakuzi PLC', officerId: 'emp-4' },
    { id: 'tag-2', batchId: 'B-202408-002', product: 'Hass Avocados', quantity: 1200, generatedAt: '2024-07-30T11:30:00Z', status: 'active', shipmentId: 'SH-88115', client: 'Sunripe Ltd.', officerId: 'emp-3' },
    { id: 'tag-3', batchId: 'B-202408-003', product: 'Blueberries', quantity: 800, weight: 400, unit: 'kg', generatedAt: '2024-07-31T09:00:00Z', status: 'active', shipmentId: 'SH-88122', client: 'Zucchini GreenGrocers', officerId: 'emp-3' },
    { id: 'tag-4', batchId: 'B-202407-050', product: 'Mangos', quantity: 1500, weight: 1000, unit: 'kg', generatedAt: '2024-07-28T14:00:00Z', status: 'archived', shipmentId: 'SH-88116', client: 'Kakuzi PLC', officerId: 'emp-4' },
    { id: 'tag-5', batchId: 'B-202407-051', product: 'Organic Bananas', quantity: 2000, generatedAt: '2024-07-29T16:00:00Z', status: 'printed', officerId: 'emp-3' },
    { id: 'tag-6', batchId: 'B-202408-004', product: 'Handheld Scanner', quantity: 10, generatedAt: '2024-08-01T10:00:00Z', status: 'active', officerId: 'emp-1' },
    { id: 'tag-7', batchId: 'B-202408-005', product: 'Desktop Printer', quantity: 5, generatedAt: '2024-08-01T10:05:00Z', status: 'active', officerId: 'emp-1' },
];

export const productList = [
  'Roses',
  'Hass Avocados',
  'Blueberries',
  'Mangos',
  'Organic Bananas',
  'Tomatoes',
  'Romaine Lettuce',
  'French Beans',
  'Carnations',
];

export type Visitor = {
  id: string;
  name: string;
  company: string;
  hostId: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  visitorCode: string;
  vehiclePlate?: string;
  vehicleType?: string;
  cargoDescription?: string;
  reasonForVisit?: string;
  status: 'Pre-registered' | 'Checked-in' | 'Checked-out' | 'Pending Exit';
  expectedCheckInTime?: string;
  checkInTime?: string;
  checkOutTime?: string;
};

export const visitorData: Visitor[] = [
    { id: 'vis-1', name: 'Mark Johnson', company: 'SpeedyLogistics', hostId: 'emp-3', idNumber: '12345678', email: 'mark.j@speedylogistics.com', phone: '0712345678', visitorCode: 'VIST-8462', vehiclePlate: 'KDE 555F', vehicleType: 'Semi-Truck', cargoDescription: '2 pallets of roses', status: 'Checked-in', expectedCheckInTime: '2024-08-01T09:00:00Z', checkInTime: '2024-08-01T09:05:00Z' },
    { id: 'vis-2', name: 'Sarah Wambui', company: 'KEBS Inspector', hostId: 'emp-4', idNumber: '87654321', email: 'sarah.w@kebs.go.ke', phone: '0723456789', visitorCode: 'VIST-9123', status: 'Checked-in', reasonForVisit: 'Scheduled quality audit', expectedCheckInTime: '2024-08-01T09:15:00Z', checkInTime: '2024-08-01T09:15:00Z' },
    { id: 'vis-3', name: 'Tom Wilson', company: 'QuickHaul', hostId: 'emp-3', idNumber: '11223344', email: 'tom.w@quickhaul.co.ke', phone: '0734567890', visitorCode: 'VIST-7354', vehiclePlate: 'KDF 123G', vehicleType: 'Reefer Truck', cargoDescription: '1 pallet of avocados', status: 'Pre-registered', expectedCheckInTime: '2024-08-01T11:00:00Z' },
    { id: 'vis-4', name: 'Maria Mutua', company: 'Kakuzi PLC', hostId: 'emp-4', idNumber: '44332211', email: 'maria.m@kakuzi.co.ke', phone: '0745678901', visitorCode: 'VIST-1098', status: 'Checked-out', reasonForVisit: 'Management meeting', checkInTime: '2024-07-31T14:00:00Z', checkOutTime: '2024-07-31T15:30:00Z' },
    { id: 'vis-5', name: 'David Chen', company: 'EcoFreight', hostId: 'emp-1', idNumber: '99887766', email: 'david.c@ecofreight.com', phone: '0756789012', visitorCode: 'VIST-5543', vehiclePlate: 'KDG 789H', vehicleType: 'Van', cargoDescription: 'Miscellaneous supplies', status: 'Pre-registered', expectedCheckInTime: '2024-08-01T14:30:00Z' },
    { id: 'vis-6', name: 'Laura Achieng', company: 'Maintenance Co.', hostId: 'emp-1', idNumber: '66778899', email: 'laura.a@maintenance.co', phone: '0767890123', visitorCode: 'VIST-2389', vehiclePlate: 'KCE 789J', vehicleType: 'Pickup Truck', reasonForVisit: 'AC unit repair', status: 'Checked-out', checkInTime: '2024-07-31T10:00:00Z', checkOutTime: '2024-07-31T12:45:00Z' },
];

export type ShipmentStatus = 'Awaiting QC' | 'Processing' | 'Receiving' | 'Preparing for Dispatch' | 'Ready for Dispatch' | 'In-Transit' | 'Delivered' | 'Delayed';

export type Shipment = {
  id: string;
  shipmentId: string;
  customer: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  product: string;
  tags: string;
  weight: string;
  carrier?: string;
  expectedArrival?: string;
};

export type ShipmentFormData = {
  customer: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  product: string;
  qualityChecks: Record<string, { status: 'accepted' | 'rejected'; rejectedWeight?: number; notes?: string; }>;
  photoEvidence?: any;
  declaredWeight: number;
  netWeight: number;
  arrivalTemperature: number;
  driverId: string;
  truckId: string;
  finalAcceptedWeight?: number;
  finalRejectedWeight?: number;
};

export type OutboundShipmentFormData = {
  shipmentId: string;
  carrier: string;
  departureTemperature: number;
  driverId: string;
  truckId?: string;  // ADD THIS LINE - make it optional
  finalChecks: Record<string, 'pass' | 'fail'>;
  palletCount: number;
  boxCount: number;
  dispatchWeight: number;
};

export const shipmentData: Shipment[] = [
    { id: 'ship-1', shipmentId: 'SH-88120', customer: 'Kakuzi PLC', origin: 'Karen Roses, Nakuru', destination: 'Nairobi', status: 'In-Transit', product: 'Roses', tags: 'B-202408-001', weight: '250 kg', carrier: 'SpeedyLogistics', expectedArrival: '2024-08-01T09:00:00Z' },
    { id: 'ship-2', shipmentId: 'SH-88121', customer: 'Naivas Supermarket', origin: 'Naivasha', destination: 'Mombasa', status: 'Awaiting QC', product: 'Organic Bananas', tags: 'Not tagged', weight: 'Not weighed', carrier: 'QuickHaul', expectedArrival: '2024-08-02T14:00:00Z' },
    { id: 'ship-3', shipmentId: 'SH-88115', customer: 'Sunripe Ltd.', origin: 'Thika', destination: 'Kisumu', status: 'Delivered', product: 'Hass Avocados', tags: 'B-202408-002', weight: '1200 kg', carrier: 'ReliableTrans' },
    { id: 'ship-4', shipmentId: 'SH-88116', customer: 'Kakuzi PLC', origin: 'Eldoret', destination: 'Nairobi', status: 'Delayed', product: 'Mangos', tags: 'B-202407-050', weight: '1000 kg', carrier: 'GlobalMovers', expectedArrival: '2024-07-30T12:00:00Z' },
    { id: 'ship-5', shipmentId: 'SH-88122', customer: 'Zucchini GreenGrocers', origin: 'Limuru', destination: 'Nairobi', status: 'Processing', product: 'Blueberries', tags: 'B-202408-003', weight: '400 kg', carrier: 'SpeedyLogistics', expectedArrival: '2024-08-01T15:30:00Z' },
    { id: 'ship-6', shipmentId: 'SH-88123', customer: 'Carrefour Kenya', origin: 'Athi River', destination: 'Nakuru', status: 'Awaiting QC', product: 'Tomatoes', tags: 'Not tagged', weight: 'Not weighed', carrier: 'EcoFreight', expectedArrival: '2024-08-03T10:00:00Z' },
    { id: 'ship-7', shipmentId: 'SH-88124', customer: 'Sunripe Ltd.', origin: 'Kitale', destination: 'Eldoret', status: 'Delivered', product: 'Hass Avocados', tags: 'B-202407-049', weight: '800 kg', carrier: 'ReliableTrans' },
    { id: 'ship-8', shipmentId: 'SH-88125', customer: 'Naivas Supermarket', origin: 'Nanyuki', destination: 'Nairobi', status: 'In-Transit', product: 'French Beans', tags: 'B-202408-005', weight: '650 kg', carrier: 'QuickHaul', expectedArrival: '2024-08-01T18:00:00Z' },
    { id: 'ship-9', shipmentId: 'SH-88126', customer: 'Kakuzi PLC', origin: 'Karen Roses, Nakuru', destination: 'London, UK', status: 'Processing', product: 'Carnations', tags: 'B-202408-006', weight: '3000 kg', carrier: 'GlobalMovers', expectedArrival: '2024-08-04T22:00:00Z' },
    { id: 'ship-10', shipmentId: 'SH-88127', customer: 'Zucchini GreenGrocers', origin: 'Thika', destination: 'Mombasa', status: 'Delayed', product: 'Blueberries', tags: 'B-202407-052', weight: '1500 kg', carrier: 'SpeedyLogistics', expectedArrival: '2024-07-29T16:00:00Z' },
    { id: 'ship-11', shipmentId: 'SH-88128', customer: 'Quickmart', origin: 'Isinya', destination: 'Nairobi', status: 'Delivered', product: 'Romaine Lettuce', tags: 'Not tagged', weight: '200 kg', carrier: 'ReliableTrans' },
    { id: 'ship-12', shipmentId: 'SH-88129', customer: 'Carrefour Kenya', origin: 'Karen Roses, Nakuru', destination: 'Mombasa', status: 'Delivered', product: 'Roses', tags: 'B-202408-007', weight: '500 kg', carrier: 'EcoFreight' },
    { id: 'ship-13', shipmentId: 'SH-88130', customer: 'Naivas Supermarket', origin: 'Limuru', destination: 'Kisumu', status: 'Ready for Dispatch', product: 'Organic Bananas', tags: 'B-202408-008', weight: '750 kg', carrier: 'QuickHaul', expectedArrival: '2024-08-02T19:00:00Z' },
    { id: 'ship-14', shipmentId: 'SH-88131', customer: 'Kakuzi PLC', origin: 'Eldoret', destination: 'Kampala, UG', status: 'Preparing for Dispatch', product: 'Mangos', tags: 'B-202408-009', weight: '2000 kg', carrier: 'GlobalMovers', expectedArrival: '2024-08-03T08:00:00Z' },
    { id: 'ship-15', shipmentId: 'SH-88132', customer: 'Zucchini GreenGrocers', origin: 'Thika', destination: 'Nairobi', status: 'Delivered', product: 'Blueberries', tags: 'B-202408-010', weight: '300 kg', carrier: 'SpeedyLogistics' },
];

export type ColdRoomStatus = {
    id: string;
    name: string;
    temperature: number;
    humidity: number;
    status: 'Optimal' | 'Warning' | 'Alert';
    zoneType?: 'Fruit' | 'Vegetable' | 'Flower';
};

export const coldRoomStatusData: ColdRoomStatus[] = [
    { id: 'cr-1', name: 'Cold Room 1', temperature: 3.2, humidity: 90, status: 'Optimal', zoneType: 'Fruit' },
    { id: 'cr-2', name: 'Cold Room 2', temperature: 6.2, humidity: 85, status: 'Alert', zoneType: 'Flower' },
    { id: 'cr-3', name: 'Cold Room 3', temperature: 4.5, humidity: 88, status: 'Warning', zoneType: 'Vegetable' },
    { id: 'cr-4', name: 'Cold Room 4', temperature: 3.5, humidity: 92, status: 'Optimal' },
];

export type Role = {
    id: string;
    name: string;
    description: string;
    permissions: string[];
};

export const userRolesData: Role[] = [
    {
        id: 'role-1',
        name: 'Admin',
        description: 'Has all permissions and can manage users and roles.',
        permissions: ['manage_users', 'view_financials', 'edit_invoices', 'manage_shipments', 'generate_tags', 'view_analytics', 'manage_settings'],
    },
    {
        id: 'role-2',
        name: 'Manager',
        description: 'Can view dashboards and manage shipments.',
        permissions: ['view_financials', 'manage_shipments', 'view_analytics'],
    },
    {
        id: 'role-3',
        name: 'Driver',
        description: 'Can view assigned shipments and update status.',
        permissions: ['view_assigned_shipments', 'update_shipment_status'],
    },
    {
        id: 'role-4',
        name: 'Warehouse Staff',
        description: 'Can manage inventory, weigh, and tag items.',
        permissions: ['weigh_items', 'generate_tags', 'manage_inventory'],
    },
    {
        id: 'role-5',
        name: 'Security',
        description: 'Can register and check-in/out visitors and vehicles.',
        permissions: ['manage_visitors', 'scan_qr_codes'],
    },
];
    
export type ActivityLog = {
    id: string;
    user: string;
    avatar: string;
    action: string;
    ip: string;
    timestamp: string;
    status: 'success' | 'failure' | 'pending';
}

export const activityLogData: ActivityLog[] = [
    { id: 'log-1', user: 'John Omondi', avatar: 'https://i.pravatar.cc/150?u=emp-1', action: 'User login', ip: '192.168.1.1', timestamp: '2024-08-01T10:00:00Z', status: 'success' },
    { id: 'log-2', user: 'Emily Adhiambo', avatar: 'https://i.pravatar.cc/150?u=emp-4', action: 'Generated financial report', ip: '10.0.0.5', timestamp: '2024-08-01T09:45:00Z', status: 'success' },
    { id: 'log-3', user: 'System', avatar: '', action: 'Failed login attempt for user: chris.m', ip: '203.0.113.24', timestamp: '2024-08-01T09:30:00Z', status: 'failure' },
    { id: 'log-4', user: 'Jane Wanjiku', avatar: 'https://i.pravatar.cc/150?u=emp-2', action: 'Updated shipment SH-88120 to In-Transit', ip: '192.168.1.10', timestamp: '2024-08-01T08:55:00Z', status: 'success' },
    { id: 'log-5', user: 'Mike Kimani', avatar: 'https://i.pravatar.cc/150?u=emp-3', action: 'Recorded weight for PAL-005', ip: '192.168.2.15', timestamp: '2024-08-01T08:40:00Z', status: 'success' },
    { id: 'log-6', user: 'Mike Kimani', avatar: 'https://i.pravatar.cc/150?u=emp-3', action: 'Package PAL-005 scanned into Cold Room 1', ip: '192.168.2.15', timestamp: '2024-08-01T11:40:00Z', status: 'success' },
    { id: 'log-7', user: 'System', avatar: '', action: 'Temperature alert for Cold Room 2 cleared', ip: '127.0.0.1', timestamp: '2024-08-01T11:30:00Z', status: 'success' },
    { id: 'log-8', user: 'Mike Kimani', avatar: 'https://i.pravatar.cc/150?u=emp-3', action: 'Package PAL-002 scanned out of Cold Room 1', ip: '192.168.2.15', timestamp: '2024-08-01T11:20:00Z', status: 'success' },
    { id: 'log-9', user: 'System', avatar: '', action: 'Temperature alert triggered for Cold Room 2 (6.2°C)', ip: '127.0.0.1', timestamp: '2024-08-01T11:00:00Z', status: 'failure' },
    { id: 'log-10', user: 'John Omondi', avatar: 'https://i.pravatar.cc/150?u=emp-1', action: 'Updated user role for Chris Mwangi', ip: '192.168.1.1', timestamp: '2024-07-31T16:20:00Z', status: 'success' },
    { id: 'log-11', user: 'System', avatar: '', action: 'Daily backup completed successfully', ip: '127.0.0.1', timestamp: '2024-07-31T03:00:00Z', status: 'success' },
    { id: 'log-12', user: 'Peter Kamau', avatar: 'https://i.pravatar.cc/150?u=emp-6', action: 'Visitor Mark Johnson checked in', ip: '192.168.3.2', timestamp: '2024-08-01T09:05:00Z', status: 'success' },
    { id: 'log-13', user: 'Peter Kamau', avatar: 'https://i.pravatar.cc/150?u=emp-6', action: 'Rejected entry for unknown vehicle KZX 420P', ip: '192.168.3.2', timestamp: '2024-08-01T12:05:00Z', status: 'failure' },
    { id: 'log-14', user: 'Emily Adhiambo', avatar: 'https://i.pravatar.cc/150?u=emp-4', action: 'Approved salary advance for Jane Wanjiku', ip: '10.0.0.5', timestamp: '2024-08-01T12:15:00Z', status: 'success' },
    { id: 'log-15', user: 'System', avatar: '', action: 'Shipment SH-88121 is now awaiting QC', ip: '127.0.0.1', timestamp: '2024-08-01T14:00:00Z', status: 'pending' },
    { id: 'log-16', user: 'Emily Adhiambo', avatar: 'https://i.pravatar.cc/150?u=emp-4', action: 'Generated payroll report for July 2024', ip: '10.0.0.5', timestamp: '2024-08-01T15:00:00Z', status: 'success' },
    { id: 'log-17', user: 'John Omondi', avatar: 'https://i.pravatar.cc/150?u=emp-1', action: 'Updated pricing for Kakuzi PLC', ip: '192.168.1.1', timestamp: '2024-08-01T15:30:00Z', status: 'success' },
    { id: 'log-18', user: 'System', avatar: '', action: 'New visitor registration: Tom Wilson', ip: '192.168.3.1', timestamp: '2024-08-01T16:00:00Z', status: 'pending' },
    { id: 'log-19', user: 'System', avatar: '', action: 'Package PAL-001 scanned into Cold Room 1 (ENTRY)', ip: '192.168.2.1', timestamp: '2024-08-01T16:05:00Z', status: 'success' },
    { id: 'log-20', user: 'System', avatar: '', action: 'Package PAL-002 scanned out of Cold Room 1 (EXIT)', ip: '192.168.2.1', timestamp: '2024-08-01T16:10:00Z', status: 'success' },
];

export type ColdRoomInventory = {
    id: string;
    product: string;
    category: 'Fruit' | 'Vegetable' | 'Flower' | 'Other';
    quantity: number;
    unit: 'pallets' | 'tonnes' | 'boxes' | 'crates';
    location: string;
    entryDate: string;
    currentWeight: number;
    reorderThreshold: number;
};

export const coldRoomInventoryData: ColdRoomInventory[] = [
    { id: 'inv-1', product: 'Hass Avocados', category: 'Fruit', quantity: 20, unit: 'pallets', location: 'Cold Room 1', entryDate: '2024-07-28T10:00:00Z', currentWeight: 19500, reorderThreshold: 5000 },
    { id: 'inv-2', product: 'Roses (Red)', category: 'Flower', quantity: 50, unit: 'boxes', location: 'Cold Room 2', entryDate: '2024-07-30T14:00:00Z', currentWeight: 1000, reorderThreshold: 500 },
    { id: 'inv-3', product: 'Blueberries', category: 'Fruit', quantity: 5, unit: 'tonnes', location: 'Cold Room 1', entryDate: '2024-07-29T08:00:00Z', currentWeight: 4800, reorderThreshold: 1000 },
    { id: 'inv-4', product: 'French Beans', category: 'Vegetable', quantity: 15, unit: 'pallets', location: 'Cold Room 3', entryDate: '2024-07-31T11:00:00Z', currentWeight: 14000, reorderThreshold: 3000 },
    { id: 'inv-5', product: 'Carnations (White)', category: 'Flower', quantity: 100, unit: 'boxes', location: 'Cold Room 2', entryDate: '2024-07-31T16:00:00Z', currentWeight: 150, reorderThreshold: 200 },
    { id: 'inv-6', product: 'Tomatoes', category: 'Vegetable', quantity: 200, unit: 'crates', location: 'Cold Room 3', entryDate: '2024-08-01T09:00:00Z', currentWeight: 3000, reorderThreshold: 1000 },
];

export type PackagingMaterial = {
    id: string;
    name: string;
    category: 'Boxes & Crates' | 'Labels & Printing' | 'Pallets & Wraps' | 'Miscellaneous';
    currentStock: number;
    unit: 'boxes' | 'rolls' | 'units';
    reorderLevel: number;
    dimensions?: string;
    lastUsedDate: string;
    consumptionRate: 'high' | 'medium' | 'low';
};

export const packagingMaterialData: PackagingMaterial[] = [
    { id: 'pkg-1', name: 'Flower Box (Small)', category: 'Boxes & Crates', currentStock: 480, unit: 'boxes', reorderLevel: 250, dimensions: '60x20x15 cm', lastUsedDate: '2024-07-30T10:00:00Z', consumptionRate: 'high' },
    { id: 'pkg-2', name: 'Avocado Box (4kg)', category: 'Boxes & Crates', currentStock: 1800, unit: 'boxes', reorderLevel: 1000, dimensions: '40x30x10 cm', lastUsedDate: '2024-07-29T08:00:00Z', consumptionRate: 'high' },
    { id: 'pkg-3', name: 'QR Code Labels', category: 'Labels & Printing', currentStock: 4, unit: 'rolls', reorderLevel: 10, dimensions: '1000 labels/roll', lastUsedDate: '2024-07-31T16:00:00Z', consumptionRate: 'medium' },
    { id: 'pkg-4', name: 'Shipping Pallet', category: 'Pallets & Wraps', currentStock: 250, unit: 'units', reorderLevel: 150, dimensions: '120x100 cm', lastUsedDate: '2024-07-28T10:00:00Z', consumptionRate: 'medium' },
    { id: 'pkg-5', name: 'Packing Tape', category: 'Miscellaneous', currentStock: 30, unit: 'rolls', reorderLevel: 20, dimensions: '50m/roll', lastUsedDate: '2024-05-15T10:00:00Z', consumptionRate: 'low' },
    { id: 'pkg-6', name: 'Berry Punnet (125g)', category: 'Boxes & Crates', currentStock: 12500, unit: 'units', reorderLevel: 5000, lastUsedDate: '2024-07-29T08:00:00Z', consumptionRate: 'high' },
    { id: 'pkg-7', name: 'Thermal Transfer Ribbon', category: 'Labels & Printing', currentStock: 2, unit: 'rolls', reorderLevel: 5, dimensions: '110mm x 300m', lastUsedDate: '2024-03-10T10:00:00Z', consumptionRate: 'low' },
];

export type SupplierFormValues = {
  name: string;
  location: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  produceTypes: string[];
  status?: 'Active' | 'Inactive' | 'Onboarding';
  kraPin?: string;
  supplierCode?: string;
  vehicleNumberPlate?: string;
  driverName?: string;
  driverIdNumber?: string;
  mpesaPaybill?: string;
  mpesaAccountNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  password?: string;
};

export type Supplier = {
  id: string;
  name: string;
  location: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  produceTypes: string[];
  status: 'Active' | 'Inactive' | 'Onboarding';
  logoUrl: string;
  activeContracts: number;
  kraPin?: string;
  supplierCode: string;
  vehicleNumberPlate?: string;
  driverName?: string;
  driverIdNumber?: string;
  mpesaPaybill?: string;
  mpesaAccountNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  password?: string;
  documents: CustomerDocument[];
};

export const supplierData: Supplier[] = [
  { id: 'supp-1', name: 'Green Valley Farms', supplierCode: 'GVF001', location: 'Naivasha', contactName: 'Alice Wanjiru', contactEmail: 'alice@gvf.co.ke', contactPhone: '0711223344', produceTypes: ['Roses', 'Carnations'], status: 'Active', logoUrl: 'https://avatar.vercel.sh/greenvalley.png', activeContracts: 2, kraPin: 'A001234567B', mpesaPaybill: '123456', bankName: 'Equity Bank', bankAccountNumber: '0123456789123', password: 'password123', documents: [
      { name: 'GRN-GVF-0730.pdf', type: 'GRN', uploadDate: '2024-07-30T10:00:00Z', url: '#' },
      { name: 'GRN-GVF-0728.pdf', type: 'GRN', uploadDate: '2024-07-28T11:00:00Z', url: '#' },
  ] },
  { id: 'supp-2', name: 'Rift Valley Orchards', supplierCode: 'RVO002', location: 'Nakuru', contactName: 'Samuel Kamau', contactEmail: 'samuel@rvo.co.ke', contactPhone: '0722334455', produceTypes: ['Hass Avocados', 'Mangos'], status: 'Active', logoUrl: 'https://avatar.vercel.sh/riftvalley.png', activeContracts: 1, kraPin: 'A002345678C', bankName: 'KCB Bank', bankAccountNumber: '9876543210987', password: 'password123', documents: [] },
  { id: 'supp-3', name: 'Highland Growers', supplierCode: 'HGL003', location: 'Limuru', contactName: 'Beatrice Cherono', contactEmail: 'beatrice@highland.co.ke', contactPhone: '0733445566', produceTypes: ['Blueberries', 'French Beans', 'Romaine Lettuce'], status: 'Onboarding', logoUrl: 'https://avatar.vercel.sh/highland.png', activeContracts: 0, mpesaPaybill: '555111', mpesaAccountNumber: 'Highland', password: 'password123', documents: [] },
];

export type SupplierAccountsPayableEntry = {
    id: string;
    supplierId: string;
    invoiceId: string;
    grnId: string;
    amount: number;
    dueDate: string;
    status: 'Paid' | 'Due' | 'Overdue';
};

export const supplierAccountsPayableData: SupplierAccountsPayableEntry[] = [
    { id: 'sap-1', supplierId: 'supp-1', invoiceId: 'INV-GVF-2024-07-15', grnId: 'GRN-GVF-0730.pdf', amount: 320000, dueDate: '2024-08-15', status: 'Due' },
    { id: 'sap-2', supplierId: 'supp-1', invoiceId: 'INV-GVF-2024-07-13', grnId: 'GRN-GVF-0728.pdf', amount: 280000, dueDate: '2024-08-13', status: 'Due' },
    { id: 'sap-3', supplierId: 'supp-2', invoiceId: 'INV-RVO-2024-07-05', grnId: 'GRN-RVO-0720.pdf', amount: 780000, dueDate: '2024-08-05', status: 'Overdue' },
    { id: 'sap-4', supplierId: 'supp-1', invoiceId: 'INV-GVF-2024-06-25', grnId: 'GRN-GVF-0628.pdf', amount: 250000, dueDate: '2024-07-25', status: 'Paid' },
];


export type Produce = {
  id: string;
  name: string;
  variety: string;
  storageTemp: number;
  category: 'Fruit' | 'Vegetable' | 'Flower' | 'Other';
  weightInProcessing: number;
  weightIncoming: number;
  shipmentCount: number;
};

const produceWeightConversions = {
  pallets: 1000,
  tonnes: 1000,
  boxes: 20,
  crates: 15, // Assuming an average crate weight
};

function calculateProduceWeights(): Produce[] {
  const initialProduceData: Omit<Produce, 'weightInProcessing' | 'weightIncoming' | 'shipmentCount'>[] = [
    { id: 'prod-1', name: 'Rose', variety: 'Red Naomi', category: 'Flower', storageTemp: 2 },
    { id: 'prod-2', name: 'Avocado', variety: 'Hass', category: 'Fruit', storageTemp: 5 },
    { id: 'prod-3', name: 'Blueberry', variety: 'Duke', category: 'Fruit', storageTemp: 1 },
    { id: 'prod-4', name: 'French Beans', variety: 'Vegetable', storageTemp: 4 },
    { id: 'prod-5', name: 'Carnation', variety: 'White', category: 'Flower', storageTemp: 2 },
    { id: 'prod-6', name: 'Tomato', variety: 'Anna F1', category: 'Vegetable', storageTemp: 10 },
  ];

  return initialProduceData.map(produce => {
    let weightInProcessing = 0;
    coldRoomInventoryData.forEach(item => {
      if (item.product.toLowerCase().includes(produce.name.toLowerCase())) {
        const weightPerUnit = produceWeightConversions[item.unit] || 0;
        weightInProcessing += item.quantity * weightPerUnit;
      }
    });

    let weightIncoming = 0;
    let shipmentCount = 0;
    shipmentData.forEach(shipment => {
      if (shipment.product.toLowerCase().includes(produce.name.toLowerCase()) && (shipment.status === 'In-Transit' || shipment.status === 'Awaiting QC' || shipment.status === 'Processing')) {
        shipmentCount++;
        const weightMatch = shipment.weight.match(/(\d+(\.\d+)?)/);
        if (weightMatch) {
            const weightValue = parseFloat(weightMatch[1]);
            if (shipment.weight.includes('kg')) {
                 weightIncoming += weightValue;
            } else if (shipment.weight.includes('t')) {
                 weightIncoming += weightValue * 1000;
            }
        }
      }
    });
    
    return {
      ...produce,
      weightInProcessing,
      weightIncoming,
      shipmentCount,
    };
  });
}

export const produceData: Produce[] = calculateProduceWeights();

export const vehicleTurnaroundData = [
  { vehicle: 'KDE 555F', turnaroundTime: 45 },
  { vehicle: 'KDF 123G', turnaroundTime: 62 },
  { vehicle: 'KDG 789H', turnaroundTime: 35 },
  { vehicle: 'KCE 789J', turnaroundTime: 85 },
];

export const fleetActivityData = [
  { hour: '08:00', checkIns: 5, checkOuts: 2 },
  { hour: '09:00', checkIns: 8, checkOuts: 4 },
  { hour: '10:00', checkIns: 6, checkOuts: 5 },
  { hour: '11:00', checkIns: 4, checkOuts: 7 },
  { hour: '12:00', checkIns: 3, checkOuts: 6 },
  { hour: '13:00', checkIns: 2, checkOuts: 4 },
  { hour: '14:00', checkIns: 5, checkOuts: 3 },
  { hour: '15:00', checkIns: 7, checkOuts: 5 },
  { hour: '16:00', checkIns: 4, checkOuts: 8 },
  { hour: '17:00', checkIns: 2, checkOuts: 9 },
];

export const incidentTrendData = [
    { month: "Feb", incidents: 7 },
    { month: "Mar", incidents: 4 },
    { month: "Apr", incidents: 8 },
    { month: "May", incidents: 6 },
    { month: "Jun", incidents: 9 },
    { month: "Jul", incidents: 5 },
];

export type DetailedIncident = {
  id: string;
  date: string;
  category: 'Security' | 'Safety' | 'Cold Chain' | 'Operational';
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Under Investigation' | 'Resolved';
  location: string;
};

export const detailedIncidentData: DetailedIncident[] = [
  { id: 'inc-1', date: '2024-07-25', category: 'Cold Chain', description: 'Cold Room 2 temperature exceeded 8°C for 30 minutes.', severity: 'High', status: 'Resolved', location: 'Cold Room 2' },
  { id: 'inc-2', date: '2024-07-20', category: 'Safety', description: 'Minor slip and fall incident in the packing area. No injury.', severity: 'Low', status: 'Resolved', location: 'Packing Station A' },
  { id: 'inc-3', date: '2024-07-18', category: 'Security', description: 'Unauthorized vehicle attempted entry at North Gate.', severity: 'Medium', status: 'Resolved', location: 'North Gate' },
  { id: 'inc-4', date: '2024-06-30', category: 'Operational', description: 'Shipment SH-88110 misrouted to wrong destination.', severity: 'High', status: 'Resolved', location: 'Logistics Office' },
  { id: 'inc-5', date: '2024-06-15', category: 'Cold Chain', description: 'Temperature probe on Truck KDC 456F offline for 2 hours.', severity: 'Medium', status: 'Resolved', location: 'On Transit - A104' },
  { id: 'inc-6', date: '2024-05-28', category: 'Security', description: 'Unscheduled visitor gained access to warehouse floor.', severity: 'Critical', status: 'Under Investigation', location: 'Warehouse 1' },
];


export const operationalComplianceData = [
    { category: 'On-Time Delivery', score: 92, breakdown: [ { metric: 'Departures on schedule', value: 95 }, { metric: 'Arrivals within window', value: 89 } ] },
    { category: 'Cold Chain', score: 97, breakdown: [ { metric: 'In-transit compliance', value: 96 }, { metric: 'Cold room compliance', value: 98 } ] },
    { category: 'Weight Accuracy', score: 99, breakdown: [ { metric: 'Receiving vs. Declared', value: 99 }, { metric: 'Final vs. Receiving', value: 100 } ] },
    { category: 'POD Rec.', score: 88, breakdown: [ { metric: 'PODs returned', value: 95 }, { metric: 'PODs matched to invoice', value: 81 } ] },
    { category: 'Inventory Accuracy', score: 94, breakdown: [ { metric: 'System vs. Physical count', value: 94 } ] },
    { category: 'QC Checks', score: 96, breakdown: [ { metric: 'Checklists completed', value: 100 }, { metric: 'Rejection rate', value: 92 } ] },
];

export const siteRiskData = [
    { site: 'Nakuru Hub', risk: 85, color: 'hsl(var(--chart-4))' },
    { site: 'Nairobi WH', risk: 65, color: 'hsl(var(--chart-1))' },
    { site: 'Thika Packing', risk: 55, color: 'hsl(var(--chart-1))' },
    { site: 'Eldoret Cold Storage', risk: 95, color: 'hsl(var(--destructive))' },
];

export const overallRiskProfileData = [
    { category: 'Financial', score: 45 },
    { category: 'Operational', score: 72 },
    { category: 'HR', score: 30 },
    { category: 'Security', score: 65 },
    { category: 'Compliance', score: 80 },
];

export const dwellTimeRiskData = [
    { location: 'Cold Room 1', product: 'Hass Avocados', dwellTime: 46 },
    { location: 'Cold Room 2', product: 'Roses (Red)', dwellTime: 20 },
    { location: 'Cold Room 1', product: 'Blueberries', dwellTime: 40 },
    { location: 'Cold Room 3', product: 'French Beans', dwellTime: 13 },
    { location: 'Cold Room 2', product: 'Carnations (White)', dwellTime: 8 },
    { location: 'PAL-003-C-8', product: 'Mixed Greens', dwellTime: 45 },
    { location: 'QC Inspection', product: 'Blueberries', dwellTime: 30 },
    { location: 'PAL-002-B-3', product: 'Hass Avocados', dwellTime: 90 },
    { location: 'PAL-001-A-1', product: 'Roses', dwellTime: 255 },
    { location: 'Cold Storage 2', product: 'Vaccines', dwellTime: 1085 },
];

export type AdvanceRequest = {
  id: string;
  employeeId: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  requestDate: string;
};

export const advanceRequestsData: AdvanceRequest[] = [
  { id: 'adv-1', employeeId: 'emp-2', amount: 5000, reason: 'School fees', status: 'Pending', requestDate: '2024-07-28T10:00:00Z' },
  { id: 'adv-2', employeeId: 'emp-3', amount: 2000, reason: 'Medical emergency', status: 'Approved', requestDate: '2024-07-27T14:30:00Z' },
  { id: 'adv-3', employeeId: 'emp-5', amount: 10000, reason: 'Family support', status: 'Rejected', requestDate: '2024-07-26T09:00:00Z' },
   { id: 'adv-4', employeeId: 'emp-6', amount: 3500, reason: 'Personal use', status: 'Paid', requestDate: '2024-07-25T11:00:00Z' },
];

export type Payroll = {
    employeeId: string;
    grossPay: number;
    deductions: number;
    netPay: number;
};

export type PettyCashTransaction = {
    id: string;
    type: 'in' | 'out';
    amount: number;
    description: string;
    timestamp: string;
    recipient?: string;
    phone?: string;
};

export const pettyCashData: PettyCashTransaction[] = [
    { id: 'pc-1', type: 'in', amount: 10000, description: 'Initial float', timestamp: '2024-07-28T09:00:00Z' },
    { id: 'pc-2', type: 'out', amount: 1500, description: 'Office cleaning supplies', timestamp: '2024-07-29T11:00:00Z', recipient: 'Cleaning Co.' },
    { id: 'pc-3', type: 'out', amount: 500, description: 'Lunch for overtime staff', timestamp: '2024-07-30T13:00:00Z', recipient: 'Local Cafe' },
    { id: 'pc-4', type: 'in', amount: 5000, description: 'Top-up from accounts', timestamp: '2024-07-31T10:00:00Z' },
    { id: 'pc-5', type: 'out', amount: 2000, description: 'Casual worker payment - M. Ali', timestamp: '2024-07-31T15:00:00Z', recipient: 'Mohammed Ali', phone: '0722000000' },
];

export const payrollDistributionData = [
  { role: 'Admin', value: 120000, fill: 'hsl(var(--chart-1))' },
  { role: 'Manager', value: 150000, fill: 'hsl(var(--chart-2))' },
  { role: 'Driver', value: 105000, fill: 'hsl(var(--chart-3))' },
  { role: 'Warehouse', value: 55000, fill: 'hsl(var(--chart-4))' },
  { role: 'Security', value: 45000, fill: 'hsl(var(--chart-5))' },
];

export const payrollTrendData = [
  { month: 'Feb', total: 410000 },
  { month: 'Mar', total: 415000 },
  { month: 'Apr', total: 420000 },
  { month: 'May', total: 425000 },
  { month: 'Jun', total: 430000 },
  { month: 'Jul', total: 475000 },
];

export type Branch = {
  id: string;
  name: string;
  location: string;
  managerId: string;
  employees: number;
  status: 'Active' | 'Inactive';
};

export const branchData: Branch[] = [
    { id: 'branch-1', name: 'Nairobi HQ', location: 'Nairobi, Kenya', managerId: 'emp-4', employees: 25, status: 'Active' },
    { id: 'branch-2', name: 'Nakuru Packhouse', location: 'Nakuru, Kenya', managerId: 'emp-1', employees: 60, status: 'Active' },
    { id: 'branch-3', name: 'Mombasa Port Office', location: 'Mombasa, Kenya', managerId: 'emp-4', employees: 15, status: 'Active' },
    { id: 'branch-4', name: 'Eldoret Cold Storage', location: 'Eldoret, Kenya', managerId: 'emp-1', employees: 40, status: 'Inactive' },
];
    
export type ClientFormValues = {
  name: string;
  contactName: string;
  contactEmail: string;
  subscriptionTier: 'Starter' | 'Professional' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'New';
};

export type Client = {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  subscriptionTier: 'Starter' | 'Professional' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'New';
  joinDate: string;
};

export const clientData: Client[] = [
    { id: 'client-1', name: 'Global Exporters Ltd.', contactName: 'Alice Johnson', contactEmail: 'alice@globalexporters.com', subscriptionTier: 'Enterprise', status: 'Active', joinDate: '2023-01-15' },
    { id: 'client-2', name: 'Fresh Farms Kenya', contactName: 'Bob Williams', contactEmail: 'bob@freshfarms.ke', subscriptionTier: 'Professional', status: 'Active', joinDate: '2023-05-20' },
    { id: 'client-3', name: 'Bloom Flowers', contactName: 'Charlie Brown', contactEmail: 'charlie@bloom.com', subscriptionTier: 'Starter', status: 'New', joinDate: '2024-07-20' },
    { id: 'client-4', name: 'AgroVentures Inc.', contactName: 'Diana Miller', contactEmail: 'diana@agroventures.com', subscriptionTier: 'Professional', status: 'Suspended', joinDate: '2023-09-10' },
];

export type Shift = {
    id: string;
    name: string;
    time: string;
};

export const shiftData: Shift[] = [
    { id: 'shift-1', name: 'Day Shift', time: '07:00 - 19:00' },
    { id: 'shift-2', name: 'Night Shift', time: '19:00 - 07:00' },
];

export type DailyRoster = {
    date: string;
    shiftId: string;
    employeeIds: string[];
};

export const dailyRosterData: DailyRoster[] = [
    { date: formatDate(today), shiftId: 'shift-1', employeeIds: ['emp-1', 'emp-2', 'emp-4', 'emp-6'] },
    { date: formatDate(today), shiftId: 'shift-2', employeeIds: [] },
    { date: formatDate(yesterday), shiftId: 'shift-1', employeeIds: ['emp-1', 'emp-2', 'emp-4', 'emp-6'] },
    { date: formatDate(yesterday), shiftId: 'shift-2', employeeIds: [] },
    { date: formatDate(twoDaysAgo), shiftId: 'shift-1', employeeIds: ['emp-1', 'emp-3', 'emp-4', 'emp-6'] },
    { date: formatDate(twoDaysAgo), shiftId: 'shift-2', employeeIds: [] },
];

export const preShiftChecklistItems = [
  { id: 'uniform', label: 'Correct Uniform Worn' },
  { id: 'gloves', label: 'Gloves On' },
  { id: 'overalls', label: 'Overalls/Apron Correct' },
];
    
export type GeneralLedgerEntry = {
    id: string;
    date: string;
    account: string;
    type: 'Revenue' | 'OPEX' | 'CAPEX' | 'Asset' | 'Liability';
    debit: number;
    credit: number;
    description: string;
};

export const generalLedgerData: GeneralLedgerEntry[] = [
  { id: 'txn-1', date: '2024-07-30', account: 'Accounts Receivable', type: 'Asset', debit: 450000, credit: 0, description: 'Invoice INV-2024-1050 to Kakuzi PLC' },
  { id: 'txn-2', date: '2024-07-30', account: 'Sales Revenue', type: 'Revenue', debit: 0, credit: 450000, description: 'Sale of avocados' },
  { id: 'txn-3', date: '2024-07-29', account: 'Fuel Expense', type: 'OPEX', debit: 8500, credit: 0, description: 'Fuel for Truck #KDA 113' },
  { id: 'txn-4', date: '2024-07-29', account: 'Cash', type: 'Asset', debit: 0, credit: 8500, description: 'Payment for fuel' },
  { id: 'txn-5', date: '2024-07-28', account: 'Wages Expense', type: 'OPEX', debit: 250000, credit: 0, description: 'Weekly payroll for casuals' },
  { id: 'txn-6', date: '2024-07-28', account: 'Cash', type: 'Asset', debit: 0, credit: 250000, description: 'Payment for payroll' },
  { id: 'txn-7', date: '2024-07-27', account: 'Utilities Expense', type: 'OPEX', debit: 35000, credit: 0, description: 'Electricity bill for cold storage' },
  { id: 'txn-8', date: '2024-07-27', account: 'Accounts Payable', type: 'Liability', debit: 0, credit: 35000, description: 'Payable to KPLC' },
  { id: 'txn-9', date: '2024-07-26', account: 'Maintenance Expense', type: 'OPEX', debit: 12000, credit: 0, description: 'Repair of sorting machine' },
  { id: 'txn-10', date: '2024-07-26', account: 'Cash', type: 'Asset', debit: 0, credit: 12000, description: 'Payment for maintenance' },
  { id: 'txn-11', date: '2024-07-25', account: 'Accounts Receivable', type: 'Asset', debit: 780000, credit: 0, description: 'Invoice INV-2024-1051 to Naivas' },
  { id: 'txn-12', date: '2024-07-25', account: 'Sales Revenue', type: 'Revenue', debit: 0, credit: 780000, description: 'Sale of mixed vegetables' },
  { id: 'txn-13', date: '2024-07-20', account: 'Equipment Purchase', type: 'CAPEX', debit: 850000, credit: 0, description: 'New sorting machine for Nakuru' },
  { id: 'txn-14', date: '2024-07-20', account: 'Cash', type: 'Asset', debit: 0, credit: 850000, description: 'Payment for new equipment' },
  { id: 'txn-15', date: '2024-07-18', account: 'Rent Expense', type: 'OPEX', debit: 150000, credit: 0, description: 'Monthly rent for Nairobi warehouse' },
  { id: 'txn-16', date: '2024-07-18', account: 'Cash', type: 'Asset', debit: 0, credit: 150000, description: 'Rent payment' },
];

export const biDataByBranch = {
  'branch-1': { // Nairobi HQ
    vehiclesOnSite: 6,
    kpiData: {
      vehiclesOnSite: { title: 'Vehicles on Site (NBI)', value: '6', change: '+1 from last hour', changeType: 'increase' as const },
      coldChainCompliance: { title: 'Cold Chain Compliance', value: '98%', change: '+1% from last month', changeType: 'increase' as const },
      topBranch: { title: 'Branch Throughput Rank', value: '#2', change: 'nationwide', changeType: 'increase' as const },
    },
    incidentTrendData: [ { month: "Feb", incidents: 2 }, { month: "Mar", incidents: 1 }, { month: "Apr", incidents: 3 }, { month: "May", incidents: 2 }, { month: "Jun", incidents: 4 }, { month: "Jul", incidents: 1 }, ],
    operationalComplianceData: [ { category: 'On-Time Delivery', score: 95, breakdown: [ { metric: 'Departures on schedule', value: 98 }, { metric: 'Arrivals within window', value: 92 } ] }, { category: 'Cold Chain', score: 98, breakdown: [ { metric: 'In-transit compliance', value: 97 }, { metric: 'Cold room compliance', value: 99 } ] }, { category: 'Weight Accuracy', score: 99, breakdown: [ { metric: 'Receiving vs. Declared', value: 99 }, { metric: 'Final vs. Receiving', value: 100 } ] }, { category: 'POD Rec.', score: 90, breakdown: [ { metric: 'PODs returned', value: 92 }, { metric: 'PODs matched to invoice', value: 88 } ] }, ],
    dwellTimeRiskData: [ { location: 'NHQ-CR-1', product: 'Roses', dwellTime: 12 }, { location: 'NHQ-CR-2', product: 'Berries', dwellTime: 8 }, ],
    overallRiskProfileData: [ { category: 'Financial', score: 40 }, { category: 'Operational', score: 65 }, { category: 'HR', score: 25 }, { category: 'Security', score: 70 }, { category: 'Compliance', score: 85 }, ],
  },
  'branch-2': { // Nakuru Packhouse
    vehiclesOnSite: 9,
    kpiData: {
      vehiclesOnSite: { title: 'Vehicles on Site (NKU)', value: '9', change: '-3 from last hour', changeType: 'decrease' as const },
      coldChainCompliance: { title: 'Cold Chain Compliance', value: '95%', change: '-1% from last month', changeType: 'decrease' as const },
      topBranch: { title: 'Branch Throughput Rank', value: '#1', change: 'nationwide', changeType: 'increase' as const },
    },
    incidentTrendData: [ { month: "Feb", incidents: 5 }, { month: "Mar", incidents: 3 }, { month: "Apr", incidents: 5 }, { month: "May", incidents: 4 }, { month: "Jun", incidents: 5 }, { month: "Jul", incidents: 4 }, ],
    operationalComplianceData: [ { category: 'On-Time Delivery', score: 89, breakdown: [ { metric: 'Departures on schedule', value: 90 }, { metric: 'Arrivals within window', value: 88 } ] }, { category: 'Cold Chain', score: 95, breakdown: [ { metric: 'In-transit compliance', value: 94 }, { metric: 'Cold room compliance', value: 96 } ] }, { category: 'Weight Accuracy', score: 98, breakdown: [ { metric: 'Receiving vs. Declared', value: 98 }, { metric: 'Final vs. Receiving', value: 98 } ] }, { category: 'POD Rec.', score: 85, breakdown: [ { metric: 'PODs returned', value: 90 }, { metric: 'PODs matched to invoice', value: 80 } ] }, ],
    dwellTimeRiskData: [ { location: 'NKU-CR-A', product: 'Avocados', dwellTime: 35 }, { location: 'NKU-CR-B', product: 'French Beans', dwellTime: 22 }, ],
    overallRiskProfileData: [ { category: 'Financial', score: 50 }, { category: 'Operational', score: 80 }, { category: 'HR', score: 40 }, { category: 'Security', score: 60 }, { category: 'Compliance', score: 75 }, ],
  }
};

export function getBiData(branchId: string) {
    if (branchId === 'branch-1') return biDataByBranch['branch-1'];
    if (branchId === 'branch-2') return biDataByBranch['branch-2'];

    // Calculate totals for General Overview
    const totalVehiclesOnSite = Object.values(biDataByBranch).reduce((acc, branch) => acc + branch.vehiclesOnSite, 0);
    
    return {
        kpiData: {
            vehiclesOnSite: { title: 'Total Vehicles on Site', value: String(totalVehiclesOnSite), change: 'across all branches', changeType: 'increase' as const },
            coldChainCompliance: { title: 'Cold Chain Compliance', value: '97%', change: '+0.5% from last month', changeType: 'increase' as const },
            topBranch: { title: 'Top Performing Branch', value: 'Nakuru Packhouse', change: 'by throughput', changeType: 'increase' as const },
        },
        incidentTrendData,
        operationalComplianceData,
        dwellTimeRiskData,
        overallRiskProfileData,
    };
}

export const energyConsumptionData = [
  { hour: "00:00", usage: 15 }, { hour: "02:00", usage: 14 },
  { hour: "04:00", usage: 14 }, { hour: "06:00", usage: 25 },
  { hour: "08:00", usage: 45 }, { hour: "10:00", usage: 50 },
  { hour: "12:00", usage: 48 }, { hour: "14:00", usage: 46 },
  { hour: "16:00", usage: 55 }, { hour: "18:00", usage: 40 },
  { hour: "20:00", usage: 22 }, { hour: "22:00", usage: 18 },
];

export const energyBreakdownData = [
  { area: 'Cold Rooms', consumption: 45, fill: 'hsl(var(--chart-1))' },
  { area: 'Packing Line', consumption: 30, fill: 'hsl(var(--chart-2))' },
  { area: 'Lighting', consumption: 10, fill: 'hsl(var(--chart-3))' },
  { area: 'Office', consumption: 15, fill: 'hsl(var(--chart-4))' },
];

export const energyCostData = [
    { month: 'Feb', cost: 380000 }, { month: 'Mar', cost: 390000 },
    { month: 'Apr', cost: 410000 }, { month: 'May', cost: 400000 },
    { month: 'Jun', cost: 420000 }, { month: 'Jul', cost: 450000 },
];

export const energyAnomalyData: ExplainAnomalyInput[] = [
  {
    metricName: "Grid Power Consumption",
    metricValue: 75,
    expectedValue: 50,
    timestamp: "2024-07-29T16:05:00Z",
    additionalContext: "Peak demand spike recorded. All cold room compressors kicked in simultaneously after a brief power outage.",
  },
];

export const waterConsumptionData = [
  { date: 'Jul 24', consumption: 120 }, { date: 'Jul 25', consumption: 135 },
  { date: 'Jul 26', consumption: 130 }, { date: 'Jul 27', consumption: 145 },
  { date: 'Jul 28', consumption: 140 }, { date: 'Jul 29', consumption: 150 },
  { date: 'Jul 30', consumption: 148 },
];

export const waterBreakdownData = [
  { area: 'Packing Line', consumption: 40, fill: 'hsl(var(--chart-1))' },
  { area: 'Cleaning', consumption: 25, fill: 'hsl(var(--chart-2))' },
  { area: 'Domestic', consumption: 15, fill: 'hsl(var(--chart-3))' },
  { area: 'Irrigation', consumption: 10, fill: 'hsl(var(--chart-4))' },
  { area: 'Cold Rooms', consumption: 10, fill: 'hsl(var(--chart-5))' },
];

export type WaterQualityEntry = {
    id: string;
    source: string;
    date: string;
    pH: number;
    turbidity: number;
    conductivity: number;
    status: 'Pass' | 'Fail';
};

export const waterQualityData: WaterQualityEntry[] = [
    { id: 'wq-1', source: 'Borehole 1', date: '2024-07-30', pH: 7.2, turbidity: 4.5, conductivity: 300, status: 'Pass' },
    { id: 'wq-2', source: 'Municipal Main', date: '2024-07-30', pH: 7.8, turbidity: 6.2, conductivity: 450, status: 'Fail' },
    { id: 'wq-3', source: 'Recycled Water Tank', date: '2024-07-29', pH: 6.9, turbidity: 3.1, conductivity: 600, status: 'Pass' },
    { id: 'wq-4', source: 'Borehole 2', date: '2024-07-29', pH: 7.4, turbidity: 5.0, conductivity: 350, status: 'Pass' },
];

export const dieselConsumptionData = [
  { day: 'Mon', consumption: 120 }, { day: 'Tue', consumption: 135 },
  { day: 'Wed', consumption: 130 }, { day: 'Thu', consumption: 145 },
  { day: 'Fri', consumption: 140 }, { day: 'Sat', consumption: 150 },
  { day: 'Sun', consumption: 148 },
];

export type ProductionReportData = {
    company: string;
    date: string;
    shift: string;
    productionDetails: { product: string, boxes: number }[],
    laborUsed: number;
};

export const productionReportData: ProductionReportData = {
    company: 'Harir International. - Nakuru Packhouse',
    date: '31st July, 2024',
    shift: 'Day Shift (07:00 - 19:00)',
    productionDetails: [
        { product: 'Roses (Red)', boxes: 450 },
        { product: 'Roses (White)', boxes: 300 },
        { product: 'Carnations (Pink)', boxes: 250 },
        { product: 'Blueberries (125g punnets)', boxes: 1200 },
    ],
    laborUsed: 35
};

export type ColdRoomPersonnelLog = {
    id: string;
    employeeId: string;
    coldRoomId: string;
    eventType: 'entry' | 'exit';
    timestamp: string;
};

export const coldRoomPersonnelLogData: ColdRoomPersonnelLog[] = [
    { id: 'plog-1', employeeId: 'emp-3', coldRoomId: 'cr-1', eventType: 'entry', timestamp: '2024-08-01T10:00:00Z' },
    { id: 'plog-2', employeeId: 'emp-7', coldRoomId: 'cr-1', eventType: 'entry', timestamp: '2024-08-01T10:02:00Z' },
    { id: 'plog-3', employeeId: 'emp-3', coldRoomId: 'cr-1', eventType: 'exit', timestamp: '2024-08-01T10:15:00Z' },
    { id: 'plog-4', employeeId: 'emp-8', coldRoomId: 'cr-2', eventType: 'entry', timestamp: '2024-08-01T10:18:00Z' },
    { id: 'plog-5', employeeId: 'emp-9', coldRoomId: 'cr-3', eventType: 'entry', timestamp: '2024-08-01T10:25:00Z' },
];

export type Carrier = {
  id: string;
  name: string;
  contact_name: string; 
  contact_email: string; 
  contact_phone: string; 
  rating?: number;
  status: 'Active' | 'Inactive';
  id_number?: string; 
  vehicle_registration?: string; 
};

export const carrierData: Carrier[] = [
    { id: 'carrier-1', name: 'SpeedyLogistics', contactName: 'John Speed', contactEmail: 'john@speedy.com', contactPhone: '0712345678', rating: 4.5, status: 'Active', idNumber: '12345678', vehicleRegistration: 'KDA 123B' },
    { id: 'carrier-2', name: 'QuickHaul', contactName: 'Jane Quick', contactEmail: 'jane@quickhaul.com', contactPhone: '0723456789', rating: 4.2, status: 'Active', idNumber: '23456789', vehicleRegistration: 'KDB 234C' },
    { id: 'carrier-3', name: 'ReliableTrans', contactName: 'Peter Reliable', contactEmail: 'peter@reliable.com', contactPhone: '0734567890', rating: 4.8, status: 'Active', idNumber: '34567890', vehicleRegistration: 'KDC 345D' },
    { id: 'carrier-4', name: 'GlobalMovers', contactName: 'Susan Global', contactEmail: 'susan@global.com', contactPhone: '0745678901', rating: 3.9, status: 'Inactive', idNumber: '45678901', vehicleRegistration: 'KDD 456E' },
    { id: 'carrier-5', name: 'EcoFreight', contactName: 'David Eco', contactEmail: 'david@eco.com', contactPhone: '0756789012', rating: 4.6, status: 'Active', idNumber: '56789012', vehicleRegistration: 'KDE 567F' },
];

export type PredictiveMaintenanceAlert = {
    id: string;
    asset: string;
    location: string;
    issue: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    confidence: number;
    nextAction: string;
};

export const predictiveMaintenanceData: PredictiveMaintenanceAlert[] = [
    { id: 'pm-1', asset: 'Compressor #3', location: 'Cold Room 2', issue: 'Unusual vibration pattern detected', riskLevel: 'High', confidence: 0.92, nextAction: 'Schedule Inspection' },
    { id: 'pm-2', asset: 'Sorting Line A Belt', location: 'Warehouse', issue: 'Motor current draw increasing', riskLevel: 'Medium', confidence: 0.78, nextAction: 'Monitor & Plan Service' },
    { id: 'pm-3', asset: 'Truck KDA 113 Engine', location: 'On-site', issue: 'Oil pressure slightly low', riskLevel: 'Low', confidence: 0.65, nextAction: 'Check at Next Service' },
];
    





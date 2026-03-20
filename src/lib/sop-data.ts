
export type SOP = {
  id: string;
  title: string;
  objective: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
  lastModified: string;
  readBy: string[];
  sections: {
    title: string;
    steps: {
      action: string;
      detail: string;
    }[];
  }[];
};

export const sopData: SOP[] = [
  {
    id: 'sop-receiving',
    title: 'SOP-001: Receiving Fresh Produce',
    objective: 'To ensure all incoming fresh produce is received, inspected, and documented correctly to maintain quality and traceability.',
    status: 'In Progress',
    lastModified: '2024-07-28T10:00:00Z',
    readBy: ['emp-1', 'emp-4', 'emp-6', 'emp-3', 'emp-7', 'emp-8', 'emp-9'], // Admin, Manager, Security, Warehouse
    sections: [
      {
        title: 'Step 1: Pre-Receiving',
        steps: [
          { action: 'Verify Shipment', detail: 'Cross-reference the incoming shipment with the pre-registered visitor/vehicle log and expected shipment notifications.' },
          { action: 'Direct Vehicle', detail: 'Direct the delivery vehicle to the designated receiving bay.' },
        ],
      },
      {
        title: 'Step 2: Unloading & Initial Inspection',
        steps: [
          { action: 'Temperature Check', detail: 'Measure and record the temperature of the reefer truck and the product surface before unloading.' },
          { action: 'Visual Inspection', detail: 'Visually inspect the pallets for any signs of damage, pests, or contamination during unloading.' },
          { action: 'Documentation', detail: 'Collect the delivery note and any other relevant paperwork from the driver.' },
        ],
      },
      {
        title: 'Step 3: Detailed Quality Control (QC)',
        steps: [
          { action: 'Weighing', detail: 'Move the entire shipment to the weight capture station. Record the declared weight and the net weighed weight.' },
          { action: 'Sampling', detail: 'Take a representative sample of the produce for detailed QC checks (e.g., size, color, firmness, defects).' },
          { action: 'Quality Checklist', detail: 'Complete the digital Quality & Condition Checklist, noting any rejections and the weight of rejected produce.' },
          { action: 'Photo Evidence', detail: 'Take clear photos of any rejected items or damaged packaging as evidence.' },
        ],
      },
      {
        title: 'Step 4: Tagging & Put-Away',
        steps: [
          { action: 'Generate Tags', detail: 'Use the Tag Management module to generate a new batch of QR code tags for the accepted produce.' },
          { action: 'Apply Tags', detail: 'Apply the generated QR code tags to each pallet or box.' },
          { action: 'Move to Cold Storage', detail: 'Move the tagged produce to its designated location within the appropriate cold room.' },
          { action: 'Log Entry', detail: 'Scan the final tag at the cold room entrance to log the entry and update inventory.' },
        ],
      },
    ],
  },
  {
    id: 'sop-cold-chain',
    title: 'SOP-002: Cold Chain Management',
    objective: 'To maintain the integrity of the cold chain for all temperature-sensitive products throughout storage and transit.',
    status: 'In Progress',
    lastModified: '2024-06-15T09:00:00Z',
    readBy: ['emp-1', 'emp-4', 'emp-2', 'emp-5'], // Admin, Manager, Driver
    sections: [
       {
        title: 'Section A: Cold Room Monitoring',
        steps: [
          { action: 'Continuous Monitoring', detail: 'Ensure all cold room sensors are online and transmitting data to the dashboard.' },
          { action: 'Temperature Verification', detail: 'Manually verify temperatures with a calibrated thermometer twice daily and log the readings.' },
          { action: 'Alert Response', detail: 'Respond to any automated temperature or humidity alerts within 15 minutes. Investigate the cause and document the corrective action taken.' },
        ],
      },
      {
        title: 'Section B: Product Handling',
        steps: [
          { action: 'Minimize Exposure', detail: 'Keep cold room doors closed at all times except during entry and exit. Minimize the time produce spends outside of a temperature-controlled environment.' },
          { action: 'Staging', detail: 'Use designated refrigerated staging areas for packing and loading to minimize temperature fluctuations.' },
        ],
      },
    ],
  },
  {
    id: 'sop-visitor-protocol',
    title: 'SOP-003: Visitor Entry & Exit Protocol',
    objective: 'To ensure the security and safety of the facility by properly managing the entry, movement, and exit of all visitors.',
    status: 'Completed',
    lastModified: '2024-05-20T14:00:00Z',
    readBy: ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6', 'emp-7', 'emp-8', 'emp-9', 'emp-10', 'emp-11', 'emp-12'],
    sections: [
        {
        title: 'Step 1: Pre-Registration (Preferred)',
        steps: [
          { action: 'Host Responsibility', detail: 'The host employee is responsible for pre-registering their expected visitors via the Security Dashboard.' },
          { action: 'Information Capture', detail: 'All required fields, including visitor name, company, contact details, and host, must be completed.' },
          { action: 'QR Code Issuance', detail: 'Upon successful pre-registration, a unique QR code is sent to the visitor, which they must present upon arrival.' },
        ],
      },
      {
        title: 'Step 2: Arrival & Check-in',
        steps: [
          { action: 'Verification', detail: 'Security personnel must scan the visitor\'s QR code or find their pre-registration details in the system.' },
          { action: 'ID Check', detail: 'Verify the visitor\'s government-issued ID against the registration details.' },
          { action: 'Check-in Confirmation', detail: 'Once verified, security confirms the check-in, which notifies the host of their visitor\'s arrival.' },
        ],
      },
      {
        title: 'Step 3: Checkout & Exit',
        steps: [
          { action: 'Host Checkout', detail: 'The host initiates the checkout process from their dashboard, changing the visitor\'s status to "Pending Exit".' },
          { action: 'Gate Pass Generation', detail: 'If the visitor has a vehicle, a Gate Pass is automatically generated and can be printed.' },
          { action: 'Final Verification', detail: 'At the exit gate, security scans the Gate Pass QR code or the original visitor QR code to finalize the checkout and log the exit time.' },
        ],
      },
    ],
  },
];


// Dummy employee data for avatar display and analytics
export const allSopEmployeeData = [
  { id: 'emp-1', name: 'John Omondi', role: 'Admin', image: 'https://i.pravatar.cc/150?u=emp-1' },
  { id: 'emp-4', name: 'Emily Adhiambo', role: 'Manager', image: 'https://i.pravatar.cc/150?u=emp-4' },
  { id: 'emp-12', name: 'David Rono', role: 'Manager', image: 'https://i.pravatar.cc/150?u=emp-12' },
  { id: 'emp-2', name: 'Jane Wanjiku', role: 'Driver', image: 'https://i.pravatar.cc/150?u=emp-2' },
  { id: 'emp-5', name: 'Chris Mwangi', role: 'Driver', image: 'https://i.pravatar.cc/150?u=emp-5' },
  { id: 'emp-3', name: 'Mike Kimani', role: 'Warehouse', image: 'https://i.pravatar.cc/150?u=emp-3' },
  { id: 'emp-7', name: 'Grace Akinyi', role: 'Warehouse', image: 'https://i.pravatar.cc/150?u=emp-7' },
  { id: 'emp-8', name: 'Samuel Ndungu', role: 'Warehouse', image: 'https://i.pravatar.cc/150?u=emp-8' },
  { id: 'emp-9', name: 'Fatuma Hassan', role: 'Warehouse', image: 'https://i.pravatar.cc/150?u=emp-9' },
  { id: 'emp-6', name: 'Peter Kamau', role: 'Security', image: 'https://i.pravatar.cc/150?u=emp-6' },
  { id: 'emp-10', name: 'Esther Moraa', role: 'Security', image: 'https://i.pravatar.cc/150?u=emp-10' },
  { id: 'emp-11', name: 'James Kariuki', role: 'Security', image: 'https://i.pravatar.cc/150?u=emp-11' },
];

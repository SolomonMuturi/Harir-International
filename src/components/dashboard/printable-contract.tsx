
'use client';

import { FreshTraceLogo } from '../icons';
import { format } from 'date-fns';
import type { Customer, CustomerDocument } from '@/lib/data';

interface PrintableContractProps {
  customer: Customer;
  document: CustomerDocument;
}

export function PrintableContract({ customer, document }: PrintableContractProps) {
  
  const reportId = `AGMT-${new Date(document.uploadDate).getFullYear()}-${String(customer.name.split(' ')[0].slice(0, 4)).toUpperCase()}`;
  
  const mockContent = `This Service Level Agreement ("Agreement") is made and entered into as of ${format(new Date(document.uploadDate), 'MMMM d, yyyy')}, by and between FreshTrace Inc., a Kenyan corporation with its principal place of business at P.O. Box 12345 - 00100, Nairobi ("Provider"), and ${customer.name}, with its principal place of business at their registered address ("Client").

WHEREAS, Provider is in the business of providing supply chain traceability and management services; and
WHEREAS, Client desires to engage Provider to perform such services, and Provider is willing to perform such services, under the terms and conditions set forth in this Agreement.

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

1.  **Services.** Provider agrees to provide Client with access to the FreshTrace platform and related services ("Services") as outlined in the active subscription tier.

2.  **Service Levels.**
    a.  **Uptime:** Provider will use commercially reasonable efforts to make the Services available with a Monthly Uptime Percentage of at least 99.9% during any monthly billing cycle.
    b.  **Support:** Provider will provide technical support via email and phone during standard business hours (8:00 AM - 5:00 PM EAT, Monday-Friday). The target response time for critical issues is 4 hours.
    c.  **Data Accuracy:** Provider will ensure that data captured and displayed on the platform maintains an accuracy level of at least 99.5%.

3.  **Term and Termination.** This Agreement shall commence on the Effective Date and shall continue until terminated as provided herein. The initial term of this agreement is for one (1) year, automatically renewing for successive one-year terms unless either party provides written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.

4.  **Confidentiality.** Each party agrees to keep confidential all non-public information provided by the other party.
`;

  return (
    <div className="p-16 bg-white text-black font-sans" style={{ width: '210mm', minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
      <header className="flex justify-between items-start mb-24">
        <div className="flex items-center gap-4">
          <FreshTraceLogo className="h-10 w-10 text-green-600" />
          <h1 className="text-2xl font-bold">{document.name}</h1>
        </div>
        <div className="text-right text-sm">
            <p className="font-bold text-lg">FreshTrace Inc.</p>
            <p className="text-gray-600">info@freshtrace.co.ke | www.freshtrace.co.ke</p>
            <p className="font-mono mt-2 text-gray-500">{reportId}</p>
        </div>
      </header>

      <main className="text-sm leading-relaxed text-gray-800 flex-grow prose prose-sm max-w-none">
        <div
            dangerouslySetInnerHTML={{
                __html: mockContent
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\n/g, '<br />'), // Line breaks
            }}
        />
      </main>
      
      <footer className="mt-24 pt-8" style={{ pageBreakInside: 'avoid' }}>
        <div className="grid grid-cols-2 gap-24">
            <div>
                <div className="border-b-2 border-gray-400 pb-8 mb-2"></div>
                <p className="font-bold">For FreshTrace Inc.</p>
                <p className="text-xs">Authorized Signatory</p>
            </div>
            <div>
                <div className="border-b-2 border-gray-400 pb-8 mb-2"></div>
                <p className="font-bold">For {customer.name}</p>
                <p className="text-xs">Authorized Signatory</p>
            </div>
        </div>
        <div className="text-center text-xs text-gray-400 mt-12 pt-4 border-t">
          Page 1 of 1
        </div>
      </footer>
    </div>
  );
}

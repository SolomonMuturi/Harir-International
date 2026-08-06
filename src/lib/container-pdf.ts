export interface ContainerPdfUpdate {
  current_location?: string | null;
  current_temperature?: string | null;
  arrival_date?: string | null;
  updated_at: string;
}

export interface ContainerPdfData {
  id: string;
  shipment_number: string;
  invoice_number?: string | null;
  bl_number?: string | null;
  container_number: string;
  current_location?: string | null;
  current_temperature?: string | null;
  arrival_date?: string | null;
  destination?: string | null;
  created_at?: string;
  updates?: ContainerPdfUpdate[];
}

const GREEN = [34, 139, 34] as const;
const DARK_GREEN = [22, 101, 52] as const;
const LIGHT_GREEN = [220, 252, 231] as const;
const LIGHT_GREY = [248, 249, 250] as const;
const GREY = [233, 236, 239] as const;

const LOGO_PATHS = [
  '/images/HLogo.png',
  '/images/Harirlogo.jpg',
  '/Harirlogo.svg',
  '/Harirlogo.png',
  '/Harirlogo.jpg',
  '/logo.png',
  '/logo.jpg',
  '/favicon.ico',
];

export async function generateContainerPdf(container: ContainerPdfData): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);

  const doc = new jsPDF('p', 'mm', 'a5');
  const pageWidth = 148;
  const leftMargin = 8;
  const contentWidth = pageWidth - 2 * leftMargin;

  let hasLogo = false;
  let logoHeight = 0;

  try {
    for (const path of LOGO_PATHS) {
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
          logoHeight = 14;
          const x = (pageWidth - logoWidth) / 2;
          doc.addImage(base64String as string, 'PNG', x, 6, logoWidth, logoHeight);
          hasLogo = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.log('Logo loading failed:', error);
  }

  if (!hasLogo) {
    doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.circle(pageWidth / 2, 13, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('HI', pageWidth / 2, 16, { align: 'center' });
    logoHeight = 14;
  }

  const startY = 24;
  doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, startY, pageWidth - leftMargin, startY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CONTAINER TRACKING - SHIPMENT DETAILS', pageWidth / 2, startY + 7, { align: 'center' });
  let yPos = startY + 13;

  doc.setFillColor(LIGHT_GREY[0], LIGHT_GREY[1], LIGHT_GREY[2]);
  doc.rect(leftMargin, yPos, contentWidth, 10, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Details', leftMargin + 2, yPos + 4);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Doc: ${container.shipment_number}`, leftMargin + 2, yPos + 8);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, leftMargin + 55, yPos + 8);
  yPos += 13;

  doc.setFillColor(GREY[0], GREY[1], GREY[2]);
  doc.rect(leftMargin, yPos, contentWidth, 16, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Shipment Information', leftMargin + 2, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Shipment No: ${container.shipment_number}`, leftMargin + 2, yPos + 9);
  doc.text(`Invoice No: ${container.invoice_number || 'N/A'}`, leftMargin + 50, yPos + 9);
  doc.text(`B/L Number: ${container.bl_number || 'N/A'}`, leftMargin + 100, yPos + 9);
  doc.text(`Container No: ${container.container_number}`, leftMargin + 2, yPos + 14);
  doc.text(`Destination: ${container.destination || 'N/A'}`, leftMargin + 50, yPos + 14);
  doc.text(`Created: ${container.created_at ? new Date(container.created_at).toLocaleDateString('en-GB') : 'N/A'}`, leftMargin + 100, yPos + 14);
  yPos += 18;

  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.rect(leftMargin, yPos, contentWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LATEST UPDATE', leftMargin + 2, yPos + 4.5);
  yPos += 7;

  const fmtDateTime = (value: string | null | undefined) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fmtDate = (value: string | null | undefined) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const latest =
    Array.isArray(container.updates) && container.updates.length > 0
      ? container.updates[0]
      : null;

  doc.setFillColor(LIGHT_GREEN[0], LIGHT_GREEN[1], LIGHT_GREEN[2]);
  doc.rect(leftMargin, yPos, contentWidth, 14, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  if (latest) {
    doc.text(`Updated: ${fmtDateTime(latest.updated_at)}`, leftMargin + 2, yPos + 5);
    doc.text(`Arrival Date: ${fmtDate(latest.arrival_date)}`, leftMargin + 75, yPos + 5);
    doc.text(`Location: ${latest.current_location || 'N/A'}`, leftMargin + 2, yPos + 10);
    doc.text(`Temperature: ${latest.current_temperature || 'N/A'}`, leftMargin + 75, yPos + 10);
  } else {
    doc.text('No updates recorded yet.', leftMargin + 2, yPos + 6);
  }
  yPos += 35;

  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos > pageHeight - 18) {
    doc.addPage();
    yPos = 18;
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Zachariah`,
    pageWidth / 2,
    yPos + 4,
    { align: 'center' }
  );
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, yPos + 7, { align: 'center' });

  yPos += 12;

  doc.setFontSize(5);
  doc.setTextColor(128, 128, 128);
  const docInfo1 = `Harir International - Container Tracking System • Document: ${container.shipment_number}`;
  const docInfo2 = `Generated: ${new Date().toLocaleString('en-GB')} • This is a computer-generated document`;
  doc.text(docInfo1, pageWidth / 2, yPos, { align: 'center' });
  doc.text(docInfo2, pageWidth / 2, yPos + 2.5, { align: 'center' });

  const fileName = `Container_Tracking_${container.container_number.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

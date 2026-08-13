// app/api/whatsapp/send-grn/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';

function formatWhatsAppNumber(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = '254' + digits.slice(1);
  else if (!digits.startsWith('254')) digits = '254' + digits;
  return digits;
}

// POST /api/whatsapp/send-grn
// Multipart form: file (PDF), supplierPhone, supplierName, recordId, palletId, filename, caption
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, ['counting.perform', 'suppliers.weigh', 'inventory.view']);
  if (auth.error) return auth.error;

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!token || !phoneNumberId) {
    return NextResponse.json(
      { error: 'WhatsApp API not configured', message: 'WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const supplierPhone = String(formData.get('supplierPhone') || '').trim();
    const supplierName = String(formData.get('supplierName') || '').trim();
    const filename = String(formData.get('filename') || `Warehouse_GRN_${supplierName.replace(/\s+/g, '_')}.pdf`);
    const caption = String(formData.get('caption') || '');

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Bad Request', message: 'A PDF file is required.' }, { status: 400 });
    }

    if (!supplierPhone) {
      return NextResponse.json({ error: 'Bad Request', message: 'Supplier phone number is required.' }, { status: 400 });
    }

    const waNumber = formatWhatsAppNumber(supplierPhone);
    if (!waNumber) {
      return NextResponse.json({ error: 'Bad Request', message: `Could not parse phone number: ${supplierPhone}` }, { status: 400 });
    }

    // Step 1: Upload the PDF to WhatsApp media API
    const mediaForm = new FormData();
    mediaForm.append('messaging_product', 'whatsapp');
    mediaForm.append('type', 'application/pdf');
    mediaForm.append('file', file, filename);

    const mediaResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: mediaForm,
    });

    if (!mediaResponse.ok) {
      const mediaError = await mediaResponse.text();
      return NextResponse.json(
        { error: 'WhatsApp media upload failed', message: mediaError },
        { status: 502 }
      );
    }

    const mediaResult: any = await mediaResponse.json();
    const mediaId: string = mediaResult?.id;

    if (!mediaId) {
      return NextResponse.json({ error: 'WhatsApp media upload failed', message: 'No media id returned.' }, { status: 502 });
    }

    // Step 2: Send the document message
    const messageBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: waNumber,
      type: 'document',
      document: {
        id: mediaId,
        filename,
        caption,
      },
    };

    const sendResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });

    if (!sendResponse.ok) {
      const sendError = await sendResponse.text();
      return NextResponse.json(
        { error: 'WhatsApp message send failed', message: sendError },
        { status: 502 }
      );
    }

    const sendResult: any = await sendResponse.json();

    return NextResponse.json({
      success: true,
      messageId: sendResult?.messages?.[0]?.id || null,
      to: waNumber,
    });
  } catch (error: any) {
    console.error('Error sending GRN via WhatsApp API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Failed to send GRN via WhatsApp.' },
      { status: 500 }
    );
  }
}

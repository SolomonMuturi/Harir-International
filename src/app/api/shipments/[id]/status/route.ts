import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, ['shipments.update', 'shipments.track']);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = [
      'Awaiting_QC',
      'Processing', 
      'Receiving',
      'Preparing_for_Dispatch',
      'Ready_for_Dispatch',
      'In_Transit',
      'Delivered',
      'Delayed'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipments.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(shipment);
  } catch (error: any) {
    console.error('❌ Error updating shipment status:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment status', details: error.message },
      { status: 500 }
    );
  }
}
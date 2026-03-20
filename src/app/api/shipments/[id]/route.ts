import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Add this constant at the top
const VALID_STATUSES = [
  'Awaiting_QC',
  'Processing', 
  'Receiving',
  'Preparing_for_Dispatch',
  'Ready_for_Dispatch',
  'In_Transit',
  'Delivered',
  'Delayed'
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract ID from params
    const shipmentId = params.id;
    
    console.log('📡 API: Fetching shipment with ID:', shipmentId);
    
    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipments.findUnique({
      where: { id: shipmentId },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            location: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Convert dates to ISO strings for JSON serialization
    const responseData = {
      id: shipment.id,
      shipment_id: shipment.shipment_id,
      customer: shipment.customers?.name,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      product: shipment.product,
      weight: shipment.weight,
      tags: shipment.tags,
      carrier: shipment.carrier,
      expected_arrival: shipment.expected_arrival?.toISOString(),
      created_at: shipment.created_at.toISOString(),
      customers: shipment.customers
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ Error fetching shipment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment details', details: error.message },
      { status: 500 }
    );
  }
}

// ADD THIS PATCH METHOD for Outbound functionality
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shipmentId = params.id;
    const body = await request.json();
    
    console.log(`✏️ Updating shipment ${shipmentId}:`, body);
    
    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status value',
          validStatuses: VALID_STATUSES 
        },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (body.status) updateData.status = body.status;
    if (body.carrier) updateData.carrier = body.carrier;
    
    // Handle driver and truck data in tags
    if (body.driverId || body.truckId) {
      // Get existing tags
      const existingShipment = await prisma.shipments.findUnique({
        where: { id: shipmentId },
        select: { tags: true }
      });
      
      let existingTags = {};
      try {
        if (existingShipment?.tags) {
          existingTags = JSON.parse(existingShipment.tags);
        }
      } catch (e) {
        console.log('Could not parse existing tags, starting fresh');
      }
      
      // Merge with new data
      const newTags = {
        ...existingTags,
        ...(body.driverId && { driverId: body.driverId }),
        ...(body.truckId && { truckId: body.truckId }),
        dispatchDate: new Date().toISOString()
      };
      
      updateData.tags = JSON.stringify(newTags);
    }
    
    const updatedShipment = await prisma.shipments.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        customers: true
      }
    });
    
    console.log(`✅ Shipment ${shipmentId} updated successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'Shipment updated successfully',
      shipment: updatedShipment
    });
    
  } catch (error: any) {
    console.error('❌ Error updating shipment:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update shipment', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shipmentId = params.id;
    const body = await request.json();
    
    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { 
          error: 'Invalid status value',
          validStatuses: VALID_STATUSES 
        },
        { status: 400 }
      );
    }
    
    const updatedShipment = await prisma.shipments.update({
      where: { id: shipmentId },
      data: {
        origin: body.origin,
        destination: body.destination,
        status: body.status,
        product: body.product,
        weight: body.weight,
        tags: body.tags,
        carrier: body.carrier,
        expected_arrival: body.expected_arrival ? new Date(body.expected_arrival) : undefined
      }
    });

    return NextResponse.json(updatedShipment);
  } catch (error: any) {
    console.error('❌ Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shipmentId = params.id;
    
    await prisma.shipments.delete({
      where: { id: shipmentId }
    });

    return NextResponse.json({ message: 'Shipment deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting shipment:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipment', details: error.message },
      { status: 500 }
    );
  }
}
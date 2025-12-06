import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const visitor = await prisma.visitors.findUnique({
      where: { id },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Serialize dates
    const serializedVisitor = {
      ...visitor,
      check_in_time: visitor.check_in_time?.toISOString() || null,
      check_out_time: visitor.check_out_time?.toISOString() || null,
      expected_check_in_time: visitor.expected_check_in_time?.toISOString() || null,
      created_at: visitor.created_at.toISOString(),
    };

    return NextResponse.json(serializedVisitor);
  } catch (error: any) {
    console.error('❌ Error fetching visitor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;
    
    console.log(`📝 Updating visitor ${id} with data:`, body);
    
    // Check if visitor exists
    const existingVisitor = await prisma.visitors.findUnique({
      where: { id }
    });

    if (!existingVisitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only update fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.check_in_time !== undefined) {
      updateData.check_in_time = body.check_in_time ? new Date(body.check_in_time) : null;
    }
    if (body.check_out_time !== undefined) {
      updateData.check_out_time = body.check_out_time ? new Date(body.check_out_time) : null;
    }
    if (body.vehicle_plate !== undefined) updateData.vehicle_plate = body.vehicle_plate;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.visitor_type !== undefined) updateData.visitor_type = body.visitor_type;
    if (body.cargo_description !== undefined) updateData.cargo_description = body.cargo_description;
    if (body.host_id !== undefined) updateData.host_id = body.host_id;
    if (body.department !== undefined) updateData.department = body.department;

    const updatedVisitor = await prisma.visitors.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Updated visitor:', updatedVisitor);

    // Serialize dates
    const serializedVisitor = {
      ...updatedVisitor,
      check_in_time: updatedVisitor.check_in_time?.toISOString() || null,
      check_out_time: updatedVisitor.check_out_time?.toISOString() || null,
      expected_check_in_time: updatedVisitor.expected_check_in_time?.toISOString() || null,
      created_at: updatedVisitor.created_at.toISOString(),
    };

    return NextResponse.json(serializedVisitor);
  } catch (error: any) {
    console.error(`❌ Error updating visitor ${params.id}:`, error);
    
    // If visitor not found, return 404
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Visitor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update visitor', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    await prisma.visitors.delete({
      where: { id }
    });

    console.log(`✅ Deleted visitor ${id}`);

    return NextResponse.json({ message: 'Visitor deleted successfully' });
  } catch (error: any) {
    console.error(`❌ Error deleting visitor ${params.id}:`, error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Visitor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete visitor', details: error.message },
      { status: 500 }
    );
  }
}
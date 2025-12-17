import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: Fetch specific assignment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const assignment = await prisma.carrier_assignments.findUnique({
      where: { id: params.id },
      include: {
        carrier: true,
        loading_sheet: {
          include: {
            loading_pallets: true,
          },
        },
        transit_history: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Calculate transit days
    let transitDays = null;
    if (assignment.transit_started_at && assignment.transit_completed_at) {
      const start = new Date(assignment.transit_started_at);
      const end = new Date(assignment.transit_completed_at);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      transitDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (assignment.transit_started_at) {
      const start = new Date(assignment.transit_started_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      transitDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...assignment,
        transit_days: transitDays,
      },
    });

  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PATCH: Update assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      status, 
      notes, 
      transit_started_at, 
      transit_completed_at,
      transit_days 
    } = body;

    // Validate status if provided
    const validStatuses = ['assigned', 'in_transit', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    // Handle transit dates with validation
    if (transit_started_at) {
      const startDate = new Date(transit_started_at);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid transit_started_at date format' },
          { status: 400 }
        );
      }
      updateData.transit_started_at = startDate;
    }
    
    if (transit_completed_at) {
      const endDate = new Date(transit_completed_at);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid transit_completed_at date format' },
          { status: 400 }
        );
      }
      
      // If we have both start and end dates, calculate transit days
      if (transit_started_at || updateData.transit_started_at) {
        const startDate = transit_started_at 
          ? new Date(transit_started_at) 
          : await prisma.carrier_assignments.findUnique({
              where: { id: params.id },
              select: { transit_started_at: true }
            }).then(a => a?.transit_started_at);
        
        if (startDate) {
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          updateData.transit_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }
      
      updateData.transit_completed_at = endDate;
    }
    
    if (transit_days !== undefined) {
      updateData.transit_days = parseInt(transit_days);
    }

    // Check if assignment exists
    const existingAssignment = await prisma.carrier_assignments.findUnique({
      where: { id: params.id },
      include: {
        carrier: true,
        loading_sheet: true,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Update assignment
    const updatedAssignment = await prisma.carrier_assignments.update({
      where: { id: params.id },
      data: updateData,
      include: {
        carrier: true,
        loading_sheet: {
          include: {
            loading_pallets: true,
          },
        },
      },
    });

    // If status changed to completed, create a transit history record
    if (status === 'completed' && existingAssignment.status !== 'completed') {
      await prisma.transit_history.create({
        data: {
          assignment_id: params.id,
          action: 'delivered',
          notes: 'Marked as delivered via assignment update',
          timestamp: new Date(),
        },
      });
    }

    // Calculate transit days for response
    let calculatedTransitDays = null;
    if (updatedAssignment.transit_started_at && updatedAssignment.transit_completed_at) {
      const start = new Date(updatedAssignment.transit_started_at);
      const end = new Date(updatedAssignment.transit_completed_at);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      calculatedTransitDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAssignment,
        transit_days: calculatedTransitDays || updatedAssignment.transit_days,
      },
      message: 'Assignment updated successfully',
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE: Remove assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if assignment exists
    const assignment = await prisma.carrier_assignments.findUnique({
      where: { id: params.id },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Delete assignment (transit_history will be deleted automatically due to cascade)
    await prisma.carrier_assignments.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
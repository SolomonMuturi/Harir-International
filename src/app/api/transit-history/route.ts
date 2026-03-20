import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Fetch all transit history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (assignmentId) {
      where.assignment_id = assignmentId;
    }
    if (action) {
      where.action = action;
    }

    // Get total count
    const total = await prisma.transit_history.count({ where });

    // Get transit history with related data
    const transitHistory = await prisma.transit_history.findMany({
      where,
      include: {
        assignment: {
          include: {
            carrier: true,
            loading_sheet: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: limit,
    });

    // Calculate transit days for assignments
    const enhancedHistory = transitHistory.map(history => {
      let transitDays = null;
      if (history.assignment.transit_started_at && history.assignment.transit_completed_at) {
        const start = new Date(history.assignment.transit_started_at);
        const end = new Date(history.assignment.transit_completed_at);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        transitDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else if (history.assignment.transit_started_at) {
        const start = new Date(history.assignment.transit_started_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        transitDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...history,
        assignment: {
          ...history.assignment,
          transit_days: transitDays,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedHistory,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching transit history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transit history' },
      { status: 500 }
    );
  }
}

// POST: Create new transit event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, action, notes, location } = body;

    // Validate required fields
    if (!assignmentId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: assignmentId and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['start_transit', 'end_transit', 'delivered'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignment = await prisma.carrier_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        carrier: true,
        loading_sheet: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check business rules based on action
    let updateAssignmentData: any = {};
    
    switch (action) {
      case 'start_transit':
        // Can only start transit if currently assigned
        if (assignment.status !== 'assigned') {
          return NextResponse.json(
            { success: false, error: 'Can only start transit for assigned shipments' },
            { status: 400 }
          );
        }
        updateAssignmentData.status = 'in_transit';
        updateAssignmentData.transit_started_at = new Date();
        break;

      case 'end_transit':
        // Can only end transit if currently in transit
        if (assignment.status !== 'in_transit') {
          return NextResponse.json(
            { success: false, error: 'Can only end transit for shipments in transit' },
            { status: 400 }
          );
        }
        updateAssignmentData.status = 'completed';
        updateAssignmentData.transit_completed_at = new Date();
        
        // Calculate transit days
        if (assignment.transit_started_at) {
          const start = new Date(assignment.transit_started_at);
          const end = new Date();
          const diffTime = Math.abs(end.getTime() - start.getTime());
          updateAssignmentData.transit_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        break;

      case 'delivered':
        // Can mark as delivered from any status
        updateAssignmentData.status = 'completed';
        updateAssignmentData.transit_completed_at = new Date();
        
        // If transit hasn't started, use assigned_at as start
        if (assignment.transit_started_at) {
          const start = new Date(assignment.transit_started_at);
          const end = new Date();
          const diffTime = Math.abs(end.getTime() - start.getTime());
          updateAssignmentData.transit_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          // Use assigned_at as start if transit never started
          const start = new Date(assignment.assigned_at);
          const end = new Date();
          const diffTime = Math.abs(end.getTime() - start.getTime());
          updateAssignmentData.transit_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          updateAssignmentData.transit_started_at = assignment.assigned_at;
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Start a transaction to update both assignment and create history
    const result = await prisma.$transaction(async (tx) => {
      // Update assignment
      const updatedAssignment = await tx.carrier_assignments.update({
        where: { id: assignmentId },
        data: updateAssignmentData,
        include: {
          carrier: true,
          loading_sheet: true,
        },
      });

      // Create transit history record
      const transitRecord = await tx.transit_history.create({
        data: {
          assignment_id: assignmentId,
          action: action,
          notes: notes || null,
          location: location || null,
          timestamp: new Date(),
        },
      });

      // If this is a delivery, also update related shipment status
      if (action === 'delivered' || action === 'end_transit') {
        // Find shipment associated with this loading sheet
        const loadingSheet = await tx.loading_sheets.findUnique({
          where: { id: assignment.loading_sheet_id },
        });

        if (loadingSheet?.bill_number) {
          // Update shipment status to Delivered
          await tx.shipments.updateMany({
            where: {
              OR: [
                { carrier: updatedAssignment.carrier.name },
                { shipment_id: loadingSheet.bill_number },
              ],
            },
            data: {
              status: 'Delivered',
            },
          });
        }
      }

      return {
        assignment: updatedAssignment,
        transitRecord,
      };
    });

    // Calculate transit days for response
    let transitDays = null;
    if (result.assignment.transit_started_at && result.assignment.transit_completed_at) {
      const start = new Date(result.assignment.transit_started_at);
      const end = new Date(result.assignment.transit_completed_at);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      transitDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result.transitRecord,
        assignment: {
          ...result.assignment,
          transit_days: transitDays,
        },
      },
      message: `Successfully ${action.replace('_', ' ')} for assignment`,
    });

  } catch (error) {
    console.error('Error creating transit history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transit history' },
      { status: 500 }
    );
  }
}
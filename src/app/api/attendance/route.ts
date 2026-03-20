import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Fetch attendance records
export async function GET(request: Request) {
  try {
    console.log('📨 GET /api/attendance - Fetching attendance records');
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');
    
    // Build where clause
    const where: any = {};
    
    if (date) {
      where.date = date;
    }
    
    if (employeeId) {
      where.employeeId = employeeId;
    }
    
    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true,
            contract: true,
            image: true
          }
        }
      }
    });
    
    console.log(`✅ Found ${attendance.length} attendance records`);
    return NextResponse.json(attendance);
  } catch (error: any) {
    console.error('❌ Error fetching attendance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch attendance records', 
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// POST - Create or update attendance record
export async function POST(request: Request) {
  try {
    console.log('📨 POST /api/attendance - Creating/updating attendance');
    
    const body = await request.json();
    console.log('📦 Request data:', body);
    
    // Validate required fields
    if (!body.employeeId || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId and date' },
        { status: 400 }
      );
    }
    
    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    // Check if the employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: body.employeeId }
    });
    
    if (!employee) {
      return NextResponse.json(
        { error: `Employee with ID ${body.employeeId} not found` },
        { status: 404 }
      );
    }
    
    // Check if attendance record already exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: body.employeeId,
          date: body.date
        }
      }
    });
    
    let attendanceRecord;
    
    if (existingAttendance) {
      // Update existing record
      attendanceRecord = await prisma.attendance.update({
        where: {
          employeeId_date: {
            employeeId: body.employeeId,
            date: body.date
          }
        },
        data: {
          status: body.status || existingAttendance.status,
          clockInTime: body.clockInTime ? new Date(body.clockInTime) : existingAttendance.clockInTime,
          clockOutTime: body.clockOutTime ? new Date(body.clockOutTime) : existingAttendance.clockOutTime,
          designation: body.designation || existingAttendance.designation,
          updatedAt: new Date()
        }
      });
      console.log('✅ Attendance record updated:', attendanceRecord.id);
    } else {
      // Create new record
      attendanceRecord = await prisma.attendance.create({
        data: {
          employeeId: body.employeeId,
          date: body.date,
          status: body.status || 'Absent',
          clockInTime: body.clockInTime ? new Date(body.clockInTime) : null,
          clockOutTime: body.clockOutTime ? new Date(body.clockOutTime) : null,
          designation: body.designation || null
        }
      });
      console.log('✅ Attendance record created:', attendanceRecord.id);
    }
    
    return NextResponse.json(attendanceRecord, { status: existingAttendance ? 200 : 201 });
    
  } catch (error: any) {
    console.error('❌ Error creating/updating attendance:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Attendance record already exists for this employee and date' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid employee ID. Employee does not exist.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to save attendance record', 
        details: error.message,
        code: error.code,
        suggestion: 'Make sure the employee exists and date format is YYYY-MM-DD'
      },
      { status: 500 }
    );
  }
}

// PUT - Update attendance record
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing attendance record ID' },
        { status: 400 }
      );
    }
    
    console.log(`📨 PUT /api/attendance?id=${id} - Updating attendance`);
    
    const body = await request.json();
    console.log('📦 Update data:', body);
    
    // Check if record exists
    const existingRecord = await prisma.attendance.findUnique({
      where: { id }
    });
    
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }
    
    const attendanceRecord = await prisma.attendance.update({
      where: { id },
      data: {
        status: body.status || existingRecord.status,
        clockInTime: body.clockInTime ? new Date(body.clockInTime) : existingRecord.clockInTime,
        clockOutTime: body.clockOutTime ? new Date(body.clockOutTime) : existingRecord.clockOutTime,
        designation: body.designation || existingRecord.designation,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Attendance record updated:', attendanceRecord.id);
    return NextResponse.json(attendanceRecord);
  } catch (error: any) {
    console.error('❌ Error updating attendance:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update attendance record', 
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendance record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing attendance record ID' },
        { status: 400 }
      );
    }
    
    await prisma.attendance.delete({
      where: { id }
    });
    
    console.log('✅ Attendance record deleted:', id);
    return NextResponse.json({ success: true, message: 'Attendance record deleted' });
  } catch (error: any) {
    console.error('❌ Error deleting attendance:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete attendance record', 
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
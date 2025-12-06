import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Valid status values for visitors
const VALID_STATUSES = [
  'Pre-registered',
  'Checked-in',
  'Pending Exit',
  'Checked-out'
];

// Helper to clean and validate inputs
function cleanString(input: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed;
}

function isValidStatus(status: string | null): boolean {
  if (!status) return false;
  return VALID_STATUSES.includes(status);
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching visitors...');
    
    const { searchParams } = new URL(request.url);
    
    // Get and clean parameters
    const status = cleanString(searchParams.get('status'));
    const vehiclePlate = cleanString(searchParams.get('vehiclePlate'));
    const visitorType = cleanString(searchParams.get('visitorType'));
    const fromDate = cleanString(searchParams.get('fromDate'));
    const toDate = cleanString(searchParams.get('toDate'));

    console.log('🔍 Cleaned params:', { status, vehiclePlate, visitorType, fromDate, toDate });

    // Build where clause
    const whereConditions: any[] = [];

    // Handle status - ONLY add if it's a valid status
    if (status && isValidStatus(status)) {
      whereConditions.push({ status });
      console.log(`✅ Adding status filter: ${status}`);
    } else if (status) {
      console.log(`⚠️ Skipping invalid status: "${status}"`);
    }

    // Handle vehicle plate search
    if (vehiclePlate) {
      whereConditions.push({
        vehicle_plate: {
          contains: vehiclePlate,
          mode: 'insensitive' as const
        }
      });
      console.log(`✅ Adding vehicle plate filter: ${vehiclePlate}`);
    }

    // Handle visitor type (visitor/supplier)
    if (visitorType) {
      whereConditions.push({
        visitor_type: visitorType
      });
      console.log(`✅ Adding visitor type filter: ${visitorType}`);
    }

    // Handle dates - filtering by created_at
    if (fromDate || toDate) {
      const dateCondition: any = {};
      
      if (fromDate) {
        try {
          dateCondition.gte = new Date(fromDate);
          console.log(`✅ Adding fromDate: ${fromDate}`);
        } catch (e) {
          console.error('Invalid fromDate:', fromDate);
        }
      }
      
      if (toDate) {
        try {
          // Add one day to include the end date
          const toDateObj = new Date(toDate);
          toDateObj.setDate(toDateObj.getDate() + 1);
          dateCondition.lte = toDateObj;
          console.log(`✅ Adding toDate: ${toDate}`);
        } catch (e) {
          console.error('Invalid toDate:', toDate);
        }
      }
      
      if (Object.keys(dateCondition).length > 0) {
        whereConditions.push({ created_at: dateCondition });
      }
    }

    // Build final where object
    const where = whereConditions.length > 0 
      ? { AND: whereConditions }
      : {}; // Empty object = no filters

    console.log('🔍 Final WHERE clause for visitors:', JSON.stringify(where, null, 2));

    // Query visitors
    let visitors;
    try {
      visitors = await prisma.visitors.findMany({
        where,
        orderBy: { created_at: 'desc' },
      });
    } catch (prismaError: any) {
      console.error('❌ Prisma query failed:', prismaError.message);
      console.error('❌ Query that failed:', JSON.stringify(where, null, 2));
      
      // Fallback: Try without any filters
      console.log('🔄 Trying fallback query without filters...');
      visitors = await prisma.visitors.findMany({
        orderBy: { created_at: 'desc' },
      });
    }

    console.log(`✅ Found ${visitors.length} visitor(s)`);

    // Convert dates to ISO strings
    const serializedVisitors = visitors.map(visitor => ({
      id: visitor.id,
      visitor_code: visitor.visitor_code,
      name: visitor.name,
      id_number: visitor.id_number,
      company: visitor.company,
      email: visitor.email,
      phone: visitor.phone,
      vehicle_plate: visitor.vehicle_plate,
      vehicle_type: visitor.vehicle_type,
      cargo_description: visitor.cargo_description,
      visitor_type: visitor.visitor_type,
      status: visitor.status,
      check_in_time: visitor.check_in_time?.toISOString() || null,
      check_out_time: visitor.check_out_time?.toISOString() || null,
      expected_check_in_time: visitor.expected_check_in_time?.toISOString() || null,
      host_id: visitor.host_id,
      department: visitor.department,
      created_at: visitor.created_at.toISOString(),
    }));

    return NextResponse.json(serializedVisitors);
    
  } catch (error: any) {
    console.error('❌ Top-level API error:', error.message);
    
    // Return empty array on error
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Received visitor data:', body);
    
    // Validate required fields
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Name and phone are required fields' },
        { status: 400 }
      );
    }
    
    // Generate visitor code if not provided
    const visitorCode = body.visitor_code || `VIST-${Math.floor(Math.random() * 9000) + 1000}`;
    
    const newVisitor = await prisma.visitors.create({
      data: {
        id: `vis-${Date.now()}`,
        visitor_code: visitorCode,
        name: body.name || '',
        id_number: body.id_number || '',
        company: body.company || '',
        email: body.email || '',
        phone: body.phone || '',
        vehicle_plate: body.vehicle_plate || '',
        vehicle_type: body.vehicle_type || 'N/A',
        cargo_description: body.cargo_description || '',
        visitor_type: body.visitor_type || 'visitor',
        status: body.status || 'Pre-registered',
        check_in_time: body.check_in_time ? new Date(body.check_in_time) : null,
        check_out_time: body.check_out_time ? new Date(body.check_out_time) : null,
        expected_check_in_time: body.expected_check_in_time ? new Date(body.expected_check_in_time) : null,
        host_id: body.host_id || '',
        department: body.department || '',
      }
    });

    console.log('✅ Created visitor:', newVisitor);

    return NextResponse.json(newVisitor, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating visitor:', error);
    return NextResponse.json(
      { error: 'Failed to create visitor', details: error.message },
      { status: 500 }
    );
  }
}
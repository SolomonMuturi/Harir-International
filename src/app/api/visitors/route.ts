import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, ['suppliers.visitors', 'admin.settings']);
  if (auth.error) return auth.error;
  try {
    const visitors = await prisma.visitors.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`✅ Found ${visitors.length} visitors in database`);
    return NextResponse.json(visitors);
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch visitors', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, ['suppliers.visitors']);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    console.log('📥 POST received:', body);
    
    // Generate visitor code
    const visitorCode = `VIST-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Create visitor in database using Prisma
    const newVisitor = await prisma.visitors.create({
      data: {
        visitor_code: visitorCode,
        name: body.name || '',
        phone: body.phone || '',
        vehicle_plate: body.vehicle_plate || '',
        id_number: body.id_number || '',
        email: body.email || '',
        company: body.company || '',
        vehicle_type: body.vehicle_type || '',
        cargo_description: body.cargo_description || '',
        visitor_type: body.visitor_type || 'visitor',
        status: body.status || 'Pre-registered',
        expected_check_in_time: body.expected_check_in_time ? new Date(body.expected_check_in_time) : new Date(),
        host_id: body.host_id || '',
        department: body.department || '',
      }
    });
    
    console.log('✅ Created in database:', newVisitor);
    return NextResponse.json(newVisitor, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    
    // Return specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Visitor with this ID number or visitor code already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create visitor', 
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, ['suppliers.visitors']);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID required' },
        { status: 400 }
      );
    }
    
    // Update visitor in database
    const updatedVisitor = await prisma.visitors.update({
      where: { id },
      data: {
        status: body.status,
        check_in_time: body.check_in_time ? new Date(body.check_in_time) : undefined,
        check_out_time: body.check_out_time ? new Date(body.check_out_time) : undefined,
        vehicle_plate: body.vehicle_plate,
        vehicle_type: body.vehicle_type,
        cargo_description: body.cargo_description
      }
    });
    
    console.log('✅ Updated in database:', updatedVisitor);
    return NextResponse.json(updatedVisitor);
    
  } catch (error: any) {
    console.error('❌ Update error:', error.message);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Visitor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Update failed', details: error.message },
      { status: 500 }
    );
  }
}
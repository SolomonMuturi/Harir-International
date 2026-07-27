// app/api/vehicle-visits/route.ts
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, format } from 'date-fns'

function generateTinyId(): string {
  return `v${Date.now().toString(36)}${Math.random().toString(36).substr(2, 3)}`
}

async function generateGateEntryId(prisma: any, isRecheckIn: boolean = false): Promise<{
  gateEntryId: string;
  gateEntryNumber: number;
  gateEntryDate: string;
}> {
  const now = new Date();
  const dateStr = format(now, 'yyyyMMdd');
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const todayCheckIns = await prisma.vehicle_visits.count({
    where: {
      check_in_time: {
        gte: todayStart,
        lte: todayEnd
      },
      status: {
        in: ['Checked-in', 'Pending Exit', 'Checked-out']
      }
    }
  });

  const entryNumber = todayCheckIns + 1;
  const paddedNumber = entryNumber.toString().padStart(4, '0');
  const prefix = isRecheckIn ? 'RGT' : 'GATE';
  const gateEntryId = `${prefix}-${dateStr}-${paddedNumber}`;

  return {
    gateEntryId,
    gateEntryNumber: entryNumber,
    gateEntryDate: dateStr
  };
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('0')) return '+254' + cleaned.slice(1)
  if (cleaned.length === 9) return '+254' + cleaned
  if (cleaned.length === 10 && cleaned.startsWith('07')) return '+254' + cleaned.slice(1)
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned
}

export async function GET(request: NextRequest) {
  try {
    console.log('📨 GET /api/vehicle-visits - Fetching vehicle visits')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const vehiclePlate = searchParams.get('vehiclePlate')
    const active = searchParams.get('active') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const gateEntryId = searchParams.get('gateEntryId')
    const gateEntryDate = searchParams.get('gateEntryDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (id) {
      const visit = await prisma.vehicle_visits.findUnique({
        where: { id },
        include: { weight_entry: true }
      })
      
      if (!visit) {
        return NextResponse.json(
          { error: 'Vehicle visit not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(visit)
    }

    const whereClause: any = {}
    
    if (status) whereClause.status = status
    if (vehiclePlate) whereClause.vehicle_plate = { contains: vehiclePlate }
    if (active) whereClause.status = { in: ['Pre-registered', 'Checked-in'] }
    if (startDate && endDate) {
      whereClause.registered_at = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate))
      }
    }
    if (gateEntryId) whereClause.gate_entry_id = gateEntryId
    if (gateEntryDate) whereClause.gate_entry_date = gateEntryDate

    const [visits, totalCount] = await Promise.all([
      prisma.vehicle_visits.findMany({
        where: whereClause,
        include: { weight_entry: true },
        orderBy: { registered_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.vehicle_visits.count({ where: whereClause })
    ])

    const today = format(new Date(), 'yyyyMMdd');
    const todayGateEntries = await prisma.vehicle_visits.count({
      where: {
        gate_entry_date: today,
        check_in_time: { not: null }
      }
    });

    console.log(`✅ Found ${visits.length} vehicle visits`)

    return NextResponse.json({
      visits,
      stats: { todayGateEntries },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error: any) {
    console.error('❌ Error in GET /api/vehicle-visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicle visits', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST /api/vehicle-visits - Creating new vehicle visit')
    
    const body = await request.json()
    console.log('📦 Request data:', body)

    const {
      company_name,
      contact_phone,
      vehicle_plate,
      vehicle_type,
      driver_name,
      driver_id_number,
      cargo_description,
      fruit_varieties,
      region,
      location
    } = body

    // Get the latest visit number for this vehicle plate
    const latestVisit = await prisma.vehicle_visits.findFirst({
      where: { vehicle_plate: vehicle_plate },
      orderBy: { visit_number: 'desc' }
    });

    const visitNumber = latestVisit ? latestVisit.visit_number + 1 : 1;

    const formattedPhone = contact_phone ? formatPhoneNumber(contact_phone) : null;

    const newVisit = await prisma.vehicle_visits.create({
      data: {
        id: generateTinyId(),
        visit_number: visitNumber,
        company_name: company_name || driver_name || 'Unknown',
        contact_phone: formattedPhone,
        vehicle_plate: vehicle_plate || null,
        vehicle_type: vehicle_type || 'Truck',
        driver_name: driver_name || null,
        driver_id_number: driver_id_number || null,
        cargo_description: cargo_description || 'Avocado Delivery',
        fruit_varieties: fruit_varieties ? JSON.stringify(fruit_varieties) : null,
        region: region || null,
        location: location || 'Gate Registration',
        status: 'Pre-registered',
        registered_at: new Date(),
        gate_entry_id: null,
        gate_entry_number: null,
        gate_entry_date: null,
        is_recheck_in: false,
        previous_gate_entry_id: null
      }
    })

    console.log(`✅ Vehicle visit created: #${newVisit.visit_number}`)

    return NextResponse.json({
      success: true,
      visit: newVisit,
      message: `Visit #${visitNumber} created successfully`
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error creating vehicle visit:', error)
    return NextResponse.json(
      { error: 'Failed to create vehicle visit', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Visit ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log(`📨 PUT /api/vehicle-visits?id=${id} - Updating visit`, body)

    const {
      status,
      checkInTime,
      checkOutTime,
      cargo_description,
      fruit_varieties,
      region,
      weight_entry_id
    } = body

    const existingVisit = await prisma.vehicle_visits.findUnique({
      where: { id }
    })

    if (!existingVisit) {
      return NextResponse.json(
        { error: 'Vehicle visit not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (status) updateData.status = status
    
    if ((status === 'Checked-in' || checkInTime) && !existingVisit.check_in_time) {
      const checkInDateTime = checkInTime ? new Date(checkInTime) : new Date();
      const isRecheckIn = existingVisit.status === 'Checked-out' || existingVisit.check_out_time !== null;
      
      const gateEntry = await generateGateEntryId(prisma, isRecheckIn);
      
      updateData.check_in_time = checkInDateTime;
      updateData.gate_entry_id = gateEntry.gateEntryId;
      updateData.gate_entry_number = gateEntry.gateEntryNumber;
      updateData.gate_entry_date = gateEntry.gateEntryDate;
      updateData.is_recheck_in = isRecheckIn;
      
      if (isRecheckIn && existingVisit.gate_entry_id) {
        updateData.previous_gate_entry_id = existingVisit.gate_entry_id;
      }
    } else if (checkInTime) {
      updateData.check_in_time = new Date(checkInTime);
    }
    
    if (status === 'Checked-out' || checkOutTime) {
      updateData.check_out_time = checkOutTime ? new Date(checkOutTime) : new Date();
    }
    
    if (cargo_description !== undefined) updateData.cargo_description = cargo_description
    if (fruit_varieties !== undefined) updateData.fruit_varieties = JSON.stringify(fruit_varieties)
    if (region !== undefined) updateData.region = region
    if (weight_entry_id !== undefined) updateData.weight_entry_id = weight_entry_id

    const updatedVisit = await prisma.vehicle_visits.update({
      where: { id },
      data: updateData,
      include: { weight_entry: true }
    })

    console.log(`✅ Vehicle visit updated: ${updatedVisit.id}`)
    
    let message = `Visit status updated to ${status}`;
    if (updatedVisit.gate_entry_id) {
      message = updatedVisit.is_recheck_in 
        ? `Vehicle rechecked in with Gate ID: ${updatedVisit.gate_entry_id}`
        : `Vehicle checked in with Gate ID: ${updatedVisit.gate_entry_id}`;
    }

    return NextResponse.json({
      success: true,
      visit: updatedVisit,
      message
    })

  } catch (error: any) {
    console.error('❌ Error updating vehicle visit:', error)
    return NextResponse.json(
      { error: 'Failed to update vehicle visit', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Visit ID is required' },
        { status: 400 }
      )
    }

    const existingVisit = await prisma.vehicle_visits.findUnique({
      where: { id }
    })

    if (!existingVisit) {
      return NextResponse.json(
        { error: 'Vehicle visit not found' },
        { status: 404 }
      )
    }

    await prisma.vehicle_visits.delete({
      where: { id }
    })

    console.log(`✅ Vehicle visit deleted: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Vehicle visit deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error deleting vehicle visit:', error)
    return NextResponse.json(
      { error: 'Failed to delete vehicle visit', details: error.message },
      { status: 500 }
    )
  }
}
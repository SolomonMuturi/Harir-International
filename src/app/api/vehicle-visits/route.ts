// app/api/vehicle-visits/route.ts
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, format } from 'date-fns'

// Helper function to generate tiny ID
function generateTinyId(): string {
  return `v${Date.now().toString(36)}${Math.random().toString(36).substr(2, 3)}`
}

// Helper function to generate gate entry ID
async function generateGateEntryId(prisma: any, isRecheckIn: boolean = false): Promise<{
  gateEntryId: string;
  gateEntryNumber: number;
  gateEntryDate: string;
}> {
  const now = new Date();
  const dateStr = format(now, 'yyyyMMdd');
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Count today's check-ins (including recheck-ins)
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
  const prefix = isRecheckIn ? 'RGT' : 'GATE'; // RGT for Re-Gate, GATE for first check-in
  const gateEntryId = `${prefix}-${dateStr}-${paddedNumber}`;

  return {
    gateEntryId,
    gateEntryNumber: entryNumber,
    gateEntryDate: dateStr
  };
}

// Helper function to format phone number
function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  if (cleaned.startsWith('0')) {
    return '+254' + cleaned.slice(1)
  }
  
  if (cleaned.length === 9) {
    return '+254' + cleaned
  }
  
  if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return '+254' + cleaned.slice(1)
  }
  
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned
}

// GET /api/vehicle-visits
export async function GET(request: NextRequest) {
  try {
    console.log('📨 GET /api/vehicle-visits - Fetching vehicle visits')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const vehiclePlate = searchParams.get('vehiclePlate')
    const active = searchParams.get('active') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeSupplier = searchParams.get('includeSupplier') === 'true'
    const gateEntryId = searchParams.get('gateEntryId') // New: filter by gate entry ID
    const gateEntryDate = searchParams.get('gateEntryDate') // New: filter by gate entry date
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Get single visit by ID
    if (id) {
      const visit = await prisma.vehicle_visits.findUnique({
        where: { id },
        include: {
          supplier: includeSupplier,
          weight_entry: true
        }
      })
      
      if (!visit) {
        return NextResponse.json(
          { error: 'Vehicle visit not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(visit)
    }

    // Build where clause
    const whereClause: any = {}
    
    if (supplierId) {
      whereClause.supplier_id = supplierId
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (vehiclePlate) {
      whereClause.vehicle_plate = {
        contains: vehiclePlate
      }
    }
    
    if (active) {
      whereClause.status = {
        in: ['Pre-registered', 'Checked-in']
      }
    }
    
    if (startDate && endDate) {
      whereClause.registered_at = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate))
      }
    }

    // New: Gate entry filters
    if (gateEntryId) {
      whereClause.gate_entry_id = gateEntryId
    }
    
    if (gateEntryDate) {
      whereClause.gate_entry_date = gateEntryDate
    }

    // Get visits with pagination
    const [visits, totalCount] = await Promise.all([
      prisma.vehicle_visits.findMany({
        where: whereClause,
        include: {
          supplier: includeSupplier,
          weight_entry: true
        },
        orderBy: {
          registered_at: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.vehicle_visits.count({ where: whereClause })
    ])

    // Get today's gate entry stats
    const today = format(new Date(), 'yyyyMMdd');
    const todayGateEntries = await prisma.vehicle_visits.count({
      where: {
        gate_entry_date: today,
        check_in_time: {
          not: null
        }
      }
    });

    console.log(`✅ Found ${visits.length} vehicle visits`)

    return NextResponse.json({
      visits,
      stats: {
        todayGateEntries
      },
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

// POST /api/vehicle-visits
export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST /api/vehicle-visits - Creating new vehicle visit')
    
    const body = await request.json()
    console.log('📦 Request data:', body)

    const {
      supplierId,           // If existing supplier
      name,                 // For new supplier
      contact_name,
      contact_phone,
      vehicle_number_plate,
      vehicle_type,
      driver_name,
      driver_id_number,
      cargo_description,
      fruit_varieties,
      region,
      supplier_code,
      location
    } = body

    let supplier
    let isNewSupplier = false
    let visitNumber = 1

    // Case 1: Supplier ID provided (existing supplier)
    if (supplierId) {
      supplier = await prisma.suppliers.findUnique({
        where: { id: supplierId },
        include: { visits: true }
      })

      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        )
      }

      // Calculate next visit number
      visitNumber = (supplier.visits?.length || 0) + 1
      isNewSupplier = false
    } 
    // Case 2: Create new supplier first
    else if (name && contact_phone) {
      // Format phone number
      const formattedPhone = formatPhoneNumber(contact_phone)
      
      // Check if supplier already exists by phone
      const existingSupplier = await prisma.suppliers.findFirst({
        where: {
          OR: [
            { contact_phone: formattedPhone },
            { vehicle_number_plate: vehicle_number_plate }
          ]
        },
        include: { visits: true }
      })

      if (existingSupplier) {
        // Use existing supplier
        supplier = existingSupplier
        visitNumber = (supplier.visits?.length || 0) + 1
        isNewSupplier = false
        
        console.log(`✅ Using existing supplier: ${supplier.name} (Visit #${visitNumber})`)
      } else {
        // Create new supplier
        const newSupplierData = {
          id: generateTinyId(),
          name: name.trim(),
          location: location?.trim() || 'Gate Registration',
          contact_name: contact_name?.trim() || name.trim(),
          contact_phone: formattedPhone,
          produce_types: JSON.stringify(fruit_varieties ? [fruit_varieties] : ['Avocado Delivery']),
          status: 'Active',
          logo_url: `https://avatar.vercel.sh/${encodeURIComponent(name)}.png`,
          active_contracts: 0,
          supplier_code: supplier_code || `SUP-${Date.now().toString(36).toUpperCase()}`,
          vehicle_number_plate: vehicle_number_plate?.trim() || null,
          vehicle_type: vehicle_type || 'Truck',
          driver_name: driver_name?.trim() || contact_name?.trim() || name.trim(),
          driver_id_number: driver_id_number?.trim() || null,
          vehicle_status: 'Pre-registered'
        }

        supplier = await prisma.suppliers.create({
          data: newSupplierData
        })
        
        visitNumber = 1
        isNewSupplier = true
        console.log(`✅ Created new supplier: ${supplier.name}`)
      }
    } else {
      // Create a blank supplier
      const blankSupplierData = {
        id: generateTinyId(),
        name: '',
        location: '',
        contact_name: '',
        contact_phone: '',
        produce_types: JSON.stringify(['']),
        status: 'Active',
        logo_url: '',
        active_contracts: 0,
        supplier_code: '',
        vehicle_number_plate: '',
        vehicle_type: '',
        driver_name: '',
        driver_id_number: '',
        vehicle_status: 'Pre-registered'
      };
      supplier = await prisma.suppliers.create({ data: blankSupplierData });
      visitNumber = 1;
      isNewSupplier = true;
      console.log('✅ Created blank supplier for vehicle visit');
    }

    // Create the vehicle visit (without gate entry ID initially - will be set on check-in)
    const newVisit = await prisma.vehicle_visits.create({
      data: {
        id: generateTinyId(),
        supplier_id: supplier.id,
        visit_number: visitNumber,
        vehicle_plate: vehicle_number_plate || supplier.vehicle_number_plate,
        driver_name: driver_name || supplier.driver_name || supplier.contact_name,
        driver_id_number: driver_id_number || supplier.driver_id_number,
        cargo_description: cargo_description || supplier.cargo_description || 'Avocado Delivery',
        fruit_varieties: fruit_varieties ? JSON.stringify(fruit_varieties) : supplier.produce_types,
        region: region || null,
        status: 'Pre-registered',
        registered_at: new Date(),
        // Gate entry fields (null initially)
        gate_entry_id: null,
        gate_entry_number: null,
        gate_entry_date: null,
        is_recheck_in: false,
        previous_gate_entry_id: null
      },
      include: {
        supplier: true
      }
    })

    console.log(`✅ Vehicle visit created: #${newVisit.visit_number} for ${supplier.name}`)

    return NextResponse.json({
      success: true,
      visit: newVisit,
      supplier,
      isNewSupplier,
      message: isNewSupplier 
        ? `New supplier registered with visit #${visitNumber}`
        : `Returning supplier - Visit #${visitNumber} created`
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error creating vehicle visit:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This visit already exists. Please try again.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create vehicle visit', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/vehicle-visits
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

    // Check if visit exists
    const existingVisit = await prisma.vehicle_visits.findUnique({
      where: { id },
      include: { supplier: true }
    })

    if (!existingVisit) {
      return NextResponse.json(
        { error: 'Vehicle visit not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }
    
    // Handle check-in (including recheck-in) - GENERATE GATE ENTRY ID
    if ((status === 'Checked-in' || checkInTime) && !existingVisit.check_in_time) {
      const checkInDateTime = checkInTime ? new Date(checkInTime) : new Date();
      const isRecheckIn = existingVisit.status === 'Checked-out' || 
                          existingVisit.check_out_time !== null;
      
      // Generate gate entry ID
      const gateEntry = await generateGateEntryId(prisma, isRecheckIn);
      
      updateData.check_in_time = checkInDateTime;
      updateData.gate_entry_id = gateEntry.gateEntryId;
      updateData.gate_entry_number = gateEntry.gateEntryNumber;
      updateData.gate_entry_date = gateEntry.gateEntryDate;
      updateData.is_recheck_in = isRecheckIn;
      
      // Store previous gate entry if this is a recheck-in
      if (isRecheckIn && existingVisit.gate_entry_id) {
        updateData.previous_gate_entry_id = existingVisit.gate_entry_id;
      }
    } else if (checkInTime) {
      // Manual check-in time override (rare case)
      updateData.check_in_time = new Date(checkInTime);
    }
    
    // Handle check-out
    if (status === 'Checked-out' || checkOutTime) {
      updateData.check_out_time = checkOutTime ? new Date(checkOutTime) : new Date();
    }
    
    // Handle pending exit
    if (status === 'Pending Exit') {
      // Just update status, keep gate entry info
    }
    
    if (cargo_description !== undefined) {
      updateData.cargo_description = cargo_description
    }
    
    if (fruit_varieties !== undefined) {
      updateData.fruit_varieties = JSON.stringify(fruit_varieties)
    }
    
    if (region !== undefined) {
      updateData.region = region
    }
    
    if (weight_entry_id !== undefined) {
      updateData.weight_entry_id = weight_entry_id
    }

    // Update the visit
    const updatedVisit = await prisma.vehicle_visits.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        weight_entry: true
      }
    })

    // Also update supplier's vehicle status if needed
    if (status === 'Checked-in' || status === 'Checked-out') {
      await prisma.suppliers.update({
        where: { id: existingVisit.supplier_id },
        data: {
          vehicle_status: status,
          vehicle_check_in_time: status === 'Checked-in' ? new Date() : existingVisit.supplier.vehicle_check_in_time,
          vehicle_check_out_time: status === 'Checked-out' ? new Date() : existingVisit.supplier.vehicle_check_out_time
        }
      })
    }

    console.log(`✅ Vehicle visit updated: ${updatedVisit.id}`)
    
    // Add gate entry info to response message
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

// DELETE /api/vehicle-visits
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

    // Check if visit exists
    const existingVisit = await prisma.vehicle_visits.findUnique({
      where: { id }
    })

    if (!existingVisit) {
      return NextResponse.json(
        { error: 'Vehicle visit not found' },
        { status: 404 }
      )
    }

    // Delete the visit
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

// GET /api/vehicle-visits/stats
export async function getStats(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    
    const whereClause: any = {}
    if (supplierId) {
      whereClause.supplier_id = supplierId
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [
      totalVisits,
      activeVisits,
      todayVisits,
      todayGateEntries,
      supplierStats
    ] = await Promise.all([
      prisma.vehicle_visits.count({ where: whereClause }),
      prisma.vehicle_visits.count({
        where: {
          ...whereClause,
          status: { in: ['Pre-registered', 'Checked-in'] }
        }
      }),
      prisma.vehicle_visits.count({
        where: {
          ...whereClause,
          registered_at: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      }),
      prisma.vehicle_visits.count({
        where: {
          ...whereClause,
          check_in_time: {
            gte: todayStart,
            lte: todayEnd
          },
          gate_entry_id: {
            not: null
          }
        }
      }),
      prisma.vehicle_visits.groupBy({
        by: ['supplier_id'],
        where: whereClause,
        _count: true,
        orderBy: {
          _count: {
            supplier_id: 'desc'
          }
        },
        take: 5
      })
    ])

    return NextResponse.json({
      totalVisits,
      activeVisits,
      todayVisits,
      todayGateEntries,
      topSuppliers: supplierStats
    })

  } catch (error: any) {
    console.error('❌ Error fetching visit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Generate shorter, database-friendly ID
function generateCarrierId() {
  // Format: c + timestamp (last 9 digits) + random (4 digits)
  // Total: 1 + 9 + 4 = 14 characters (safe for VARCHAR(20))
  const timestamp = Date.now().toString().slice(-9);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `c${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/carriers');
    
    const body = await request.json();
    console.log('📦 Received data:', body);
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Carrier name is required'
      }, { status: 400 });
    }
    
    // Generate SHORT ID (14 characters max)
    let id = generateCarrierId();
    console.log('🆔 Generated ID:', id, 'Length:', id.length);
    
    // Check if ID already exists (unlikely but possible)
    let existingId = await prisma.$queryRaw`
      SELECT id FROM carriers WHERE id = ${id}
    `;
    
    // Regenerate if collision occurs (max 3 attempts)
    let attempts = 0;
    while (Array.isArray(existingId) && existingId.length > 0 && attempts < 3) {
      id = generateCarrierId();
      existingId = await prisma.$queryRaw`
        SELECT id FROM carriers WHERE id = ${id}
      `;
      attempts++;
    }
    
    // Check if carrier name already exists
    const existingCarrier = await prisma.$queryRaw`
      SELECT id FROM carriers WHERE name = ${body.name.trim()}
    `;
    
    if (Array.isArray(existingCarrier) && existingCarrier.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'A carrier with this name already exists'
      }, { status: 400 });
    }
    
    // Insert using raw SQL
    await prisma.$executeRaw`
      INSERT INTO carriers (
        id, name, contact_name, contact_email, contact_phone,
        rating, status, id_number, vehicle_registration,
        created_at, updated_at
      ) VALUES (
        ${id},
        ${body.name.trim()},
        ${body.contact_name?.trim() || null},
        ${body.contact_email?.trim() || null},
        ${body.contact_phone?.trim() || null},
        ${body.rating ? parseFloat(body.rating.toString()) : 0},
        ${body.status || 'Active'},
        ${body.id_number?.trim() || null},
        ${body.vehicle_registration?.trim() || null},
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ SQL insert successful');
    
    // Fetch the created carrier with shipment count
    const newCarrier = await prisma.$queryRaw`
      SELECT 
        c.*,
        COALESCE(COUNT(s.id), 0) as shipment_count
      FROM carriers c
      LEFT JOIN shipments s ON c.id = s.carrier_id
      WHERE c.id = ${id}
      GROUP BY c.id
    `;
    
    console.log('🔍 Retrieved carrier:', newCarrier);
    
    if (!Array.isArray(newCarrier) || newCarrier.length === 0) {
      // Return a fallback response
      return NextResponse.json({
        success: true,
        data: {
          id,
          name: body.name.trim(),
          contact_name: body.contact_name?.trim() || null,
          contact_email: body.contact_email?.trim() || null,
          contact_phone: body.contact_phone?.trim() || null,
          rating: body.rating ? parseFloat(body.rating.toString()) : 0,
          status: body.status || 'Active',
          id_number: body.id_number?.trim() || null,
          vehicle_registration: body.vehicle_registration?.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _count: { shipments: 0 }
        },
        message: 'Carrier created successfully'
      }, { status: 201 });
    }
    
    // Format the carrier data
    const carrier = newCarrier[0];
    const formattedCarrier = {
      id: carrier.id,
      name: carrier.name,
      contact_name: carrier.contact_name,
      contact_email: carrier.contact_email,
      contact_phone: carrier.contact_phone,
      rating: Number(carrier.rating) || 0,
      status: carrier.status,
      id_number: carrier.id_number,
      vehicle_registration: carrier.vehicle_registration,
      created_at: carrier.created_at,
      updated_at: carrier.updated_at,
      _count: {
        shipments: Number(carrier.shipment_count) || 0
      }
    };
    
    return NextResponse.json({
      success: true,
      data: formattedCarrier,
      message: 'Carrier created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ POST Error:', error.message);
    
    // Handle specific errors
    if (error.message.includes('Data too long for column')) {
      return NextResponse.json({
        success: false,
        error: 'Database field length exceeded. Please use shorter values.'
      }, { status: 400 });
    }
    
    if (error.message.includes('Duplicate entry') || error.message.includes('ER_DUP_ENTRY')) {
      return NextResponse.json({
        success: false,
        error: 'A carrier with this name already exists'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create carrier: ' + error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📡 GET /api/carriers');
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const id = searchParams.get('id');
    
    // Handle single carrier request by ID
    if (id) {
      const carrier = await prisma.$queryRaw`
        SELECT 
          c.*,
          COALESCE(COUNT(s.id), 0) as shipment_count
        FROM carriers c
        LEFT JOIN shipments s ON c.id = s.carrier_id
        WHERE c.id = ${id}
        GROUP BY c.id
      `;
      
      if (!Array.isArray(carrier) || carrier.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Carrier not found'
        }, { status: 404 });
      }
      
      const carrierData = carrier[0];
      const formattedCarrier = {
        id: carrierData.id,
        name: carrierData.name,
        contact_name: carrierData.contact_name,
        contact_email: carrierData.contact_email,
        contact_phone: carrierData.contact_phone,
        rating: Number(carrierData.rating) || 0,
        status: carrierData.status,
        id_number: carrierData.id_number,
        vehicle_registration: carrierData.vehicle_registration,
        created_at: carrierData.created_at,
        updated_at: carrierData.updated_at,
        _count: {
          shipments: Number(carrierData.shipment_count) || 0
        }
      };
      
      return NextResponse.json({
        success: true,
        data: formattedCarrier
      });
    }
    
    // Handle multiple carriers request
    let sql = `
      SELECT 
        c.*,
        COALESCE(COUNT(s.id), 0) as shipment_count
      FROM carriers c
      LEFT JOIN shipments s ON c.id = s.carrier_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (status && status !== 'All') {
      conditions.push('c.status = ?');
      params.push(status);
    }
    
    if (search && search.trim()) {
      conditions.push('(c.name LIKE ? OR c.contact_name LIKE ? OR c.contact_phone LIKE ? OR c.id_number LIKE ?)');
      const likeTerm = `%${search.trim()}%`;
      params.push(likeTerm, likeTerm, likeTerm, likeTerm);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY c.id ORDER BY c.created_at DESC';
    
    const carriers = await prisma.$queryRawUnsafe(sql, ...params);
    
    // Format the response
    const formattedCarriers = Array.isArray(carriers) ? carriers.map(carrier => ({
      id: carrier.id,
      name: carrier.name,
      contact_name: carrier.contact_name,
      contact_email: carrier.contact_email,
      contact_phone: carrier.contact_phone,
      rating: Number(carrier.rating) || 0,
      status: carrier.status,
      id_number: carrier.id_number,
      vehicle_registration: carrier.vehicle_registration,
      created_at: carrier.created_at,
      updated_at: carrier.updated_at,
      _count: {
        shipments: Number(carrier.shipment_count) || 0
      }
    })) : [];
    
    console.log(`✅ Found ${formattedCarriers.length} carriers`);
    
    return NextResponse.json({
      success: true,
      data: formattedCarriers,
      count: formattedCarriers.length
    });
    
  } catch (error: any) {
    console.error('❌ GET Error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch carriers'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Carrier ID is required'
      }, { status: 400 });
    }
    
    console.log(`🗑️ DELETE /api/carriers?id=${id}`);
    
    // Check if carrier exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM carriers WHERE id = ${id}
    `;
    
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Carrier not found'
      }, { status: 404 });
    }
    
    // First, check if carrier has shipments
    const shipmentCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM shipments WHERE carrier_id = ${id}
    `;
    
    const hasShipments = Array.isArray(shipmentCount) && 
                       shipmentCount.length > 0 && 
                       Number(shipmentCount[0].count) > 0;
    
    if (hasShipments) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete carrier with existing shipments. Remove shipments first.'
      }, { status: 400 });
    }
    
    // Delete carrier
    await prisma.$executeRaw`
      DELETE FROM carriers WHERE id = ${id}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Carrier deleted successfully'
    });
    
  } catch (error: any) {
    console.error('❌ DELETE Error:', error.message);
    
    if (error.message.includes('foreign key constraint')) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete carrier with existing shipments'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete carrier'
    }, { status: 500 });
  }
}

// Optional: Add a PATCH method for updating carriers
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Carrier ID is required'
      }, { status: 400 });
    }
    
    console.log(`✏️ PATCH /api/carriers - Updating carrier ${id}`);
    
    // Check if carrier exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM carriers WHERE id = ${id}
    `;
    
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Carrier not found'
      }, { status: 404 });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const params = [];
    
    if (updateData.name !== undefined) {
      updateFields.push('name = ?');
      params.push(updateData.name.trim());
    }
    
    if (updateData.contact_name !== undefined) {
      updateFields.push('contact_name = ?');
      params.push(updateData.contact_name?.trim() || null);
    }
    
    if (updateData.contact_email !== undefined) {
      updateFields.push('contact_email = ?');
      params.push(updateData.contact_email?.trim() || null);
    }
    
    if (updateData.contact_phone !== undefined) {
      updateFields.push('contact_phone = ?');
      params.push(updateData.contact_phone?.trim() || null);
    }
    
    if (updateData.rating !== undefined) {
      updateFields.push('rating = ?');
      params.push(updateData.rating);
    }
    
    if (updateData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(updateData.status);
    }
    
    if (updateData.id_number !== undefined) {
      updateFields.push('id_number = ?');
      params.push(updateData.id_number?.trim() || null);
    }
    
    if (updateData.vehicle_registration !== undefined) {
      updateFields.push('vehicle_registration = ?');
      params.push(updateData.vehicle_registration?.trim() || null);
    }
    
    // Always update updated_at
    updateFields.push('updated_at = NOW()');
    
    if (updateFields.length === 1) { // Only updated_at was added
      return NextResponse.json({
        success: false,
        error: 'No fields to update'
      }, { status: 400 });
    }
    
    params.push(id);
    
    const sql = `
      UPDATE carriers 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await prisma.$executeRawUnsafe(sql, ...params);
    
    // Fetch updated carrier
    const updatedCarrier = await prisma.$queryRaw`
      SELECT 
        c.*,
        COALESCE(COUNT(s.id), 0) as shipment_count
      FROM carriers c
      LEFT JOIN shipments s ON c.id = s.carrier_id
      WHERE c.id = ${id}
      GROUP BY c.id
    `;
    
    const carrierData = updatedCarrier[0];
    const formattedCarrier = {
      id: carrierData.id,
      name: carrierData.name,
      contact_name: carrierData.contact_name,
      contact_email: carrierData.contact_email,
      contact_phone: carrierData.contact_phone,
      rating: Number(carrierData.rating) || 0,
      status: carrierData.status,
      id_number: carrierData.id_number,
      vehicle_registration: carrierData.vehicle_registration,
      created_at: carrierData.created_at,
      updated_at: carrierData.updated_at,
      _count: {
        shipments: Number(carrierData.shipment_count) || 0
      }
    };
    
    return NextResponse.json({
      success: true,
      data: formattedCarrier,
      message: 'Carrier updated successfully'
    });
    
  } catch (error: any) {
    console.error('❌ PATCH Error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Failed to update carrier: ' + error.message
    }, { status: 500 });
  }
}
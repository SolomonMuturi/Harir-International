import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    console.log('📨 GET /api/suppliers - Fetching all suppliers');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Get single supplier
      const supplier = await prisma.suppliers.findUnique({
        where: { id }
      });
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(supplier);
    }
    
    // Get all suppliers
    const suppliers = await prisma.suppliers.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`✅ Found ${suppliers.length} suppliers`);
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('❌ Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('📨 POST /api/suppliers - Creating new supplier');
    
    const body = await request.json();
    console.log('📦 Request data:', body);
    
    // Validate required fields
    if (!body.name || !body.contact_name || !body.contact_phone || !body.supplier_code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, contact_name, contact_phone, or supplier_code' },
        { status: 400 }
      );
    }
    
    // Create supplier with vehicle status fields
    const newSupplier = await prisma.suppliers.create({
      data: {
        id: `supp-${Date.now()}`,
        name: body.name,
        location: body.location || 'Gate Registration',
        contact_name: body.contact_name,
        contact_email: body.contact_email || '',
        contact_phone: body.contact_phone,
        produce_types: JSON.stringify(Array.isArray(body.produce_types) ? body.produce_types : []),
        status: body.status || 'Active',
        logo_url: body.logo_url || `https://avatar.vercel.sh/${encodeURIComponent(body.name)}.png`,
        active_contracts: body.active_contracts || 0,
        supplier_code: body.supplier_code,
        kra_pin: body.kra_pin || null,
        vehicle_number_plate: body.vehicle_number_plate || null,
        driver_name: body.driver_name || body.contact_name || null,
        driver_id_number: body.driver_id_number || null,
        mpesa_paybill: body.mpesa_paybill || null,
        mpesa_account_number: body.mpesa_account_number || null,
        bank_name: body.bank_name || null,
        bank_account_number: body.bank_account_number || null,
        password: body.password || null,
        vehicle_status: body.vehicle_status || 'Pre-registered',
        vehicle_check_in_time: body.vehicle_check_in_time || null,
        vehicle_check_out_time: body.vehicle_check_out_time || null,
        vehicle_type: body.vehicle_type || null,
        cargo_description: body.cargo_description || null
      }
    });

    console.log('✅ Supplier created successfully:', newSupplier.id);
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating supplier:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Supplier with this email or code already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create supplier', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing supplier ID' },
        { status: 400 }
      );
    }
    
    console.log(`📨 PUT /api/suppliers?id=${id} - Updating supplier`);
    
    const body = await request.json();
    console.log('📦 Update data:', body);
    
    // Prepare update data
    const updateData = {
      ...(body.name && { name: body.name }),
      ...(body.contact_name && { contact_name: body.contact_name }),
      ...(body.contact_phone && { contact_phone: body.contact_phone }),
      ...(body.supplier_code && { supplier_code: body.supplier_code }),
      ...(body.location && { location: body.location }),
      ...(body.contact_email && { contact_email: body.contact_email }),
      ...(body.produce_types && { 
        produce_types: JSON.stringify(Array.isArray(body.produce_types) ? body.produce_types : []) 
      }),
      ...(body.status && { status: body.status }),
      ...(body.kra_pin !== undefined && { kra_pin: body.kra_pin }),
      ...(body.vehicle_number_plate !== undefined && { vehicle_number_plate: body.vehicle_number_plate }),
      ...(body.driver_name !== undefined && { driver_name: body.driver_name }),
      ...(body.driver_id_number !== undefined && { driver_id_number: body.driver_id_number }),
      ...(body.vehicle_status !== undefined && { vehicle_status: body.vehicle_status }),
      ...(body.vehicle_check_in_time !== undefined && { vehicle_check_in_time: body.vehicle_check_in_time ? new Date(body.vehicle_check_in_time) : null }),
      ...(body.vehicle_check_out_time !== undefined && { vehicle_check_out_time: body.vehicle_check_out_time ? new Date(body.vehicle_check_out_time) : null }),
      ...(body.vehicle_type !== undefined && { vehicle_type: body.vehicle_type }),
      ...(body.cargo_description !== undefined && { cargo_description: body.cargo_description })
    };

    const updatedSupplier = await prisma.suppliers.update({
      where: { id },
      data: updateData
    });

    console.log('✅ Supplier updated successfully:', updatedSupplier.id);
    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('❌ Error updating supplier:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update supplier', details: error.message },
      { status: 500 }
    );
  }
}
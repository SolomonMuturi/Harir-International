import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('📨 GET /api/suppliers - Fetching all suppliers');
    
    const suppliers = await prisma.suppliers.findMany({
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`✅ Found ${suppliers.length} suppliers`);
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('❌ Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    console.log('📨 POST /api/suppliers - Creating new supplier');
    
    const body = await request.json()
    console.log('📦 Request data:', body);
    
    // Updated validation: Only check for fields that are actually in the form
    if (!body.name || !body.contact_name || !body.contact_phone || !body.supplier_code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, contact_name, contact_phone, or supplier_code' },
        { status: 400 }
      )
    }
    
    const newSupplier = await prisma.suppliers.create({
      data: {
        id: `supp-${Date.now()}`,
        name: body.name,
        location: body.location || '',
        contact_name: body.contact_name,
        contact_email: body.contact_email || '',
        contact_phone: body.contact_phone,
        // Ensure produce_types is always a valid JSON array
        produce_types: JSON.stringify(Array.isArray(body.produce_types) ? body.produce_types : []),
        status: body.status || 'Active',
        logo_url: body.logo_url || `https://avatar.vercel.sh/${encodeURIComponent(body.name)}.png`,
        active_contracts: body.active_contracts || 0,
        supplier_code: body.supplier_code,
        kra_pin: body.kra_pin || null,
        vehicle_number_plate: body.vehicle_number_plate || null,
        driver_name: body.driver_name || null,
        driver_id_number: body.driver_id_number || null,
        mpesa_paybill: body.mpesa_paybill || null,
        mpesa_account_number: body.mpesa_account_number || null,
        bank_name: body.bank_name || null,
        bank_account_number: body.bank_account_number || null,
        password: body.password || null
      }
    })

    console.log('✅ Supplier created successfully:', newSupplier.id);
    return NextResponse.json(newSupplier, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating supplier:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Supplier with this email or code already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create supplier', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    console.log(`📨 PUT /api/suppliers/${id} - Updating supplier`);
    
    const body = await request.json()
    console.log('📦 Update data:', body);
    
    // Updated validation for update
    if (!body.name || !body.contact_name || !body.contact_phone || !body.supplier_code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, contact_name, contact_phone, or supplier_code' },
        { status: 400 }
      )
    }
    
    const updatedSupplier = await prisma.suppliers.update({
      where: { id },
      data: {
        name: body.name,
        location: body.location || '',
        contact_name: body.contact_name,
        contact_email: body.contact_email || '',
        contact_phone: body.contact_phone,
        // Ensure produce_types is always a valid JSON array
        produce_types: JSON.stringify(Array.isArray(body.produce_types) ? body.produce_types : []),
        status: body.status || 'Active',
        supplier_code: body.supplier_code,
        kra_pin: body.kra_pin || null,
        vehicle_number_plate: body.vehicle_number_plate || null,
        driver_name: body.driver_name || null,
        driver_id_number: body.driver_id_number || null,
        mpesa_paybill: body.mpesa_paybill || null,
        mpesa_account_number: body.mpesa_account_number || null,
        bank_name: body.bank_name || null,
        bank_account_number: body.bank_account_number || null
      }
    })

    console.log('✅ Supplier updated successfully:', updatedSupplier.id);
    return NextResponse.json(updatedSupplier)
  } catch (error) {
    console.error('❌ Error updating supplier:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update supplier', details: error.message },
      { status: 500 }
    )
  }
}
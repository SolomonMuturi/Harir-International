import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET single supplier by ID
export async function GET(request, { params }) {
  try {
    console.log('📨 GET /api/suppliers/[id] - Fetching supplier:', params.id);
    
    const supplier = await prisma.suppliers.findUnique({
      where: { id: params.id }
    })
    
    if (!supplier) {
      console.log('❌ Supplier not found:', params.id);
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Supplier found:', supplier.name);
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('❌ Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier', details: error.message },
      { status: 500 }
    )
  }
}

// PUT (update) supplier by ID
export async function PUT(request, { params }) {
  try {
    console.log('📨 PUT /api/suppliers/[id] - Updating supplier:', params.id);
    
    const body = await request.json()
    console.log('📦 Update data:', body);
    
    // Check if supplier exists
    const existingSupplier = await prisma.suppliers.findUnique({
      where: { id: params.id }
    })
    
    if (!existingSupplier) {
      console.log('❌ Supplier not found for update:', params.id);
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    const updatedSupplier = await prisma.suppliers.update({
      where: { id: params.id },
      data: {
        name: body.name,
        location: body.location,
        contact_name: body.contactName,
        contact_email: body.contactEmail,
        contact_phone: body.contactPhone,
        produce_types: JSON.stringify(body.produceTypes || []),
        status: body.status,
        logo_url: body.logoUrl,
        active_contracts: body.activeContracts,
        supplier_code: body.supplierCode,
        kra_pin: body.kraPin,
        vehicle_number_plate: body.vehicleNumberPlate,
        driver_name: body.driverName,
        driver_id_number: body.driverIdNumber,
        mpesa_paybill: body.mpesaPaybill,
        mpesa_account_number: body.mpesaAccountNumber,
        bank_name: body.bankName,
        bank_account_number: body.bankAccountNumber
        // Note: Password is not updated here for security
      }
    })

    console.log('✅ Supplier updated successfully:', updatedSupplier.id);
    return NextResponse.json(updatedSupplier)
  } catch (error) {
    console.error('❌ Error updating supplier:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Supplier with this email or code already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update supplier', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE supplier by ID
export async function DELETE(request, { params }) {
  try {
    console.log('📨 DELETE /api/suppliers/[id] - Deleting supplier:', params.id);
    
    const deletedSupplier = await prisma.suppliers.delete({
      where: { id: params.id }
    })

    console.log('✅ Supplier deleted successfully:', deletedSupplier.id);
    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting supplier:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete supplier', details: error.message },
      { status: 500 }
    )
  }
}
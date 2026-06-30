// app/api/suppliers/checked-in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 GET /api/suppliers/checked-in - Fetching checked-in vehicles');
    
    // Fetch checked-in vehicles directly from vehicle_visits
    const checkedInVehicles = await prisma.vehicle_visits.findMany({
      where: {
        status: {
          in: ['Pre-registered', 'Checked-in']
        }
      },
      orderBy: {
        check_in_time: 'desc'
      }
    });

    console.log(`✅ Found ${checkedInVehicles.length} checked-in vehicles`);

    // Transform to match the CheckedInSupplier interface
    const checkedInSuppliers = checkedInVehicles.map(vehicle => {
      let fruitVarieties: string[] = [];
      try {
        if (vehicle.fruit_varieties) {
          fruitVarieties = JSON.parse(vehicle.fruit_varieties);
        }
      } catch (e) {
        fruitVarieties = [];
      }

      return {
        id: vehicle.id,
        supplier_code: `VISIT-${vehicle.id.slice(-6)}`,
        company_name: vehicle.company_name || 'Unknown',
        driver_name: vehicle.driver_name || 'Unknown',
        phone_number: vehicle.contact_phone || '',
        id_number: vehicle.driver_id_number || '',
        vehicle_plate: vehicle.vehicle_plate || '',
        fruit_varieties: fruitVarieties,
        region: vehicle.region || '',
        check_in_time: vehicle.check_in_time?.toISOString() || vehicle.registered_at.toISOString(),
        gate_entry_id: vehicle.gate_entry_id || undefined,
        status: vehicle.gate_entry_id ? 'weighed' : 'pending'
      };
    });

    return NextResponse.json(checkedInSuppliers);

  } catch (error: any) {
    console.error('❌ Error fetching checked-in vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checked-in vehicles', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting vehicle visit: ${id}`);

    // Check if vehicle exists
    const vehicle = await prisma.vehicle_visits.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle visit not found' },
        { status: 404 }
      );
    }

    // Delete the vehicle visit
    await prisma.vehicle_visits.delete({
      where: { id }
    });

    console.log(`✅ Vehicle visit deleted: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Vehicle visit deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting vehicle visit:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle visit', details: error.message },
      { status: 500 }
    );
  }
}
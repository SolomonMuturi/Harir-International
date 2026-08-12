// app/api/suppliers/checked-in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, ['suppliers.weigh', 'suppliers.manage']);
  if (auth.error) return auth.error;
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

    // Resolve phone numbers from the linked weight entry (by gate_entry_id)
    // for historical visits that predate vehicle_visits.contact_phone.
    const gateEntryIds = Array.from(
      new Set(checkedInVehicles.map(v => v.gate_entry_id).filter(Boolean))
    ) as string[];

    let weightEntryPhones: Record<string, string> = {};
    if (gateEntryIds.length > 0) {
      const weightEntries = await prisma.weight_entries.findMany({
        where: { gate_entry_id: { in: gateEntryIds } },
        select: {
          gate_entry_id: true,
          supplier_phone: true,
          driver_phone: true
        }
      });
      weightEntries.forEach(w => {
        weightEntryPhones[w.gate_entry_id] = w.supplier_phone || w.driver_phone || '';
      });
    }

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
        company_name: vehicle.company_name || 'Enter Supplier Name',
        driver_name: vehicle.driver_name || 'Unknown',
        phone_number: vehicle.contact_phone || (vehicle.gate_entry_id ? weightEntryPhones[vehicle.gate_entry_id] : '') || '',
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
  const auth = await requirePermission(request, ['suppliers.weigh', 'suppliers.manage']);
  if (auth.error) return auth.error;
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
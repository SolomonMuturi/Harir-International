import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get checked-in suppliers (vehicle_status = 'Checked-in') with their latest visit
    const checkedInSuppliers = await prisma.suppliers.findMany({
      where: {
        vehicle_status: 'Checked-in',
        vehicle_check_in_time: {
          not: null,
        },
      },
      select: {
        id: true,
        supplier_code: true,
        name: true,
        contact_name: true,
        contact_phone: true,
        driver_name: true,
        driver_id_number: true,
        vehicle_number_plate: true,
        produce_types: true,
        location: true,
        vehicle_status: true,
        vehicle_check_in_time: true,
        // Include the latest vehicle visit to get gate_entry_id
        visits: {
          where: {
            status: {
              in: ['Checked-in', 'Pending Exit']
            }
          },
          orderBy: {
            check_in_time: 'desc'
          },
          take: 1,
          select: {
            gate_entry_id: true,
            visit_number: true,
            check_in_time: true,
            status: true
          }
        }
      },
      orderBy: {
        vehicle_check_in_time: 'desc',
      },
    });

    console.log(`📦 Found ${checkedInSuppliers.length} checked-in suppliers with visits`);

    const transformedSuppliers = checkedInSuppliers.map(supplier => {
      const latestVisit = supplier.visits && supplier.visits.length > 0 
        ? supplier.visits[0] 
        : null;

      if (latestVisit?.gate_entry_id) {
        console.log(`🔑 Supplier ${supplier.name} has gate entry ID: ${latestVisit.gate_entry_id}`);
      }

      let fruitVarieties = [];
      try {
        if (Array.isArray(supplier.produce_types)) {
          fruitVarieties = supplier.produce_types;
        } else if (typeof supplier.produce_types === 'string') {
          fruitVarieties = JSON.parse(supplier.produce_types || '[]');
        }
      } catch (e) {
        console.error('Error parsing produce_types:', e);
        fruitVarieties = [];
      }

      return {
        id: supplier.id,
        supplier_code: supplier.supplier_code || '',
        company_name: supplier.name || '',
        driver_name: supplier.driver_name || supplier.contact_name || '',
        phone_number: supplier.contact_phone || '',
        id_number: supplier.driver_id_number || '',
        vehicle_plate: supplier.vehicle_number_plate || '',
        fruit_varieties: fruitVarieties,
        region: supplier.location || '',
        check_in_time: supplier.vehicle_check_in_time?.toISOString() || '',
        gate_entry_id: latestVisit?.gate_entry_id || null,
        visit_number: latestVisit?.visit_number || null,
        visit_status: latestVisit?.status || null,
      };
    });
    
    return NextResponse.json(transformedSuppliers);
    
  } catch (error: any) {
    console.error('❌ Error fetching checked-in suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checked-in suppliers', details: error.message },
      { status: 500 }
    );
  }
}
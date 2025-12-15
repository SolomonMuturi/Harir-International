import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get checked-in suppliers (vehicle_status = 'Checked-in')
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
      },
      orderBy: {
        vehicle_check_in_time: 'desc',
      },
    });

    // Transform the data
    const transformedSuppliers = checkedInSuppliers.map(supplier => ({
      id: supplier.id,
      supplier_code: supplier.supplier_code || '',
      company_name: supplier.name || '',
      driver_name: supplier.driver_name || supplier.contact_name || '',
      phone_number: supplier.contact_phone || '',
      id_number: supplier.driver_id_number || '',
      vehicle_plate: supplier.vehicle_number_plate || '',
      fruit_varieties: Array.isArray(supplier.produce_types) 
        ? supplier.produce_types 
        : typeof supplier.produce_types === 'string'
          ? JSON.parse(supplier.produce_types || '[]')
          : [],
      region: supplier.location || '',
      check_in_time: supplier.vehicle_check_in_time?.toISOString() || '',
    }));

    return NextResponse.json(transformedSuppliers);
  } catch (error: any) {
    console.error('Error fetching checked-in suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checked-in suppliers', details: error.message },
      { status: 500 }
    );
  }
}
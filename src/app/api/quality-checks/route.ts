import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const order = searchParams.get('order') || 'desc';

    const qualityChecks = await prisma.quality_checks.findMany({
      take: limit,
      orderBy: { processed_at: order as 'asc' | 'desc' },
      include: {
        shipments: {
          select: {
            shipment_id: true,
            product: true,
            customers: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(qualityChecks);
  } catch (error: any) {
    console.error('Error fetching quality checks:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating quality check:', body);
    
    const qualityCheck = await prisma.quality_checks.create({
      data: {
        id: `qc-${Date.now()}`,
        shipment_id: body.shipment_id || null,
        operator_id: body.operator_id || null,
        pallet_id: body.pallet_id || null,
        product: body.product,
        declared_weight: body.declared_weight || 0,
        net_weight: body.net_weight || 0,
        rejected_weight: body.rejected_weight || 0,
        accepted_weight: body.accepted_weight || 0,
        arrival_temperature: body.arrival_temperature || 0,
        driver_id: body.driver_id || null,
        truck_id: body.truck_id || null,
        packaging_status: body.packaging_status || 'accepted',
        freshness_status: body.freshness_status || 'accepted',
        seals_status: body.seals_status || 'accepted',
        overall_status: body.overall_status || 'approved',
        notes: body.notes || '',
        processed_by: body.processed_by || 'QC Officer'
      },
      include: {
        shipments: {
          select: {
            shipment_id: true,
            product: true
          }
        }
      }
    });

    return NextResponse.json(qualityCheck, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quality check:', error);
    return NextResponse.json(
      { error: 'Failed to create quality check', details: error.message },
      { status: 500 }
    );
  }
}
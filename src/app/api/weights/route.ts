import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // Changed from { db } to { prisma }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const order = searchParams.get('order') || 'desc';

    // Fetch weight entries from database
    const weights = await prisma.weight_entries.findMany({
      take: limit,
      orderBy: { 
        timestamp: order as 'asc' | 'desc' 
      },
      select: {
        id: true,
        pallet_id: true,
        product: true,
        weight: true,
        unit: true,
        timestamp: true,
        supplier: true,
        truck_id: true,
        driver_id: true,
        gross_weight: true,
        tare_weight: true,
        net_weight: true,
        declared_weight: true,
        rejected_weight: true,
        created_at: true,
      }
    });

    // Transform to match your WeightEntry type
    const transformedWeights = weights.map(weight => ({
      id: weight.id,
      palletId: weight.pallet_id || '',
      product: weight.product || '',
      weight: weight.weight || 0,
      unit: weight.unit as 'kg' | 'lb',
      timestamp: weight.timestamp?.toISOString() || weight.created_at.toISOString(),
      supplier: weight.supplier || '',
      truckId: weight.truck_id || '',
      driverId: weight.driver_id || '',
      grossWeight: weight.gross_weight || undefined,
      tareWeight: weight.tare_weight || undefined,
      netWeight: weight.net_weight || 0,
      declaredWeight: weight.declared_weight || undefined,
      rejectedWeight: weight.rejected_weight || undefined,
      created_at: weight.created_at.toISOString(),
    }));

    return NextResponse.json(transformedWeights);
  } catch (error: any) {
    console.error('❌ Error fetching weights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weights', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.palletId || !body.netWeight) {
      return NextResponse.json(
        { error: 'Missing required fields: palletId and netWeight are required' },
        { status: 400 }
      );
    }

    // Create new weight entry
    const newWeight = await prisma.weight_entries.create({
      data: {
        id: `weight-${Date.now()}`,
        pallet_id: body.palletId,
        product: body.product || '',
        weight: body.weight || body.netWeight,
        unit: body.unit || 'kg',
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        supplier: body.supplier || '',
        truck_id: body.truckId || '',
        driver_id: body.driverId || '',
        gross_weight: body.grossWeight || body.netWeight,
        tare_weight: body.tareWeight || 0,
        net_weight: body.netWeight,
        declared_weight: body.declaredWeight || body.netWeight,
        rejected_weight: body.rejectedWeight || 0,
      }
    });

    // Transform response to match your WeightEntry type
    const transformedWeight = {
      id: newWeight.id,
      palletId: newWeight.pallet_id || '',
      product: newWeight.product || '',
      weight: newWeight.weight || 0,
      unit: newWeight.unit as 'kg' | 'lb',
      timestamp: newWeight.timestamp?.toISOString() || newWeight.created_at.toISOString(),
      supplier: newWeight.supplier || '',
      truckId: newWeight.truck_id || '',
      driverId: newWeight.driver_id || '',
      grossWeight: newWeight.gross_weight || undefined,
      tareWeight: newWeight.tare_weight || undefined,
      netWeight: newWeight.net_weight || 0,
      declaredWeight: newWeight.declared_weight || undefined,
      rejectedWeight: newWeight.rejected_weight || undefined,
      created_at: newWeight.created_at.toISOString(),
    };

    return NextResponse.json(transformedWeight, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating weight entry:', error);
    return NextResponse.json(
      { error: 'Failed to create weight entry', details: error.message },
      { status: 500 }
    );
  }
}
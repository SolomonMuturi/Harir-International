import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper function to generate default pallet ID
function generateDefaultPalletId(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PAL${randomNum}/${month}${day}`;
}

// Helper to generate a valid ID (max 20 chars)
function generateValidId(): string {
  const timestamp = Date.now().toString(36); // ~11 chars
  const random = Math.random().toString(36).substr(2, 8); // 8 chars
  return `w${timestamp}${random}`.substr(0, 20); // Ensure max 20 chars
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/weights called');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const order = searchParams.get('order') || 'desc';

    console.log(`Fetching weights with limit: ${limit}, order: ${order}`);

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
        created_at: true,
        supplier: true,
        truck_id: true,
        driver_id: true,
        gross_weight: true,
        tare_weight: true,
        net_weight: true,
        declared_weight: true,
        rejected_weight: true,
        supplier_id: true,
        supplier_phone: true,
        fruit_variety: true,
        number_of_crates: true,
        region: true,
        image_url: true,
        driver_name: true,
        driver_phone: true,
        driver_id_number: true,
        vehicle_plate: true,
        notes: true,
      }
    });

    console.log(`✅ Fetched ${weights.length} weight entries`);

    // Transform to match your WeightEntry type
    const transformedWeights = weights.map(weight => ({
      id: weight.id,
      palletId: weight.pallet_id || '',
      pallet_id: weight.pallet_id || '',
      product: weight.product || '',
      weight: Number(weight.weight) || 0,
      unit: weight.unit as 'kg' | 'lb',
      timestamp: weight.timestamp?.toISOString() || weight.created_at.toISOString(),
      supplier: weight.supplier || '',
      truckId: weight.truck_id || '',
      truck_id: weight.truck_id || '',
      driverId: weight.driver_id || '',
      driver_id: weight.driver_id || '',
      grossWeight: Number(weight.gross_weight) || 0,
      gross_weight: Number(weight.gross_weight) || 0,
      tareWeight: Number(weight.tare_weight) || 0,
      tare_weight: Number(weight.tare_weight) || 0,
      netWeight: Number(weight.net_weight) || 0,
      net_weight: Number(weight.net_weight) || 0,
      declaredWeight: Number(weight.declared_weight) || 0,
      declared_weight: Number(weight.declared_weight) || 0,
      rejectedWeight: Number(weight.rejected_weight) || 0,
      rejected_weight: Number(weight.rejected_weight) || 0,
      created_at: weight.created_at.toISOString(),
      supplier_id: weight.supplier_id || '',
      supplier_phone: weight.supplier_phone || '',
      fruit_variety: typeof weight.fruit_variety === 'string' 
        ? JSON.parse(weight.fruit_variety || '[]') 
        : weight.fruit_variety || [],
      number_of_crates: weight.number_of_crates || 0,
      region: weight.region || '',
      image_url: weight.image_url || '',
      driver_name: weight.driver_name || '',
      driver_phone: weight.driver_phone || '',
      driver_id_number: weight.driver_id_number || '',
      vehicle_plate: weight.vehicle_plate || '',
      notes: weight.notes || '',
    }));

    return NextResponse.json(transformedWeights);
  } catch (error: any) {
    console.error('❌ Error fetching weights:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch weights', 
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/weights called');
    
    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    // Generate default values if not provided
    const palletId = body.pallet_id || body.palletId || generateDefaultPalletId();
    const netWeight = parseFloat(body.net_weight || body.netWeight || '0');
    
    // Generate a valid ID (max 20 characters)
    const weightId = generateValidId();
    console.log('Generated ID:', weightId, 'Length:', weightId.length);
    
    // Prepare data matching the database schema exactly
    const weightData: any = {
      id: weightId, // Use the generated valid ID
      pallet_id: palletId,
      product: body.product || '',
      weight: parseFloat(body.weight || body.net_weight || body.netWeight || '0'),
      unit: (body.unit || 'kg') as 'kg' | 'lb',
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      
      // Include all fields from your Prisma schema
      supplier: body.supplier || '',
      supplier_id: body.supplier_id || null,
      supplier_phone: body.supplier_phone || null,
      fruit_variety: Array.isArray(body.fruit_variety) 
        ? JSON.stringify(body.fruit_variety)
        : (body.fruit_variety || '[]'),
      number_of_crates: parseInt(body.number_of_crates || '0') || null,
      region: body.region || null,
      image_url: body.image_url || null,
      driver_name: body.driver_name || null,
      driver_phone: body.driver_phone || null,
      driver_id_number: body.driver_id_number || null,
      vehicle_plate: body.vehicle_plate || null,
      truck_id: body.truck_id || body.truckId || null,
      driver_id: body.driver_id || body.driverId || null,
      
      // Weight calculations - ensure they're numbers or null
      gross_weight: parseFloat(body.gross_weight || body.grossWeight || netWeight.toString()) || null,
      tare_weight: parseFloat(body.tare_weight || body.tareWeight || '0') || null,
      net_weight: netWeight || null,
      declared_weight: parseFloat(body.declared_weight || body.declaredWeight || netWeight.toString()) || null,
      rejected_weight: parseFloat(body.rejected_weight || body.rejectedWeight || '0') || null,
      
      notes: body.notes || null,
    };

    // Clean up undefined values - set to null for database
    Object.keys(weightData).forEach(key => {
      if (weightData[key] === undefined) {
        weightData[key] = null;
      }
    });

    console.log('Creating weight entry with data:', weightData);

    // Create new weight entry
    const newWeight = await prisma.weight_entries.create({
      data: weightData,
    });

    console.log('✅ Weight entry created successfully:', newWeight.id);

    // Get the full entry
    const fullWeightEntry = await prisma.weight_entries.findUnique({
      where: { id: newWeight.id },
    });

    if (!fullWeightEntry) {
      throw new Error('Failed to retrieve created weight entry');
    }

    // Transform response for frontend
    const transformedWeight = {
      id: fullWeightEntry.id,
      palletId: fullWeightEntry.pallet_id || '',
      pallet_id: fullWeightEntry.pallet_id || '',
      product: fullWeightEntry.product || '',
      weight: Number(fullWeightEntry.weight) || 0,
      unit: fullWeightEntry.unit as 'kg' | 'lb',
      timestamp: fullWeightEntry.timestamp?.toISOString() || fullWeightEntry.created_at.toISOString(),
      supplier: fullWeightEntry.supplier || '',
      truckId: fullWeightEntry.truck_id || '',
      truck_id: fullWeightEntry.truck_id || '',
      driverId: fullWeightEntry.driver_id || '',
      driver_id: fullWeightEntry.driver_id || '',
      grossWeight: Number(fullWeightEntry.gross_weight) || 0,
      gross_weight: Number(fullWeightEntry.gross_weight) || 0,
      tareWeight: Number(fullWeightEntry.tare_weight) || 0,
      tare_weight: Number(fullWeightEntry.tare_weight) || 0,
      netWeight: Number(fullWeightEntry.net_weight) || 0,
      net_weight: Number(fullWeightEntry.net_weight) || 0,
      declaredWeight: Number(fullWeightEntry.declared_weight) || 0,
      declared_weight: Number(fullWeightEntry.declared_weight) || 0,
      rejectedWeight: Number(fullWeightEntry.rejected_weight) || 0,
      rejected_weight: Number(fullWeightEntry.rejected_weight) || 0,
      created_at: fullWeightEntry.created_at.toISOString(),
      supplier_id: fullWeightEntry.supplier_id || '',
      supplier_phone: fullWeightEntry.supplier_phone || '',
      fruit_variety: typeof fullWeightEntry.fruit_variety === 'string' 
        ? JSON.parse(fullWeightEntry.fruit_variety || '[]') 
        : fullWeightEntry.fruit_variety || [],
      number_of_crates: fullWeightEntry.number_of_crates || 0,
      region: fullWeightEntry.region || '',
      image_url: fullWeightEntry.image_url || '',
      driver_name: fullWeightEntry.driver_name || '',
      driver_phone: fullWeightEntry.driver_phone || '',
      driver_id_number: fullWeightEntry.driver_id_number || '',
      vehicle_plate: fullWeightEntry.vehicle_plate || '',
      notes: fullWeightEntry.notes || '',
    };

    return NextResponse.json(transformedWeight, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating weight entry:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    // Check for specific MySQL errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Foreign key constraint failed',
          details: 'Check if referenced records exist'
        },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Unique constraint failed',
          details: 'A record with this ID already exists'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create weight entry', 
        details: error.message,
        code: error.code || 'UNKNOWN',
      },
      { status: 500 }
    );
  }
}
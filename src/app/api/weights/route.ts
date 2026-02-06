import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper function to generate sequential pallet ID
function generateSequentialPalletId(counter: number, regionCode?: string): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const palletNum = counter.toString().padStart(3, '0');
  
  if (regionCode) {
    return `PAL-${palletNum}/${month}${day}/${regionCode}`;
  }
  return `PAL-${palletNum}/${month}${day}`;
}

// Helper to generate a valid ID
function generateValidId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `w${timestamp}${random}`.substr(0, 20);
}

// GET handler - Fetch weight entries
export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/weights called');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const order = searchParams.get('order') || 'desc';
    const supplierId = searchParams.get('supplierId');
    const date = searchParams.get('date');
    const region = searchParams.get('region');

    console.log(`📊 Fetching ${limit} weights, order: ${order}`);

    // Build filter conditions
    const where: any = {};
    
    if (supplierId) {
      where.supplier_id = supplierId;
    }
    
    if (region) {
      where.region = region;
    }
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      where.timestamp = {
        gte: startDate,
        lte: endDate
      };
    }

    // Fetch weights with all necessary fields
    const weights = await prisma.weight_entries.findMany({
      take: limit,
      where,
      orderBy: { 
        timestamp: order as 'asc' | 'desc' 
      },
      select: {
        // Basic info
        id: true,
        pallet_id: true,
        product: true,
        weight: true,
        unit: true,
        timestamp: true,
        created_at: true,
        
        // Supplier info
        supplier: true,
        supplier_id: true,
        supplier_phone: true,
        
        // Driver and vehicle info
        driver_name: true,
        driver_phone: true,
        driver_id_number: true,
        vehicle_plate: true,
        truck_id: true,
        driver_id: true,
        
        // Weight calculations
        gross_weight: true,
        tare_weight: true,
        net_weight: true,
        declared_weight: true,
        rejected_weight: true,
        
        // Fruit variety info
        fuerte_weight: true,
        fuerte_crates: true,
        hass_weight: true,
        hass_crates: true,
        number_of_crates: true,
        fruit_variety: true,
        perVarietyWeights: true,
        
        // Other info
        region: true,
        image_url: true,
        notes: true,
        bank_name: true,
        bank_account: true,
        kra_pin: true,
        
        // Relations
        counting_records: {
          select: {
            id: true,
            submitted_at: true,
            status: true
          }
        }
      }
    });

    console.log(`✅ Fetched ${weights.length} weight entries`);

    // Transform to ensure proper number types
    const transformedWeights = weights.map(weight => ({
      // Basic info
      id: weight.id,
      palletId: weight.pallet_id || '',
      pallet_id: weight.pallet_id || '',
      product: weight.product || '',
      weight: Number(weight.weight) || 0,
      unit: weight.unit as 'kg' | 'lb',
      timestamp: weight.timestamp?.toISOString() || weight.created_at.toISOString(),
      created_at: weight.created_at.toISOString(),
      
      // Supplier info
      supplier: weight.supplier || '',
      supplier_id: weight.supplier_id || '',
      supplier_phone: weight.supplier_phone || '',
      
      // Driver info
      driver_name: weight.driver_name || '',
      driver_phone: weight.driver_phone || '',
      driver_id_number: weight.driver_id_number || '',
      vehicle_plate: weight.vehicle_plate || '',
      truckId: weight.truck_id || '',
      truck_id: weight.truck_id || '',
      driverId: weight.driver_id || '',
      driver_id: weight.driver_id || '',
      
      // Weight calculations
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
      
      // Fruit variety weights
      fuerte_weight: Number(weight.fuerte_weight) || 0,
      fuerte_crates: Number(weight.fuerte_crates) || 0,
      hass_weight: Number(weight.hass_weight) || 0,
      hass_crates: Number(weight.hass_crates) || 0,
      number_of_crates: weight.number_of_crates || 0,
      
      // Fruit variety arrays
      fruit_variety: typeof weight.fruit_variety === 'string' 
        ? JSON.parse(weight.fruit_variety || '[]') 
        : weight.fruit_variety || [],
      perVarietyWeights: typeof weight.perVarietyWeights === 'string' 
        ? JSON.parse(weight.perVarietyWeights || '[]') 
        : weight.perVarietyWeights || [],
      
      // Other info
      region: weight.region || '',
      image_url: weight.image_url || '',
      notes: weight.notes || '',
      bank_name: weight.bank_name || '',
      bank_account: weight.bank_account || '',
      kra_pin: weight.kra_pin || '',
      
      // Counting records
      counting_records: weight.counting_records || []
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

// POST handler - Create new weight entry
export async function POST(request: NextRequest) {
  try {
    console.log('📤 POST /api/weights called');
    
    const body = await request.json();
    console.log('📦 Received body:', {
      fuerte_weight: body.fuerte_weight,
      hass_weight: body.hass_weight,
      fuerte_crates: body.fuerte_crates,
      hass_crates: body.hass_crates,
      supplier: body.supplier,
      region: body.region,
    });
    
    // Parse fruit weights
    const fuerteWeight = body.fuerte_weight ? parseFloat(String(body.fuerte_weight)) : 0;
    const fuerteCrates = body.fuerte_crates ? parseInt(String(body.fuerte_crates)) : 0;
    const hassWeight = body.hass_weight ? parseFloat(String(body.hass_weight)) : 0;
    const hassCrates = body.hass_crates ? parseInt(String(body.hass_crates)) : 0;
    
    console.log('🧮 Parsed values:', {
      fuerteWeight,
      fuerteCrates,
      hassWeight,
      hassCrates
    });
    
    // Validate at least one weight is provided
    if (fuerteWeight <= 0 && hassWeight <= 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'Please enter weight for at least one variety (Fuerte or Hass)'
        },
        { status: 400 }
      );
    }
    
    // Validate at least one crate count is provided
    if (fuerteCrates <= 0 && hassCrates <= 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'Please enter number of crates for at least one variety'
        },
        { status: 400 }
      );
    }
    
    // Calculate totals
    const totalWeight = fuerteWeight + hassWeight;
    const totalCrates = fuerteCrates + hassCrates;
    
    console.log('📊 Totals:', {
      totalWeight,
      totalCrates
    });
    
    // Generate pallet ID
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Count today's pallets for sequential numbering
    const todayPallets = await prisma.weight_entries.count({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
        pallet_id: {
          startsWith: 'PAL-'
        }
      },
    });
    
    // Generate pallet ID
    const regionCode = body.region ? body.region.substring(0, 3).toUpperCase() : undefined;
    const palletId = body.pallet_id || body.palletId || generateSequentialPalletId(todayPallets + 1, regionCode);
    
    // Generate ID
    const weightId = generateValidId();
    
    // Create product description
    const productDescription = [];
    if (fuerteWeight > 0) productDescription.push(`Fuerte: ${fuerteWeight.toFixed(2)}kg`);
    if (hassWeight > 0) productDescription.push(`Hass: ${hassWeight.toFixed(2)}kg`);
    
    // Prepare data for database
    const weightData = {
      // Basic info
      id: weightId,
      pallet_id: palletId,
      product: productDescription.join(', ') || '',
      unit: (body.unit || 'kg') as 'kg' | 'lb',
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      
      // Fruit weights
      fuerte_weight: fuerteWeight > 0 ? fuerteWeight : null,
      fuerte_crates: fuerteCrates > 0 ? fuerteCrates : null,
      hass_weight: hassWeight > 0 ? hassWeight : null,
      hass_crates: hassCrates > 0 ? hassCrates : null,
      
      // Total weight fields
      weight: totalWeight,
      net_weight: totalWeight,
      gross_weight: totalWeight,
      declared_weight: totalWeight,
      tare_weight: 0,
      rejected_weight: 0,
      
      // Supplier info
      supplier: body.supplier || body.supplier_name || '',
      supplier_id: body.supplier_id || null,
      supplier_phone: body.supplier_phone || '',
      
      // Fruit variety info
      fruit_variety: JSON.stringify([
        ...(fuerteWeight > 0 ? ['Fuerte'] : []),
        ...(hassWeight > 0 ? ['Hass'] : [])
      ]),
      number_of_crates: totalCrates,
      region: body.region || '',
      
      // Driver info
      driver_name: body.driver_name || '',
      driver_phone: body.driver_phone || '',
      driver_id_number: body.driver_id_number || '',
      vehicle_plate: body.vehicle_plate || '',
      truck_id: body.truck_id || body.vehicle_plate || '',
      driver_id: body.driver_id || body.driver_id_number || '',
      
      // Optional fields
      image_url: body.image_url || null,
      notes: body.notes || '',
      
      // Per variety weights (JSON for reference)
      perVarietyWeights: JSON.stringify([
        ...(fuerteWeight > 0 ? [{
          variety: 'Fuerte',
          weight: fuerteWeight,
          crates: fuerteCrates
        }] : []),
        ...(hassWeight > 0 ? [{
          variety: 'Hass',
          weight: hassWeight,
          crates: hassCrates
        }] : [])
      ]),
      
      // Payment info
      bank_name: body.bank_name || '',
      bank_account: body.bank_account || '',
      kra_pin: body.kra_pin || '',
    };
    
    console.log('💾 Saving to database:', {
      pallet_id: weightData.pallet_id,
      supplier: weightData.supplier,
      total_weight: totalWeight
    });
    
    // Save to database
    const newWeight = await prisma.weight_entries.create({
      data: weightData,
    });
    
    console.log('✅ Saved successfully:', {
      id: newWeight.id,
      pallet_id: newWeight.pallet_id,
      supplier: newWeight.supplier
    });
    
    // Update supplier check-in status if supplier_id is provided
    if (body.supplier_id) {
      try {
        await prisma.supplier_checkins.updateMany({
          where: {
            OR: [
              { supplier_id: body.supplier_id },
              { driver_name: body.driver_name || '' },
              { vehicle_plate: body.vehicle_plate || '' }
            ],
            status: 'checked_in'
          },
          data: {
            status: 'weighed',
            updated_at: new Date()
          }
        });
        
        console.log('✅ Updated supplier check-in status to weighed');
      } catch (checkinError) {
        console.error('⚠️ Error updating supplier check-in:', checkinError);
        // Continue even if check-in update fails
      }
    }
    
    // Transform response for frontend
    const response = {
      id: newWeight.id,
      palletId: newWeight.pallet_id || '',
      pallet_id: newWeight.pallet_id || '',
      product: newWeight.product || '',
      weight: Number(newWeight.weight) || 0,
      unit: newWeight.unit as 'kg' | 'lb',
      timestamp: newWeight.timestamp?.toISOString() || newWeight.created_at.toISOString(),
      
      // Fruit weights
      fuerte_weight: Number(newWeight.fuerte_weight) || 0,
      fuerte_crates: Number(newWeight.fuerte_crates) || 0,
      hass_weight: Number(newWeight.hass_weight) || 0,
      hass_crates: Number(newWeight.hass_crates) || 0,
      
      // Supplier info
      supplier: newWeight.supplier || '',
      supplier_id: newWeight.supplier_id || '',
      supplier_phone: newWeight.supplier_phone || '',
      
      // Driver info
      driver_name: newWeight.driver_name || '',
      driver_phone: newWeight.driver_phone || '',
      driver_id_number: newWeight.driver_id_number || '',
      vehicle_plate: newWeight.vehicle_plate || '',
      
      // Other info
      region: newWeight.region || '',
      number_of_crates: newWeight.number_of_crates || 0,
      image_url: newWeight.image_url || '',
      notes: newWeight.notes || '',
      created_at: newWeight.created_at.toISOString(),
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Error creating weight entry:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Duplicate entry',
          details: 'A weight entry with this ID already exists'
        },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Foreign key constraint failed',
          details: 'Referenced record does not exist'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create weight entry',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

// PATCH handler - Update weight entry
export async function PATCH(request: NextRequest) {
  try {
    console.log('🔄 PATCH /api/weights called');
    
    // Check if it's a specific weight update or KPI update
    const { searchParams } = new URL(request.url);
    const isKpiRequest = searchParams.has('kpi');
    
    if (isKpiRequest) {
      // Handle KPI data request
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Count today's entries
      const todayCount = await prisma.weight_entries.count({
        where: {
          timestamp: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
      
      // Count last hour's entries
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      const lastHourCount = await prisma.weight_entries.count({
        where: {
          timestamp: {
            gte: lastHour,
          },
        },
      });
      
      const changeSinceLastHour = lastHourCount - todayCount;
      
      return NextResponse.json({
        todayCount,
        changeSinceLastHour,
        lastUpdated: new Date().toISOString(),
      });
    }
    
    // Handle weight entry update
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'Weight entry ID is required'
        },
        { status: 400 }
      );
    }

    console.log(`📝 Updating weight entry ${id} with data:`, updateData);

    // Check if weight entry exists
    const existingWeight = await prisma.weight_entries.findUnique({
      where: { id },
    });

    if (!existingWeight) {
      console.log(`❌ Weight entry ${id} not found`);
      return NextResponse.json(
        { 
          error: 'Weight entry not found',
          details: `No weight entry found with ID: ${id}`
        },
        { status: 404 }
      );
    }

    // Parse and validate fruit weights if provided
    let fuerteWeight = updateData.fuerte_weight !== undefined 
      ? parseFloat(String(updateData.fuerte_weight)) 
      : Number(existingWeight.fuerte_weight) || 0;
    
    let fuerteCrates = updateData.fuerte_crates !== undefined 
      ? parseInt(String(updateData.fuerte_crates)) 
      : Number(existingWeight.fuerte_crates) || 0;
    
    let hassWeight = updateData.hass_weight !== undefined 
      ? parseFloat(String(updateData.hass_weight)) 
      : Number(existingWeight.hass_weight) || 0;
    
    let hassCrates = updateData.hass_crates !== undefined 
      ? parseInt(String(updateData.hass_crates)) 
      : Number(existingWeight.hass_crates) || 0;

    // Validate at least one weight is provided
    if (fuerteWeight <= 0 && hassWeight <= 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'Please enter weight for at least one variety (Fuerte or Hass)'
        },
        { status: 400 }
      );
    }

    // Validate at least one crate count is provided
    if (fuerteCrates <= 0 && hassCrates <= 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'Please enter number of crates for at least one variety'
        },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalWeight = fuerteWeight + hassWeight;
    const totalCrates = fuerteCrates + hassCrates;

    // Create product description
    const productDescription = [];
    if (fuerteWeight > 0) productDescription.push(`Fuerte: ${fuerteWeight.toFixed(2)}kg`);
    if (hassWeight > 0) productDescription.push(`Hass: ${hassWeight.toFixed(2)}kg`);

    // Prepare update data
    const dataToUpdate: any = {
      // Update product description
      product: productDescription.join(', ') || existingWeight.product,
      
      // Update weight fields if changed
      ...(updateData.fuerte_weight !== undefined && {
        fuerte_weight: fuerteWeight > 0 ? fuerteWeight : null,
      }),
      ...(updateData.fuerte_crates !== undefined && {
        fuerte_crates: fuerteCrates > 0 ? fuerteCrates : null,
      }),
      ...(updateData.hass_weight !== undefined && {
        hass_weight: hassWeight > 0 ? hassWeight : null,
      }),
      ...(updateData.hass_crates !== undefined && {
        hass_crates: hassCrates > 0 ? hassCrates : null,
      }),
      
      // Update total weight and crates
      weight: totalWeight,
      net_weight: totalWeight,
      gross_weight: totalWeight,
      declared_weight: totalWeight,
      number_of_crates: totalCrates,
      
      // Update fruit variety info
      fruit_variety: JSON.stringify([
        ...(fuerteWeight > 0 ? ['Fuerte'] : []),
        ...(hassWeight > 0 ? ['Hass'] : [])
      ]),
      
      // Update per variety weights
      perVarietyWeights: JSON.stringify([
        ...(fuerteWeight > 0 ? [{
          variety: 'Fuerte',
          weight: fuerteWeight,
          crates: fuerteCrates
        }] : []),
        ...(hassWeight > 0 ? [{
          variety: 'Hass',
          weight: hassWeight,
          crates: hassCrates
        }] : [])
      ]),
      
      // Update other fields if provided
      ...(updateData.pallet_id && { pallet_id: updateData.pallet_id }),
      ...(updateData.supplier !== undefined && { supplier: updateData.supplier }),
      ...(updateData.supplier_id !== undefined && { supplier_id: updateData.supplier_id }),
      ...(updateData.supplier_phone !== undefined && { supplier_phone: updateData.supplier_phone }),
      ...(updateData.driver_name !== undefined && { driver_name: updateData.driver_name }),
      ...(updateData.driver_phone !== undefined && { driver_phone: updateData.driver_phone }),
      ...(updateData.vehicle_plate !== undefined && { vehicle_plate: updateData.vehicle_plate }),
      ...(updateData.region !== undefined && { region: updateData.region }),
      ...(updateData.notes !== undefined && { notes: updateData.notes }),
      
      // Always update the timestamp
      timestamp: new Date(),
    };

    console.log('💾 Updating weight entry with data:', dataToUpdate);

    // Update weight entry
    const updatedWeight = await prisma.weight_entries.update({
      where: { id },
      data: dataToUpdate,
    });

    console.log('✅ Weight entry updated successfully:', {
      id: updatedWeight.id,
      pallet_id: updatedWeight.pallet_id,
      supplier: updatedWeight.supplier
    });

    // Transform response for frontend
    const response = {
      id: updatedWeight.id,
      palletId: updatedWeight.pallet_id || '',
      pallet_id: updatedWeight.pallet_id || '',
      product: updatedWeight.product || '',
      weight: Number(updatedWeight.weight) || 0,
      unit: updatedWeight.unit as 'kg' | 'lb',
      timestamp: updatedWeight.timestamp?.toISOString() || updatedWeight.created_at.toISOString(),
      
      // Fruit weights
      fuerte_weight: Number(updatedWeight.fuerte_weight) || 0,
      fuerte_crates: Number(updatedWeight.fuerte_crates) || 0,
      hass_weight: Number(updatedWeight.hass_weight) || 0,
      hass_crates: Number(updatedWeight.hass_crates) || 0,
      
      // Supplier info
      supplier: updatedWeight.supplier || '',
      supplier_id: updatedWeight.supplier_id || '',
      supplier_phone: updatedWeight.supplier_phone || '',
      
      // Driver info
      driver_name: updatedWeight.driver_name || '',
      driver_phone: updatedWeight.driver_phone || '',
      driver_id_number: updatedWeight.driver_id_number || '',
      vehicle_plate: updatedWeight.vehicle_plate || '',
      
      // Other info
      region: updatedWeight.region || '',
      number_of_crates: updatedWeight.number_of_crates || 0,
      image_url: updatedWeight.image_url || '',
      notes: updatedWeight.notes || '',
      created_at: updatedWeight.created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Weight entry updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating weight entry:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Weight entry not found',
          details: 'The weight entry you are trying to update does not exist'
        },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Duplicate entry',
          details: 'A weight entry with this pallet ID already exists'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update weight entry',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

// PUT handler - Alternative update method
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Weight entry ID is required' },
        { status: 400 }
      );
    }

    // Forward to PATCH handler
    return PATCH(request);

  } catch (error: any) {
    console.error('Error in PUT handler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update weight entry',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE handler - Remove weight entry
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE /api/weights called');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: 'Weight entry ID is required'
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking for weight entry with ID: ${id}`);

    // Check if weight entry exists
    const weightEntry = await prisma.weight_entries.findUnique({
      where: { id },
      select: {
        id: true,
        pallet_id: true,
        supplier: true,
        supplier_id: true,
        driver_name: true,
        vehicle_plate: true,
        created_at: true,
      }
    });

    if (!weightEntry) {
      console.log(`❌ Weight entry ${id} not found`);
      return NextResponse.json(
        { 
          error: 'Weight entry not found',
          details: `No weight entry found with ID: ${id}`
        },
        { status: 404 }
      );
    }

    console.log(`📋 Found weight entry to delete:`, {
      id: weightEntry.id,
      pallet_id: weightEntry.pallet_id,
      supplier: weightEntry.supplier
    });

    // Check if there are dependent counting records
    const countingRecords = await prisma.counting_records.count({
      where: {
        weight_entry_id: id,
      },
    });

    if (countingRecords > 0) {
      console.log(`⚠️ Weight entry has ${countingRecords} counting records, deleting them first`);
      
      // Delete dependent counting records
      await prisma.counting_records.deleteMany({
        where: {
          weight_entry_id: id,
        },
      });
      
      console.log('✅ Counting records deleted');
    }

    // Check if there are dependent reject records
    const rejectRecords = await prisma.rejections.count({
      where: {
        weight_entry_id: id,
      },
    });

    if (rejectRecords > 0) {
      console.log(`⚠️ Weight entry has ${rejectRecords} rejection records, deleting them first`);
      
      // Delete dependent reject records
      await prisma.rejections.deleteMany({
        where: {
          weight_entry_id: id,
        },
      });
      
      console.log('✅ Rejection records deleted');
    }

    // Delete weight entry
    await prisma.weight_entries.delete({
      where: { id },
    });

    console.log('✅ Weight entry deleted successfully');

    // Check if this was the last weight entry for this supplier
    if (weightEntry.supplier_id) {
      const otherWeightEntries = await prisma.weight_entries.count({
        where: {
          supplier_id: weightEntry.supplier_id,
          id: { not: id }
        },
      });

      // If no other weight entries for this supplier, update their check-in status
      if (otherWeightEntries === 0) {
        try {
          await prisma.supplier_checkins.updateMany({
            where: {
              supplier_id: weightEntry.supplier_id,
              status: 'weighed'
            },
            data: {
              status: 'checked_in',
              updated_at: new Date()
            }
          });
          
          console.log(`🔄 Updated supplier ${weightEntry.supplier_id} status back to checked_in`);
        } catch (checkinError) {
          console.error('⚠️ Error updating supplier check-in status:', checkinError);
          // Continue even if check-in update fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Weight entry deleted successfully',
      data: {
        id: weightEntry.id,
        pallet_id: weightEntry.pallet_id,
        supplier: weightEntry.supplier,
        deleted_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error deleting weight entry:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          error: 'Weight entry not found',
          details: 'The weight entry you are trying to delete does not exist'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete weight entry',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET KPI data separately (alternative endpoint)
export async function GET_KPI(request: NextRequest) {
  try {
    console.log('📊 GET /api/weights/kpi called');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Count today's entries
    const todayCount = await prisma.weight_entries.count({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    
    // Count last hour's entries
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourCount = await prisma.weight_entries.count({
      where: {
        timestamp: {
          gte: lastHour,
        },
      },
    });
    
    const changeSinceLastHour = todayCount - lastHourCount;
    
    // Calculate total weight today
    const todayEntries = await prisma.weight_entries.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        fuerte_weight: true,
        hass_weight: true,
      },
    });
    
    const totalWeightToday = todayEntries.reduce((sum, entry) => {
      return sum + (Number(entry.fuerte_weight) || 0) + (Number(entry.hass_weight) || 0);
    }, 0);
    
    // Get unique suppliers today
    const uniqueSuppliers = await prisma.weight_entries.groupBy({
      by: ['supplier_id'],
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
        supplier_id: {
          not: null,
        },
      },
      _count: {
        supplier_id: true,
      },
    });
    
    const uniqueSuppliersCount = uniqueSuppliers.length;
    
    // Get pending suppliers (checked in but not weighed)
    const pendingSuppliers = await prisma.supplier_checkins.count({
      where: {
        status: 'checked_in',
        check_in_time: {
          gte: today,
        },
      },
    });
    
    const totalCheckedIn = await prisma.supplier_checkins.count({
      where: {
        check_in_time: {
          gte: today,
        },
      },
    });
    
    console.log('📈 KPI Data calculated:', {
      todayCount,
      changeSinceLastHour,
      totalWeightToday,
      uniqueSuppliersCount,
      pendingSuppliers,
      totalCheckedIn
    });
    
    return NextResponse.json({
      palletsWeighed: todayCount,
      changeSinceLastHour,
      totalWeight: totalWeightToday,
      totalWeightTons: (totalWeightToday / 1000).toFixed(1),
      uniqueSuppliers: uniqueSuppliersCount,
      pendingSuppliers,
      totalCheckedIn,
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching KPI data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch KPI data',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
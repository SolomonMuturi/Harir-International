import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;
    
    // Get supplier information
    const supplier = await prisma.suppliers.findUnique({
      where: { id: supplierId },
      select: {
        company_name: true,
        driver_name: true,
        vehicle_number_plate: true,
        contact_phone: true,
        check_in_time: true,
      },
    });
    
    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Get weight entries for this supplier
    const weightEntries = await prisma.weight_entries.findMany({
      where: { supplier_id: supplierId },
      select: {
        fruit_variety: true,
        net_weight: true,
        number_of_crates: true,
        timestamp: true,
        created_at: true,
      },
      orderBy: { timestamp: 'asc' },
    });
    
    // Process variety weights
    const varietyWeights: Record<string, { weight: number; crates: number }> = {};
    
    weightEntries.forEach(entry => {
      const varieties = typeof entry.fruit_variety === 'string' 
        ? JSON.parse(entry.fruit_variety || '[]')
        : entry.fruit_variety || [];
      
      const weight = entry.net_weight || 0;
      const crates = entry.number_of_crates || 0;
      const timestamp = entry.timestamp || entry.created_at;
      
      if (varieties.length === 0) {
        const key = 'Mixed';
        if (!varietyWeights[key]) {
          varietyWeights[key] = { weight: 0, crates: 0 };
        }
        varietyWeights[key].weight += weight;
        varietyWeights[key].crates += crates;
      } else {
        varieties.forEach((variety: string) => {
          if (!varietyWeights[variety]) {
            varietyWeights[variety] = { weight: 0, crates: 0 };
          }
          // Distribute weight evenly among varieties
          varietyWeights[variety].weight += weight / varieties.length;
          // Distribute crates evenly among varieties
          varietyWeights[variety].crates += Math.round(crates / varieties.length);
        });
      }
    });
    
    // Convert to array format
    const weightsArray = Object.entries(varietyWeights).map(([variety, data]) => ({
      variety,
      weight: data.weight,
      crates: data.crates,
      timestamp: weightEntries[0]?.timestamp?.toISOString() || weightEntries[0]?.created_at.toISOString() || new Date().toISOString(),
    }));
    
    // Calculate totals
    const totalWeight = weightsArray.reduce((sum, item) => sum + item.weight, 0);
    const totalCrates = weightsArray.reduce((sum, item) => sum + item.crates, 0);
    
    return NextResponse.json({
      supplier_id: supplierId,
      company_name: supplier.company_name,
      driver_name: supplier.driver_name,
      vehicle_plate: supplier.vehicle_number_plate,
      phone_number: supplier.contact_phone,
      check_in_time: supplier.check_in_time?.toISOString() || new Date().toISOString(),
      weights: weightsArray,
      total_weight: totalWeight,
      total_crates: totalCrates,
    });
    
  } catch (error: any) {
    console.error('Error generating GRN:', error);
    return NextResponse.json(
      { error: 'Failed to generate GRN' },
      { status: 500 }
    );
  }
}
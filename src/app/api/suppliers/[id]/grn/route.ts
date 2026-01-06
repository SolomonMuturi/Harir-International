import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';

interface SupplierGRNData {
  supplier_id: string;
  company_name: string;
  driver_name: string;
  vehicle_plate: string;
  phone_number: string;
  check_in_time: string;
  weights: Array<{
    variety: string;
    weight: number;
    crates: number;
    timestamp: string;
  }>;
  total_weight: number;
  total_crates: number;
  pallets: Array<{
    pallet_id: string;
    varieties: string[];
    weight: number;
    crates: number;
    time: string;
    region?: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15
    const { id: supplierId } = await params;
    
    console.log(`Generating GRN for supplier: ${supplierId}`);
    
    // Get supplier information from suppliers table
    const supplier = await prisma.suppliers.findUnique({
      where: { id: supplierId },
      select: {
        name: true,
        driver_name: true,
        contact_name: true,
        vehicle_number_plate: true,
        contact_phone: true,
        vehicle_check_in_time: true,
        produce_types: true,
        location: true,
      },
    });
    
    if (!supplier) {
      console.log('Supplier not found in suppliers table, checking weight_entries');
      
      // If supplier not found in suppliers table, check weight_entries
      const weightEntry = await prisma.weight_entries.findFirst({
        where: { supplier_id: supplierId },
        select: {
          supplier: true,
          driver_name: true,
          vehicle_plate: true,
          supplier_phone: true,
          created_at: true,
          region: true,
        },
      });
      
      if (!weightEntry) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        );
      }
      
      // Use weight entry data
      const supplierData = {
        name: weightEntry.supplier || 'Unknown Supplier',
        driver_name: weightEntry.driver_name || 'Unknown Driver',
        contact_name: weightEntry.driver_name || 'Unknown Driver',
        vehicle_number_plate: weightEntry.vehicle_plate || 'Unknown Vehicle',
        contact_phone: weightEntry.supplier_phone || 'N/A',
        vehicle_check_in_time: weightEntry.created_at,
        produce_types: '[]',
        location: weightEntry.region || '',
      };
      
      return await generateGRNData(supplierId, supplierData);
    }
    
    return await generateGRNData(supplierId, supplier);
    
  } catch (error: any) {
    console.error('❌ Error generating GRN:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate GRN',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function generateGRNData(supplierId: string, supplier: any) {
  // Get weight entries for this supplier
  const weightEntries = await prisma.weight_entries.findMany({
    where: { 
      OR: [
        { supplier_id: supplierId },
        { supplier: supplier.name }
      ]
    },
    select: {
      pallet_id: true,
      fruit_variety: true,
      net_weight: true,
      number_of_crates: true,
      timestamp: true,
      created_at: true,
      supplier: true,
      driver_name: true,
      vehicle_plate: true,
      supplier_phone: true,
      region: true,
    },
    orderBy: { timestamp: 'asc' },
  });
  
  if (weightEntries.length === 0) {
    // Return basic supplier info with empty weights
    return NextResponse.json({
      supplier_id: supplierId,
      company_name: supplier.name || 'Unknown Supplier',
      driver_name: supplier.driver_name || supplier.contact_name || 'Unknown Driver',
      vehicle_plate: supplier.vehicle_number_plate || 'Unknown Vehicle',
      phone_number: supplier.contact_phone || 'N/A',
      check_in_time: supplier.vehicle_check_in_time?.toISOString() || new Date().toISOString(),
      weights: [],
      total_weight: 0,
      total_crates: 0,
      pallets: [],
    });
  }
  
  // Parse fruit varieties from supplier produce_types
  let supplierFruitVarieties: string[] = [];
  if (supplier.produce_types) {
    try {
      if (typeof supplier.produce_types === 'string') {
        const parsed = JSON.parse(supplier.produce_types);
        if (Array.isArray(parsed)) {
          supplierFruitVarieties = parsed;
        }
      } else if (Array.isArray(supplier.produce_types)) {
        supplierFruitVarieties = supplier.produce_types;
      }
    } catch (error) {
      console.log('Could not parse produce_types, using empty array');
    }
  }
  
  // Process variety weights
  const varietyWeights: Record<string, { weight: number; crates: number }> = {};
  const pallets: Array<{
    pallet_id: string;
    varieties: string[];
    weight: number;
    crates: number;
    time: string;
    region?: string;
  }> = [];
  
  let totalWeight = 0;
  let totalCrates = 0;
  
  weightEntries.forEach(entry => {
    // FIX: Convert to numbers to prevent .toFixed() error
    const weight = Number(entry.net_weight) || 0;
    const crates = Number(entry.number_of_crates) || 0;
    const timestamp = entry.timestamp || entry.created_at;
    
    totalWeight += weight;
    totalCrates += crates;
    
    // Parse fruit varieties from weight entry
    const entryVarieties = typeof entry.fruit_variety === 'string' 
      ? (() => {
          try {
            return JSON.parse(entry.fruit_variety || '[]');
          } catch {
            if (entry.fruit_variety && typeof entry.fruit_variety === 'string') {
              return entry.fruit_variety.split(',').map(v => v.trim());
            }
            return [];
          }
        })()
      : entry.fruit_variety || [];
    
    // Use entry varieties if available, otherwise use supplier varieties
    const finalVarieties = entryVarieties.length > 0 ? entryVarieties : supplierFruitVarieties;
    
    // Add pallet info with ensured number types
    pallets.push({
      pallet_id: entry.pallet_id || `PAL-${pallets.length + 1}`,
      varieties: Array.isArray(finalVarieties) ? finalVarieties : [],
      weight: weight,
      crates: crates,
      time: format(timestamp, 'HH:mm'),
      region: entry.region || supplier.location || '',
    });
    
    if (finalVarieties.length === 0 || !Array.isArray(finalVarieties)) {
      const key = 'Mixed';
      if (!varietyWeights[key]) {
        varietyWeights[key] = { weight: 0, crates: 0 };
      }
      varietyWeights[key].weight += weight;
      varietyWeights[key].crates += crates;
    } else {
      finalVarieties.forEach((variety: string) => {
        if (!varietyWeights[variety]) {
          varietyWeights[variety] = { weight: 0, crates: 0 };
        }
        // Distribute weight evenly among varieties
        varietyWeights[variety].weight += weight / finalVarieties.length;
        // Distribute crates evenly among varieties
        varietyWeights[variety].crates += Math.round(crates / finalVarieties.length);
      });
    }
  });
  
  // Convert variety weights to array format
  const weightsArray = Object.entries(varietyWeights).map(([variety, data]) => ({
    variety,
    weight: data.weight,
    crates: data.crates,
    timestamp: weightEntries[0]?.timestamp?.toISOString() || weightEntries[0]?.created_at.toISOString() || new Date().toISOString(),
  }));
  
  return NextResponse.json({
    supplier_id: supplierId,
    company_name: supplier.name || weightEntries[0]?.supplier || 'Unknown Supplier',
    driver_name: supplier.driver_name || supplier.contact_name || weightEntries[0]?.driver_name || 'Unknown Driver',
    vehicle_plate: supplier.vehicle_number_plate || weightEntries[0]?.vehicle_plate || 'Unknown Vehicle',
    phone_number: supplier.contact_phone || weightEntries[0]?.supplier_phone || 'N/A',
    check_in_time: supplier.vehicle_check_in_time?.toISOString() || weightEntries[0]?.created_at.toISOString() || new Date().toISOString(),
    weights: weightsArray,
    total_weight: totalWeight,
    total_crates: totalCrates,
    pallets: pallets,
  });
}
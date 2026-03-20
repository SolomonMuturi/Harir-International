import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Create URL for the target endpoint
    const targetUrl = new URL('/api/quality-checks', request.url)
    
    // Copy query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value)
    })
    
    // Forward the request to quality-checks endpoint
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward any other headers if needed
      },
      // You can add cache settings if needed
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      throw new Error(`Quality checks API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform data to match your UI interface if needed
    const transformedData = Array.isArray(data) ? data.map(item => ({
      id: item.id,
      pallet_id: item.pallet_id || item.id,
      supplier_name: item.supplier || item.supplier_name || 'Unknown Supplier',
      supplier_phone: item.supplier_phone || '',
      driver_name: item.driver_name || '',
      vehicle_plate: item.vehicle_plate || item.truck_id || '',
      total_weight: Number(item.net_weight) || Number(item.declared_weight) || 0,
      fruit_varieties: parseFruitVarieties(item.fruit_variety, item.product),
      region: item.region || '',
      timestamp: item.timestamp || item.created_at || item.processed_at || new Date().toISOString(),
      status: item.overall_status ? 'qc_completed' : 'pending_qc',
      qc_decision: item.overall_status === 'approved' ? 'Accepted' : 'Declined',
      qc_timestamp: item.processed_at,
      qc_fuerte_class1: item.fuerte_class1 || 0,
      qc_fuerte_class2: item.fuerte_class2 || 0,
      qc_hass_class1: item.hass_class1 || 0,
      qc_hass_class2: item.hass_class2 || 0,
      qc_fuerte_overall: item.fuerte_overall || 0,
      qc_hass_overall: item.hass_overall || 0
    })) : []
    
    return NextResponse.json(transformedData)
    
  } catch (error) {
    console.error('Error proxying to quality-checks:', error)
    
    // Fallback to sample data if proxy fails
    const sampleSuppliers = getSampleSuppliers()
    return NextResponse.json(sampleSuppliers)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Transform UI data to match quality-checks API format
    const qcData = {
      ...body,
      // Ensure proper field names for your quality-checks API
      fuerte_class1: body.fuerteClass1 ? parseFloat(body.fuerteClass1) : null,
      fuerte_class2: body.fuerteClass2 ? parseFloat(body.fuerteClass2) : null,
      fuerte_overall: body.fuerteOverall || calculateOverall(body.fuerteClass1, body.fuerteClass2),
      hass_class1: body.hassClass1 ? parseFloat(body.hassClass1) : null,
      hass_class2: body.hassClass2 ? parseFloat(body.hassClass2) : null,
      hass_overall: body.hassOverall || calculateOverall(body.hassClass1, body.hassClass2),
      // Remove UI-specific field names if needed
      fuerteClass1: undefined,
      fuerteClass2: undefined,
      hassClass1: undefined,
      hassClass2: undefined
    }
    
    // Forward to quality-checks endpoint
    const response = await fetch(new URL('/api/quality-checks', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qcData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to save QC: ${response.status}`)
    }
    
    const result = await response.json()
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error posting to quality-checks:', error)
    return NextResponse.json(
      { error: 'Failed to save quality check' },
      { status: 500 }
    )
  }
}

// Helper function to parse fruit varieties
function parseFruitVarieties(fruitVarietyString: string, product: string) {
  if (!fruitVarietyString || fruitVarietyString === '[]') {
    return [{ name: product || 'Avocado', weight: 0, crates: 0 }]
  }
  
  try {
    return JSON.parse(fruitVarietyString)
  } catch {
    return [{ name: product || 'Avocado', weight: 0, crates: 0 }]
  }
}

// Helper function to calculate overall percentage
function calculateOverall(class1: string, class2: string): number {
  const c1 = parseFloat(class1) || 0
  const c2 = parseFloat(class2) || 0
  return c1 + c2
}

// Sample data fallback (same as in your UI)
function getSampleSuppliers() {
  return [
    {
      id: 'supplier-1',
      pallet_id: 'SUP123/20240115',
      supplier_name: 'Green Valley Farms',
      supplier_phone: '+254 712 345 678',
      driver_name: 'John Kamau',
      vehicle_plate: 'KDA 123A',
      total_weight: 450.5,
      fruit_varieties: [
        { name: 'Avocado Fuerte', weight: 250, crates: 25 },
        { name: 'Avocado Hass', weight: 200.5, crates: 20 }
      ],
      region: 'Central',
      timestamp: new Date().toISOString(),
      status: 'pending_qc'
    },
    // ... other sample suppliers
  ]
}
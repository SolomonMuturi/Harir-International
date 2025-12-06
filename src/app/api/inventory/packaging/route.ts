import { NextRequest, NextResponse } from 'next/server';

// Mock data for packaging materials
const mockPackagingMaterials = [
  {
    id: '1',
    name: 'Cardboard Boxes (Small)',
    category: 'Boxes',
    unit: 'pieces',
    currentStock: 2500,
    reorderLevel: 1000,
    dimensions: '30x20x15 cm',
    lastUsedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    consumptionRate: 'high' as const,
  },
  {
    id: '2',
    name: 'Cardboard Boxes (Large)',
    category: 'Boxes',
    unit: 'pieces',
    currentStock: 1200,
    reorderLevel: 500,
    dimensions: '50x40x30 cm',
    lastUsedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    consumptionRate: 'high' as const,
  },
  {
    id: '3',
    name: 'Plastic Wrap',
    category: 'Wrapping',
    unit: 'rolls',
    currentStock: 85,
    reorderLevel: 30,
    dimensions: '50cm x 100m',
    lastUsedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    consumptionRate: 'high' as const,
  },
  {
    id: '4',
    name: 'QR Code Labels',
    category: 'Labels',
    unit: 'rolls',
    currentStock: 15,
    reorderLevel: 20,
    dimensions: '10x5 cm',
    lastUsedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    consumptionRate: 'medium' as const,
  },
  {
    id: '5',
    name: 'Pallet Sheets',
    category: 'Protective',
    unit: 'sheets',
    currentStock: 300,
    reorderLevel: 100,
    dimensions: '120x100 cm',
    lastUsedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    consumptionRate: 'medium' as const,
  },
];

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let data = [...mockPackagingMaterials];
    
    if (limit && limit < data.length) {
      data = data.slice(0, limit);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching packaging materials:', error);
    return NextResponse.json(mockPackagingMaterials.slice(0, 2));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.category || !body.unit) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, unit' },
        { status: 400 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newMaterial = {
      id: `pkg-${Date.now()}`,
      name: body.name,
      category: body.category,
      unit: body.unit,
      currentStock: body.currentStock || 0,
      reorderLevel: body.reorderLevel || 10,
      dimensions: body.dimensions || '',
      lastUsedDate: new Date().toISOString(),
      consumptionRate: body.consumptionRate || 'medium',
    };
    
    mockPackagingMaterials.unshift(newMaterial);
    
    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error('Error creating packaging material:', error);
    return NextResponse.json(
      { error: 'Failed to create packaging material' },
      { status: 500 }
    );
  }
}
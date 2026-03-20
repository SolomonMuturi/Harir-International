import { NextRequest, NextResponse } from 'next/server';

// Mock data for cold room inventory
const mockColdRoomInventory = [
  {
    id: '1',
    product: 'Apples',
    quantity: 25,
    unit: 'pallets' as const,
    location: 'CR-01-A1',
    temperature: 2,
    humidity: 85,
    entryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'fresh' as const,
    supplier: 'Fresh Farms Inc.',
  },
  {
    id: '2',
    product: 'Bananas',
    quantity: 15,
    unit: 'pallets' as const,
    location: 'CR-01-A2',
    temperature: 13,
    humidity: 90,
    entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'fresh' as const,
    supplier: 'Tropical Harvest',
  },
  {
    id: '3',
    product: 'Oranges',
    quantity: 8,
    unit: 'tonnes' as const,
    location: 'CR-02-B1',
    temperature: 4,
    humidity: 80,
    entryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'aging' as const,
    supplier: 'Citrus Grove',
  },
  {
    id: '4',
    product: 'Berries',
    quantity: 120,
    unit: 'boxes' as const,
    location: 'CR-02-B2',
    temperature: 1,
    humidity: 95,
    entryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'fresh' as const,
    supplier: 'Berry Fields',
  },
];

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let data = [...mockColdRoomInventory];
    
    if (limit && limit < data.length) {
      data = data.slice(0, limit);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cold room inventory:', error);
    return NextResponse.json(mockColdRoomInventory.slice(0, 2));
  }
}
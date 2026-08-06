import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, ['loading.view', 'inventory.view']);
  if (auth.error) return auth.error;

  try {
    console.log('📦 Fetching outbound shipments...');
    
    const shipments = await prisma.shipments.findMany({
      where: {
        OR: [
          { status: 'Preparing_for_Dispatch' },
          { status: 'Ready_for_Dispatch' }
        ]
      },
      orderBy: {
        expected_arrival: 'asc'
      },
      include: {
        customers: true
      }
    });
    
    console.log(`✅ Found ${shipments.length} outbound shipments`);
    
    return NextResponse.json({
      success: true,
      data: shipments
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching outbound shipments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch shipments',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
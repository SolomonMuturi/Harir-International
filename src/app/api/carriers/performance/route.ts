import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching carrier performance data...');
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    
    // Build date filter
    const dateFilter: any = {};
    if (fromDate) {
      dateFilter.gte = new Date(fromDate);
    }
    if (toDate) {
      dateFilter.lte = new Date(toDate);
    }
    
    // Fetch all shipments with carrier info
    const shipments = await prisma.shipments.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        carrier: { not: null } // Only shipments with carriers
      },
      select: {
        id: true,
        shipment_id: true,
        carrier: true,
        status: true,
        expected_arrival: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`📦 Found ${shipments.length} shipments with carriers`);
    
    // Group shipments by carrier
    const carrierStats: Record<string, {
      carrier: string;
      total: number;
      onTime: number;
      delayed: number;
      inTransit: number;
      other: number;
    }> = {};
    
    shipments.forEach(shipment => {
      if (!shipment.carrier) return;
      
      if (!carrierStats[shipment.carrier]) {
        carrierStats[shipment.carrier] = {
          carrier: shipment.carrier,
          total: 0,
          onTime: 0,
          delayed: 0,
          inTransit: 0,
          other: 0
        };
      }
      
      const stats = carrierStats[shipment.carrier];
      stats.total++;
      
      // Categorize by status
      switch (shipment.status) {
        case 'Delivered':
          // Check if delivered on time
          if (shipment.expected_arrival && shipment.created_at) {
            const expectedDate = new Date(shipment.expected_arrival);
            const createdDate = new Date(shipment.created_at);
            // Simple check: delivered within 2 days of expected
            const timeDiff = Math.abs(expectedDate.getTime() - createdDate.getTime());
            const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            if (dayDiff <= 2) {
              stats.onTime++;
            } else {
              stats.delayed++;
            }
          } else {
            stats.onTime++; // Assume on-time if no expected date
          }
          break;
        case 'Delayed':
          stats.delayed++;
          break;
        case 'In_Transit':
          stats.inTransit++;
          break;
        default:
          stats.other++;
      }
    });
    
    // Convert to array and calculate percentages
    const performanceData = Object.values(carrierStats).map(stats => ({
      carrier: stats.carrier,
      total: stats.total,
      onTime: stats.onTime,
      delayed: stats.delayed,
      inTransit: stats.inTransit,
      other: stats.other,
      onTimePercentage: stats.total > 0 ? (stats.onTime / stats.total) * 100 : 0,
      delayedPercentage: stats.total > 0 ? (stats.delayed / stats.total) * 100 : 0,
      performanceScore: stats.total > 0 ? 
        ((stats.onTime * 1.0 + stats.inTransit * 0.5 - stats.delayed * 0.5) / stats.total) * 100 : 0
    }));
    
    // Sort by performance score (descending)
    performanceData.sort((a, b) => b.performanceScore - a.performanceScore);
    
    console.log(`📊 Generated performance data for ${performanceData.length} carriers`);
    
    return NextResponse.json({
      success: true,
      data: performanceData,
      summary: {
        totalCarriers: performanceData.length,
        totalShipments: shipments.length,
        averageOnTimePercentage: performanceData.length > 0 ? 
          performanceData.reduce((sum, carrier) => sum + carrier.onTimePercentage, 0) / performanceData.length : 0,
        topPerformer: performanceData[0] || null
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching carrier performance:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch carrier performance data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
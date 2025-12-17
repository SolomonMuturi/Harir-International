import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching outbound statistics...');
    
    // Get counts from database
    const [
      totalLoadingSheets,
      containersLoaded,
      activeCarriers,
      totalAssignments
    ] = await Promise.all([
      // Count loading sheets
      prisma.loading_sheets.count(),
      
      // Count loading sheets with containers
      prisma.loading_sheets.count({
        where: {
          container: { not: null }
        }
      }),
      
      // Count active carriers
      prisma.carriers.count({
        where: {
          status: 'Active'
        }
      }),
      
      // For now, return 0 for assignments (you'll need an assignments table)
      0
    ]);
    
    // Calculate derived statistics
    const pendingAssignments = Math.floor(totalAssignments * 0.3); // Simulated
    const completedAssignments = totalAssignments - pendingAssignments;
    
    const stats = {
      totalLoadingSheets,
      containersLoaded,
      activeCarriers,
      totalAssignments,
      pendingAssignments,
      completedAssignments
    };
    
    console.log('✅ Outbound stats:', stats);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching outbound stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch statistics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
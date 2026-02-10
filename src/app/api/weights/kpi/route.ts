import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
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
    
    // Count entries from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourCount = await prisma.weight_entries.count({
      where: {
        timestamp: {
          gte: oneHourAgo,
        },
      },
    });
    
    // Calculate change since last hour
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
        supplier_id: true,
      },
    });
    
    const totalWeightToday = todayEntries.reduce((sum, entry) => {
      return sum + (Number(entry.fuerte_weight) || 0) + (Number(entry.hass_weight) || 0);
    }, 0);
    
    // Get unique suppliers today
    const uniqueSuppliers = new Set(
      todayEntries
        .filter(entry => entry.supplier_id)
        .map(entry => entry.supplier_id)
    ).size;
    
    // Get pending suppliers (checked in but not weighed)
    const pendingSuppliers = await prisma.supplier_checkins.count({
      where: {
        status: 'checked_in',
        check_in_time: {
          gte: today,
        },
      },
    });
    
    // Get total checked-in today
    const totalCheckedIn = await prisma.supplier_checkins.count({
      where: {
        check_in_time: {
          gte: today,
        },
      },
    });
    
    // FIXED: Changed from 'rejections' to 'rejects' to match Prisma schema
    // Calculate rejects for today
    const todayRejects = await prisma.rejects.count({
      where: {
        rejected_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    
    console.log('📈 KPI Data calculated:', {
      todayCount,
      changeSinceLastHour,
      totalWeightToday,
      uniqueSuppliers,
      pendingSuppliers,
      totalCheckedIn,
      todayRejects
    });
    
    return NextResponse.json({
      success: true,
      data: {
        todayCount,
        changeSinceLastHour,
        totalWeightToday,
        totalWeightTons: (totalWeightToday / 1000).toFixed(1),
        uniqueSuppliers,
        pendingSuppliers,
        totalCheckedIn,
        todayRejects,
        lastUpdated: new Date().toISOString(),
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching KPI data:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch KPI data',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Count today's pallets
    const todayCount = await prisma.weight_entries.count({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    // Count pallets since last hour
    const lastHourCount = await prisma.weight_entries.count({
      where: {
        timestamp: {
          gte: oneHourAgo
        }
      }
    });
    
    // Calculate change since last hour
    const changeSinceLastHour = todayCount - lastHourCount;
    
    // Calculate total weight today
    const todayWeights = await prisma.weight_entries.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        fuerte_weight: true,
        hass_weight: true
      }
    });
    
    const totalWeightToday = todayWeights.reduce((sum, entry) => {
      const fuerte = entry.fuerte_weight ? parseFloat(entry.fuerte_weight.toString()) : 0;
      const hass = entry.hass_weight ? parseFloat(entry.hass_weight.toString()) : 0;
      return sum + fuerte + hass;
    }, 0);
    
    // Count checked-in suppliers
    const checkedInSuppliers = await prisma.supplier_checkins.count({
      where: {
        check_in_time: {
          gte: today,
          lt: tomorrow
        },
        status: 'checked_in'
      }
    });
    
    // Count suppliers processed today
    const processedSuppliers = await prisma.supplier_checkins.count({
      where: {
        check_in_time: {
          gte: today,
          lt: tomorrow
        },
        status: 'weighed'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        todayCount,
        changeSinceLastHour,
        totalWeightToday,
        checkedInSuppliers,
        processedSuppliers,
        pendingSuppliers: checkedInSuppliers - processedSuppliers
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching KPI data:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch KPI data',
        message: error.message
      },
      { status: 500 }
    );
  }
}
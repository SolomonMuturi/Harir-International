import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // Changed from { db } to { prisma }

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's count from weight_entries table
    const todayCount = await prisma.weight_entries.count({
      where: {
        OR: [
          {
            timestamp: {
              gte: today,
              lt: tomorrow,
            },
          },
          {
            AND: [
              { timestamp: null },
              {
                created_at: {
                  gte: today,
                  lt: tomorrow,
                },
              },
            ],
          },
        ],
      },
    });

    // Get count from last hour
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourCount = await prisma.weight_entries.count({
      where: {
        OR: [
          {
            timestamp: {
              gte: lastHour,
              lt: new Date(),
            },
          },
          {
            AND: [
              { timestamp: null },
              {
                created_at: {
                  gte: lastHour,
                  lt: new Date(),
                },
              },
            ],
          },
        ],
      },
    });

    // Get today's total weight
    const todayWeights = await prisma.weight_entries.findMany({
      where: {
        OR: [
          {
            timestamp: {
              gte: today,
              lt: tomorrow,
            },
          },
          {
            AND: [
              { timestamp: null },
              {
                created_at: {
                  gte: today,
                  lt: tomorrow,
                },
              },
            ],
          },
        ],
      },
      select: {
        net_weight: true,
        declared_weight: true,
      },
    });

    // Calculate total weight
    const totalWeightToday = todayWeights.reduce(
      (sum, entry) => sum + (entry.net_weight || 0),
      0
    );

    // Calculate discrepancy rate
    let discrepancyRate = 0;
    const totalDeclared = todayWeights.reduce(
      (sum, entry) => sum + (entry.declared_weight || entry.net_weight || 0),
      0
    );
    
    if (totalDeclared > 0) {
      const totalActual = todayWeights.reduce(
        (sum, entry) => sum + (entry.net_weight || 0),
        0
      );
      discrepancyRate = Math.abs(totalDeclared - totalActual) / totalDeclared * 100;
    }

    return NextResponse.json({
      todayCount,
      changeSinceLastHour: todayCount - lastHourCount,
      totalWeightToday,
      discrepancyRate: parseFloat(discrepancyRate.toFixed(2)),
    });
  } catch (error: any) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json(
      {
        todayCount: 0,
        changeSinceLastHour: 0,
        totalWeightToday: 0,
        discrepancyRate: 0,
      },
      { status: 500 }
    );
  }
}
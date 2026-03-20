import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const formatType = searchParams.get('format') || 'csv';

    // Build where clause
    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const readings = await prisma.utility_readings.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Parse metadata
    const parsedReadings = readings.map(reading => {
      const metadata = reading.metadata ? JSON.parse(reading.metadata as string) : {};
      
      return {
        id: reading.id,
        date: format(new Date(reading.date), 'yyyy-MM-dd'),
        recordedBy: reading.recordedBy,
        shift: reading.shift,
        notes: reading.notes,
        
        // Power
        powerOfficeConsumed: metadata.powerOfficeConsumed || 0,
        powerMachineConsumed: metadata.powerMachineConsumed || 0,
        powerColdroom1Consumed: metadata.powerColdroom1Consumed || 0,
        powerColdroom2Consumed: metadata.powerColdroom2Consumed || 0,
        powerOtherConsumed: metadata.powerOtherConsumed || 0,
        totalPowerConsumed: reading.powerConsumed,
        
        // Water
        waterMeter1Consumed: metadata.waterMeter1Consumed || 0,
        waterMeter2Consumed: metadata.waterMeter2Consumed || 0,
        totalWaterConsumed: reading.waterConsumed,
        
        // Generator
        generatorStart: reading.generatorStart,
        generatorStop: reading.generatorStop,
        runtime: reading.timeConsumed,
        dieselConsumed: reading.dieselConsumed,
        dieselRefill: reading.dieselRefill,
        
        // Internet
        internetSafaricom: metadata.internetSafaricom || 0,
        internet5G: metadata.internet5G || 0,
        internetSyokinet: metadata.internetSyokinet || 0,
        totalInternetCost: (metadata.internetSafaricom || 0) + (metadata.internet5G || 0) + (metadata.internetSyokinet || 0),
      };
    });

    if (formatType === 'json') {
      return NextResponse.json(parsedReadings);
    }

    // Convert to CSV
    const headers = [
      'Date',
      'Recorded By',
      'Shift',
      'Power Office (kWh)',
      'Power Machine (kWh)',
      'Power Coldroom 1 (kWh)',
      'Power Coldroom 2 (kWh)',
      'Power Other (kWh)',
      'Total Power (kWh)',
      'Water Meter 1 (m³)',
      'Water Meter 2 (m³)',
      'Total Water (m³)',
      'Generator Start',
      'Generator Stop',
      'Runtime',
      'Diesel Consumed (L)',
      'Diesel Refill (L)',
      'Internet Safaricom (KES)',
      'Internet 5G (KES)',
      'Internet Syokinet (KES)',
      'Total Internet (KES)',
      'Notes',
    ];

    const csvRows = parsedReadings.map(reading => [
      reading.date,
      reading.recordedBy,
      reading.shift || '',
      reading.powerOfficeConsumed,
      reading.powerMachineConsumed,
      reading.powerColdroom1Consumed,
      reading.powerColdroom2Consumed,
      reading.powerOtherConsumed,
      reading.totalPowerConsumed,
      reading.waterMeter1Consumed,
      reading.waterMeter2Consumed,
      reading.totalWaterConsumed,
      reading.generatorStart,
      reading.generatorStop,
      reading.runtime,
      reading.dieselConsumed,
      reading.dieselRefill || '',
      reading.internetSafaricom,
      reading.internet5G,
      reading.internetSyokinet,
      reading.totalInternetCost,
      reading.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create response with CSV file
    const response = new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="utility-readings-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });

    return response;

  } catch (error) {
    console.error('Error exporting utility readings:', error);
    return NextResponse.json(
      { error: 'Failed to export utility readings' },
      { status: 500 }
    );
  }
}
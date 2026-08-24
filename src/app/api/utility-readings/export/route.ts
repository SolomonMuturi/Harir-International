import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { requirePermission } from '@/lib/api-auth';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, ['utilities.view', 'utilities.reports']);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const formatType = searchParams.get('format') || 'xlsx';

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
    const powerOpeningKeys = ['powerOfficeOpening', 'powerMachineOpening', 'powerColdroom1Opening', 'powerColdroom2Opening', 'powerOtherOpening'];
    const powerClosingKeys = ['powerOfficeClosing', 'powerMachineClosing', 'powerColdroom1Closing', 'powerColdroom2Closing', 'powerOtherClosing'];

    const parsedReadings = readings.map(reading => {
      const metadata = reading.metadata ? JSON.parse(reading.metadata as string) : {};

      return {
        id: reading.id,
        date: format(new Date(reading.date), 'yyyy-MM-dd'),
        recordedBy: reading.recordedBy,
        shift: reading.shift,
        notes: reading.notes,

        // Power
        powerOpening: powerOpeningKeys.reduce((sum, key) => sum + Number(metadata[key] || 0), 0),
        powerClosing: powerClosingKeys.reduce((sum, key) => sum + Number(metadata[key] || 0), 0),
        totalPowerConsumed: reading.powerConsumed,

        // Water
        waterOpening: Number(metadata.waterMeter1Opening || 0) + Number(metadata.waterMeter2Opening || 0),
        waterClosing: Number(metadata.waterMeter1Closing || 0) + Number(metadata.waterMeter2Closing || 0),
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

    // Build XLSX workbook
    const headers = [
      'Date',
      'Recorded By',
      'Shift',
      'Power Opening (kWh)',
      'Power Closing (kWh)',
      'Power Consumed (kWh)',
      'Water Opening (m³)',
      'Water Closing (m³)',
      'Water Consumed (m³)',
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

    const dataRows = parsedReadings.map(reading => [
      reading.date,
      reading.recordedBy,
      reading.shift || '',
      reading.powerOpening,
      reading.powerClosing,
      reading.totalPowerConsumed,
      reading.waterOpening,
      reading.waterClosing,
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

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws['!cols'] = headers.map(header => ({ wch: Math.max(header.length + 2, 16) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utility Readings');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="utility-readings-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error exporting utility readings:', error);
    return NextResponse.json(
      { error: 'Failed to export utility readings' },
      { status: 500 }
    );
  }
}
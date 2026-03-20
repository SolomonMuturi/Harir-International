import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Enhanced schema with all equipment data - all fields optional
const utilityReadingInputSchema = z.object({
  // Power readings by area
  powerOfficeOpening: z.string().optional().nullable(),
  powerOfficeClosing: z.string().optional().nullable(),
  powerMachineOpening: z.string().optional().nullable(),
  powerMachineClosing: z.string().optional().nullable(),
  powerColdroom1Opening: z.string().optional().nullable(),
  powerColdroom1Closing: z.string().optional().nullable(),
  powerColdroom2Opening: z.string().optional().nullable(),
  powerColdroom2Closing: z.string().optional().nullable(),
  powerOtherOpening: z.string().optional().nullable(),
  powerOtherClosing: z.string().optional().nullable(),
  powerOtherActivity: z.string().optional().nullable(),
  
  // Water readings for two meters
  waterMeter1Opening: z.string().optional().nullable(),
  waterMeter1Closing: z.string().optional().nullable(),
  waterMeter2Opening: z.string().optional().nullable(),
  waterMeter2Closing: z.string().optional().nullable(),
  
  // Internet costs (monthly)
  internetSafaricom: z.string().optional().nullable(),
  internet5G: z.string().optional().nullable(),
  internetSyokinet: z.string().optional().nullable(),
  internetBillingCycle: z.string().optional().nullable(),
  
  // Generator data
  generatorStart: z.string().optional().nullable(),
  generatorStop: z.string().optional().nullable(),
  generatorCode: z.string().optional().nullable(),
  generatorName: z.string().optional().nullable(),
  
  // Diesel
  dieselRefill: z.string().optional().nullable(),
  dieselConsumed: z.string().optional().nullable(),
  
  // Record details
  recordedBy: z.string().min(1, 'Recorded by is required'),
  shift: z.enum(['Morning', 'Evening', 'Night']).optional().nullable(),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  
  // Equipment status
  coldroom1Temp: z.string().optional().nullable(),
  coldroom2Temp: z.string().optional().nullable(),
  machineStatus: z.string().optional().nullable(),
  
  // Water meter details
  waterMeter1Number: z.string().optional().nullable(),
  waterMeter2Number: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = utilityReadingInputSchema.parse(body);

    // Get existing reading for today if exists
    const today = parsed.date ? new Date(parsed.date) : new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingReading = await prisma.utility_readings.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        recordedBy: parsed.recordedBy,
      },
    });

    // Parse existing metadata or create new
    let existingMetadata: any = {};
    if (existingReading?.metadata) {
      try {
        existingMetadata = JSON.parse(existingReading.metadata as string);
      } catch (error) {
        console.error('Error parsing existing metadata:', error);
      }
    }

    // Initialize totals
    let totalPowerConsumed = existingReading ? parseFloat(existingReading.powerConsumed) || 0 : 0;
    let totalWaterConsumed = existingReading ? parseFloat(existingReading.waterConsumed) || 0 : 0;
    let timeConsumed = existingReading?.timeConsumed || '';
    let dieselConsumed = existingReading ? parseFloat(existingReading.dieselConsumed) || 0 : 0;
    let dieselRefill = existingReading?.dieselRefill || null;

    // Merge new metadata with existing
    const metadata: any = { ...existingMetadata };

    // Update power readings if provided
    if (parsed.powerOfficeOpening !== undefined || parsed.powerOfficeClosing !== undefined) {
      const powerOfficeOpening = parsed.powerOfficeOpening ? parseFloat(parsed.powerOfficeOpening) : (metadata.powerOfficeClosing || 0);
      const powerOfficeClosing = parsed.powerOfficeClosing ? parseFloat(parsed.powerOfficeClosing) : (metadata.powerOfficeClosing || 0);
      
      if (powerOfficeClosing < powerOfficeOpening) {
        return NextResponse.json(
          { error: 'Office Power closing reading must be greater than opening reading' },
          { status: 400 }
        );
      }

      const powerOfficeConsumed = powerOfficeClosing - powerOfficeOpening;
      metadata.powerOfficeOpening = powerOfficeOpening;
      metadata.powerOfficeClosing = powerOfficeClosing;
      metadata.powerOfficeConsumed = powerOfficeConsumed;
      
      // Update total power consumed
      totalPowerConsumed = (totalPowerConsumed || 0) - (existingMetadata.powerOfficeConsumed || 0) + powerOfficeConsumed;
    }

    if (parsed.powerMachineOpening !== undefined || parsed.powerMachineClosing !== undefined) {
      const powerMachineOpening = parsed.powerMachineOpening ? parseFloat(parsed.powerMachineOpening) : (metadata.powerMachineClosing || 0);
      const powerMachineClosing = parsed.powerMachineClosing ? parseFloat(parsed.powerMachineClosing) : (metadata.powerMachineClosing || 0);
      
      if (powerMachineClosing < powerMachineOpening) {
        return NextResponse.json(
          { error: 'Machine Power closing reading must be greater than opening reading' },
          { status: 400 }
        );
      }

      const powerMachineConsumed = powerMachineClosing - powerMachineOpening;
      metadata.powerMachineOpening = powerMachineOpening;
      metadata.powerMachineClosing = powerMachineClosing;
      metadata.powerMachineConsumed = powerMachineConsumed;
      
      totalPowerConsumed = (totalPowerConsumed || 0) - (existingMetadata.powerMachineConsumed || 0) + powerMachineConsumed;
    }

    if (parsed.powerColdroom1Opening !== undefined || parsed.powerColdroom1Closing !== undefined) {
      const powerColdroom1Opening = parsed.powerColdroom1Opening ? parseFloat(parsed.powerColdroom1Opening) : (metadata.powerColdroom1Closing || 0);
      const powerColdroom1Closing = parsed.powerColdroom1Closing ? parseFloat(parsed.powerColdroom1Closing) : (metadata.powerColdroom1Closing || 0);
      
      if (powerColdroom1Closing < powerColdroom1Opening) {
        return NextResponse.json(
          { error: 'Coldroom 1 Power closing reading must be greater than opening reading' },
          { status: 400 }
        );
      }

      const powerColdroom1Consumed = powerColdroom1Closing - powerColdroom1Opening;
      metadata.powerColdroom1Opening = powerColdroom1Opening;
      metadata.powerColdroom1Closing = powerColdroom1Closing;
      metadata.powerColdroom1Consumed = powerColdroom1Consumed;
      
      totalPowerConsumed = (totalPowerConsumed || 0) - (existingMetadata.powerColdroom1Consumed || 0) + powerColdroom1Consumed;
    }

    if (parsed.powerColdroom2Opening !== undefined || parsed.powerColdroom2Closing !== undefined) {
      const powerColdroom2Opening = parsed.powerColdroom2Opening ? parseFloat(parsed.powerColdroom2Opening) : (metadata.powerColdroom2Closing || 0);
      const powerColdroom2Closing = parsed.powerColdroom2Closing ? parseFloat(parsed.powerColdroom2Closing) : (metadata.powerColdroom2Closing || 0);
      
      if (powerColdroom2Closing < powerColdroom2Opening) {
        return NextResponse.json(
          { error: 'Coldroom 2 Power closing reading must be greater than opening reading' },
          { status: 400 }
        );
      }

      const powerColdroom2Consumed = powerColdroom2Closing - powerColdroom2Opening;
      metadata.powerColdroom2Opening = powerColdroom2Opening;
      metadata.powerColdroom2Closing = powerColdroom2Closing;
      metadata.powerColdroom2Consumed = powerColdroom2Consumed;
      
      totalPowerConsumed = (totalPowerConsumed || 0) - (existingMetadata.powerColdroom2Consumed || 0) + powerColdroom2Consumed;
    }

    if (parsed.powerOtherOpening !== undefined || parsed.powerOtherClosing !== undefined) {
      const powerOtherOpening = parsed.powerOtherOpening ? parseFloat(parsed.powerOtherOpening) : (metadata.powerOtherClosing || 0);
      const powerOtherClosing = parsed.powerOtherClosing ? parseFloat(parsed.powerOtherClosing) : (metadata.powerOtherClosing || 0);
      
      if (powerOtherClosing < powerOtherOpening) {
        return NextResponse.json(
          { error: 'Other Activities Power closing reading must be greater than opening reading' },
          { status: 400 }
        );
      }

      const powerOtherConsumed = powerOtherClosing - powerOtherOpening;
      metadata.powerOtherOpening = powerOtherOpening;
      metadata.powerOtherClosing = powerOtherClosing;
      metadata.powerOtherConsumed = powerOtherConsumed;
      
      totalPowerConsumed = (totalPowerConsumed || 0) - (existingMetadata.powerOtherConsumed || 0) + powerOtherConsumed;
    }

    if (parsed.powerOtherActivity !== undefined) {
      metadata.powerOtherActivity = parsed.powerOtherActivity;
    }

    // Update water readings if provided
    if (parsed.waterMeter1Opening !== undefined || parsed.waterMeter1Closing !== undefined) {
      const waterMeter1Opening = parsed.waterMeter1Opening ? parseFloat(parsed.waterMeter1Opening) : (metadata.waterMeter1Closing || 0);
      const waterMeter1Closing = parsed.waterMeter1Closing ? parseFloat(parsed.waterMeter1Closing) : (metadata.waterMeter1Closing || 0);
      
      if (waterMeter1Closing < waterMeter1Opening) {
        return NextResponse.json(
          { error: 'Water Meter 1 closing reading must be greater than opening reading' },
          { status: 400 }
        );
      }

      const waterMeter1Consumed = waterMeter1Closing - waterMeter1Opening;
      metadata.waterMeter1Opening = waterMeter1Opening;
      metadata.waterMeter1Closing = waterMeter1Closing;
      metadata.waterMeter1Consumed = waterMeter1Consumed;
      
      totalWaterConsumed = (totalWaterConsumed || 0) - (existingMetadata.waterMeter1Consumed || 0) + waterMeter1Consumed;
    }

    if (parsed.waterMeter2Opening !== undefined || parsed.waterMeter2Closing !== undefined) {
      const waterMeter2Opening = parsed.waterMeter2Opening ? parseFloat(parsed.waterMeter2Opening) : (metadata.waterMeter2Closing || 0);
      const waterMeter2Closing = parsed.waterMeter2Closing ? parseFloat(parsed.waterMeter2Closing) : (metadata.waterMeter2Closing || 0);
      
      if (waterMeter2Closing < waterMeter2Opening) {
        return NextResponse.json(
          { error: 'Water Meter 2 closing reading must be greater than opening reading' },
          { status: 400 }
        );
      }

      const waterMeter2Consumed = waterMeter2Closing - waterMeter2Opening;
      metadata.waterMeter2Opening = waterMeter2Opening;
      metadata.waterMeter2Closing = waterMeter2Closing;
      metadata.waterMeter2Consumed = waterMeter2Consumed;
      
      totalWaterConsumed = (totalWaterConsumed || 0) - (existingMetadata.waterMeter2Consumed || 0) + waterMeter2Consumed;
    }

    // Update internet costs if provided
    if (parsed.internetSafaricom !== undefined) {
      metadata.internetSafaricom = parsed.internetSafaricom ? parseFloat(parsed.internetSafaricom) : 0;
    }
    if (parsed.internet5G !== undefined) {
      metadata.internet5G = parsed.internet5G ? parseFloat(parsed.internet5G) : 0;
    }
    if (parsed.internetSyokinet !== undefined) {
      metadata.internetSyokinet = parsed.internetSyokinet ? parseFloat(parsed.internetSyokinet) : 0;
    }
    if (parsed.internetBillingCycle !== undefined) {
      metadata.internetBillingCycle = parsed.internetBillingCycle;
    }

    // Update generator data if provided
    if (parsed.generatorStart !== undefined) {
      metadata.generatorStart = parsed.generatorStart;
    }
    if (parsed.generatorStop !== undefined) {
      metadata.generatorStop = parsed.generatorStop;
    }
    
    // Calculate generator runtime if both times are provided
    if (parsed.generatorStart && parsed.generatorStop) {
      const [startHour, startMin] = parsed.generatorStart.split(':').map(Number);
      const [stopHour, stopMin] = parsed.generatorStop.split(':').map(Number);

      let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
      if (totalMinutes < 0) totalMinutes += 24 * 60;

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      const formatTimeDisplay = () => {
        if (hours === 0 && minutes === 0) return '0 hours';
        const parts = [];
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        return parts.join(' ');
      };
      
      timeConsumed = formatTimeDisplay();
    }

    // Update diesel data if provided
    if (parsed.dieselConsumed !== undefined) {
      dieselConsumed = parsed.dieselConsumed ? parseFloat(parsed.dieselConsumed) : 0;
    }
    if (parsed.dieselRefill !== undefined) {
      dieselRefill = parsed.dieselRefill && parsed.dieselRefill.trim() !== '' 
        ? parseFloat(parsed.dieselRefill).toString()
        : null;
    }

    // Update other metadata fields
    if (parsed.generatorCode !== undefined) metadata.generatorCode = parsed.generatorCode;
    if (parsed.generatorName !== undefined) metadata.generatorName = parsed.generatorName;
    if (parsed.coldroom1Temp !== undefined) metadata.coldroom1Temp = parsed.coldroom1Temp;
    if (parsed.coldroom2Temp !== undefined) metadata.coldroom2Temp = parsed.coldroom2Temp;
    if (parsed.machineStatus !== undefined) metadata.machineStatus = parsed.machineStatus;
    if (parsed.waterMeter1Number !== undefined) metadata.waterMeter1Number = parsed.waterMeter1Number;
    if (parsed.waterMeter2Number !== undefined) metadata.waterMeter2Number = parsed.waterMeter2Number;

    // Create or update reading
    const readingData = {
      // Store totals for quick access
      powerOpening: totalPowerConsumed.toString(),
      powerClosing: "0",
      powerConsumed: totalPowerConsumed.toString(),
      
      waterOpening: totalWaterConsumed.toString(),
      waterClosing: "0",
      waterConsumed: totalWaterConsumed.toString(),
      
      generatorStart: metadata.generatorStart || existingReading?.generatorStart || '',
      generatorStop: metadata.generatorStop || existingReading?.generatorStop || '',
      timeConsumed,
      dieselConsumed: dieselConsumed.toString(),
      dieselRefill,
      recordedBy: parsed.recordedBy,
      shift: parsed.shift || existingReading?.shift || null,
      date: parsed.date ? new Date(parsed.date) : new Date(),
      notes: parsed.notes || existingReading?.notes || null,
      metadata: JSON.stringify(metadata),
    };

    let reading;
    if (existingReading) {
      // Update existing reading
      reading = await prisma.utility_readings.update({
        where: { id: existingReading.id },
        data: readingData,
      });
    } else {
      // Create new reading
      reading = await prisma.utility_readings.create({
        data: readingData,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      reading,
      message: existingReading ? 'Reading updated successfully' : 'Reading created successfully',
      calculated: {
        totalPowerConsumed,
        totalWaterConsumed,
        timeConsumed,
        dieselConsumed,
      }
    }, { status: existingReading ? 200 : 201 });
    
  } catch (error) {
    console.error('Error in utility readings POST:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period'); // day, week, month

    // Build where clause
    const where: any = {};
    
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(queryDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      where.date = {
        gte: queryDate,
        lt: nextDate,
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (period) {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      where.date = {
        gte: startDate,
        lte: now,
      };
    }

    const readings = await prisma.utility_readings.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    // Parse metadata and calculate totals
    let totalPower = 0;
    let totalWater = 0;
    let totalDiesel = 0;
    let totalInternet = 0;
    
    const parsedReadings = readings.map(reading => {
      const metadata = reading.metadata ? JSON.parse(reading.metadata as string) : {};
      
      // Add to totals
      totalPower += Number(reading.powerConsumed) || 0;
      totalWater += Number(reading.waterConsumed) || 0;
      totalDiesel += Number(reading.dieselConsumed) || 0;
      
      // Add internet costs if available
      if (metadata.internetSafaricom) totalInternet += metadata.internetSafaricom;
      if (metadata.internet5G) totalInternet += metadata.internet5G;
      if (metadata.internetSyokinet) totalInternet += metadata.internetSyokinet;
      
      return {
        ...reading,
        metadata,
        date: reading.date.toISOString(),
      };
    });

    // Calculate daily averages if we have date range
    let dailyAverages = {};
    if (startDate && endDate) {
      const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
      dailyAverages = {
        power: totalPower / daysDiff,
        water: totalWater / daysDiff,
        diesel: totalDiesel / daysDiff,
      };
    }

    return NextResponse.json({
      readings: parsedReadings,
      totals: {
        power: totalPower,
        water: totalWater,
        diesel: totalDiesel,
        internet: totalInternet,
      },
      dailyAverages,
      meta: {
        count: readings.length,
        period: period || 'all',
      },
    });
    
  } catch (error) {
    console.error('Error fetching utility readings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch utility readings' },
      { status: 500 }
    );
  }
}

// New endpoint for CSV export
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Reading ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.utility_readings.delete({
      where: { id: parseInt(id) },
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Reading deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting utility reading:', error);
    return NextResponse.json(
      { error: 'Failed to delete utility reading' },
      { status: 500 }
    );
  }
}
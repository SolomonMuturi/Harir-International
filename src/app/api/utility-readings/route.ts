import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Enhanced schema with all equipment data
const utilityReadingInputSchema = z.object({
  // Power readings by area
  powerOfficeOpening: z.string().min(1, 'Office power opening reading is required'),
  powerOfficeClosing: z.string().min(1, 'Office power closing reading is required'),
  powerMachineOpening: z.string().min(1, 'Machine power opening reading is required'),
  powerMachineClosing: z.string().min(1, 'Machine power closing reading is required'),
  powerColdroom1Opening: z.string().min(1, 'Coldroom 1 power opening reading is required'),
  powerColdroom1Closing: z.string().min(1, 'Coldroom 1 power closing reading is required'),
  powerColdroom2Opening: z.string().min(1, 'Coldroom 2 power opening reading is required'),
  powerColdroom2Closing: z.string().min(1, 'Coldroom 2 power closing reading is required'),
  powerOtherOpening: z.string().optional().nullable(),
  powerOtherClosing: z.string().optional().nullable(),
  powerOtherActivity: z.string().optional().nullable(),
  
  // Water readings for two meters
  waterMeter1Opening: z.string().min(1, 'Water Meter 1 opening reading is required'),
  waterMeter1Closing: z.string().min(1, 'Water Meter 1 closing reading is required'),
  waterMeter2Opening: z.string().min(1, 'Water Meter 2 opening reading is required'),
  waterMeter2Closing: z.string().min(1, 'Water Meter 2 closing reading is required'),
  
  // Internet costs (monthly)
  internetSafaricom: z.string().optional().nullable(),
  internet5G: z.string().optional().nullable(),
  internetSyokinet: z.string().optional().nullable(),
  internetBillingCycle: z.string().optional().nullable(),
  
  // Generator data
  generatorStart: z.string().regex(/^\d{2}:\d{2}$/, 'Generator start time must be in HH:MM format'),
  generatorStop: z.string().regex(/^\d{2}:\d{2}$/, 'Generator stop time must be in HH:MM format'),
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

    // Convert numeric values for power
    const powerOfficeOpening = parseFloat(parsed.powerOfficeOpening);
    const powerOfficeClosing = parseFloat(parsed.powerOfficeClosing);
    const powerMachineOpening = parseFloat(parsed.powerMachineOpening);
    const powerMachineClosing = parseFloat(parsed.powerMachineClosing);
    const powerColdroom1Opening = parseFloat(parsed.powerColdroom1Opening);
    const powerColdroom1Closing = parseFloat(parsed.powerColdroom1Closing);
    const powerColdroom2Opening = parseFloat(parsed.powerColdroom2Opening);
    const powerColdroom2Closing = parseFloat(parsed.powerColdroom2Closing);
    
    const powerOtherOpening = parsed.powerOtherOpening ? parseFloat(parsed.powerOtherOpening) : 0;
    const powerOtherClosing = parsed.powerOtherClosing ? parseFloat(parsed.powerOtherClosing) : 0;
    
    // Convert water readings
    const waterMeter1Opening = parseFloat(parsed.waterMeter1Opening);
    const waterMeter1Closing = parseFloat(parsed.waterMeter1Closing);
    const waterMeter2Opening = parseFloat(parsed.waterMeter2Opening);
    const waterMeter2Closing = parseFloat(parsed.waterMeter2Closing);
    
    // Convert internet costs
    const internetSafaricom = parsed.internetSafaricom ? parseFloat(parsed.internetSafaricom) : 0;
    const internet5G = parsed.internet5G ? parseFloat(parsed.internet5G) : 0;
    const internetSyokinet = parsed.internetSyokinet ? parseFloat(parsed.internetSyokinet) : 0;
    
    // Handle optional nullable fields
    const dieselRefill = parsed.dieselRefill && parsed.dieselRefill.trim() !== '' 
      ? parseFloat(parsed.dieselRefill) 
      : null;

    // Validate power readings
    const validateReadings = (opening: number, closing: number, name: string) => {
      if (closing < opening) {
        throw new Error(`${name} closing reading must be greater than opening reading`);
      }
    };

    validateReadings(powerOfficeOpening, powerOfficeClosing, 'Office Power');
    validateReadings(powerMachineOpening, powerMachineClosing, 'Machine Power');
    validateReadings(powerColdroom1Opening, powerColdroom1Closing, 'Coldroom 1 Power');
    validateReadings(powerColdroom2Opening, powerColdroom2Closing, 'Coldroom 2 Power');
    if (powerOtherClosing > 0) {
      validateReadings(powerOtherOpening, powerOtherClosing, 'Other Activities Power');
    }
    
    validateReadings(waterMeter1Opening, waterMeter1Closing, 'Water Meter 1');
    validateReadings(waterMeter2Opening, waterMeter2Closing, 'Water Meter 2');

    // Calculate power consumption by area
    const powerOfficeConsumed = powerOfficeClosing - powerOfficeOpening;
    const powerMachineConsumed = powerMachineClosing - powerMachineOpening;
    const powerColdroom1Consumed = powerColdroom1Closing - powerColdroom1Opening;
    const powerColdroom2Consumed = powerColdroom2Closing - powerColdroom2Opening;
    const powerOtherConsumed = powerOtherClosing - powerOtherOpening;
    const totalPowerConsumed = powerOfficeConsumed + powerMachineConsumed + 
                               powerColdroom1Consumed + powerColdroom2Consumed + 
                               powerOtherConsumed;

    // Calculate water consumption
    const waterMeter1Consumed = waterMeter1Closing - waterMeter1Opening;
    const waterMeter2Consumed = waterMeter2Closing - waterMeter2Opening;
    const totalWaterConsumed = waterMeter1Consumed + waterMeter2Consumed;

    // Generator runtime calculation
    const [startHour, startMin] = parsed.generatorStart.split(':').map(Number);
    const [stopHour, stopMin] = parsed.generatorStop.split(':').map(Number);

    let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalHours = totalMinutes / 60;
    
    // Calculate diesel consumption if not provided
    const dieselConsumed = parsed.dieselConsumed 
      ? parseFloat(parsed.dieselConsumed)
      : totalHours * 7; // Default calculation: 7L per hour

    const formatTimeDisplay = () => {
      if (hours === 0 && minutes === 0) return '0 hours';
      const parts = [];
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      return parts.join(' ');
    };
    const timeConsumed = formatTimeDisplay();

    // Total internet cost
    const totalInternetCost = internetSafaricom + internet5G + internetSyokinet;

    // Create metadata for additional fields
    const metadata = JSON.stringify({
      // Power breakdown
      powerOfficeOpening,
      powerOfficeClosing,
      powerMachineOpening,
      powerMachineClosing,
      powerColdroom1Opening,
      powerColdroom1Closing,
      powerColdroom2Opening,
      powerColdroom2Closing,
      powerOtherOpening,
      powerOtherClosing,
      powerOtherActivity: parsed.powerOtherActivity,
      
      // Water meter details
      waterMeter1Number: parsed.waterMeter1Number,
      waterMeter2Number: parsed.waterMeter2Number,
      
      // Internet costs
      internetSafaricom,
      internet5G,
      internetSyokinet,
      internetBillingCycle: parsed.internetBillingCycle,
      
      // Equipment status
      coldroom1Temp: parsed.coldroom1Temp,
      coldroom2Temp: parsed.coldroom2Temp,
      machineStatus: parsed.machineStatus,
      
      // Generator details
      generatorCode: parsed.generatorCode,
      generatorName: parsed.generatorName,
    });

    const reading = await prisma.utility_readings.create({
      data: {
        // Store totals for quick access
        powerOpening: totalPowerConsumed.toString(), // Storing total for backward compatibility
        powerClosing: "0", // Not used in new system
        powerConsumed: totalPowerConsumed.toString(),
        
        waterOpening: totalWaterConsumed.toString(), // Storing total for backward compatibility
        waterClosing: "0", // Not used in new system
        waterConsumed: totalWaterConsumed.toString(),
        
        generatorStart: parsed.generatorStart,
        generatorStop: parsed.generatorStop,
        timeConsumed,
        dieselConsumed: dieselConsumed.toString(),
        dieselRefill: dieselRefill ? dieselRefill.toString() : null,
        recordedBy: parsed.recordedBy,
        shift: parsed.shift || null,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        notes: parsed.notes || null,
        metadata,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      reading,
      calculated: {
        // Power breakdown
        powerOfficeConsumed,
        powerMachineConsumed,
        powerColdroom1Consumed,
        powerColdroom2Consumed,
        powerOtherConsumed,
        totalPowerConsumed,
        
        // Water breakdown
        waterMeter1Consumed,
        waterMeter2Consumed,
        totalWaterConsumed,
        
        // Generator
        timeConsumed,
        dieselConsumed,
        
        // Internet
        totalInternetCost,
      }
    }, { status: 201 });
    
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
        case 'day':
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
    
    const parsedReadings = readings.map(reading => {
      const metadata = reading.metadata ? JSON.parse(reading.metadata as string) : {};
      
      // Add to totals
      totalPower += Number(reading.powerConsumed) || 0;
      totalWater += Number(reading.waterConsumed) || 0;
      totalDiesel += Number(reading.dieselConsumed) || 0;
      
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
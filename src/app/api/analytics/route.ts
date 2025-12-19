// /app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Analytics API: Fetching real data from database...');
    
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // Fetch all data in parallel for maximum performance
    const [
      carriers,
      shipments,
      coldRoomBoxes,
      utilityReadings,
      countingRecords,
      loadingSheets,
      weightEntries,
      visitors,
      employees,
      attendanceToday,
      coldRooms,
      suppliers,
      carrierAssignments,
      loadingPallets,
      temperatureLogs,
      rejectionRecords
    ] = await Promise.all([
      // 1. Carriers
      prisma.carriers.findMany({
        where: { status: 'Active' },
        take: 10
      }),
      
      // 2. Shipments (last 30 days for performance calculation)
      prisma.shipments.findMany({
        where: {
          created_at: { gte: thirtyDaysAgo }
        },
        take: 1000,
        orderBy: { created_at: 'desc' }
      }),
      
      // 3. Cold Room Boxes
      prisma.cold_room_boxes.findMany({
        take: 5000,
        orderBy: { created_at: 'desc' }
      }),
      
      // 4. Utility Readings (last 7 days)
      prisma.utility_readings.findMany({
        where: {
          date: { gte: sevenDaysAgo }
        },
        orderBy: { date: 'desc' },
        take: 7
      }),
      
      // 5. Counting Records
      prisma.counting_records.findMany({
        where: {
          submitted_at: { gte: thirtyDaysAgo }
        },
        take: 100,
        orderBy: { submitted_at: 'desc' }
      }),
      
      // 6. Loading Sheets (recent)
      prisma.loading_sheets.findMany({
        take: 10,
        orderBy: { loading_date: 'desc' },
        include: {
          loading_pallets: true
        }
      }),
      
      // 7. Weight Entries (recent)
      prisma.weight_entries.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' }
      }),
      
      // 8. Visitors (recent)
      prisma.visitors.findMany({
        take: 20,
        orderBy: { created_at: 'desc' }
      }),
      
      // 9. Employees
      prisma.employee.findMany({
        take: 50
      }),
      
      // 10. Today's Attendance
      prisma.attendance.findMany({
        where: {
          date: now.toISOString().split('T')[0]
        }
      }),
      
      // 11. Cold Rooms
      prisma.cold_rooms.findMany({
        take: 5
      }),
      
      // 12. Suppliers
      prisma.suppliers.findMany({
        where: { status: 'Active' },
        take: 10
      }),
      
      // 13. Carrier Assignments
      prisma.carrier_assignments.findMany({
        take: 10,
        orderBy: { assigned_at: 'desc' },
        include: {
          carrier: true,
          loading_sheet: true
        }
      }),
      
      // 14. Loading Pallets
      prisma.loading_pallets.groupBy({
        by: ['loading_sheet_id'],
        _sum: {
          total: true
        },
        take: 10
      }),
      
      // 15. Temperature Logs (latest for each cold room)
      prisma.temperature_logs.findMany({
        distinct: ['cold_room_id'],
        orderBy: { timestamp: 'desc' },
        take: 5
      }),
      
      // 16. Rejection Records
      prisma.rejection_records.findMany({
        take: 5,
        orderBy: { submitted_at: 'desc' }
      })
    ]);
    
    // Calculate analytics data from real database records
    
    // 1. Carrier Performance
    const carrierPerformance = calculateCarrierPerformance(shipments);
    
    // 2. Cold Room Statistics
    const coldRoomStats = calculateColdRoomStats(coldRoomBoxes);
    
    // 3. Utility Consumption
    const utilityConsumption = calculateUtilityConsumption(utilityReadings);
    
    // 4. Counting Statistics
    const countingStats = calculateCountingStats(countingRecords);
    
    // 5. Loading Sheet Statistics
    const loadingSheetStats = calculateLoadingSheetStats(loadingSheets);
    
    // 6. Weight Statistics
    const weightStats = calculateWeightStats(weightEntries);
    
    // 7. Visitor Statistics
    const visitorStats = calculateVisitorStats(visitors);
    
    // 8. Employee Statistics
    const employeeStats = calculateEmployeeStats(employees, attendanceToday);
    
    // 9. Quick Stats
    const quickStats = {
      totalCarriers: carriers.length,
      totalEmployees: employees.length,
      totalSuppliers: suppliers.length,
      totalVisitorsToday: visitors.filter(v => 
        new Date(v.created_at).toDateString() === now.toDateString()
      ).length,
      totalWeightsToday: weightEntries.filter(w => 
        w.timestamp && new Date(w.timestamp).toDateString() === now.toDateString()
      ).length,
      totalShipmentsToday: shipments.filter(s => 
        new Date(s.created_at).toDateString() === now.toDateString()
      ).length,
      totalAssignments: carrierAssignments.length,
      total4kgBoxes: coldRoomStats.overall.total4kgBoxes,
      total10kgBoxes: coldRoomStats.overall.total10kgBoxes,
      totalPowerConsumed: utilityConsumption.totalPower,
      totalWaterConsumed: utilityConsumption.totalWater,
      totalPalletsLoaded: loadingPallets.reduce((sum, p) => sum + (p._sum?.total || 0), 0),
      totalRejections: rejectionRecords.length
    };
    
    // 10. Recent Activity
    const recentActivity = generateRecentActivity(
      weightEntries, 
      visitors, 
      loadingSheets,
      countingRecords,
      rejectionRecords
    );
    
    // 11. Cold Room Status
    const coldRoomStatus = calculateColdRoomStatus(coldRooms, temperatureLogs, coldRoomBoxes);
    
    // Prepare final response
    const responseData = {
      carrierPerformance,
      coldRoomStats,
      utilityConsumption,
      countingStats,
      loadingSheetStats,
      weightStats,
      visitorStats,
      employeeStats,
      quickStats,
      recentActivity,
      coldRoomStatus,
      timestamp: now.toISOString()
    };
    
    console.log('✅ Analytics data fetched successfully from database');
    
    return NextResponse.json({
      success: true,
      data: responseData,
      counts: {
        carriers: carriers.length,
        shipments: shipments.length,
        coldRoomBoxes: coldRoomBoxes.length,
        utilityReadings: utilityReadings.length,
        countingRecords: countingRecords.length,
        loadingSheets: loadingSheets.length,
        weightEntries: weightEntries.length,
        visitors: visitors.length,
        employees: employees.length,
        attendanceToday: attendanceToday.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Analytics API Error:', error);
    
    // Return empty data structure instead of mock data
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data',
      data: getEmptyAnalyticsData(),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper Functions

function calculateCarrierPerformance(shipments: any[]) {
  const carrierMap = new Map();
  
  shipments.forEach(shipment => {
    if (!shipment.carrier) return;
    
    if (!carrierMap.has(shipment.carrier)) {
      carrierMap.set(shipment.carrier, {
        carrier: shipment.carrier,
        total: 0,
        delivered: 0,
        onTime: 0,
        delayed: 0,
        inTransit: 0,
        other: 0
      });
    }
    
    const stats = carrierMap.get(shipment.carrier);
    stats.total++;
    
    switch (shipment.status) {
      case 'Delivered':
        stats.delivered++;
        if (shipment.expected_arrival && shipment.created_at) {
          const expectedDate = new Date(shipment.expected_arrival);
          const createdDate = new Date(shipment.created_at);
          const timeDiff = Math.abs(expectedDate.getTime() - createdDate.getTime());
          const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          if (dayDiff <= 2) {
            stats.onTime++;
          } else {
            stats.delayed++;
          }
        } else {
          stats.onTime++;
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
  
  return Array.from(carrierMap.values()).map(stats => ({
    carrier: stats.carrier,
    total: stats.total,
    delivered: stats.delivered,
    onTime: stats.onTime,
    delayed: stats.delayed,
    inTransit: stats.inTransit,
    other: stats.other,
    onTimePercentage: stats.total > 0 ? (stats.onTime / stats.total) * 100 : 0,
    deliveredPercentage: stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0,
    delayedPercentage: stats.total > 0 ? (stats.delayed / stats.total) * 100 : 0,
    performanceScore: stats.total > 0 ? 
      ((stats.onTime * 1.0 + stats.inTransit * 0.5 - stats.delayed * 0.5) / stats.total) * 100 : 0
  }));
}

function calculateColdRoomStats(boxes: any[]) {
  const stats = {
    overall: {
      total4kgBoxes: 0,
      total10kgBoxes: 0,
      total4kgPallets: 0,
      total10kgPallets: 0
    },
    coldroom1: {
      total4kgBoxes: 0,
      total10kgBoxes: 0
    },
    coldroom2: {
      total4kgBoxes: 0,
      total10kgBoxes: 0
    }
  };
  
  boxes.forEach(box => {
    const is4kg = box.box_type === '4kg';
    const is10kg = box.box_type === '10kg';
    const quantity = box.quantity || 0;
    
    if (is4kg) {
      stats.overall.total4kgBoxes += quantity;
      stats.overall.total4kgPallets += Math.floor(quantity / 288);
      
      if (box.cold_room_id === 'coldroom1') {
        stats.coldroom1.total4kgBoxes += quantity;
      } else if (box.cold_room_id === 'coldroom2') {
        stats.coldroom2.total4kgBoxes += quantity;
      }
    }
    
    if (is10kg) {
      stats.overall.total10kgBoxes += quantity;
      stats.overall.total10kgPallets += Math.floor(quantity / 120);
      
      if (box.cold_room_id === 'coldroom1') {
        stats.coldroom1.total10kgBoxes += quantity;
      } else if (box.cold_room_id === 'coldroom2') {
        stats.coldroom2.total10kgBoxes += quantity;
      }
    }
  });
  
  return stats;
}

function calculateUtilityConsumption(readings: any[]) {
  let totalPower = 0;
  let totalWater = 0;
  const dailyData: Array<{date: string, power: number, water: number}> = [];
  
  readings.forEach(reading => {
    const power = parseFloat(reading.powerConsumed) || 0;
    const water = parseFloat(reading.waterConsumed) || 0;
    
    totalPower += power;
    totalWater += water;
    
    dailyData.push({
      date: reading.date.toISOString().split('T')[0],
      power,
      water
    });
  });
  
  return {
    totalPower,
    totalWater,
    dailyData: dailyData.sort((a, b) => a.date.localeCompare(b.date))
  };
}

function calculateCountingStats(records: any[]) {
  return {
    totalProcessed: records.length,
    pendingColdroom: records.filter(r => r.status === 'pending_coldroom').length,
    pendingRejection: records.filter(r => r.status === 'pending_rejection').length,
    completed: records.filter(r => r.status === 'completed').length,
    fuerte4kg: records.reduce((sum, r) => sum + (r.fuerte_4kg_total || 0), 0),
    fuerte10kg: records.reduce((sum, r) => sum + (r.fuerte_10kg_total || 0), 0),
    hass4kg: records.reduce((sum, r) => sum + (r.hass_4kg_total || 0), 0),
    hass10kg: records.reduce((sum, r) => sum + (r.hass_10kg_total || 0), 0)
  };
}

function calculateLoadingSheetStats(loadingSheets: any[]) {
  const recentSheets = loadingSheets.map(sheet => ({
    id: sheet.id,
    client: sheet.client,
    container: sheet.container,
    loadingDate: sheet.loading_date.toISOString(),
    totalPallets: sheet.loading_pallets?.length || 0,
    totalBoxes: sheet.loading_pallets?.reduce((sum: number, pallet: any) => sum + (pallet.total || 0), 0) || 0
  }));
  
  return {
    totalSheets: loadingSheets.length,
    recentSheets,
    totalPallets: recentSheets.reduce((sum, sheet) => sum + sheet.totalPallets, 0),
    totalBoxes: recentSheets.reduce((sum, sheet) => sum + sheet.totalBoxes, 0)
  };
}

function calculateWeightStats(weights: any[]) {
  const recentWeights = weights.map(weight => ({
    id: weight.id,
    palletId: weight.pallet_id,
    netWeight: Number(weight.net_weight) || 0,
    timestamp: weight.timestamp?.toISOString() || weight.created_at.toISOString(),
    product: weight.product,
    supplier: weight.supplier
  }));
  
  const totalWeight = recentWeights.reduce((sum, w) => sum + w.netWeight, 0);
  
  return {
    totalEntries: weights.length,
    recentWeights,
    totalWeight,
    averageWeight: weights.length > 0 ? totalWeight / weights.length : 0
  };
}

function calculateVisitorStats(visitors: any[]) {
  const now = new Date();
  const today = now.toDateString();
  
  const recentVisitors = visitors.map(visitor => ({
    id: visitor.id,
    name: visitor.name,
    company: visitor.company,
    status: visitor.status,
    vehiclePlate: visitor.vehicle_plate,
    createdAt: visitor.created_at.toISOString(),
    isToday: new Date(visitor.created_at).toDateString() === today
  }));
  
  return {
    totalVisitors: visitors.length,
    visitorsToday: recentVisitors.filter(v => v.isToday).length,
    checkedIn: recentVisitors.filter(v => v.status === 'Checked In').length,
    checkedOut: recentVisitors.filter(v => v.status === 'Checked Out').length,
    preRegistered: recentVisitors.filter(v => v.status === 'Pre-registered').length,
    recentVisitors: recentVisitors.slice(0, 10)
  };
}

function calculateEmployeeStats(employees: any[], attendance: any[]) {
  const attendanceStats = {
    present: attendance.filter(a => a.status === 'Present').length,
    late: attendance.filter(a => a.status === 'Late').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    onLeave: attendance.filter(a => a.status === 'On Leave').length
  };
  
  return {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === 'active').length,
    averageRating: employees.length > 0 ? 
      employees.reduce((sum, e) => sum + (e.rating || 0), 0) / employees.length : 0,
    attendanceStats,
    attendanceChartData: [
      { name: 'Present', value: attendanceStats.present },
      { name: 'Late', value: attendanceStats.late },
      { name: 'Absent', value: attendanceStats.absent },
      { name: 'On Leave', value: attendanceStats.onLeave }
    ]
  };
}

function calculateColdRoomStatus(coldRooms: any[], temperatureLogs: any[], boxes: any[]) {
  return coldRooms.map(room => {
    const tempLog = temperatureLogs.find(t => t.cold_room_id === room.id);
    const roomBoxes = boxes.filter(b => b.cold_room_id === room.id);
    const totalBoxes = roomBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
    
    // Estimate capacity (assuming 2000 boxes per room)
    const capacity = 2000;
    const occupiedPercentage = Math.min(100, (totalBoxes / capacity) * 100);
    
    return {
      id: room.id,
      name: room.name,
      currentTemperature: tempLog?.temperature || room.temperature || 0,
      capacity,
      occupied: Math.round(occupiedPercentage),
      totalBoxes,
      status: room.status || 'Optimal'
    };
  });
}

function generateRecentActivity(
  weights: any[], 
  visitors: any[], 
  loadingSheets: any[],
  countingRecords: any[],
  rejectionRecords: any[]
) {
  const activities = [];
  const now = new Date();
  
  // Weight entries (last 24 hours)
  const recentWeights = weights.filter(w => {
    const timestamp = w.timestamp || w.created_at;
    return now.getTime() - new Date(timestamp).getTime() < 24 * 60 * 60 * 1000;
  });
  
  recentWeights.slice(0, 3).forEach(weight => {
    activities.push({
      id: `weight-${weight.id}`,
      type: 'weight_entry',
      description: 'Weight entry recorded',
      timestamp: weight.timestamp || weight.created_at,
      details: `${weight.pallet_id || 'Unknown pallet'} - ${Number(weight.net_weight) || 0} kg`
    });
  });
  
  // Visitor check-ins (last 24 hours)
  const recentVisitors = visitors.filter(v => {
    return now.getTime() - new Date(v.created_at).getTime() < 24 * 60 * 60 * 1000;
  });
  
  recentVisitors.slice(0, 2).forEach(visitor => {
    activities.push({
      id: `visitor-${visitor.id}`,
      type: 'visitor_checkin',
      description: 'Visitor checked in',
      timestamp: visitor.created_at,
      details: `${visitor.name} - ${visitor.company || 'No company'}`
    });
  });
  
  // Counting records (last 24 hours)
  const recentCounting = countingRecords.filter(c => {
    return now.getTime() - new Date(c.submitted_at).getTime() < 24 * 60 * 60 * 1000;
  });
  
  recentCounting.slice(0, 2).forEach(record => {
    activities.push({
      id: `counting-${record.id}`,
      type: 'counting_record',
      description: 'Counting record submitted',
      timestamp: record.submitted_at,
      details: `${record.supplier_name} - ${record.total_weight} kg`
    });
  });
  
  // Sort by timestamp (newest first)
  return activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 10);
}

function getEmptyAnalyticsData() {
  const now = new Date();
  return {
    carrierPerformance: [],
    coldRoomStats: {
      overall: { total4kgBoxes: 0, total10kgBoxes: 0, total4kgPallets: 0, total10kgPallets: 0 },
      coldroom1: { total4kgBoxes: 0, total10kgBoxes: 0 },
      coldroom2: { total4kgBoxes: 0, total10kgBoxes: 0 }
    },
    utilityConsumption: {
      totalPower: 0,
      totalWater: 0,
      dailyData: []
    },
    countingStats: {
      totalProcessed: 0,
      pendingColdroom: 0,
      pendingRejection: 0,
      completed: 0,
      fuerte4kg: 0,
      fuerte10kg: 0,
      hass4kg: 0,
      hass10kg: 0
    },
    loadingSheetStats: {
      totalSheets: 0,
      recentSheets: [],
      totalPallets: 0,
      totalBoxes: 0
    },
    weightStats: {
      totalEntries: 0,
      recentWeights: [],
      totalWeight: 0,
      averageWeight: 0
    },
    visitorStats: {
      totalVisitors: 0,
      visitorsToday: 0,
      checkedIn: 0,
      checkedOut: 0,
      preRegistered: 0,
      recentVisitors: []
    },
    employeeStats: {
      totalEmployees: 0,
      activeEmployees: 0,
      averageRating: 0,
      attendanceStats: { present: 0, late: 0, absent: 0, onLeave: 0 },
      attendanceChartData: [
        { name: 'Present', value: 0 },
        { name: 'Late', value: 0 },
        { name: 'Absent', value: 0 },
        { name: 'On Leave', value: 0 }
      ]
    },
    quickStats: {
      totalCarriers: 0,
      totalEmployees: 0,
      totalSuppliers: 0,
      totalVisitorsToday: 0,
      totalWeightsToday: 0,
      totalShipmentsToday: 0,
      totalAssignments: 0,
      total4kgBoxes: 0,
      total10kgBoxes: 0,
      totalPowerConsumed: 0,
      totalWaterConsumed: 0,
      totalPalletsLoaded: 0,
      totalRejections: 0
    },
    recentActivity: [],
    coldRoomStatus: [],
    timestamp: now.toISOString()
  };
}
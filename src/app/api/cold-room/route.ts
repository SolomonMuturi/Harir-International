import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    console.log('GET /api/cold-room - Action:', action);

    if (action === 'boxes') {
      try {
        const boxes = await prisma.$queryRaw`
          SELECT 
            id,
            variety,
            box_type as boxType,
            size,
            grade,
            quantity,
            cold_room_id as cold_room_id,
            supplier_name,
            pallet_id,
            region,
            counting_record_id,
            created_at,
            updated_at
          FROM cold_room_boxes 
          ORDER BY created_at DESC
        `;
        
        console.log('📦 Retrieved boxes:', Array.isArray(boxes) ? boxes.length : 0);
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(boxes) ? boxes : [] 
        });
      } catch (error) {
        console.error('Error fetching boxes:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'pallets') {
      try {
        const pallets = await prisma.$queryRaw`
          SELECT 
            id,
            variety,
            box_type as boxType,
            size,
            grade,
            pallet_count as pallet_count,
            cold_room_id as cold_room_id,
            created_at,
            last_updated
          FROM cold_room_pallets 
          ORDER BY created_at DESC
        `;
        
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(pallets) ? pallets : [] 
        });
      } catch (error) {
        console.error('Error fetching pallets:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'temperature') {
      try {
        const logs = await prisma.$queryRaw`
          SELECT * FROM temperature_logs ORDER BY timestamp DESC LIMIT 50
        `;
        
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(logs) ? logs : [] 
        });
      } catch (error) {
        console.error('Error fetching temperature logs:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'repacking') {
      try {
        const records = await prisma.$queryRaw`
          SELECT * FROM repacking_records ORDER BY timestamp DESC LIMIT 50
        `;
        
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(records) ? records : [] 
        });
      } catch (error) {
        console.error('Error fetching repacking records:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'loading-history') {
      try {
        const history = await prisma.$queryRaw`
          SELECT 
            id,
            box_id,
            supplier_name,
            pallet_id,
            region,
            variety,
            box_type,
            size,
            grade,
            quantity,
            cold_room_id,
            loaded_by,
            loaded_at,
            notes
          FROM loading_history 
          ORDER BY loaded_at DESC
        `;
        
        console.log('📜 Retrieved loading history:', Array.isArray(history) ? history.length : 0);
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(history) ? history : [] 
        });
      } catch (error) {
        console.error('Error fetching loading history:', error);
        return NextResponse.json({ 
          success: true, 
          data: [] 
        });
      }
    }

    if (action === 'counting-records') {
      // UPDATED LOGIC: Get counting records that are NOT fully loaded to cold room yet
      try {
        const countingRecords = await prisma.$queryRaw`
          SELECT 
            cr.id,
            cr.supplier_name,
            cr.supplier_phone,
            cr.region,
            cr.pallet_id,
            cr.total_weight,
            cr.total_counted_weight,
            
            -- Box count fields
            cr.fuerte_4kg_class1,
            cr.fuerte_4kg_class2,
            cr.fuerte_4kg_total,
            cr.fuerte_10kg_class1,
            cr.fuerte_10kg_class2,
            cr.fuerte_10kg_total,
            cr.hass_4kg_class1,
            cr.hass_4kg_class2,
            cr.hass_4kg_total,
            cr.hass_10kg_class1,
            cr.hass_10kg_class2,
            cr.hass_10kg_total,
            
            -- JSON data fields
            cr.counting_data,
            cr.totals,
            
            -- Status and tracking
            cr.status,
            cr.for_coldroom,
            
            -- Loading progress tracking
            cr.boxes_loaded_to_coldroom,
            cr.total_boxes_loaded,
            cr.loading_progress_percentage,
            
            -- Metadata
            cr.submitted_at,
            cr.processed_by,
            cr.notes,
            cr.driver_name,
            cr.vehicle_plate,
            
            -- Cold room tracking
            cr.loaded_to_coldroom_at,
            cr.cold_room_loaded_to
            
          FROM counting_records cr
          WHERE cr.for_coldroom = TRUE 
            AND (cr.status = 'pending_coldroom' OR cr.status = 'loading_in_progress')
            AND cr.loading_progress_percentage < 100
          ORDER BY 
            CASE 
              WHEN cr.status = 'loading_in_progress' THEN 1
              WHEN cr.status = 'pending_coldroom' THEN 2
              ELSE 3
            END,
            cr.submitted_at DESC
        `;

        console.log(`📊 Retrieved ${Array.isArray(countingRecords) ? countingRecords.length : 0} counting records for cold room (not fully loaded)`);
        
        return NextResponse.json({ 
          success: true, 
          data: Array.isArray(countingRecords) ? countingRecords : [] 
        });
      } catch (error) {
        console.error('Error fetching counting records for cold room:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch counting records',
          data: [] 
        });
      }
    }

    // NEW ACTION: Get counting records with remaining boxes (excluding already loaded ones)
    if (action === 'remaining-boxes') {
      try {
        // Get all counting records for cold room
        const countingRecords = await prisma.$queryRaw`
          SELECT 
            cr.id,
            cr.supplier_name,
            cr.pallet_id,
            cr.region,
            cr.total_weight,
            cr.total_counted_weight,
            cr.fuerte_4kg_total,
            cr.fuerte_10kg_total,
            cr.hass_4kg_total,
            cr.hass_10kg_total,
            cr.counting_data,
            cr.totals,
            cr.for_coldroom,
            cr.status,
            cr.boxes_loaded_to_coldroom,
            cr.total_boxes_loaded,
            cr.loading_progress_percentage,
            cr.submitted_at,
            cr.processed_by
          FROM counting_records cr
          WHERE cr.for_coldroom = TRUE 
            AND (cr.status = 'pending_coldroom' OR cr.status = 'loading_in_progress')
          ORDER BY cr.submitted_at DESC
        `;

        // Get boxes already in cold room (including those from counting records)
        const coldRoomBoxes = await prisma.$queryRaw`
          SELECT 
            counting_record_id,
            variety,
            box_type,
            size,
            grade,
            SUM(quantity) as total_loaded
          FROM cold_room_boxes 
          WHERE counting_record_id IS NOT NULL
          GROUP BY counting_record_id, variety, box_type, size, grade
        `;

        // Create a map of already loaded boxes by counting record
        const loadedMap: Record<string, Record<string, number>> = {};
        
        if (Array.isArray(coldRoomBoxes)) {
          coldRoomBoxes.forEach((box: any) => {
            if (!box.counting_record_id) return;
            
            if (!loadedMap[box.counting_record_id]) {
              loadedMap[box.counting_record_id] = {};
            }
            
            const key = `${box.variety}_${box.box_type}_${box.grade}_${box.size}`;
            loadedMap[box.counting_record_id][key] = Number(box.total_loaded) || 0;
          });
        }

        // Process records to calculate remaining boxes
        const processedRecords = Array.isArray(countingRecords) ? countingRecords.map((record: any) => {
          // Parse counting data
          let counting_data = record.counting_data;
          if (typeof counting_data === 'string') {
            try {
              counting_data = JSON.parse(counting_data);
            } catch (e) {
              counting_data = {};
            }
          }

          // Parse loaded boxes data
          let boxes_loaded_to_coldroom = record.boxes_loaded_to_coldroom;
          let loadedBoxesData: Record<string, number> = {};
          
          if (boxes_loaded_to_coldroom) {
            try {
              if (typeof boxes_loaded_to_coldroom === 'string') {
                boxes_loaded_to_coldroom = JSON.parse(boxes_loaded_to_coldroom);
              }
              loadedBoxesData = boxes_loaded_to_coldroom.loaded || boxes_loaded_to_coldroom || {};
            } catch (e) {
              loadedBoxesData = {};
            }
          }

          // Get loaded boxes from cold_room_boxes
          const recordLoadedMap = loadedMap[record.id] || {};

          // Calculate remaining boxes for each size/variety
          const remainingBoxes: Record<string, number> = {};
          let totalRemaining = 0;

          Object.keys(counting_data).forEach(key => {
            if ((key.includes('fuerte_') || key.includes('hass_')) && 
                (key.includes('_4kg_') || key.includes('_10kg_'))) {
              
              const parts = key.split('_');
              if (parts.length >= 4) {
                const variety = parts[0];
                const boxType = parts[1];
                const grade = parts[2];
                const sizeParts = parts.slice(3);
                let size = sizeParts.join('_');
                
                if (!size.startsWith('size') && /^\d+$/.test(size)) {
                  size = `size${size}`;
                }
                
                const originalQuantity = Number(counting_data[key]) || 0;
                const boxKey = `${variety}_${boxType}_${grade}_${size}`;
                
                // Calculate loaded from both sources
                const loadedFromRecord = loadedBoxesData[boxKey] || 0;
                const loadedFromColdRoom = recordLoadedMap[boxKey] || 0;
                const totalLoaded = Math.max(loadedFromRecord, loadedFromColdRoom);
                
                const remaining = Math.max(0, originalQuantity - totalLoaded);
                
                if (remaining > 0) {
                  remainingBoxes[boxKey] = remaining;
                  totalRemaining += remaining;
                }
              }
            }
          });

          return {
            ...record,
            counting_data,
            boxes_loaded_to_coldroom: loadedBoxesData,
            remaining_boxes: remainingBoxes,
            total_remaining_boxes: totalRemaining,
            has_remaining_boxes: totalRemaining > 0
          };
        }).filter(record => record.has_remaining_boxes) : [];

        console.log(`📦 Found ${processedRecords.length} records with remaining boxes to load`);

        return NextResponse.json({ 
          success: true, 
          data: processedRecords 
        });
      } catch (error) {
        console.error('Error fetching remaining boxes:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch remaining boxes',
          data: [] 
        });
      }
    }

    if (action === 'stats') {
      try {
        console.log('📊 Fetching cold room statistics...');
        
        // Get overall stats
        const overallStatsResult = await prisma.$queryRaw`
          SELECT 
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN quantity ELSE 0 END), 0) as total4kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN quantity ELSE 0 END), 0) as total10kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN FLOOR(quantity / 288) ELSE 0 END), 0) as total4kgPallets,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN FLOOR(quantity / 120) ELSE 0 END), 0) as total10kgPallets,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass210kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass210kg
          FROM cold_room_boxes
        `;

        // Get stats for coldroom1
        const coldroom1StatsResult = await prisma.$queryRaw`
          SELECT 
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN quantity ELSE 0 END), 0) as total4kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN quantity ELSE 0 END), 0) as total10kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN FLOOR(quantity / 288) ELSE 0 END), 0) as total4kgPallets,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN FLOOR(quantity / 120) ELSE 0 END), 0) as total10kgPallets,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass210kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass210kg
          FROM cold_room_boxes 
          WHERE cold_room_id = 'coldroom1'
        `;

        // Get stats for coldroom2
        const coldroom2StatsResult = await prisma.$queryRaw`
          SELECT 
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN quantity ELSE 0 END), 0) as total4kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN quantity ELSE 0 END), 0) as total10kgBoxes,
            COALESCE(SUM(CASE WHEN box_type = '4kg' THEN FLOOR(quantity / 288) ELSE 0 END), 0) as total4kgPallets,
            COALESCE(SUM(CASE WHEN box_type = '10kg' THEN FLOOR(quantity / 120) ELSE 0 END), 0) as total10kgPallets,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as fuerteClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'fuerte' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as fuerteClass210kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass14kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '4kg' THEN quantity ELSE 0 END), 0) as hassClass24kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class1' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass110kg,
            COALESCE(SUM(CASE WHEN variety = 'hass' AND grade = 'class2' AND box_type = '10kg' THEN quantity ELSE 0 END), 0) as hassClass210kg
          FROM cold_room_boxes 
          WHERE cold_room_id = 'coldroom2'
        `;

        // Get loading progress stats
        const loadingProgressStats = await prisma.$queryRaw`
          SELECT 
            COUNT(*) as total_records,
            COUNT(CASE WHEN status = 'loading_in_progress' THEN 1 END) as loading_in_progress_count,
            COUNT(CASE WHEN status = 'pending_coldroom' THEN 1 END) as pending_coldroom_count,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
            COALESCE(SUM(total_boxes_loaded), 0) as total_boxes_loaded,
            COALESCE(AVG(loading_progress_percentage), 0) as avg_loading_progress
          FROM counting_records 
          WHERE for_coldroom = TRUE
        `;

        // Get last temperature logs
        const lastTemperatureLogsResult = await prisma.$queryRaw`
          SELECT * FROM temperature_logs ORDER BY timestamp DESC LIMIT 10
        `;

        // Get recent repacking
        const recentRepackingResult = await prisma.$queryRaw`
          SELECT * FROM repacking_records ORDER BY timestamp DESC LIMIT 5
        `;

        // Format the data
        const overallStats = Array.isArray(overallStatsResult) && overallStatsResult.length > 0 
          ? overallStatsResult[0] 
          : {
              total4kgBoxes: 0,
              total10kgBoxes: 0,
              total4kgPallets: 0,
              total10kgPallets: 0,
              fuerteClass14kg: 0,
              fuerteClass24kg: 0,
              fuerteClass110kg: 0,
              fuerteClass210kg: 0,
              hassClass14kg: 0,
              hassClass24kg: 0,
              hassClass110kg: 0,
              hassClass210kg: 0
            };

        const coldroom1Stats = Array.isArray(coldroom1StatsResult) && coldroom1StatsResult.length > 0 
          ? coldroom1StatsResult[0] 
          : {
              total4kgBoxes: 0,
              total10kgBoxes: 0,
              total4kgPallets: 0,
              total10kgPallets: 0,
              fuerteClass14kg: 0,
              fuerteClass24kg: 0,
              fuerteClass110kg: 0,
              fuerteClass210kg: 0,
              hassClass14kg: 0,
              hassClass24kg: 0,
              hassClass110kg: 0,
              hassClass210kg: 0
            };

        const coldroom2Stats = Array.isArray(coldroom2StatsResult) && coldroom2StatsResult.length > 0 
          ? coldroom2StatsResult[0] 
          : {
              total4kgBoxes: 0,
              total10kgBoxes: 0,
              total4kgPallets: 0,
              total10kgPallets: 0,
              fuerteClass14kg: 0,
              fuerteClass24kg: 0,
              fuerteClass110kg: 0,
              fuerteClass210kg: 0,
              hassClass14kg: 0,
              hassClass24kg: 0,
              hassClass110kg: 0,
              hassClass210kg: 0
            };

        const loadingStats = Array.isArray(loadingProgressStats) && loadingProgressStats.length > 0 
          ? loadingProgressStats[0] 
          : {
              total_records: 0,
              loading_in_progress_count: 0,
              pending_coldroom_count: 0,
              completed_count: 0,
              total_boxes_loaded: 0,
              avg_loading_progress: 0
            };

        const lastTemperatureLogs = Array.isArray(lastTemperatureLogsResult) 
          ? lastTemperatureLogsResult 
          : [];

        const recentRepacking = Array.isArray(recentRepackingResult) 
          ? recentRepackingResult 
          : [];

        console.log('📊 Statistics loaded:', {
          overall: overallStats,
          coldroom1: coldroom1Stats,
          coldroom2: coldroom2Stats,
          loadingStats: loadingStats
        });

        return NextResponse.json({
          success: true,
          data: {
            overall: overallStats,
            coldroom1: coldroom1Stats,
            coldroom2: coldroom2Stats,
            loadingProgress: loadingStats,
            lastTemperatureLogs: lastTemperatureLogs,
            recentRepacking: recentRepacking
          }
        });

      } catch (error) {
        console.error('Error fetching cold room stats:', error);
        // Return default stats structure
        const defaultStats = {
          total4kgBoxes: 0,
          total10kgBoxes: 0,
          total4kgPallets: 0,
          total10kgPallets: 0,
          fuerteClass14kg: 0,
          fuerteClass24kg: 0,
          fuerteClass110kg: 0,
          fuerteClass210kg: 0,
          hassClass14kg: 0,
          hassClass24kg: 0,
          hassClass110kg: 0,
          hassClass210kg: 0
        };

        const defaultLoadingStats = {
          total_records: 0,
          loading_in_progress_count: 0,
          pending_coldroom_count: 0,
          completed_count: 0,
          total_boxes_loaded: 0,
          avg_loading_progress: 0
        };

        return NextResponse.json({
          success: true,
          data: {
            overall: defaultStats,
            coldroom1: defaultStats,
            coldroom2: defaultStats,
            loadingProgress: defaultLoadingStats,
            lastTemperatureLogs: [],
            recentRepacking: []
          }
        });
      }
    }

    // Default: return cold rooms list
    const coldRooms = [
      {
        id: 'coldroom1',
        name: 'Cold Room 1',
        current_temperature: 5,
        capacity: 100,
        occupied: 0
      },
      {
        id: 'coldroom2',
        name: 'Cold Room 2',
        current_temperature: 5,
        capacity: 100,
        occupied: 0
      }
    ];

    return NextResponse.json(coldRooms);

  } catch (error: any) {
    console.error('GET /api/cold-room Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint - IMPROVED LOADING PROGRESS TRACKING
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('POST /api/cold-room - Action:', data.action);

    if (data.action === 'load-boxes') {
      // Validate boxes data
      if (!Array.isArray(data.boxesData) || data.boxesData.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No boxes data provided' },
          { status: 400 }
        );
      }

      const results = [];
      const errors = [];
      const historyRecords = [];

      console.log(`📤 Processing ${data.boxesData.length} boxes for cold room...`);

      // Group boxes by counting record for progress tracking
      const boxesByRecord: Record<string, Array<any>> = {};
      data.boxesData.forEach((boxData: any) => {
        if (boxData.countingRecordId) {
          if (!boxesByRecord[boxData.countingRecordId]) {
            boxesByRecord[boxData.countingRecordId] = [];
          }
          boxesByRecord[boxData.countingRecordId].push(boxData);
        }
      });

      // Process each box
      for (const boxData of data.boxesData) {
        try {
          // Generate IDs
          const boxId = `BOX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const palletId = boxData.palletId || `PAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const historyId = `LH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const supplierName = boxData.supplierName || 'Unknown Supplier';
          const region = boxData.region || '';
          const loadedBy = boxData.loadedBy || 'Warehouse Staff';

          console.log('💾 Saving box to database:', {
            boxId,
            supplierName,
            palletId,
            variety: boxData.variety,
            quantity: boxData.quantity,
            coldRoomId: boxData.coldRoomId
          });

          // 1. SAVE TO COLD_ROOM_BOXES (current inventory)
          await prisma.$executeRaw`
            INSERT INTO cold_room_boxes (
              id,
              variety,
              box_type,
              size,
              grade,
              quantity,
              cold_room_id,
              supplier_name,
              pallet_id,
              region,
              counting_record_id,
              created_at,
              updated_at
            ) VALUES (
              ${boxId},
              ${boxData.variety},
              ${boxData.boxType},
              ${boxData.size},
              ${boxData.grade},
              ${boxData.quantity},
              ${boxData.coldRoomId},
              ${supplierName},
              ${palletId},
              ${region},
              ${boxData.countingRecordId || null},
              NOW(),
              NOW()
            )
          `;

          // 2. SAVE TO LOADING_HISTORY (permanent record)
          await prisma.$executeRaw`
            INSERT INTO loading_history (
              id,
              box_id,
              supplier_name,
              pallet_id,
              region,
              variety,
              box_type,
              size,
              grade,
              quantity,
              cold_room_id,
              loaded_by,
              loaded_at,
              notes
            ) VALUES (
              ${historyId},
              ${boxId},
              ${supplierName},
              ${palletId},
              ${region},
              ${boxData.variety},
              ${boxData.boxType},
              ${boxData.size},
              ${boxData.grade},
              ${boxData.quantity},
              ${boxData.coldRoomId},
              ${loadedBy},
              NOW(),
              ${boxData.notes || ''}
            )
          `;

          results.push({
            boxId,
            historyId,
            supplierName,
            palletId,
            region,
            variety: boxData.variety,
            boxType: boxData.boxType,
            size: boxData.size,
            grade: boxData.grade,
            quantity: boxData.quantity,
            coldRoomId: boxData.coldRoomId,
            countingRecordId: boxData.countingRecordId
          });

          historyRecords.push({
            id: historyId,
            boxId,
            supplierName,
            palletId,
            region,
            variety: boxData.variety,
            quantity: boxData.quantity,
            coldRoomId: boxData.coldRoomId
          });

          console.log(`✅ Box saved to both tables: ${boxId}, History: ${historyId}`);

        } catch (boxError: any) {
          console.error('❌ Error processing box:', boxData, boxError);
          errors.push({
            boxData,
            error: boxError.message
          });
        }
      }

      // Update counting records status with improved progress tracking
      if (Object.keys(boxesByRecord).length > 0) {
        for (const recordId of Object.keys(boxesByRecord)) {
          try {
            // First, get the current record
            const currentRecord = await prisma.$queryRaw`
              SELECT 
                boxes_loaded_to_coldroom,
                total_boxes_loaded,
                loading_progress_percentage,
                fuerte_4kg_total,
                fuerte_10kg_total,
                hass_4kg_total,
                hass_10kg_total,
                counting_data
              FROM counting_records 
              WHERE id = ${recordId}
              LIMIT 1
            `;

            if (!Array.isArray(currentRecord) || currentRecord.length === 0) {
              console.error(`❌ Counting record ${recordId} not found`);
              continue;
            }

            const record = currentRecord[0];
            
            // Parse existing data
            let loadedBoxesData: any = { loaded: {} };
            let countingData: any = {};
            
            try {
              loadedBoxesData = record.boxes_loaded_to_coldroom 
                ? JSON.parse(record.boxes_loaded_to_coldroom)
                : { loaded: {} };
              countingData = record.counting_data 
                ? JSON.parse(record.counting_data)
                : {};
            } catch (e) {
              console.error('Error parsing JSON data:', e);
              loadedBoxesData = { loaded: {} };
              countingData = {};
            }

            let totalLoaded = record.total_boxes_loaded || 0;
            let loadingProgress = record.loading_progress_percentage || 0;

            // Calculate total boxes in this record from counting_data
            let totalRecordBoxes = 0;
            Object.keys(countingData).forEach(key => {
              if ((key.includes('fuerte_') || key.includes('hass_')) && 
                  (key.includes('_4kg_') || key.includes('_10kg_'))) {
                totalRecordBoxes += Number(countingData[key]) || 0;
              }
            });

            // If counting_data is empty, use the totals from the record
            if (totalRecordBoxes === 0) {
              totalRecordBoxes = (
                (record.fuerte_4kg_total || 0) +
                (record.fuerte_10kg_total || 0) +
                (record.hass_4kg_total || 0) +
                (record.hass_10kg_total || 0)
              );
            }

            // Track this batch's boxes by size/variety/type/grade
            const boxesForThisRecord = boxesByRecord[recordId];
            const batchTotal = boxesForThisRecord.reduce((sum: number, box: any) => sum + (box.quantity || 0), 0);
            
            // Update loaded boxes tracking
            boxesForThisRecord.forEach((box: any) => {
              const boxKey = `${box.variety}_${box.boxType}_${box.grade}_${box.size}`;
              if (!loadedBoxesData.loaded[boxKey]) {
                loadedBoxesData.loaded[boxKey] = 0;
              }
              loadedBoxesData.loaded[boxKey] += box.quantity;
            });
            
            totalLoaded += batchTotal;
            
            // Calculate new progress percentage
            loadingProgress = totalRecordBoxes > 0 
              ? Math.min(100, Math.round((totalLoaded / totalRecordBoxes) * 100))
              : 100;

            const newStatus = loadingProgress === 100 ? 'completed' : 'loading_in_progress';
            
            // Update record with loading progress
            await prisma.$executeRaw`
              UPDATE counting_records 
              SET 
                status = ${newStatus},
                boxes_loaded_to_coldroom = ${JSON.stringify(loadedBoxesData)},
                total_boxes_loaded = ${totalLoaded},
                loading_progress_percentage = ${loadingProgress},
                ${newStatus === 'completed' ? 'loaded_to_coldroom_at = NOW(),' : ''}
                cold_room_loaded_to = ${data.coldRoomId || null}
              WHERE id = ${recordId}
            `;
            
            console.log(`✅ Updated counting record ${recordId}: ${loadingProgress}% loaded (${totalLoaded}/${totalRecordBoxes} boxes)`);
          } catch (updateError: any) {
            console.error(`❌ Error updating counting record ${recordId}:`, updateError);
            errors.push({
              recordId,
              error: updateError.message
            });
          }
        }
      }

      // Create pallets for boxes that meet threshold
      const palletResults = [];
      const boxesPerPallet = {
        '4kg': 288,
        '10kg': 120
      };

      // Group results by variety, boxType, size, grade, and coldRoomId for pallet creation
      const groupedResults: Record<string, any> = {};
      results.forEach(result => {
        const key = `${result.variety}-${result.boxType}-${result.size}-${result.grade}-${result.coldRoomId}`;
        if (!groupedResults[key]) {
          groupedResults[key] = {
            ...result,
            totalQuantity: 0
          };
        }
        groupedResults[key].totalQuantity += result.quantity;
      });

      for (const key in groupedResults) {
        const group = groupedResults[key];
        try {
          const palletCount = Math.floor(group.totalQuantity / boxesPerPallet[group.boxType as '4kg' | '10kg']);

          if (palletCount > 0) {
            const palletId = `PAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            await prisma.$executeRaw`
              INSERT INTO cold_room_pallets (
                id,
                variety,
                box_type,
                size,
                grade,
                pallet_count,
                cold_room_id,
                created_at,
                last_updated
              ) VALUES (
                ${palletId},
                ${group.variety},
                ${group.boxType},
                ${group.size},
                ${group.grade},
                ${palletCount},
                ${group.coldRoomId},
                NOW(),
                NOW()
              )
            `;
            
            palletResults.push({
              palletId,
              variety: group.variety,
              boxType: group.boxType,
              size: group.size,
              grade: group.grade,
              count: palletCount,
              coldRoomId: group.coldRoomId,
              totalBoxes: group.totalQuantity
            });
            
            console.log(`✅ Created ${palletCount} pallets for ${group.variety} ${group.boxType} ${group.size} ${group.grade}`);
          }
        } catch (palletError: any) {
          console.error('❌ Error creating pallet:', palletError);
        }
      }

      console.log(`✅ Successfully loaded ${results.length} boxes to cold room`);

      return NextResponse.json({
        success: true,
        data: {
          loadedCount: results.length,
          results,
          historyRecords,
          palletResults,
          errors: errors.length > 0 ? errors : undefined,
          updatedRecords: Object.keys(boxesByRecord)
        },
        message: `Successfully loaded ${results.length} boxes to cold room`
      });

    } else if (data.action === 'update-loading-progress') {
      // Update loading progress for a specific counting record
      const { 
        countingRecordId, 
        loadedBoxes, 
        totalLoaded, 
        loadingProgress,
        coldRoomId 
      } = data;
      
      if (!countingRecordId) {
        return NextResponse.json(
          { success: false, error: 'Missing countingRecordId' },
          { status: 400 }
        );
      }
      
      try {
        const newStatus = loadingProgress === 100 ? 'completed' : 'loading_in_progress';
        
        await prisma.$executeRaw`
          UPDATE counting_records 
          SET 
            boxes_loaded_to_coldroom = ${JSON.stringify(loadedBoxes || {})},
            total_boxes_loaded = ${totalLoaded || 0},
            loading_progress_percentage = ${loadingProgress || 0},
            status = ${newStatus},
            ${loadingProgress === 100 ? 'loaded_to_coldroom_at = NOW(),' : ''}
            ${coldRoomId ? 'cold_room_loaded_to = ${coldRoomId},' : ''}
            updated_at = NOW()
          WHERE id = ${countingRecordId}
        `;
        
        return NextResponse.json({
          success: true,
          message: `Loading progress updated to ${loadingProgress}%`,
          data: {
            countingRecordId,
            status: newStatus,
            loadingProgress,
            totalLoaded
          }
        });
      } catch (error: any) {
        console.error('Error updating loading progress:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

    } else if (data.action === 'record-temperature') {
      // Record temperature logic
      const id = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRaw`
        INSERT INTO temperature_logs (
          id,
          cold_room_id,
          temperature,
          timestamp,
          recorded_by
        ) VALUES (
          ${id},
          ${data.coldRoomId},
          ${data.temperature},
          NOW(),
          ${data.recordedBy || 'Warehouse Staff'}
        )
      `;

      return NextResponse.json({
        success: true,
        message: 'Temperature recorded successfully'
      });

    } else if (data.action === 'record-repacking') {
      // Record repacking logic
      const id = `REPACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$queryRaw`
        INSERT INTO repacking_records (
          id,
          cold_room_id,
          removed_boxes,
          returned_boxes,
          rejected_boxes,
          notes,
          timestamp,
          processed_by
        ) VALUES (
          ${id},
          ${data.coldRoomId},
          ${JSON.stringify(data.removedBoxes || [])},
          ${JSON.stringify(data.returnedBoxes || [])},
          ${data.rejectedBoxes || 0},
          ${data.notes || ''},
          NOW(),
          ${data.processedBy || 'Warehouse Staff'}
        )
      `;

      // Update inventory based on repacking
      for (const box of (data.removedBoxes || [])) {
        await prisma.$executeRaw`
          UPDATE cold_room_boxes 
          SET quantity = quantity - ${box.quantity},
              updated_at = NOW()
          WHERE cold_room_id = ${data.coldRoomId}
            AND variety = ${box.variety}
            AND box_type = ${box.boxType}
            AND size = ${box.size}
            AND grade = ${box.grade}
            AND quantity >= ${box.quantity}
        `;
      }

      for (const box of (data.returnedBoxes || [])) {
        // Check if box exists
        const existing = await prisma.$queryRaw`
          SELECT id FROM cold_room_boxes 
          WHERE cold_room_id = ${data.coldRoomId}
            AND variety = ${box.variety}
            AND box_type = ${box.boxType}
            AND size = ${box.size}
            AND grade = ${box.grade}
          LIMIT 1
        `;

        if (Array.isArray(existing) && existing.length > 0) {
          // Update existing
          await prisma.$executeRaw`
            UPDATE cold_room_boxes 
            SET quantity = quantity + ${box.quantity},
                updated_at = NOW()
            WHERE id = ${existing[0].id}
          `;
        } else {
          // Create new
          const boxId = `BOX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await prisma.$executeRaw`
            INSERT INTO cold_room_boxes (
              id,
              variety,
              box_type,
              size,
              grade,
              quantity,
              cold_room_id,
              created_at,
              updated_at
            ) VALUES (
              ${boxId},
              ${box.variety},
              ${box.boxType},
              ${box.size},
              ${box.grade},
              ${box.quantity},
              ${data.coldRoomId},
              NOW(),
              NOW()
            )
          `;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Repacking recorded and inventory updated'
      });

    } else if (data.action === 'search-history') {
      // Search loading history
      try {
        let query = `
          SELECT 
            id,
            box_id,
            supplier_name,
            pallet_id,
            region,
            variety,
            box_type,
            size,
            grade,
            quantity,
            cold_room_id,
            loaded_by,
            loaded_at,
            notes
          FROM loading_history 
          WHERE 1=1
        `;
        
        const params: any[] = [];
        
        // Date filtering
        if (data.dateFrom) {
          query += ` AND DATE(loaded_at) >= ?`;
          params.push(data.dateFrom);
        }
        
        if (data.dateTo) {
          query += ` AND DATE(loaded_at) <= ?`;
          params.push(data.dateTo);
        }
        
        // Supplier name filtering
        if (data.supplierName) {
          query += ` AND supplier_name LIKE ?`;
          params.push(`%${data.supplierName}%`);
        }
        
        // Cold room filtering
        if (data.coldRoomId && data.coldRoomId !== 'all') {
          query += ` AND cold_room_id = ?`;
          params.push(data.coldRoomId);
        }
        
        query += ` ORDER BY loaded_at DESC`;
        
        const history = await prisma.$queryRawUnsafe(query, ...params);
        
        return NextResponse.json({
          success: true,
          data: Array.isArray(history) ? history : []
        });
        
      } catch (error: any) {
        console.error('Error searching loading history:', error);
        return NextResponse.json({
          success: false,
          error: error.message,
          data: []
        });
      }
      
    } else if (data.action === 'remove-box') {
      // Remove box from cold room
      try {
        const { boxId, quantity, coldRoomId, notes, removedBy } = data;
        
        if (!boxId || !quantity || !coldRoomId) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }
        
        // Check if box exists
        const existingBox = await prisma.$queryRaw`
          SELECT * FROM cold_room_boxes 
          WHERE id = ${boxId} AND cold_room_id = ${coldRoomId}
          LIMIT 1
        `;
        
        if (!Array.isArray(existingBox) || existingBox.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Box not found' },
            { status: 404 }
          );
        }
        
        const currentQuantity = existingBox[0].quantity;
        
        if (currentQuantity < quantity) {
          return NextResponse.json(
            { success: false, error: 'Insufficient quantity' },
            { status: 400 }
          );
        }
        
        // Update or remove box
        if (currentQuantity === quantity) {
          // Remove completely
          await prisma.$executeRaw`
            DELETE FROM cold_room_boxes 
            WHERE id = ${boxId} AND cold_room_id = ${coldRoomId}
          `;
        } else {
          // Reduce quantity
          await prisma.$executeRaw`
            UPDATE cold_room_boxes 
            SET quantity = quantity - ${quantity},
                updated_at = NOW()
            WHERE id = ${boxId} AND cold_room_id = ${coldRoomId}
          `;
        }
        
        // Record in removal history (if table exists)
        try {
          const removalId = `REM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await prisma.$executeRaw`
            INSERT INTO box_removal_history (
              id,
              box_id,
              cold_room_id,
              quantity_removed,
              reason,
              removed_by,
              removed_at
            ) VALUES (
              ${removalId},
              ${boxId},
              ${coldRoomId},
              ${quantity},
              ${notes || 'Removed from cold room'},
              ${removedBy || 'Warehouse Staff'},
              NOW()
            )
          `;
        } catch (error) {
          console.warn('Could not record removal history (table may not exist)');
        }
        
        return NextResponse.json({
          success: true,
          message: `Successfully removed ${quantity} boxes from cold room`
        });
        
      } catch (error: any) {
        console.error('Error removing box:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      
    } else if (data.action === 'create-manual-pallet') {
      // Create manual pallet from selected boxes - UPDATED TO PREVENT DOUBLE CONVERSION
      try {
        const { palletName, coldRoomId, boxes, boxesPerPallet } = data;
        
        if (!palletName || !coldRoomId || !boxes || boxes.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }
        
        // Generate pallet ID
        const palletId = `PAL-MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate total boxes
        const totalBoxes = boxes.reduce((sum: number, box: any) => sum + (box.quantity || 0), 0);
        
        if (totalBoxes < boxesPerPallet) {
          return NextResponse.json(
            { success: false, error: `Insufficient boxes. Need ${boxesPerPallet} boxes for a complete pallet.` },
            { status: 400 }
          );
        }
        
        // Check if any of these boxes have already been converted to pallets
        let boxesAlreadyConverted = false;
        const alreadyConvertedBoxes: string[] = [];
        
        for (const box of boxes) {
          // Check if this box combination exists in cold_room_pallets (already converted)
          const existingPallet = await prisma.$queryRaw`
            SELECT id FROM cold_room_pallets 
            WHERE cold_room_id = ${coldRoomId}
              AND variety = ${box.variety}
              AND box_type = ${box.boxType}
              AND size = ${box.size}
              AND grade = ${box.grade}
              AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            LIMIT 1
          `;
          
          if (Array.isArray(existingPallet) && existingPallet.length > 0) {
            boxesAlreadyConverted = true;
            const boxDescription = `${box.variety} ${box.boxType} ${box.size} ${box.grade}`;
            alreadyConvertedBoxes.push(boxDescription);
          }
        }
        
        if (boxesAlreadyConverted) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Some boxes have already been converted to pallets in the last 24 hours: ${alreadyConvertedBoxes.join(', ')}. Please select different boxes or wait.`
            },
            { status: 400 }
          );
        }
        
        // Create pallet record
        await prisma.$executeRaw`
          INSERT INTO cold_room_pallets (
            id,
            variety,
            box_type,
            size,
            grade,
            pallet_count,
            cold_room_id,
            created_at,
            last_updated
          ) VALUES (
            ${palletId},
            'mixed',
            'mixed',
            'mixed',
            'mixed',
            ${Math.floor(totalBoxes / boxesPerPallet)},
            ${coldRoomId},
            NOW(),
            NOW()
          )
        `;
        
        // SIMPLIFIED: Create conversion history without complex SQL
        // Create a record in loading_history to track this conversion
        const conversionHistoryId = `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a summary of converted boxes
        const convertedBoxesSummary = boxes.map((box: any) => ({
          variety: box.variety,
          boxType: box.boxType,
          size: box.size,
          grade: box.grade,
          quantity: box.quantity
        }));
        
        // FIXED: Use the correct columns from your loading_history model
        // Record the conversion in loading_history WITHOUT counting_record_id
        await prisma.$executeRaw`
          INSERT INTO loading_history (
            id,
            supplier_name,
            pallet_id,
            cold_room_id,
            loaded_by,
            loaded_at,
            notes,
            variety,
            box_type,
            size,
            grade,
            quantity
          ) VALUES (
            ${conversionHistoryId},
            'Manual Pallet Creation',
            ${palletId},
            ${coldRoomId},
            'Warehouse Staff',
            NOW(),
            ${`Manual pallet created: ${palletName}. Converted boxes summary in notes.`},
            'mixed',
            'mixed',
            'mixed',
            'mixed',
            ${totalBoxes}
          )
        `;
        
        console.log(`📦 Created manual pallet ${palletId} with ${totalBoxes} boxes. Conversion recorded in history.`);
        
        return NextResponse.json({
          success: true,
          data: {
            palletId,
            palletName,
            totalBoxes,
            palletCount: Math.floor(totalBoxes / boxesPerPallet),
            coldRoomId,
            note: 'Boxes remain in cold room inventory. Conversion recorded to prevent duplicates.',
            convertedBoxes: convertedBoxesSummary
          },
          message: `Manual pallet "${palletName}" created successfully with ${totalBoxes} boxes. Conversion recorded to prevent duplicate conversions.`
        });
        
      } catch (error: any) {
        console.error('Error creating manual pallet:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      
    } else if (data.action === 'update-counting-record-status') {
      // Update counting record status directly
      const { countingRecordId, status, notes } = data;
      
      if (!countingRecordId || !status) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      try {
        await prisma.$executeRaw`
          UPDATE counting_records 
          SET 
            status = ${status},
            ${notes ? 'notes = ${notes},' : ''}
            updated_at = NOW()
            ${status === 'completed' ? ', loaded_to_coldroom_at = NOW()' : ''}
          WHERE id = ${countingRecordId}
        `;
        
        return NextResponse.json({
          success: true,
          message: `Counting record ${countingRecordId} status updated to ${status}`
        });
      } catch (error: any) {
        console.error('Error updating counting record status:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('POST /api/cold-room Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing boxes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boxId = searchParams.get('boxId');
    const coldRoomId = searchParams.get('coldRoomId');
    
    if (!boxId || !coldRoomId) {
      return NextResponse.json(
        { success: false, error: 'Missing boxId or coldRoomId' },
        { status: 400 }
      );
    }
    
    // Check if box exists
    const existingBox = await prisma.$queryRaw`
      SELECT * FROM cold_room_boxes 
      WHERE id = ${boxId} AND cold_room_id = ${coldRoomId}
      LIMIT 1
    `;
    
    if (!Array.isArray(existingBox) || existingBox.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Box not found' },
        { status: 404 }
      );
    }
    
    // Record removal before deleting (if table exists)
    try {
      const removalId = `REM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await prisma.$executeRaw`
        INSERT INTO box_removal_history (
          id,
          box_id,
          cold_room_id,
          quantity_removed,
          reason,
          removed_by,
          removed_at
        ) VALUES (
          ${removalId},
          ${boxId},
          ${coldRoomId},
          ${existingBox[0].quantity},
          'Complete removal from cold room',
          'System',
          NOW()
        )
      `;
    } catch (error) {
      console.warn('Could not record removal history (table may not exist)');
    }
    
    // Delete the box
    await prisma.$executeRaw`
      DELETE FROM cold_room_boxes 
      WHERE id = ${boxId} AND cold_room_id = ${coldRoomId}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Box successfully removed from cold room'
    });
    
  } catch (error: any) {
    console.error('DELETE /api/cold-room Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
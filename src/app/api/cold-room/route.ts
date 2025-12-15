// app/api/cold-room/route.ts
import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (replace with database in production)
let coldRooms = [
  {
    id: 'coldroom1',
    name: 'Cold Room 1',
    current_temperature: 5.0,
    capacity: 100,
    occupied: 35
  },
  {
    id: 'coldroom2',
    name: 'Cold Room 2',
    current_temperature: 5.0,
    capacity: 150,
    occupied: 42
  }
];

let coldRoomBoxes: any[] = [];
let coldRoomPallets: any[] = [];
let temperatureLogs: any[] = [];
let repackingRecords: any[] = [];

// Helper function to calculate pallets
const calculatePallets = (quantity: number, boxType: '4kg' | '10kg'): number => {
  if (boxType === '4kg') {
    return Math.floor(quantity / 288);
  } else {
    return Math.floor(quantity / 120);
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log('📡 GET /api/cold-room?action=', action);
    
    if (action === 'boxes') {
      // Return boxes data
      return NextResponse.json({
        success: true,
        data: coldRoomBoxes
      });
      
    } else if (action === 'pallets') {
      // Return pallets data
      return NextResponse.json({
        success: true,
        data: coldRoomPallets
      });
      
    } else if (action === 'temperature') {
      // Return temperature logs
      return NextResponse.json({
        success: true,
        data: temperatureLogs
      });
      
    } else if (action === 'repacking') {
      // Return repacking records
      return NextResponse.json({
        success: true,
        data: repackingRecords
      });
      
    } else if (action === 'stats') {
      // Calculate stats
      const calculateStats = (roomId?: string) => {
        const boxes = roomId ? coldRoomBoxes.filter(b => b.cold_room_id === roomId) : coldRoomBoxes;
        
        return {
          total4kgBoxes: boxes.filter((b: any) => b.box_type === '4kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          total10kgBoxes: boxes.filter((b: any) => b.box_type === '10kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          total4kgPallets: boxes.filter((b: any) => b.box_type === '4kg').reduce((sum: number, box: any) => sum + calculatePallets(box.quantity || 0, '4kg'), 0),
          total10kgPallets: boxes.filter((b: any) => b.box_type === '10kg').reduce((sum: number, box: any) => sum + calculatePallets(box.quantity || 0, '10kg'), 0),
          fuerteClass14kg: boxes.filter((b: any) => b.variety === 'fuerte' && b.grade === 'class1' && b.box_type === '4kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          fuerteClass24kg: boxes.filter((b: any) => b.variety === 'fuerte' && b.grade === 'class2' && b.box_type === '4kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          fuerteClass110kg: boxes.filter((b: any) => b.variety === 'fuerte' && b.grade === 'class1' && b.box_type === '10kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          fuerteClass210kg: boxes.filter((b: any) => b.variety === 'fuerte' && b.grade === 'class2' && b.box_type === '10kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          hassClass14kg: boxes.filter((b: any) => b.variety === 'hass' && b.grade === 'class1' && b.box_type === '4kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          hassClass24kg: boxes.filter((b: any) => b.variety === 'hass' && b.grade === 'class2' && b.box_type === '4kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          hassClass110kg: boxes.filter((b: any) => b.variety === 'hass' && b.grade === 'class1' && b.box_type === '10kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          hassClass210kg: boxes.filter((b: any) => b.variety === 'hass' && b.grade === 'class2' && b.box_type === '10kg').reduce((sum: number, box: any) => sum + (box.quantity || 0), 0),
          lastTemperatureLogs: temperatureLogs.filter((t: any) => !roomId || t.cold_room_id === roomId).slice(0, 5),
          recentRepacking: repackingRecords.filter((r: any) => !roomId || r.cold_room_id === roomId).slice(0, 5),
        };
      };
      
      const stats = {
        overall: calculateStats(),
        coldroom1: calculateStats('coldroom1'),
        coldroom2: calculateStats('coldroom2'),
      };
      
      return NextResponse.json({
        success: true,
        data: stats
      });
      
    } else {
      // Default: Return cold rooms list
      return NextResponse.json({
        success: true,
        data: coldRooms
      });
    }
    
  } catch (error: any) {
    console.error('❌ GET /api/cold-room Error:', error.message);
    return NextResponse.json({
      success: true,
      data: coldRooms
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const action = data.action;
    
    console.log('📨 POST /api/cold-room - Action:', action, data);
    
    if (action === 'load-boxes') {
      const { boxesData, countingRecordId } = data;
      
      if (!boxesData || !Array.isArray(boxesData)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid boxes data'
        }, { status: 400 });
      }
      
      // Add boxes to cold room
      const loadedBoxes = [];
      for (const boxData of boxesData) {
        const boxId = `CRB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const boxRecord = {
          id: boxId,
          variety: boxData.variety,
          box_type: boxData.boxType,
          size: boxData.size,
          grade: boxData.grade,
          quantity: boxData.quantity,
          cold_room_id: boxData.coldRoomId,
          created_at: new Date().toISOString(),
          counting_record_id: countingRecordId,
        };
        
        coldRoomBoxes.push(boxRecord);
        loadedBoxes.push(boxRecord);
        
        // Create pallet if enough boxes
        const palletCount = calculatePallets(boxData.quantity, boxData.boxType);
        if (palletCount > 0) {
          const palletId = `CRP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const palletRecord = {
            id: palletId,
            variety: boxData.variety,
            box_type: boxData.boxType,
            size: boxData.size,
            grade: boxData.grade,
            pallet_count: palletCount,
            cold_room_id: boxData.coldRoomId,
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          };
          
          coldRoomPallets.push(palletRecord);
        }
      }
      
      // Update cold room occupancy
      const updatedColdRooms = coldRooms.map(room => {
        const roomBoxes = coldRoomBoxes.filter(box => box.cold_room_id === room.id);
        const roomPallets = coldRoomPallets.filter(pallet => pallet.cold_room_id === room.id);
        return {
          ...room,
          occupied: roomPallets.length
        };
      });
      coldRooms = updatedColdRooms;
      
      return NextResponse.json({
        success: true,
        data: {
          loadedBoxes: loadedBoxes.length,
          boxes: loadedBoxes,
          message: 'Boxes loaded successfully'
        }
      });
      
    } else if (action === 'record-temperature') {
      const { coldRoomId, temperature, recordedBy } = data;
      
      const tempLogId = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempLog = {
        id: tempLogId,
        cold_room_id: coldRoomId,
        temperature: parseFloat(temperature),
        timestamp: new Date().toISOString(),
        recorded_by: recordedBy || 'Warehouse Staff',
      };
      
      temperatureLogs.push(tempLog);
      
      // Update cold room temperature
      const updatedColdRooms = coldRooms.map(room => 
        room.id === coldRoomId 
          ? { ...room, current_temperature: parseFloat(temperature) }
          : room
      );
      coldRooms = updatedColdRooms;
      
      return NextResponse.json({
        success: true,
        data: tempLog
      });
      
    } else if (action === 'record-repacking') {
      const { coldRoomId, removedBoxes, returnedBoxes, notes, processedBy } = data;
      
      const repackId = `REPACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const repackRecord = {
        id: repackId,
        cold_room_id: coldRoomId,
        removed_boxes: removedBoxes || [],
        returned_boxes: returnedBoxes || [],
        rejected_boxes: 0,
        notes: notes || '',
        timestamp: new Date().toISOString(),
        processed_by: processedBy || 'Warehouse Staff',
      };
      
      repackingRecords.push(repackRecord);
      
      return NextResponse.json({
        success: true,
        data: repackRecord
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unknown action'
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('❌ POST /api/cold-room Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
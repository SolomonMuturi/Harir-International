// app/api/rejections/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Import the shared data (in production, use database)
let rejectionRecords: any[] = [];

// Initialize with data from the counting route
// In production, this would be a database

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let filteredRecords = [...rejectionRecords];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRecords = filteredRecords.filter(record =>
        record.supplier_name?.toLowerCase().includes(searchLower) ||
        record.pallet_id?.toLowerCase().includes(searchLower) ||
        record.region?.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filter
    if (startDate || endDate) {
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.submitted_at);
        let isValid = true;
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          isValid = isValid && recordDate >= start;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          isValid = isValid && recordDate <= end;
        }
        
        return isValid;
      });
    }

    // Sort by date (newest first)
    filteredRecords.sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );

    return NextResponse.json(filteredRecords);

  } catch (error) {
    console.error('Error fetching rejection records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rejection records' },
      { status: 500 }
    );
  }
}

// POST endpoint to directly create a rejection record (for testing)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.supplier_id || !data.supplier_name || !data.pallet_id) {
      return NextResponse.json(
        { error: 'Missing required fields: supplier_id, supplier_name, or pallet_id' },
        { status: 400 }
      );
    }

    // Generate ID
    const id = `REJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create rejection record
    const rejectionRecord = {
      id,
      ...data,
      submitted_at: data.submitted_at || new Date().toISOString(),
      processed_by: data.processed_by || 'System',
    };

    // Add to storage
    rejectionRecords.push(rejectionRecord);

    return NextResponse.json(rejectionRecord, { status: 201 });

  } catch (error) {
    console.error('Error saving rejection record:', error);
    return NextResponse.json(
      { error: 'Failed to save rejection record' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing record ID' },
        { status: 400 }
      );
    }

    const initialLength = rejectionRecords.length;
    rejectionRecords = rejectionRecords.filter(record => record.id !== id);

    if (rejectionRecords.length === initialLength) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting rejection record:', error);
    return NextResponse.json(
      { error: 'Failed to delete rejection record' },
      { status: 500 }
    );
  }
}
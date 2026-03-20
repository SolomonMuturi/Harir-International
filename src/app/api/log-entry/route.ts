
import { NextResponse } from 'next/server';

/**
 * API route to handle logging a package entry into a cold room.
 */
export async function POST(request: Request) {
  try {
    const { packageId, coldRoomId, scanType } = await request.json();

    // 1. Basic Validation
    if (!packageId || !coldRoomId || !scanType) {
      return NextResponse.json(
        { message: 'Missing required fields: packageId, coldRoomId, and scanType.' },
        { status: 400 }
      );
    }
    
    if (scanType !== 'ENTRY' && scanType !== 'EXIT') {
      return NextResponse.json(
        { message: 'Invalid scanType. Must be either "ENTRY" or "EXIT".' },
        { status: 400 }
      );
    }
    
    // 2. Simulate Database Interaction
    // In a real application, you would create a log entry in your database.
    // For an EXIT scan, you might also update the status of the package record.
    const logId = `LOG-${Math.floor(Math.random() * 1000000)}`;
    console.log(`[API] Logged: Package ${packageId} ${scanType === 'ENTRY' ? '->' : '<-'} Cold Room ${coldRoomId} (${scanType})`);

    // 3. Send successful response
    return NextResponse.json(
      {
        message: `Package ${scanType.toLowerCase()} logged successfully.`,
        logId: logId,
        timestamp: new Date().toISOString(),
      },
      { status: 201 } // 201 Created is appropriate for a new resource creation
    );

  } catch (error) {
    console.error('API error during log entry:', error);
    
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Internal server error while logging entry.' },
      { status: 500 }
    );
  }
}

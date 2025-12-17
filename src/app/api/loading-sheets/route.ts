import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper functions
function cleanString(input: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed;
}

function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Generate a short unique ID (max 20 chars)
function generateShortId(prefix: string = 'ls'): string {
  const timestamp = Date.now().toString(36); // Base36 for shorter timestamp
  const random = Math.random().toString(36).substr(2, 4); // 4 random chars
  return `${prefix}-${timestamp}-${random}`; // Example: "ls-abc123-defg"
}

// GET: Fetch loading sheets
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Loading Sheets API: Fetching...');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const client = cleanString(searchParams.get('client'));
    const container = cleanString(searchParams.get('container'));
    const billNumber = cleanString(searchParams.get('billNumber'));
    const startDate = cleanString(searchParams.get('startDate'));
    const endDate = cleanString(searchParams.get('endDate'));
    const includePallets = searchParams.get('includePallets') !== 'false';

    // Build where clause
    const where: any = {};

    if (client) {
      where.client = { contains: client, mode: 'insensitive' };
    }

    if (container) {
      where.container = { contains: container, mode: 'insensitive' };
    }

    if (billNumber) {
      where.bill_number = { contains: billNumber, mode: 'insensitive' };
    }

    if (startDate && endDate) {
      where.loading_date = {
        gte: parseDate(startDate),
        lte: parseDate(endDate)
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Define include condition
    const include = includePallets ? {
      loading_pallets: {
        orderBy: { pallet_no: 'asc' }
      }
    } : {};

    // Fetch loading sheets
    const [loadingSheets, totalCount] = await Promise.all([
      prisma.loading_sheets.findMany({
        where,
        include,
        orderBy: { loading_date: 'desc' },
        skip,
        take: limit
      }),
      prisma.loading_sheets.count({ where })
    ]);

    console.log(`✅ Found ${loadingSheets.length} loading sheet(s) out of ${totalCount} total`);

    return NextResponse.json({
      success: true,
      data: loadingSheets,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching loading sheets:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch loading sheets', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: Create a new loading sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('💾 Loading Sheets API: Saving loading sheet...', {
      exporter: body.exporter,
      client: body.client,
      palletsCount: body.pallets?.length || 0,
      billNumber: body.billNumber
    });

    // Validate required fields
    if (!body.exporter) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required field: exporter is required' 
        },
        { status: 400 }
      );
    }

    // Validate loading date
    const loadingDate = parseDate(body.loadingDate);
    if (!loadingDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid loading date format' 
        },
        { status: 400 }
      );
    }

    // Create loading sheet with pallets in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate short IDs
      const loadingSheetId = generateShortId('ls');
      console.log('Generated loading sheet ID:', loadingSheetId);
      
      // Create the loading sheet - LET PRISMA GENERATE THE ID AUTOMATICALLY
      const loadingSheet = await tx.loading_sheets.create({
        data: {
          // Don't specify id - let Prisma use @default(cuid())
          exporter: body.exporter,
          client: body.client || '',
          shipping_line: body.shippingLine || '',
          bill_number: body.billNumber || `BILL-${Date.now().toString(36)}`,
          container: body.container || '',
          seal1: body.seal1 || '',
          seal2: body.seal2 || '',
          truck: body.truck || '',
          vessel: body.vessel || '',
          eta_msa: parseDate(body.etaMSA),
          etd_msa: parseDate(body.etdMSA),
          port: body.port || '',
          eta_port: parseDate(body.etaPort),
          temp_rec1: body.tempRec1 || '',
          temp_rec2: body.tempRec2 || '',
          loading_date: loadingDate,
          loaded_by: body.loadedBy || '',
          checked_by: body.checkedBy || '',
          remarks: body.remarks || ''
        }
      });

      console.log(`✅ Created loading sheet: ${loadingSheet.id}`);

      // Create pallet records if provided
      if (body.pallets && Array.isArray(body.pallets) && body.pallets.length > 0) {
        const palletData = body.pallets.map((pallet: any, index: number) => ({
          // Don't specify id - let Prisma use @default(cuid())
          loading_sheet_id: loadingSheet.id,
          pallet_no: pallet.palletNo || index + 1,
          temp: pallet.temp?.toString() || '',
          trace_code: pallet.traceCode?.toString() || '',
          size12: Number(pallet.sizes?.size12) || 0,
          size14: Number(pallet.sizes?.size14) || 0,
          size16: Number(pallet.sizes?.size16) || 0,
          size18: Number(pallet.sizes?.size18) || 0,
          size20: Number(pallet.sizes?.size20) || 0,
          size22: Number(pallet.sizes?.size22) || 0,
          size24: Number(pallet.sizes?.size24) || 0,
          size26: Number(pallet.sizes?.size26) || 0,
          size28: Number(pallet.sizes?.size28) || 0,
          size30: Number(pallet.sizes?.size30) || 0,
          total: Number(pallet.total) || 0
        }));

        await tx.loading_pallets.createMany({
          data: palletData
        });

        console.log(`✅ Created ${palletData.length} pallet records`);
      }

      // Return the complete loading sheet with pallets
      const completeSheet = await tx.loading_sheets.findUnique({
        where: { id: loadingSheet.id },
        include: { 
          loading_pallets: {
            orderBy: { pallet_no: 'asc' }
          }
        }
      });

      return completeSheet;
    });

    return NextResponse.json({
      success: true,
      message: 'Loading sheet saved successfully',
      data: result
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error saving loading sheet:', error);
    
    // Check for specific database errors
    let errorMessage = error.message;
    if (error.code === 'P2000') {
      errorMessage = 'Database field length error. Please check your data.';
    } else if (error.message?.includes('table') && error.message?.includes('does not exist')) {
      errorMessage = 'Database tables not set up. Please run migrations: npx prisma migrate dev';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save loading sheet', 
        details: errorMessage,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// PUT: Update an existing loading sheet
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing loading sheet ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`✏️ Loading Sheets API: Updating loading sheet ${id}...`);

    // Validate loading date if provided
    const loadingDate = body.loadingDate ? parseDate(body.loadingDate) : undefined;

    const updatedSheet = await prisma.$transaction(async (tx) => {
      // Update the loading sheet
      const sheet = await tx.loading_sheets.update({
        where: { id },
        data: {
          exporter: body.exporter,
          client: body.client,
          shipping_line: body.shippingLine,
          bill_number: body.billNumber,
          container: body.container,
          seal1: body.seal1,
          seal2: body.seal2,
          truck: body.truck,
          vessel: body.vessel,
          eta_msa: body.etaMSA ? parseDate(body.etaMSA) : null,
          etd_msa: body.etdMSA ? parseDate(body.etdMSA) : null,
          port: body.port,
          eta_port: body.etaPort ? parseDate(body.etaPort) : null,
          temp_rec1: body.tempRec1,
          temp_rec2: body.tempRec2,
          loading_date: loadingDate,
          loaded_by: body.loadedBy,
          checked_by: body.checkedBy,
          remarks: body.remarks
        }
      });

      // If pallets are provided, update them
      if (body.pallets && Array.isArray(body.pallets)) {
        // Delete existing pallets
        await tx.loading_pallets.deleteMany({
          where: { loading_sheet_id: id }
        });

        // Create new pallets
        if (body.pallets.length > 0) {
          const palletData = body.pallets.map((pallet: any, index: number) => ({
            // Don't specify id - let Prisma use @default(cuid())
            loading_sheet_id: id,
            pallet_no: pallet.palletNo || index + 1,
            temp: pallet.temp?.toString() || '',
            trace_code: pallet.traceCode?.toString() || '',
            size12: Number(pallet.sizes?.size12) || 0,
            size14: Number(pallet.sizes?.size14) || 0,
            size16: Number(pallet.sizes?.size16) || 0,
            size18: Number(pallet.sizes?.size18) || 0,
            size20: Number(pallet.sizes?.size20) || 0,
            size22: Number(pallet.sizes?.size22) || 0,
            size24: Number(pallet.sizes?.size24) || 0,
            size26: Number(pallet.sizes?.size26) || 0,
            size28: Number(pallet.sizes?.size28) || 0,
            size30: Number(pallet.sizes?.size30) || 0,
            total: Number(pallet.total) || 0
          }));

          await tx.loading_pallets.createMany({
            data: palletData
          });

          console.log(`✅ Updated ${palletData.length} pallet records`);
        }
      }

      // Return the complete updated sheet
      const completeSheet = await tx.loading_sheets.findUnique({
        where: { id },
        include: { 
          loading_pallets: {
            orderBy: { pallet_no: 'asc' }
          }
        }
      });

      return completeSheet;
    });

    return NextResponse.json({
      success: true,
      message: 'Loading sheet updated successfully',
      data: updatedSheet
    });

  } catch (error: any) {
    console.error('❌ Error updating loading sheet:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update loading sheet', 
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove a loading sheet
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing loading sheet ID' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Loading Sheets API: Deleting loading sheet ${id}...`);

    await prisma.loading_sheets.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Loading sheet deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting loading sheet:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete loading sheet', 
        details: error.message
      },
      { status: 500 }
    );
  }
}
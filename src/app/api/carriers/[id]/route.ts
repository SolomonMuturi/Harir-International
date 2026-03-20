import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`🗑️ DELETE /api/carriers/${id}`);
    
    // Check if carrier exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM carriers WHERE id = ${id}
    `;
    
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Carrier not found'
      }, { status: 404 });
    }
    
    // Delete carrier
    await prisma.$executeRaw`
      DELETE FROM carriers WHERE id = ${id}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Carrier deleted successfully'
    });
    
  } catch (error: any) {
    console.error('❌ DELETE Error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete carrier'
    }, { status: 500 });
  }
}
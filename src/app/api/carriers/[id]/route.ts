import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermission(request, ['carriers.manage']);
  if (auth.error) return auth.error;

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
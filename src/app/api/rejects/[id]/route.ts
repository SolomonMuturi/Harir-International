// app/api/rejects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('🗑️ DELETE /api/rejects called for id:', id);
    
    // Check if reject exists
    const reject = await prisma.rejects.findUnique({
      where: { id }
    });
    
    if (!reject) {
      return NextResponse.json(
        { error: 'Reject entry not found' },
        { status: 404 }
      );
    }
    
    // Delete the reject entry
    await prisma.rejects.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Reject entry deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting reject:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Reject entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete reject entry',
        details: error.message
      },
      { status: 500 }
    );
  }
}
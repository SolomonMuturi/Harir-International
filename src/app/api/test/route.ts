import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check if we can connect to database
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test 2: Check if visitors table exists and get count
    const visitorCount = await prisma.visitors.count();
    console.log(`✅ Visitors table exists with ${visitorCount} records`);
    
    // Test 3: Get sample data if exists
    const sampleVisitors = await prisma.visitors.findMany({
      take: 5,
      orderBy: { created_at: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      databaseConnected: true,
      visitorCount,
      sampleVisitors,
      message: 'Database test successful'
    });
    
  } catch (error: any) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      databaseConnected: false,
      error: error.message,
      message: 'Database test failed'
    }, { status: 500 });
  }
}
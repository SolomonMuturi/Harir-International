import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Fetch all attendance records
// GET - Fetch all attendance records
export async function GET() {
  try {
    console.log('GET /api/attendance - Fetching attendance records')
    
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Check if the Attendance table exists by querying the information_schema (MySQL specific)
    // This is a raw query, so be cautious. Alternatively, we can just try to query the table and catch the error.
    try {
      const attendance = await prisma.attendance.findMany({
        orderBy: { date: 'desc' }
      })
      console.log(`Found ${attendance.length} attendance records`)
      return NextResponse.json(attendance)
    } catch (tableError: any) {
      console.error('Error querying attendance table:', tableError)
      // If the error is about the table not existing, we can return an empty array or a specific message.
      if (tableError.message.includes('does not exist') || tableError.code === 'P2021') {
        return NextResponse.json([]) // Return empty array if table doesn't exist
      }
      throw tableError; // Re-throw if it's a different error
    }
    
  } catch (error: any) {
    console.error('Error in GET /api/attendance:', error)
    
    // Return a structured error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch attendance',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
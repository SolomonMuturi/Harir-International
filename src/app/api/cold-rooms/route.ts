import { prisma } from '../../../lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const coldRooms = await prisma.cold_rooms.findMany({
      orderBy: { created_at: 'desc' }
    })
    
    return NextResponse.json(coldRooms)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch cold rooms', details: error.message },
      { status: 500 }
    )
  }
}
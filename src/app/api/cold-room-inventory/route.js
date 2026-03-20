import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const inventory = await prisma.cold_room_inventory.findMany({
      orderBy: { created_at: 'desc' }
    })
    
    return NextResponse.json(inventory)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cold room inventory', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    const newInventory = await prisma.cold_room_inventory.create({
      data: {
        id: `inv-${Date.now()}`,
        product: body.product,
        category: body.category,
        quantity: body.quantity,
        unit: body.unit,
        location: body.location,
        entry_date: body.entryDate ? new Date(body.entryDate) : null,
        current_weight: body.currentWeight,
        reorder_threshold: body.reorderThreshold
      }
    })

    return NextResponse.json(newInventory, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item', details: error.message },
      { status: 500 }
    )
  }
}
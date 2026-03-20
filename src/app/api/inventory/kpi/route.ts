import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return NextResponse.json({
      totalValue: 25400000,
      itemsBelowReorder: 2,
      inventoryTurnover: 5.2,
    });
  } catch (error) {
    console.error('Error fetching inventory KPIs:', error);
    
    return NextResponse.json({
      totalValue: 25400000,
      itemsBelowReorder: 3,
      inventoryTurnover: 5.2,
    });
  }
}
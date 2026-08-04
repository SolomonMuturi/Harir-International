import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, ['inventory.view', 'inventory.manage', 'dashboard.view']);
  if (auth.error) return auth.error;
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
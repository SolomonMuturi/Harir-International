import { NextRequest, NextResponse } from 'next/server';

// Mock storage for stock take results (in real app, use database)
let stockTakeHistory: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { counts, userId, timestamp } = body;
    
    if (!counts || !Array.isArray(counts)) {
      return NextResponse.json(
        { error: 'Missing or invalid counts array' },
        { status: 400 }
      );
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate summary statistics
    const totalItems = counts.length;
    let exactMatches = 0;
    let variances = 0;
    let totalVariance = 0;
    
    counts.forEach(item => {
      const variance = item.counted - item.expected;
      if (variance === 0) {
        exactMatches++;
      } else {
        variances++;
        totalVariance += Math.abs(variance);
      }
    });
    
    // Create stock take record
    const stockTakeRecord = {
      id: `st-${Date.now()}`,
      userId: userId || 'anonymous',
      timestamp: timestamp || new Date().toISOString(),
      totalItems,
      exactMatches,
      variances,
      averageVariance: variances > 0 ? totalVariance / variances : 0,
      counts,
    };
    
    // Store in mock history (in real app, save to database)
    stockTakeHistory.unshift(stockTakeRecord);
    
    // Keep only last 100 records
    if (stockTakeHistory.length > 100) {
      stockTakeHistory = stockTakeHistory.slice(0, 100);
    }
    
    return NextResponse.json({
      success: true,
      message: `Stock take completed for ${totalItems} items`,
      summary: {
        totalItems,
        exactMatches,
        variances,
        averageVariance: totalVariance > 0 ? (totalVariance / variances).toFixed(2) : 0,
      },
      timestamp: new Date().toISOString(),
      recordId: stockTakeRecord.id,
    });
    
  } catch (error) {
    console.error('Error processing stock take:', error);
    return NextResponse.json(
      { error: 'Failed to process stock take' },
      { status: 500 }
    );
  }
}

// GET: Retrieve stock take history
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      history: stockTakeHistory.slice(0, 20), // Return last 20 records
      total: stockTakeHistory.length,
    });
  } catch (error) {
    console.error('Error fetching stock take history:', error);
    return NextResponse.json({
      success: false,
      history: [],
      total: 0,
    });
  }
}
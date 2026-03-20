// src/app/api/activity-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const recent = searchParams.get('recent') === 'true';

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    // Fetch activity logs from your database
    const logs = await prisma.activity_logs.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    // Format the logs for frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      user: log.user,
      avatar: log.avatar,
      action: log.action,
      ip: log.ip,
      timestamp: log.timestamp,
      status: log.status as 'success' | 'failure' | 'pending',
      created_at: log.created_at,
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      total: formattedLogs.length,
      message: recent ? 'Recent activity logs fetched' : 'Activity logs fetched',
    });

  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    
    // Check if table exists
    if (error.message?.includes("doesn't exist") || error.code === 'P2021') {
      return NextResponse.json({
        success: false,
        error: 'Activity logs table not found',
        message: 'Please run Prisma migrations to create the activity_logs table',
        logs: [],
        total: 0,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch activity logs',
      message: error.message || 'Unknown error occurred',
      logs: [],
      total: 0,
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Validate required fields
    if (!body.action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required',
      }, { status: 400 });
    }

    // Create activity log in database
    const log = await prisma.activity_logs.create({
      data: {
        user: body.user || null,
        avatar: body.avatar || null,
        action: body.action,
        ip: body.ip || ip,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        status: body.status || 'success',
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      log,
      message: 'Activity logged successfully',
    });
    
  } catch (error: any) {
    console.error('Error creating activity log:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create activity log',
      message: error.message || 'Unknown error occurred',
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}
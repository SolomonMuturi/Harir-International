// src/app/api/activity-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { user: { contains: search } },
        { ip: { contains: search } },
      ];
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      where.timestamp = { gte: from };
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      where.timestamp = { ...where.timestamp, lte: to };
    }

    // Fetch logs
    const logs = await prisma.activity_logs.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count
    const total = await prisma.activity_logs.count({ where });

    // Get status counts
    const statusCounts = await prisma.$transaction([
      prisma.activity_logs.count({ where: { ...where, status: 'success' } }),
      prisma.activity_logs.count({ where: { ...where, status: 'failure' } }),
      prisma.activity_logs.count({ where: { ...where, status: 'pending' } }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      counts: {
        success: statusCounts[0],
        failure: statusCounts[1],
        pending: statusCounts[2],
      },
    });

  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activity logs',
        message: error.message,
        logs: [],
        total: 0,
      },
      { status: 500 }
    );
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
      return NextResponse.json(
        {
          success: false,
          error: 'Action is required',
        },
        { status: 400 }
      );
    }

    // Create activity log
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create activity log',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const olderThan = searchParams.get('olderThan');

    if (id) {
      await prisma.activity_logs.delete({
        where: { id },
      });
      return NextResponse.json({
        success: true,
        message: 'Activity log deleted successfully',
      });
    }

    if (olderThan) {
      const date = new Date(olderThan);
      const deleted = await prisma.activity_logs.deleteMany({
        where: {
          timestamp: { lt: date },
        },
      });
      return NextResponse.json({
        success: true,
        deleted: deleted.count,
        message: `${deleted.count} activity logs deleted`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Either id or olderThan parameter is required',
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error deleting activity logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete activity logs',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
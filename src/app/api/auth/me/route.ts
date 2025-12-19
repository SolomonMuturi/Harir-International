import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      cookieStore.delete('auth-token');
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    // Parse role permissions
    const roleWithPermissions = user.role ? {
      ...user.role,
      permissions: JSON.parse(user.role.permissions || '[]') as string[],
    } : null;

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        role: roleWithPermissions,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    return NextResponse.json(
      { user: null },
      { status: 200 }
    );
  }
}
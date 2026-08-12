// /app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requirePermission } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
});

// POST /api/auth/change-password - Change the authenticated user's password
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, []);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    if (validatedData.newPassword !== validatedData.confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'New passwords do not match',
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const currentValid = await bcrypt.compare(validatedData.currentPassword, user.password);
    if (!currentValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Current password is incorrect',
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error changing password:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to change password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const assignRoleSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1, 'At least one user ID is required'),
  roleId: z.string().optional().nullable(), // null means unassign role
});

// PATCH /api/user-roles/assign - Assign roles to users
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = assignRoleSchema.parse(body);

    // Verify role exists if roleId is provided
    if (validatedData.roleId) {
      const role = await prisma.userRole.findUnique({
        where: { id: validatedData.roleId },
      });

      if (!role) {
        return NextResponse.json(
          {
            success: false,
            error: 'Role not found'
          },
          { status: 404 }
        );
      }
    }

    // Update users with new role
    const updatedUsers = await prisma.User.updateMany({
      where: {
        id: { in: validatedData.userIds }
      },
      data: {
        roleId: validatedData.roleId || null
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned role to ${updatedUsers.count} user(s)`,
      assignedCount: updatedUsers.count
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Error assigning role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
// /app/api/user-roles/assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const assignRoleSchema = z.object({
  userIds: z.array(z.string()),
  roleId: z.string().optional().nullable(),
});

// PATCH /api/user-roles/assign - Assign/unassign roles to users
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = assignRoleSchema.parse(body);
    
    // Check if all users exist
    const users = await prisma.user.findMany({
      where: {
        id: { in: validatedData.userIds }
      },
      select: { id: true, email: true }
    });
    
    if (users.length !== validatedData.userIds.length) {
      const foundIds = users.map(u => u.id);
      const missingIds = validatedData.userIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Some users not found',
          missingIds
        },
        { status: 404 }
      );
    }
    
    // Check if role exists (if provided)
    if (validatedData.roleId) {
      const role = await prisma.userRole.findUnique({
        where: { id: validatedData.roleId },
      });
      
      if (!role) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Specified role not found'
          },
          { status: 404 }
        );
      }
    }
    
    // Update users' roles
    await prisma.user.updateMany({
      where: {
        id: { in: validatedData.userIds }
      },
      data: {
        roleId: validatedData.roleId || null,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Role ${validatedData.roleId ? 'assigned' : 'unassigned'} for ${validatedData.userIds.length} user(s)`,
      count: validatedData.userIds.length,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
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
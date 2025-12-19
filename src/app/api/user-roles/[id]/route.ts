import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name must be at least 1 character').max(100, 'Role name cannot exceed 100 characters').optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/user-roles/[id] - Get single role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await prisma.userRole.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
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
    
    return NextResponse.json({
      success: true,
      role: {
        ...role,
        permissions: role.permissions as string[],
        userCount: role._count.users,
      },
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/user-roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = updateRoleSchema.parse(body);
    
    // Check if role exists
    const existingRole = await prisma.userRole.findUnique({
      where: { id: params.id },
    });
    
    if (!existingRole) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Role not found' 
        },
        { status: 404 }
      );
    }
    
    // Check if new name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameExists = await prisma.userRole.findUnique({
        where: { name: validatedData.name },
      });
      
      if (nameExists) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Role with this name already exists' 
          },
          { status: 400 }
        );
      }
    }
    
    // If setting as default, unset other defaults
    if (validatedData.isDefault === true) {
      await prisma.userRole.updateMany({
        where: { 
          isDefault: true,
          id: { not: params.id }, // Don't unset the current role
        },
        data: { isDefault: false },
      });
    }
    
    const updatedRole = await prisma.userRole.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        permissions: validatedData.permissions,
        isDefault: validatedData.isDefault,
      },
    });
    
    return NextResponse.json({
      success: true,
      role: {
        ...updatedRole,
        permissions: updatedRole.permissions as string[],
      },
      message: 'Role updated successfully'
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
    
    console.error('Error updating role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/user-roles/[id] - Partial update (optional alternative)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input with partial schema
    const validatedData = updateRoleSchema.partial().parse(body);
    
    // Check if role exists
    const existingRole = await prisma.userRole.findUnique({
      where: { id: params.id },
    });
    
    if (!existingRole) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Role not found' 
        },
        { status: 404 }
      );
    }
    
    // Check if new name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameExists = await prisma.userRole.findUnique({
        where: { name: validatedData.name },
      });
      
      if (nameExists) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Role with this name already exists' 
          },
          { status: 400 }
        );
      }
    }
    
    // If setting as default, unset other defaults
    if (validatedData.isDefault === true) {
      await prisma.userRole.updateMany({
        where: { 
          isDefault: true,
          id: { not: params.id },
        },
        data: { isDefault: false },
      });
    }
    
    const updatedRole = await prisma.userRole.update({
      where: { id: params.id },
      data: validatedData,
    });
    
    return NextResponse.json({
      success: true,
      role: {
        ...updatedRole,
        permissions: updatedRole.permissions as string[],
      },
      message: 'Role updated successfully'
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
    
    console.error('Error updating role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/user-roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if role exists
    const role = await prisma.userRole.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
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
    
    // Prevent deletion of default role if it has users
    if (role.isDefault && role._count.users > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete default role that is assigned to users',
          userCount: role._count.users,
        },
        { status: 400 }
      );
    }
    
    // Prevent deletion if role has users (general safety check)
    if (role._count.users > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete role that is assigned to users',
          userCount: role._count.users,
        },
        { status: 400 }
      );
    }
    
    await prisma.userRole.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Role deleted successfully',
        deletedRole: {
          id: role.id,
          name: role.name,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
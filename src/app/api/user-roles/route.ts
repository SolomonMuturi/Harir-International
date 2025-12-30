// /app/api/user-roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  isDefault: z.boolean().default(false),
});

// GET /api/user-roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || '';
    const includeUserCount = request.nextUrl.searchParams.get('includeUserCount') === 'true';
    
    const roles = await prisma.userRole.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        _count: includeUserCount ? {
          select: { users: true }
        } : false,
      }
    });
    
    // Parse permissions for each role
    const rolesWithParsedPermissions = roles.map(role => ({
      ...role,
      permissions: JSON.parse(role.permissions || '[]') as string[],
    }));
    
    return NextResponse.json({
      success: true,
      roles: rolesWithParsedPermissions,
      count: roles.length,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/user-roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createRoleSchema.parse(body);
    
    // Check if role with same name already exists
    const existingRole = await prisma.userRole.findUnique({
      where: { name: validatedData.name },
    });
    
    if (existingRole) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Role with this name already exists'
        },
        { status: 400 }
      );
    }
    
    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.userRole.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    
    // Create new role
    const role = await prisma.userRole.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        permissions: JSON.stringify(validatedData.permissions),
        isDefault: validatedData.isDefault,
      },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    // Parse permissions for response
    const roleWithParsedPermissions = {
      ...role,
      permissions: JSON.parse(role.permissions || '[]') as string[],
    };
    
    return NextResponse.json({
      success: true,
      role: roleWithParsedPermissions,
      message: 'Role created successfully',
    }, { status: 201 });
    
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
    
    console.error('Error creating role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
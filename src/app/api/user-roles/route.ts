import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  isDefault: z.boolean().default(false),
});

const updateRoleSchema = createRoleSchema.partial();

const assignRoleSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1, 'At least one user ID is required'),
  roleId: z.string().optional().nullable(), // null means unassign role
});

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().optional().nullable(),
});

// GET /api/user-roles - Get all roles with user counts and user list
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const includeUsers = searchParams.get('includeUsers') === 'true';
    const withUserDetails = searchParams.get('withUserDetails') === 'true';

    let roles;
    
    if (search) {
      roles = await prisma.userRole.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
        include: {
          users: includeUsers ? {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
              lastLogin: true,
              ...(withUserDetails && {
                loginAttempts: true,
                twoFactorEnabled: true,
              })
            },
            orderBy: { email: 'asc' }
          } : false,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      roles = await prisma.userRole.findMany({
        include: {
          users: includeUsers ? {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
              lastLogin: true,
              ...(withUserDetails && {
                loginAttempts: true,
                twoFactorEnabled: true,
              })
            },
            orderBy: { email: 'asc' }
          } : false,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Parse permissions from string to array
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: JSON.parse(role.permissions || '[]') as string[],
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      users: includeUsers ? role.users : undefined,
    }));

    return NextResponse.json({ 
      success: true,
      roles: formattedRoles,
      count: formattedRoles.length 
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/user-roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createRoleSchema.parse(body);
    
    // Check if role name already exists
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
    
    const role = await prisma.userRole.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        permissions: JSON.stringify(validatedData.permissions),
        isDefault: validatedData.isDefault,
      },
    });
    
    // Parse permissions for response
    const roleWithParsedPermissions = {
      ...role,
      permissions: JSON.parse(role.permissions || '[]') as string[],
    };
    
    return NextResponse.json(
      { 
        success: true, 
        role: roleWithParsedPermissions,
        message: 'Role created successfully' 
      },
      { status: 201 }
    );
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
        error: 'Failed to create user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/user-roles/assign - Assign roles to users
export async function PATCH(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Handle role assignment endpoint
    if (pathname.includes('/api/user-roles/assign')) {
      return await handleRoleAssignment(request);
    }
    
    // Original bulk update logic
    const { ids, data } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Array of role IDs is required' 
        },
        { status: 400 }
      );
    }
    
    // Validate update data
    const validatedData = updateRoleSchema.parse(data);
    
    // Stringify permissions if provided
    const updateData: any = { ...validatedData };
    if (updateData.permissions) {
      updateData.permissions = JSON.stringify(updateData.permissions);
    }
    
    // If setting roles as default, unset other defaults first
    if (validatedData.isDefault === true) {
      await prisma.userRole.updateMany({
        where: { 
          isDefault: true,
          id: { notIn: ids }
        },
        data: { isDefault: false },
      });
    }
    
    const updated = await prisma.userRole.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    });
    
    return NextResponse.json(
      { 
        success: true,
        message: `Successfully updated ${updated.count} role(s)` 
      }
    );
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
    
    console.error('Error updating roles:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/user-roles - Bulk delete
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Array of role IDs is required' 
        },
        { status: 400 }
      );
    }
    
    // Check if any role has users before deleting
    const rolesWithUsers = await prisma.userRole.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    const rolesWithAssignedUsers = rolesWithUsers.filter(role => role._count.users > 0);
    
    if (rolesWithAssignedUsers.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Some roles have assigned users and cannot be deleted',
          roles: rolesWithAssignedUsers.map(r => ({
            id: r.id,
            name: r.name,
            userCount: r._count.users
          }))
        },
        { status: 400 }
      );
    }
    
    const deleted = await prisma.userRole.deleteMany({
      where: {
        id: { in: ids },
      },
    });
    
    return NextResponse.json(
      { 
        success: true,
        message: `Successfully deleted ${deleted.count} role(s)` 
      }
    );
  } catch (error) {
    console.error('Error deleting roles:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/user-roles/users - Get all users with their roles
export async function GET_USERS(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const roleId = searchParams.get('roleId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (roleId) {
      whereClause.roleId = roleId === 'null' ? null : roleId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        },
        orderBy: { email: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/user-roles/users - Create new user
export async function POST_USER(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists'
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        roleId: validatedData.roleId || null,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        user,
        message: 'User created successfully'
      },
      { status: 201 }
    );
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

    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function for role assignment
async function handleRoleAssignment(request: NextRequest) {
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
    const updatedUsers = await prisma.user.updateMany({
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

// PUT /api/user-roles/:id - Update single role
export async function PUT(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const roleId = pathname.split('/').pop();
    
    if (!roleId || roleId === 'user-roles') {
      return NextResponse.json(
        {
          success: false,
          error: 'Role ID is required'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    // Check if role exists
    const existingRole = await prisma.userRole.findUnique({
      where: { id: roleId },
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

    // If changing name, check for duplicates
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const duplicateRole = await prisma.userRole.findUnique({
        where: { name: validatedData.name },
      });

      if (duplicateRole) {
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
          id: { not: roleId }
        },
        data: { isDefault: false },
      });
    }

    // Stringify permissions if provided
    const updateData: any = { ...validatedData };
    if (updateData.permissions) {
      updateData.permissions = JSON.stringify(updateData.permissions);
    }

    const updatedRole = await prisma.userRole.update({
      where: { id: roleId },
      data: updateData,
    });

    // Parse permissions for response
    const roleWithParsedPermissions = {
      ...updatedRole,
      permissions: JSON.parse(updatedRole.permissions || '[]') as string[],
    };

    return NextResponse.json({
      success: true,
      role: roleWithParsedPermissions,
      message: 'Role updated successfully'
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

    console.error('Error updating role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export all methods
export { 
  GET, 
  POST, 
  PUT, 
  DELETE, 
  PATCH, 
  GET as GET_USERS, 
  POST as POST_USER 
};
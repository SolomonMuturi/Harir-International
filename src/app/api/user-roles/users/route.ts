// /app/api/user-roles/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().optional().nullable(),
});

// GET /api/user-roles/users - Get all users with their roles
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || '';
    const roleId = request.nextUrl.searchParams.get('roleId');
    
    const users = await prisma.user.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
          roleId ? roleId === 'unassigned' 
            ? { roleId: null }
            : { roleId }
          : {},
        ]
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      users,
      count: users.length,
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createUserSchema.parse(body);
    
    // Check if user with email already exists
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
    
    // Create user
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
    
    // Don't return password hash
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'User created successfully',
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
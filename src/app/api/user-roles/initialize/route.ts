// /app/api/user-roles/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/user-roles/initialize - Initialize predefined roles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roles: predefinedRoles } = body;
    
    if (!Array.isArray(predefinedRoles)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid roles data'
        },
        { status: 400 }
      );
    }
    
    const existingRoles = await prisma.userRole.findMany();
    
    // Only create roles that don't exist yet
    const rolesToCreate = predefinedRoles.filter(predefinedRole =>
      !existingRoles.some(existingRole => existingRole.name === predefinedRole.name)
    );
    
    if (rolesToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All predefined roles already exist',
        created: 0,
        total: existingRoles.length
      });
    }
    
    // Unset all existing defaults if we're creating a default role
    const hasNewDefault = rolesToCreate.some(role => role.isDefault);
    if (hasNewDefault) {
      await prisma.userRole.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    
    // Create new roles
    const createdRoles = await Promise.all(
      rolesToCreate.map(async (roleData) => {
        return await prisma.userRole.create({
          data: {
            name: roleData.name,
            description: roleData.description || null,
            permissions: JSON.stringify(roleData.permissions || []),
            isDefault: roleData.isDefault || false,
          },
        });
      })
    );
    
    return NextResponse.json({
      success: true,
      message: `Created ${createdRoles.length} new role(s)`,
      created: createdRoles.length,
      total: existingRoles.length + createdRoles.length
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error initializing roles:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
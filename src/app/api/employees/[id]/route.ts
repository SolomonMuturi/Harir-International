import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('📨 PUT API Received:', body)
    
    const updatedEmployee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        status: body.status,
        performance: body.performance,
        rating: body.rating ? parseInt(body.rating) : undefined,
        contract: body.contract,
        salary: body.salary ? body.salary.toString() : undefined,
        image: body.image,
        id_number: body.idNumber,
        phone: body.phone,
        issue_date: body.issueDate ? new Date(body.issueDate) : null,
        expiry_date: body.expiryDate ? new Date(body.expiryDate) : null,
        company: body.company,
      }
    })

    console.log('✅ Employee updated:', updatedEmployee)
    return NextResponse.json(updatedEmployee)
  } catch (error: any) {
    console.error('❌ Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to update employee', details: error.message },
      { status: 500 }
    )
  }
}
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Fetch all employees
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { created_at: 'desc' }
    })
    
    return NextResponse.json(employees)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new employee
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📨 API Received:', body)
    
    const newEmployee = await prisma.employee.create({
      data: {
        id: `emp-${Date.now()}`,
        name: body.name,
        email: body.email,
        role: body.role,
        status: body.status || 'active',
        performance: body.performance || 'Meets_Expectations',
        rating: body.rating ? parseInt(body.rating) : 3,
        contract: body.contract || 'Full_time',
        salary: body.salary ? body.salary.toString() : '0',
        image: body.image || `https://i.pravatar.cc/150?u=emp-${Date.now()}`,
        id_number: body.idNumber,
        phone: body.phone,
        issue_date: body.issueDate ? new Date(body.issueDate) : null,
        expiry_date: body.expiryDate ? new Date(body.expiryDate) : null,
        company: body.company
      }
    })

    console.log('✅ Employee created:', newEmployee)
    return NextResponse.json(newEmployee, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee', details: error.message },
      { status: 500 }
    )
  }
}
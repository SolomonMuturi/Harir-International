import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Fetch all employees
export async function GET(request: Request) {
  try {
    console.log('📨 GET /api/employees - Fetching employees');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Get single employee
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          attendance: {
            take: 10,
            orderBy: { date: 'desc' }
          }
        }
      });
      
      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }
      
      // Transform contract for frontend
      const transformedEmployee = {
        ...employee,
        contract: employee.contract === 'Full_time' ? 'Full-time' : 
                 employee.contract === 'Part_time' ? 'Part-time' : 
                 'Contract'
      };
      
      return NextResponse.json(transformedEmployee);
    }
    
    // Get all employees
    const employees = await prisma.employee.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`✅ Found ${employees.length} employees`);
    
    // Transform the data for frontend
    const transformedEmployees = employees.map(emp => ({
      ...emp,
      // Ensure contract field is properly formatted for frontend
      contract: emp.contract === 'Full_time' ? 'Full-time' : 
                emp.contract === 'Part_time' ? 'Part-time' : 
                'Contract',
      // Ensure all required fields have values
      id_number: emp.id_number || '',
      phone: emp.phone || '',
      image: emp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`,
      salary: emp.salary || '0',
      rating: emp.rating || 0,
      performance: emp.performance || 'Meets_Expectations',
      company: emp.company || 'FreshTrace'
    }));
    
    return NextResponse.json(transformedEmployees);
  } catch (error: any) {
    console.error('❌ Error fetching employees:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch employees', 
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// POST - Create new employee
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📨 POST /api/employees - Creating employee:', body);
    
    // Validate required fields
    if (!body.name || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: name and role' },
        { status: 400 }
      );
    }
    
    // Map contract to database format
    const contract = body.contract === 'Full-time' ? 'Full_time' : 
                    body.contract === 'Part-time' ? 'Part_time' : 
                    'Contract';
    
    const newEmployee = await prisma.employee.create({
      data: {
        id: `emp-${Date.now()}`,
        name: body.name,
        email: body.email || `${body.name.replace(/\s+/g, '.').toLowerCase()}@freshtrace.com`,
        role: body.role || 'Employee',
        status: body.status || 'active',
        performance: body.performance || 'Meets_Expectations',
        rating: body.rating ? parseInt(body.rating) : 3,
        contract: contract,
        salary: body.salary ? body.salary.toString() : '0',
        image: body.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=random`,
        id_number: body.id_number || body.idNumber || '',
        phone: body.phone || '',
        issue_date: body.issue_date || body.issueDate ? new Date(body.issue_date || body.issueDate) : null,
        expiry_date: body.expiry_date || body.expiryDate ? new Date(body.expiry_date || body.expiryDate) : null,
        company: body.company || 'FreshTrace'
      }
    });

    console.log('✅ Employee created:', newEmployee.id);
    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating employee:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Employee with this email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create employee', 
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// PUT - Update employee
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing employee ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log(`📨 PUT /api/employees?id=${id} - Updating employee`);
    
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Map contract to database format
    const contract = body.contract === 'Full-time' ? 'Full_time' : 
                    body.contract === 'Part-time' ? 'Part_time' : 
                    body.contract || existingEmployee.contract;
    
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name: body.name || existingEmployee.name,
        email: body.email || existingEmployee.email,
        role: body.role || existingEmployee.role,
        status: body.status || existingEmployee.status,
        performance: body.performance || existingEmployee.performance,
        rating: body.rating || existingEmployee.rating,
        contract: contract,
        salary: body.salary || existingEmployee.salary,
        image: body.image || existingEmployee.image,
        id_number: body.id_number || body.idNumber || existingEmployee.id_number,
        phone: body.phone || existingEmployee.phone,
        issue_date: body.issue_date || body.issueDate ? new Date(body.issue_date || body.issueDate) : existingEmployee.issue_date,
        expiry_date: body.expiry_date || body.expiryDate ? new Date(body.expiry_date || body.expiryDate) : existingEmployee.expiry_date,
        company: body.company || existingEmployee.company
      }
    });

    console.log('✅ Employee updated:', updatedEmployee.id);
    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('❌ Error updating employee:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update employee', 
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
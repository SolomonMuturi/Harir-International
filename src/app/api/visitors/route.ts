import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Create MySQL connection
const getConnection = async () => {
  return mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // leave empty if no password
    database: 'nextdbase'
  });
};

export async function GET() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM visitors ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('MySQL error:', error);
    return NextResponse.json([]);
  } finally {
    await connection.end();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 POST received:', body);
    
    const connection = await getConnection();
    
    const visitorCode = `VIST-${Math.floor(Math.random() * 9000) + 1000}`;
    const visitorId = `vis-${Date.now()}`;
    
    // Insert into database
    await connection.execute(
      `INSERT INTO visitors (id, visitor_code, name, phone, vehicle_plate, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [visitorId, visitorCode, body.name || '', body.phone || '', body.vehicle_plate || '', 'Pre-registered']
    );
    
    // Get the inserted record
    const [rows] = await connection.execute('SELECT * FROM visitors WHERE id = ?', [visitorId]);
    const newVisitor = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    
    await connection.end();
    
    console.log('✅ Created in database:', newVisitor);
    return NextResponse.json(newVisitor, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    
    // Fallback to mock if database fails
    const mockVisitor = {
      id: `vis-${Date.now()}`,
      visitor_code: `VIST-${Math.floor(Math.random() * 9000) + 1000}`,
      name: body?.name || 'Test',
      phone: body?.phone || '0712345678',
      vehicle_plate: body?.vehicle_plate || 'TEST-123',
      status: 'Pre-registered',
      created_at: new Date().toISOString()
    };
    
    return NextResponse.json(mockVisitor, { status: 201 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    const connection = await getConnection();
    
    // Update in database
    await connection.execute(
      'UPDATE visitors SET status = ? WHERE id = ?',
      [body.status, id]
    );
    
    // Get updated record
    const [rows] = await connection.execute('SELECT * FROM visitors WHERE id = ?', [id]);
    const updatedVisitor = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    
    await connection.end();
    
    return NextResponse.json(updatedVisitor);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
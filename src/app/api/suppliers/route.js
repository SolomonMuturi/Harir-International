// app/api/suppliers/route.js
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { startOfDay, endOfDay } from 'date-fns'

// Helper function to generate small ID
function generateTinyId() {
  return `s${Date.now().toString(36)}`
}

// Helper function to format phone number
function formatPhoneNumber(phone) {
  if (!phone) return ''
  
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  if (cleaned.startsWith('0')) {
    return '+254' + cleaned.slice(1)
  }
  
  if (cleaned.length === 9) {
    return '+254' + cleaned
  }
  
  if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return '+254' + cleaned.slice(1)
  }
  
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned
}

// Generate CSV
function generateCSV(suppliers) {
  const headers = [
    'Supplier Code',
    'Supplier Name',
    'Phone Number',
    'Email',
    'Location',
    'Status',
    'KRA PIN',
    'Bank Name',
    'Bank Account',
    'M-PESA Paybill',
    'M-PESA Account',
    'Active Contracts',
    'Vehicle Type',
    'Created At'
  ]

  const rows = suppliers.map(supplier => [
    supplier.supplier_code || 'N/A',
    supplier.name || 'N/A',
    supplier.contact_phone || 'N/A',
    supplier.contact_email || 'N/A',
    supplier.location || 'N/A',
    supplier.status || 'N/A',
    supplier.kra_pin || 'N/A',
    supplier.bank_name || 'N/A',
    supplier.bank_account_number || 'N/A',
    supplier.mpesa_paybill || 'N/A',
    supplier.mpesa_account_number || 'N/A',
    supplier.active_contracts || 0,
    supplier.vehicle_type || 'Truck',
    new Date(supplier.created_at).toLocaleDateString()
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell?.toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return csvContent
}

// Generate HTML report
function generateHTMLReport(suppliers, startDate, endDate) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Supplier Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; text-align: center; }
    .header { margin-bottom: 30px; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #4CAF50; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9f9f9; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
    .payment-info { background: #e8f5e9; padding: 10px; border-radius: 3px; margin: 5px 0; }
    .vehicle-info { background: #e3f2fd; padding: 10px; border-radius: 3px; margin: 5px 0; }
    .locked-badge { 
      background: #2196F3; 
      color: white; 
      padding: 2px 8px; 
      border-radius: 10px; 
      font-size: 11px; 
      margin-left: 5px;
    }
  </style>
</head>
<body>
  <h1>Supplier Report</h1>
  <div class="header">
    <p><strong>Date Range:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
    <p><strong>Total Suppliers:</strong> ${suppliers.length}</p>
  </div>
  
  <div class="summary">
    <h3>Summary</h3>
    <p><strong>Active Suppliers:</strong> ${suppliers.filter(s => s.status === 'Active').length}</p>
    <p><strong>Inactive Suppliers:</strong> ${suppliers.filter(s => s.status === 'Inactive').length}</p>
    <p><strong>Total Active Contracts:</strong> ${suppliers.reduce((acc, s) => acc + (s.active_contracts || 0), 0)}</p>
    <p><span class="locked-badge">🔒 Locked</span> = Name locked to phone & payment details</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Supplier Code</th>
        <th>Supplier Name <span class="locked-badge">🔒</span></th>
        <th>Phone Number <span class="locked-badge">🔒</span></th>
        <th>Vehicle Type</th>
        <th>Vehicle Plate</th>
        <th>Email</th>
        <th>Location</th>
        <th>Status</th>
        <th>Payment Details <span class="locked-badge">🔒</span></th>
      </tr>
    </thead>
    <tbody>
      ${suppliers.map(supplier => `
        <tr>
          <td><strong>${supplier.supplier_code || 'N/A'}</strong></td>
          <td>${supplier.name || 'N/A'}</td>
          <td>${supplier.contact_phone || 'N/A'}</td>
          <td>${supplier.vehicle_type || 'Truck'}</td>
          <td>${supplier.vehicle_number_plate || 'N/A'}</td>
          <td>${supplier.contact_email || 'N/A'}</td>
          <td>${supplier.location || 'N/A'}</td>
          <td>${supplier.status || 'N/A'}</td>
          <td>
            ${supplier.vehicle_type || supplier.vehicle_number_plate ? `
              <div class="vehicle-info">
                <strong>Vehicle:</strong> ${supplier.vehicle_type || 'Truck'}<br>
                <strong>Plate:</strong> ${supplier.vehicle_number_plate || 'N/A'}
              </div>
            ` : ''}
            ${supplier.bank_name ? `
              <div class="payment-info">
                <strong>Bank:</strong> ${supplier.bank_name}<br>
                <strong>Account:</strong> ${supplier.bank_account_number || 'N/A'}
              </div>
            ` : ''}
            ${supplier.mpesa_paybill ? `
              <div class="payment-info">
                <strong>M-PESA:</strong> ${supplier.mpesa_paybill}<br>
                <strong>Account:</strong> ${supplier.mpesa_account_number || 'N/A'}
              </div>
            ` : 'No payment details'}
            ${supplier.kra_pin ? `<div class="payment-info"><strong>KRA PIN:</strong> ${supplier.kra_pin}</div>` : ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Report generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
    <p><strong>Note:</strong> Supplier names are permanently locked to their phone numbers and payment details for consistency.</p>
  </div>
  
  <script>
    window.onload = function() {
      window.print()
    }
  </script>
</body>
</html>
  `

  return html
}

export async function GET(request) {
  try {
    console.log('📨 GET /api/suppliers - Fetching suppliers')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const formatType = searchParams.get('format')
    
    // Handle single supplier request
    if (id) {
      const supplier = await prisma.suppliers.findUnique({
        where: { id }
      })
      
      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(supplier)
    }
    
    // Handle date range filtering for reports
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
      
      console.log(`📊 Filtering suppliers by date range: ${startDate} to ${endDate}`)
      
      const suppliers = await prisma.suppliers.findMany({
        where: {
          created_at: {
            gte: startOfDay(start),
            lte: endOfDay(end)
          }
        },
        orderBy: { created_at: 'desc' }
      })
      
      console.log(`✅ Found ${suppliers.length} suppliers in date range`)
      
      // Handle export formats
      if (formatType === 'csv') {
        const csvContent = generateCSV(suppliers)
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename=suppliers_${startDate}_to_${endDate}.csv`
          }
        })
      } else if (formatType === 'html') {
        const htmlReport = generateHTMLReport(suppliers, startDate, endDate)
        return new NextResponse(htmlReport, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `inline; filename=suppliers_report_${startDate}_to_${endDate}.html`
          }
        })
      }
      
      // Return JSON by default
      const formattedSuppliers = suppliers.map(supplier => ({
        ...supplier,
        produce_types: supplier.produce_types ? JSON.parse(supplier.produce_types) : [],
        created_at: supplier.created_at.toISOString()
      }))
      
      return NextResponse.json(formattedSuppliers)
    }
    
    // Get all suppliers
    const suppliers = await prisma.suppliers.findMany({
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`✅ Found ${suppliers.length} suppliers`)
    
    const formattedSuppliers = suppliers.map(supplier => ({
      ...supplier,
      produce_types: supplier.produce_types ? JSON.parse(supplier.produce_types) : [],
      created_at: supplier.created_at.toISOString()
    }))
    
    return NextResponse.json(formattedSuppliers)
  } catch (error) {
    console.error('❌ Error in GET /api/suppliers:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    console.log('📨 POST /api/suppliers - Creating new supplier')
    
    const body = await request.json()
    console.log('📦 Request data:', body)
    
    // Format phone number if provided
    const formattedPhone = body.contact_phone ? formatPhoneNumber(body.contact_phone) : ''
    
    // Check for existing name or phone
    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        OR: [
          { name: body.name?.trim() || '' },
          { contact_phone: formattedPhone },
          { supplier_code: body.supplier_code?.trim() || '' }
        ]
      }
    })
    
    if (existingSupplier) {
      let errorMessage = 'Supplier already exists: '
      if (existingSupplier.name === (body.name?.trim() || '')) {
        errorMessage += `Name "${body.name}" is already registered`
      } else if (existingSupplier.contact_phone === formattedPhone) {
        errorMessage += `Phone number "${body.contact_phone}" is already registered`
      } else {
        errorMessage += `Supplier code "${body.supplier_code}" is already used`
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
    
    // Create supplier
    const newSupplier = await prisma.suppliers.create({
      data: {
        id: generateTinyId(),
        name: body.name?.trim() || '',
        location: body.location?.trim() || 'Gate Registration',
        contact_name: body.contact_name?.trim() || body.name?.trim() || '',
        contact_email: body.contact_email?.trim() || '',
        contact_phone: formattedPhone,
        produce_types: JSON.stringify(Array.isArray(body.produce_types) ? body.produce_types : []),
        status: body.status || 'Active',
        logo_url: body.logo_url || `https://avatar.vercel.sh/${encodeURIComponent(body.name || '')}.png`,
        active_contracts: body.active_contracts || 0,
        supplier_code: body.supplier_code?.trim() || '',
        kra_pin: body.kra_pin?.trim() || null,
        vehicle_number_plate: body.vehicle_number_plate?.trim() || null,
        vehicle_type: body.vehicle_type || 'Truck',
        driver_name: body.driver_name?.trim() || body.contact_name?.trim() || body.name?.trim() || '',
        driver_id_number: body.driver_id_number?.trim() || null,
        mpesa_paybill: body.mpesa_paybill?.trim() || null,
        mpesa_account_number: body.mpesa_account_number?.trim() || null,
        bank_name: body.bank_name?.trim() || null,
        bank_account_number: body.bank_account_number?.trim() || null,
        password: body.password || null,
        vehicle_status: body.vehicle_status || 'Pre-registered',
        vehicle_check_in_time: body.vehicle_check_in_time || null,
        vehicle_check_out_time: body.vehicle_check_out_time || null,
        cargo_description: body.cargo_description || null
      }
    })

    console.log('✅ Supplier created successfully:', newSupplier.id)
    return NextResponse.json(newSupplier, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating supplier:', error)
    
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      let errorMessage = 'Supplier with this '
      
      if (field === 'name') {
        errorMessage += 'name already exists'
      } else if (field === 'contact_phone') {
        errorMessage += 'phone number already exists'
      } else if (field === 'supplier_code') {
        errorMessage += 'supplier code already exists'
      } else if (field === 'supplier_name_phone_unique') {
        errorMessage += 'name and phone number combination already exists'
      } else {
        errorMessage += 'information already exists'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create supplier', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing supplier ID' },
        { status: 400 }
      )
    }
    
    console.log(`📨 PUT /api/suppliers?id=${id} - Updating supplier`)
    
    const body = await request.json()
    console.log('📦 Update data:', body)
    
    // Check if supplier exists
    const existingSupplier = await prisma.suppliers.findUnique({
      where: { id }
    })
    
    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    // Format phone number
    const formattedPhone = body.contact_phone 
      ? formatPhoneNumber(body.contact_phone)
      : existingSupplier.contact_phone
    
    // Check for duplicate name-phone combination
    if (body.name || body.contact_phone) {
      const newName = body.name?.trim() || existingSupplier.name
      const newPhone = formattedPhone
      
      const duplicateSupplier = await prisma.suppliers.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { name: newName },
                { contact_phone: newPhone }
              ]
            }
          ]
        }
      })
      
      if (duplicateSupplier) {
        let errorMessage = 'Cannot update: '
        if (duplicateSupplier.name === newName) {
          errorMessage += `Name "${newName}" is already registered to another supplier`
        } else if (duplicateSupplier.contact_phone === newPhone) {
          errorMessage += `Phone number "${newPhone}" is already registered to another supplier`
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        )
      }
    }
    
    // Prepare update data
    const updateData = {
      ...(body.name && { name: body.name.trim() }),
      ...(body.contact_name && { contact_name: body.contact_name.trim() }),
      ...(body.contact_phone && { contact_phone: formattedPhone }),
      ...(body.supplier_code && { supplier_code: body.supplier_code.trim() }),
      ...(body.location && { location: body.location.trim() }),
      ...(body.contact_email && { contact_email: body.contact_email.trim() }),
      ...(body.produce_types && { 
        produce_types: JSON.stringify(Array.isArray(body.produce_types) ? body.produce_types : []) 
      }),
      ...(body.status && { status: body.status }),
      ...(body.kra_pin !== undefined && { kra_pin: body.kra_pin?.trim() || null }),
      ...(body.vehicle_number_plate !== undefined && { vehicle_number_plate: body.vehicle_number_plate?.trim() || null }),
      ...(body.vehicle_type !== undefined && { vehicle_type: body.vehicle_type || 'Truck' }),
      ...(body.driver_name !== undefined && { driver_name: body.driver_name?.trim() || null }),
      ...(body.driver_id_number !== undefined && { driver_id_number: body.driver_id_number?.trim() || null }),
      ...(body.vehicle_status !== undefined && { vehicle_status: body.vehicle_status }),
      ...(body.vehicle_check_in_time !== undefined && { 
        vehicle_check_in_time: body.vehicle_check_in_time ? new Date(body.vehicle_check_in_time) : null 
      }),
      ...(body.vehicle_check_out_time !== undefined && { 
        vehicle_check_out_time: body.vehicle_check_out_time ? new Date(body.vehicle_check_out_time) : null 
      }),
      ...(body.cargo_description !== undefined && { cargo_description: body.cargo_description || null }),
      ...(body.mpesa_paybill !== undefined && { mpesa_paybill: body.mpesa_paybill?.trim() || null }),
      ...(body.mpesa_account_number !== undefined && { mpesa_account_number: body.mpesa_account_number?.trim() || null }),
      ...(body.bank_name !== undefined && { bank_name: body.bank_name?.trim() || null }),
      ...(body.bank_account_number !== undefined && { bank_account_number: body.bank_account_number?.trim() || null })
    }

    const updatedSupplier = await prisma.suppliers.update({
      where: { id },
      data: updateData
    })

    console.log('✅ Supplier updated successfully:', updatedSupplier.id)
    return NextResponse.json(updatedSupplier)
  } catch (error) {
    console.error('❌ Error updating supplier:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      let errorMessage = 'Cannot update: '
      
      if (field === 'name') {
        errorMessage += 'Name already exists'
      } else if (field === 'contact_phone') {
        errorMessage += 'Phone number already exists'
      } else if (field === 'supplier_code') {
        errorMessage += 'Supplier code already exists'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update supplier', details: error.message },
      { status: 500 }
    )
  }
}
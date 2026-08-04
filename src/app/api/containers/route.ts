import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

function cleanString(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, ['shipments.manage', 'inventory.manage', 'shipments.view']);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const search = cleanString(searchParams.get('search'));
    const status = cleanString(searchParams.get('status'));

    const where: any = {};

    if (search) {
      where.OR = [
        { shipment_number: { contains: search } },
        { invoice_number: { contains: search } },
        { bl_number: { contains: search } },
        { container_number: { contains: search } },
        { current_location: { contains: search } },
        { destination: { contains: search } },
      ];
    }

    if (status === 'arrived') {
      where.arrival_date = { lte: new Date() };
    } else if (status === 'in_transit') {
      where.OR = where.OR || [];
      where.OR.push({ arrival_date: { gt: new Date() } });
      where.OR.push({ arrival_date: null });
    }

    const containers = await prisma.containers.findMany({
      where,
      orderBy: { updated_at: 'desc' },
    });

    const serialized = containers.map((c) => ({
      id: c.id,
      shipment_number: c.shipment_number,
      invoice_number: c.invoice_number,
      bl_number: c.bl_number,
      container_number: c.container_number,
      current_location: c.current_location,
      current_temperature: c.current_temperature,
      arrival_date: c.arrival_date?.toISOString() || null,
      destination: c.destination,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error('Error fetching containers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch containers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, ['shipments.manage', 'inventory.manage', 'shipments.view']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    const shipmentNumber = cleanString(body.shipmentNumber);
    const containerNumber = cleanString(body.containerNumber);

    if (!shipmentNumber || !containerNumber) {
      return NextResponse.json(
        { error: 'Shipment number and container number are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.containers.findFirst({
      where: {
        OR: [
          { shipment_number: shipmentNumber },
          { container_number: containerNumber },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A container with this shipment number or container number already exists' },
        { status: 409 }
      );
    }

    const container = await prisma.$transaction(async (tx) => {
      const created = await tx.containers.create({
        data: {
          id: `cont-${Date.now()}`,
          shipment_number: shipmentNumber,
          invoice_number: cleanString(body.invoiceNumber),
          bl_number: cleanString(body.blNumber),
          container_number: containerNumber,
          current_location: cleanString(body.currentLocation) || null,
          current_temperature: cleanString(body.currentTemperature) || null,
          arrival_date: body.arrivalDate ? new Date(body.arrivalDate) : null,
          destination: cleanString(body.destination),
        },
      });

      if (created.current_location || created.current_temperature || created.arrival_date) {
        await tx.container_updates.create({
          data: {
            id: `cu-${Date.now()}`,
            container_id: created.id,
            current_location: created.current_location,
            current_temperature: created.current_temperature,
            arrival_date: created.arrival_date,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        id: container.id,
        shipment_number: container.shipment_number,
        invoice_number: container.invoice_number,
        bl_number: container.bl_number,
        container_number: container.container_number,
        current_location: container.current_location,
        current_temperature: container.current_temperature,
        arrival_date: container.arrival_date?.toISOString() || null,
        destination: container.destination,
        created_at: container.created_at.toISOString(),
        updated_at: container.updated_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating container:', error);
    return NextResponse.json(
      { error: 'Failed to create container', details: error.message },
      { status: 500 }
    );
  }
}

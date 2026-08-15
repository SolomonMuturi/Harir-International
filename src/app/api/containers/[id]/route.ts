import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';

function cleanString(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  return trimmed === '' ? null : trimmed;
}

function serialize(container: any, updates: any[] = []) {
  return {
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
    updates: updates.map((u) => ({
      id: u.id,
      current_location: u.current_location,
      current_temperature: u.current_temperature,
      arrival_date: u.arrival_date?.toISOString() || null,
      updated_at: u.updated_at.toISOString(),
    })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, ['shipments.manage', 'inventory.manage', 'shipments.view']);
  if (auth.error) return auth.error;

  try {
    const { id: containerId } = await params;

    if (!containerId) {
      return NextResponse.json({ error: 'Container ID is required' }, { status: 400 });
    }

    const container = await prisma.containers.findUnique({
      where: { id: containerId },
      include: {
        updates: {
          orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
        },
      },
    });

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    return NextResponse.json(serialize(container, container.updates));
  } catch (error: any) {
    console.error('Error fetching container:', error);
    return NextResponse.json(
      { error: 'Failed to fetch container', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, ['shipments.manage', 'inventory.manage', 'shipments.view']);
  if (auth.error) return auth.error;

  try {
    const { id: containerId } = await params;
    const body = await request.json();

    const container = await prisma.containers.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.currentLocation !== undefined) {
      updateData.current_location = cleanString(body.currentLocation);
    }
    if (body.currentTemperature !== undefined) {
      updateData.current_temperature = cleanString(body.currentTemperature);
    }
    if (body.arrivalDate !== undefined) {
      updateData.arrival_date = body.arrivalDate ? new Date(body.arrivalDate) : null;
    }

    const locationChanged =
      updateData.current_location !== undefined &&
      updateData.current_location !== container.current_location;
    const temperatureChanged =
      updateData.current_temperature !== undefined &&
      updateData.current_temperature !== container.current_temperature;
    const arrivalDateChanged =
      updateData.arrival_date !== undefined &&
      (updateData.arrival_date ? updateData.arrival_date.getTime() : null) !==
        (container.arrival_date ? container.arrival_date.getTime() : null);

    await prisma.$transaction(async (tx) => {
      await tx.containers.update({
        where: { id: containerId },
        data: updateData,
      });

      if (locationChanged || temperatureChanged || arrivalDateChanged) {
        // Append a new history record for every daily update (date, location, temperature)
        await tx.container_updates.create({
          data: {
            id: `cu-${Date.now()}`,
            container_id: containerId,
            current_location:
              updateData.current_location !== undefined
                ? updateData.current_location
                : container.current_location,
            current_temperature:
              updateData.current_temperature !== undefined
                ? updateData.current_temperature
                : container.current_temperature,
            arrival_date:
              updateData.arrival_date !== undefined
                ? updateData.arrival_date
                : container.arrival_date,
          },
        });
      }
    });

    const updated = await prisma.containers.findUnique({
      where: { id: containerId },
      include: {
        updates: {
          orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
        },
      },
    });

    return NextResponse.json(serialize(updated, updated?.updates || []));
  } catch (error: any) {
    console.error('Error updating container:', error);
    return NextResponse.json(
      { error: 'Failed to update container', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, ['shipments.manage', 'inventory.manage', 'shipments.view']);
  if (auth.error) return auth.error;

  try {
    const { id: containerId } = await params;

    await prisma.containers.delete({
      where: { id: containerId },
    });

    return NextResponse.json({ message: 'Container deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting container:', error);
    return NextResponse.json(
      { error: 'Failed to delete container', details: error.message },
      { status: 500 }
    );
  }
}

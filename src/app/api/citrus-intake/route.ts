import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplier = searchParams.get('supplier');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const order = searchParams.get('order') || 'desc';

    const where: any = {};

    if (supplier) {
      where.supplier = { contains: supplier };
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.created_at = { gte: start, lte: end };
    }

    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    const entries = await prisma.citrus_intake.findMany({
      where,
      orderBy: { created_at: order === 'desc' ? 'desc' : 'asc' },
      take: limit,
    });

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('Error fetching citrus intake:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch citrus intake entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      supplier,
      vehiclePlate,
      date,
      truckNumber,
      containerNumber,
      sealNumber,
      orangesClass1Boxes,
      orangesClass2Boxes,
      orangesClass3Boxes,
      lemonsClass1Boxes,
      lemonsClass2Boxes,
      lemonsClass3Boxes,
      tangerinesClass1Boxes,
      tangerinesClass2Boxes,
      tangerinesClass3Boxes,
      notes,
    } = body;

    if (!supplier || !supplier.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      );
    }

    if (!truckNumber || !truckNumber.trim()) {
      return NextResponse.json(
        { error: 'Truck/shipment number is required' },
        { status: 400 }
      );
    }

    const orangesClass1 = Number(orangesClass1Boxes) || 0;
    const orangesClass2 = Number(orangesClass2Boxes) || 0;
    const orangesClass3 = Number(orangesClass3Boxes) || 0;
    const lemonsClass1 = Number(lemonsClass1Boxes) || 0;
    const lemonsClass2 = Number(lemonsClass2Boxes) || 0;
    const lemonsClass3 = Number(lemonsClass3Boxes) || 0;
    const tangerinesClass1 = Number(tangerinesClass1Boxes) || 0;
    const tangerinesClass2 = Number(tangerinesClass2Boxes) || 0;
    const tangerinesClass3 = Number(tangerinesClass3Boxes) || 0;

    const orangesTotalBoxes = orangesClass1 + orangesClass2 + orangesClass3;
    const lemonsTotalBoxes = lemonsClass1 + lemonsClass2 + lemonsClass3;
    const tangerinesTotalBoxes = tangerinesClass1 + tangerinesClass2 + tangerinesClass3;

    const orangesTotalWeight = orangesTotalBoxes * 15;
    const lemonsTotalWeight = lemonsTotalBoxes * 15;
    const tangerinesTotalWeight = tangerinesTotalBoxes * 20;

    const grandTotalBoxes = orangesTotalBoxes + lemonsTotalBoxes + tangerinesTotalBoxes;
    const grandTotalWeight = orangesTotalWeight + lemonsTotalWeight + tangerinesTotalWeight;

    const entry = await prisma.citrus_intake.create({
      data: {
        supplier: supplier.trim(),
        vehicle_plate: vehiclePlate?.trim() || null,
        date: date || null,
        truck_number: truckNumber.trim(),
        container_number: containerNumber?.trim() || null,
        seal_number: sealNumber?.trim() || null,
        oranges_class1: orangesClass1,
        oranges_class2: orangesClass2,
        oranges_class3: orangesClass3,
        oranges_total_boxes: orangesTotalBoxes,
        oranges_total_weight: orangesTotalWeight,
        lemons_class1: lemonsClass1,
        lemons_class2: lemonsClass2,
        lemons_class3: lemonsClass3,
        lemons_total_boxes: lemonsTotalBoxes,
        lemons_total_weight: lemonsTotalWeight,
        tangerines_class1: tangerinesClass1,
        tangerines_class2: tangerinesClass2,
        tangerines_class3: tangerinesClass3,
        tangerines_total_boxes: tangerinesTotalBoxes,
        tangerines_total_weight: tangerinesTotalWeight,
        grand_total_boxes: grandTotalBoxes,
        grand_total_weight: grandTotalWeight,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error('Error creating citrus intake:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create citrus intake entry' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const data: any = {};

    if (updateData.supplier !== undefined) data.supplier = updateData.supplier.trim();
    if (updateData.vehiclePlate !== undefined) data.vehicle_plate = updateData.vehiclePlate.trim();
    if (updateData.date !== undefined) data.date = updateData.date;
    if (updateData.truckNumber !== undefined) data.truck_number = updateData.truckNumber.trim();
    if (updateData.containerNumber !== undefined) data.container_number = updateData.containerNumber.trim();
    if (updateData.sealNumber !== undefined) data.seal_number = updateData.sealNumber.trim();

    if (updateData.orangesClass1Boxes !== undefined ||
        updateData.orangesClass2Boxes !== undefined ||
        updateData.orangesClass3Boxes !== undefined) {
      const o1 = Number(updateData.orangesClass1Boxes) || 0;
      const o2 = Number(updateData.orangesClass2Boxes) || 0;
      const o3 = Number(updateData.orangesClass3Boxes) || 0;
      data.oranges_class1 = o1;
      data.oranges_class2 = o2;
      data.oranges_class3 = o3;
      data.oranges_total_boxes = o1 + o2 + o3;
      data.oranges_total_weight = (o1 + o2 + o3) * 15;
    }

    if (updateData.lemonsClass1Boxes !== undefined ||
        updateData.lemonsClass2Boxes !== undefined ||
        updateData.lemonsClass3Boxes !== undefined) {
      const l1 = Number(updateData.lemonsClass1Boxes) || 0;
      const l2 = Number(updateData.lemonsClass2Boxes) || 0;
      const l3 = Number(updateData.lemonsClass3Boxes) || 0;
      data.lemons_class1 = l1;
      data.lemons_class2 = l2;
      data.lemons_class3 = l3;
      data.lemons_total_boxes = l1 + l2 + l3;
      data.lemons_total_weight = (l1 + l2 + l3) * 15;
    }

    if (updateData.tangerinesClass1Boxes !== undefined ||
        updateData.tangerinesClass2Boxes !== undefined ||
        updateData.tangerinesClass3Boxes !== undefined) {
      const t1 = Number(updateData.tangerinesClass1Boxes) || 0;
      const t2 = Number(updateData.tangerinesClass2Boxes) || 0;
      const t3 = Number(updateData.tangerinesClass3Boxes) || 0;
      data.tangerines_class1 = t1;
      data.tangerines_class2 = t2;
      data.tangerines_class3 = t3;
      data.tangerines_total_boxes = t1 + t2 + t3;
      data.tangerines_total_weight = (t1 + t2 + t3) * 20;
    }

    const totO = data.oranges_total_boxes ?? 0;
    const totL = data.lemons_total_boxes ?? 0;
    const totT = data.tangerines_total_boxes ?? 0;
    const wtO = data.oranges_total_weight ?? 0;
    const wtL = data.lemons_total_weight ?? 0;
    const wtT = data.tangerines_total_weight ?? 0;
    data.grand_total_boxes = totO + totL + totT;
    data.grand_total_weight = wtO + wtL + wtT;

    if (updateData.notes !== undefined) data.notes = updateData.notes.trim();

    const entry = await prisma.citrus_intake.update({
      where: { id },
      data,
    });

    return NextResponse.json(entry);
  } catch (error: any) {
    console.error('Error updating citrus intake:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update citrus intake entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    await prisma.citrus_intake.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting citrus intake:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete citrus intake entry' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const carryId = searchParams.get('carryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '500');
    const order = searchParams.get('order') || 'desc';

    const where: any = {};

    if (type && (type === 'carry' || type === 'return')) {
      where.type = type;
    }

    if (carryId) {
      where.carry_id = carryId;
    }

    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    const entries = await prisma.citrus_movements.findMany({
      where,
      orderBy: { created_at: order === 'desc' ? 'desc' : 'asc' },
      take: limit,
    });

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('Error fetching citrus movements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      type,
      carryId,
      salesPersonName,
      salesPersonPhone,
      vehiclePlate,
      lemonsClass1, lemonsClass2, lemonsClass3,
      citrusClass1, citrusClass2, citrusClass3,
      orangesClass1, orangesClass2, orangesClass3,
      notes,
    } = body;

    if (!type || !['carry', 'return'].includes(type)) {
      return NextResponse.json({ error: 'Valid type (carry or return) is required' }, { status: 400 });
    }

    if (!salesPersonName || !salesPersonName.trim()) {
      return NextResponse.json({ error: 'Sales person name is required' }, { status: 400 });
    }

    const o1 = Number(orangesClass1) || 0;
    const o2 = Number(orangesClass2) || 0;
    const o3 = Number(orangesClass3) || 0;
    const l1 = Number(lemonsClass1) || 0;
    const l2 = Number(lemonsClass2) || 0;
    const l3 = Number(lemonsClass3) || 0;
    const t1 = Number(citrusClass1) || 0;
    const t2 = Number(citrusClass2) || 0;
    const t3 = Number(citrusClass3) || 0;

    const orangesBoxes = o1 + o2 + o3;
    const lemonsBoxes = l1 + l2 + l3;
    const tangerinesBoxes = t1 + t2 + t3;

    const orangesWeight = orangesBoxes * 15;
    const lemonsWeight = lemonsBoxes * 15;
    const tangerinesWeight = tangerinesBoxes * 20;

    const entry = await prisma.citrus_movements.create({
      data: {
        type,
        carry_id: carryId || null,
        sales_person_name: salesPersonName.trim(),
        sales_person_phone: salesPersonPhone?.trim() || null,
        vehicle_plate: vehiclePlate?.trim() || null,
        oranges_class1: o1, oranges_class2: o2, oranges_class3: o3,
        oranges_total_boxes: orangesBoxes, oranges_total_weight: orangesWeight,
        lemons_class1: l1, lemons_class2: l2, lemons_class3: l3,
        lemons_total_boxes: lemonsBoxes, lemons_total_weight: lemonsWeight,
        tangerines_class1: t1, tangerines_class2: t2, tangerines_class3: t3,
        tangerines_total_boxes: tangerinesBoxes, tangerines_total_weight: tangerinesWeight,
        grand_total_boxes: orangesBoxes + lemonsBoxes + tangerinesBoxes,
        grand_total_weight: orangesWeight + lemonsWeight + tangerinesWeight,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error('Error creating citrus movement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create movement' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const data: any = {};

    if (updateData.salesPersonName !== undefined) data.sales_person_name = updateData.salesPersonName.trim();
    if (updateData.salesPersonPhone !== undefined) data.sales_person_phone = updateData.salesPersonPhone.trim();
    if (updateData.vehiclePlate !== undefined) data.vehicle_plate = updateData.vehiclePlate.trim();
    if (updateData.notes !== undefined) data.notes = updateData.notes.trim();

    const recalcO = updateData.orangesClass1 !== undefined || updateData.orangesClass2 !== undefined || updateData.orangesClass3 !== undefined;
    const recalcL = updateData.lemonsClass1 !== undefined || updateData.lemonsClass2 !== undefined || updateData.lemonsClass3 !== undefined;
    const recalcT = updateData.citrusClass1 !== undefined || updateData.citrusClass2 !== undefined || updateData.citrusClass3 !== undefined;

    if (recalcO) {
      const o1 = Number(updateData.orangesClass1) || 0;
      const o2 = Number(updateData.orangesClass2) || 0;
      const o3 = Number(updateData.orangesClass3) || 0;
      data.oranges_class1 = o1; data.oranges_class2 = o2; data.oranges_class3 = o3;
      data.oranges_total_boxes = o1 + o2 + o3;
      data.oranges_total_weight = (o1 + o2 + o3) * 15;
    }
    if (recalcL) {
      const l1 = Number(updateData.lemonsClass1) || 0;
      const l2 = Number(updateData.lemonsClass2) || 0;
      const l3 = Number(updateData.lemonsClass3) || 0;
      data.lemons_class1 = l1; data.lemons_class2 = l2; data.lemons_class3 = l3;
      data.lemons_total_boxes = l1 + l2 + l3;
      data.lemons_total_weight = (l1 + l2 + l3) * 15;
    }
    if (recalcT) {
      const t1 = Number(updateData.citrusClass1) || 0;
      const t2 = Number(updateData.citrusClass2) || 0;
      const t3 = Number(updateData.citrusClass3) || 0;
      data.tangerines_class1 = t1; data.tangerines_class2 = t2; data.tangerines_class3 = t3;
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

    const entry = await prisma.citrus_movements.update({
      where: { id },
      data,
    });

    return NextResponse.json(entry);
  } catch (error: any) {
    console.error('Error updating citrus movement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update movement' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const childCount = await prisma.citrus_movements.count({ where: { carry_id: id } });
    if (childCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: this carry has ${childCount} return(s) linked to it. Delete the returns first.` },
        { status: 400 }
      );
    }

    await prisma.citrus_movements.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting citrus movement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete movement' },
      { status: 500 }
    );
  }
}

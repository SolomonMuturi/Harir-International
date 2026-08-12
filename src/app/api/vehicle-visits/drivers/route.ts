// app/api/vehicle-visits/drivers/route.ts
// Returns a deduplicated, alphabetically sorted list of known drivers with
// their phone number and ID, used to auto-fill the Register Vehicle Visit form.
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, ['vehicle_log.view', 'vehicle_log.manage']);
  if (auth.error) return auth.error;
  try {
    const [visitDrivers, supplierDrivers] = await Promise.all([
      prisma.vehicle_visits.findMany({
        select: {
          driver_name: true,
          contact_phone: true,
          driver_id_number: true
        },
        where: { driver_name: { not: null } }
      }),
      prisma.suppliers.findMany({
        select: {
          name: true,
          contact_phone: true,
          driver_id_number: true
        }
      })
    ]);

    const byKey = new Map<string, { name: string; phone: string; id: string }>();

    const add = (name: string, phone: string | null, id: string | null) => {
      const cleanName = (name || '').trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { name: cleanName, phone: phone || '', id: id || '' });
      } else {
        if (!existing.phone && phone) existing.phone = phone;
        if (!existing.id && id) existing.id = id;
      }
    };

    visitDrivers.forEach(d => add(d.driver_name, d.contact_phone, d.driver_id_number));
    supplierDrivers.forEach(s => add(s.name, s.contact_phone, s.driver_id_number));

    const drivers = Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ drivers });
  } catch (error: any) {
    console.error('❌ Error fetching driver options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers', details: error.message },
      { status: 500 }
    );
  }
}

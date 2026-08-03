const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const pallets = await p.cold_room_pallets.findMany({
    take: 3,
    orderBy: { created_at: 'desc' },
    include: { boxes: true },
  });
  for (const pal of pallets) {
    console.log('PALLET', pal.id, '| name:', pal.pallet_name, '| total_boxes:', pal.total_boxes, '| weight:', pal.total_weight_kg, '| boxes_per_pallet:', pal.boxes_per_pallet, '| created:', pal.created_at);
    const grouped = {};
    for (const b of pal.boxes) {
      const key = `${b.variety}|${b.box_type}|${b.size}|${b.grade}`;
      grouped[key] = (grouped[key] || 0) + (b.quantity || 0);
    }
    console.log('  box composition:', JSON.stringify(grouped));
    if (pal.boxes[0]) console.log('  sample box:', JSON.stringify(pal.boxes[0]));
  }
  await p.$disconnect();
})();

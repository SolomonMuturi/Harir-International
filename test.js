const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
 
async function test() { 
  try { 
    await prisma.$connect(); 
    console.log('? Connected to database!'); 
 
    const count = await prisma.shipments.count(); 
    console.log('?? Shipments count:', count); 
 
    // List first few shipments 
    const shipments = await prisma.shipments.findMany({ 
      take: 5 
    }); 
 
    console.log('First 5 shipments:'); 
    shipments.forEach(s =
      console.log('- ' + s.shipment_id + ': ' + s.product + ' (' + s.status + ')'); 
    }); 
 
  } catch (error) { 
    console.error('? Error:', error.message); 
  } finally { 
    await prisma.$disconnect(); 
  } 
} 
 
test(); 

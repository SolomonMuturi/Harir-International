// app/api/quality-control/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching intake data and quality checks...');
    
    // Get ALL weight entries (intake data)
    const weightEntries = await prisma.weight_entries.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to 100 most recent
    });

    // Get ALL quality checks
    const qualityChecks = await prisma.quality_checks.findMany({
      orderBy: { processed_at: 'desc' }
    });

    console.log(`Found ${weightEntries.length} weight entries and ${qualityChecks.length} quality checks`);

    // Create a map of quality checks by pallet_id for easy lookup
    const qualityCheckMap = new Map();
    qualityChecks.forEach(qc => {
      if (qc.pallet_id) {
        qualityCheckMap.set(qc.pallet_id, qc);
      }
    });

    // Transform intake data (weight entries) for the UI
    const transformedData = weightEntries.map(entry => {
      // Find matching quality check for this weight entry
      const matchingQC = entry.pallet_id ? qualityCheckMap.get(entry.pallet_id) : null;
      
      // Parse fruit varieties
      let fruitVarieties = [];
      try {
        if (entry.fruit_variety) {
          fruitVarieties = JSON.parse(entry.fruit_variety);
        }
      } catch (e) {
        console.error('Error parsing fruit varieties:', e);
      }

      if (fruitVarieties.length === 0) {
        fruitVarieties = [{
          name: entry.product || 'Avocado',
          weight: Number(entry.net_weight) || 0,
          crates: entry.number_of_crates || 0
        }];
      }

      // Determine status based on quality check
      const hasQC = !!matchingQC;
      const status = hasQC ? 'qc_completed' : 'pending_qc';
      const qcDecision = matchingQC?.overall_status === 'approved' ? 'Accepted' : 
                        matchingQC?.overall_status === 'rejected' ? 'Declined' : undefined;

      return {
        // Intake data from weight_entries
        id: entry.id,
        pallet_id: entry.pallet_id || `WE-${entry.id}`,
        supplier_name: entry.supplier || 'Unknown Supplier',
        supplier_phone: entry.supplier_phone || '',
        driver_name: entry.driver_name || '',
        vehicle_plate: entry.vehicle_plate || entry.truck_id || '',
        total_weight: Number(entry.net_weight) || 0,
        fruit_varieties: fruitVarieties,
        region: entry.region || '',
        timestamp: entry.timestamp?.toISOString() || entry.created_at?.toISOString() || new Date().toISOString(),
        
        // Quality check status
        status: status,
        qc_decision: qcDecision,
        qc_timestamp: matchingQC?.processed_at?.toISOString(),
        qc_fuerte_class1: Number(matchingQC?.fuerte_class1) || 0,
        qc_fuerte_class2: Number(matchingQC?.fuerte_class2) || 0,
        qc_hass_class1: Number(matchingQC?.hass_class1) || 0,
        qc_hass_class2: Number(matchingQC?.hass_class2) || 0,
        qc_fuerte_overall: Number(matchingQC?.fuerte_overall) || 0,
        qc_hass_overall: Number(matchingQC?.hass_overall) || 0,
        
        // Additional fields for QualityCheck interface
        weight_entry_id: entry.id,
        overall_status: matchingQC?.overall_status as 'approved' | 'rejected' || 'approved',
        notes: matchingQC?.notes || '',
        processed_by: matchingQC?.processed_by || '',
        processed_at: matchingQC?.processed_at?.toISOString(),
        fuerte_class1: Number(matchingQC?.fuerte_class1) || 0,
        fuerte_class2: Number(matchingQC?.fuerte_class2) || 0,
        fuerte_overall: Number(matchingQC?.fuerte_overall) || 0,
        hass_class1: Number(matchingQC?.hass_class1) || 0,
        hass_class2: Number(matchingQC?.hass_class2) || 0,
        hass_overall: Number(matchingQC?.hass_overall) || 0
      };
    });

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Saving quality check:', body);

    // Extract data
    const {
      pallet_id,
      product = 'Avocado',
      declared_weight,
      net_weight,
      rejected_weight = 0,
      accepted_weight,
      overall_status,
      packaging_status = 'accepted',
      freshness_status = 'accepted',
      seals_status = 'accepted',
      notes = '',
      processed_by = 'QC Officer',
      fuerte_class1,
      fuerte_class2,
      fuerte_overall,
      hass_class1,
      hass_class2,
      hass_overall
    } = body;

    // Calculate accepted weight
    const finalAcceptedWeight = accepted_weight || 
      (overall_status === 'approved' ? net_weight : 0);

    // Save to database
    const qualityCheck = await prisma.quality_checks.create({
      data: {
        pallet_id: pallet_id?.toString() || '',
        product: product?.toString() || 'Avocado',
        declared_weight: parseFloat(declared_weight?.toString() || '0'),
        net_weight: parseFloat(net_weight?.toString() || '0'),
        rejected_weight: parseFloat(rejected_weight?.toString() || '0'),
        accepted_weight: parseFloat(finalAcceptedWeight?.toString() || '0'),
        overall_status: overall_status?.toString() || 'approved',
        packaging_status: packaging_status?.toString() || 'accepted',
        freshness_status: freshness_status?.toString() || 'accepted',
        seals_status: seals_status?.toString() || 'accepted',
        notes: notes?.toString() || '',
        processed_by: processed_by?.toString() || 'QC Officer',
        fuerte_class1: fuerte_class1 ? parseFloat(fuerte_class1.toString()) : null,
        fuerte_class2: fuerte_class2 ? parseFloat(fuerte_class2.toString()) : null,
        fuerte_overall: fuerte_overall ? parseFloat(fuerte_overall.toString()) : null,
        hass_class1: hass_class1 ? parseFloat(hass_class1.toString()) : null,
        hass_class2: hass_class2 ? parseFloat(hass_class2.toString()) : null,
        hass_overall: hass_overall ? parseFloat(hass_overall.toString()) : null,
        processed_at: new Date()
      }
    });
    
    console.log('Quality check saved with ID:', qualityCheck.id);
    
    return NextResponse.json({ 
      success: true, 
      id: qualityCheck.id,
      message: 'Quality check saved successfully' 
    });

  } catch (error) {
    console.error('Error saving quality check:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save quality check',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
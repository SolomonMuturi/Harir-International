export interface CountingFormData {
  supplier_id: string;
  supplier_name: string;
  supplier_phone: string;
  region: string;
  fruits: Array<{
    name: string;
    weight: number;
  }>;
  
  // Fuerte 4kg
  fuerte_4kg_class1_size12: number;
  fuerte_4kg_class1_size14: number;
  fuerte_4kg_class1_size16: number;
  fuerte_4kg_class1_size18: number;
  fuerte_4kg_class1_size20: number;
  fuerte_4kg_class1_size22: number;
  fuerte_4kg_class1_size24: number;
  fuerte_4kg_class1_size26: number;
  
  fuerte_4kg_class2_size12: number;
  fuerte_4kg_class2_size14: number;
  fuerte_4kg_class2_size16: number;
  fuerte_4kg_class2_size18: number;
  fuerte_4kg_class2_size20: number;
  fuerte_4kg_class2_size22: number;
  fuerte_4kg_class2_size24: number;
  fuerte_4kg_class2_size26: number;
  
  // Fuerte 10kg
  fuerte_10kg_class1_size12: number;
  fuerte_10kg_class1_size14: number;
  fuerte_10kg_class1_size16: number;
  fuerte_10kg_class1_size18: number;
  fuerte_10kg_class1_size20: number;
  fuerte_10kg_class1_size22: number;
  fuerte_10kg_class1_size24: number;
  fuerte_10kg_class1_size26: number;
  fuerte_10kg_class1_size28: number;
  fuerte_10kg_class1_size30: number;
  fuerte_10kg_class1_size32: number;
  
  fuerte_10kg_class2_size12: number;
  fuerte_10kg_class2_size14: number;
  fuerte_10kg_class2_size16: number;
  fuerte_10kg_class2_size18: number;
  fuerte_10kg_class2_size20: number;
  fuerte_10kg_class2_size22: number;
  fuerte_10kg_class2_size24: number;
  fuerte_10kg_class2_size26: number;
  fuerte_10kg_class2_size28: number;
  fuerte_10kg_class2_size30: number;
  fuerte_10kg_class2_size32: number;
  
  // Hass 4kg
  hass_4kg_class1_size12: number;
  hass_4kg_class1_size14: number;
  hass_4kg_class1_size16: number;
  hass_4kg_class1_size18: number;
  hass_4kg_class1_size20: number;
  hass_4kg_class1_size22: number;
  hass_4kg_class1_size24: number;
  hass_4kg_class1_size26: number;
  
  hass_4kg_class2_size12: number;
  hass_4kg_class2_size14: number;
  hass_4kg_class2_size16: number;
  hass_4kg_class2_size18: number;
  hass_4kg_class2_size20: number;
  hass_4kg_class2_size22: number;
  hass_4kg_class2_size24: number;
  hass_4kg_class2_size26: number;
  
  // Hass 10kg
  hass_10kg_class1_size12: number;
  hass_10kg_class1_size14: number;
  hass_10kg_class1_size16: number;
  hass_10kg_class1_size18: number;
  hass_10kg_class1_size20: number;
  hass_10kg_class1_size22: number;
  hass_10kg_class1_size24: number;
  hass_10kg_class1_size26: number;
  hass_10kg_class1_size28: number;
  hass_10kg_class1_size30: number;
  hass_10kg_class1_size32: number;
  
  hass_10kg_class2_size12: number;
  hass_10kg_class2_size14: number;
  hass_10kg_class2_size16: number;
  hass_10kg_class2_size18: number;
  hass_10kg_class2_size20: number;
  hass_10kg_class2_size22: number;
  hass_10kg_class2_size24: number;
  hass_10kg_class2_size26: number;
  hass_10kg_class2_size28: number;
  hass_10kg_class2_size30: number;
  hass_10kg_class2_size32: number;
  
  notes: string;
}

export interface CountingRecord {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_phone: string;
  region: string;
  pallet_id: string;
  total_weight: number;
  counting_data: CountingFormData;
  submitted_at: string;
  processed_by: string;
  
  // Calculated totals
  totals: {
    fuerte_4kg_class1: number;
    fuerte_4kg_class2: number;
    fuerte_4kg_total: number;
    fuerte_10kg_class1: number;
    fuerte_10kg_class2: number;
    fuerte_10kg_total: number;
    hass_4kg_class1: number;
    hass_4kg_class2: number;
    hass_4kg_total: number;
    hass_10kg_class1: number;
    hass_10kg_class2: number;
    hass_10kg_total: number;
  };
}

export interface CountingStats {
  total_records: number;
  total_boxes: number;
  total_fuerte_boxes: number;
  total_hass_boxes: number;
  average_boxes_per_supplier: number;
  recent_activity: {
    last_7_days: number;
    last_30_days: number;
  };
}
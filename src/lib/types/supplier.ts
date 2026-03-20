export interface SupplierVehicle {
  id: string;
  supplier_code: string;
  name: string; // Supplier company name
  contact_name: string; // Driver name
  contact_phone: string; // Phone number
  driver_name: string;
  driver_id_number: string;
  vehicle_number_plate: string;
  produce_types: string[] | string; // Fruit varieties
  location?: string; // Region
  status: 'Active' | 'Inactive';
  vehicle_status: 'Pre-registered' | 'Checked-in' | 'Pending Exit' | 'Checked-out';
  vehicle_check_in_time?: string;
  vehicle_check_out_time?: string;
  created_at: string;
  updated_at: string;
}

export interface WeightEntryWithSupplier {
  id: string;
  pallet_id: string | null;
  product: string | null;
  weight: number | null;
  unit: 'kg' | 'lb';
  timestamp: string | null;
  supplier: string | null;
  supplier_id: string | null;
  truck_id: string | null;
  driver_id: string | null;
  gross_weight: number | null;
  tare_weight: number | null;
  net_weight: number | null;
  declared_weight: number | null;
  rejected_weight: number | null;
  created_at: string;
  
  // Supplier details
  supplier_name?: string;
  supplier_phone?: string;
  fruit_variety?: string[];
  number_of_crates?: number;
  region?: string;
  image_url?: string;
}
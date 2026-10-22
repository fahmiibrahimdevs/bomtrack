export type BOMStatus = "belum_checkout" | "sudah_checkout" | "ditolak" | "dibatalkan";
export type BOMPriority = "high" | "medium" | "low";
export type UserRole = "admin" | "user";

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
}

export interface Category {
  id: number | string;
  name: string;
  color?: string;
  description?: string;
  item_count?: number;
  created_at?: string;
}

export interface VariantItem {
  id?: string;
  name: string;
  price: number;
  stock?: number;
  image_url?: string;
}

export interface ScrapeResult {
  success: boolean;
  url: string;
  marketplace: string;
  name: string;
  base_price: number;
  min_qty: number;
  shop_name: string;
  shop_location: string;
  image_url?: string;
  description?: string;
  variants: VariantItem[];
  error_message?: string;
}

export interface BomItem {
  id: number;
  project_id: number;
  name: string;
  variant_name?: string;
  category: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  shop_name?: string;
  shop_location?: string;
  marketplace?: string;
  product_url?: string;
  image_url?: string;
  notes?: string;
  status: BOMStatus;
  priority: BOMPriority;
  is_purchased: number;
  created_at: string;
  updated_at: string;
}

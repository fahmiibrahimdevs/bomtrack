from pydantic import BaseModel, Field
from typing import List, Optional

# ==================== AUTH SCHEMAS ====================
class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    full_name: Optional[str] = ""

class LoginResponse(BaseModel):
    success: bool
    token: str
    user: UserResponse
    message: Optional[str] = "Login berhasil"

# ==================== CATEGORY SCHEMAS ====================
class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = "#3b82f6"
    description: Optional[str] = ""

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str
    description: str
    item_count: int = 0
    created_at: str

# ==================== SCRAPER SCHEMAS ====================
class VariantItem(BaseModel):
    id: Optional[str] = None
    name: str
    price: float = 0.0
    stock: Optional[int] = None
    image_url: Optional[str] = None

class ScrapeRequest(BaseModel):
    url: str

class ScrapeResponse(BaseModel):
    success: bool
    url: str
    marketplace: str
    name: str
    base_price: float
    min_qty: int = 1
    shop_name: str
    shop_location: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    variants: List[VariantItem] = []
    error_message: Optional[str] = None

# ==================== BOM ITEM SCHEMAS ====================
class BomItemCreate(BaseModel):
    name: str
    project_id: Optional[int] = 1
    variant_name: Optional[str] = ""
    category: Optional[str] = "Elektronik"
    unit_price: float = 0.0
    quantity: int = 1
    total_price: Optional[float] = None
    shop_name: Optional[str] = ""
    shop_location: Optional[str] = ""
    marketplace: Optional[str] = ""
    product_url: Optional[str] = ""
    image_url: Optional[str] = ""
    notes: Optional[str] = ""
    status: Optional[str] = "belum_checkout"
    priority: Optional[str] = "medium"
    is_purchased: Optional[int] = 0

class BomItemUpdate(BaseModel):
    project_id: Optional[int] = None
    name: Optional[str] = None
    variant_name: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = None
    quantity: Optional[int] = None
    total_price: Optional[float] = None
    shop_name: Optional[str] = None
    shop_location: Optional[str] = None
    marketplace: Optional[str] = None
    product_url: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    is_purchased: Optional[int] = None

class BomItemResponse(BaseModel):
    id: int
    project_id: int
    name: str
    variant_name: str
    category: str
    unit_price: float
    quantity: int
    total_price: float
    shop_name: str
    shop_location: str
    marketplace: str
    product_url: str
    image_url: str
    notes: str
    status: str
    priority: str
    is_purchased: int
    created_at: str
    updated_at: str

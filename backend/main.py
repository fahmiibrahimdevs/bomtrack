import os
import sqlite3
import logging
import secrets
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Response, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .database import get_db_connection, init_db, verify_password
from .schemas import (
    LoginRequest, LoginResponse, UserResponse,
    ScrapeRequest, ScrapeResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    BomItemCreate, BomItemUpdate, BomItemResponse
)
from .scraper.manager import scrape_product_url
from .exporter import generate_bom_excel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("bomtrack.api")

app = FastAPI(
    title="BOMTrack Database API",
    description="Master Components & E-Commerce Scraper Database API with RBAC",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("BOMTrack backend startup completed with RBAC.")

# ==================== AUTH DEPENDENCIES ====================
def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)
) -> dict:
    auth_token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            auth_token = parts[1]
    if not auth_token and token:
        auth_token = token

    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentikasi diperlukan. Silakan login terlebih dahulu."
        )

    conn = get_db_connection()
    row = conn.cursor().execute("""
        SELECT u.id, u.username, u.role, u.full_name
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
    """, (auth_token,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi telah kedaluwarsa atau tidak valid. Silakan login kembali."
        )

    return dict(row)

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Hanya pengguna dengan peran Admin yang dapat melakukan tindakan ini."
        )
    return user

# ==================== AUTH ENDPOINTS ====================
@app.post("/api/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
    username = req.username.strip()
    if not username or not req.password:
        raise HTTPException(status_code=400, detail="Username dan password wajib diisi.")

    conn = get_db_connection()
    cursor = conn.cursor()
    user = cursor.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

    if not user or not verify_password(req.password, user["password_hash"], user["salt"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Username atau password salah.")

    token = secrets.token_hex(32)
    cursor.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user["id"]))
    conn.commit()

    user_data = {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "full_name": user["full_name"] or user["username"]
    }
    conn.close()

    return LoginResponse(
        success=True,
        token=token,
        user=UserResponse(**user_data),
        message=f"Selamat datang, {user_data['full_name']}!"
    )

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

@app.post("/api/auth/logout")
def logout(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)
):
    auth_token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            auth_token = parts[1]
    if not auth_token and token:
        auth_token = token

    if auth_token:
        conn = get_db_connection()
        conn.cursor().execute("DELETE FROM sessions WHERE token = ?", (auth_token,))
        conn.commit()
        conn.close()

    return {"success": True, "message": "Berhasil logout."}

# ==================== SCRAPER ENDPOINT ====================
@app.post("/api/scrape", response_model=ScrapeResponse)
async def scrape_item(req: ScrapeRequest, admin: dict = Depends(require_admin)):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL tidak boleh kosong.")
    try:
        data = await scrape_product_url(req.url)
        return ScrapeResponse(**data)
    except Exception as e:
        logger.error(f"Scrape endpoint error: {e}")
        return ScrapeResponse(
            success=False,
            url=req.url,
            marketplace="Unknown",
            name="",
            base_price=0.0,
            min_qty=1,
            shop_name="",
            shop_location="",
            variants=[],
            error_message=str(e)
        )

# ==================== CATEGORIES CRUD ENDPOINTS ====================
@app.get("/api/categories", response_model=List[CategoryResponse])
def list_categories(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        c.id, c.name, c.color, c.description, c.created_at,
        COUNT(b.id) as item_count
    FROM categories c
    LEFT JOIN bom_items b ON c.name = b.category
    GROUP BY c.id
    ORDER BY c.name ASC
    """
    rows = cursor.execute(query).fetchall()
    results = []
    for r in rows:
        results.append(CategoryResponse(
            id=r["id"],
            name=r["name"],
            color=r["color"] or "#6366f1",
            description=r["description"] or "",
            item_count=r["item_count"],
            created_at=str(r["created_at"])
        ))
    conn.close()
    return results

@app.post("/api/categories", response_model=CategoryResponse)
def create_category(item: CategoryCreate, admin: dict = Depends(require_admin)):
    name = item.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nama kategori tidak boleh kosong.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    existing = cursor.execute("SELECT * FROM categories WHERE name = ?", (name,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Kategori '{name}' sudah ada.")
        
    cursor.execute(
        "INSERT INTO categories (name, color, description) VALUES (?, ?, ?)",
        (name, item.color or "#6366f1", item.description or "")
    )
    conn.commit()
    cat_id = cursor.lastrowid
    row = cursor.execute("SELECT * FROM categories WHERE id = ?", (cat_id,)).fetchone()
    conn.close()
    
    return CategoryResponse(
        id=row["id"],
        name=row["name"],
        color=row["color"] or "#6366f1",
        description=row["description"] or "",
        item_count=0,
        created_at=str(row["created_at"])
    )

@app.put("/api/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, item: CategoryUpdate, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    current = cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,)).fetchone()
    if not current:
        conn.close()
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
        
    old_name = current["name"]
    new_name = item.name.strip() if item.name is not None else old_name
    new_color = item.color if item.color is not None else current["color"]
    new_desc = item.description if item.description is not None else current["description"]
    
    cursor.execute(
        "UPDATE categories SET name = ?, color = ?, description = ? WHERE id = ?",
        (new_name, new_color, new_desc, category_id)
    )
    
    if old_name != new_name:
        cursor.execute("UPDATE bom_items SET category = ? WHERE category = ?", (new_name, old_name))
        
    conn.commit()
    
    count_row = cursor.execute("SELECT COUNT(*) FROM bom_items WHERE category = ?", (new_name,)).fetchone()
    item_count = count_row[0] if count_row else 0
    conn.close()
    
    return CategoryResponse(
        id=category_id,
        name=new_name,
        color=new_color,
        description=new_desc,
        item_count=item_count,
        created_at=str(current["created_at"])
    )

@app.delete("/api/categories/{category_id}")
def delete_category(category_id: int, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    current = cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,)).fetchone()
    if not current:
        conn.close()
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
        
    cat_name = current["name"]
    cursor.execute("UPDATE bom_items SET category = 'Lainnya' WHERE category = ?", (cat_name,))
    cursor.execute("DELETE FROM categories WHERE id = ?", (category_id,))
    conn.commit()
    conn.close()
    return {"message": f"Kategori '{cat_name}' berhasil dihapus."}

# ==================== BOM ITEMS ENDPOINTS ====================
@app.get("/api/items", response_model=List[BomItemResponse])
def list_items(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM bom_items WHERE 1=1"
    params = []
    
    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
    if search:
        query += " AND (name LIKE ? OR shop_name LIKE ? OR variant_name LIKE ? OR notes LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])
        
    query += " ORDER BY id DESC"
    rows = cursor.execute(query, params).fetchall()
    
    items = []
    for r in rows:
        stat = r["status"] if "status" in r.keys() and r["status"] else ("sudah_checkout" if r["is_purchased"] == 1 else "belum_checkout")
        prio = r["priority"] if "priority" in r.keys() and r["priority"] else "medium"
        items.append(BomItemResponse(
            id=r["id"],
            project_id=r["project_id"] or 1,
            name=r["name"],
            variant_name=r["variant_name"] or "",
            category=r["category"] or "Elektronik",
            unit_price=float(r["unit_price"]),
            quantity=r["quantity"],
            total_price=float(r["total_price"]),
            shop_name=r["shop_name"] or "",
            shop_location=r["shop_location"] or "",
            marketplace=r["marketplace"] or "",
            product_url=r["product_url"] or "",
            image_url=r["image_url"] or "",
            notes=r["notes"] or "",
            status=stat,
            priority=prio,
            is_purchased=r["is_purchased"],
            created_at=str(r["created_at"]),
            updated_at=str(r["updated_at"])
        ))
    conn.close()
    return items

@app.post("/api/items", response_model=BomItemResponse)
def create_item(item: BomItemCreate, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    total = item.total_price if item.total_price is not None else (item.unit_price * item.quantity)
    stat = item.status or ("sudah_checkout" if item.is_purchased == 1 else "belum_checkout")
    prio = item.priority or "medium"
    is_pur = 1 if stat == "sudah_checkout" else (item.is_purchased or 0)
    
    cursor.execute("""
    INSERT INTO bom_items (
        project_id, name, variant_name, category, unit_price, quantity, total_price,
        shop_name, shop_location, marketplace, product_url, image_url, notes, status, priority, is_purchased
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item.project_id or 1, item.name, item.variant_name or "", item.category or "Elektronik",
        item.unit_price, item.quantity, total, item.shop_name or "", item.shop_location or "",
        item.marketplace or "", item.product_url or "", item.image_url or "", item.notes or "",
        stat, prio, is_pur
    ))
    conn.commit()
    item_id = cursor.lastrowid
    
    row = cursor.execute("SELECT * FROM bom_items WHERE id = ?", (item_id,)).fetchone()
    conn.close()
    
    return BomItemResponse(
        id=row["id"],
        project_id=row["project_id"] or 1,
        name=row["name"],
        variant_name=row["variant_name"] or "",
        category=row["category"] or "Elektronik",
        unit_price=float(row["unit_price"]),
        quantity=row["quantity"],
        total_price=float(row["total_price"]),
        shop_name=row["shop_name"] or "",
        shop_location=row["shop_location"] or "",
        marketplace=row["marketplace"] or "",
        product_url=row["product_url"] or "",
        image_url=row["image_url"] or "",
        notes=row["notes"] or "",
        status=row["status"] or "belum_checkout",
        priority=row["priority"] or "medium",
        is_purchased=row["is_purchased"],
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"])
    )

@app.put("/api/items/{item_id}", response_model=BomItemResponse)
def update_item(item_id: int, item: BomItemUpdate, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    current = cursor.execute("SELECT * FROM bom_items WHERE id = ?", (item_id,)).fetchone()
    if not current:
        conn.close()
        raise HTTPException(status_code=404, detail="Item tidak ditemukan.")
        
    project_id = item.project_id if item.project_id is not None else current["project_id"]
    name = item.name if item.name is not None else current["name"]
    variant_name = item.variant_name if item.variant_name is not None else current["variant_name"]
    category = item.category if item.category is not None else current["category"]
    unit_price = item.unit_price if item.unit_price is not None else current["unit_price"]
    quantity = item.quantity if item.quantity is not None else current["quantity"]
    
    if item.total_price is not None:
        total_price = item.total_price
    else:
        total_price = unit_price * quantity
        
    shop_name = item.shop_name if item.shop_name is not None else current["shop_name"]
    shop_location = item.shop_location if item.shop_location is not None else current["shop_location"]
    marketplace = item.marketplace if item.marketplace is not None else current["marketplace"]
    product_url = item.product_url if item.product_url is not None else current["product_url"]
    image_url = item.image_url if item.image_url is not None else current["image_url"]
    notes = item.notes if item.notes is not None else current["notes"]
    
    stat = item.status if item.status is not None else (current["status"] if "status" in current.keys() and current["status"] else ("sudah_checkout" if current["is_purchased"] == 1 else "belum_checkout"))
    prio = item.priority if item.priority is not None else (current["priority"] if "priority" in current.keys() and current["priority"] else "medium")
    
    if item.is_purchased is not None:
        is_purchased = item.is_purchased
        if item.status is None:
            stat = "sudah_checkout" if is_purchased == 1 else "belum_checkout"
    else:
        is_purchased = 1 if stat == "sudah_checkout" else 0
    
    cursor.execute("""
    UPDATE bom_items SET
        project_id = ?, name = ?, variant_name = ?, category = ?, unit_price = ?, quantity = ?,
        total_price = ?, shop_name = ?, shop_location = ?, marketplace = ?, product_url = ?,
        image_url = ?, notes = ?, status = ?, priority = ?, is_purchased = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (
        project_id or 1, name, variant_name, category, unit_price, quantity, total_price,
        shop_name, shop_location, marketplace, product_url, image_url, notes, stat, prio, is_purchased, item_id
    ))
    conn.commit()
    
    row = cursor.execute("SELECT * FROM bom_items WHERE id = ?", (item_id,)).fetchone()
    conn.close()
    
    return BomItemResponse(
        id=row["id"],
        project_id=row["project_id"] or 1,
        name=row["name"],
        variant_name=row["variant_name"] or "",
        category=row["category"] or "Elektronik",
        unit_price=float(row["unit_price"]),
        quantity=row["quantity"],
        total_price=float(row["total_price"]),
        shop_name=row["shop_name"] or "",
        shop_location=row["shop_location"] or "",
        marketplace=row["marketplace"] or "",
        product_url=row["product_url"] or "",
        image_url=row["image_url"] or "",
        notes=row["notes"] or "",
        status=row["status"] or "belum_checkout",
        priority=row["priority"] or "medium",
        is_purchased=row["is_purchased"],
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"])
    )

@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bom_items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"message": "Item berhasil dihapus."}

# ==================== EXPORT ENDPOINT ====================
@app.get("/api/export/excel")
def export_excel_all(category: Optional[str] = Query(None), user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM bom_items WHERE 1=1"
    params = []
    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
        title = f"Database Komponen - Kategori {category}"
    else:
        title = "Database Master Komponen"
        
    query += " ORDER BY category ASC, id ASC"
    rows = cursor.execute(query, params).fetchall()
    conn.close()
    
    items = [dict(r) for r in rows]
    excel_bytes = generate_bom_excel(title, items)
    
    filename = f"Database_Komponen_{category or 'Semua'}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/export/{project_id}/excel")
def export_excel_project(project_id: int, user: dict = Depends(get_current_user)):
    return export_excel_all(user=user)

# ==================== STATIC FRONTEND SERVING ====================
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

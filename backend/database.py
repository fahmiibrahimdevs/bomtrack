import sqlite3
import os
import hashlib
import hmac
import secrets
from typing import List, Dict, Any, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "bomtrack.db")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return pwd_hash, salt

def verify_password(password: str, pwd_hash: str, salt: str) -> bool:
    expected_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(expected_hash, pwd_hash)

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Categories table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3b82f6',
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        budget REAL DEFAULT 0.0,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # BOM Items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bom_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER DEFAULT 1,
        name TEXT NOT NULL,
        variant_name TEXT DEFAULT '',
        category TEXT DEFAULT '',
        unit_price REAL NOT NULL DEFAULT 0.0,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_price REAL NOT NULL DEFAULT 0.0,
        shop_name TEXT DEFAULT '',
        shop_location TEXT DEFAULT '',
        marketplace TEXT DEFAULT '',
        product_url TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'belum_checkout',
        priority TEXT DEFAULT 'medium',
        is_purchased INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        full_name TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # User Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    # Check and add missing columns if upgrading existing table
    columns = [col[1] for col in cursor.execute("PRAGMA table_info(bom_items)").fetchall()]
    if "status" not in columns:
        cursor.execute("ALTER TABLE bom_items ADD COLUMN status TEXT DEFAULT 'belum_checkout'")
    if "priority" not in columns:
        cursor.execute("ALTER TABLE bom_items ADD COLUMN priority TEXT DEFAULT 'medium'")
    
    # Seed default admin & user if not present
    admin_user = cursor.execute("SELECT * FROM users WHERE username = 'admin'").fetchone()
    if not admin_user:
        admin_hash, admin_salt = hash_password("31750321")
        cursor.execute(
            "INSERT INTO users (username, password_hash, salt, role, full_name) VALUES (?, ?, ?, ?, ?)",
            ("admin", admin_hash, admin_salt, "admin", "Administrator")
        )
    
    normal_user = cursor.execute("SELECT * FROM users WHERE username = 'user'").fetchone()
    if not normal_user:
        user_hash, user_salt = hash_password("user123")
        cursor.execute(
            "INSERT INTO users (username, password_hash, salt, role, full_name) VALUES (?, ?, ?, ?, ?)",
            ("user", user_hash, user_salt, "user", "User (Read Only)")
        )

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)

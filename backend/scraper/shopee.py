import re
import json
import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse, parse_qs
from curl_cffi import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("bomtrack.shopee")

def extract_shopee_ids(url: str) -> tuple[Optional[int], Optional[int]]:
    """
    Extracts shop_id and item_id from Shopee URL.
    Handles formats:
    - https://shopee.co.id/product/{shop_id}/{item_id}
    - https://shopee.co.id/Judul-Produk--i.{shop_id}.{item_id}
    - https://shopee.co.id/Judul-Produk-i.{shop_id}.{item_id}
    """
    match = re.search(r"-+i\.(\d+)\.(\d+)", url)
    if match:
        return int(match.group(1)), int(match.group(2))
    
    match2 = re.search(r"/product/(\d+)/(\d+)", url)
    if match2:
        return int(match2.group(1)), int(match2.group(2))
    
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    if "itemid" in qs and "shopid" in qs:
        return int(qs["shopid"][0]), int(qs["itemid"][0])
    if "item_id" in qs and "shop_id" in qs:
        return int(qs["shop_id"][0]), int(qs["item_id"][0])
    
    return None, None

def resolve_shopee_shortlink(url: str) -> str:
    """Follow redirects for id.shp.ee or shope.ee links"""
    try:
        if "shp.ee" in url or "shope.ee" in url:
            resp = requests.get(
                url,
                impersonate="chrome",
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"},
                timeout=10
            )
            return resp.url
    except Exception as e:
        logger.warning(f"Failed to resolve Shopee shortlink: {e}")
    return url

async def scrape_shopee(url: str) -> Dict[str, Any]:
    resolved_url = resolve_shopee_shortlink(url)
    shop_id, item_id = extract_shopee_ids(resolved_url)
    
    # Method 1: Fetch HTML via curl_cffi and parse initialState embedded JSON
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://shopee.co.id/",
        }
        resp = requests.get(resolved_url, headers=headers, impersonate="chrome", timeout=12)
        if resp.status_code == 200:
            result = parse_shopee_html(resp.text, resolved_url)
            if result.get("success") and (result.get("name") or result.get("shop_name")):
                return result
    except Exception as e:
        logger.warning(f"Shopee HTML scraper failed: {e}")

    # Method 2: Fallback to Playwright
    return await scrape_shopee_playwright(resolved_url)

def parse_shopee_html(html: str, url: str) -> Dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    
    # 1. Product Title
    title = ""
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = re.sub(r"\s*\|\s*Shopee.*$", "", og_title["content"], flags=re.IGNORECASE)
        title = re.sub(r"^Jual\s+", "", title, flags=re.IGNORECASE).strip()
    elif soup.title and soup.title.string:
        title = re.sub(r"\s*\|\s*Shopee.*$", "", soup.title.string, flags=re.IGNORECASE)
        title = re.sub(r"^Jual\s+", "", title, flags=re.IGNORECASE).strip()

    # 2. Image URL
    image_url = ""
    og_img = soup.find("meta", property="og:image")
    if og_img and og_img.get("content"):
        image_url = og_img["content"]

    shop_name = ""
    shop_location = ""
    price = 0.0
    variants: List[Dict[str, Any]] = []
    min_qty = 1

    # 3. Deep extract from script initialState
    for s in soup.find_all("script"):
        txt = s.string or ""
        if "initialState" in txt:
            try:
                data = json.loads(txt)
                init_state = data.get("initialState", {})
                
                # PDP BFF Data
                pdp_bff = init_state.get("DOMAIN_PDP", {}).get("data", {}).get("PDP_BFF_DATA", {})
                cached_map = pdp_bff.get("cachedMap", {})
                for k, v in cached_map.items():
                    # Title
                    if not title and v.get("item", {}).get("title"):
                        title = v["item"]["title"].strip()
                        
                    # Shop Name
                    vouchers = v.get("shop_vouchers") or v.get("item", {}).get("shop_vouchers", [])
                    if vouchers and isinstance(vouchers, list) and len(vouchers) > 0:
                        v_name = vouchers[0].get("shop_name", "")
                        if v_name:
                            shop_name = v_name
                    if not shop_name and v.get("shop_detailed", {}).get("name"):
                        shop_name = v["shop_detailed"]["name"]
                        
                    # Location
                    loc = v.get("item", {}).get("shop_location") or v.get("shop_detailed", {}).get("shop_location")
                    if loc:
                        shop_location = loc
                        
                    # Variants / Models
                    models = v.get("models") or v.get("item", {}).get("models", [])
                    if models:
                        for m in models:
                            m_name = m.get("name", "").strip()
                            m_price_raw = m.get("price") or 0
                            m_price = float(m_price_raw) / 100000.0 if m_price_raw > 1000000 else float(m_price_raw)
                            if m_name:
                                variants.append({
                                    "id": str(m.get("modelid", "")),
                                    "name": m_name,
                                    "price": m_price,
                                    "stock": m.get("stock", 0),
                                    "image_url": image_url
                                })
                                
                    # Base Price
                    p_val = v.get("item", {}).get("price") or v.get("product_price", {}).get("price") if isinstance(v.get("product_price"), dict) else 0
                    if p_val:
                        price = float(p_val) / 100000.0 if p_val > 1000000 else float(p_val)
                        
                # Check item.items
                items_dict = init_state.get("item", {}).get("items", {})
                if isinstance(items_dict, dict):
                    for item_id, item_obj in items_dict.items():
                        if not shop_name:
                            vouchers = item_obj.get("shop_vouchers", [])
                            if vouchers and len(vouchers) > 0:
                                shop_name = vouchers[0].get("shop_name", "")
                        if not shop_location and item_obj.get("shop_location"):
                            shop_location = item_obj.get("shop_location")
                        if not price and item_obj.get("price"):
                            p_raw = item_obj["price"]
                            price = float(p_raw) / 100000.0 if p_raw > 1000000 else float(p_raw)
                            
            except Exception as e:
                logger.warning(f"Error parsing Shopee initialState: {e}")

    # DOM Selector and Regex Fallbacks
    if not shop_name:
        dom_shop = soup.select_one('#sll2-pdp-product-shop .KBEZs0, .KBEZs0, .vzwYi9 div, .page-product__shop a')
        if dom_shop and dom_shop.get_text(strip=True):
            cand = dom_shop.get_text(strip=True)
            if not cand.lower().startswith("smart_") and "byshopee" not in cand.lower() and "produk" not in cand.lower() and "penilaian" not in cand.lower():
                shop_name = cand

    if not shop_name:
        m_shop = (
            re.search(r'\"shop_detailed\"\s*:\s*\{[^\}]*\"name\"\s*:\s*\"([^\"]+)\"', html) or
            re.search(r'\"shop_name\"\s*:\s*\"([^\"]+)\"', html)
        )
        if m_shop:
            cand = m_shop.group(1).strip()
            if not cand.lower().startswith("smart_") and "byshopee" not in cand.lower() and "produk" not in cand.lower() and "penilaian" not in cand.lower():
                shop_name = cand
            
    # Location Fallbacks
    if not shop_location:
        for row in soup.select('.c0ztn1, .product-detail div, .page-product__detail div'):
            h3_label = row.find(['h3', 'label', 'span', 'dt'])
            if h3_label and "dikirim dari" in h3_label.get_text(strip=True).lower():
                val = h3_label.find_next_sibling() or row.find_all(['div', 'a'])[-1]
                if val and val != h3_label:
                    shop_location = val.get_text(strip=True)
                    break

    if not shop_location:
        m_loc = (
            re.search(r'\"shop_detailed\"\s*:\s*\{[^\}]*\"shop_location\"\s*:\s*\"([^\"]+)\"', html) or
            re.search(r'\"shop_location\"\s*:\s*\"([^\"]+)\"', html) or
            re.search(r'\"city\"\s*:\s*\"([^\"]+)\"', html)
        )
        if m_loc:
            shop_location = m_loc.group(1)

    if shop_location:
        shop_location = re.sub(r'^(KAB\.|KOTA)\s*', '', shop_location, flags=re.IGNORECASE).strip()

    # Search for price patterns in JSON
    if price == 0.0:
        # Search for price_min / price_max / price
        m_price = re.search(r'\"price(?:_min)?\"\s*:\s*(\d{5,12})', html)
        if m_price:
            raw_p = float(m_price.group(1))
            price = raw_p / 100000.0 if raw_p > 1000000 else raw_p

    return {
        "success": bool(title or shop_name),
        "marketplace": "Shopee",
        "url": url,
        "name": title or "Produk Shopee",
        "base_price": price,
        "min_qty": min_qty,
        "shop_name": shop_name or "Shopee Seller",
        "shop_location": shop_location or "Indonesia",
        "image_url": image_url,
        "description": "",
        "variants": variants
    }

async def scrape_shopee_playwright(url: str) -> Dict[str, Any]:
    return {
        "success": False,
        "marketplace": "Shopee",
        "url": url,
        "name": "",
        "base_price": 0.0,
        "min_qty": 1,
        "shop_name": "",
        "shop_location": "",
        "image_url": "",
        "variants": [],
        "error_message": "Gunakan Bookmarklet / Clipper untuk integrasi 100% Shopee"
    }

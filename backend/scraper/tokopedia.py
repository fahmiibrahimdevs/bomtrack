import re
import json
import logging
from typing import Optional, Dict, Any, List
from curl_cffi import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("bomtrack.tokopedia")

def resolve_tokopedia_shortlink(url: str) -> str:
    """Resolve tokopedia.link redirect to full URL"""
    try:
        if "tokopedia.link" in url:
            resp = requests.get(
                url,
                impersonate="chrome",
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"},
                timeout=10
            )
            return resp.url
    except Exception as e:
        logger.warning(f"Failed to resolve Tokopedia shortlink: {e}")
    return url

async def scrape_tokopedia(url: str) -> Dict[str, Any]:
    resolved_url = resolve_tokopedia_shortlink(url)
    
    # Method 1: Try HTML extraction with curl_cffi Chrome impersonation
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.tokopedia.com/",
        }
        resp = requests.get(resolved_url, headers=headers, impersonate="chrome", timeout=12)
        if resp.status_code == 200:
            result = parse_tokopedia_html(resp.text, resolved_url)
            if result.get("success") and result.get("name"):
                return result
    except Exception as e:
        logger.warning(f"Tokopedia HTTP scraper failed: {e}")
        
    # Method 2: Fallback to Playwright
    return await scrape_tokopedia_playwright(resolved_url)

def parse_tokopedia_html(html: str, url: str) -> Dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    
    # 1. Look for Schema.org JSON-LD (Product)
    product_json = None
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            if isinstance(data, list):
                for item in data:
                    if item.get("@type") == "Product":
                        product_json = item
                        break
            elif data.get("@type") == "Product":
                product_json = data
                break
        except Exception:
            continue
            
    # 2. Look for __NEXT_DATA__ or window.__INITIAL_STATE__
    next_data = None
    script_next = soup.find("script", id="__NEXT_DATA__")
    if script_next and script_next.string:
        try:
            next_data = json.loads(script_next.string)
        except:
            pass

    name = ""
    base_price = 0.0
    shop_name = ""
    shop_location = ""
    image_url = ""
    min_qty = 1
    variants = []

    if product_json:
        name = product_json.get("name", "").strip()
        offers = product_json.get("offers", {})
        if isinstance(offers, list) and offers:
            offers = offers[0]
        base_price = float(offers.get("price", 0.0))
        image_url = product_json.get("image", "")
        if isinstance(image_url, list) and image_url:
            image_url = image_url[0]
        
    # Extract from __NEXT_DATA__ if available for richer info (variants, seller, location)
    if next_data:
        try:
            props = next_data.get("props", {}).get("pageProps", {})
            # Look inside props for layout / pdp info
            for key, val in props.items():
                if isinstance(val, dict):
                    # Check for shop info
                    shop = val.get("shop", {}) or val.get("shopInfo", {})
                    if shop:
                        if not shop_name:
                            shop_name = shop.get("name", "")
                        if not shop_location:
                            shop_location = shop.get("location", "") or shop.get("city", "")
                    # Check for product info
                    p_info = val.get("data", {}) or val.get("product", {})
                    if isinstance(p_info, dict):
                        if not name and p_info.get("title"):
                            name = p_info.get("title")
                        if not base_price and p_info.get("price", {}).get("value"):
                            base_price = float(p_info.get("price", {}).get("value"))
                        # Variants
                        v_info = p_info.get("variant", {}) or val.get("variant", {})
                        if v_info and "children" in v_info:
                            for child in v_info.get("children", []):
                                v_name = child.get("name", "") or " / ".join(opt.get("value", "") for opt in child.get("optionName", []))
                                v_price = float(child.get("price", base_price))
                                variants.append({
                                    "id": str(child.get("productID", "")),
                                    "name": v_name,
                                    "price": v_price,
                                    "stock": child.get("stock", 0),
                                    "image_url": child.get("picture", {}).get("url", image_url)
                                })
        except Exception as e:
            logger.warning(f"Error parsing next_data: {e}")

    # Fallback to HTML meta tags / DOM selectors
    if not name:
        h1 = soup.find("h1", attrs={"data-testid": "lblPDPDetailProductName"}) or soup.find("h1")
        if h1:
            name = h1.get_text(strip=True)
            
    if not base_price:
        price_elem = soup.find("div", attrs={"data-testid": "lblPDPDetailProductPrice"}) or soup.find(class_=re.compile(r"price", re.I))
        if price_elem:
            digits = re.sub(r"[^\d]", "", price_elem.get_text())
            if digits:
                base_price = float(digits)
                
    if not shop_name:
        shop_elem = soup.find(attrs={"data-testid": "llbPDPFooterShopName"}) or soup.find("a", attrs={"data-testid": "shop-name"})
        if shop_elem:
            shop_name = shop_elem.get_text(strip=True)
            
    if not shop_location:
        loc_elem = (
            soup.find(attrs={"data-testid": "lblPDPFooterShopLocation"}) or
            soup.find(attrs={"data-testid": "pdpShopLocation"}) or
            soup.find(attrs={"data-testid": "lblPDPDetailProductShipping"}) or
            soup.find(attrs={"data-testid": "shop-location"})
        )
        if loc_elem:
            shop_location = loc_elem.get_text(strip=True)

    if shop_location:
        shop_location = re.sub(r'^Dikirim\s+dari\s*', '', shop_location, flags=re.IGNORECASE)
        shop_location = re.sub(r'^(KAB\.|KOTA)\s*', '', shop_location, flags=re.IGNORECASE).strip()

    if not image_url:
        og_img = soup.find("meta", property="og:image")
        if og_img and og_img.get("content"):
            image_url = og_img["content"]

    # If title still not found, check og:title
    if not name:
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            name = re.sub(r"\s*\|\s*Tokopedia.*$", "", og_title["content"], flags=re.IGNORECASE)
            name = re.sub(r"^Jual\s+", "", name, flags=re.IGNORECASE)

    return {
        "success": bool(name),
        "marketplace": "Tokopedia",
        "url": url,
        "name": name,
        "base_price": base_price,
        "min_qty": min_qty,
        "shop_name": shop_name or "Tokopedia Seller",
        "shop_location": shop_location or "Indonesia",
        "image_url": image_url,
        "description": "",
        "variants": variants
    }

async def scrape_tokopedia_playwright(url: str) -> Dict[str, Any]:
    """Headless browser fallback for Tokopedia"""
    from playwright.async_api import async_playwright
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-blink-features=AutomationControlled",
                ]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
                locale="id-ID"
            )
            page = await context.new_page()
            
            await page.goto(url, wait_until="domcontentloaded", timeout=25000)
            await page.wait_for_timeout(3500)
            
            # Extract title
            title_elem = await page.query_selector("[data-testid='lblPDPDetailProductName'], h1")
            name = (await title_elem.inner_text()).strip() if title_elem else ""
            if not name:
                full_title = await page.title()
                name = re.sub(r"\s*\|\s*Tokopedia.*$", "", full_title, flags=re.IGNORECASE)
                name = re.sub(r"^Jual\s+", "", name, flags=re.IGNORECASE)
                
            # Extract price
            price_elem = await page.query_selector("[data-testid='lblPDPDetailProductPrice'], .price")
            price_text = (await price_elem.inner_text()) if price_elem else "0"
            price_digits = re.sub(r"[^\d]", "", price_text)
            price = float(price_digits) if price_digits else 0.0
            
            # Extract shop name
            shop_elem = await page.query_selector("[data-testid='llbPDPFooterShopName'], [data-testid='shop-name'], a[href*='/shop/']")
            shop_name = (await shop_elem.inner_text()).strip() if shop_elem else "Tokopedia Seller"
            
            # Extract shop location
            loc_elem = await page.query_selector("[data-testid='lblPDPFooterShopLocation'], p:has-text('Dikirim dari')")
            shop_location = ""
            if loc_elem:
                loc_text = await loc_elem.inner_text()
                shop_location = loc_text.replace("Dikirim dari", "").strip()
            if not shop_location:
                shop_location = "Indonesia"
                
            # Extract variants
            variant_buttons = await page.query_selector_all("[data-testid='btnPDPVariantItem'], [data-testid*='variant-item'], button[data-unify='Chip']")
            variants = []
            for btn in variant_buttons:
                v_text = (await btn.inner_text()).strip()
                if v_text:
                    variants.append({
                        "id": "",
                        "name": v_text,
                        "price": price,
                        "stock": 0,
                        "image_url": ""
                    })
                    
            # Extract image
            img_elem = await page.query_selector("[data-testid='PDPMainImage'], [data-testid='PDPImageThumbnail'] img")
            img_url = (await img_elem.get_attribute("src")) if img_elem else ""
            
            await browser.close()
            
            return {
                "success": bool(name and name != "Situs Jual Beli Online Terlengkap, Mudah & Aman | Tokopedia"),
                "marketplace": "Tokopedia",
                "url": url,
                "name": name,
                "base_price": price,
                "min_qty": 1,
                "shop_name": shop_name,
                "shop_location": shop_location,
                "image_url": img_url,
                "description": "",
                "variants": variants
            }
    except Exception as e:
        logger.error(f"Tokopedia playwright error: {e}")
        return {
            "success": False,
            "marketplace": "Tokopedia",
            "url": url,
            "name": "",
            "base_price": 0.0,
            "min_qty": 1,
            "shop_name": "",
            "shop_location": "",
            "image_url": "",
            "variants": [],
            "error_message": f"Gagal mengambil data Tokopedia: {str(e)}"
        }

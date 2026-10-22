import re
import json
import logging
from typing import Dict, Any
from curl_cffi import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("bomtrack.generic")

async def scrape_generic(url: str) -> Dict[str, Any]:
    """Scrape product info from any generic ecommerce / website"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        resp = requests.get(url, headers=headers, impersonate="chrome", timeout=12)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # 1. Product Title
            title = ""
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                title = og_title["content"].strip()
            elif soup.title and soup.title.string:
                title = soup.title.string.strip()
            elif soup.find("h1"):
                title = soup.find("h1").get_text(strip=True)
                
            # 2. Price
            price = 0.0
            # Check OpenGraph price
            og_price = soup.find("meta", property="og:price:amount") or soup.find("meta", property="product:price:amount")
            if og_price and og_price.get("content"):
                try:
                    price = float(og_price["content"])
                except:
                    pass
                    
            if price == 0.0:
                # Search for JSON-LD
                for script in soup.find_all("script", type="application/ld+json"):
                    try:
                        data = json.loads(script.string or "")
                        if isinstance(data, dict) and data.get("@type") == "Product":
                            offers = data.get("offers", {})
                            if isinstance(offers, dict) and "price" in offers:
                                price = float(offers["price"])
                            elif isinstance(offers, list) and offers:
                                price = float(offers[0].get("price", 0))
                            break
                    except:
                        continue
                        
            # 3. Image
            image_url = ""
            og_image = soup.find("meta", property="og:image")
            if og_image and og_image.get("content"):
                image_url = og_image["content"]
                
            # 4. Site Name
            site_name = ""
            og_site = soup.find("meta", property="og:site_name")
            if og_site and og_site.get("content"):
                site_name = og_site["content"].strip()
            else:
                from urllib.parse import urlparse
                site_name = urlparse(url).netloc
                
            return {
                "success": bool(title),
                "marketplace": site_name or "Web Store",
                "url": url,
                "name": title,
                "base_price": price,
                "min_qty": 1,
                "shop_name": site_name or "Online Seller",
                "shop_location": "Online",
                "image_url": image_url,
                "description": "",
                "variants": []
            }
    except Exception as e:
        logger.error(f"Generic scrape error: {e}")
        
    return {
        "success": False,
        "marketplace": "Other",
        "url": url,
        "name": "",
        "base_price": 0.0,
        "min_qty": 1,
        "shop_name": "",
        "shop_location": "",
        "image_url": "",
        "variants": [],
        "error_message": "Gagal membaca halaman website"
    }

import logging
from typing import Dict, Any
from .shopee import scrape_shopee
from .tokopedia import scrape_tokopedia
from .generic import scrape_generic

logger = logging.getLogger("bomtrack.scraper")

async def scrape_product_url(url: str) -> Dict[str, Any]:
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    lower_url = url.lower()
    
    # 1. Shopee
    if "shopee.co.id" in lower_url or "shp.ee" in lower_url or "shope.ee" in lower_url:
        logger.info(f"Routing to Shopee scraper: {url}")
        return await scrape_shopee(url)
        
    # 2. Tokopedia
    elif "tokopedia.com" in lower_url or "tokopedia.link" in lower_url:
        logger.info(f"Routing to Tokopedia scraper: {url}")
        return await scrape_tokopedia(url)
        
    # 3. Generic fallback
    else:
        logger.info(f"Routing to Generic scraper: {url}")
        return await scrape_generic(url)

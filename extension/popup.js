document.addEventListener('DOMContentLoaded', async () => {
  const nameEl = document.getElementById('item-name');
  const priceEl = document.getElementById('item-price');
  const qtyEl = document.getElementById('item-qty');
  const shopEl = document.getElementById('shop-name');
  const locEl = document.getElementById('shop-loc');
  const imgEl = document.getElementById('item-img');
  const badgeEl = document.getElementById('marketplace-badge');
  const catSelect = document.getElementById('category-select');
  const notesEl = document.getElementById('item-notes');
  const saveBtn = document.getElementById('btn-save');
  const successMsg = document.getElementById('msg-success');
  const errorMsg = document.getElementById('msg-error');

  let currentUrl = '';
  let currentMarketplace = 'Web';
  let capturedImgUrl = '';
  let activeTabId = null;

  // 1. Fetch available categories from BOMTrack API
  try {
    const res = await fetch('http://bomtrack.test/api/categories');
    if (res.ok) {
      const categories = await res.json();
      if (Array.isArray(categories) && categories.length > 0) {
        catSelect.innerHTML = '';
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          catSelect.appendChild(opt);
        });
      }
    }
  } catch (e) {
    console.log('Using default categories');
  }

  // 2. Query active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  activeTabId = tab.id;
  currentUrl = tab.url || '';

  if (currentUrl.includes('shopee.co.id')) {
    badgeEl.textContent = 'Shopee';
    badgeEl.className = 'badge badge-shopee';
    currentMarketplace = 'Shopee';
  } else if (currentUrl.includes('tokopedia.com')) {
    badgeEl.textContent = 'Tokopedia';
    badgeEl.className = 'badge badge-tokped';
    currentMarketplace = 'Tokopedia';
  } else {
    badgeEl.textContent = 'E-Commerce';
    badgeEl.className = 'badge badge-other';
  }

  // 3. Extract page data in one single unified script execution
  async function extractPageData() {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        func: () => {
          const u = location.href;
          const h = location.host;
          const bodyText = document.body.innerText || '';

          let title = '';
          let shop = '';
          let locationName = '';
          let img = '';
          let price = 0;

          const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

          const EXACT_FORBIDDEN_WORDS = new Set([
            'lompat ke konten utama', 'konten utama', 'lompat', 'skip to main content',
            'smart_byshopee', 'byshopee', 'smart_by', 'shopee_feed',
            'chat sekarang', 'kunjungi toko', 'chat', 'sekarang', 'kunjungi', 'toko',
            'beli sekarang', 'beli', 'keranjang', 'masukkan keranjang', 'tambah ke keranjang',
            'share', 'favorit', 'follow', 'ikuti', 'voucher', 'ongkir', 'garansi', 'proteksi',
            'notifikasi', 'bantuan', 'bahasa', 'download', 'seller centre', 'mulai jual',
            'semua', 'penilaian', 'ulasan', 'terjual', 'komplain', 'rincian', 'spesifikasi',
            'tersedia', 'kuantitas', 'jumlah', 'stok', 'promo', 'hubungi', 'laporkan', 'batal',
            'search', 'cari', 'increase', 'decrease', 'kurangi', 'tambah', 'quantity', 'arrow',
            'slide', 'prev', 'next', 'sebelumnya', 'berikutnya', 'filter', 'close', 'tutup',
            'online', 'aktif', 'star', 'star+', 'official', 'mall', 'persentase', 'bergabung', 'pengikut', 'waktu',
            'persentase chat dibalas', 'waktu chat dibalas', 'aktif beberapa menit lalu', 'shopee', 'tokopedia',
            'mall | ori', 'star seller', 'star+ seller', 'preferred seller', 'garansi shopee', '100% original'
          ]);

          function isForbiddenWord(str) {
            const low = (str || '').toLowerCase().trim();
            if (!low || low.length < 2) return true;
            if (low.startsWith('smart_') || low.includes('byshopee')) return true;
            if (EXACT_FORBIDDEN_WORDS.has(low)) return true;
            if (/^[\d\s.,:;!?%/-]+$/.test(low)) return true;
            return false;
          }

          function cleanTitle(raw) {
            if (!raw) return '';
            let t = raw
              .replace(/^Jual\s+/i, '')
              .replace(/^Promo\s+/i, '')
              .replace(/\s*\|\s*Shopee\s*Indonesia.*$/i, '')
              .replace(/\s*\|\s*Tokopedia.*$/i, '')
              .replace(/\s*\|\s*.*$/, '');

            // Strip leading badges like "Star+", "Star", "Mall", "Shopee Choice", "√", "✓", "[Ready]", etc.
            t = t.replace(/^(?:Star\+?|Mall|Shopee\s+Choice|Prefered\+?|Official\s+Store|Ready|Diskon|Terlaris|√|✓|✔|\s*[-/|]\s*)+\s*/i, '');
            t = t.replace(/^\[(?:PROMO|READY|HOT|NEW|DISCOUNT|MURAH|ORIGINAL|BEST SELLER|READY STOCK)\]\s*/i, '');
            return t.trim();
          }

          // --- EXTRACT IMAGE ---
          const ogImg = document.querySelector('meta[property="og:image"]');
          if (ogImg && ogImg.content) img = ogImg.content;

          if (!img) {
            const shopeeGallery = document.querySelector('div.page-product__gallery, div[class*="product-image"], div._1Tj4r_');
            if (shopeeGallery) {
              const gImg = shopeeGallery.querySelector('picture img, img');
              if (gImg && gImg.src) img = gImg.src;
            }
            const tokpedImg = document.querySelector('[data-testid="PDPMainImage"]');
            if (tokpedImg && tokpedImg.src) img = tokpedImg.src;
          }

          // --- EXTRACT TITLE ---
          const domTitleEl = document.querySelector(
            'div.product-briefing h1, section.page-product h1, [data-testid="lblPDPDetailProductName"], div.WB2y7y, div._44qnta, div.v77fvcf, h1'
          );
          if (domTitleEl) {
            const raw = clean(domTitleEl.innerText || domTitleEl.textContent);
            if (raw && raw.length > 3) {
              title = cleanTitle(raw);
            }
          }

          if (!title) {
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle && ogTitle.content) {
              title = cleanTitle(ogTitle.content);
            }
          }
          if (!title) {
            title = cleanTitle(document.title);
          }

          // --- EXTRACT PRICE ---
          // Priority 0: Exact DevTools selector provided by user & variations
          const exactPriceSelectors = [
            '#sll2-normal-pdp-main > div > div > div > div.container > section > section.flex.flex-auto.SQguX_ > div > div:nth-child(3) > div > section > div > div',
            '#sll2-normal-pdp-main section.SQguX_ div > section > div > div',
            'section.SQguX_ div > section > div > div',
            'section.SQguX_ section div',
            'section.SQguX_ section',
            '#sll2-normal-pdp-main div.pqTWkA, #sll2-normal-pdp-main div.G27Shx, #sll2-normal-pdp-main div.BqC5r2',
            'div.pqTWkA, div.G27Shx, div.BqC5r2, div.AJb90Z, div.V1b81T, div._3n5zSv, div._2v0Hgx, div.pmx7fv',
            '[data-testid="lblPDPDetailProductPrice"]', '[data-testid*="PDPDetailProductPrice"]', '[data-testid="pdpProductPrice"]'
          ];

          for (const sel of exactPriceSelectors) {
            const el = document.querySelector(sel);
            if (el) {
              const txt = (el.innerText || el.textContent || '').trim();
              const m = txt.match(/^Rp\s*([0-9]{1,3}(?:\.[0-9]{3})+)/i) || txt.match(/Rp\s*([0-9]{1,3}(?:\.[0-9]{3})+)/i);
              if (m && !txt.toLowerCase().includes('voucher') && !txt.toLowerCase().includes('ongkir')) {
                const val = parseInt(m[1].replace(/\./g, ''), 10);
                if (val >= 100) {
                  price = val;
                  break;
                }
              }
            }
          }

          // Priority 1: Scan all elements inside product briefing container for largest font-size "Rp" text
          if (!price || price <= 0) {
            const briefing = document.querySelector('section.SQguX_, [class*="SQguX_"], #sll2-normal-pdp-main, section.page-product, .product-briefing, [data-testid="pdpMainComponent"], div.QqPWsG, main') || document.body;
            const priceCandidates = [];
            const allEls = briefing.querySelectorAll('div, span, p, h1, h2, h3, section');

            for (const el of allEls) {
              if (el.children.length > 0 && Array.from(el.children).some(c => (c.innerText || '').includes('Rp'))) {
                continue;
              }
              if (el.closest('del, s, strike')) continue;
              try {
                if (window.getComputedStyle(el).textDecorationLine.includes('line-through')) continue;
              } catch (e) {}

              const txt = (el.innerText || el.textContent || '').trim();
              if (!txt || !txt.includes('Rp')) continue;

              const m = txt.match(/Rp\s*([0-9]{1,3}(?:\.[0-9]{3})+)/i);
              if (m) {
                const low = txt.toLowerCase();
                if (low.includes('voucher') || low.includes('ongkir') || low.includes('cashback') || low.includes('diskon')) {
                  continue;
                }
                const val = parseInt(m[1].replace(/\./g, ''), 10);
                if (val >= 100) {
                  let fontSize = 12;
                  try {
                    fontSize = parseFloat(window.getComputedStyle(el).fontSize) || 12;
                  } catch (e) {}
                  priceCandidates.push({ val, fontSize });
                }
              }
            }

            priceCandidates.sort((a, b) => b.fontSize - a.fontSize);
            if (priceCandidates.length > 0) {
              price = priceCandidates[0].val;
            }
          }

          // --- EXTRACT SHOP NAME & LOCATION ---
          if (h.includes('shopee.co.id')) {
            // Priority 0: JSON-LD Structured Data
            try {
              const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
              for (const s of ldScripts) {
                if (s.textContent) {
                  const data = JSON.parse(s.textContent);
                  const sellerName = data?.offers?.seller?.name || data?.seller?.name || data?.brand?.name;
                  if (sellerName && !isForbiddenWord(sellerName)) {
                    shop = clean(sellerName).replace(/^(?:Mall\s*\|\s*ORI\s*|Star\+?\s*|Shopee\s+Mall\s*)/i, '').trim();
                    if (shop) break;
                  }
                }
              }
            } catch (e) {}

            // Priority 1: Exact Shopee Shop Selector (from DevTools inspection)
            if (!shop) {
              const exactShopSelectors = [
                '#sll2-pdp-product-shop a[href*="shopee.co.id/"]',
                '#sll2-pdp-product-shop a[href^="/"]',
                '#sll2-pdp-product-shop > section > div > div.vzwYi9 > div > div.KBEZs0',
                '#sll2-pdp-product-shop .vzwYi9 .KBEZs0',
                '#sll2-pdp-product-shop .KBEZs0',
                '#sll2-pdp-product-shop a',
                '[id*="pdp-product-shop"] a',
                '[id*="pdp-product-shop"] .KBEZs0',
                '.vzwYi9 .KBEZs0',
                'div.KBEZs0',
                'div.V-75dp',
                'div._3UF2ae',
                'div.f5zY3q'
              ];

              for (const sel of exactShopSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                  let cand = clean(el.innerText || el.textContent);
                  cand = cand.replace(/^(?:Mall\s*\|\s*ORI\s*|Star\+?\s*)/i, '').replace(/●\s*online.*$/i, '').trim();
                  if (cand && cand.length >= 2 && cand.length <= 50 && !isForbiddenWord(cand)) {
                    shop = cand;
                    break;
                  }
                }
              }
            }

            // Priority 2: Proximity to Chat Sekarang / Kunjungi Toko buttons
            if (!shop) {
              const chatButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
                const t = (el.innerText || el.textContent || '').trim().toLowerCase();
                return t === 'chat sekarang' || t === 'kunjungi toko';
              });

              for (const btn of chatButtons) {
                const shopSection = btn.closest('section, div[id*="shop"], div[class*="shop"], div.flex-auto');
                if (shopSection) {
                  const nameCandidates = Array.from(shopSection.querySelectorAll('h1, h2, h3, h4, a, div[class*="name"], div[class*="title"], div'));
                  for (const candEl of nameCandidates) {
                    let txt = clean(candEl.innerText || candEl.textContent);
                    txt = txt.replace(/^(?:Mall\s*\|\s*ORI\s*|Star\+?\s*)/i, '').replace(/●\s*online.*$/i, '').trim();
                    if (txt && txt.length >= 2 && txt.length <= 50 && !txt.includes('\n') && !isForbiddenWord(txt)) {
                      shop = txt;
                      break;
                    }
                  }
                  if (shop) break;
                }
              }
            }

            // Shopee: Location Extraction (Dynamic "Dikirim Dari" row matching)
            const specItems = Array.from(document.querySelectorAll('.c0ztn1, div[class*="c0ztn1"], .product-detail div.flex, .page-product__detail div'));
            for (const item of specItems) {
              const labelEl = item.querySelector('h3.noPqBe, h3, label, span, dt, div:first-child');
              if (labelEl && (labelEl.innerText || labelEl.textContent || '').trim().toLowerCase() === 'dikirim dari') {
                const valEl = labelEl.nextElementSibling || item.querySelector('div:not(:first-child), a') || item.children[1];
                if (valEl && valEl !== labelEl) {
                  const txt = clean(valEl.innerText || valEl.textContent);
                  if (txt && txt.toLowerCase() !== 'dikirim dari') {
                    locationName = txt.replace(/^Dikirim\s+dari\s*/i, '').trim();
                    break;
                  }
                }
              }
            }

            // Priority 1: Search across all H3/label elements on page
            if (!locationName || locationName === 'Indonesia') {
              const allH3s = Array.from(document.querySelectorAll('h3, label, dt, span'));
              const dikirimH3 = allH3s.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === 'dikirim dari');
              if (dikirimH3) {
                const valEl = dikirimH3.nextElementSibling || dikirimH3.parentElement?.querySelector('div:not(:first-child), a');
                if (valEl && valEl !== dikirimH3) {
                  const locText = clean(valEl.innerText || valEl.textContent);
                  if (locText && locText.toLowerCase() !== 'dikirim dari') {
                    locationName = locText.replace(/^Dikirim\s+dari\s*/i, '').trim();
                  }
                }
              }
            }

            // Priority 2: Search in Shipping section text & regex
            if (!locationName || locationName === 'Indonesia') {
              const locMatch = bodyText.match(/Dikirim\s+dari\s+([A-Za-z0-9\s.,-]+?)(?:\s*(?:\n|Ongkos|Jaminan|Garansi|Besok|Reguler|Hemat|Kargo))/i) ||
                               bodyText.match(/Dikirim Dari\s*\n?\s*([^\n\r]+)/i) || 
                               bodyText.match(/Lokasi\s*:\s*([^\n\r]+)/i) ||
                               bodyText.match(/Kota\s+([A-Za-z\s]+)/i);
              if (locMatch && locMatch[1]) {
                const lClean = clean(locMatch[1]).replace(/^Dikirim\s+dari\s*/i, '').trim();
                if (lClean && lClean.length > 2 && lClean.length < 50 && !isForbiddenWord(lClean)) {
                  locationName = lClean;
                }
              }
            }
          } else if (h.includes('tokopedia.com')) {
            // Tokopedia Script & DOM
            try {
              const scriptNext = document.getElementById('__NEXT_DATA__');
              if (scriptNext && scriptNext.textContent) {
                const nextObj = JSON.parse(scriptNext.textContent);
                const pp = nextObj?.props?.pageProps;
                if (pp) {
                  for (const k of Object.keys(pp)) {
                    const val = pp[k];
                    if (val && typeof val === 'object') {
                      const shopObj = val.shop || val.shopInfo;
                      if (shopObj) {
                        if (!shop && shopObj.name) shop = clean(shopObj.name);
                        if (!locationName && (shopObj.location || shopObj.city)) {
                          locationName = clean(shopObj.location || shopObj.city);
                        }
                      }
                    }
                  }
                }
              }
            } catch (e) {}

            // Tokopedia Shop Name DOM
            if (!shop) {
              const sEl = document.querySelector('[data-testid="pdpShopName"], [data-testid="llbPDPFooterShopName"], [data-testid="shop-name"], a[data-testid="shop-name-link"]');
              if (sEl) shop = clean(sEl.innerText);
            }
            // Tokopedia Location DOM
            if (!locationName || locationName === 'Indonesia') {
              const lEl = document.querySelector('[data-testid="pdpShopLocation"], [data-testid="lblPDPFooterShopLocation"], [data-testid="lblPDPDetailProductShipping"]');
              if (lEl) {
                locationName = clean(lEl.innerText).replace(/^Dikirim\s+dari\s*/i, '').trim();
              }
            }
          }

          if (!locationName) locationName = 'Indonesia';

          return { title, shop, locationName, img, price };
        }
      });

      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        
        if (data.title) {
          nameEl.value = data.title.toUpperCase().trim();
          autoSelectCategory(data.title);
        }

        if (data.price > 0) {
          priceEl.value = data.price;
        }

        if (data.shop) shopEl.value = data.shop.toUpperCase().trim();
        if (data.locationName) locEl.value = data.locationName.toUpperCase().trim();
        
        if (data.img) {
          capturedImgUrl = data.img;
          imgEl.src = data.img;
        }
      }
    } catch (err) {
      console.error('Extraction error:', err);
    }
  }

  // Auto select category by keywords in title
  function autoSelectCategory(title) {
    const t = title.toLowerCase();
    let selected = '';

    if (t.includes('esp32') || t.includes('esp8266') || t.includes('arduino') || t.includes('stm32') || t.includes('pico') || t.includes('mikrokontroler') || t.includes(' ic ') || t.includes('dip-') || t.includes('chip')) {
      selected = 'Mikrokontroler & IC';
    } else if (t.includes('sensor') || t.includes('bme280') || t.includes('dht') || t.includes('sonar') || t.includes('ultrasonic') || t.includes('oled') || t.includes('lcd') || t.includes('modul') || t.includes('rtc') || t.includes('rfid')) {
      selected = 'Sensor & Modul';
    } else if (t.includes('baterai') || t.includes('battery') || t.includes('18650') || t.includes('bms') || t.includes('step down') || t.includes('step up') || t.includes('power supply') || t.includes('adaptor') || t.includes('tp4056') || t.includes('lm2596')) {
      selected = 'Baterai & Power';
    } else if (t.includes('motor') || t.includes('servo') || t.includes('stepper') || t.includes('relay') || t.includes('pompa') || t.includes('solenoid') || t.includes('driver')) {
      selected = 'Mekanik & Rangka';
    } else if (t.includes('kabel') || t.includes('jumper') || t.includes('dupont') || t.includes('header pin') || t.includes('terminal block') || t.includes('jack') || t.includes('konektor')) {
      selected = 'Kabel & Konektor';
    } else if (t.includes('baut') || t.includes('spacer') || t.includes('mur') || t.includes('screw') || t.includes('nut') || t.includes('standoff') || t.includes('fastener')) {
      selected = 'Baut & Fastener';
    } else if (t.includes('resistor') || t.includes('kapasitor') || t.includes('elco') || t.includes('breadboard') || t.includes('pcb') || t.includes('led') || t.includes('potensiometer') || t.includes('saklar') || t.includes('switch')) {
      selected = 'Elektronik';
    } else if (t.includes('solder') || t.includes('timah') || t.includes('tang') || t.includes('filamen') || t.includes('pla') || t.includes('tools') || t.includes('minyak') || t.includes('pelumas') || t.includes('botol') || t.includes('heat shrink') || t.includes('isolasi') || t.includes('sablon') || t.includes('screen') || t.includes('monyl') || t.includes('kain') || t.includes('tinta') || t.includes('afdruk')) {
      selected = 'Tools & Aksesoris';
    }

    if (selected) {
      for (let i = 0; i < catSelect.options.length; i++) {
        if (catSelect.options[i].value === selected) {
          catSelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  // Initial extraction
  await extractPageData();

  // 4. Handle Save to BOMTrack
  saveBtn.addEventListener('click', async () => {
    const name = nameEl.value.trim();
    const unitPrice = parseFloat(priceEl.value) || 0;
    const qty = parseInt(qtyEl.value, 10) || 1;
    const shopName = shopEl.value.trim();
    const shopLocation = locEl.value.trim();
    const categoryName = catSelect.value || 'Elektronik';

    if (!name) {
      errorMsg.textContent = 'Nama barang tidak boleh kosong!';
      errorMsg.style.display = 'block';
      return;
    }

    if (unitPrice <= 0) {
      errorMsg.textContent = 'Masukkan harga satuan terlebih dahulu!';
      errorMsg.style.display = 'block';
      return;
    }

    errorMsg.style.display = 'none';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';

    try {
      const payload = {
        project_id: 1,
        name: name,
        variant_name: '',
        category: categoryName,
        unit_price: unitPrice,
        quantity: qty,
        total_price: unitPrice * qty,
        shop_name: (shopName || (currentMarketplace === 'Shopee' ? 'Shopee Seller' : 'Tokopedia Seller')).toUpperCase().trim(),
        shop_location: (shopLocation || 'INDONESIA').toUpperCase().trim(),
        marketplace: currentMarketplace,
        product_url: currentUrl,
        image_url: capturedImgUrl || imgEl.src || '',
        notes: (notesEl ? notesEl.value : '').trim(),
        is_purchased: 0
      };

      const res = await fetch('http://bomtrack.test/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan ke server BOMTrack.');
      }

      successMsg.style.display = 'block';
      saveBtn.textContent = '✅ Berhasil Masuk Database!';

      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (e) {
      errorMsg.textContent = e.message || 'Gagal terhubung ke http://bomtrack.test';
      errorMsg.style.display = 'block';
      saveBtn.disabled = false;
      saveBtn.textContent = '🚀 Simpan ke Database Material';
    }
  });
});

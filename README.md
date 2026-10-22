# BOMTrack — Smart Bill of Materials & Auto Scraper Database ⚡

Web aplikasi database Bill of Materials (BOM) otomatis untuk merancang, mengestimasi biaya proyek, dan melacak komponen dengan fitur **Auto-Scraping Tokopedia & Shopee** secara lokal di domain `http://bomtrack.test`.

---

## 🌟 Fitur Utama

1. **Auto-Detect & E-Commerce Scraper:**
   - Cukup paste link produk dari **Tokopedia** atau **Shopee** (termasuk shortlink `tokopedia.link` atau `shp.ee`).
   - Otomatis mengekstrak: **Nama Barang**, **Harga Satuan**, **Qty Minimum**, **Nama Toko**, **Lokasi Toko**, dan **Varian Produk**.
2. **Dynamic Variant Selector:**
   - Menampilkan seluruh varian produk dengan pilihan tombol chip yang interaktif.
   - Memilih varian otomatis memperbarui nama barang, harga satuan, dan kalkulasi total biaya.
3. **Manajemen Proyek BOM:**
   - Kelola multi-proyek dengan target anggaran (*budget limit indicator*).
4. **Kalkulasi & Rekap Otomatis:**
   - Real-time Subtotal per item ($\text{Harga} \times \text{Qty}$).
   - Status Pembelian (Rencana vs Sudah Dibeli).
   - **Store Grouping View:** Mengelompokkan komponen per toko & lokasi untuk menghemat ongkos kirim (ongkir).
5. **Ekspor Excel (.xlsx):**
   - Download format spreadsheet Bill of Materials resmi dan rapi dengan 1 klik.
6. **Local Domain Integration:**
   - Terintegrasi langsung dengan NGINX reverse proxy di domain lokal: **`http://bomtrack.test`**.
   - Dikelola oleh systemd service background (`bomtrack.service`).

---

## 📁 Struktur Direktori

```text
/home/midpc/Projects/tools/bomtrack/
├── backend/
│   ├── main.py              # FastAPI application & REST endpoints
│   ├── database.py          # SQLite database connection & migrations
│   ├── models.py / schemas  # Pydantic schema validation
│   ├── exporter.py          # Formatted Excel (.xlsx) exporter
│   └── scraper/
│       ├── manager.py       # Scraper router
│       ├── tokopedia.py     # Tokopedia parser engine
│       ├── shopee.py        # Shopee parser engine
│       └── generic.py       # Universal OpenGraph/JSON-LD fallback
├── frontend/                # React + Vite + Tailwind CSS + Lucide Icons
│   ├── src/components/      # UI components (ScraperCard, BomTable, Stats, etc.)
│   └── dist/                # Production build assets
├── data/
│   └── bomtrack.db          # SQLite Database file
├── nginx/
│   └── bomtrack.test.conf   # NGINX configuration
├── run.sh                   # Control & management CLI script
└── bomtrack.service         # Systemd unit service
```

---

## 🚀 Perintah Penggunaan (`./run.sh`)

Di dalam folder proyek `/home/midpc/Projects/tools/bomtrack/`:

* **Cek Status Service:**
  ```bash
  ./run.sh status
  ```
* **Restart Service:**
  ```bash
  ./run.sh restart
  ```
* **Rebuild Frontend & Restart:**
  ```bash
  ./run.sh build
  ```
* **Buka di Browser:**
  ```text
  http://bomtrack.test
  ```

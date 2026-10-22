import React, { useState, useEffect } from "react";
import { Category, ScrapeResult } from "../types";
import { Link2, Sparkles, Plus, ExternalLink, Store, MapPin, Check, AlertCircle, RefreshCw } from "lucide-react";

interface ScraperCardProps {
  categories: Category[];
  onOpenCategoryModal: () => void;
  clippedData: {
    url: string;
    name: string;
    price: number;
    shop: string;
    location: string;
    img: string;
  } | null;
  onItemAdded: () => void;
}

export function ScraperCard({
  categories,
  onOpenCategoryModal,
  clippedData,
  onItemAdded,
}: ScraperCardProps) {
  const [url, setUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [scrapeError, setScrapeError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [qty, setQty] = useState(1);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // If data came from extension / bookmarklet clip URL
  useEffect(() => {
    if (clippedData) {
      setUrl(clippedData.url);
      setScrapeResult({
        success: true,
        url: clippedData.url,
        marketplace: clippedData.url.includes("tokopedia.com") ? "Tokopedia" : "Shopee",
        name: clippedData.name,
        base_price: clippedData.price,
        min_qty: 1,
        shop_name: clippedData.shop,
        shop_location: clippedData.location,
        image_url: clippedData.img,
        variants: [],
      });
      setCustomPrice(clippedData.price);
    }
  }, [clippedData]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsScraping(true);
    setScrapeError("");
    setScrapeResult(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data: ScrapeResult = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error_message || "Gagal mengambil data dari URL ini.");
      }

      setScrapeResult(data);
      setCustomPrice(data.base_price || 0);

      // Auto-categorize based on title
      const t = data.name.toLowerCase();
      let matched = "";
      if (t.includes("esp32") || t.includes("arduino") || t.includes("stm32") || t.includes(" ic ")) {
        matched = "Mikrokontroler & IC";
      } else if (t.includes("sensor") || t.includes("modul") || t.includes("oled") || t.includes("lcd")) {
        matched = "Sensor & Modul";
      } else if (t.includes("motor") || t.includes("servo") || t.includes("bearing") || t.includes("frame")) {
        matched = "Mekanik & Rangka";
      } else if (t.includes("baterai") || t.includes("power") || t.includes("bms") || t.includes("step down")) {
        matched = "Baterai & Power";
      } else if (t.includes("kain") || t.includes("sablon") || t.includes("screen") || t.includes("tinta") || t.includes("tools")) {
        matched = "Tools & Aksesoris";
      }

      if (matched && categories.some((c) => c.name === matched)) {
        setSelectedCategory(matched);
      }
    } catch (err: any) {
      setScrapeError(err.message || "Terjadi kesalahan saat scraping data.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveToBOM = async () => {
    if (!scrapeResult) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        project_id: 1,
        name: scrapeResult.name.toUpperCase().trim(),
        variant_name: "",
        category: selectedCategory || "Elektronik",
        unit_price: customPrice > 0 ? customPrice : scrapeResult.base_price,
        quantity: qty > 0 ? qty : 1,
        total_price: (customPrice > 0 ? customPrice : scrapeResult.base_price) * (qty > 0 ? qty : 1),
        shop_name: (scrapeResult.shop_name || scrapeResult.marketplace).toUpperCase().trim(),
        shop_location: (scrapeResult.shop_location || "INDONESIA").toUpperCase().trim(),
        marketplace: scrapeResult.marketplace,
        product_url: scrapeResult.url,
        image_url: scrapeResult.image_url || "",
        notes: "",
        status: "belum_checkout",
        priority: "medium",
        is_purchased: 0,
      };

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan ke database.");

      setSaveSuccess(true);
      onItemAdded();
      setTimeout(() => {
        setScrapeResult(null);
        setUrl("");
        setSaveSuccess(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan item.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-card mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Auto Scraper E-Commerce (Shopee & Tokopedia)
            </h3>
            <p className="text-[11px] text-slate-500">
              Tempel link produk untuk otomatis mendeteksi nama barang, harga, nama toko, dan lokasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 self-start sm:self-auto">
          <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold border border-orange-200/80">
            Shopee
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80">
            Tokopedia
          </span>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleScrape} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://shopee.co.id/... atau https://tokopedia.com/..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isScraping || !url.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 active:scale-95 shrink-0"
          >
            {isScraping ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scraping Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ambil Data (Scrape)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Feedback */}
      {scrapeError && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold">Gagal Scraping Otomatis</p>
            <p className="text-[11px] text-rose-600 mt-0.5">{scrapeError}</p>
          </div>
        </div>
      )}

      {/* Scrape Result Box */}
      {scrapeResult && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col md:flex-row items-start gap-4">
            {/* Image Preview */}
            <div className="w-20 h-20 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center p-1">
              {scrapeResult.image_url ? (
                <img
                  src={scrapeResult.image_url}
                  alt={scrapeResult.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Store className="w-8 h-8 text-slate-300" />
              )}
            </div>

            {/* Info and Form Fields */}
            <div className="flex-1 space-y-2.5 w-full">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-100 text-blue-800">
                  {scrapeResult.marketplace}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                  {scrapeResult.name}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  {scrapeResult.shop_name || "Toko"}
                </span>
                {scrapeResult.shop_location && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {scrapeResult.shop_location}
                  </span>
                )}
                <a
                  href={scrapeResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Buka Link <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>

              {/* Dynamic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Kuantitas (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Pilih Kategori Material
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <div className="text-xs">
                  <span className="text-slate-500">Total: </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatIDR(customPrice * qty)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToBOM}
                  disabled={isSaving}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl shadow-xs transition-colors ${
                    saveSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Berhasil Ditambahkan!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isSaving ? "Menyimpan..." : "Tambah ke Database BOM"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

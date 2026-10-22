import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./common/Modal";
import { SearchableSelect } from "./common/SearchableSelect";
import { getCategoryBadgeClass } from "./common/Badge";
import { BomItem, Category } from "../types";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit: BomItem | null;
  categories: Category[];
}

export function ItemModal({
  isOpen,
  onClose,
  onSuccess,
  itemToEdit,
  categories,
}: ItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [category, setCategory] = useState("Elektronik");
  const [productUrl, setProductUrl] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setQuantity(itemToEdit.quantity || 1);
      setUnitPrice(itemToEdit.unit_price || 0);
      setCategory(itemToEdit.category || "Elektronik");
      setProductUrl(itemToEdit.product_url || "");
      setShopName(itemToEdit.shop_name || "");
      setShopLocation(itemToEdit.shop_location || "");
      setImageUrl(itemToEdit.image_url || "");
      setNotes(itemToEdit.notes || "");
    } else {
      setName("");
      setQuantity(1);
      setUnitPrice(0);
      setCategory(categories.length > 0 ? categories[0].name : "Elektronik");
      setProductUrl("");
      setShopName("");
      setShopLocation("");
      setImageUrl("");
      setNotes("");
    }
  }, [itemToEdit, isOpen, categories]);

  const numericQty = Number(quantity) || 0;
  const numericPrice = Number(unitPrice) || 0;
  const totalPrice = numericQty * numericPrice;

  const categoryOptions = useMemo(() => {
    return categories.map((c) => ({
      value: c.name,
      label: c.name,
      sublabel: c.description || undefined,
      icon: (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
          style={{ backgroundColor: c.color || "#3b82f6" }}
        />
      ),
    }));
  }, [categories]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || numericQty <= 0) return;

    setIsLoading(true);
    try {
      const payload = {
        project_id: 1,
        name: name.toUpperCase().trim(),
        variant_name: "",
        category: category || "Elektronik",
        unit_price: numericPrice,
        quantity: numericQty,
        total_price: totalPrice,
        shop_name: shopName.toUpperCase().trim(),
        shop_location: shopLocation.toUpperCase().trim(),
        marketplace: productUrl.includes("tokopedia.com")
          ? "Tokopedia"
          : productUrl.includes("shopee.co.id")
          ? "Shopee"
          : "Web",
        product_url: productUrl.trim(),
        image_url: imageUrl.trim(),
        notes: notes.trim(),
        status: "belum_checkout",
        priority: "medium",
        is_purchased: 0,
      };

      const token = localStorage.getItem("bomtrack_token") || "";
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      let res: Response;
      if (itemToEdit) {
        res = await fetch(`/api/items/${itemToEdit.id}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/items", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Gagal menyimpan data material.");

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? "Edit Data Material" : "Tambah Data Material"}
      subtitle="Perbarui data material, jumlah, harga, kategori, link toko, dan catatan"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Nama Barang */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Nama Barang <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: ESP32-WROOM-32D / KAIN SABLON T150"
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900 uppercase transition-all"
          />
        </div>

        {/* 2. Qty, 3. Harga Satuan, 4. Total Harga */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Qty Min
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900 transition-all"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Harga Satuan (Rp)
            </label>
            <input
              type="number"
              min="0"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold text-slate-900 transition-all"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Total
            </label>
            <input
              type="text"
              readOnly
              tabIndex={-1}
              value={formatIDR(totalPrice)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-extrabold text-blue-700 select-none cursor-default"
            />
          </div>
        </div>

        {/* 5. Kategori Material & 6. Link Pembelian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Kategori Material
            </label>
            <SearchableSelect
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="-- Pilih Kategori Material --"
              searchPlaceholder="Cari kategori material..."
              minItemsForSearch={3}
              size="sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Link Pembelian
            </label>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://shopee.co.id/... atau https://tokopedia.com/..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all"
            />
          </div>
        </div>

        {/* 7. Nama Toko & 8. Lokasi Toko */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nama Toko
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Contoh: TIGAISTRI / TOKO ELEKTRONIK"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase text-slate-800 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Lokasi Toko
            </label>
            <input
              type="text"
              value={shopLocation}
              onChange={(e) => setShopLocation(e.target.value)}
              placeholder="Contoh: KAB. BANDUNG / JAKARTA BARAT"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase text-slate-800 transition-all"
            />
          </div>
        </div>

        {/* 9. Catatan Material */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Catatan Material
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan spesifikasi khusus, ukuran/varian, atau catatan kebutuhan..."
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 resize-none transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 active:scale-95"
          >
            <span>{isLoading ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

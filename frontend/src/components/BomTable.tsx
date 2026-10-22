import React, { useState, useMemo, useEffect } from "react";
import { BomItem, Category } from "../types";
import { getCategoryBadgeClass } from "./common/Badge";
import { Pagination } from "./common/Pagination";
import { ConfirmModal } from "./common/ConfirmModal";
import {
  Package,
  Search,
  Edit2,
  Trash2,
  Download,
  ExternalLink,
  ShoppingCart,
  Store,
  ChevronDown,
  ChevronRight,
  FoldHorizontal,
  UnfoldHorizontal,
  Layers,
  MapPin,
} from "lucide-react";

interface BomTableProps {
  items: BomItem[];
  categories: Category[];
  onEditItem: (item: BomItem) => void;
  onDeleteItem: (id: number) => void;
  onUpdateQty: (item: BomItem, newQty: number) => void;
  onOpenCategoryModal: () => void;
  isAdmin?: boolean;
}

export function BomTable({
  items,
  categories,
  onEditItem,
  onDeleteItem,
  onUpdateQty,
  onOpenCategoryModal,
  isAdmin = true,
}: BomTableProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"category" | "store">("category");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [itemToDelete, setItemToDelete] = useState<BomItem | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        q === "" ||
        item.name.toLowerCase().includes(q) ||
        (item.shop_name && item.shop_name.toLowerCase().includes(q)) ||
        (item.shop_location && item.shop_location.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.product_url && item.product_url.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [items, debouncedSearch, selectedCategory]);

  // Auto-reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, viewMode]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Group items by category / store for Tree Table structure
  const groupedCategories = useMemo(() => {
    if (viewMode === "store") {
      const storeMap: Record<string, { category: { id: string; name: string; color: string; description?: string }; items: BomItem[] }> = {};
      paginatedItems.forEach((item) => {
        const storeKey = (item.shop_name || "TOKO LAINNYA").toUpperCase().trim();
        if (!storeMap[storeKey]) {
          storeMap[storeKey] = {
            category: {
              id: storeKey,
              name: storeKey,
              color: "blue",
              description: item.shop_location ? `Lokasi: ${item.shop_location}` : "Toko E-Commerce",
            },
            items: [],
          };
        }
        storeMap[storeKey].items.push(item);
      });
      return Object.values(storeMap);
    }

    // Default: Group by Category
    const groups: Record<
      string,
      { category: { id: string; name: string; color: string; description?: string }; items: BomItem[] }
    > = {};

    categories.forEach((cat) => {
      groups[cat.name] = {
        category: {
          id: String(cat.id || cat.name),
          name: cat.name,
          color: cat.color || "blue",
          description: cat.description || "",
        },
        items: [],
      };
    });

    paginatedItems.forEach((item) => {
      const catName = item.category || "Lainnya";
      if (!groups[catName]) {
        groups[catName] = {
          category: {
            id: catName,
            name: catName,
            color: "slate",
            description: "",
          },
          items: [],
        };
      }
      groups[catName].items.push(item);
    });

    return Object.values(groups).filter((g) => g.items.length > 0);
  }, [paginatedItems, categories, viewMode]);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    groupedCategories.forEach((g) => {
      allCollapsed[g.category.id] = true;
    });
    setCollapsedCategories(allCollapsed);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = [
      "Kategori",
      "Nama Material",
      "Nama Toko",
      "Lokasi Toko",
      "Qty Min",
      "Harga Satuan",
      "Link Pembelian",
      "Catatan",
    ];

    const rows = items.map((item) => [
      `"${(item.category || "Lainnya").replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.shop_name || "").replace(/"/g, '""')}"`,
      `"${(item.shop_location || "").replace(/"/g, '""')}"`,
      item.quantity || 1,
      item.unit_price,
      `"${(item.product_url || "").replace(/"/g, '""')}"`,
      `"${(item.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Database_Material_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar: Search, Category Filter, View Mode, CSV */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari material, toko, lokasi, catatan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none font-semibold cursor-pointer"
          >
            <option value="all">Semua Kategori Material</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Group View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("category")}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                viewMode === "category"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Kategori
            </button>
            <button
              type="button"
              onClick={() => setViewMode("store")}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                viewMode === "store"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Per Toko
            </button>
          </div>

          {/* Expand/Collapse All Buttons */}
          <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={expandAll}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs"
              title="Buka Semua Kategori"
            >
              <UnfoldHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs"
              title="Tutup Semua Kategori"
            >
              <FoldHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Master Kategori */}
          <button
            type="button"
            onClick={onOpenCategoryModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Master Kategori</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Unduh seluruh rekap daftar material ke format CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 1 SINGLE CARD: Material Database Tree Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className={`py-3 px-3 sm:px-4 ${isAdmin ? "w-[44%]" : "w-[48%]"}`}>Kategori & Nama Material</th>
                <th className={`py-3 px-2 sm:px-3 ${isAdmin ? "w-[24%]" : "w-[24%]"}`}>Nama Toko & Lokasi</th>
                <th className="py-3 px-2 text-center w-[10%]">Qty Min</th>
                <th className="py-3 px-2 sm:px-3 text-right w-[14%]">Harga Satuan</th>
                <th className="py-3 px-2 text-center w-[4%]">Toko</th>
                {isAdmin && <th className="py-3 px-2 sm:px-3 text-center w-[4%]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {groupedCategories.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center space-y-2">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      Belum ada material yang tersimpan di database.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Gunakan ekstensi <strong>BOMTrack Clipper</strong> di browser untuk menyimpan material dari Shopee atau Tokopedia.
                    </p>
                  </td>
                </tr>
              ) : (
                groupedCategories.map((group) => {
                  const cat = group.category;
                  const isCollapsed = collapsedCategories[cat.id];
                  const groupItems = group.items;

                  return (
                    <React.Fragment key={cat.id}>
                      {/* Category Header Row (Parent Tree Node without Subtotal) */}
                      <tr
                        onClick={() => toggleCategoryCollapse(cat.id)}
                        className="bg-slate-100/80 hover:bg-slate-200/60 border-y border-slate-200/90 cursor-pointer select-none transition-colors"
                      >
                        <td colSpan={isAdmin ? 6 : 5} className="py-2.5 px-3 sm:px-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              className="text-slate-500 hover:text-slate-700 transition-transform"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold border tracking-wider uppercase shrink-0 ${getCategoryBadgeClass(
                                cat.color
                              )}`}
                            >
                              {cat.name}
                            </span>

                            <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/90 shadow-2xs">
                              {groupItems.length} Item
                            </span>

                            {cat.description && (
                              <span className="text-[11px] text-slate-500 truncate hidden md:inline font-normal">
                                · {cat.description}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Child Items Rows */}
                      {!isCollapsed &&
                        groupItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-blue-50/30 transition-colors bg-white group"
                          >
                            {/* 1. Nama Material with Tree Branch Connector */}
                            <td className="py-3 px-3 sm:px-4">
                              <div className="flex items-start gap-2.5 pl-4 sm:pl-6">
                                <span className="text-slate-300 group-hover:text-blue-500 font-mono text-xs select-none mt-0.5 shrink-0">
                                  ↳
                                </span>

                                {item.image_url && (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                                  />
                                )}

                                <div>
                                  <div className="font-bold text-slate-900 leading-snug break-words">
                                    {item.name}
                                  </div>
                                  {item.notes && (
                                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                      {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. Nama Toko & Lokasi */}
                            <td className="py-3 px-2 sm:px-3">
                              {item.shop_name ? (
                                <div className="text-slate-700 font-medium">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[170px] font-bold text-slate-800" title={item.shop_name}>
                                      {item.shop_name}
                                    </span>
                                  </div>
                                  {item.shop_location && (
                                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{item.shop_location}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs italic">-</span>
                              )}
                            </td>

                            {/* 3. Min Qty Stepper */}
                            <td className="py-3 px-2 text-center whitespace-nowrap">
                              {isAdmin ? (
                                <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQty(item, Math.max(1, item.quantity - 1))}
                                    className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors text-xs font-bold"
                                    title="Kurangi Qty Min"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-slate-800 text-xs px-1.5 min-w-[20px]">
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQty(item, (item.quantity || 1) + 1)}
                                    className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors text-xs font-bold"
                                    title="Tambah Qty Min"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs">
                                  {item.quantity || 1}
                                </span>
                              )}
                            </td>

                            {/* 4. Harga Satuan */}
                            <td className="py-3 px-2 sm:px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                              {formatIDR(item.unit_price)}
                            </td>

                            {/* 5. Link Toko */}
                            <td className="py-3 px-2 text-center whitespace-nowrap">
                              {item.product_url ? (
                                <a
                                  href={
                                    item.product_url.startsWith("http")
                                      ? item.product_url
                                      : `https://${item.product_url}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center p-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors shadow-2xs"
                                  title={`Buka Link Pembelian (${item.shop_name || "Toko"})`}
                                >
                                  <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                                  <ExternalLink className="w-2.5 h-2.5 text-blue-500 ml-0.5" />
                                </a>
                              ) : (
                                <span className="text-slate-300 text-xs italic">-</span>
                              )}
                            </td>

                            {/* 6. Aksi (Edit & Delete) */}
                            {isAdmin && (
                              <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onEditItem(item)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Material"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setItemToDelete(item)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Material"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[15, 30, 50, 100]}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Hapus Material"
        message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.name}" dari database material? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Material"
        isDanger={true}
        onConfirm={() => {
          if (itemToDelete) {
            onDeleteItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}

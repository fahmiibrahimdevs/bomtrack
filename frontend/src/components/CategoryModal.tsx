import React, { useState, useMemo, useEffect } from "react";
import { Modal } from "./common/Modal";
import { Pagination } from "./common/Pagination";
import { Category } from "../types";
import { getCategoryBadgeClass } from "./common/Badge";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Search, 
  FolderPlus,
  Layers,
  RotateCcw
} from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
  onRefreshItems: () => void;
  isAdmin?: boolean;
}

const COLOR_OPTIONS = [
  { id: "#3b82f6", name: "Biru", bgClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "#f59e0b", name: "Amber", bgClass: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "#ef4444", name: "Merah", bgClass: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "#10b981", name: "Hijau", bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "#8b5cf6", name: "Ungu", bgClass: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "#06b6d4", name: "Toska", bgClass: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "#64748b", name: "Abu-abu", bgClass: "bg-slate-50 text-slate-700 border-slate-200" },
];

export function CategoryModal({
  isOpen,
  onClose,
  categories,
  onRefreshCategories,
  onRefreshItems,
  isAdmin = true,
}: CategoryModalProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [description, setDescription] = useState("");
  const [isAdding, setIsAdding] = useState(isAdmin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Otomatis buka form tambah kategori saat modal Master Kategori pertama kali dibuka jika Admin
  useEffect(() => {
    if (isOpen) {
      if (isAdmin) {
        handleStartAdd();
      } else {
        setIsAdding(false);
        setEditingCategory(null);
      }
      setSearch("");
      setCurrentPage(1);
    }
  }, [isOpen, isAdmin]);

  const handleStartAdd = () => {
    setEditingCategory(null);
    setName("");
    setColor("#3b82f6");
    setDescription("");
    setIsAdding(true);
    setError("");
  };

  const handleStartEdit = (cat: Category) => {
    setIsAdding(false);
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color || "#3b82f6");
    setDescription(cat.description || "");
    setError("");
  };

  const handleCancelForm = () => {
    if (editingCategory) {
      handleStartAdd();
    } else {
      setIsAdding(false);
      setEditingCategory(null);
      setError("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    const token = localStorage.getItem("bomtrack_token") || "";
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      if (editingCategory) {
        // Update
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ 
            name: name.toUpperCase().trim(), 
            color, 
            description: description.trim() 
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.detail || "Gagal mengupdate kategori.");
        }
      } else {
        // Create
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ 
            name: name.toUpperCase().trim(), 
            color, 
            description: description.trim() 
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.detail || "Gagal membuat kategori.");
        }
      }

      onRefreshCategories();
      onRefreshItems();
      handleStartAdd();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan kategori.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Hapus kategori "${cat.name}"? Barang di kategori ini akan dipindahkan ke "Lainnya".`)) {
      return;
    }

    try {
      const token = localStorage.getItem("bomtrack_token") || "";
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal menghapus kategori.");
      onRefreshCategories();
      onRefreshItems();
      if (editingCategory?.id === cat.id) {
        handleStartAdd();
      }
    } catch (err: any) {
      alert(err.message || "Gagal menghapus kategori.");
    }
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Paginated categories slice
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const isFormActive = isAdmin && (isAdding || editingCategory !== null);

  // 🚀 Companion Floating Window Side Panel (Form Tambah / Edit Kategori)
  const categoryFormSidePanel = isFormActive ? (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
            {editingCategory ? <Edit2 className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {editingCategory ? "Edit Master Kategori" : "Tambah Master Kategori"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {editingCategory ? "Perbarui informasi kategori material" : "Input kategori material baru"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCancelForm}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
          title="Tutup Form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Form */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Nama Kategori */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: SENSOR & MODUL"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-900 uppercase transition-all"
            />
          </div>

          {/* Pilihan Warna Badge */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Pilihan Warna Badge
            </label>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "ring-2 ring-blue-500/30 border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: c.id }}
                    />
                    <span className="text-slate-800 text-[11px] font-medium">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Deskripsi / Keterangan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan ringkas jenis material pada kategori ini..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 resize-none transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
          {editingCategory ? (
            <button
              type="button"
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Beralih ke form tambah kategori baru"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Tambah</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">
              Form siap diisi
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? "Menyimpan..." : editingCategory ? "Simpan Perubahan" : "Simpan Kategori"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  ) : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Master Kategori"
      subtitle="Kelola master kategori untuk klasifikasi kebutuhan material"
      maxWidth="5xl"
      sidePanel={categoryFormSidePanel}
    >
      <div className="space-y-3.5">
        {/* Top Action & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama kategori atau deskripsi..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin ? (
              <button
                type="button"
                onClick={handleStartAdd}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer ${
                  isAdding && !editingCategory
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold">
                <span>Read Only</span>
              </div>
            )}
          </div>
        </div>

        {/* Active State Bar if editing */}
        {isAdmin && editingCategory && (
          <div className="flex items-center justify-end text-xs px-1">
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 animate-in fade-in">
              Sedang mengedit: {editingCategory.name}
            </span>
          </div>
        )}

        {/* Master Categories Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-slate-50/95 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center whitespace-nowrap">No</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Nama Kategori</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Material</th>
                  <th className="py-3 px-3.5 w-full">Deskripsi / Keterangan</th>
                  {isAdmin && <th className="py-3 px-3.5 w-20 text-center whitespace-nowrap">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="py-12 text-center text-slate-400 text-xs">
                      {search ? (
                        <span>Tidak ada kategori yang cocok dengan pencarian &quot;{search}&quot;.</span>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-700">Belum Ada Master Kategori</p>
                          <p className="text-[11px] text-slate-400">Gunakan form di samping kanan untuk menambahkan kategori baru.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((cat, idx) => {
                    const isBeingEdited = editingCategory?.id === cat.id;
                    const itemNumber = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={cat.id}
                        className={`transition-colors ${
                          isBeingEdited
                            ? "bg-blue-50/80 font-medium"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* No */}
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400 text-xs whitespace-nowrap">
                          {itemNumber}
                        </td>

                        {/* Nama Kategori */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold border tracking-wider uppercase inline-flex items-center whitespace-nowrap shadow-2xs ${getCategoryBadgeClass(
                              cat.color
                            )}`}
                          >
                            {cat.name}
                          </span>
                        </td>

                        {/* Jumlah Item */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md whitespace-nowrap inline-block">
                            {cat.item_count || 0} Item
                          </span>
                        </td>

                        {/* Deskripsi */}
                        <td className="py-3 px-3.5">
                          {cat.description ? (
                            <span className="text-xs text-slate-600 font-medium leading-relaxed">
                              {cat.description}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* Aksi */}
                        {isAdmin && (
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(cat)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isBeingEdited
                                    ? "text-blue-700 bg-blue-100"
                                    : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                }`}
                                title="Edit Kategori"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cat)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Kategori"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination & Show Entries Footer */}
        {filteredCategories.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredCategories.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </div>
    </Modal>
  );
}

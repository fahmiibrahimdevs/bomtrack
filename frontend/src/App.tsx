import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { BomTable } from "./components/BomTable";
import { CategoryModal } from "./components/CategoryModal";
import { ItemModal } from "./components/ItemModal";
import { LoginPage } from "./components/LoginPage";
import { Category, BomItem, AuthUser } from "./types";

export function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("bomtrack_token"));
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("bomtrack_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<BomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<BomItem | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
    localStorage.removeItem("bomtrack_token");
    localStorage.removeItem("bomtrack_user");
    setToken(null);
    setCurrentUser(null);
  }, [token]);

  const handleLoginSuccess = (user: AuthUser, userToken: string) => {
    localStorage.setItem("bomtrack_token", userToken);
    localStorage.setItem("bomtrack_user", JSON.stringify(user));
    setToken(userToken);
    setCurrentUser(user);
  };

  // Load categories
  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data: Category[] = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, [token, handleLogout]);

  // Load items
  const fetchItems = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/items", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data: BomItem[] = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchItems();
    }
  }, [token, fetchCategories, fetchItems]);

  const handleRefreshAll = () => {
    fetchCategories();
    fetchItems();
  };

  // Quick update quantity (Admin only)
  const handleUpdateQty = async (item: BomItem, newQty: number) => {
    if (!isAdmin || !token) {
      alert("Hanya Administrator yang memiliki akses untuk mengubah data material.");
      return;
    }

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: newQty,
          total_price: item.unit_price * newQty,
        }),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  // Delete item (Admin only)
  const handleDeleteItem = async (id: number) => {
    if (!isAdmin || !token) {
      alert("Hanya Administrator yang memiliki akses untuk menghapus material.");
      return;
    }

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        fetchItems();
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/export/excel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error("Gagal mendownload file Excel.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Database_Material_${new Date().toISOString().slice(0, 10)}.xlsx`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Gagal mengekspor file Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // If not logged in, render Login Page
  if (!token || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f6f9]">
      {/* Top Navigation */}
      <Header
        onRefresh={handleRefreshAll}
        onOpenCategoryModal={() => setCategoryModalOpen(true)}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main App Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Real-time Material Stats Cards */}
        <StatsCards items={items} categories={categories} />

        {/* Master Material Database Tree Table */}
        <BomTable
          items={items}
          categories={categories}
          isAdmin={isAdmin}
          onEditItem={(item) => {
            if (!isAdmin) return;
            setItemToEdit(item);
            setItemModalOpen(true);
          }}
          onDeleteItem={handleDeleteItem}
          onUpdateQty={handleUpdateQty}
          onOpenCategoryModal={() => setCategoryModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              BOMTrack Active on <code className="text-blue-600 font-semibold font-mono">http://bomtrack.test</code>
            </span>
          </div>
          <div>
            <span>Database Master Material & Komponen • Shopee & Tokopedia Clipper</span>
          </div>
        </div>
      </footer>

      {/* Category Management Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onRefreshCategories={fetchCategories}
        onRefreshItems={fetchItems}
        isAdmin={isAdmin}
      />

      {/* Item Modal (Edit Only - Admin Only) */}
      {isAdmin && (
        <ItemModal
          isOpen={itemModalOpen}
          onClose={() => {
            setItemModalOpen(false);
            setItemToEdit(null);
          }}
          onSuccess={() => {
            fetchCategories();
            fetchItems();
          }}
          itemToEdit={itemToEdit}
          categories={categories}
        />
      )}
    </div>
  );
}

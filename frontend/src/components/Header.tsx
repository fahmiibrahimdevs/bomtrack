import React from "react";
import { Package, Layers, FileSpreadsheet, RefreshCw, LogOut, Shield, User } from "lucide-react";
import { AuthUser } from "../types";

interface HeaderProps {
  onRefresh: () => void;
  onOpenCategoryModal: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export function Header({
  onRefresh,
  onOpenCategoryModal,
  onExportExcel,
  isExporting,
  currentUser,
  onLogout,
}: HeaderProps) {
  const isAdmin = currentUser?.role === "admin";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                BOMTrack
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 uppercase tracking-wider">
                Database Material
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Database Master Komponen & Material E-Commerce
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* User Role Badge */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div
                className={`w-2 h-2 rounded-full ${
                  isAdmin ? "bg-blue-600" : "bg-amber-500"
                }`}
              />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {currentUser.full_name || currentUser.username}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    isAdmin ? "text-blue-600" : "text-amber-600"
                  }`}
                >
                  {isAdmin ? "Admin (CRUD)" : "User (Read Only)"}
                </span>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            title="Muat ulang database material"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 bg-white shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Master Kategori */}
          <button
            type="button"
            onClick={onOpenCategoryModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Master Kategori</span>
            {!isAdmin && (
              <span className="text-[9px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.2 rounded border border-slate-200">
                Lihat
              </span>
            )}
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{isExporting ? "Mengunduh..." : "Export Excel"}</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            title="Keluar dari sesi"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

import React from "react";
import { BomItem, Category } from "../types";
import { Package, Layers, Store, MapPin } from "lucide-react";

interface StatsCardsProps {
  items: BomItem[];
  categories: Category[];
}

export function StatsCards({ items, categories }: StatsCardsProps) {
  const totalItems = items.length;

  const uniqueStores = new Set(
    items
      .map((it) => (it.shop_name || "").trim().toUpperCase())
      .filter((s) => s.length > 0)
  );

  const uniqueLocations = new Set(
    items
      .map((it) => (it.shop_location || "").trim().toUpperCase())
      .filter((l) => l.length > 0 && l !== "INDONESIA")
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
      {/* 1. Total Jenis Material (🔵 Blue) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-card flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold flex items-center gap-1.5 text-blue-700">
            <Package className="w-4 h-4 text-blue-600" />
            Total Material
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
            {totalItems} Item
          </span>
        </div>
        <div className="text-xl font-extrabold text-slate-900 tracking-tight">
          {totalItems} Komponen
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Material terdaftar di database
        </div>
      </div>

      {/* 2. Total Kategori Material (🟣 Purple) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-card flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold flex items-center gap-1.5 text-purple-700">
            <Layers className="w-4 h-4 text-purple-600" />
            Kategori Material
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
            {categories.length} Kategori
          </span>
        </div>
        <div className="text-xl font-extrabold text-slate-900 tracking-tight">
          {categories.length} Kategori
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Grup klasifikasi komponen
        </div>
      </div>

      {/* 3. Total Toko / Supplier (🟠 Amber) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-card flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold flex items-center gap-1.5 text-amber-700">
            <Store className="w-4 h-4 text-amber-600" />
            Toko / Supplier
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            {uniqueStores.size} Toko
          </span>
        </div>
        <div className="text-xl font-extrabold text-slate-900 tracking-tight">
          {uniqueStores.size} Toko
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Vendor & supplier terdata
        </div>
      </div>

      {/* 4. Sebaran Lokasi Toko (🟢 Emerald) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-card flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold flex items-center gap-1.5 text-emerald-700">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Sebaran Lokasi
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            {uniqueLocations.size} Kota
          </span>
        </div>
        <div className="text-xl font-extrabold text-slate-900 tracking-tight">
          {uniqueLocations.size} Kota / Wilayah
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Asal pengiriman material
        </div>
      </div>
    </div>
  );
}

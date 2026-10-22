import React from "react";
import { BOMStatus, BOMPriority } from "../../types";
import { CheckCircle2, Clock, XCircle, Ban } from "lucide-react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

export function Badge({ children, variant = "default", size = "sm", className = "", title }: BadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs font-medium" : "px-2.5 py-1 text-xs font-semibold";

  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border border-slate-200/80",
    primary: "bg-blue-50 text-blue-700 border border-blue-200/80",
    secondary: "bg-slate-50 text-slate-600 border border-slate-200/60",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/80",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/80",
    info: "bg-cyan-50 text-cyan-700 border border-cyan-200/80",
    purple: "bg-purple-50 text-purple-700 border border-purple-200/80",
  }[variant];

  return (
    <span title={title} className={`inline-flex items-center gap-1.5 rounded-md ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}

export function BOMPriorityBadge({ priority }: { priority: BOMPriority }) {
  switch (priority) {
    case "high":
      return (
        <Badge variant="danger" title="Prioritas Pengadaan: Tinggi">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Tinggi
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="warning" title="Prioritas Pengadaan: Sedang">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Sedang
        </Badge>
      );
    case "low":
    default:
      return (
        <Badge variant="secondary" title="Prioritas Pengadaan: Rendah">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Rendah
        </Badge>
      );
  }
}

export function BOMStatusBadge({ status }: { status: BOMStatus }) {
  switch (status) {
    case "sudah_checkout":
      return (
        <span 
          title="Status Pembelian: Barang sudah dicheckout / dibeli"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Sudah Checkout
        </span>
      );
    case "ditolak":
      return (
        <span 
          title="Status Pembelian: Permintaan pengadaan ditolak"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Ditolak
        </span>
      );
    case "dibatalkan":
      return (
        <span 
          title="Status Pembelian: Pengadaan dibatalkan"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-600 border border-slate-200"
        >
          <Ban className="w-3.5 h-3.5 text-slate-400" />
          Dibatalkan
        </span>
      );
    case "belum_checkout":
    default:
      return (
        <span 
          title="Status Pembelian: Belum dicheckout, menunggu proses pembelian"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Belum Checkout
        </span>
      );
  }
}

export function getCategoryBadgeClass(color?: string) {
  switch (color) {
    case "blue":
    case "#3b82f6":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "amber":
    case "#f59e0b":
    case "#eab308":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "rose":
    case "#f43f5e":
    case "#ef4444":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "emerald":
    case "#10b981":
    case "#059669":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "purple":
    case "#8b5cf6":
    case "#a855f7":
    case "#6366f1":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "teal":
    case "#06b6d4":
    case "#14b8a6":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "slate":
    case "#64748b":
    case "#94a3b8":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

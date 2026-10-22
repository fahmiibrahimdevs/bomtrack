import React from 'react';
import { Store, MapPin, ExternalLink, Package, CheckCircle2 } from 'lucide-react';
import { BomItem } from '../types';

interface StoreGroupViewProps {
  items: BomItem[];
}

export const StoreGroupView: React.FC<StoreGroupViewProps> = ({ items }) => {
  // Group items by shop_name
  const grouped = items.reduce((acc, item) => {
    const key = item.shop_name.trim() || 'Toko Lainnya';
    if (!acc[key]) {
      acc[key] = {
        shopName: key,
        location: item.shop_location || 'Indonesia',
        marketplace: item.marketplace || 'Web',
        items: [],
        subtotal: 0,
        totalQty: 0
      };
    }
    acc[key].items.push(item);
    acc[key].subtotal += item.total_price;
    acc[key].totalQty += item.quantity;
    return acc;
  }, {} as Record<string, { shopName: string; location: string; marketplace: string; items: BomItem[]; subtotal: number; totalQty: number }>);

  const groups = Object.values(grouped).sort((a, b) => b.subtotal - a.subtotal);

  if (groups.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center text-slate-500 text-xs">
        Belum ada item untuk dikelompokkan berdasarkan toko.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map((group, idx) => (
        <div key={idx} className="glass-panel p-4 rounded-xl flex flex-col justify-between space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-amber-400 shrink-0" />
                <h4 className="text-sm font-bold text-white">{group.shopName}</h4>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  {group.location}
                </span>
                <span>•</span>
                <span className="text-indigo-400">{group.marketplace}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Subtotal Toko:</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                Rp {group.subtotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Item List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 text-xs transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.is_purchased === 1 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="text-slate-200 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {item.quantity}x
                  </span>
                  <span className="font-mono font-medium text-white text-[11px]">
                    Rp {item.total_price.toLocaleString('id-ID')}
                  </span>
                  {item.product_url && (
                    <a
                      href={item.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300"
                      title="Buka Link Produk"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Summary */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{group.items.length} jenis item ({group.totalQty} pcs)</span>
            <span className="text-indigo-400 font-medium">1x Ongkos Kirim</span>
          </div>
        </div>
      ))}
    </div>
  );
};

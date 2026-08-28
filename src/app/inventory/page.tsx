"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { Package, Droplets, PlusCircle, CheckCircle2, AlertCircle, Coins, PieChart } from "lucide-react";

const FOOD_SPECS = [
  {
    type: "FLAKES",
    name: "Tropical Flake Pack",
    packSize: 30,
    price: 5,
    icon: "🥣",
    desc: "Lightweight floating flakes for Goldfish, Neon Tetras, Guppies, Danios, and Gouramis.",
    speciesList: "Goldfish, Neon Tetra, Guppy, Zebra Danio, Dwarf Gourami, Black Molly",
  },
  {
    type: "PELLETS",
    name: "High-Protein Pellets",
    packSize: 25,
    price: 8,
    icon: "🟤",
    desc: "Slow-sinking nutrient rich formula for Bettas, Angelfish, Discus, Oscars, and Grammas.",
    speciesList: "Betta, Angelfish, Discus, Tiger Oscar, Royal Gramma",
  },
  {
    type: "LIVE",
    name: "Live Pods & Bloodworms",
    packSize: 15,
    price: 12,
    icon: "🪱",
    desc: "Active live organisms essential for Red-Bellied Piranhas, Lionfish, Mandarinfish, Catfish, and Knifefish.",
    speciesList: "Piranha, Red Lionfish, Mandarinfish, Mudskipper, Archerfish, Redtail Catfish, Knifefish",
  },
  {
    type: "ALGAE",
    name: "Spirulina Algae Wafers",
    packSize: 25,
    price: 6,
    icon: "🟢",
    desc: "Vegetable and macroalgae sinking discs formulated for surgeonfish and marine grazers.",
    speciesList: "Yellow Tang, Regal Blue Tang",
  },
];

export default function InventoryPage() {
  const { user, inventory, refreshGameData } = useGame();
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleBuy = async (foodType: string) => {
    setBuying(foodType);
    setMsg(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed to buy food.");
      } else {
        setMsg(data.message);
        await refreshGameData();
      }
    } catch {
      setMsg("Network error occurred.");
    } finally {
      setBuying(null);
    }
  };

  const getItemData = (type: string) => {
    const item = inventory.find((i) => i.foodType === type);
    const qty = item ? item.quantity : 0;
    const maxQty = item?.maxQuantity || (FOOD_SPECS.find((s) => s.type === type)?.packSize || 25);
    const percentage = item?.percentage !== undefined ? item.percentage : Math.min(100, Math.round((qty / maxQty) * 100));
    return { qty, maxQty, percentage };
  };

  const totalFoodQuantity = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalFoodMax = inventory.reduce((sum, i) => sum + (i.maxQuantity || 25), 0) || 100;
  const overallPercent = Math.min(100, Math.round((totalFoodQuantity / totalFoodMax) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-400" />
            <span>Nutritional Feeds & Food Stock</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor food balance indicators, remaining percentage, and restock rations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <span>Total Supply: {overallPercent}% ({totalFoodQuantity} servings)</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{user?.cpBalance.toLocaleString() || 0} CP Balance</span>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mb-6 p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Grid of Food Types with Balance Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {FOOD_SPECS.map((food) => {
          const { qty, maxQty, percentage } = getItemData(food.type);
          const isLow = percentage <= 20;

          return (
            <div
              key={food.type}
              className={`rounded-3xl glass-panel p-6 border flex flex-col justify-between shadow-xl transition-all ${
                isLow ? "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]" : "border-cyan-500/25"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{food.icon}</div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">{food.name}</h3>
                      <span className="text-[11px] text-cyan-300 font-medium">
                        {food.type.toLowerCase()} feed
                      </span>
                    </div>
                  </div>

                  {/* Stock counter */}
                  <div className="text-right">
                    <div
                      className={`text-2xl font-black ${
                        percentage === 0
                          ? "text-rose-400"
                          : percentage <= 25
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {percentage}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">
                      Remaining
                    </div>
                  </div>
                </div>

                {/* Balance Food Present Progress Gauge */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-cyan-500/20 mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Food Balance Present:</span>
                    <span className="font-black text-white">
                      {qty} / {maxQty} feedings ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        percentage > 60
                          ? "bg-emerald-400"
                          : percentage > 20
                          ? "bg-amber-400"
                          : "bg-rose-500 animate-pulse"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{food.desc}</p>

                <div className="p-3 rounded-2xl bg-slate-950/50 border border-cyan-500/10 text-[11px] text-slate-300 space-y-1 mb-4">
                  <div className="text-slate-400 font-semibold">Suitable For:</div>
                  <div className="text-cyan-200">{food.speciesList}</div>
                </div>
              </div>

              {/* Purchase pack footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400">Pack Price (+{food.packSize} feedings):</div>
                  <div className="text-sm font-black text-amber-300">{food.price} CP</div>
                </div>

                <button
                  onClick={() => handleBuy(food.type)}
                  disabled={buying === food.type || (user ? user.cpBalance < food.price : true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 font-bold text-xs text-white shadow-md transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{buying === food.type ? "Buying..." : `Buy +${food.packSize} Pack`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

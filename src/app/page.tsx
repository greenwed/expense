"use client";

import React, { useState, useRef } from "react";
import { useGame } from "@/context/GameContext";
import AquariumCanvas, { AquariumCanvasHandle } from "@/components/AquariumCanvas";
import TankControls from "@/components/TankControls";
import FishDetailModal from "@/components/FishDetailModal";
import NewTankModal from "@/components/NewTankModal";
import {
  Waves,
  Coins,
  AlertTriangle,
  PlusCircle,
  Droplets,
  Store,
  HeartHandshake,
  ShoppingBag,
  Package,
  Activity,
  Heart,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  formatAge,
  getRarityBadgeColor,
  getHealthColor,
  getHungerColor,
  getWaterTypeColor,
  calculateNextFeedingTime,
  formatTimeAgo,
} from "@/lib/utils";
import { FishData } from "@/lib/types";

export default function DashboardPage() {
  const {
    user,
    loading,
    tanks,
    selectedTankId,
    selectedTank,
    setSelectedTankId,
    selectedFishForModal,
    setSelectedFishForModal,
    feedFish,
    inventory,
  } = useGame();

  const canvasHandleRef = useRef<AquariumCanvasHandle | null>(null);
  const [isNewTankModalOpen, setIsNewTankModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <p className="text-cyan-200 text-sm font-semibold animate-pulse">
          Simulating real-time aquarium ecosystem...
        </p>
      </div>
    );
  }

  // Calculate danger states across all tanks
  const dangerFish = tanks.flatMap((t) => t.fish).filter((f) => f.hunger < 20 || f.health < 30);
  const dirtyTanks = tanks.filter((t) => t.cleanliness < 20);

  const handleFeedSingleFish = async (fishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (canvasHandleRef.current) {
      canvasHandleRef.current.triggerFeedAnimation();
    }
    await feedFish(fishId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 1. Global Alert Banner if any fish or tank is in danger */}
      {(dangerFish.length > 0 || dirtyTanks.length > 0) && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>
              CRITICAL ATTENTION: {dangerFish.length} fish are starving / low health!{" "}
              {dirtyTanks.length > 0 && `${dirtyTanks.length} tank(s) require cleaning!`}
            </span>
          </div>
          <div className="text-[11px] font-semibold text-rose-300">
            Feed your fish and clean dirty tanks to protect fish health!
          </div>
        </div>
      )}

      {/* 2. Top Header & Tank Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Aquarium Oasis</span>
            <span className="text-sm font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              {tanks.length} Tank{tanks.length !== 1 ? "s" : ""}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-world clock simulation: hunger, health, dirtiness, and aging progress continuously.
          </p>
        </div>

        {/* Tank switcher pills */}
        <div className="flex flex-wrap items-center gap-2">
          {tanks.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTankId(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                t.id === selectedTank?.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "glass-panel text-slate-300 hover:text-white hover:border-cyan-500/40"
              }`}
            >
              <span>{t.name}</span>
              <span className="text-[10px] opacity-75">({t.fish.length})</span>
              {t.hasDangerFish && <span className="text-xs">⚠️</span>}
            </button>
          ))}

          <button
            onClick={() => setIsNewTankModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-dashed border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Tank</span>
          </button>
        </div>
      </div>

      {/* 2.5. Food Supplies & Rations Stock Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {[
          { type: "FLAKES", name: "Tropical Flakes", icon: "🥣" },
          { type: "PELLETS", name: "Protein Pellets", icon: "🟤" },
          { type: "LIVE", name: "Live Worms", icon: "🪱" },
          { type: "ALGAE", name: "Spirulina Algae", icon: "🟢" },
        ].map((f) => {
          const item = inventory.find((i) => i.foodType === f.type);
          const qty = item?.quantity || 0;
          const max = item?.maxQuantity || 25;
          const pct = item?.percentageRemaining ?? Math.min(100, Math.round((qty / max) * 100));

          return (
            <div
              key={f.type}
              className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <div className="text-[11px] font-bold text-white leading-tight">{f.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    <span className="text-cyan-300 font-bold">{qty}</span> left ({pct}%)
                  </div>
                </div>
              </div>

              <div className="w-10 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    pct > 50 ? "bg-emerald-400" : pct > 20 ? "bg-amber-400" : "bg-rose-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Tank Controls Bar */}
      <TankControls
        tank={selectedTank}
        onOpenNewTankModal={() => setIsNewTankModalOpen(true)}
        onTriggerFeed={() => {
          if (canvasHandleRef.current) {
            canvasHandleRef.current.triggerFeedAnimation();
          }
        }}
      />

      {/* 4. Main Interactive Canvas Stage */}
      <div className="mb-6">
        <AquariumCanvas
          ref={canvasHandleRef}
          tank={selectedTank}
          onSelectFish={(fish) => setSelectedFishForModal(fish)}
          onDropFood={() => {
            // Optional callback
          }}
        />
      </div>

      {/* 5. Tank Fish Roster Table & Quick Actions */}
      <div className="glass-panel rounded-3xl p-5 border border-cyan-500/20 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">
              Fish in {selectedTank?.name || "Current Tank"} ({selectedTank?.fish.length || 0})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Store className="w-3.5 h-3.5" /> Buy Fish for Tank
            </Link>
          </div>
        </div>

        {/* Fish Cards Grid / Table */}
        {!selectedTank?.fish || selectedTank.fish.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">🐠</div>
            <h4 className="font-bold text-white text-sm">This tank is currently empty</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Visit the shop to adopt species compatible with {selectedTank?.waterType.toLowerCase()} water!
            </p>
            <Link
              href="/shop"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-white shadow-md inline-flex items-center gap-2"
            >
              <Store className="w-4 h-4" /> Open Fish Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {selectedTank.fish.map((fish) => {
              const hungerInfo = getHungerColor(fish.hunger);
              const healthInfo = getHealthColor(fish.health);
              const nextFeeding = calculateNextFeedingTime(fish.hunger, fish.species.hungerRate);
              const inDanger = fish.hunger < 20 || fish.health < 30;

              return (
                <div
                  key={fish.id}
                  onClick={() => setSelectedFishForModal(fish)}
                  className={`p-4 rounded-3xl glass-panel border transition-all cursor-pointer hover:border-cyan-400 hover:scale-[1.01] ${
                    inDanger ? "danger-pulse border-rose-500" : "border-cyan-500/25"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow"
                        style={{
                          background: `linear-gradient(135deg, ${fish.species.primaryColor}, ${fish.species.secondaryColor})`,
                        }}
                      >
                        🐟
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                          <span>{fish.nickname}</span>
                          <span className="text-[10px] text-cyan-400 font-normal">
                            ({fish.sex === "MALE" ? "♂" : "♀"})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{fish.species.name}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getRarityBadgeColor(
                        fish.species.rarity
                      )}`}
                    >
                      {fish.species.rarity}
                    </span>
                  </div>

                  {/* Status Gauges: Hunger & Health */}
                  <div className="grid grid-cols-2 gap-2 my-2 text-[10px]">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 font-medium">Hunger:</span>
                        <span className={`font-black ${hungerInfo.text}`}>
                          {Math.round(fish.hunger)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full ${hungerInfo.bar}`} style={{ width: `${fish.hunger}%` }} />
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400 font-medium">Health:</span>
                        <span className={`font-black ${healthInfo.text}`}>
                          {Math.round(fish.health)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full ${healthInfo.bar}`} style={{ width: `${fish.health}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Persistent Feeding Timers */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Last Fed:</span>
                      </span>
                      <span className="font-bold text-white">{formatTimeAgo(fish.lastFedAt)}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-amber-400" />
                        <span>Next Due:</span>
                      </span>
                      <span
                        className={`font-black ${
                          nextFeeding.isCritical
                            ? "text-rose-400 animate-pulse"
                            : nextFeeding.isDue
                            ? "text-amber-400"
                            : "text-cyan-300"
                        }`}
                      >
                        {nextFeeding.text}
                      </span>
                    </div>
                  </div>

                  {/* Footer Stats & Quick Feed */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400 text-[10px]">Age: {formatAge(fish.bornAt)}</span>
                    <button
                      onClick={(e) => handleFeedSingleFish(fish.id, e)}
                      disabled={fish.hunger >= 98}
                      className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-bold text-[10px] flex items-center gap-1 disabled:opacity-50 transition-all hover:scale-105"
                    >
                      <Droplets className="w-3 h-3" /> Feed Fish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <FishDetailModal
        fish={selectedFishForModal}
        onClose={() => setSelectedFishForModal(null)}
        onTriggerFeedAnimation={() => {
          if (canvasHandleRef.current) {
            canvasHandleRef.current.triggerFeedAnimation();
          }
        }}
      />

      <NewTankModal
        isOpen={isNewTankModalOpen}
        onClose={() => setIsNewTankModalOpen(false)}
      />
    </div>
  );
}

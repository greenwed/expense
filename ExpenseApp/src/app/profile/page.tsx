"use client";

import React, { useEffect, useState } from "react";
import { useGame } from "@/context/GameContext";
import { FishSpeciesData } from "@/lib/types";
import {
  User,
  Shield,
  Coins,
  Waves,
  Skull,
  Calendar,
  Award,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { getRarityBadgeColor } from "@/lib/utils";

export default function ProfilePage() {
  const { user, tanks } = useGame();
  const [allSpecies, setAllSpecies] = useState<FishSpeciesData[]>([]);

  useEffect(() => {
    fetch("/api/shop")
      .then((res) => res.json())
      .then((data) => setAllSpecies(data.species || []))
      .catch(console.error);
  }, []);

  // Species currently or ever owned in user's tanks
  const ownedSpeciesIds = new Set(
    tanks.flatMap((t) => t.fish).map((f) => f.speciesId)
  );

  const discoveryCount = allSpecies.filter((s) => ownedSpeciesIds.has(s.id)).length;
  const discoveryPercent = Math.round((discoveryCount / (allSpecies.length || 1)) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 shadow-2xl mb-8 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            {user?.username.charAt(0).toUpperCase() || "A"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">{user?.username}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                Master Aquarist
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{user?.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Wallet Balance</div>
            <div className="text-xl font-black text-amber-300">
              {user?.cpBalance.toLocaleString() || 0} CP
            </div>
          </div>
        </div>
      </div>

      {/* Lifetime Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/20 shadow-md">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <Waves className="w-4 h-4" />
            <span>Alive Fish</span>
          </div>
          <div className="text-2xl font-black text-white">
            {user?.aliveFishCount ?? tanks.flatMap((t) => t.fish).length}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/20 shadow-md">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <Shield className="w-4 h-4" />
            <span>Tanks Owned</span>
          </div>
          <div className="text-2xl font-black text-white">{tanks.length}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/20 shadow-md">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
            <Skull className="w-4 h-4" />
            <span>Fish Losses</span>
          </div>
          <div className="text-2xl font-black text-slate-200">
            {user?.deadFishCount || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/20 shadow-md">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
            <Award className="w-4 h-4" />
            <span>Discovery</span>
          </div>
          <div className="text-2xl font-black text-amber-300">
            {discoveryPercent}%
          </div>
        </div>
      </div>

      {/* Species Discovery Compendium */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-extrabold text-white">
                Species Compendium & Discovery Log
              </h2>
              <p className="text-xs text-slate-400">
                Collect all 22 aquatic species across Freshwater, Saltwater, and Brackish biomes.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-cyan-300">
            {discoveryCount} / {allSpecies.length} Discovered
          </span>
        </div>

        {/* Species Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allSpecies.map((species) => {
            const isDiscovered = ownedSpeciesIds.has(species.id);

            return (
              <div
                key={species.id}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  isDiscovered
                    ? "glass-panel border-cyan-500/30 bg-cyan-950/30"
                    : "bg-slate-950/40 border-slate-800 opacity-50 grayscale"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow"
                    style={{
                      background: `linear-gradient(135deg, ${species.primaryColor}, ${species.secondaryColor})`,
                    }}
                  >
                    🐟
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1">
                      <span>{species.name}</span>
                      {isDiscovered && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {species.waterType.toLowerCase()} • {species.rarity.toLowerCase()}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getRarityBadgeColor(
                    species.rarity
                  )}`}
                >
                  {species.rarity}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { FishData, TankData } from "@/lib/types";
import { useGame } from "@/context/GameContext";
import {
  X,
  Droplets,
  Coins,
  HeartHandshake,
  ArrowRightLeft,
  Edit2,
  Check,
  Flame,
  Wind,
  Sparkles,
  AlertOctagon,
  Calendar,
  Clock,
  Zap,
} from "lucide-react";
import {
  formatAge,
  getRarityBadgeColor,
  getWaterTypeColor,
  getHealthColor,
  getHungerColor,
  calculateNextFeedingTime,
  formatDateTime,
  formatTimeAgo,
} from "@/lib/utils";
import Link from "next/link";

interface FishDetailModalProps {
  fish: FishData | null;
  onClose: () => void;
  onTriggerFeedAnimation?: (x?: number, y?: number) => void;
}

export default function FishDetailModal({
  fish,
  onClose,
  onTriggerFeedAnimation,
}: FishDetailModalProps) {
  const { feedFish, sellFish, tanks, refreshGameData } = useGame();
  const [feeding, setFeeding] = useState(false);
  const [selling, setSelling] = useState(false);
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nickname, setNickname] = useState(fish?.nickname || "");
  const [targetTankId, setTargetTankId] = useState(fish?.tankId || "");
  const [message, setMessage] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  if (!fish) return null;

  const handleFeed = async () => {
    setFeeding(true);
    setMessage(null);
    if (onTriggerFeedAnimation) onTriggerFeedAnimation();
    const res = await feedFish(fish.id);
    setFeeding(false);
    if (res.message) setMessage(res.message);
  };

  const handleSell = async () => {
    setSelling(true);
    setMessage(null);
    const res = await sellFish(fish.id);
    setSelling(false);
    if (res.success) {
      onClose();
    } else if (res.message) {
      setMessage(res.message);
    }
  };

  const handleRename = async () => {
    if (!nickname.trim()) return;
    try {
      const res = await fetch(`/api/fish/${fish.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      if (res.ok) {
        setIsEditingName(false);
        refreshGameData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveTank = async () => {
    if (!targetTankId || targetTankId === fish.tankId) return;
    setIsMoving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/fish/${fish.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTankId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to relocate fish.");
      } else {
        setMessage("Fish relocated successfully!");
        refreshGameData();
      }
    } catch {
      setMessage("Network error occurred.");
    } finally {
      setIsMoving(false);
    }
  };

  const healthInfo = getHealthColor(fish.health);
  const hungerInfo = getHungerColor(fish.hunger);
  const nextFeeding = calculateNextFeedingTime(fish.hunger, fish.species.hungerRate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-dropdown border border-cyan-500/40 p-6 shadow-2xl overflow-hidden">
        {/* Header with species colors & close button */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-2xl"
              style={{
                background: `linear-gradient(135deg, ${fish.species.primaryColor}, ${fish.species.secondaryColor})`,
              }}
            >
              🐟
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 border border-cyan-500/50 text-white text-sm font-bold focus:outline-none"
                    />
                    <button
                      onClick={handleRename}
                      className="p-1 rounded-md bg-cyan-500 text-white hover:bg-cyan-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{fish.nickname}</h3>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-slate-400 hover:text-cyan-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-xs text-cyan-400">
                  ({fish.sex === "MALE" ? "♂ Male" : "♀ Female"})
                </span>
              </div>
              <div className="text-xs text-slate-300">{fish.species.name}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="my-3 p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Badges Bar */}
        <div className="flex flex-wrap gap-2 my-3.5">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getRarityBadgeColor(
              fish.species.rarity
            )}`}
          >
            {fish.species.rarity}
          </span>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getWaterTypeColor(
              fish.species.waterType
            )}`}
          >
            {fish.species.waterType.toLowerCase()}
          </span>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {fish.species.social.toLowerCase()}
          </span>
          {fish.species.predatory && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/50">
              ⚔️ Predatory
            </span>
          )}
        </div>

        {/* Gauges: Hunger & Health */}
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          {/* Hunger Bar */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-cyan-500/20">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Hunger Level</span>
              <span className={`font-black ${hungerInfo.text}`}>{Math.round(fish.hunger)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-1">
              <div
                className={`h-full ${hungerInfo.bar} transition-all duration-300`}
                style={{ width: `${fish.hunger}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Diet: {fish.species.foodType.toLowerCase()}</div>
          </div>

          {/* Health Bar */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-cyan-500/20">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Health</span>
              <span className={`font-black ${healthInfo.text}`}>{Math.round(fish.health)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-1">
              <div
                className={`h-full ${healthInfo.bar} transition-all duration-300`}
                style={{ width: `${fish.health}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">Age: {formatAge(fish.bornAt)}</div>
          </div>
        </div>

        {/* Persistent Feeding Timestamps: Last Fed & Next Fed Due */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Last Fed:</span>
            </div>
            <div className="font-bold text-white text-xs" title={`Fed at ${formatDateTime(fish.lastFedAt)}`}>
              {formatTimeAgo(fish.lastFedAt)}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Droplets className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Due:</span>
            </div>
            <div
              className={`font-black text-xs ${
                nextFeeding.isCritical
                  ? "text-rose-400 animate-pulse"
                  : nextFeeding.isDue
                  ? "text-amber-400"
                  : "text-cyan-300"
              }`}
            >
              {nextFeeding.text}
            </div>
          </div>
        </div>

        {/* Species Flavour Description */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-cyan-500/10 text-xs text-slate-300 leading-relaxed mb-4">
          {fish.species.description}
        </div>

        {/* Move Tank Dropdown */}
        <div className="flex items-center gap-2 mb-4 text-xs">
          <span className="text-slate-400 whitespace-nowrap">Relocate to Tank:</span>
          <select
            value={targetTankId}
            onChange={(e) => setTargetTankId(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-slate-200 text-xs focus:outline-none"
          >
            {tanks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.waterType.toLowerCase()} • {t.capacityUsed || 0}/{t.capacity})
              </option>
            ))}
          </select>
          {targetTankId !== fish.tankId && (
            <button
              onClick={handleMoveTank}
              disabled={isMoving}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
            >
              Move
            </button>
          )}
        </div>

        {/* Action Buttons: Feed, Breed, Sell */}
        <div className="grid grid-cols-3 gap-2">
          {/* Feed Button */}
          <button
            onClick={handleFeed}
            disabled={feeding || fish.hunger >= 98}
            className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Droplets className="w-4 h-4" />
            <span>{feeding ? "Feeding..." : "Feed Now"}</span>
          </button>

          {/* Breed Button */}
          <Link
            href="/breeding"
            onClick={onClose}
            className="px-3 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Breed</span>
          </Link>

          {/* Sell Button */}
          {!showSellConfirm ? (
            <button
              onClick={() => setShowSellConfirm(true)}
              className="px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>Sell ({fish.species.sellPrice} CP)</span>
            </button>
          ) : (
            <button
              onClick={handleSell}
              disabled={selling}
              className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1"
            >
              <span>{selling ? "Selling..." : "Confirm Sell?"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { TankData } from "@/lib/types";
import { useGame } from "@/context/GameContext";
import {
  Sparkles,
  Droplets,
  Flame,
  Wind,
  PlusCircle,
  Clock,
  Coins,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getWaterTypeColor, formatTimeAgo, formatDateTime } from "@/lib/utils";

interface TankControlsProps {
  tank: TankData | null;
  onOpenNewTankModal: () => void;
  onTriggerFeed?: () => void;
}

const CLEAN_COSTS: Record<string, number> = {
  SMALL: 5,
  MEDIUM: 10,
  LARGE: 20,
};

export default function TankControls({
  tank,
  onOpenNewTankModal,
  onTriggerFeed,
}: TankControlsProps) {
  const { feedTank, cleanTank, user, inventory } = useGame();
  const [cleaning, setCleaning] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!tank) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-white mb-2">No Tank Found</h3>
        <p className="text-xs text-slate-300 mb-4">You need an aquarium tank to house your fish!</p>
        <button
          onClick={onOpenNewTankModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-white shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Buy Your First Tank
        </button>
      </div>
    );
  }

  const cleanCost = CLEAN_COSTS[tank.size] || 5;

  const handleFeedAll = async () => {
    setFeeding(true);
    setFeedbackMsg(null);
    if (onTriggerFeed) onTriggerFeed();
    const res = await feedTank(tank.id);
    setFeeding(false);
    if (res.message) setFeedbackMsg(res.message);
  };

  const handleClean = async () => {
    setCleaning(true);
    setFeedbackMsg(null);
    const res = await cleanTank(tank.id, "instant");
    setCleaning(false);
    if (res.message) setFeedbackMsg(res.message);
  };

  const totalCapacity = tank.capacity;
  const usedCapacity = tank.capacityUsed || 0;

  // Cleanliness meter status
  const cleanliness = Math.round(tank.cleanliness);
  const dirtPercent = Math.max(0, 100 - cleanliness);

  let cleanlinessStatus = "Pristine Crystal Clear";
  let cleanlinessColor = "text-emerald-400 bg-emerald-500/20";
  if (cleanliness < 10) {
    cleanlinessStatus = "100% Unclean (Sludge Blanket)";
    cleanlinessColor = "text-rose-400 bg-rose-500/30 animate-pulse";
  } else if (cleanliness < 35) {
    cleanlinessStatus = "Heavily Murky & Algae Growth";
    cleanlinessColor = "text-rose-400 bg-rose-500/20";
  } else if (cleanliness < 70) {
    cleanlinessStatus = `${dirtPercent}% Unclean (Mild Algae & Dirt)`;
    cleanlinessColor = "text-amber-400 bg-amber-500/20";
  }

  const totalFoodInStock = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const canAffordClean = user ? user.cpBalance >= cleanCost : false;

  return (
    <div className="glass-panel rounded-3xl p-4 md:p-5 border border-cyan-500/25 mb-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Tank Name, Water type & Equipment */}
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black tracking-tight text-white">{tank.name}</h2>
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getWaterTypeColor(
                tank.waterType
              )}`}
            >
              {tank.waterType.toLowerCase()}
            </span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {tank.size.toLowerCase()} tank
            </span>
          </div>

          {/* Last Cleaned timestamp, Space & Equipment */}
          <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs">
            {/* Last Cleaned Time */}
            <div
              className="flex items-center gap-1.5 text-slate-300 px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-800"
              title={`Cleaned on ${formatDateTime(tank.lastCleanedAt)}`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Last Cleaned:</span>
              <span className="font-bold text-white">{formatTimeAgo(tank.lastCleanedAt)}</span>
            </div>

            {/* Space Capacity */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">Space:</span>
              <span
                className={`font-bold ${
                  usedCapacity >= totalCapacity ? "text-rose-400" : "text-cyan-300"
                }`}
              >
                {usedCapacity}/{totalCapacity} units
              </span>
            </div>

            {/* Heater status */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] ${
                tank.hasHeater
                  ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-500 line-through"
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Heater {tank.hasHeater ? "ON" : "OFF"}</span>
            </div>

            {/* Motor status */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] ${
                tank.hasMotor
                  ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-900/60 border-slate-800 text-slate-500 line-through"
              }`}
            >
              <Wind className="w-3 h-3" />
              <span>Aerator {tank.hasMotor ? "ON" : "OFF"}</span>
            </div>
          </div>
        </div>

        {/* Cleanliness Meter & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cleanliness & Dirt Meter */}
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-cyan-500/20 flex flex-col justify-center min-w-[170px]">
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-slate-400">Cleanliness:</span>
              <span className={`font-black px-1.5 py-0.2 rounded ${cleanlinessColor}`}>
                {cleanliness}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-1">
              <div
                className={`h-full transition-all duration-500 ${
                  cleanliness > 60
                    ? "bg-emerald-400"
                    : cleanliness > 25
                    ? "bg-amber-400"
                    : "bg-rose-500 animate-pulse"
                }`}
                style={{ width: `${cleanliness}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 font-medium truncate">
              {cleanlinessStatus}
            </div>
          </div>

          {/* Action: Feed All */}
          <button
            onClick={handleFeedAll}
            disabled={feeding || tank.fish.length === 0 || totalFoodInStock === 0}
            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 font-bold text-xs text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <Droplets className="w-4 h-4" />
            <span>{feeding ? "Feeding..." : "Feed All"}</span>
          </button>

          {/* Action: Clean Tank with CP Charge */}
          <button
            onClick={handleClean}
            disabled={cleaning || cleanliness >= 99 || !canAffordClean}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
              cleanliness < 25
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 animate-bounce"
                : "bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200"
            } disabled:opacity-40 disabled:pointer-events-none`}
            title={`Deep clean tank for ${cleanCost} CP`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{cleaning ? "Cleaning..." : `Clean Tank (${cleanCost} CP)`}</span>
          </button>

          {/* Add New Tank Button */}
          <button
            onClick={onOpenNewTankModal}
            className="p-2.5 rounded-2xl bg-slate-900/60 hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white transition-colors"
            title="Buy another tank"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action feedback message */}
      {feedbackMsg && (
        <div className="mt-3 p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between animate-in fade-in">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

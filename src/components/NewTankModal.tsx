"use client";

import React, { useState } from "react";
import { X, PlusCircle, Sparkles, Check } from "lucide-react";
import { useGame } from "@/context/GameContext";

interface NewTankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TANK_OPTIONS = [
  {
    size: "SMALL",
    name: "Small Glass Tank",
    capacity: 5,
    price: 20,
    description: "Compact 10-gallon starter aquarium. Holds up to 5 space units.",
  },
  {
    size: "MEDIUM",
    name: "Medium Community Tank",
    capacity: 15,
    price: 50,
    description: "30-gallon community setup. Houses up to 15 space units.",
  },
  {
    size: "LARGE",
    name: "Large Oceanarium Tank",
    capacity: 40,
    price: 120,
    description: "75-gallon grand aquarium. Houses up to 40 space units for large predators and schools.",
  },
];

export default function NewTankModal({ isOpen, onClose }: NewTankModalProps) {
  const { user, refreshGameData } = useGame();
  const [tankName, setTankName] = useState("Sanctuary Reef");
  const [selectedSize, setSelectedSize] = useState("SMALL");
  const [waterType, setWaterType] = useState("FRESHWATER");
  const [hasHeater, setHasHeater] = useState(true);
  const [hasMotor, setHasMotor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOption = TANK_OPTIONS.find((t) => t.size === selectedSize) || TANK_OPTIONS[0];

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankName.trim()) {
      setError("Please enter a name for your new tank.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tanks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tankName.trim(),
          size: selectedSize,
          waterType,
          hasHeater,
          hasMotor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to purchase tank.");
      } else {
        await refreshGameData();
        onClose();
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-dropdown border border-cyan-500/40 p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Purchase New Aquarium Tank</h3>
              <p className="text-xs text-slate-300">Expand your aquarium capacity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handlePurchase} className="space-y-4">
          {/* Tank Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tank Name</label>
            <input
              type="text"
              value={tankName}
              onChange={(e) => setTankName(e.target.value)}
              placeholder="e.g. Coral Haven, Betta Den"
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-white text-xs focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          {/* Tank Size Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Tank Size</label>
            <div className="grid grid-cols-3 gap-2">
              {TANK_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.size}
                  onClick={() => setSelectedSize(opt.size)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    selectedSize === opt.size
                      ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "bg-slate-900/50 border-slate-700/60 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className="font-bold text-xs capitalize text-white">{opt.size.toLowerCase()}</div>
                  <div className="text-[10px] text-cyan-300 font-semibold mt-0.5">{opt.capacity} Units</div>
                  <div className="text-xs text-amber-300 font-black mt-2">{opt.price} CP</div>
                </button>
              ))}
            </div>
          </div>

          {/* Water Type Radio Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Water Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "FRESHWATER", label: "Freshwater", desc: "For Goldfish, Tetras, Bettas" },
                { id: "SALTWATER", label: "Saltwater (Reef)", desc: "For Clownfish, Tangs, Lionfish" },
                { id: "BRACKISH", label: "Brackish", desc: "For Puffers, Archerfish, Mollies" },
              ].map((wt) => (
                <button
                  type="button"
                  key={wt.id}
                  onClick={() => setWaterType(wt.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    waterType === wt.id
                      ? "bg-cyan-500/20 border-cyan-400 text-white"
                      : "bg-slate-900/50 border-slate-700/60 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className="font-bold text-xs text-white">{wt.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{wt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Options */}
          <div className="flex gap-4 p-3 rounded-2xl bg-slate-950/40 border border-cyan-500/20 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHeater}
                onChange={(e) => setHasHeater(e.target.checked)}
                className="rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <span>Include Tropical Heater</span>
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMotor}
                onChange={(e) => setHasMotor(e.target.checked)}
                className="rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <span>Include Aeration Motor</span>
            </label>
          </div>

          {/* Summary & Submit */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
            <div>
              <div className="text-[10px] text-slate-400">Total Price:</div>
              <div className="text-lg font-black text-amber-300">{currentOption.price} CP</div>
            </div>
            <button
              type="submit"
              disabled={submitting || (user ? user.cpBalance < currentOption.price : true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? "Purchasing..." : "Purchase Tank"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

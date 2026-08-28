"use client";

import React, { useState } from "react";
import { X, Clock, FastForward, Sparkles, AlertTriangle, Calendar } from "lucide-react";
import { useGame } from "@/context/GameContext";

interface TimeMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimeMachineModal({ isOpen, onClose }: TimeMachineModalProps) {
  const { user, refreshGameData } = useGame();
  const [customDate, setCustomDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isOpen || user?.email?.toLowerCase() !== "karthikjay1202@gmail.com") return null;

  const handleAdvanceHours = async (hours: number) => {
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch("/api/simulation/time-travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoursForward: hours }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Time travel failed.");
      } else {
        setMsg(data.message);
        await refreshGameData();
      }
    } catch {
      setMsg("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomDateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) return;

    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch("/api/simulation/time-travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate: customDate }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed to set custom date.");
      } else {
        setMsg(data.message);
        await refreshGameData();
      }
    } catch {
      setMsg("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-dropdown border border-cyan-500/40 p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
              <FastForward className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">⏱️ Testing Time Machine</h3>
              <p className="text-xs text-slate-300">
                Fast-forward clock to test hunger decay, tank dirtiness, aging, and breeding
              </p>
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
        {msg && (
          <div className="mb-4 p-3 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between animate-in fade-in">
            <span>{msg}</span>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2.5">
            Quick Fast-Forward Presets
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { hours: 1, label: "+1 Hour", desc: "Mild Hunger Test" },
              { hours: 6, label: "+6 Hours", desc: "20% Dirty & Algae Test" },
              { hours: 12, label: "+12 Hours", desc: "Hungry Due Test" },
              { hours: 24, label: "+1 Day", desc: "50% Murky Water" },
              { hours: 72, label: "+3 Days", desc: "100% Sludge & Breeding Done" },
              { hours: 168, label: "+7 Days", desc: "Elderly Aging Cycle" },
            ].map((p) => (
              <button
                key={p.hours}
                onClick={() => handleAdvanceHours(p.hours)}
                disabled={submitting}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-cyan-950/70 border border-cyan-500/30 text-left transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                <div className="font-extrabold text-xs text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{p.label}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 leading-tight">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Target Date Form */}
        <form onSubmit={handleCustomDateAdvance} className="space-y-3 pt-4 border-t border-slate-800">
          <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider">
            Or Jump to Specific Date & Time
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !customDate}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs shadow-md disabled:opacity-40 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Simulate Date</span>
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white underline font-semibold"
          >
            Close Testing Controls
          </button>
        </div>
      </div>
    </div>
  );
}

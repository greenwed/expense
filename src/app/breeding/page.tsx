"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { FishData } from "@/lib/types";
import {
  HeartHandshake,
  Sparkles,
  Heart,
  Timer,
  Baby,
  CheckCircle2,
  AlertCircle,
  Clock,
  Store,
} from "lucide-react";
import { formatAge, getRarityBadgeColor } from "@/lib/utils";
import Link from "next/link";

export default function BreedingPage() {
  const { tanks, loading, refreshGameData } = useGame();

  const [selectedTankId, setSelectedTankId] = useState<string>("");
  const [maleFishId, setMaleFishId] = useState<string>("");
  const [femaleFishId, setFemaleFishId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Sync selected tank ID
  useEffect(() => {
    if (!selectedTankId) {
      setSelectedTankId("ALL");
    }
  }, [selectedTankId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-pink-500/20 border-t-pink-400 animate-spin" />
        <p className="text-pink-200 text-xs font-semibold animate-pulse">
          Loading genetic pairings & gestation chambers...
        </p>
      </div>
    );
  }

  // Alive fish based on tank filter
  const tankFish = selectedTankId === "ALL" || !selectedTankId
    ? tanks.flatMap((t) => (t.fish || []).map((f) => ({ ...f, tankName: t.name })))
    : (tanks.find((t) => t.id === selectedTankId)?.fish || []).map((f) => ({
        ...f,
        tankName: tanks.find((t) => t.id === selectedTankId)?.name,
      }));

  // Actively breeding pairs across all tanks
  const breedingFish = tanks
    .flatMap((t) => t.fish || [])
    .filter((f) => f.isBreeding && f.sex === "FEMALE"); // show per pair

  // Candidates for breeding
  const maleCandidates = tankFish.filter(
    (f) => f.sex === "MALE" && !f.isBreeding && f.health >= 70 && (f.species?.breedEligible ?? true)
  );

  const selectedMale = tankFish.find((f) => f.id === maleFishId);

  // Female candidates must match the selected male's species
  const femaleCandidates = tankFish.filter(
    (f) =>
      f.sex === "FEMALE" &&
      !f.isBreeding &&
      f.health >= 70 &&
      (f.species?.breedEligible ?? true) &&
      (!selectedMale || f.speciesId === selectedMale.speciesId)
  );

  const selectedFemale = tankFish.find((f) => f.id === femaleFishId);

  const handleStartBreeding = async () => {
    if (!maleFishId || !femaleFishId) {
      setMessage({ type: "error", text: "Please select both a male and female fish." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/fish/breed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent1Id: maleFishId, parent2Id: femaleFishId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to initiate breeding." });
      } else {
        setMessage({ type: "success", text: data.message });
        setMaleFishId("");
        setFemaleFishId("");
        await refreshGameData();
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <HeartHandshake className="w-6 h-6 text-pink-400" />
          <span>Aquatic Genetics & Breeding Lab</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Pair compatible healthy fish of the same species to hatch rare and vibrant juvenile fry!
        </p>
      </div>

      {/* 1. Active Incubation Timers */}
      {breedingFish.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span>Active Gestation Chambers ({breedingFish.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {breedingFish.map((f) => {
              const started = f.breedingStartedAt ? new Date(f.breedingStartedAt).getTime() : Date.now();
              const gestationHours = f.species?.gestationHours || 24;
              const gestationMs = gestationHours * 3600 * 1000;
              const elapsed = Math.max(0, Date.now() - started);
              const progress = Math.min(100, Math.round((elapsed / gestationMs) * 100));
              const remainingHours = Math.max(0, Math.ceil((gestationMs - elapsed) / (1000 * 3600)));

              return (
                <div
                  key={f.id}
                  className="rounded-3xl glass-panel p-5 border border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.15)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-xl shadow">
                          🥚
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-white">
                            {f.species?.name || "Fish"} Gestation
                          </h3>
                          <div className="text-[11px] text-pink-300 font-medium">
                            Mother: {f.nickname}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-950/60 border border-pink-500/40 text-pink-300">
                        {progress}% Incubated
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{remainingHours > 0 ? `~${remainingHours} hours remaining` : "Hatching fry soon!"}</span>
                    </span>
                    <span className="text-pink-300 font-semibold text-[11px]">
                      Yields 1-3 fry
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Pairing Laboratory */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/25 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/60 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Select Breeding Pair</h2>
              <p className="text-xs text-slate-300">
                Choose a tank with both a healthy male and female of the same species (Health &ge; 70%).
              </p>
            </div>
          </div>

          {/* Tank Selector */}
          {tanks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tank:</span>
              <select
                value={selectedTankId}
                onChange={(e) => {
                  setSelectedTankId(e.target.value);
                  setMaleFishId("");
                  setFemaleFishId("");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">
                  All Aquariums ({tanks.reduce((sum, t) => sum + (t.fish?.length || 0), 0)} fish)
                </option>
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.fish?.length || 0} fish)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-3 rounded-2xl border text-xs flex items-center gap-2 ${
              message.type === "error"
                ? "bg-rose-950/80 border-rose-500/50 text-rose-200"
                : "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* No Tanks or Empty Tank Callout */}
        {tankFish.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🐠</div>
            <h4 className="font-bold text-white text-sm mb-1">No eligible fish available</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              To breed fish, visit the Fish Shop to purchase both a male (♂) and female (♀) pair of the same species!
            </p>
            <Link
              href="/shop"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-xs text-white shadow-md inline-flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Store className="w-4 h-4" /> Open Fish Shop
            </Link>
          </div>
        ) : (
          <>
            {/* Selection Columns: Male & Female */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* MALE CANDIDATES */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-cyan-500/20">
                <h3 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>1. Select Father (♂ Male)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {maleCandidates.length} eligible
                  </span>
                </h3>

                {maleCandidates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No eligible male fish in this tank with &ge; 70% health.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {maleCandidates.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setMaleFishId(f.id);
                          if (selectedFemale && selectedFemale.speciesId !== f.speciesId) {
                            setFemaleFishId("");
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          maleFishId === f.id
                            ? "bg-cyan-500/25 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                            : "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-white">{f.nickname}</div>
                          <div className="text-[10px] text-slate-400">{f.species?.name}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-400">
                            {Math.round(f.health)}% HP
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* FEMALE CANDIDATES */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-pink-500/20">
                <h3 className="text-xs font-extrabold text-pink-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>2. Select Mother (♀ Female)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {femaleCandidates.length} eligible
                  </span>
                </h3>

                {femaleCandidates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    {selectedMale
                      ? `No eligible female ${selectedMale.species?.name} in this tank.`
                      : "Select a male fish first to filter matching females."}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {femaleCandidates.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFemaleFishId(f.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          femaleFishId === f.id
                            ? "bg-pink-500/25 border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                            : "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-white">{f.nickname}</div>
                          <div className="text-[10px] text-slate-400">{f.species?.name}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-400">
                            {Math.round(f.health)}% HP
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pairing Summary & Action */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-300">
                {selectedMale && selectedFemale ? (
                  <span className="text-emerald-300 font-semibold">
                    ✓ Compatible Match: {selectedMale.species?.name} (~
                    {selectedMale.species?.gestationHours || 24} hrs gestation)
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Select both a male and female to begin courtship.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleStartBreeding}
                disabled={submitting || !maleFishId || !femaleFishId}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:scale-105 font-black text-xs text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>{submitting ? "Initiating..." : "Start Breeding Cycle"}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

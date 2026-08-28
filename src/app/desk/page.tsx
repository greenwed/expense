"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import {
  Briefcase,
  Droplets,
  Flame,
  Wind,
  PlusCircle,
  Coins,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Waves,
  ArrowRight,
  Package,
  Wrench,
  Sparkles,
  Inbox,
} from "lucide-react";
import Link from "next/link";

interface DeskData {
  deskItems: Array<{
    itemType: string;
    quantity: number;
    price: number;
    name: string;
    desc: string;
  }>;
  storedTanks: Array<{
    id: string;
    name: string;
    size: string;
    waterType: string;
    hasHeater: boolean;
    hasMotor: boolean;
    createdAt: string;
  }>;
  foodInventory: Array<{
    foodType: string;
    quantity: number;
    maxQuantity: number;
  }>;
  equipmentCatalog: Record<string, { price: number; name: string; desc: string }>;
  tankCatalog: Record<string, { price: number; capacity: number; name: string }>;
}

export default function DeskPage() {
  const { user, tanks, inventory, refreshGameData } = useGame();
  const [deskData, setDeskData] = useState<DeskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals / Selected Actions
  const [selectedEquipmentToInstall, setSelectedEquipmentToInstall] = useState<string | null>(null);
  const [targetTankForInstall, setTargetTankForInstall] = useState<string>("");

  const [deployingTank, setDeployingTank] = useState<any | null>(null);
  const [customDeployName, setCustomDeployName] = useState("");

  const [newTankSize, setNewTankSize] = useState<"SMALL" | "MEDIUM" | "LARGE">("MEDIUM");
  const [newTankWater, setNewTankWater] = useState<"FRESHWATER" | "SALTWATER" | "BRACKISH">("FRESHWATER");
  const [newTankCustomName, setNewTankCustomName] = useState("");

  const fetchDeskData = async () => {
    try {
      const res = await fetch("/api/desk");
      if (res.ok) {
        const data = await res.json();
        setDeskData(data);
      }
    } catch (e) {
      console.error("Error loading desk data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeskData();
  }, []);

  useEffect(() => {
    if (tanks.length > 0 && !targetTankForInstall) {
      setTargetTankForInstall(tanks[0].id);
    }
  }, [tanks, targetTankForInstall]);

  const handleBuyEquipment = async (itemType: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy_equipment", itemType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Purchase failed." });
      } else {
        setMessage({ type: "success", text: data.message });
        await Promise.all([fetchDeskData(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyStoredTank = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buy_tank",
          tankSize: newTankSize,
          waterType: newTankWater,
          tankName: newTankCustomName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Tank purchase failed." });
      } else {
        setMessage({ type: "success", text: data.message });
        setNewTankCustomName("");
        await Promise.all([fetchDeskData(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInstallEquipment = async () => {
    if (!selectedEquipmentToInstall || !targetTankForInstall) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/desk/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "install_equipment",
          activeTankId: targetTankForInstall,
          itemType: selectedEquipmentToInstall,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Installation failed." });
      } else {
        setMessage({ type: "success", text: data.message });
        setSelectedEquipmentToInstall(null);
        await Promise.all([fetchDeskData(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUninstallEquipment = async (activeTankId: string, itemType: "HEATER" | "MOTOR") => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/desk/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "uninstall_equipment",
          activeTankId,
          itemType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Uninstall failed." });
      } else {
        setMessage({ type: "success", text: data.message });
        await Promise.all([fetchDeskData(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeployStoredTank = async () => {
    if (!deployingTank) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/desk/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deploy_tank",
          storedTankId: deployingTank.id,
          customTankName: customDeployName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Deployment failed." });
      } else {
        setMessage({ type: "success", text: data.message });
        setDeployingTank(null);
        setCustomDeployName("");
        await Promise.all([fetchDeskData(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStoreActiveTank = async (activeTankId: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/desk/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "store_tank",
          activeTankId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to pack tank." });
      } else {
        setMessage({ type: "success", text: data.message });
        await Promise.all([fetchDeskData(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyFoodPack = async (foodType: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to buy food." });
      } else {
        setMessage({ type: "success", text: data.message });
        await Promise.all([fetchDeskData(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <p className="text-cyan-200 text-xs font-semibold animate-pulse">
          Opening Aquarist Workshop & Storage Desk...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-cyan-400" />
            <span>Aquarist Desk & Storage Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Your personal workshop vault. Buy and store dry supplies, food rations, spare aeration motors, quartz heaters, and extra aquariums. Deploy items to any tank anytime.
          </p>
        </div>

        {/* User Balance */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-sm shadow-md">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{user?.cpBalance.toLocaleString() || 0} CP Available</span>
        </div>
      </div>

      {/* Storage Rule Banner: Cannot store live fish on desk */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-start gap-3 shadow-lg">
        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-extrabold text-white text-sm">
            Desk Storage Safety Protocol: Fish Cannot Be Kept on Desk
          </h4>
          <p className="text-slate-300 mt-0.5 leading-relaxed">
            All fish must always reside in active water aquariums with filtration and oxygen. The Desk holds dry items: <strong className="text-cyan-300">Food Packs</strong>, <strong className="text-cyan-300">Spare Heaters & Motors</strong>, and <strong className="text-cyan-300">Stored Tank Frames</strong>.
          </p>
        </div>
      </div>

      {/* Global Alert Message */}
      {message && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center justify-between shadow-lg ${
            message.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: 🍽️ FOOD RATIONS STORAGE PANTRY */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/25 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Food Supplies Storage Pantry</h2>
              <p className="text-[11px] text-slate-400">Available food rations for feeding fish</p>
            </div>
          </div>

          <Link href="/inventory" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1">
            <span>Detailed Pantry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: "FLAKES", name: "Tropical Flakes", icon: "🥣", desc: "Omnivore flakes with spirulina" },
            { type: "PELLETS", name: "High-Protein Pellets", icon: "🟤", desc: "Sinking pellets for carnivores" },
            { type: "LIVE", name: "Live Bloodworms", icon: "🪱", desc: "Premium live prey for predators" },
            { type: "ALGAE", name: "Spirulina Algae", icon: "🟢", desc: "Pure green nutrition for herbivores" },
          ].map((food) => {
            const item = inventory.find((i) => i.foodType === food.type);
            const qty = item?.quantity || 0;
            const max = item?.maxQuantity || 25;
            const pct = item?.percentageRemaining ?? Math.min(100, Math.round((qty / max) * 100));

            return (
              <div key={food.type} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{food.icon}</span>
                    <span className="text-xs font-black text-white">{qty} Servings Left</span>
                  </div>
                  <h3 className="text-xs font-bold text-white">{food.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-snug">{food.desc}</p>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Stock Level</span>
                    <span className="font-bold text-cyan-300">{pct}% Remaining</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pct > 50 ? "bg-emerald-400" : pct > 20 ? "bg-amber-400" : "bg-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <button
                    onClick={() => handleBuyFoodPack(food.type)}
                    disabled={actionLoading}
                    className="w-full py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Restock Pack (+25 Servings)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ⚙️ EQUIPMENT & SPARE PARTS VAULT */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/25 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Equipment & Spare Parts Storage</h2>
              <p className="text-[11px] text-slate-400">Heaters, Aerators, and Filtration units stored on your Desk</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(deskData?.deskItems || []).map((item) => (
            <div key={item.itemType} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400">
                    {item.itemType === "HEATER" && <Flame className="w-5 h-5 text-rose-400" />}
                    {item.itemType === "MOTOR" && <Wind className="w-5 h-5 text-cyan-400" />}
                    {item.itemType === "AUTO_FEEDER" && <Package className="w-5 h-5 text-amber-400" />}
                    {item.itemType === "WATER_FILTER" && <Droplets className="w-5 h-5 text-teal-400" />}
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-black">
                    {item.quantity} in Desk
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white mb-0.5">{item.name}</h3>
                <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Desk Price:</span>
                  <span className="font-extrabold text-amber-300">{item.price} CP</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleBuyEquipment(item.itemType)}
                    disabled={actionLoading || (user ? user.cpBalance < item.price : true)}
                    className="py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold transition-all disabled:opacity-40"
                  >
                    + Buy to Desk
                  </button>

                  <button
                    onClick={() => setSelectedEquipmentToInstall(item.itemType)}
                    disabled={item.quantity <= 0 || (item.itemType !== "HEATER" && item.itemType !== "MOTOR")}
                    className="py-1.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold transition-all disabled:opacity-40"
                  >
                    Install on Tank
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: 🌊 TANK WAREHOUSE & MULTI-TANK MANAGEMENT */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/25 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Tank Warehouse & Multi-Aquarium Hub</h2>
              <p className="text-[11px] text-slate-400">Manage all your active aquariums and deploy spare stored tanks from your Desk</p>
            </div>
          </div>
        </div>

        {/* 3A: Stored Spare Tanks on Desk */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Inbox className="w-4 h-4 text-cyan-400" />
            <span>Spare Tanks in Desk Storage ({(deskData?.storedTanks || []).length})</span>
          </h3>

          {(deskData?.storedTanks || []).length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
              No spare tanks currently in your Desk warehouse. You can buy extra tanks below and deploy them whenever you need!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(deskData?.storedTanks || []).map((st) => (
                <div key={st.id} className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/20 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">📦</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {st.size} • {st.waterType.toLowerCase()}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-white text-xs">{st.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Stored on Desk • Ready to deploy</p>
                  </div>

                  <button
                    onClick={() => {
                      setDeployingTank(st);
                      setCustomDeployName(st.name);
                    }}
                    disabled={actionLoading}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Deploy to Active Dashboard</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3B: Active Dashboard Aquariums Management */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-emerald-400" />
            <span>Active Dashboard Aquariums ({tanks.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tanks.map((tank) => {
              const fishCount = tank.fish?.length || 0;
              const usedSpace = tank.capacityUsed || 0;

              return (
                <div key={tank.id} className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-white text-sm">{tank.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {tank.waterType.toLowerCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1 my-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capacity:</span>
                        <span className="font-bold text-white">{usedSpace}/{tank.capacity} Units ({fishCount} Fish)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cleanliness:</span>
                        <span className="font-bold text-emerald-400">{Math.round(tank.cleanliness)}%</span>
                      </div>
                    </div>

                    {/* Installed Equipment Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tank.hasHeater ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/70 border border-rose-500/30 text-rose-300 text-[10px] font-semibold">
                          <Flame className="w-3 h-3" />
                          <span>Heater Active</span>
                          <button
                            onClick={() => handleUninstallEquipment(tank.id, "HEATER")}
                            title="Detach to Desk"
                            className="ml-1 text-rose-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 border border-dashed border-slate-800 px-2 py-0.5 rounded-lg">
                          No Heater
                        </span>
                      )}

                      {tank.hasMotor ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold">
                          <Wind className="w-3 h-3" />
                          <span>Aerator Motor Active</span>
                          <button
                            onClick={() => handleUninstallEquipment(tank.id, "MOTOR")}
                            title="Detach to Desk"
                            className="ml-1 text-cyan-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 border border-dashed border-slate-800 px-2 py-0.5 rounded-lg">
                          No Aerator
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <Link
                      href={`/?tankId=${tank.id}`}
                      className="flex-1 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-center text-xs font-bold transition-all"
                    >
                      View Aquarium
                    </Link>

                    <button
                      onClick={() => handleStoreActiveTank(tank.id)}
                      disabled={actionLoading || fishCount > 0}
                      title={fishCount > 0 ? "Cannot store tank with live fish! Relocate fish first." : "Pack tank back into Desk storage"}
                      className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Pack to Desk
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3C: Buy New Spare Tank into Desk Warehouse */}
        <div className="pt-4 border-t border-slate-800 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Order New Aquarium Frame to Desk Warehouse</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tank Size</label>
              <select
                value={newTankSize}
                onChange={(e) => setNewTankSize(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs font-semibold focus:outline-none"
              >
                <option value="SMALL">Small Starter Tank (5 Units) - 20 CP</option>
                <option value="MEDIUM">Medium Community (15 Units) - 50 CP</option>
                <option value="LARGE">Large Show Aquarium (40 Units) - 120 CP</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Water Type Biome</label>
              <select
                value={newTankWater}
                onChange={(e) => setNewTankWater(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs font-semibold focus:outline-none"
              >
                <option value="FRESHWATER">Freshwater</option>
                <option value="SALTWATER">Saltwater Reef</option>
                <option value="BRACKISH">Brackish Mangrove</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Custom Name (Optional)</label>
              <input
                type="text"
                value={newTankCustomName}
                onChange={(e) => setNewTankCustomName(e.target.value)}
                placeholder="e.g. Coral Paradise"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleBuyStoredTank}
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              Order & Store in Desk Warehouse
            </button>
          </div>
        </div>
      </div>

      {/* INSTALL EQUIPMENT MODAL */}
      {selectedEquipmentToInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-dropdown border border-cyan-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">
              Install {selectedEquipmentToInstall === "HEATER" ? "Heater" : "Aerator Motor"} onto Tank
            </h3>
            <p className="text-xs text-slate-300">
              Select which active aquarium to equip with your stored {selectedEquipmentToInstall.toLowerCase()}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Active Aquarium</label>
              <select
                value={targetTankForInstall}
                onChange={(e) => setTargetTankForInstall(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none"
              >
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.waterType.toLowerCase()} • {t.size.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEquipmentToInstall(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleInstallEquipment}
                disabled={actionLoading || !targetTankForInstall}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40"
              >
                {actionLoading ? "Installing..." : "Confirm Installation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPLOY TANK MODAL */}
      {deployingTank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-dropdown border border-cyan-500/40 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">Deploy Stored Aquarium</h3>
            <p className="text-xs text-slate-300">
              This will launch the stored {deployingTank.size.toLowerCase()} {deployingTank.waterType.toLowerCase()} tank as a live aquarium on your dashboard.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Aquarium Name</label>
              <input
                type="text"
                value={customDeployName}
                onChange={(e) => setCustomDeployName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeployingTank(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleDeployStoredTank}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40"
              >
                {actionLoading ? "Deploying..." : "Launch Aquarium"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

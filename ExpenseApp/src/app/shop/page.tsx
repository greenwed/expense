"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { FishSpeciesData, TankData, ShopTankItem, ShopFoodItem } from "@/lib/types";
import {
  Store,
  Search,
  Filter,
  Coins,
  Droplets,
  PlusCircle,
  Flame,
  Wind,
  Check,
  Sparkles,
  AlertCircle,
  Waves,
} from "lucide-react";
import {
  getRarityBadgeColor,
  getWaterTypeColor,
} from "@/lib/utils";

export default function ShopPage() {
  const { user, tanks, refreshGameData } = useGame();
  const [activeTab, setActiveTab] = useState<"fish" | "tanks" | "food" | "equipment">("fish");

  const [speciesList, setSpeciesList] = useState<FishSpeciesData[]>([]);
  const [tankCatalog, setTankCatalog] = useState<ShopTankItem[]>([]);
  const [foodCatalog, setFoodCatalog] = useState<ShopFoodItem[]>([]);
  const [upgradesCatalog, setUpgradesCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWaterType, setSelectedWaterType] = useState<string>("ALL");
  const [selectedRarity, setSelectedRarity] = useState<string>("ALL");

  // Buy Fish Modal State
  const [selectedSpeciesToBuy, setSelectedSpeciesToBuy] = useState<FishSpeciesData | null>(null);
  const [destTankId, setDestTankId] = useState<string>("");
  const [fishNickname, setFishNickname] = useState("");
  const [fishSex, setFishSex] = useState<"MALE" | "FEMALE" | "RANDOM">("FEMALE");
  const [purchasing, setPurchasing] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch("/api/shop");
        if (res.ok) {
          const data = await res.json();
          setSpeciesList(data.species || []);
          setTankCatalog(data.tanks || []);
          setFoodCatalog(data.foodPacks || []);
          setUpgradesCatalog(data.upgrades || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    if (tanks.length > 0 && !destTankId) {
      setDestTankId(tanks[0].id);
    }
  }, [tanks, destTankId]);

  const handleOpenBuyFish = (species: FishSpeciesData) => {
    setSelectedSpeciesToBuy(species);
    setFishNickname(species.name);
    setFishSex("FEMALE");
    setBuyError(null);
    setBuySuccess(null);

    // Auto-select a compatible tank if available
    const compatible = tanks.find(
      (t) =>
        t.waterType === species.waterType &&
        (t.capacityUsed || 0) + species.spaceUnits <= t.capacity
    );
    if (compatible) {
      setDestTankId(compatible.id);
    } else if (tanks.length > 0) {
      setDestTankId(tanks[0].id);
    }
  };

  const handleConfirmBuyFish = async () => {
    if (!selectedSpeciesToBuy || !destTankId) return;
    setPurchasing(true);
    setBuyError(null);

    try {
      const res = await fetch("/api/fish/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speciesId: selectedSpeciesToBuy.id,
          tankId: destTankId,
          nickname: fishNickname.trim() || selectedSpeciesToBuy.name,
          sex: fishSex,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBuyError(data.error || "Failed to purchase fish.");
      } else {
        setBuySuccess(data.message || `Adopted ${selectedSpeciesToBuy.name}!`);
        await refreshGameData();
        setTimeout(() => {
          setSelectedSpeciesToBuy(null);
        }, 1200);
      }
    } catch {
      setBuyError("Network error occurred.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleBuyFoodPack = async (foodType: string) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodType }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to purchase food pack.");
      } else {
        alert(data.message);
        await refreshGameData();
      }
    } catch {
      alert("Network error.");
    }
  };

  // Filtered Species
  const filteredSpecies = speciesList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWater = selectedWaterType === "ALL" || s.waterType === selectedWaterType;
    const matchesRarity = selectedRarity === "ALL" || s.rarity === selectedRarity;
    return matchesSearch && matchesWater && matchesRarity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-cyan-400" />
            <span>Aquatics & Fish Emporium</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover and purchase fish species, tank upgrades, and premium nutritional feeds.
          </p>
        </div>

        {/* User Balance */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-sm shadow-md">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{user?.cpBalance.toLocaleString() || 0} CP Available</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyan-500/20 gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: "fish", label: `Fish Catalog (${speciesList.length})`, icon: Waves },
          { id: "food", label: "Food Supplies", icon: Droplets },
          { id: "tanks", label: "Tanks & Aquariums", icon: PlusCircle },
          { id: "equipment", label: "Equipment & Heaters", icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FISH SPECIES */}
      {activeTab === "fish" && (
        <div>
          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-2xl glass-panel border border-cyan-500/20">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search species (e.g. Goldfish, Betta, Tang, Piranha)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/60 border border-cyan-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Water Type Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "FRESHWATER", "SALTWATER", "BRACKISH"].map((wt) => (
                <button
                  key={wt}
                  onClick={() => setSelectedWaterType(wt)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                    selectedWaterType === wt
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-900/80 text-slate-400 hover:text-white"
                  }`}
                >
                  {wt.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Rarity Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["ALL", "COMMON", "UNCOMMON", "RARE", "LEGENDARY"].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRarity(r)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                    selectedRarity === r
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-900/80 text-slate-400 hover:text-white"
                  }`}
                >
                  {r.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Species Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSpecies.map((species) => {
              const canAfford = user ? user.cpBalance >= species.basePrice : false;

              return (
                <div
                  key={species.id}
                  className="rounded-2xl glass-panel p-4 border border-cyan-500/25 flex flex-col justify-between hover:border-cyan-400 hover:scale-[1.01] transition-all shadow-lg"
                >
                  <div>
                    {/* Header: Avatar, Name & Rarity */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow"
                          style={{
                            background: `linear-gradient(135deg, ${species.primaryColor}, ${species.secondaryColor})`,
                          }}
                        >
                          🐟
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-white leading-tight">
                            {species.name}
                          </h3>
                          <div className="text-[11px] text-cyan-300 font-medium mt-0.5">
                            {species.spaceUnits} space unit{species.spaceUnits > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getRarityBadgeColor(
                          species.rarity
                        )}`}
                      >
                        {species.rarity}
                      </span>
                    </div>

                    {/* Water Type & Behavior Badges */}
                    <div className="flex flex-wrap gap-1.5 my-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getWaterTypeColor(
                          species.waterType
                        )}`}
                      >
                        {species.waterType.toLowerCase()}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {species.social.toLowerCase()}
                      </span>
                      {species.predatory && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-500/40">
                          ⚔️ Predatory
                        </span>
                      )}
                    </div>

                    {/* Requirements & Feed info */}
                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-cyan-500/10 text-[11px] text-slate-300 space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Diet:</span>
                        <span className="font-semibold text-cyan-200 capitalize">
                          {species.foodType.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lifespan:</span>
                        <span className="font-semibold text-slate-200">
                          ~{species.lifespanDays} real days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Min Tank:</span>
                        <span className="font-semibold text-slate-200 capitalize">
                          {species.minTankSize.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Flavour description */}
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-3">
                      {species.description}
                    </p>
                  </div>

                  {/* Price & Buy Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Purchase Price:</div>
                      <div className="text-sm font-black text-amber-300 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>{species.basePrice} CP</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenBuyFish(species)}
                      disabled={!canAfford}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Adopt Fish</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FOOD SUPPLIES */}
      {activeTab === "food" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {foodCatalog.map((pack) => (
            <div
              key={pack.foodType}
              className="rounded-3xl glass-panel p-5 border border-cyan-500/25 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="text-4xl mb-3">{pack.icon}</div>
                <h3 className="font-extrabold text-base text-white mb-1">{pack.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                  +{pack.quantity} Servings
                </span>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {pack.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
                <div className="text-sm font-black text-amber-300">
                  {pack.price} CP
                </div>
                <button
                  onClick={() => handleBuyFoodPack(pack.foodType)}
                  className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 font-bold text-xs shadow-md transition-colors"
                >
                  Buy Pack
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TANKS & AQUARIUMS */}
      {activeTab === "tanks" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tankCatalog.map((tank) => (
            <div
              key={tank.size}
              className="rounded-3xl glass-panel p-6 border border-cyan-500/25 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="text-3xl mb-2">🌊</div>
                <h3 className="font-extrabold text-lg text-white mb-1">{tank.name}</h3>
                <div className="text-xs text-cyan-300 font-semibold mb-3">
                  Capacity: {tank.capacity} Space Units
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {tank.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-base font-black text-amber-300">
                  {tank.price} CP
                </div>
                <button
                  onClick={() => {
                    // Quick modal or action
                    window.location.href = "/";
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md"
                >
                  Build from Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: EQUIPMENT & ACCESSORIES */}
      {activeTab === "equipment" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {upgradesCatalog.map((up) => (
            <div
              key={up.id}
              className="rounded-3xl glass-panel p-6 border border-cyan-500/25 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-extrabold text-lg text-white mb-1">{up.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{up.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-base font-black text-amber-300">{up.price} CP</div>
                <div className="text-xs text-slate-400">
                  Configured on tank creation or settings
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUY FISH CONFIRMATION MODAL */}
      {selectedSpeciesToBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-dropdown border border-cyan-500/40 p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-1">
              Adopt {selectedSpeciesToBuy.name}
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Select destination tank and assign an optional nickname.
            </p>

            {buyError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{buyError}</span>
              </div>
            )}

            {buySuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{buySuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Nickname */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fish Nickname
                </label>
                <input
                  type="text"
                  value={fishNickname}
                  onChange={(e) => setFishNickname(e.target.value)}
                  placeholder={selectedSpeciesToBuy.name}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none"
                />
              </div>

              {/* Gender (Sex) Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Gender (For Breeding)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFishSex("FEMALE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      fishSex === "FEMALE"
                        ? "bg-pink-500/25 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>♀ Female</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFishSex("MALE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      fishSex === "MALE"
                        ? "bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>♂ Male</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFishSex("RANDOM")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      fishSex === "RANDOM"
                        ? "bg-purple-500/25 border-purple-400 text-purple-200"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>🎲 Any</span>
                  </button>
                </div>
              </div>

              {/* Target Tank Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination Tank
                </label>
                <select
                  value={destTankId}
                  onChange={(e) => setDestTankId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none"
                >
                  {tanks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.waterType.toLowerCase()} • {t.capacityUsed || 0}/{t.capacity} used)
                    </option>
                  ))}
                </select>
              </div>

              {/* Compatibility Check Preview */}
              <div className="p-3 rounded-2xl bg-slate-950/50 border border-cyan-500/20 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Species Water:</span>
                  <span className="font-semibold text-white capitalize">
                    {selectedSpeciesToBuy.waterType.toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Required Space:</span>
                  <span className="font-semibold text-white">
                    {selectedSpeciesToBuy.spaceUnits} unit(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setSelectedSpeciesToBuy(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmBuyFish}
                disabled={purchasing || (user ? user.cpBalance < selectedSpeciesToBuy.basePrice : true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40"
              >
                {purchasing ? "Adopting..." : `Confirm (${selectedSpeciesToBuy.basePrice} CP)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

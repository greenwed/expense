"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { MarketplaceListingData, FishData } from "@/lib/types";
import {
  ShoppingBag,
  Coins,
  Search,
  PlusCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
} from "lucide-react";
import {
  formatAge,
  getRarityBadgeColor,
  getWaterTypeColor,
  getHealthColor,
} from "@/lib/utils";

export default function MarketplacePage() {
  const { user, tanks, refreshGameData } = useGame();
  const [listings, setListings] = useState<MarketplaceListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // List Fish Modal State
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedFishIdToList, setSelectedFishIdToList] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [submittingListing, setSubmittingListing] = useState(false);

  // Buy Modal State
  const [selectedListingToBuy, setSelectedListingToBuy] = useState<MarketplaceListingData | null>(null);
  const [buyTargetTankId, setBuyTargetTankId] = useState("");
  const [purchasing, setPurchasing] = useState(false);

  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const fetchListings = async () => {
    try {
      const res = await fetch("/api/marketplace");
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (tanks.length > 0 && !buyTargetTankId) {
      setBuyTargetTankId(tanks[0].id);
    }
  }, [tanks, buyTargetTankId]);

  // All alive fish the user owns that aren't already listed or breeding
  const myEligibleFish = tanks
    .flatMap((t) => t.fish)
    .filter((f) => !f.isListed && !f.isBreeding);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFishIdToList || !listingPrice) return;

    setSubmittingListing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fishId: selectedFishIdToList,
          price: parseInt(listingPrice, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to list fish." });
      } else {
        setMessage({ type: "success", text: data.message });
        setIsListModalOpen(false);
        setSelectedFishIdToList("");
        setListingPrice("");
        await Promise.all([fetchListings(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setSubmittingListing(false);
    }
  };

  const handleBuyListing = async () => {
    if (!selectedListingToBuy || !buyTargetTankId) return;

    setPurchasing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/marketplace/${selectedListingToBuy.id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTankId: buyTargetTankId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to buy listing." });
      } else {
        setMessage({ type: "success", text: data.message });
        setSelectedListingToBuy(null);
        await Promise.all([fetchListings(), refreshGameData()]);
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setPurchasing(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    try {
      const res = await fetch(`/api/marketplace/${listingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await Promise.all([fetchListings(), refreshGameData()]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredListings = listings.filter((l) => {
    const term = searchQuery.toLowerCase();
    return (
      l.fish.nickname.toLowerCase().includes(term) ||
      l.fish.species.name.toLowerCase().includes(term) ||
      l.seller.username.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-cyan-400" />
            <span>Peer-to-Peer Aquatic Marketplace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Buy and trade rare cultivated fish directly with other aquarists. 10% platform fee on sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{user?.cpBalance.toLocaleString() || 0} CP Balance</span>
          </div>

          <button
            onClick={() => setIsListModalOpen(true)}
            disabled={myEligibleFish.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 font-bold text-xs text-white shadow-md transition-transform hover:scale-105 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Tag className="w-4 h-4" />
            <span>List My Fish</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-3 rounded-2xl border text-xs flex items-center justify-between ${
            message.type === "error"
              ? "bg-rose-950/80 border-rose-500/50 text-rose-200"
              : "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 p-3 rounded-2xl glass-panel border border-cyan-500/20 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by nickname, species, or seller..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/60 border border-cyan-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-cyan-500/20">
          <div className="text-4xl mb-2">🏷️</div>
          <h3 className="font-extrabold text-white text-base">No active marketplace listings</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Be the first to list a cultivated fish for sale!
          </p>
          {myEligibleFish.length > 0 && (
            <button
              onClick={() => setIsListModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow-md"
            >
              List a Fish for CP
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredListings.map((listing) => {
            const isOwner = user?.id === listing.sellerId;
            const healthInfo = getHealthColor(listing.fish.health);
            const canAfford = user ? user.cpBalance >= listing.price : false;

            return (
              <div
                key={listing.id}
                className="rounded-3xl glass-panel p-4 border border-cyan-500/25 flex flex-col justify-between shadow-xl hover:border-cyan-400 transition-all"
              >
                <div>
                  {/* Top: Avatar, Nickname & Rarity */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow"
                        style={{
                          background: `linear-gradient(135deg, ${listing.fish.species.primaryColor}, ${listing.fish.species.secondaryColor})`,
                        }}
                      >
                        🐟
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-white leading-tight">
                          {listing.fish.nickname}
                        </h3>
                        <div className="text-[11px] text-cyan-300 font-medium">
                          {listing.fish.species.name}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getRarityBadgeColor(
                        listing.fish.species.rarity
                      )}`}
                    >
                      {listing.fish.species.rarity}
                    </span>
                  </div>

                  {/* Seller & Water details */}
                  <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                    <span className="text-[10px] text-slate-300 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                      Seller: <strong className="text-cyan-300">@{listing.seller.username}</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getWaterTypeColor(
                        listing.fish.species.waterType
                      )}`}
                    >
                      {listing.fish.species.waterType.toLowerCase()}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-cyan-500/10 text-[11px] text-slate-300 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Health:</span>
                      <span className={`font-bold ${healthInfo.text}`}>
                        {Math.round(listing.fish.health)}% HP
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Age:</span>
                      <span className="font-semibold text-slate-200">
                        {formatAge(listing.fish.bornAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400">Price:</div>
                    <div className="text-sm font-black text-amber-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{listing.price} CP</span>
                    </div>
                  </div>

                  {isOwner ? (
                    <button
                      onClick={() => handleCancelListing(listing.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-colors"
                    >
                      Delist
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedListingToBuy(listing)}
                      disabled={!canAfford}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40"
                    >
                      Buy Fish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST FISH MODAL */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-dropdown border border-cyan-500/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
              <h3 className="text-base font-black text-white">List Fish for CP</h3>
              <button
                onClick={() => setIsListModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              {/* Select Fish */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Choose Fish to List
                </label>
                <select
                  value={selectedFishIdToList}
                  onChange={(e) => setSelectedFishIdToList(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none"
                  required
                >
                  <option value="">-- Select Fish --</option>
                  {myEligibleFish.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nickname} ({f.species.name} • {Math.round(f.health)}% HP)
                    </option>
                  ))}
                </select>
              </div>

              {/* Price in CP */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sale Price (in CP)
                </label>
                <input
                  type="number"
                  min="1"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none"
                  required
                />
              </div>

              {/* Fee Breakdown Preview */}
              {listingPrice && parseInt(listingPrice, 10) > 0 && (
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-cyan-500/20 text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Listing Price:</span>
                    <span className="font-bold text-white">{listingPrice} CP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Platform Fee (10%):</span>
                    <span>-{Math.floor(parseInt(listingPrice, 10) * 0.1)} CP</span>
                  </div>
                  <div className="flex justify-between font-black text-amber-300 pt-1 border-t border-slate-800">
                    <span>You Receive:</span>
                    <span>
                      {parseInt(listingPrice, 10) - Math.floor(parseInt(listingPrice, 10) * 0.1)} CP
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingListing || !selectedFishIdToList || !listingPrice}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md disabled:opacity-40"
              >
                {submittingListing ? "Listing..." : "Post to Marketplace"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BUY CONFIRMATION MODAL */}
      {selectedListingToBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-dropdown border border-cyan-500/40 p-6 shadow-2xl">
            <h3 className="text-base font-black text-white mb-1">
              Purchase {selectedListingToBuy.fish.nickname}?
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Select destination tank for this {selectedListingToBuy.fish.species.name}.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination Tank
                </label>
                <select
                  value={buyTargetTankId}
                  onChange={(e) => setBuyTargetTankId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs focus:outline-none"
                >
                  {tanks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.waterType.toLowerCase()} • {t.capacityUsed || 0}/{t.capacity} used)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedListingToBuy(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleBuyListing}
                disabled={purchasing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md disabled:opacity-40"
              >
                {purchasing ? "Processing..." : `Confirm Buy (${selectedListingToBuy.price} CP)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

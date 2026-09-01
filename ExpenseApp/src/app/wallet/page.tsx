"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { CPTransactionData } from "@/lib/types";
import {
  Wallet,
  Coins,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  History,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

const CP_PACKS = [
  {
    id: "pack_1",
    name: "Starter Pouch",
    cp: 150,
    priceUsd: 1.0,
    bonus: "Standard Tier",
    badge: null,
    icon: "🪙",
  },
  {
    id: "pack_5",
    name: "Aquarist Chest",
    cp: 800,
    priceUsd: 5.0,
    bonus: "+50 CP Extra Bonus",
    badge: "MOST POPULAR",
    icon: "💎",
  },
  {
    id: "pack_20",
    name: "Ocean Treasury",
    cp: 3500,
    priceUsd: 20.0,
    bonus: "+500 CP Mega Bonus",
    badge: "BEST VALUE",
    icon: "👑",
  },
];

export default function WalletPage() {
  const { user, refreshGameData } = useGame();
  const [transactions, setTransactions] = useState<CPTransactionData[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [processingPackId, setProcessingPackId] = useState<string | null>(null);
  const [isSandboxMode, setIsSandboxMode] = useState(true);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/user/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Check query params for checkout success
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      setMessage({
        type: "success",
        text: "Payment completed successfully! Credit Points have been credited.",
      });
      refreshGameData();
    }
  }, []);

  const handleBuyCP = async (packId: string) => {
    setProcessingPackId(packId);
    setMessage(null);

    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId,
          isSandbox: isSandboxMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Payment checkout failed." });
      } else {
        if (data.mode === "stripe" && data.url) {
          // Redirect to official Stripe Checkout page
          window.location.href = data.url;
        } else {
          // Instant Sandbox fulfillment
          setMessage({
            type: "success",
            text: data.message || "Simulated payment successful! +CP added.",
          });
          await Promise.all([refreshGameData(), fetchTransactions()]);
        }
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setProcessingPackId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header & Balance Banner */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Wallet className="w-6 h-6 text-amber-400" />
              <span>Credit Points (CP) Wallet</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely purchase CP top-ups with Stripe or test instantly with Sandbox simulator.
            </p>
          </div>

          {/* Sandbox toggle */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-900 border border-cyan-500/20 text-xs">
            <span className="text-slate-400 font-medium">Mode:</span>
            <button
              onClick={() => setIsSandboxMode(true)}
              className={`px-2.5 py-1 rounded-xl font-bold transition-colors ${
                isSandboxMode
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Instant Sandbox
            </button>
            <button
              onClick={() => setIsSandboxMode(false)}
              className={`px-2.5 py-1 rounded-xl font-bold transition-colors ${
                !isSandboxMode
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Live Stripe
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

        {/* Balance Card */}
        <div className="rounded-3xl glass-panel p-6 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              🪙
            </div>
            <div>
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                Current Balance
              </div>
              <div className="text-3xl font-black text-white text-gold-glow">
                {user?.cpBalance.toLocaleString() || 0}{" "}
                <span className="text-amber-400 text-lg font-bold">CP</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 max-w-sm leading-relaxed">
            Credit Points fuel your aquarium expansion — purchase exotic species, spacious tanks,
            and high-grade nutritious feeds.
          </div>
        </div>
      </div>

      {/* CP Packs Grid */}
      <div className="mb-10">
        <h2 className="text-sm font-extrabold text-cyan-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Select Top-Up Package</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CP_PACKS.map((pack) => {
            const isProcessing = processingPackId === pack.id;

            return (
              <div
                key={pack.id}
                className={`relative rounded-3xl glass-panel p-6 border flex flex-col justify-between shadow-xl transition-all hover:scale-[1.02] ${
                  pack.badge
                    ? "border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                    : "border-cyan-500/25"
                }`}
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] shadow-md uppercase tracking-wider">
                    {pack.badge}
                  </div>
                )}

                <div>
                  <div className="text-4xl mb-3">{pack.icon}</div>
                  <h3 className="font-extrabold text-lg text-white mb-1">{pack.name}</h3>
                  <div className="text-2xl font-black text-amber-300 mb-1">
                    +{pack.cp.toLocaleString()} CP
                  </div>
                  <div className="text-[11px] text-cyan-300 font-semibold mb-4">{pack.bonus}</div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xl font-black text-white">
                    ${pack.priceUsd.toFixed(2)} USD
                  </div>

                  <button
                    onClick={() => handleBuyCP(pack.id)}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:scale-105 active:scale-95 font-black text-xs text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isProcessing ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Top Up</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-extrabold text-white">Transaction History Ledger</h2>
          </div>
          <span className="text-xs text-slate-400">{transactions.length} record(s)</span>
        </div>

        {loadingTx ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading ledger...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        isCredit
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {isCredit ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {tx.type} • {formatTimeAgo(tx.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`font-black text-sm text-right whitespace-nowrap ${
                      isCredit ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isCredit ? `+${tx.amount}` : tx.amount} CP
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

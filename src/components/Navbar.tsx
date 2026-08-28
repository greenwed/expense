"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGame } from "@/context/GameContext";
import TimeMachineModal from "@/components/TimeMachineModal";
import {
  Waves,
  Coins,
  Store,
  HeartHandshake,
  ShoppingBag,
  Package,
  Wallet,
  User,
  Bell,
  CheckCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  FastForward,
  Briefcase,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const { user, tanks, inventory, selectedTankId, setSelectedTankId, unreadCount, notifications, refreshGameData, logout } = useGame();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTankSelector, setShowTankSelector] = useState(false);
  const [isTimeMachineOpen, setIsTimeMachineOpen] = useState(false);

  const totalFoodQuantity = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalFoodMax = inventory.reduce((sum, i) => sum + (i.maxQuantity || 25), 0) || 100;
  const overallFoodPercent = Math.min(100, Math.round((totalFoodQuantity / totalFoodMax) * 100));

  const navLinks = [
    { href: "/", label: "Aquarium", icon: Waves },
    { href: "/desk", label: "Desk", icon: Briefcase },
    { href: "/shop", label: "Shop", icon: Store },
    { href: "/breeding", label: "Breeding", icon: HeartHandshake },
    { href: "/marketplace", label: "Market", icon: ShoppingBag },
    {
      href: "/inventory",
      label: `Food (${overallFoodPercent}%)`,
      icon: Package,
      badge: `${totalFoodQuantity} feeds`,
    },
    { href: "/wallet", label: "CP Wallet", icon: Wallet },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    refreshGameData();
  };

  const selectedTank = tanks.find((t) => t.id === selectedTankId) || (tanks.length > 0 ? tanks[0] : null);

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-cyan-500/20 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Tank Selector */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-500 to-teal-400 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-300 font-black text-xl">
                🐠
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300 bg-clip-text text-transparent">
              FISH
            </span>
          </Link>

          {/* Active Tank Dropdown */}
          {user && tanks.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTankSelector(!showTankSelector)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/60 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>{selectedTank?.name || "Select Tank"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              {showTankSelector && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl glass-dropdown p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase px-2 py-1">
                    Your Tanks ({tanks.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {tanks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTankId(t.id);
                          setShowTankSelector(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          t.id === selectedTankId
                            ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40"
                            : "text-slate-300 hover:bg-slate-800/60"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {t.waterType.toLowerCase()} • {t.fish.length} fish
                          </div>
                        </div>
                        {t.hasDangerFish && <span className="text-xs">⚠️</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Main Navigation Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950/40 p-1 rounded-2xl border border-cyan-500/15">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                    : "text-slate-300 hover:text-cyan-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: Time Machine Tester, CP Wallet Pill, Notifications, User Menu */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Testing Time Machine Button (Restricted to karthikjay1202@gmail.com) */}
              {user.email?.toLowerCase() === "karthikjay1202@gmail.com" && (
                <button
                  onClick={() => setIsTimeMachineOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs shadow-sm transition-all hover:scale-105"
                  title="Testing Simulator: Fast-forward clock to test decay, dirty tanks & aging"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Time Machine</span>
                </button>
              )}

              {/* CP Balance Pill */}
              <Link
                href="/wallet"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:scale-105 transition-transform"
              >
                <Coins className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>{user.cpBalance.toLocaleString()} CP</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-md font-semibold hover:bg-amber-400/40">
                  + Add
                </span>
              </Link>

              {/* Notifications Center */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-slate-300 hover:text-cyan-200 hover:bg-cyan-950/40 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl glass-dropdown p-3 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                      <span className="font-bold text-xs text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 mt-2">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 15).map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl text-xs transition-colors ${
                              !n.read
                                ? "bg-cyan-950/40 border border-cyan-500/30 text-cyan-100"
                                : "bg-slate-900/40 text-slate-400"
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {formatTimeAgo(n.createdAt)}
                              </span>
                            </div>
                            <div className="text-[11px] mt-0.5 text-slate-300 leading-relaxed">
                              {n.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 hidden md:block">
                    {user.username}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl glass-dropdown p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-2 py-1.5 text-xs text-slate-400 border-b border-slate-700/60 mb-1">
                      Signed in as <strong className="text-cyan-300">{user.username}</strong>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-cyan-950/60 hover:text-cyan-200 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" /> My Profile
                    </Link>
                    <Link
                      href="/wallet"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-cyan-950/60 hover:text-cyan-200 flex items-center gap-2"
                    >
                      <Coins className="w-3.5 h-3.5" /> Wallet & Top-up
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 mt-1 border-t border-slate-700/60 pt-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-cyan-200 hover:bg-cyan-950/40 border border-cyan-500/30 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform"
              >
                Sign Up (+100 CP)
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="lg:hidden flex items-center justify-around mt-2 pt-2 border-t border-cyan-500/10">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium p-1 transition-colors ${
                isActive ? "text-cyan-300 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Time Machine Modal */}
      <TimeMachineModal
        isOpen={isTimeMachineOpen}
        onClose={() => setIsTimeMachineOpen(false)}
      />
    </nav>
  );
}

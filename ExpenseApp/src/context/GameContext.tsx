"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { TankData, FishData, FoodInventoryData, NotificationData } from "@/lib/types";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  cpBalance: number;
  aliveFishCount: number;
  deadFishCount: number;
  totalFishEver: number;
  unreadNotificationsCount: number;
}

interface GameContextType {
  user: UserProfile | null;
  loading: boolean;
  tanks: TankData[];
  selectedTankId: string | null;
  selectedTank: TankData | null;
  inventory: FoodInventoryData[];
  notifications: NotificationData[];
  unreadCount: number;
  selectedFishForModal: FishData | null;
  setSelectedFishForModal: (fish: FishData | null) => void;
  setSelectedTankId: (id: string) => void;
  refreshGameData: () => Promise<void>;
  feedFish: (fishId: string) => Promise<{ success: boolean; message?: string }>;
  feedTank: (tankId: string) => Promise<{ success: boolean; message?: string }>;
  cleanTank: (tankId: string, method: "free" | "instant") => Promise<{ success: boolean; message?: string }>;
  sellFish: (fishId: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tanks, setTanks] = useState<TankData[]>([]);
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<FoodInventoryData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [selectedFishForModal, setSelectedFishForModal] = useState<FishData | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const fetchTanks = useCallback(async () => {
    try {
      const res = await fetch("/api/tanks");
      if (res.ok) {
        const data = await res.json();
        setTanks(data.tanks || []);
        if (data.tanks?.length > 0) {
          setSelectedTankId((prev) => {
            if (prev && data.tanks.some((t: TankData) => t.id === prev)) {
              return prev;
            }
            return data.tanks[0].id;
          });
        }
      }
    } catch (e) {
      console.error("Error fetching tanks:", e);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
      }
    } catch (e) {
      console.error("Error fetching inventory:", e);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  }, []);

  const refreshGameData = useCallback(async () => {
    await Promise.all([
      fetchUserData(),
      fetchTanks(),
      fetchInventory(),
      fetchNotifications(),
    ]);
  }, [fetchUserData, fetchTanks, fetchInventory, fetchNotifications]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshGameData();
      setLoading(false);
    };
    init();

    // Auto-refresh simulation tick every 30 seconds while user has the game open
    const interval = setInterval(() => {
      refreshGameData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshGameData]);

  const selectedTank = tanks.find((t) => t.id === selectedTankId) || (tanks.length > 0 ? tanks[0] : null);

  const feedFish = async (fishId: string) => {
    try {
      const res = await fetch(`/api/fish/${fishId}/feed`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || "Failed to feed fish." };
      }
      await refreshGameData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  const feedTank = async (tankId: string) => {
    try {
      const res = await fetch(`/api/tanks/${tankId}/feed`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || "Failed to feed tank." };
      }
      await refreshGameData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  const cleanTank = async (tankId: string, method: "free" | "instant") => {
    try {
      const res = await fetch(`/api/tanks/${tankId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clean", method }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || "Failed to clean tank." };
      }
      await refreshGameData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  const sellFish = async (fishId: string) => {
    try {
      const res = await fetch(`/api/fish/${fishId}/sell`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || "Failed to sell fish." };
      }
      await refreshGameData();
      if (selectedFishForModal?.id === fishId) {
        setSelectedFishForModal(null);
      }
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <GameContext.Provider
      value={{
        user,
        loading,
        tanks,
        selectedTankId,
        selectedTank,
        inventory,
        notifications,
        unreadCount,
        selectedFishForModal,
        setSelectedFishForModal,
        setSelectedTankId,
        refreshGameData,
        feedFish,
        feedTank,
        cleanTank,
        sellFish,
        logout,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

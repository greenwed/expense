import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tag,
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  Coffee,
  Briefcase,
  Dumbbell,
  Fuel,
  Home,
  Gift,
  GraduationCap,
  Gamepad2,
  Plane,
  Wifi,
  BookOpen,
  Music,
  Camera,
  PawPrint,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { CATEGORY_CONFIG, CATEGORY_PALETTE, getCategoryConfig } from '../utils/formatters';

export const ICON_COMPONENTS = {
  Tag,
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  Coffee,
  Briefcase,
  Dumbbell,
  Fuel,
  Home,
  Gift,
  GraduationCap,
  Gamepad2,
  Plane,
  Wifi,
  BookOpen,
  Music,
  Camera,
  PawPrint,
  DollarSign,
  MoreHorizontal
};

const STANDARD_CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Medical', 'Transport', 'Others'];

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
  const { user, apiFetch } = useAuth();
  const [customCategories, setCustomCategories] = useState([]);
  const [groupCategoriesMap, setGroupCategoriesMap] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCustomCategories([]);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch('/api/personal/categories');
      if (res && res.custom && Array.isArray(res.custom)) {
        setCustomCategories(res.custom);
      }
    } catch (err) {
      console.error('Failed to load custom categories:', err);
    } finally {
      setLoading(false);
    }
  }, [user, apiFetch]);

  const fetchGroupCategories = useCallback(async (groupId, isSplit = false) => {
    if (!groupId || !user) return;
    const isSplitGroup = isSplit || String(groupId).startsWith('spg_');
    const endpoint = isSplitGroup
      ? `/api/split/groups/${groupId}/categories`
      : `/api/family/groups/${groupId}/categories`;
    try {
      const res = await apiFetch(endpoint);
      if (res && res.custom && Array.isArray(res.custom)) {
        setGroupCategoriesMap(prev => ({
          ...prev,
          [groupId]: res.custom
        }));
      }
    } catch (err) {
      console.error(`Failed to load categories for group ${groupId}:`, err);
    }
  }, [user, apiFetch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const getCustomCategories = useCallback((groupId = null) => {
    if (groupId && groupCategoriesMap[groupId]) {
      return groupCategoriesMap[groupId];
    }
    return customCategories;
  }, [groupCategoriesMap, customCategories]);

  const getCategoryList = useCallback((groupId = null) => {
    const list = getCustomCategories(groupId);
    const customNames = list.map(c => c.name);
    return [...STANDARD_CATEGORIES, ...customNames];
  }, [getCustomCategories]);

  const addCategory = useCallback(async ({ name, color, icon, groupId = null, isSplit = false }) => {
    if (groupId) {
      const isSplitGroup = isSplit || String(groupId).startsWith('spg_');
      const endpoint = isSplitGroup
        ? `/api/split/groups/${groupId}/categories`
        : `/api/family/groups/${groupId}/categories`;
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ name, color, icon })
      });
      if (data && data.category) {
        setGroupCategoriesMap(prev => {
          const currentList = prev[groupId] || [];
          const filtered = currentList.filter(c => c.id !== data.category.id);
          return {
            ...prev,
            [groupId]: [...filtered, data.category]
          };
        });
        return data.category;
      }
      throw new Error('Failed to create group category.');
    }

    const data = await apiFetch('/api/personal/categories', {
      method: 'POST',
      body: JSON.stringify({ name, color, icon })
    });
    if (data && data.category) {
      setCustomCategories(prev => {
        const filtered = prev.filter(c => c.id !== data.category.id);
        return [...filtered, data.category];
      });
      return data.category;
    }
    throw new Error('Failed to create category.');
  }, [apiFetch]);

  const updateCategory = useCallback(async (id, { name, color, icon, groupId = null, isSplit = false }) => {
    if (groupId) {
      const isSplitGroup = isSplit || String(groupId).startsWith('spg_');
      const endpoint = isSplitGroup
        ? `/api/split/groups/${groupId}/categories/${id}`
        : `/api/family/groups/${groupId}/categories/${id}`;
      const data = await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ name, color, icon })
      });
      if (data && data.category) {
        setGroupCategoriesMap(prev => {
          const currentList = prev[groupId] || [];
          return {
            ...prev,
            [groupId]: currentList.map(c => (c.id === id ? data.category : c))
          };
        });
        return data.category;
      }
      throw new Error('Failed to update group category.');
    }

    const data = await apiFetch(`/api/personal/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, color, icon })
    });
    if (data && data.category) {
      setCustomCategories(prev => {
        return prev.map(c => (c.id === id ? data.category : c));
      });
      return data.category;
    }
    throw new Error('Failed to update category.');
  }, [apiFetch]);

  const deleteCategory = useCallback(async (id, groupId = null, isSplit = false) => {
    if (groupId) {
      const isSplitGroup = isSplit || String(groupId).startsWith('spg_');
      const endpoint = isSplitGroup
        ? `/api/split/groups/${groupId}/categories/${id}`
        : `/api/family/groups/${groupId}/categories/${id}`;
      await apiFetch(endpoint, {
        method: 'DELETE'
      });
      setGroupCategoriesMap(prev => {
        const currentList = prev[groupId] || [];
        return {
          ...prev,
          [groupId]: currentList.filter(c => c.id !== id)
        };
      });
      return;
    }

    await apiFetch(`/api/personal/categories/${id}`, {
      method: 'DELETE'
    });
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  }, [apiFetch]);

  const categories = useMemo(() => {
    const customNames = customCategories.map(c => c.name);
    return [...STANDARD_CATEGORIES, ...customNames];
  }, [customCategories]);

  const getCategoryMeta = useCallback((catName, groupId = null) => {
    const activeList = groupId && groupCategoriesMap[groupId]
      ? groupCategoriesMap[groupId]
      : customCategories;
    const conf = getCategoryConfig(catName, activeList);
    const IconComponent = ICON_COMPONENTS[conf.icon] || Tag;
    return {
      ...conf,
      IconComponent
    };
  }, [groupCategoriesMap, customCategories]);

  const value = useMemo(() => ({
    categories,
    customCategories,
    groupCategoriesMap,
    getCategoryList,
    getCustomCategories,
    fetchGroupCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryMeta,
    refreshCategories: fetchCategories,
    standardCategories: STANDARD_CATEGORIES,
    palette: CATEGORY_PALETTE,
    iconComponents: ICON_COMPONENTS
  }), [
    categories,
    customCategories,
    groupCategoriesMap,
    getCategoryList,
    getCustomCategories,
    fetchGroupCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryMeta,
    fetchCategories
  ]);

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}

export default CategoryContext;

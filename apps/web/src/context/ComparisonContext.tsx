'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ComparisonProperty {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
}

interface ComparisonContextType {
  comparisonIds: string[];
  comparisonProperties: ComparisonProperty[];
  addToComparison: (property: ComparisonProperty) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  isInComparison: (id: string) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_COMPARISON = 4;
const STORAGE_KEY = 'property-comparison';

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [comparisonProperties, setComparisonProperties] = useState<ComparisonProperty[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setComparisonProperties(data);
        setComparisonIds(data.map((p: ComparisonProperty) => p.id));
      } catch (error) {
        // Invalid data - will start fresh
      }
    }
  }, []);

  // Save to localStorage whenever comparison changes
  useEffect(() => {
    if (comparisonProperties.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonProperties));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [comparisonProperties]);

  const addToComparison = (property: ComparisonProperty) => {
    if (comparisonIds.includes(property.id)) {
      return; // Already in comparison
    }

    if (comparisonIds.length >= MAX_COMPARISON) {
      alert(`Вы можете сравнить максимум ${MAX_COMPARISON} объекта`);
      return;
    }

    setComparisonProperties((prev) => [...prev, property]);
    setComparisonIds((prev) => [...prev, property.id]);
  };

  const removeFromComparison = (id: string) => {
    setComparisonProperties((prev) => prev.filter((p) => p.id !== id));
    setComparisonIds((prev) => prev.filter((pid) => pid !== id));
  };

  const clearComparison = () => {
    setComparisonProperties([]);
    setComparisonIds([]);
  };

  const isInComparison = (id: string) => {
    return comparisonIds.includes(id);
  };

  const canAddMore = comparisonIds.length < MAX_COMPARISON;

  return (
    <ComparisonContext.Provider
      value={{
        comparisonIds,
        comparisonProperties,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}

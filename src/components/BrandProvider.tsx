"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ITenantConfig } from "@/lib/types";

const defaultBrandConfig: ITenantConfig = {
  storeName: "jari",
  tagline: "Coffee House & Pastry",
  logoUrl: "/logo.png",
  primaryColor: "#0A52A9",
  accentColor: "#F4EECF",
  terracottaColor: "#0A52A9",
  currency: "JOD",
  pointsPerUnit: 10,
  discountPer100Pts: 1.0,
  welcomeBonusPts: 50,
};

interface BrandContextType {
  config: ITenantConfig;
  refreshConfig: () => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatPointsValue: (points: number) => string;
}

const BrandContext = createContext<BrandContextType>({
  config: defaultBrandConfig,
  refreshConfig: async () => {},
  formatCurrency: (amount: number) => `${amount.toFixed(3)} JOD`,
  formatPointsValue: (points: number) => `${((points / 100) * 1.0).toFixed(3)} JOD`,
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ITenantConfig>(defaultBrandConfig);

  const refreshConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      console.warn("Using default brand config:", e);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(3)} ${config.currency}`;
  };

  const formatPointsValue = (points: number): string => {
    const rate = config.discountPer100Pts || 1.0;
    const value = (points / 100) * rate;
    return `${value.toFixed(3)} ${config.currency}`;
  };

  return (
    <BrandContext.Provider
      value={{
        config,
        refreshConfig,
        formatCurrency,
        formatPointsValue,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}

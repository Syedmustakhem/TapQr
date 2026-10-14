// src/hooks/useCurrentBusiness.ts
//
// Shared "current business" selection for dashboard-area
// screens. Mirrors the web dashboard, which persists the
// selected business id in localStorage under
// "tapqr_current_business_id".

import {
  useEffect,
  useState,
} from "react";

import { useQuery } from "@tanstack/react-query";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Business,
  getBusinesses,
} from "../api/businessApi";

const STORAGE_KEY =
  "tapqr_current_business_id";

export type CurrentBusiness = {
  businesses: Business[];
  business: Business | null;
  businessId: string | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useCurrentBusiness(): CurrentBusiness {
  const [
    businessId,
    setBusinessId,
  ] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["businesses"],
    queryFn: getBusinesses,
    staleTime: 60 * 1000,
  });

  const businesses = query.data ?? [];

  useEffect(() => {
    let active = true;

    (async () => {
      if (!businesses.length) {
        if (active) {
          setBusinessId(null);
        }

        return;
      }

      let stored: string | null =
        null;

      try {
        stored =
          await AsyncStorage.getItem(
            STORAGE_KEY
          );
      } catch {
        stored = null;
      }

      const match = businesses.find(
        (item) => item.id === stored
      );

      const next =
        match?.id ?? businesses[0].id;

      if (active) {
        setBusinessId(next);
      }

      if (!match) {
        try {
          await AsyncStorage.setItem(
            STORAGE_KEY,
            next
          );
        } catch {
          // Selection persistence is best-effort.
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [businesses]);

  return {
    businesses,
    business:
      businesses.find(
        (item) => item.id === businessId
      ) ?? null,
    businessId,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}

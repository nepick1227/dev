"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Store } from "@/types/database";
import type { Category } from "@/features/home/types";

export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

const PAGE_SIZE = 20;
const MAX_PAGES = 3;

export function useMapStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const lastBounds = useRef<MapBounds | null>(null);
  const lastCategory = useRef<Category>("all");

  const fetchStores = useCallback(async (
    bounds: MapBounds,
    category: Category,
    pageNum: number = 0
  ) => {
    lastBounds.current = bounds;
    lastCategory.current = category;
    setIsLoading(true);

    try {
      const supabase = createClient();
      let query = supabase
        .from("stores")
        .select("*", { count: "exact" })
        .gte("lat", bounds.sw.lat)
        .lte("lat", bounds.ne.lat)
        .gte("lng", bounds.sw.lng)
        .lte("lng", bounds.ne.lng)
        .order("score", { ascending: false })
        .range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1);

      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setStores((data as Store[]) ?? []);
      setPage(pageNum);
      const total = Math.min(Math.ceil((count ?? 0) / PAGE_SIZE), MAX_PAGES);
      setTotalPages(Math.max(total, 1));
    } catch {
      setStores([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToPage = useCallback((pageNum: number) => {
    if (!lastBounds.current) return;
    fetchStores(lastBounds.current, lastCategory.current, pageNum);
  }, [fetchStores]);

  return { stores, isLoading, page, totalPages, fetchStores, goToPage };
}

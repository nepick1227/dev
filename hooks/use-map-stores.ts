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
const DESKTOP_FETCH_SIZE = 500;
const MARKER_GRID_COLUMNS = 6;
const MARKER_GRID_ROWS = 5;
const MARKER_STORES_PER_CELL = 4;
const MAX_PAGES = 3;

function uniqueStoresById(stores: Store[]): Store[] {
  const unique = new Map<number, Store>();
  stores.forEach((store) => {
    if (!unique.has(store.id)) unique.set(store.id, store);
  });
  return Array.from(unique.values());
}

export function useMapStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [accumulatedStores, setAccumulatedStores] = useState<Store[]>([]);
  const [markerCandidateStores, setMarkerCandidateStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const lastBounds = useRef<MapBounds | null>(null);
  const lastCategory = useRef<Category>("all");

  const fetchStores = useCallback(async (
    bounds: MapBounds,
    category: Category,
    pageNum: number = 0,
    pageSize: number = PAGE_SIZE
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
        .range(pageNum * pageSize, pageNum * pageSize + pageSize - 1);

      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const newStores = (data as Store[]) ?? [];
      let nextMarkerCandidates = newStores;

      if (pageNum === 0) {
        const latStep = (bounds.ne.lat - bounds.sw.lat) / MARKER_GRID_ROWS;
        const lngStep = (bounds.ne.lng - bounds.sw.lng) / MARKER_GRID_COLUMNS;
        const markerQueries = Array.from({ length: MARKER_GRID_ROWS * MARKER_GRID_COLUMNS }, (_, idx) => {
          const row = Math.floor(idx / MARKER_GRID_COLUMNS);
          const col = idx % MARKER_GRID_COLUMNS;
          const cellSwLat = bounds.sw.lat + latStep * row;
          const cellNeLat = row === MARKER_GRID_ROWS - 1 ? bounds.ne.lat : bounds.sw.lat + latStep * (row + 1);
          const cellSwLng = bounds.sw.lng + lngStep * col;
          const cellNeLng = col === MARKER_GRID_COLUMNS - 1 ? bounds.ne.lng : bounds.sw.lng + lngStep * (col + 1);
          let markerQuery = supabase
            .from("stores")
            .select("*")
            .gte("lat", cellSwLat)
            .lte("lat", cellNeLat)
            .gte("lng", cellSwLng)
            .lte("lng", cellNeLng)
            .order("score", { ascending: false })
            .range(0, MARKER_STORES_PER_CELL - 1);

          if (category !== "all") {
            markerQuery = markerQuery.eq("category", category);
          }

          return markerQuery;
        });

        const markerResults = await Promise.all(markerQueries);
        nextMarkerCandidates = uniqueStoresById(
          markerResults.flatMap((result) => (result.data as Store[]) ?? [])
        );
      }

      setStores(newStores);
      setPage(pageNum);
      // pageNum=0이면 초기화, 아니면 누적 (지도보기 더보기용)
      if (pageNum === 0) {
        setAccumulatedStores(newStores);
        setMarkerCandidateStores(nextMarkerCandidates);
      } else {
        setAccumulatedStores((prev) => [...prev, ...newStores]);
      }
      const total = pageSize === DESKTOP_FETCH_SIZE
        ? 1
        : Math.min(Math.ceil((count ?? 0) / PAGE_SIZE), MAX_PAGES);
      setTotalPages(Math.max(total, 1));
    } catch {
      setStores([]);
      if (pageNum === 0) {
        setAccumulatedStores([]);
        setMarkerCandidateStores([]);
      }
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToPage = useCallback((pageNum: number) => {
    if (!lastBounds.current) return;
    fetchStores(lastBounds.current, lastCategory.current, pageNum);
  }, [fetchStores]);

  return { stores, accumulatedStores, markerCandidateStores, isLoading, page, totalPages, fetchStores, goToPage };
}

export { DESKTOP_FETCH_SIZE };

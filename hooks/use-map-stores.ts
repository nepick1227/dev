"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Store } from "@/types/database";
import type { Category } from "@/features/home/types";

export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

const POOL_SIZE = 150;
const GRID_ROWS = 5;
const GRID_COLUMNS = 6;
const GRID_CELL_CAP = 5;

// 랭킹 풀(점수 내림차순) 안에서 좌표 그리드 셀별 상위 GRID_CELL_CAP개까지만 남긴다.
// 입력이 이미 점수순 정렬 상태라 앞에서부터 셀 정원을 채우면 셀 내 상위 항목만 자연히 통과하고,
// 전체 순서(점수순)도 그대로 유지된다 — 랭킹 리스트와 지도 핀이 항상 같은 순서를 공유하게 하기 위함.
function capByGrid(stores: Store[], bounds: MapBounds): Store[] {
  const latRange = Math.max(bounds.ne.lat - bounds.sw.lat, Number.EPSILON);
  const lngRange = Math.max(bounds.ne.lng - bounds.sw.lng, Number.EPSILON);
  const cellCounts = new Map<string, number>();
  const result: Store[] = [];

  for (const store of stores) {
    const col = Math.min(
      GRID_COLUMNS - 1,
      Math.max(0, Math.floor(((store.lng - bounds.sw.lng) / lngRange) * GRID_COLUMNS))
    );
    const row = Math.min(
      GRID_ROWS - 1,
      Math.max(0, Math.floor(((bounds.ne.lat - store.lat) / latRange) * GRID_ROWS))
    );
    const key = `${row}:${col}`;
    const count = cellCounts.get(key) ?? 0;
    if (count >= GRID_CELL_CAP) continue;
    cellCounts.set(key, count + 1);
    result.push(store);
  }

  return result;
}

export function useMapStores() {
  const [rankedStores, setRankedStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 랭킹 리스트와 지도 핀이 공유하는 단일 소스: bounds 내 점수 상위 150개를 받아
  // 그리드당 최대 5개로 다듬은 뒤 점수순으로 노출한다.
  const fetchStores = useCallback(async (bounds: MapBounds, category: Category) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("stores")
        .select("*")
        .gte("lat", bounds.sw.lat)
        .lte("lat", bounds.ne.lat)
        .gte("lng", bounds.sw.lng)
        .lte("lng", bounds.ne.lng)
        .order("score", { ascending: false })
        .range(0, POOL_SIZE - 1);

      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRankedStores(capByGrid((data as Store[]) ?? [], bounds));
    } catch {
      setRankedStores([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { rankedStores, isLoading, fetchStores };
}

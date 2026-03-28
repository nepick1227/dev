"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import BottomSheet from "@/components/map/BottomSheet";
import StoreCard from "./StoreCard";
import Spinner from "@/components/ui/Spinner";
import type { Store } from "@/types/database";

type Category = "all" | "restaurant" | "cafe";

interface RankingSheetProps {
  onStoreClick?: (storeId: number) => void;
}

/**
 * 홈 화면 하단의 맛집 랭킹 바텀시트
 */
export default function RankingSheet({ onStoreClick }: RankingSheetProps) {
  const [category, setCategory] = useState<Category>("all");
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStores = useCallback(async (cat: Category) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("stores")
        .select("*")
        .order("pick_count", { ascending: false })
        .limit(20);

      if (cat !== "all") {
        query = query.eq("category", cat);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStores((data as Store[]) ?? []);
    } catch {
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores(category);
  }, [category, fetchStores]);

  const tabs: { key: Category; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "restaurant", label: "맛집" },
    { key: "cafe", label: "카페" },
  ];

  return (
    <BottomSheet
      defaultSnap="half"
      header={
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className="rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-tight transition-all duration-200"
              style={{
                background: category === tab.key ? "#D32F2F" : "#F3F4F6",
                color: category === tab.key ? "#fff" : "#6B7280",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
          <p className="text-[15px]">아직 기록된 가게가 없어요</p>
          <p className="mt-1 text-[13px]">첫 번째로 기록해 보세요!</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {stores.map((store, idx) => (
            <li key={store.id}>
              <StoreCard store={store} rank={idx + 1} onClick={onStoreClick} />
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}

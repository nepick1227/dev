"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import MonthFilter from "./MonthFilter";
import RecordCard from "./RecordCard";
import Spinner from "@/components/ui/Spinner";
import { formatYearMonth } from "@/utils/format";
import type { RecordWithStore } from "@/types/database";

/**
 * 마이픽 타임라인 컴포넌트
 * 월별 기록을 최신순으로 보여줍니다.
 */
export default function Timeline() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [records, setRecords] = useState<RecordWithStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async (month: Date) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const yearMonth = formatYearMonth(month);
      const startDate = `${yearMonth}-01`;
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabase
        .from("records")
        .select("*, stores(*)")
        .eq("user_id", user.id)
        .gte("visited_at", startDate)
        .lte("visited_at", endDate)
        .order("visited_at", { ascending: false });

      if (error) throw error;
      setRecords((data as RecordWithStore[]) ?? []);
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(currentMonth);
  }, [currentMonth, fetchRecords]);

  return (
    <div className="flex flex-1 flex-col">
      {/* 월 필터 */}
      <div className="border-b border-border px-5 py-3">
        <MonthFilter value={currentMonth} onChange={setCurrentMonth} />
      </div>

      {/* 기록 목록 */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-text-secondary">
          <p className="text-[40px]">🗺️</p>
          <p className="mt-3 text-[15px] font-semibold">이 달의 기록이 없어요</p>
          <p className="mt-1 text-[13px]">새로운 맛집을 기록해 보세요!</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {records.map((record) => (
            <li key={record.id}>
              <RecordCard record={record} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

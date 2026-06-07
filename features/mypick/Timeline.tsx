"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import MonthFilter from "./MonthFilter";
import RecordCard from "./RecordCard";
import Spinner from "@/components/ui/Spinner";
import { formatYearMonth, formatDateGroupLabel } from "@/utils/format";
import type { RecordWithStore } from "@/types/database";

type ViewMode = "timeline" | "monthly";

interface TimelineProps {
  initialRecords?: RecordWithStore[];
  onCreateRecord?: () => void;
  onEditRecord?: (recordId: number) => void;
}

// 날짜 문자열(YYYY-MM-DD) 기준으로 기록 그룹핑, 최신순 정렬
function groupByDate(records: RecordWithStore[]): [string, RecordWithStore[]][] {
  const map: Record<string, RecordWithStore[]> = {};
  for (const r of records) {
    const key = r.visited_at.split("T")[0];
    if (!map[key]) map[key] = [];
    map[key].push(r);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, recs]) => [date, recs.sort((a, b) => a.visited_at.localeCompare(b.visited_at))]);
}

/**
 * 내 픽 타임라인 컴포넌트
 * 타임라인(전체) / 월별 뷰 토글, 날짜별 그룹핑
 */
export default function Timeline({ initialRecords, onCreateRecord, onEditRecord }: TimelineProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [records, setRecords] = useState<RecordWithStore[]>(initialRecords ?? []);
  const [isLoading, setIsLoading] = useState(!initialRecords);
  // 서버에서 초기 데이터를 받은 경우, 첫 번째 timeline 모드 fetch는 스킵
  const skipInitialFetch = useRef(!!initialRecords);

  const fetchRecords = useCallback(async (mode: ViewMode, month: Date) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      let query = supabase
        .from("records")
        .select("*, stores(*)")
        .eq("user_id", user.id)
        .order("visited_at", { ascending: false });

      if (mode === "monthly") {
        const yearMonth = formatYearMonth(month);
        const startDate = `${yearMonth}-01`;
        const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
        query = query.gte("visited_at", startDate).lte("visited_at", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords((data as RecordWithStore[]) ?? []);
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchRecords(viewMode, currentMonth);
  }, [viewMode, currentMonth, fetchRecords]);

  const grouped = groupByDate(records);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Toast message={toast.message} visible={toast.visible} />

      {/* 상단 헤더 */}
      <div className={`app-content-readable shrink-0 bg-surface px-5 pt-3 ${viewMode === "monthly" ? "pb-1" : "pb-3"}`}>
        {/* 타임라인 / 월별 세그먼트 토글 + 추가 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-full border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode("timeline")}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-tight transition-all duration-200 ${
                viewMode === "timeline"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary"
              }`}
            >
              타임라인
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-tight transition-all duration-200 ${
                viewMode === "monthly"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary"
              }`}
            >
              월별
            </button>
          </div>
          <button
            onClick={() => {
              if (onCreateRecord) {
                onCreateRecord();
              } else {
                router.push("/record");
              }
            }}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1.5V10.5M1.5 6H10.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            내 픽 추가
          </button>
        </div>

        {/* 월별 모드일 때 월 필터 */}
        {viewMode === "monthly" && (
          <div className="mt-3 flex justify-center">
            <MonthFilter value={currentMonth} onChange={setCurrentMonth} />
          </div>
        )}
      </div>

      {/* 기록 목록 */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="hide-scrollbar flex-1 overflow-y-auto">
          {records.length === 0 ? (
            <div className="nepick-fade-in flex flex-col items-center justify-center gap-3 px-5 py-16">
              <p className="text-[40px]">🗺️</p>
              <div className="text-center">
                <p className="text-[15px] font-semibold tracking-tight text-text-primary">
                  {viewMode === "monthly" ? "이 달의 기록이 없어요" : "아직 내가 픽한 맛집이 없어요!"}
                </p>
                <p className="mt-1 text-[13px] tracking-tight text-text-secondary">
                  {viewMode === "monthly" ? "다른 달을 선택하거나 새로 픽해 보세요" : "나만의 맛집을 내 픽에 담아볼까요?"}
                </p>
              </div>
              {viewMode === "timeline" && (
                <button
                  onClick={() => {
                    if (onCreateRecord) {
                      onCreateRecord();
                    } else {
                      router.push("/record");
                    }
                  }}
                  className="mt-2 rounded-xl bg-primary px-8 py-3.5 text-[15px] font-bold tracking-tight text-white"
                >
                  첫 맛집 픽하기
                </button>
              )}
            </div>
          ) : (
            <>
              {grouped.map(([date, dayRecords]) => (
                <div key={date} className="app-content-readable px-5 pt-4">
                  <div className="mb-3">
                    <span className="text-[15px] font-bold tracking-tight text-text-primary">
                      {formatDateGroupLabel(date)}
                    </span>
                  </div>
                  {dayRecords.map((record, idx) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      isLast={idx === dayRecords.length - 1}
                      onShowToast={showToast}
                      onDelete={() => fetchRecords(viewMode, currentMonth)}
                      onEdit={onEditRecord}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
          <div className="h-6" />
        </div>
      )}
    </div>
  );
}

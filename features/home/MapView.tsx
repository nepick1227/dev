"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from "@/components/map/KakaoMap";
import RankingSheet, { type RankingSheetHandle } from "./RankingSheet";
import MapOverlay from "./MapOverlay";
import { useMapStores, type MapBounds } from "@/hooks/use-map-stores";
import { getCurrentPosition } from "@/lib/kakao/map";
import { createClient } from "@/lib/supabase/client";
import { CloseIcon } from "@/components/ui/icons";
import type { Category } from "./types";
import type { Store } from "@/types/database";
import type { KakaoSearchResult } from "@/hooks/use-kakao-search";

// ── 커스텀 마커 생성 ─────────────────────────────────────

function createRankMarker(
  map: kakao.maps.Map,
  store: Store,
  rank: number,
  dimmed = false
): kakao.maps.Marker {
  const fontSize = rank > 9 ? 9 : 11;
  const opacity = dimmed ? 0.25 : 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" opacity="${opacity}">
    <defs>
      <radialGradient id="g" cx="40%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#F08080"/>
        <stop offset="100%" stop-color="#B71C1C"/>
      </radialGradient>
      <filter id="s">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#00000055"/>
      </filter>
    </defs>
    <path d="M16 2C9.4 2 4 7.4 4 14C4 23 16 40 16 40C16 40 28 23 28 14C28 7.4 22.6 2 16 2Z" fill="url(#g)" filter="url(#s)"/>
    <ellipse cx="11.5" cy="8.5" rx="3.5" ry="2.5" fill="white" opacity="0.25"/>
    <circle cx="16" cy="14" r="8" fill="white" opacity="0.92"/>
    <text x="16" y="18" text-anchor="middle" font-size="${fontSize}" font-weight="bold" font-family="sans-serif" fill="#D32F2F">${rank}</text>
  </svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = new kakao.maps.MarkerImage(url, new kakao.maps.Size(32, 40), {
    offset: new kakao.maps.Point(16, 40),
  });
  return new kakao.maps.Marker({
    map,
    position: new kakao.maps.LatLng(store.lat, store.lng),
    image,
    title: store.name,
  });
}

// ── 현재 위치 파란 점 ────────────────────────────────────

function createLocationDot(map: kakao.maps.Map, lat: number, lng: number): kakao.maps.CustomOverlay {
  const el = document.createElement("div");
  el.style.cssText =
    "width:14px;height:14px;background:#4A90E2;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(74,144,226,0.5)";
  return new kakao.maps.CustomOverlay({
    map,
    position: new kakao.maps.LatLng(lat, lng),
    content: el,
    zIndex: 5,
  });
}

// ── 선택된 가게 카드 오버레이 ────────────────────────────

function SelectedStoreCard({ store, rank, onClose }: { store: Store; rank: number; onClose: () => void }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const address = store.road_address ?? store.address;
  const categoryLabel = store.category === "cafe" ? "카페" : "음식점";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  }, [address]);

  const handleRecord = useCallback(() => {
    const params = new URLSearchParams({
      kakao_id: store.kakao_id,
      place_name: store.name,
      address_name: store.address,
      road_address_name: store.road_address ?? "",
      phone: store.phone ?? "",
      x: String(store.lng),
      y: String(store.lat),
      category_group_code: store.category === "cafe" ? "CE7" : "FD6",
    });
    router.push(`/record?${params.toString()}`);
  }, [store, router]);

  return (
    <div
      className="absolute left-3 right-3 z-40 rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.16)] p-4"
      style={{ bottom: "28px" }}
    >
      {/* 1행: 순위 배지 + 카테고리 배지 + 닫기 */}
      <div className="mb-2 flex items-center gap-1.5">
        {rank > 0 && (
          <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-extrabold tracking-tight text-primary">
            {rank}위
          </span>
        )}
        <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-semibold tracking-tight text-text-secondary">
          {categoryLabel}
        </span>
        <button onClick={onClose} className="ml-auto p-0.5" aria-label="닫기">
          <CloseIcon size={18} color="#9CA3AF" />
        </button>
      </div>

      {/* 2행: 가게명 + 픽 수 */}
      <div className="mb-2 flex items-center gap-2">
        <span className="flex-1 truncate text-[15px] font-bold tracking-tight text-text-primary">
          {store.name}
        </span>
        <span className="shrink-0 text-[13px] font-bold text-primary">{store.pick_count}</span>
        <span className="shrink-0 text-[11px] text-text-secondary">픽</span>
      </div>

      {/* 3행: 주소 + 복사 버튼 + 기록 버튼 */}
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate text-[12px] tracking-tight text-text-secondary">
          {address}
        </span>
        <button onClick={handleCopy} className="shrink-0 rounded-full bg-bg p-1.5" aria-label="주소 복사">
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M5 12L10 17L19 8" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="#9CA3AF" strokeWidth="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#9CA3AF" strokeWidth="2"/>
            </svg>
          )}
        </button>
        <button
          onClick={handleRecord}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-white"
        >
          기록+
        </button>
      </div>
    </div>
  );
}

// ── MapView ──────────────────────────────────────────────

export default function MapView() {
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const rankingRef = useRef<RankingSheetHandle>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const locationDotRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const isInitializedRef = useRef(false);
  const categoryRef = useRef<Category>("all");
  const snapRef = useRef<"collapsed" | "half" | "full">("half");

  const [category, setCategory] = useState<Category>("all");
  const [snap, setSnap] = useState<"collapsed" | "half" | "full">("half");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedRank, setSelectedRank] = useState<number>(0);
  const [regionName, setRegionName] = useState<string>("");
  const cardOpenedRef = useRef(false);
  const sheetDefaultSnap = cardOpenedRef.current ? "collapsed" : "half" as const;

  const isMapFull = snap === "collapsed";
  const buttonBottom = isMapFull ? "96px" : "calc(50vh + 8px)";
  const buttonLabel = isMapFull ? "랭킹보기" : "지도보기";
  const { stores, accumulatedStores, isLoading, page, totalPages, fetchStores, goToPage } = useMapStores();

  useEffect(() => {
    snapRef.current = snap;
  }, [snap]);

  // 사용자에게 실제로 보이는 지도 영역의 bounds 계산
  const getBounds = useCallback((map: kakao.maps.Map): MapBounds => {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    if (snapRef.current === "half") {
      const centerLat = map.getCenter().getLat();
      return {
        sw: { lat: centerLat, lng: sw.getLng() },
        ne: { lat: ne.getLat(), lng: ne.getLng() },
      };
    }

    return {
      sw: { lat: sw.getLat(), lng: sw.getLng() },
      ne: { lat: ne.getLat(), lng: ne.getLng() },
    };
  }, []);

  // 선택한 장소가 사용자에게 보이는 영역의 정중앙에 오도록 panTo 오프셋 적용
  const panToVisible = useCallback((map: kakao.maps.Map, lat: number, lng: number) => {
    if (snapRef.current === "half") {
      const bounds = map.getBounds();
      const latRange = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat();
      // 가시 영역 중앙 = 지도 DOM 기준 상단 25% 지점 → 지도 중심 기준 25% 위
      // panTo 목표를 남쪽으로 offset하면 가게가 가시 중앙에 위치
      const offset = latRange * 0.25;
      map.panTo(new kakao.maps.LatLng(lat - offset, lng));
    } else {
      map.panTo(new kakao.maps.LatLng(lat, lng));
    }
  }, []);

  // snap 변경 시 visible bounds 재조회
  useEffect(() => {
    if (mapRef.current && isInitializedRef.current) {
      fetchStores(getBounds(mapRef.current), categoryRef.current, 0);
    }
  }, [snap, fetchStores, getBounds]);

  // accumulatedStores 또는 selectedStore 변경 시 마커 갱신 (선택된 가게 외 흐릿하게)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    accumulatedStores.forEach((store, idx) => {
      const rank = idx + 1;
      const dimmed = selectedStore !== null && selectedStore.id !== store.id;
      const marker = createRankMarker(map, store, rank, dimmed);
      kakao.maps.event.addListener(marker, "click", () => {
        cardOpenedRef.current = true;
        setSelectedStore(store);
        setSelectedRank(rank);
        panToVisible(map, store.lat, store.lng);
      });
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [accumulatedStores, selectedStore, panToVisible]);

  const handleMapReady = useCallback(async (map: kakao.maps.Map) => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    mapRef.current = map;

    const pos = await getCurrentPosition();
    locationDotRef.current = createLocationDot(map, pos.lat, pos.lng);

    const geocoder = new kakao.maps.services.Geocoder();
    const fetchRegion = () => {
      const center = map.getCenter();
      geocoder.coord2RegionCode(center.getLng(), center.getLat(), (result, status) => {
        if (status !== "OK") return;
        const b = result.find((r) => r.region_type === "B");
        const h = result.find((r) => r.region_type === "H");
        const base = b ?? h;
        if (!base) return;
        const dong = h?.region_3depth_name || base.region_3depth_name;
        const parts = [base.region_1depth_name, base.region_2depth_name, dong].filter(Boolean);
        setRegionName(parts.join(" "));
      });
    };

    const refetch = () => {
      fetchStores(getBounds(map), categoryRef.current, 0);
      fetchRegion();
    };
    kakao.maps.event.addListener(map, "zoom_changed", refetch);
    kakao.maps.event.addListener(map, "dragend", refetch);
    kakao.maps.event.addListener(map, "dragstart", () => setSelectedStore(null));

    fetchStores(getBounds(map), categoryRef.current, 0);
    fetchRegion();
  }, [fetchStores, getBounds]);

  const handleCategoryChange = useCallback((cat: Category) => {
    categoryRef.current = cat;
    setCategory(cat);
    if (mapRef.current) {
      fetchStores(getBounds(mapRef.current), cat, 0);
    }
  }, [fetchStores, getBounds]);

  // 검색으로 가게 선택: 가시 중앙 이동 + DB 조회 후 카드 표시
  const handlePlaceSelect = useCallback(async (place: Pick<KakaoSearchResult, "id" | "x" | "y">) => {
    const map = mapRef.current;
    if (!map) return;

    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);

    panToVisible(map, lat, lng);
    rankingRef.current?.collapse();
    setSelectedStore(null);

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("kakao_id", place.id)
        .maybeSingle();

      if (data) {
        cardOpenedRef.current = true;
        setSelectedStore(data as Store);
        setSelectedRank(0); // 검색 결과는 순위 미표시
      }
    } catch {
      // 조회 실패 시 카드 없이 이동만
    }
  }, [panToVisible]);

  // 랭킹 시트에서 가게 클릭
  const handleStoreClick = useCallback((storeId: number) => {
    const idx = accumulatedStores.findIndex((s) => s.id === storeId);
    const store = accumulatedStores[idx];
    if (store && mapRef.current) {
      cardOpenedRef.current = true;
      setSelectedStore(store);
      setSelectedRank(idx + 1);
      panToVisible(mapRef.current, store.lat, store.lng);
    }
  }, [accumulatedStores, panToVisible]);

  const handleRankingToggle = useCallback(() => {
    if (isMapFull) {
      rankingRef.current?.open();
    } else {
      rankingRef.current?.collapse();
    }
  }, [isMapFull]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <KakaoMap className="h-full w-full" onReady={handleMapReady} />

      <MapOverlay
        category={category}
        onCategoryChange={handleCategoryChange}
        onPlaceSelect={handlePlaceSelect}
      />

      {!selectedStore && (
        <>
          <RankingSheet
            ref={rankingRef}
            stores={stores}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
            onStoreClick={handleStoreClick}
            onSnapChange={setSnap}
            defaultSnap={sheetDefaultSnap}
            regionName={regionName}
          />

          {/* 지도보기 상태에서 더보기 버튼 (최대 3페이지 누적) */}
          {isMapFull && totalPages > 1 && page < totalPages - 1 && (
            <button
              onClick={() => goToPage(page + 1)}
              className="absolute left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-[13px] font-semibold text-text-primary shadow-lg"
              style={{ bottom: "152px", transition: "bottom 0.3s ease-out" }}
            >
              <span>📍</span>
              <span>더보기 {page + 1}/{totalPages}</span>
            </button>
          )}

          <button
            onClick={handleRankingToggle}
            className="absolute left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2.5 text-[13px] font-semibold text-text-primary shadow-lg"
            style={{ bottom: buttonBottom, transition: "bottom 0.3s ease-out" }}
          >
            <span>{isMapFull ? "🏆" : "🗺️"}</span>
            <span>{buttonLabel}</span>
          </button>
        </>
      )}

      {selectedStore && (
        <SelectedStoreCard
          store={selectedStore}
          rank={selectedRank}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </div>
  );
}

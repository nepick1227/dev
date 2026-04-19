"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from "@/components/map/KakaoMap";
import RankingSheet, { type RankingSheetHandle } from "./RankingSheet";
import MapOverlay from "./MapOverlay";
import { useMapStores, type MapBounds } from "@/hooks/use-map-stores";
import { getCurrentPosition } from "@/lib/kakao/map";
import { CloseIcon } from "@/components/ui/icons";
import type { Category } from "./types";
import type { Store } from "@/types/database";

// ── 커스텀 마커 생성 ─────────────────────────────────────

function createRankMarker(map: kakao.maps.Map, store: Store, rank: number): kakao.maps.Marker {
  const fontSize = rank > 9 ? 9 : 11;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
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

  return (
    <div
      className="absolute left-3 right-3 z-40 rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.16)] p-4"
      style={{ bottom: "28px" }}
    >
      {/* 1행: 순위 배지 + 카테고리 배지 + 닫기 */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-extrabold tracking-tight text-primary">
          {rank}위
        </span>
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
          onClick={() => router.push(`/record?store_kakao_id=${store.kakao_id}&store_name=${encodeURIComponent(store.name)}`)}
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

  const [category, setCategory] = useState<Category>("all");
  const [snap, setSnap] = useState<"collapsed" | "half" | "full">("half");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedRank, setSelectedRank] = useState<number>(0);
  const [regionName, setRegionName] = useState<string>("");
  // 가게 카드가 한 번이라도 열린 적 있으면 닫힌 후 바텀시트를 collapsed로 복원
  const cardOpenedRef = useRef(false);
  const sheetDefaultSnap = cardOpenedRef.current ? "collapsed" : "half" as const;

  const isMapFull = snap === "collapsed";
  const buttonBottom = isMapFull ? "96px" : "calc(50vh + 8px)";
  const buttonLabel = isMapFull ? "랭킹보기" : "지도보기";
  const { stores, isLoading, page, totalPages, fetchStores, goToPage } = useMapStores();

  const getBounds = useCallback((map: kakao.maps.Map): MapBounds => {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return {
      sw: { lat: sw.getLat(), lng: sw.getLng() },
      ne: { lat: ne.getLat(), lng: ne.getLng() },
    };
  }, []);

  // stores 변경 시 마커 갱신
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = stores.map((store, idx) => {
      const rank = page * 20 + idx + 1;
      const marker = createRankMarker(mapRef.current!, store, rank);
      kakao.maps.event.addListener(marker, "click", () => {
        cardOpenedRef.current = true;
        setSelectedStore(store);
        setSelectedRank(rank);
        mapRef.current?.panTo(new kakao.maps.LatLng(store.lat, store.lng));
      });
      return marker;
    });
  }, [stores, page]);

  const handleMapReady = useCallback(async (map: kakao.maps.Map) => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    mapRef.current = map;

    // 현재 위치 파란 점
    const pos = await getCurrentPosition();
    locationDotRef.current = createLocationDot(map, pos.lat, pos.lng);

    // 지도 중심 좌표 → 시·구·동 이름 조회
    const geocoder = new kakao.maps.services.Geocoder();
    const fetchRegion = () => {
      const center = map.getCenter();
      geocoder.coord2RegionCode(center.getLng(), center.getLat(), (result, status) => {
        if (status !== kakao.maps.services.Status.OK) return;
        // 법정동(B): 시·구가 안정적으로 채워짐 / 행정동(H): 동 이름
        const b = result.find((r) => r.region_type === "B");
        const h = result.find((r) => r.region_type === "H");
        const base = b ?? h;
        if (!base) return;
        const dong = h?.region_3depth_name || base.region_3depth_name;
        const parts = [
          base.region_1depth_name,
          base.region_2depth_name,
          dong,
        ].filter(Boolean);
        setRegionName(parts.join(" "));
      });
    };

    // zoom/drag 시 재조회 + 선택 카드 닫기
    const refetch = () => {
      fetchStores(getBounds(map), categoryRef.current, 0);
      fetchRegion();
    };
    kakao.maps.event.addListener(map, "zoom_changed", refetch);
    kakao.maps.event.addListener(map, "dragend", refetch);
    kakao.maps.event.addListener(map, "dragstart", () => setSelectedStore(null));

    // 초기 조회
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

  const handlePlaceSelect = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.panTo(new kakao.maps.LatLng(lat, lng));
    }
    rankingRef.current?.collapse();
  }, []);

  const handleStoreClick = useCallback((storeId: number) => {
    const idx = stores.findIndex((s) => s.id === storeId);
    const store = stores[idx];
    if (store && mapRef.current) {
      mapRef.current.panTo(new kakao.maps.LatLng(store.lat, store.lng));
      cardOpenedRef.current = true;
      setSelectedStore(store);
      setSelectedRank(page * 20 + idx + 1);
    }
  }, [stores, page]);

  const handleRankingToggle = useCallback(() => {
    if (isMapFull) {
      rankingRef.current?.open(); // collapsed → half
    } else {
      rankingRef.current?.collapse(); // half/full → collapsed
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

      {/* 가게 카드가 없을 때만 바텀시트·토글 버튼 표시 */}
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

      {/* 선택된 가게 카드 */}
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

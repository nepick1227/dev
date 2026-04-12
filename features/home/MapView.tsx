"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import KakaoMap from "@/components/map/KakaoMap";
import RankingSheet, { type RankingSheetHandle } from "./RankingSheet";
import MapOverlay from "./MapOverlay";
import { useMapStores, type MapBounds } from "@/hooks/use-map-stores";
import { getCurrentPosition } from "@/lib/kakao/map";
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
    markersRef.current = stores.map((store, idx) =>
      createRankMarker(mapRef.current!, store, page * 20 + idx + 1)
    );
  }, [stores, page]);

  const handleMapReady = useCallback(async (map: kakao.maps.Map) => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    mapRef.current = map;

    // 현재 위치 파란 점
    const pos = await getCurrentPosition();
    locationDotRef.current = createLocationDot(map, pos.lat, pos.lng);

    // zoom/drag 시 재조회
    const refetch = () => fetchStores(getBounds(map), categoryRef.current, 0);
    kakao.maps.event.addListener(map, "zoom_changed", refetch);
    kakao.maps.event.addListener(map, "dragend", refetch);

    // 초기 조회
    refetch();
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
    const store = stores.find((s) => s.id === storeId);
    if (store && mapRef.current) {
      mapRef.current.panTo(new kakao.maps.LatLng(store.lat, store.lng));
    }
  }, [stores]);

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

      <RankingSheet
        ref={rankingRef}
        stores={stores}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={goToPage}
        onStoreClick={handleStoreClick}
        onSnapChange={setSnap}
      />

      {/* 랭킹보기 / 지도보기 버튼 */}
      <button
        onClick={handleRankingToggle}
        className="absolute left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2.5 text-[13px] font-semibold text-text-primary shadow-lg"
        style={{ bottom: buttonBottom, transition: "bottom 0.3s ease-out" }}
      >
        <span>{isMapFull ? "🏆" : "🗺️"}</span>
        <span>{buttonLabel}</span>
      </button>
    </div>
  );
}

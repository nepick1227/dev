"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import KakaoMap from "@/components/map/KakaoMap";
import RankingSheet, { type RankingSheetHandle } from "./RankingSheet";
import MapOverlay from "./MapOverlay";
import SelectedStoreCard, { CARD_BOTTOM_PX, CARD_HEIGHT_PX } from "./SelectedStoreCard";
import Spinner from "@/components/ui/Spinner";
import { useMapStores, type MapBounds } from "@/hooks/use-map-stores";
import { getCurrentPosition } from "@/lib/kakao/map";
import { createClient } from "@/lib/supabase/client";
import { parseKakaoCategory, parseKakaoSubcategory } from "@/utils/format";
import type { Category } from "./types";
import type { Store } from "@/types/database";
import type { KakaoSearchResult } from "@/hooks/use-kakao-search";

// ── 커스텀 마커 생성 ─────────────────────────────────────

function createRankMarker(
  map: kakao.maps.Map,
  store: Store,
  rank: number,
  dimmed: boolean,
  lat: number,
  lng: number
): kakao.maps.Marker {
  const fontSize = rank > 9 ? 9 : 11;
  const opacity = dimmed ? 0.5 : 1;
  const innerIcon =
    rank > 0
      ? `<text x="16" y="18" text-anchor="middle" font-size="${fontSize}" font-weight="bold" font-family="sans-serif" fill="#D32F2F">${rank}</text>`
      : `<polyline points="12,14 14.5,17 19.5,10.5" fill="none" stroke="#D32F2F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
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
    ${innerIcon}
  </svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = new kakao.maps.MarkerImage(url, new kakao.maps.Size(32, 40), {
    offset: new kakao.maps.Point(16, 40),
  });
  return new kakao.maps.Marker({
    map,
    position: new kakao.maps.LatLng(lat, lng),
    image,
    title: store.name,
  });
}

// ── 겹치는 마커 나선형 오프셋 ────────────────────────────
// 동일 위치(~33m 이내) 가게들을 나선형으로 펼쳐 핀이 겹치지 않도록 함

const CLUSTER_THRESHOLD = 0.0003; // ~33m
const CLUSTER_OFFSET = 0.00015;   // ~17m 반경

const CLUSTER_SPIRAL: [number, number][] = [
  [0, 0],
  [0, CLUSTER_OFFSET],
  [CLUSTER_OFFSET * 0.87, -CLUSTER_OFFSET * 0.5],
  [-CLUSTER_OFFSET * 0.87, -CLUSTER_OFFSET * 0.5],
  [0, CLUSTER_OFFSET * 2],
  [CLUSTER_OFFSET * 1.73, 0],
  [0, -CLUSTER_OFFSET * 2],
  [-CLUSTER_OFFSET * 1.73, 0],
];

function spreadOverlappingMarkers(
  stores: Store[]
): Array<{ store: Store; displayLat: number; displayLng: number }> {
  const assigned = new Set<number>();
  const result: Array<{ store: Store; displayLat: number; displayLng: number }> = new Array(stores.length);

  stores.forEach((anchor, i) => {
    if (assigned.has(i)) return;

    const cluster: number[] = [i];
    stores.forEach((other, j) => {
      if (i === j || assigned.has(j)) return;
      if (
        Math.abs(anchor.lat - other.lat) < CLUSTER_THRESHOLD &&
        Math.abs(anchor.lng - other.lng) < CLUSTER_THRESHOLD
      ) {
        cluster.push(j);
      }
    });

    cluster.forEach((storeIdx, offsetIdx) => {
      assigned.add(storeIdx);
      const [dLat, dLng] = CLUSTER_SPIRAL[offsetIdx] ?? CLUSTER_SPIRAL[CLUSTER_SPIRAL.length - 1];
      result[storeIdx] = {
        store: stores[storeIdx],
        displayLat: stores[storeIdx].lat + dLat,
        displayLng: stores[storeIdx].lng + dLng,
      };
    });
  });

  return result;
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
  const geocoderRef = useRef<kakao.maps.services.Geocoder | null>(null);
  const isInitializedRef = useRef(false);
  const categoryRef = useRef<Category>("all");
  const snapRef = useRef<"collapsed" | "half" | "full">("half");
  const cardOpenedRef = useRef(false);
  const accumulatedStoresRef = useRef<Store[]>([]);

  const [category, setCategory] = useState<Category>("all");
  const [snap, setSnap] = useState<"collapsed" | "half" | "full">("half");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedRank, setSelectedRank] = useState<number>(0);
  const [regionName, setRegionName] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  // tapMode: 지도 배경 탭으로 가게 선택 시 랭킹 마커 숨기고 단일 핀만 표시
  const [tapMode, setTapMode] = useState(false);

  const sheetDefaultSnap = cardOpenedRef.current ? "collapsed" : "half" as const;
  const isMapFull = snap === "collapsed";
  const { accumulatedStores, isLoading, page, totalPages, fetchStores, goToPage } = useMapStores();

  const hasMore = totalPages > 1 && page < totalPages - 1;

  // accumulatedStores 변경 시 ref 동기화 (이벤트 클로저에서 최신값 접근용)
  useEffect(() => {
    accumulatedStoresRef.current = accumulatedStores;
  }, [accumulatedStores]);

  useEffect(() => {
    snapRef.current = snap;
  }, [snap]);

  // 사용자에게 실제로 보이는 지도 영역의 bounds 계산
  // 상단: 검색/필터 오버레이 ~20%, 하단: 바텀시트+버튼 높이를 모드별로 계산해 inset 적용
  const getBounds = useCallback((map: kakao.maps.Map): MapBounds => {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const latRange = ne.getLat() - sw.getLat();
    const lngRange = ne.getLng() - sw.getLng();
    const latPadTop = latRange * 0.20;  // 검색바+필터(~17%) + 여유(3%)
    const lngPad = lngRange * 0.05;

    if (snapRef.current === "half") {
      // half: 버튼(~40px) + 여유가 map DOM center 기준 약 12% 위
      // map.getCenter() = 지도 DOM 중앙 lat, 버튼은 그보다 북쪽에 위치
      const centerLat = map.getCenter().getLat();
      return {
        sw: { lat: centerLat + latRange * 0.12, lng: sw.getLng() + lngPad },
        ne: { lat: ne.getLat() - latPadTop, lng: ne.getLng() - lngPad },
      };
    }

    // collapsed: 시트(88px) + gap(8px) + 버튼(40px) ≈ 136px → 지도 높이 대비 ~20%
    return {
      sw: { lat: sw.getLat() + latRange * 0.20, lng: sw.getLng() + lngPad },
      ne: { lat: ne.getLat() - latPadTop, lng: ne.getLng() - lngPad },
    };
  }, []);

  const fetchRegion = useCallback(() => {
    const map = mapRef.current;
    const geocoder = geocoderRef.current;
    if (!map || !geocoder) return;
    const level = map.getLevel();
    const bounds = getBounds(map);
    const visibleCenterLat = (bounds.sw.lat + bounds.ne.lat) / 2;
    const visibleCenterLng = (bounds.sw.lng + bounds.ne.lng) / 2;
    geocoder.coord2RegionCode(visibleCenterLng, visibleCenterLat, (result, status) => {
      if (status !== "OK") return;
      const b = result.find((r) => r.region_type === "B");
      const h = result.find((r) => r.region_type === "H");
      const base = b ?? h;
      if (!base) return;
      const dong = h?.region_3depth_name || base.region_3depth_name;

      let parts: string[];
      if (level <= 5) {
        parts = [base.region_1depth_name, base.region_2depth_name, dong].filter(Boolean);
      } else if (level <= 9) {
        parts = [base.region_1depth_name, base.region_2depth_name].filter(Boolean);
      } else {
        parts = [base.region_1depth_name].filter(Boolean);
      }
      setRegionName(parts.join(" "));
    });
  }, [getBounds]);

  // 선택한 장소가 사용자에게 보이는 영역의 정중앙에 오도록 panTo 오프셋 적용
  const panToVisible = useCallback((map: kakao.maps.Map, lat: number, lng: number) => {
    const bounds = map.getBounds();
    const latRange = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat();

    if (snapRef.current === "half") {
      // 가시 영역 = 지도 DOM 상단 50% → 가시 중앙 = 지도 중심 기준 25% 위
      map.panTo(new kakao.maps.LatLng(lat - latRange * 0.25, lng));
    } else {
      // 가게 카드(~130px)가 하단을 가리므로 핀이 카드 위 가시 영역 중앙에 오도록 조정
      map.panTo(new kakao.maps.LatLng(lat - latRange * 0.09, lng));
    }
  }, []);

  // 마커 렌더링 (tapMode일 때는 선택된 가게 마커 1개만 표시)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (tapMode) {
      // 지도 탭으로 선택된 경우 단일 마커만 표시
      if (selectedStore) {
        const marker = createRankMarker(map, selectedStore, selectedRank || 0, false, selectedStore.lat, selectedStore.lng);
        markersRef.current.push(marker);
      }
      return;
    }

    // 겹치는 마커 나선형 오프셋 적용 후 랭킹 마커 렌더링
    const displayStores = spreadOverlappingMarkers(accumulatedStores);
    displayStores.forEach(({ store, displayLat, displayLng }, idx) => {
      const rank = idx + 1;
      const dimmed = selectedStore !== null && selectedStore.id !== store.id;
      const marker = createRankMarker(map, store, rank, dimmed, displayLat, displayLng);
      kakao.maps.event.addListener(marker, "click", () => {
        setTapMode(false);
        cardOpenedRef.current = true;
        setSelectedStore(store);
        setSelectedRank(rank);
        panToVisible(map, displayLat, displayLng);
      });
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [accumulatedStores, selectedStore, selectedRank, panToVisible, tapMode]);

  const handleMapReady = useCallback(async (map: kakao.maps.Map) => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    mapRef.current = map;

    const pos = await getCurrentPosition();
    locationDotRef.current = createLocationDot(map, pos.lat, pos.lng);
    geocoderRef.current = new kakao.maps.services.Geocoder();

    const refetch = () => {
      setSelectedStore(null);
      setTapMode(false);
      fetchStores(getBounds(map), categoryRef.current, 0);
      fetchRegion();
    };
    kakao.maps.event.addListener(map, "zoom_changed", refetch);
    kakao.maps.event.addListener(map, "dragend", refetch);

    // TODO: 지도 배경 탭으로 가게 카드 표시 (추후 개선 예정)
    // kakao.maps.event.addListener(map, "click", async (...args: unknown[]) => {
    //   const mouseEvent = args[0] as { latLng: kakao.maps.LatLng };
    //   const lat = mouseEvent.latLng.getLat();
    //   const lng = mouseEvent.latLng.getLng();
    //   const radius = 0.0005; // ~55m
    //   try {
    //     const supabase = createClient();
    //     const { data } = await supabase
    //       .from("stores").select("*")
    //       .gte("lat", lat - radius).lte("lat", lat + radius)
    //       .gte("lng", lng - radius).lte("lng", lng + radius)
    //       .order("score", { ascending: false }).limit(1).maybeSingle();
    //     if (data) {
    //       const store = data as Store;
    //       const idx = accumulatedStoresRef.current.findIndex((s) => s.id === store.id);
    //       cardOpenedRef.current = true;
    //       setTapMode(true);
    //       setSelectedStore(store);
    //       setSelectedRank(idx >= 0 ? idx + 1 : 0);
    //       panToVisible(map, store.lat, store.lng);
    //     }
    //   } catch { /* 조회 실패 시 무시 */ }
    // });

    fetchStores(getBounds(map), categoryRef.current, 0);
    fetchRegion();
  }, [fetchStores, getBounds, fetchRegion]);

  const handleCategoryChange = useCallback((cat: Category) => {
    categoryRef.current = cat;
    setCategory(cat);
    if (mapRef.current) {
      fetchStores(getBounds(mapRef.current), cat, 0);
    }
  }, [fetchStores, getBounds]);

  // 검색으로 가게 선택: 가시 중앙 이동 + DB 조회 후 카드 표시
  const handlePlaceSelect = useCallback(async (
    place: Pick<
      KakaoSearchResult,
      "id" | "place_name" | "category_name" | "category_group_code" | "road_address_name" | "address_name" | "phone" | "x" | "y"
    >
  ) => {
    const map = mapRef.current;
    if (!map) return;

    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);

    panToVisible(map, lat, lng);
    rankingRef.current?.collapse();
    setSelectedStore(null);
    setTapMode(false);

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("kakao_id", place.id)
        .maybeSingle();

      if (data) {
        cardOpenedRef.current = true;
        setTapMode(true);
        setSelectedStore(data as Store);
        setSelectedRank(0);
        return;
      }

      const draftStore: Store = {
        id: -Math.abs(Number.parseInt(place.id, 10) || Date.now()),
        kakao_id: place.id,
        name: place.place_name,
        category: parseKakaoCategory(place.category_group_code),
        subcategory: parseKakaoSubcategory(place.category_name),
        address: place.address_name,
        road_address: place.road_address_name || null,
        lat,
        lng,
        phone: place.phone || null,
        score: 0,
        pick_count: 0,
        created_at: new Date().toISOString(),
      };

      cardOpenedRef.current = true;
      setTapMode(true);
      setSelectedStore(draftStore);
      setSelectedRank(0);
    } catch {
      // 조회 실패 시 카드 없이 이동만
    }
  }, [panToVisible]);

  // 랭킹 시트에서 가게 클릭
  const handleStoreClick = useCallback((storeId: number) => {
    const idx = accumulatedStores.findIndex((s) => s.id === storeId);
    const store = accumulatedStores[idx];
    if (store && mapRef.current) {
      setTapMode(false);
      cardOpenedRef.current = true;
      setSelectedStore(store);
      setSelectedRank(idx + 1);
      panToVisible(mapRef.current, store.lat, store.lng);
    }
  }, [accumulatedStores, panToVisible]);

  const handleCurrentLocation = useCallback(async () => {
    const map = mapRef.current;
    if (!map || isLocating) return;
    setIsLocating(true);
    try {
      const pos = await getCurrentPosition();
      locationDotRef.current?.setMap(null);
      locationDotRef.current = createLocationDot(map, pos.lat, pos.lng);
      map.setCenter(new kakao.maps.LatLng(pos.lat, pos.lng));
      setSelectedStore(null);
      setTapMode(false);
      fetchStores(getBounds(map), categoryRef.current, 0);
      fetchRegion();
      rankingRef.current?.open();
    } catch {
      // 위치 권한 거부 등 조용히 무시
    } finally {
      setIsLocating(false);
    }
  }, [isLocating, fetchStores, getBounds, fetchRegion]);

  const handleCloseCard = useCallback(() => {
    setSelectedStore(null);
    setTapMode(false);
  }, []);

  // 시트 푸터의 "지도보기" 버튼 핸들러
  const handleCollapse = useCallback(() => {
    rankingRef.current?.collapse();
  }, []);

  // 플로팅 버튼: 지도보기(collapsed) 또는 카드 열림 상태에서만 표시
  const handleRankingToggle = useCallback(() => {
    setSelectedStore(null);
    setTapMode(false);
    rankingRef.current?.open();
  }, []);

  // 플로팅 버튼 위치: 카드 열림 → 카드 위, collapsed → 시트(88px)+gap(8px) 위
  const floatingButtonBottom = selectedStore
    ? `${CARD_BOTTOM_PX + CARD_HEIGHT_PX}px`
    : "96px";

  return (
    <div className="relative flex-1 overflow-hidden">
      <KakaoMap className="h-full w-full" onReady={handleMapReady} />

      <MapOverlay
        category={category}
        onCategoryChange={handleCategoryChange}
        onPlaceSelect={handlePlaceSelect}
      />

      {/* 랭킹 시트: 가게 카드가 없을 때만 표시 */}
      {!selectedStore && (
        <RankingSheet
          ref={rankingRef}
          stores={accumulatedStores}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          hasMore={hasMore}
          onLoadMore={() => goToPage(page + 1)}
          onStoreClick={handleStoreClick}
          onSnapChange={setSnap}
          defaultSnap={sheetDefaultSnap}
          regionName={regionName}
        />
      )}

      {/* 플로팅 버튼 — 항상 표시, 상태에 따라 내용/위치 변경 */}
      {isMapFull || !!selectedStore ? (
        // 지도보기 or 카드 열림 → 랭킹보기
        <button
          onClick={handleRankingToggle}
          className="absolute left-1/2 z-40 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-text-primary shadow-lg"
          style={{ bottom: floatingButtonBottom, transition: "bottom 0.3s ease-out" }}
        >
          <span>🏆</span>
          <span>랭킹보기</span>
        </button>
      ) : (
        // half / full 랭킹 상태 → 지도보기 (시트 위 플로팅)
        <button
          onClick={handleCollapse}
          className="absolute left-1/2 z-40 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-text-primary shadow-lg"
          style={{
            bottom: snap === "full" ? "32px" : "calc(50vh + 8px)",
            transition: "bottom 0.3s ease-out",
          }}
        >
          <span>🗺️</span>
          <span>지도보기</span>
        </button>
      )}

      {/* 현재 위치 버튼 */}
      {snap !== "full" && (
        <button
          onClick={handleCurrentLocation}
          disabled={isLocating}
          className="absolute right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-lg transition-opacity disabled:opacity-50"
          style={{
            bottom: isMapFull || !!selectedStore
              ? floatingButtonBottom
              : "calc(50vh + 8px)",
            transition: "bottom 0.3s ease-out",
          }}
          aria-label="현재 위치로 이동"
        >
          {isLocating ? (
            <Spinner size={16} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" fill="#D32F2F" />
              <circle cx="12" cy="12" r="8" stroke="#D32F2F" strokeWidth="1.5" fill="none" />
              <line x1="12" y1="2" x2="12" y2="5" stroke="#D32F2F" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="22" stroke="#D32F2F" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="12" x2="5" y2="12" stroke="#D32F2F" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="19" y1="12" x2="22" y2="12" stroke="#D32F2F" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}

      {/* 선택된 가게 카드 */}
      {selectedStore && (
        <SelectedStoreCard
          store={selectedStore}
          rank={selectedRank}
          onClose={handleCloseCard}
        />
      )}
    </div>
  );
}

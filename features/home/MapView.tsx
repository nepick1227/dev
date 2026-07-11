"use client";

import { useCallback, useRef, useState, useEffect, useMemo, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from "@/components/map/KakaoMap";
import RankingSheet, { type RankingSheetHandle } from "./RankingSheet";
import MapOverlay from "./MapOverlay";
import HomePanelContent, { type PanelView } from "./HomePanelContent";
import MyPickMapToggle from "./MyPickMapToggle";
import SelectedStoreCard, { CARD_BOTTOM_PX, CARD_HEIGHT_PX } from "./SelectedStoreCard";
import StoreCard from "./StoreCard";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
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

const RESTAURANT_SUBCATEGORIES = [
  "전체",
  "간식",
  "분식",
  "뷔페",
  "술집",
  "아시아음식",
  "양식",
  "일식",
  "중식",
  "패스트푸드",
  "패밀리레스토랑",
  "피자",
  "치킨",
  "한식",
] as const;

const DESKTOP_RANKING_LIMIT = 60;
const RANKING_DEFAULT_LIMIT = 20;
const DESKTOP_NAV_WIDTH = 64;
const DESKTOP_MARKER_SAFE_GAP = 48;
const GENERIC_REGION_NAME = "현재 보고 있는 지역";
const REGION_MATCH_THRESHOLD = 0.8;

function getDesktopPanelWidth(): number {
  if (typeof window === "undefined") return 430;
  return Math.min(430, Math.max(300, window.innerWidth * 0.32));
}

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

function matchesRestaurantSubcategory(store: Store, subcategory: string): boolean {
  if (subcategory === "전체" || store.category !== "restaurant") return true;
  return (store.subcategory ?? "").includes(subcategory);
}

function getReferenceRegionUnit(regionName: string): string | null {
  const parts = regionName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2 || regionName === GENERIC_REGION_NAME) return null;
  return parts.find((part, idx) => idx > 0 && /[시군구]$/.test(part)) ?? null;
}

function getStoreAddressText(store: Store): string {
  return [store.address, store.road_address].filter(Boolean).join(" ");
}

function getRankingRegionName(regionName: string, stores: Store[]): string {
  const referenceRegion = getReferenceRegionUnit(regionName);
  if (!referenceRegion || stores.length === 0) return regionName;

  const matchedCount = stores.filter((store) =>
    getStoreAddressText(store).includes(referenceRegion)
  ).length;

  return matchedCount / stores.length >= REGION_MATCH_THRESHOLD
    ? regionName
    : GENERIC_REGION_NAME;
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
  const myPickModeRef = useRef(false);

  const [category, setCategory] = useState<Category>("all");
  const [restaurantSubcategory, setRestaurantSubcategory] = useState<(typeof RESTAURANT_SUBCATEGORIES)[number]>("전체");
  const [snap, setSnap] = useState<"collapsed" | "half" | "full">("half");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedRank, setSelectedRank] = useState<number>(0);
  const [regionName, setRegionName] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [panelView, setPanelView] = useState<PanelView>("ranking");
  const [isMyPickMapMode, setIsMyPickMapMode] = useState(false);
  const [showNoPickModal, setShowNoPickModal] = useState(false);
  const router = useRouter();
  const [myPickStores, setMyPickStores] = useState<Store[]>([]);
  const [isMyPickLoading, setIsMyPickLoading] = useState(false);
  const [searchPosition, setSearchPosition] = useState<{ lat: number; lng: number } | undefined>(undefined);
  // tapMode: 지도 배경 탭으로 가게 선택 시 랭킹 마커 숨기고 단일 핀만 표시
  const [tapMode, setTapMode] = useState(false);
  // 랭킹 리스트 "더보기" 페이지 — 0-indexed, 클릭할 때마다 20개씩 추가 노출 (최대 60개 = 3페이지)
  const [rankingPage, setRankingPage] = useState(0);

  const sheetDefaultSnap = cardOpenedRef.current ? "collapsed" : "half" as const;
  const isMapFull = snap === "collapsed";
  const { rankedStores, isLoading, fetchStores } = useMapStores();

  // 새로 fetch될 때마다(지도 이동/카테고리 변경 등) 페이지를 1페이지로 되돌린다.
  useEffect(() => {
    setRankingPage(0);
  }, [rankedStores]);

  const visibleRankedStores = category === "restaurant"
    ? rankedStores.filter((store) => matchesRestaurantSubcategory(store, restaurantSubcategory))
    : rankedStores;
  const isMyPickOnlyView = isMyPickMapMode;
  const panelStores = isMyPickOnlyView ? myPickStores : visibleRankedStores;
  const panelLoading = isMyPickOnlyView ? isMyPickLoading : isLoading;
  const rankingPoolSize = Math.min(panelStores.length, DESKTOP_RANKING_LIMIT);
  const totalPages = Math.max(1, Math.ceil(rankingPoolSize / RANKING_DEFAULT_LIMIT));
  const revealedCount = Math.min((rankingPage + 1) * RANKING_DEFAULT_LIMIT, rankingPoolSize);
  const hasMore = !isMyPickOnlyView && rankingPage < totalPages - 1;
  const handleLoadMore = useCallback(
    () => setRankingPage((p) => Math.min(p + 1, totalPages - 1)),
    [totalPages]
  );
  const rankingRegionName = useMemo(
    () => getRankingRegionName(regionName, panelStores),
    [regionName, panelStores]
  );

  // panelStores 변경 시 ref 동기화 (이벤트 클로저에서 최신값 접근용)
  useEffect(() => {
    accumulatedStoresRef.current = panelStores;
  }, [panelStores]);

  useEffect(() => {
    myPickModeRef.current = isMyPickOnlyView;
  }, [isMyPickOnlyView]);

  useEffect(() => {
    snapRef.current = snap;
  }, [snap]);

  const isDesktopLayout = useCallback(() => {
    return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
  }, []);

  useEffect(() => {
    if (isDesktopLayout()) {
      setIsDesktopSidebarOpen(true);
    }
  }, [isDesktopLayout]);

  useEffect(() => {
    const handlePanelView = (event: Event) => {
      const nextView = (event as CustomEvent<PanelView>).detail;
      if (!["ranking", "mypick", "profile"].includes(nextView)) return;
      setPanelView(nextView);
      setIsMyPickMapMode(nextView === "mypick");
      setIsDesktopSidebarOpen(true);
    };

    window.addEventListener("nepick:home-panel", handlePanelView);
    return () => window.removeEventListener("nepick:home-panel", handlePanelView);
  }, []);

  const getDesktopInsets = useCallback((sidebarOpen = isDesktopSidebarOpen) => {
    const panelWidth = getDesktopPanelWidth();
    const visibleLeft = sidebarOpen ? DESKTOP_NAV_WIDTH + panelWidth : DESKTOP_NAV_WIDTH;
    return {
      left: visibleLeft + DESKTOP_MARKER_SAFE_GAP,
      right: 88,
      top: !isMyPickOnlyView && categoryRef.current === "restaurant" ? 128 : 88,
      bottom: 88,
    };
  }, [isDesktopSidebarOpen, isMyPickOnlyView]);


  // 사용자에게 실제로 보이는 지도 영역의 bounds 계산
  // 모바일: 바텀시트 가시 영역 기준 / 데스크톱: 좌측 패널과 상단 플로팅을 제외한 실제 지도 영역 기준
  const getBounds = useCallback((map: kakao.maps.Map, sidebarOpen = isDesktopSidebarOpen): MapBounds => {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const latRange = ne.getLat() - sw.getLat();
    const lngRange = ne.getLng() - sw.getLng();

    if (isDesktopLayout()) {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const insets = getDesktopInsets(sidebarOpen);

      return {
        sw: {
          lat: sw.getLat() + latRange * (insets.bottom / height),
          lng: sw.getLng() + lngRange * (insets.left / width),
        },
        ne: {
          lat: ne.getLat() - latRange * (insets.top / height),
          lng: ne.getLng() - lngRange * (insets.right / width),
        },
      };
    }

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
  }, [getDesktopInsets, isDesktopLayout, isDesktopSidebarOpen]);

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
        setRegionName(GENERIC_REGION_NAME);
        return;
      }
      setRegionName(parts.join(" "));
    });
  }, [getBounds]);

  // 선택한 장소가 사용자에게 보이는 영역의 정중앙에 오도록 panTo 오프셋 적용
  const panToVisible = useCallback((map: kakao.maps.Map, lat: number, lng: number) => {
    const bounds = map.getBounds();
    const latRange = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat();
    const lngRange = bounds.getNorthEast().getLng() - bounds.getSouthWest().getLng();

    if (isDesktopLayout()) {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const insets = getDesktopInsets();
      const centerLat = lat + latRange * ((insets.top - insets.bottom) / (2 * height));
      const centerLng = lng - lngRange * ((insets.left - insets.right) / (2 * width));
      map.panTo(new kakao.maps.LatLng(centerLat, centerLng));
      return;
    }

    if (snapRef.current === "half") {
      // 가시 영역 = 지도 DOM 상단 50% → 가시 중앙 = 지도 중심 기준 25% 위
      map.panTo(new kakao.maps.LatLng(lat - latRange * 0.25, lng));
    } else {
      // 가게 카드(~130px)가 하단을 가리므로 핀이 카드 위 가시 영역 중앙에 오도록 조정
      map.panTo(new kakao.maps.LatLng(lat - latRange * 0.09, lng));
    }
  }, [getDesktopInsets, isDesktopLayout]);

  const fitStoresToVisibleMap = useCallback((map: kakao.maps.Map, stores: Store[]) => {
    if (stores.length === 0) return;

    if (stores.length === 1) {
      map.setLevel(Math.min(map.getLevel(), 5));
      panToVisible(map, stores[0].lat, stores[0].lng);
      return;
    }

    const bounds = new kakao.maps.LatLngBounds();
    const extendBounds = bounds as kakao.maps.LatLngBounds & {
      extend: (latlng: kakao.maps.LatLng) => void;
    };
    stores.forEach((store) => {
      extendBounds.extend(new kakao.maps.LatLng(store.lat, store.lng));
    });
    (map as kakao.maps.Map & { setBounds: (bounds: kakao.maps.LatLngBounds) => void }).setBounds(bounds);

    window.setTimeout(() => {
      const fitted = map.getBounds();
      const sw = fitted.getSouthWest();
      const ne = fitted.getNorthEast();
      panToVisible(map, (sw.getLat() + ne.getLat()) / 2, (sw.getLng() + ne.getLng()) / 2);
    }, 120);
  }, [panToVisible]);

  const loadMyPickStores = useCallback(async () => {
    setIsMyPickLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("records")
        .select("stores(*)")
        .eq("user_id", user.id)
        .order("visited_at", { ascending: false });

      if (error) throw error;

      const uniqueStores = new Map<number, Store>();
      type MyPickStoreRow = { stores: Store | Store[] | null };
      ((data ?? []) as unknown as MyPickStoreRow[]).forEach((record) => {
        const store = Array.isArray(record.stores) ? record.stores[0] : record.stores;
        if (store) uniqueStores.set(store.id, store);
      });

      const stores = Array.from(uniqueStores.values());
      setMyPickStores(stores);
      return stores;
    } catch {
      setMyPickStores([]);
      return [];
    } finally {
      setIsMyPickLoading(false);
    }
  }, []);

  useEffect(() => {
    if (panelView !== "mypick" || !isDesktopLayout()) return;
    const map = mapRef.current;

    void loadMyPickStores().then((stores) => {
      if (map && stores.length > 0) {
        window.setTimeout(() => fitStoresToVisibleMap(map, stores), 0);
      }
    });
  }, [fitStoresToVisibleMap, isDesktopLayout, loadMyPickStores, panelView]);

  useEffect(() => {
    const handleMyPickUpdated = async () => {
      const stores = await loadMyPickStores();
      const map = mapRef.current;
      if (map && myPickModeRef.current) {
        fitStoresToVisibleMap(map, stores);
      }
    };

    window.addEventListener("nepick:mypick-updated", handleMyPickUpdated);
    return () => window.removeEventListener("nepick:mypick-updated", handleMyPickUpdated);
  }, [fitStoresToVisibleMap, loadMyPickStores]);

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

    // 지도 핀은 랭킹 리스트에 노출된 가게와 항상 동일한 집합·순서를 공유한다.
    const isDesktop = isDesktopLayout();
    const storesForMarkers = isMyPickOnlyView
      ? myPickStores
      : panelStores.slice(0, isDesktop ? DESKTOP_RANKING_LIMIT : revealedCount);

    // 겹치는 마커 나선형 오프셋 적용 후 랭킹 마커 렌더링
    const displayStores = spreadOverlappingMarkers(storesForMarkers);
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
  }, [
    isDesktopLayout,
    isMyPickOnlyView,
    myPickStores,
    panelStores,
    revealedCount,
    selectedStore,
    selectedRank,
    panToVisible,
    tapMode,
  ]);

  const handleMapReady = useCallback(async (map: kakao.maps.Map) => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    mapRef.current = map;

    const pos = await getCurrentPosition();
    locationDotRef.current = createLocationDot(map, pos.lat, pos.lng);
    setSearchPosition({ lat: pos.lat, lng: pos.lng });
    geocoderRef.current = new kakao.maps.services.Geocoder();

    const refetch = () => {
      if (myPickModeRef.current) {
        fetchRegion();
        return;
      }
      setSelectedStore(null);
      setTapMode(false);
      const center = map.getCenter();
      setSearchPosition({ lat: center.getLat(), lng: center.getLng() });
      fetchStores(getBounds(map), categoryRef.current);
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

    fetchStores(getBounds(map), categoryRef.current);
    fetchRegion();
  }, [fetchStores, getBounds, fetchRegion]);

  const sheetWasOpenRef = useRef(false);

  const handleSearchOpen = useCallback(() => {
    if (!isDesktopLayout()) {
      sheetWasOpenRef.current = snapRef.current !== "collapsed";
      rankingRef.current?.collapse();
    }
  }, [isDesktopLayout]);

  const handleSearchClose = useCallback(() => {
    if (!isDesktopLayout() && sheetWasOpenRef.current) {
      rankingRef.current?.open();
    }
  }, [isDesktopLayout]);

  const handleCategoryChange = useCallback((cat: Category) => {
    categoryRef.current = cat;
    setCategory(cat);
    setIsMyPickMapMode(false);
    if (cat !== "restaurant") setRestaurantSubcategory("전체");
    if (mapRef.current) {
      fetchStores(getBounds(mapRef.current), cat);
    }
  }, [fetchStores, getBounds]);

  // 검색으로 가게 선택: 가시 중앙 이동 + DB 조회 후 카드 표시
  const handlePlaceSelect = useCallback(async (
    place: Pick<
      KakaoSearchResult,
      "id" | "place_name" | "category_name" | "category_group_code" | "road_address_name" | "address_name" | "phone" | "x" | "y" | "distance"
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
    const sourceStores = isMyPickOnlyView ? myPickStores : panelStores;
    const idx = sourceStores.findIndex((s) => s.id === storeId);
    const store = sourceStores[idx];
    if (store && mapRef.current) {
      setTapMode(false);
      cardOpenedRef.current = true;
      setSelectedStore(store);
      setSelectedRank(idx + 1);
      panToVisible(mapRef.current, store.lat, store.lng);
    }
  }, [isMyPickOnlyView, myPickStores, panelStores, panToVisible]);

  const handleCurrentLocation = useCallback(async () => {
    const map = mapRef.current;
    if (!map || isLocating) return;
    setIsLocating(true);
    try {
      const pos = await getCurrentPosition();
      locationDotRef.current?.setMap(null);
      locationDotRef.current = createLocationDot(map, pos.lat, pos.lng);
      setSearchPosition({ lat: pos.lat, lng: pos.lng });
      map.setCenter(new kakao.maps.LatLng(pos.lat, pos.lng));
      setSelectedStore(null);
      setTapMode(false);
      setIsMyPickMapMode(false);
      fetchStores(getBounds(map), categoryRef.current);
      fetchRegion();
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

  const handleMyPickMapToggle = useCallback(async () => {
    const map = mapRef.current;
    setSelectedStore(null);
    setTapMode(false);

    if (isMyPickMapMode) {
      setIsMyPickMapMode(false);
      if (map) {
        fetchStores(getBounds(map), categoryRef.current);
        fetchRegion();
      }
      return;
    }

    const stores = myPickStores.length > 0 ? myPickStores : await loadMyPickStores();
    if (stores.length === 0) {
      setShowNoPickModal(true);
      return;
    }
    setIsMyPickMapMode(true);
    if (map) {
      window.setTimeout(() => fitStoresToVisibleMap(map, stores), 0);
    }
  }, [
    fetchRegion,
    fetchStores,
    fitStoresToVisibleMap,
    getBounds,
    isMyPickMapMode,
    loadMyPickStores,
    myPickStores,
  ]);

  const handleDesktopSidebarToggle = useCallback(() => {
    const nextOpen = !isDesktopSidebarOpen;
    setIsDesktopSidebarOpen(nextOpen);
  }, [isDesktopSidebarOpen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isDesktopLayout()) return;

    const timer = window.setTimeout(() => {
      (map as kakao.maps.Map & { relayout?: () => void }).relayout?.();
      if (isMyPickOnlyView) {
        fitStoresToVisibleMap(map, myPickStores);
        fetchRegion();
        return;
      }
      fetchStores(getBounds(map, isDesktopSidebarOpen), categoryRef.current);
      fetchRegion();
    }, 320);

    return () => window.clearTimeout(timer);
  }, [
    fetchRegion,
    fetchStores,
    fitStoresToVisibleMap,
    getBounds,
    isDesktopLayout,
    isDesktopSidebarOpen,
    isMyPickOnlyView,
    myPickStores,
  ]);

  const desktopFloatingLeft = isDesktopSidebarOpen
    ? "calc(var(--home-sidebar-width) + 16px)"
    : "calc(var(--home-nav-width) + 16px)";
  const desktopFloatingMaxWidth = isDesktopSidebarOpen
    ? "calc(100vw - var(--home-sidebar-width) - 40px)"
    : "calc(100vw - var(--home-nav-width) - 40px)";

  // 플로팅 버튼 위치: 카드 열림 → 카드 위, collapsed → 시트(88px)+gap(8px) 위
  const floatingButtonBottom = selectedStore
    ? `${CARD_BOTTOM_PX + CARD_HEIGHT_PX}px`
    : "96px";

  return (
    <>
    <div className="relative flex-1 overflow-hidden">
      <KakaoMap className="h-full w-full" onReady={handleMapReady} />

      <MapOverlay
        category={category}
        onCategoryChange={handleCategoryChange}
        onPlaceSelect={handlePlaceSelect}
        searchPosition={searchPosition}
        onSearchOpen={handleSearchOpen}
        onSearchClose={handleSearchClose}
        desktopSidebarOpen={isDesktopSidebarOpen}
        desktopVisible={panelView === "ranking"}
      />

      <div
        className={[
          "home-desktop-panel absolute bottom-0 top-0 z-10 hidden flex-col border-r border-border bg-surface shadow-[4px_0_24px_rgba(0,0,0,0.08)] transition-transform duration-300 md:flex",
          isDesktopSidebarOpen ? "" : "is-closed",
        ].join(" ")}
        style={{
          "--desktop-panel-transform": isDesktopSidebarOpen
            ? "translateX(0)"
            : "translateX(calc(-1 * var(--home-panel-width)))",
        } as CSSProperties}
      >
        {panelView === "ranking" ? (
          <>
            <div className="px-5 pb-4 pt-24">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-tight text-text-secondary">
                    {isMyPickOnlyView ? "내 픽 지도" : "맛집 랭킹"}
                  </p>
                  <p className="mt-0.5 text-[18px] font-extrabold leading-snug tracking-tight text-text-primary">
                    {isMyPickOnlyView ? "내가 기록한 맛집" : rankingRegionName || "불러오는 중..."}
                  </p>
                </div>
                <MyPickMapToggle
                  checked={isMyPickOnlyView}
                  onChange={handleMyPickMapToggle}
                  disabled={isMyPickLoading}
                />
              </div>
            </div>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              {panelLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Spinner size={28} />
                </div>
              ) : panelStores.length === 0 ? (
                <div className="nepick-fade-in flex flex-col items-center justify-center px-5 py-16 text-text-secondary">
                  <p className="text-[15px]">
                    {isMyPickOnlyView ? "아직 내가 픽한 맛집이 없어요" : "이 지역에 기록된 가게가 없어요"}
                  </p>
                  <p className="mt-1 text-[13px]">
                    {isMyPickOnlyView ? "내 픽을 추가하면 지도에 표시됩니다" : "지도를 이동하거나 첫 기록을 남겨보세요!"}
                  </p>
                </div>
              ) : (
                <ul className="nepick-fade-in divide-y divide-border pb-6">
                  {panelStores.slice(0, isMyPickOnlyView ? panelStores.length : DESKTOP_RANKING_LIMIT).map((store, idx) => (
                    <li key={store.id}>
                      <StoreCard store={store} rank={idx + 1} onClick={handleStoreClick} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <HomePanelContent
            key={panelView}
            view={panelView}
            isMyPickMapMode={isMyPickOnlyView}
            onMyPickMapToggle={handleMyPickMapToggle}
            isMyPickLoading={isMyPickLoading}
          />
        )}
      </div>

      <button
        onClick={handleDesktopSidebarToggle}
        className={[
          "home-sidebar-toggle absolute top-1/2 z-40 hidden h-11 -translate-y-1/2 items-center justify-center gap-1 rounded-r-full border border-l-0 border-border bg-surface px-3 text-[12px] font-bold text-text-secondary shadow-lg transition-[left,colors] duration-300 hover:text-primary md:flex",
          isDesktopSidebarOpen ? "" : "is-closed",
        ].join(" ")}
        style={{
          left: isDesktopSidebarOpen ? "var(--home-sidebar-width)" : "var(--home-nav-width)",
        }}
        aria-label={isDesktopSidebarOpen ? "목록 숨기기" : "목록 보기"}
      >
        <span>{isDesktopSidebarOpen ? "<" : ">"}</span>
      </button>

      {!isMyPickOnlyView && (
        <div
          className="pointer-events-auto absolute top-5 z-30 hidden items-center gap-2 transition-[left] duration-300 md:flex"
          style={{
            left: desktopFloatingLeft,
            maxWidth: desktopFloatingMaxWidth,
          }}
        >
          {[
            { key: "restaurant" as const, label: "음식점" },
            { key: "cafe" as const, label: "카페" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleCategoryChange(item.key)}
              className={[
                "rounded-full border px-4 py-2 text-[13px] font-semibold shadow-md transition-colors",
                category === item.key
                  ? "border-primary bg-primary text-white"
                  : "border-primary bg-surface text-primary hover:bg-primary-soft",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {!isMyPickOnlyView && category === "restaurant" && (
        <div
          className="pointer-events-auto absolute top-[68px] z-30 hidden gap-2 overflow-x-auto whitespace-nowrap pb-2 transition-[left] duration-300 md:flex"
          style={{
            left: desktopFloatingLeft,
            maxWidth: desktopFloatingMaxWidth,
          }}
        >
          {RESTAURANT_SUBCATEGORIES.map((item) => (
            <button
              key={item}
              onClick={() => setRestaurantSubcategory(item)}
              className={[
                "shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-semibold shadow-md transition-colors",
                restaurantSubcategory === item
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-primary hover:border-primary",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* 랭킹 시트: 가게 카드가 없을 때만 표시 */}
      {!selectedStore && (
        <div className="md:hidden">
          <RankingSheet
            ref={rankingRef}
            stores={panelStores.slice(0, isMyPickOnlyView ? panelStores.length : revealedCount)}
            isLoading={panelLoading}
            page={rankingPage}
            totalPages={totalPages}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onStoreClick={handleStoreClick}
            onSnapChange={setSnap}
            defaultSnap={sheetDefaultSnap}
            regionName={rankingRegionName}
            isMyPickMode={isMyPickOnlyView}
            onMyPickToggle={handleMyPickMapToggle}
          />
        </div>
      )}

      {/* 플로팅 버튼 */}


      {/* 중앙 버튼 — 지도보기/카드 열림 시 랭킹보기 / 시트 열림 시 지도보기 */}
      {(isMapFull || !!selectedStore) && !isMyPickOnlyView ? (
        <button
          onClick={handleRankingToggle}
          className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-text-primary shadow-lg md:hidden"
          style={{ bottom: floatingButtonBottom, transition: "bottom 0.3s ease-out" }}
        >
          <span>🏆</span>
          <span>랭킹보기</span>
        </button>
      ) : !isMapFull && !isMyPickOnlyView && (
        <button
          onClick={handleCollapse}
          className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-text-primary shadow-lg md:hidden"
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
          className="map-location-button absolute right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-white shadow-lg transition-opacity disabled:opacity-50"
          style={{
            "--mobile-location-bottom": isMapFull || !!selectedStore
              ? floatingButtonBottom
              : "calc(50vh + 8px)",
            transition: "bottom 0.3s ease-out",
          } as CSSProperties}
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

    </div>

      {/* 선택된 가게 카드 — 지도 컨테이너 밖에서 렌더링하여 마커 위에 표시 */}
      {selectedStore && (
        <SelectedStoreCard
          store={selectedStore}
          rank={selectedRank}
          onClose={handleCloseCard}
          desktopSidebarOpen={isDesktopSidebarOpen}
        />
      )}

      <Modal
        isOpen={showNoPickModal}
        onClose={() => setShowNoPickModal(false)}
        variant="dialog"
        title="아직 내 픽이 없어요!"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" fullWidth onClick={() => setShowNoPickModal(false)}>
              취소
            </Button>
            <Button size="md" fullWidth onClick={() => { setShowNoPickModal(false); router.push("/record"); }}>
              내 픽 기록하기
            </Button>
          </div>
        }
      >
        <p className="text-[14px] text-text-secondary">내 픽을 기록하러 가볼까요?</p>
      </Modal>
    </>
  );
}

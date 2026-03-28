"use client";

import { useEffect, useRef, useState } from "react";

import { loadKakaoMapSDK, DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM } from "@/lib/kakao/map";

interface UseKakaoMapOptions {
  lat?: number;
  lng?: number;
  level?: number;
}

interface UseKakaoMapReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<kakao.maps.Map | null>;
  isReady: boolean;
}

/**
 * 카카오맵 인스턴스 관리 훅
 * map 인스턴스는 mapRef.current로 접근하세요 (이벤트 핸들러나 useEffect 내부에서만).
 *
 * @example
 * const { containerRef, mapRef, isReady } = useKakaoMap({ lat: 37.5, lng: 127.0 });
 * return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
 */
export function useKakaoMap({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  level = DEFAULT_ZOOM,
}: UseKakaoMapOptions = {}): UseKakaoMapReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadKakaoMapSDK()
      .then(() => {
        if (!mounted || !containerRef.current) return;

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(lat, lng),
          level,
        });

        mapRef.current = map;
        setIsReady(true);
      })
      .catch((err) => {
        console.error("[useKakaoMap] SDK 로드 실패:", err);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 의도적으로 의존성 배열 비움 — 지도는 마운트 시 한 번만 초기화

  return { containerRef, mapRef, isReady };
}

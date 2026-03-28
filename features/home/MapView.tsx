"use client";

import { useCallback, useRef } from "react";
import KakaoMap from "@/components/map/KakaoMap";
import RankingSheet from "./RankingSheet";

/**
 * 홈 화면 메인 맵 뷰
 * 지도 + 랭킹 바텀시트로 구성됩니다.
 */
export default function MapView() {
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);

  const handleMapReady = useCallback((map: kakao.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleStoreClick = useCallback((storeId: number) => {
    // TODO: 선택된 가게 마커로 지도 이동
    console.log("store clicked:", storeId);
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden">
      <KakaoMap
        className="h-full w-full"
        onReady={handleMapReady}
      />
      <RankingSheet onStoreClick={handleStoreClick} />
    </div>
  );
}

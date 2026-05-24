"use client";

import { useKakaoMap } from "@/hooks/use-kakao-map";
import Spinner from "@/components/ui/Spinner";

interface KakaoMapProps {
  lat?: number;
  lng?: number;
  level?: number;
  className?: string;
  /** 지도 위에 오버레이할 컨텐츠 */
  overlay?: React.ReactNode;
  /** 지도 준비 완료 콜백 */
  onReady?: (map: kakao.maps.Map) => void;
}

/**
 * 카카오맵 렌더링 컴포넌트
 * 지도 인스턴스가 필요하면 onReady 콜백을 사용하세요.
 */
export default function KakaoMap({
  lat,
  lng,
  level,
  className = "",
  overlay,
  onReady,
}: KakaoMapProps) {
  const { containerRef, isReady } = useKakaoMap({ lat, lng, level, onReady });

  return (
    <div className={`relative ${className}`}>
      {/* 카카오맵 컨테이너 */}
      <div ref={containerRef} className="h-full w-full" />

      {/* 로딩 상태 */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg">
          <Spinner color="var(--color-primary)" size={32} />
        </div>
      )}

      {/* 오버레이 */}
      {isReady && overlay && (
        <div className="pointer-events-none absolute inset-0">{overlay}</div>
      )}
    </div>
  );
}

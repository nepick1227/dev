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
  const { containerRef, isReady, error } = useKakaoMap({ lat, lng, level, onReady });

  return (
    <div className={`relative ${className}`}>
      {/* 카카오맵 컨테이너 */}
      <div ref={containerRef} className="h-full w-full" />

      {/* 로딩 상태 */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg">
          <Spinner color="var(--color-primary)" size={32} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg px-6 text-center">
          <div>
            <p className="text-[15px] font-bold tracking-tight text-text-primary">지도를 불러오지 못했어요</p>
            <p className="mt-1 text-[13px] leading-relaxed tracking-tight text-text-secondary">
              카카오맵 연결을 확인한 뒤 새로고침해 주세요.
            </p>
          </div>
        </div>
      )}

      {/* 오버레이 */}
      {isReady && overlay && (
        <div className="pointer-events-none absolute inset-0">{overlay}</div>
      )}
    </div>
  );
}

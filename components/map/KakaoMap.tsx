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
  const { containerRef, isReady, error, retry } = useKakaoMap({ lat, lng, level, onReady });

  return (
    <div className={`relative ${className}`}>
      {/* 카카오맵 컨테이너 */}
      <div ref={containerRef} className="h-full w-full" />

      {/* 로딩 상태 */}
      {!isReady && !error && (
        <div className="absolute inset-x-0 bottom-1/2 top-[130px] flex items-center justify-center bg-bg px-6 md:bottom-0 md:left-[var(--home-visible-sidebar-width,0px)] md:right-0 md:top-0 md:p-6">
          <Spinner color="var(--color-primary)" size={32} />
        </div>
      )}

      {error && (
        <div className="absolute inset-x-0 bottom-1/2 top-[130px] flex items-center justify-center bg-bg px-6 text-center md:bottom-0 md:left-[var(--home-visible-sidebar-width,0px)] md:right-0 md:top-0 md:p-6">
          <div>
            <p className="text-[15px] font-bold text-text-primary">지도를 불러오지 못했어요</p>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              네트워크 연결을 확인한 뒤 다시 시도해 주세요.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 h-10 rounded-xl border border-border bg-surface px-4 text-[13px] font-bold text-text-primary transition-colors hover:border-primary hover:text-primary active:bg-primary-soft"
            >
              다시 시도
            </button>
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

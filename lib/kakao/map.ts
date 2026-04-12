/**
 * 카카오맵 SDK 유틸리티
 * REST API 키는 절대 이 파일에 포함하지 않습니다.
 * 카카오 검색 API는 Edge Function(supabase/functions/kakao-search)을 통해 호출하세요.
 */

// 서울 시청 기본 좌표 (GPS 권한 거부 시 폴백)
export const DEFAULT_LAT = 37.5665;
export const DEFAULT_LNG = 126.978;
export const DEFAULT_ZOOM = 3;

/**
 * 카카오맵 SDK 동적 로드
 * 이미 로드된 경우 즉시 resolve합니다.
 */
export function loadKakaoMapSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("서버 환경에서는 카카오맵 SDK를 로드할 수 없습니다"));
      return;
    }

    // 이미 로드된 경우
    if (window.kakao?.maps) {
      resolve();
      return;
    }

    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!key) {
      reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 설정되지 않았습니다"));
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services,clusterer`;
    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("카카오맵 SDK 로드에 실패했습니다"));
    document.head.appendChild(script);
  });
}

/**
 * 현재 위치 조회
 * 권한 거부 또는 오류 시 서울 시청 좌표를 반환합니다.
 */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // 권한 거부 또는 타임아웃 → 기본 위치
        resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      },
      { timeout: 5000 }
    );
  });
}

/**
 * 추천도에 따른 마커 이미지 URL 반환
 */
export function getMarkerImageUrl(
  recommendation: "recommend" | "neutral" | "not_recommend"
): string {
  const map = {
    recommend: "/markers/marker-recommend.svg",
    neutral: "/markers/marker-neutral.svg",
    not_recommend: "/markers/marker-not-recommend.svg",
  };
  return map[recommendation];
}

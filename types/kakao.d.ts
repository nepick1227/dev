/**
 * 카카오맵 SDK 타입 선언 (전역)
 * 필요한 부분만 선언합니다.
 * 전체 SDK 타입이 필요하면 @types/kakao.maps.d.ts 패키지를 설치하세요.
 */

declare namespace kakao.maps {
  function load(callback: () => void): void;

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    setLevel(level: number): void;
    getLevel(): number;
    panTo(latlng: LatLng): void;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
    getPosition(): LatLng;
    setImage(image: MarkerImage): void;
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions);
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
    setContent(content: string | HTMLElement): void;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
    mapTypeId?: MapTypeId;
  }

  interface MarkerOptions {
    map?: Map;
    position?: LatLng;
    image?: MarkerImage;
    title?: string;
    clickable?: boolean;
  }

  interface MarkerImageOptions {
    offset?: Point;
    spriteSize?: Size;
    spriteOrigin?: Point;
  }

  interface CustomOverlayOptions {
    map?: Map;
    position: LatLng;
    content: string | HTMLElement;
    yAnchor?: number;
    xAnchor?: number;
    zIndex?: number;
  }

  const enum MapTypeId {
    ROADMAP = 1,
    SKYVIEW = 2,
    HYBRID = 3,
  }

  namespace services {
    class Places {
      keywordSearch(
        keyword: string,
        callback: (result: PlaceResult[], status: Status) => void,
        options?: PlaceSearchOptions
      ): void;
    }

    class Geocoder {
      coord2Address(
        lng: number,
        lat: number,
        callback: (result: AddressResult[], status: Status) => void
      ): void;
    }

    interface PlaceResult {
      id: string;
      place_name: string;
      category_name: string;
      category_group_code: string;
      address_name: string;
      road_address_name: string;
      phone: string;
      x: string; // lng
      y: string; // lat
      place_url: string;
      distance: string;
    }

    interface PlaceSearchOptions {
      category_group_code?: string;
      location?: LatLng;
      radius?: number;
      size?: number;
      page?: number;
      sort?: SortBy;
    }

    interface AddressResult {
      address: { address_name: string } | null;
      road_address: { address_name: string } | null;
    }

    const enum Status {
      OK = "OK",
      ZERO_RESULT = "ZERO_RESULT",
      ERROR = "ERROR",
    }

    const enum SortBy {
      ACCURACY = "accuracy",
      DISTANCE = "distance",
    }
  }
}

interface Window {
  kakao: typeof kakao;
}

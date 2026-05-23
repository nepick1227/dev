/**
 * NePick 데이터베이스 타입 정의
 * Supabase 테이블 구조와 1:1 매핑됩니다.
 * DB 스키마 변경 시 반드시 이 파일도 함께 업데이트하세요.
 */

// ── DB 테이블 타입 ──────────────────────────────────────

export interface Profile {
  id: string; // UUID (Supabase Auth user.id)
  nickname: string | null;
  birth_date: string | null; // ISO date string (YYYY-MM-DD)
  gender: "male" | "female" | "unknown";
  intro: string | null;
  profile_image: string | null; // Supabase Storage public URL
  is_public: boolean;
  marketing_agree: boolean;
  deleted_at: string | null;     // 탈퇴 요청 시각 (null = 정상 계정)
  withdrawal_reason: string | null; // 탈퇴 사유
  created_at: string; // ISO timestamp
  updated_at: string;
}

export interface Store {
  id: number;
  kakao_id: string; // 카카오 장소 ID
  name: string;
  category: "restaurant" | "cafe";
  subcategory: string | null; // 세부 카테고리 (예: 냉면, 커피전문점, 디저트카페)
  address: string; // 지번 주소
  road_address: string | null; // 도로명 주소
  lat: number;
  lng: number;
  phone: string | null;
  score: number; // 추천(+2) / 보통(+1) / 비추(0) 누적
  pick_count: number; // 총 기록 수
  created_at: string;
}

export interface Record {
  id: number;
  user_id: string; // UUID → profiles.id
  store_id: number; // → stores.id
  visited_at: string; // ISO timestamp
  recommendation: "recommend" | "neutral" | "not_recommend";
  comment: string;
  image_url: string | null; // Supabase Storage public URL
  created_at: string;
  updated_at: string;
}

// ── 조인 타입 ───────────────────────────────────────────

export type RecordWithStore = Record & {
  stores: Store;
};

export type RecordWithProfile = Record & {
  profiles: Profile;
};

// ── 폼 입력 타입 (DB 타입과 분리) ─────────────────────

export interface RecordFormData {
  // 가게 정보
  storeKakaoId: string;
  storeName: string;
  storeCategory: "restaurant" | "cafe";
  storeAddress: string;
  storeRoadAddress: string | null;
  storeLat: number;
  storeLng: number;
  storePhone: string | null;

  // 기록 정보
  visitedAt: Date;
  recommendation: "recommend" | "neutral" | "not_recommend";
  comment: string;
  imageFile: File | null;
}

export interface ProfileFormData {
  nickname: string;
  intro: string;
  imageFile: File | null;
  removeImage: boolean;
}

export interface SignupFormData {
  nickname: string;
  birthDate: string; // YYYY-MM-DD
  gender: "male" | "female" | "unknown";
  intro: string;
}

// ── Supabase Insert/Update 타입 ────────────────────────

export type StoreInsert = Omit<Store, "id" | "score" | "pick_count" | "created_at">;

export type RecordInsert = Omit<Record, "id" | "created_at" | "updated_at">;

export type ProfileUpdate = Partial<
  Pick<Profile, "nickname" | "intro" | "profile_image" | "birth_date" | "gender" | "is_public">
>;

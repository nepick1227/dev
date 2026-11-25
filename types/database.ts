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
  profile_image: string | null; // Supabase Storage path or legacy image URL
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
  subcategory: string | null; // 지도 필터용 대분류 (예: 한식, 중식, 커피전문점)
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
  image_url: string | null; // Supabase Storage path or legacy image URL
  created_at: string;
  updated_at: string;
}

// ── 네 픽 게시판 ────────────────────────────────────────
// 브라우저에서 직접 읽거나 쓸 수 없는 테이블입니다.
// app/api 서버 라우트가 service_role로 nepick_* 함수를 호출합니다.

export interface NepickBoard {
  id: number;
  slug: string; // 주소용 이름 (영문 소문자, 숫자, 하이픈)
  food_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface NepickBoardStore {
  id: number;
  board_id: number; // → nepick_boards.id
  store_id: number; // → stores.id
  created_by: string | null; // UUID → profiles.id
  is_hidden: boolean; // 운영자 숨김
  created_at: string;
}

export interface NepickPost {
  id: number;
  board_store_id: number; // → nepick_board_stores.id
  user_id: string; // UUID → profiles.id
  body: string; // 1~200자
  is_hidden: boolean; // 운영자 숨김
  deleted_at: string | null; // 본인 삭제 시각
  created_at: string;
}

export interface NepickPick {
  id: number;
  board_id: number; // → nepick_boards.id (게시판마다 한 사람 한 곳)
  board_store_id: number; // → nepick_board_stores.id
  user_id: string; // UUID → profiles.id
  reason_post_id: number; // → nepick_posts.id
  created_at: string;
}

export interface NepickVote {
  board_store_id: number; // → nepick_board_stores.id
  user_id: string; // UUID → profiles.id
  value: 1 | -1; // 추천 / 비추천
  created_at: string;
}

export interface NepickReport {
  id: number;
  reporter_id: string; // UUID → profiles.id
  board_store_id: number | null; // 가게 신고일 때
  post_id: number | null; // 글 신고일 때
  reason: string | null;
  created_at: string;
}

export interface NepickSuggestion {
  id: number;
  user_id: string; // UUID → profiles.id
  food_name: string;
  reason: string | null;
  created_at: string;
}

// ── 네 픽 함수 결과 타입 ────────────────────────────────

/** nepick_list_boards() */
export interface NepickBoardSummary {
  board_id: number;
  slug: string;
  food_name: string;
  store_count: number;
  pick_count: number;
  top_store_name: string | null;
  top_nepick_index: number | null;
}

/** nepick_list_board_stores(p_board_id, p_viewer_id) */
export interface NepickBoardStoreItem {
  board_store_id: number;
  store_id: number;
  name: string;
  category: Store["category"];
  subcategory: string | null;
  address: string;
  road_address: string | null;
  nepick_index: number;
  up_count: number; // 비추천 수는 내려 주지 않는다
  post_count: number;
  is_my_pick: boolean;
  my_vote: 1 | 0 | -1;
}

/** nepick_list_posts(p_board_id, p_viewer_id, p_board_store_id, p_per_store) */
export interface NepickPostItem {
  post_id: number;
  board_store_id: number;
  nickname: string | null; // 탈퇴한 사용자는 null
  body: string;
  is_picker: boolean; // [추천완료] 딱지
  is_mine: boolean;
  created_at: string;
}

/** nepick_list_store_badges(p_store_id) */
export interface NepickStoreBadge {
  slug: string;
  food_name: string;
  nepick_index: number;
}

/** nepick_pick_store(...) */
export interface NepickPickResult {
  board_store_id: number;
  post_id: number;
  previous_board_store_id: number | null;
  record_created: boolean;
}

/** 네 픽 쓰기 함수가 내는 오류 이름. 서버 라우트에서 안내 문구로 바꾼다 */
export type NepickErrorCode =
  | "nepick_authentication_required"
  | "nepick_profile_inactive"
  | "nepick_invalid_text"
  | "nepick_rate_limited"
  | "nepick_board_not_found"
  | "nepick_store_not_found"
  | "nepick_store_hidden"
  | "nepick_already_picked"
  | "nepick_switch_required"
  | "nepick_post_not_found"
  | "nepick_invalid_vote"
  | "nepick_vote_on_my_pick"
  | "nepick_invalid_report"
  | "nepick_already_reported";

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

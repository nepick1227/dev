export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // auth.users.id
          nickname: string;
          birth_date: string | null; // YYYY-MM-DD
          gender: "male" | "female" | "unknown" | null;
          intro: string | null;
          is_public: boolean;
          profile_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          birth_date?: string | null;
          gender?: "male" | "female" | "unknown" | null;
          intro?: string | null;
          is_public?: boolean;
          profile_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          birth_date?: string | null;
          gender?: "male" | "female" | "unknown" | null;
          intro?: string | null;
          is_public?: boolean;
          profile_image_url?: string | null;
          updated_at?: string;
        };
      };

      stores: {
        Row: {
          id: string;
          name: string;
          category: "식당" | "카페";
          address: string;
          kakao_place_id: string | null; // 카카오맵 장소 ID
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: "식당" | "카페";
          address: string;
          kakao_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          category?: "식당" | "카페";
          address?: string;
          kakao_place_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
      };

      records: {
        Row: {
          id: string;
          user_id: string; // profiles.id
          store_id: string; // stores.id
          recommendation: "recommend" | "neutral" | "notRecommend";
          comment: string;
          image_url: string | null;
          visited_at: string; // ISO 8601
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_id: string;
          recommendation: "recommend" | "neutral" | "notRecommend";
          comment: string;
          image_url?: string | null;
          visited_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          recommendation?: "recommend" | "neutral" | "notRecommend";
          comment?: string;
          image_url?: string | null;
          visited_at?: string;
          updated_at?: string;
        };
      };
    };

    Views: {
      store_rankings: {
        Row: {
          store_id: string;
          name: string;
          category: "식당" | "카페";
          address: string;
          latitude: number | null;
          longitude: number | null;
          pick_count: number; // records 수
          rank: number;
        };
      };
    };

    Functions: {
      // 추후 RPC 함수 추가
    };

    Enums: {
      recommendation_type: "recommend" | "neutral" | "notRecommend";
      gender_type: "male" | "female" | "unknown";
      store_category: "식당" | "카페";
    };
  };
};

// 편의 타입 (Row 타입 단축)
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Record = Database["public"]["Tables"]["records"]["Row"];
export type StoreRanking = Database["public"]["Views"]["store_rankings"]["Row"];

// records + stores 조인 타입 (내픽 목록 조회 시)
export type RecordWithStore = Record & {
  stores: Pick<Store, "name" | "category" | "address">;
};

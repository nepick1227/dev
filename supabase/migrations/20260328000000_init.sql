-- ============================================================
-- NePick 초기 스키마
-- ============================================================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname         text NOT NULL,
  birth_date       date,
  gender           text CHECK (gender IN ('male', 'female', 'unknown')),
  intro            text CHECK (char_length(intro) <= 100),
  is_public        boolean NOT NULL DEFAULT true,
  profile_image_url text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- stores
CREATE TABLE IF NOT EXISTS public.stores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text NOT NULL CHECK (category IN ('식당', '카페')),
  address         text NOT NULL,
  kakao_place_id  text UNIQUE,
  latitude        double precision,
  longitude       double precision,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- records
CREATE TABLE IF NOT EXISTS public.records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id        uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  recommendation  text NOT NULL CHECK (recommendation IN ('recommend', 'neutral', 'notRecommend')),
  comment         text NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 500),
  image_url       text,
  visited_at      timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_records_user_id   ON public.records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_store_id  ON public.records(store_id);
CREATE INDEX IF NOT EXISTS idx_records_visited_at ON public.records(visited_at DESC);

-- ============================================================
-- store_rankings 뷰 (픽 수 기반 랭킹)
-- ============================================================
CREATE OR REPLACE VIEW public.store_rankings AS
SELECT
  s.id            AS store_id,
  s.name,
  s.category,
  s.address,
  s.latitude,
  s.longitude,
  COUNT(r.id)     AS pick_count,
  RANK() OVER (ORDER BY COUNT(r.id) DESC) AS rank
FROM public.stores s
LEFT JOIN public.records r ON r.store_id = s.id
GROUP BY s.id;

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records  ENABLE ROW LEVEL SECURITY;

-- profiles: 본인만 수정, 공개 프로필은 누구나 조회
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (is_public = true OR auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- stores: 누구나 조회, 인증된 사용자만 등록
CREATE POLICY "stores_select" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "stores_insert" ON public.stores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- records: 본인 기록만 CRUD
CREATE POLICY "records_select" ON public.records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "records_insert" ON public.records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "records_update" ON public.records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "records_delete" ON public.records
  FOR DELETE USING (auth.uid() = user_id);

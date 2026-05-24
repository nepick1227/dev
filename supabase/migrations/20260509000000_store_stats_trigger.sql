-- ============================================================
-- record 저장/삭제 시 stores.pick_count, stores.score 자동 갱신
-- score 기준: recommend = +2, neutral = +1, not_recommend = +0
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_image text,
  ADD COLUMN IF NOT EXISTS marketing_agree boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawal_reason text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'profile_image_url'
  ) THEN
    EXECUTE 'UPDATE public.profiles SET profile_image = COALESCE(profile_image, profile_image_url) WHERE profile_image IS NULL';
  END IF;
END;
$$;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS kakao_id text,
  ADD COLUMN IF NOT EXISTS road_address text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS pick_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stores'
      AND column_name = 'kakao_place_id'
  ) THEN
    EXECUTE 'UPDATE public.stores SET kakao_id = COALESCE(kakao_id, kakao_place_id) WHERE kakao_id IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stores'
      AND column_name = 'latitude'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stores'
      AND column_name = 'longitude'
  ) THEN
    EXECUTE 'UPDATE public.stores SET lat = COALESCE(lat, latitude), lng = COALESCE(lng, longitude) WHERE lat IS NULL OR lng IS NULL';
  END IF;

  UPDATE public.stores
  SET category = CASE category
    WHEN '식당' THEN 'restaurant'
    WHEN '카페' THEN 'cafe'
    ELSE category
  END;
END;
$$;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_category_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stores_category_check'
      AND conrelid = 'public.stores'::regclass
  ) THEN
    ALTER TABLE public.stores
      ADD CONSTRAINT stores_category_check
        CHECK (category IN ('restaurant', 'cafe'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stores_kakao_id_key'
      AND conrelid = 'public.stores'::regclass
  ) THEN
    ALTER TABLE public.stores
      ADD CONSTRAINT stores_kakao_id_key UNIQUE (kakao_id);
  END IF;
END;
$$;

ALTER TABLE public.records
  DROP CONSTRAINT IF EXISTS records_recommendation_check;

UPDATE public.records
SET recommendation = 'not_recommend'
WHERE recommendation = 'notRecommend';

ALTER TABLE public.records
  ADD CONSTRAINT records_recommendation_check
    CHECK (recommendation IN ('recommend', 'neutral', 'not_recommend'));

CREATE OR REPLACE FUNCTION public.update_store_stats()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_score_delta int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_score_delta := CASE NEW.recommendation
      WHEN 'recommend'     THEN 2
      WHEN 'neutral'       THEN 1
      ELSE                      0
    END;
    UPDATE public.stores
    SET pick_count = pick_count + 1,
        score      = score + v_score_delta
    WHERE id = NEW.store_id;

  ELSIF TG_OP = 'DELETE' THEN
    v_score_delta := CASE OLD.recommendation
      WHEN 'recommend'     THEN 2
      WHEN 'neutral'       THEN 1
      ELSE                      0
    END;
    UPDATE public.stores
    SET pick_count = GREATEST(pick_count - 1, 0),
        score      = GREATEST(score - v_score_delta, 0)
    WHERE id = OLD.store_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- 추천 유형이 바뀐 경우만 보정
    IF OLD.recommendation IS DISTINCT FROM NEW.recommendation THEN
      DECLARE
        v_old_score int := CASE OLD.recommendation WHEN 'recommend' THEN 2 WHEN 'neutral' THEN 1 ELSE 0 END;
        v_new_score int := CASE NEW.recommendation WHEN 'recommend' THEN 2 WHEN 'neutral' THEN 1 ELSE 0 END;
      BEGIN
        UPDATE public.stores
        SET score = GREATEST(score - v_old_score + v_new_score, 0)
        WHERE id = NEW.store_id;
      END;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_records_store_stats ON public.records;
CREATE TRIGGER trg_records_store_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.update_store_stats();

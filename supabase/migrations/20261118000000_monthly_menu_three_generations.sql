-- 월간 메뉴판 생성 횟수를 한 달 2회에서 3회로 늘린다.
-- 기존 migration(20260621000000_monthly_menu.sql)은 이미 적용됐을 수 있으므로 수정하지 않고 새 파일로 바꾼다.

-- 1) 테이블 CHECK 제약: 0~2 → 0~3
--    기존 제약은 컬럼에 이름 없이 붙어 있어 자동 생성된 이름을 찾아 지운다
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.monthly_menu_usage'::regclass
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%generation_count%'
  LOOP
    EXECUTE format('ALTER TABLE public.monthly_menu_usage DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.monthly_menu_usage
  ADD CONSTRAINT monthly_menu_usage_generation_count_check
  CHECK (generation_count BETWEEN 0 AND 3);

-- 2) 차감 함수: 최대 횟수 2 → 3 (그 밖의 동작은 기존과 같음)
CREATE OR REPLACE FUNCTION public.claim_monthly_menu_generation(p_source_month date)
RETURNS smallint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_count smallint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  INSERT INTO public.monthly_menu_usage (
    user_id,
    source_month,
    generation_count,
    last_generated_at
  )
  VALUES (
    auth.uid(),
    date_trunc('month', p_source_month)::date,
    1,
    now()
  )
  ON CONFLICT (user_id, source_month)
  DO UPDATE SET
    generation_count = public.monthly_menu_usage.generation_count + 1,
    last_generated_at = now()
  WHERE public.monthly_menu_usage.generation_count < 3
  RETURNING generation_count INTO next_count;

  IF next_count IS NULL THEN
    RAISE EXCEPTION 'monthly_menu_limit_reached';
  END IF;

  RETURN next_count;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_monthly_menu_generation(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_monthly_menu_generation(date) TO authenticated;

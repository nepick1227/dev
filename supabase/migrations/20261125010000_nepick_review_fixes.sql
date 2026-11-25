-- ============================================================
-- 네 픽 게시판 DB 리뷰 반영 (#55 코드 리뷰)
-- 20261125000000_nepick_boards.sql은 개발 DB에 이미 적용돼 있어 수정하지 않고 새 파일로 바꾼다.
-- 기존 데이터는 지우거나 바꾸지 않는다.
-- ============================================================

-- ------------------------------------------------------------
-- 1. 인덱스
-- ------------------------------------------------------------
CREATE INDEX idx_nepick_board_stores_store ON public.nepick_board_stores(store_id);
CREATE INDEX idx_nepick_picks_reason_post ON public.nepick_picks(reason_post_id);

-- ------------------------------------------------------------
-- 2. 공통 함수 (다른 함수 안에서만 쓴다)
-- ------------------------------------------------------------

-- 앞뒤의 공백과 눈에 보이지 않는 문자를 잘라 낸다.
-- 일반 공백·탭·줄바꿈, NBSP, 전각 공백, 한글 채움 문자, 폭 없는 문자
CREATE FUNCTION public.nepick_clean_text(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT btrim(
    COALESCE(p_text, ''),
    E' \t\r\n\u00A0\u115F\u1160\u200B\u200C\u200D\u2060\u3000\u3164\uFEFF\uFFA0'
  );
$$;

-- 글을 쓸 수 있는 가게인지: 게시판이 열려 있고 가게가 숨겨지지 않음
CREATE FUNCTION public.nepick_board_store_is_writable(p_board_store_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nepick_board_stores AS board_store
    JOIN public.nepick_boards AS board ON board.id = board_store.board_id
    WHERE board_store.id = p_board_store_id
      AND NOT board_store.is_hidden
      AND board.is_active
  );
$$;

-- 화면에 보이는 가게인지: nepick_visible_board_stores와 같은 조건을 집계 없이 확인한다
CREATE FUNCTION public.nepick_board_store_is_visible(p_board_store_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT public.nepick_board_store_is_writable(p_board_store_id)
    AND (
      EXISTS (
        SELECT 1
        FROM public.nepick_posts AS post
        WHERE post.board_store_id = p_board_store_id
          AND NOT post.is_hidden
          AND post.deleted_at IS NULL
      )
      OR EXISTS (
        SELECT 1
        FROM public.nepick_active_picks AS pick
        WHERE pick.board_store_id = p_board_store_id
      )
    );
$$;

DO $$
DECLARE
  v_function regprocedure;
BEGIN
  FOREACH v_function IN ARRAY ARRAY[
    'public.nepick_clean_text(text)',
    'public.nepick_board_store_is_writable(bigint)',
    'public.nepick_board_store_is_visible(bigint)'
  ]::regprocedure[]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_function);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_function);
  END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- 3. 보이지 않는 문자만 있는 글 막기 (테이블)
-- ------------------------------------------------------------
ALTER TABLE public.nepick_posts
  ADD CONSTRAINT nepick_posts_body_visible_check
  CHECK (public.nepick_clean_text(body) <> '');

ALTER TABLE public.nepick_suggestions
  ADD CONSTRAINT nepick_suggestions_food_name_visible_check
  CHECK (public.nepick_clean_text(food_name) <> '');

-- ------------------------------------------------------------
-- 4. 읽기 함수
-- ------------------------------------------------------------

-- 게시판 목록: 집계 뷰를 한 번만 읽는다 (결과는 이전과 같음)
CREATE OR REPLACE FUNCTION public.nepick_list_boards()
RETURNS TABLE (
  board_id bigint,
  slug text,
  food_name text,
  store_count integer,
  pick_count integer,
  top_store_name text,
  top_nepick_index integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH ranked AS (
    SELECT
      visible.board_id,
      visible.store_id,
      visible.nepick_index,
      COUNT(*) OVER board_window AS store_count,
      SUM(visible.nepick_index) OVER board_window AS pick_count,
      ROW_NUMBER() OVER (
        PARTITION BY visible.board_id
        ORDER BY visible.nepick_index DESC, visible.vote_score DESC, visible.created_at, visible.id
      ) AS position
    FROM public.nepick_visible_board_stores AS visible
    WINDOW board_window AS (PARTITION BY visible.board_id)
  )
  SELECT
    board.id,
    board.slug,
    board.food_name,
    COALESCE(ranked.store_count, 0)::integer,
    COALESCE(ranked.pick_count, 0)::integer,
    CASE WHEN ranked.nepick_index > 0 THEN store.name END,
    CASE WHEN ranked.nepick_index > 0 THEN ranked.nepick_index END
  FROM public.nepick_boards AS board
  LEFT JOIN ranked ON ranked.board_id = board.id AND ranked.position = 1
  LEFT JOIN public.stores AS store ON store.id = ranked.store_id
  WHERE board.is_active
  ORDER BY board.sort_order, board.id;
$$;

-- 게시판 안 가게 순위: 숨김으로 무효가 된 추천은 '내 추천'으로 보지 않는다
CREATE OR REPLACE FUNCTION public.nepick_list_board_stores(p_board_id bigint, p_viewer_id uuid DEFAULT NULL)
RETURNS TABLE (
  board_store_id bigint,
  store_id bigint,
  name text,
  category text,
  subcategory text,
  address text,
  road_address text,
  nepick_index integer,
  up_count integer,
  post_count integer,
  is_my_pick boolean,
  my_vote smallint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    visible.id,
    store.id,
    store.name,
    store.category,
    store.subcategory,
    store.address,
    store.road_address,
    visible.nepick_index,
    visible.up_count,
    visible.post_count,
    EXISTS (
      SELECT 1
      FROM public.nepick_active_picks AS my_pick
      WHERE my_pick.board_store_id = visible.id AND my_pick.user_id = p_viewer_id
    ),
    COALESCE(my_vote.value, 0::smallint)
  FROM public.nepick_visible_board_stores AS visible
  JOIN public.stores AS store ON store.id = visible.store_id
  LEFT JOIN public.nepick_votes AS my_vote
    ON my_vote.board_store_id = visible.id AND my_vote.user_id = p_viewer_id
  WHERE visible.board_id = p_board_id
  ORDER BY visible.nepick_index DESC, visible.vote_score DESC, visible.created_at, visible.id;
$$;

-- ------------------------------------------------------------
-- 5. 쓰기 함수
--    이름과 인자가 같으므로 기존 실행 권한(service_role만)이 유지된다.
-- ------------------------------------------------------------

-- 글 저장 공통. 직접 불러도 계정과 가게 상태를 확인한다.
CREATE OR REPLACE FUNCTION public.nepick_insert_post(p_user_id uuid, p_board_store_id bigint, p_body text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_body text := public.nepick_clean_text(p_body);
  v_post_id bigint;
BEGIN
  PERFORM public.nepick_begin_write(p_user_id);

  IF NOT public.nepick_board_store_is_writable(p_board_store_id) THEN
    RAISE EXCEPTION 'nepick_store_not_found';
  END IF;

  IF char_length(v_body) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'nepick_invalid_text';
  END IF;

  IF (
    SELECT COUNT(*) FILTER (WHERE post.created_at > now() - interval '1 minute') >= 5
      OR COUNT(*) >= 50
    FROM public.nepick_posts AS post
    WHERE post.user_id = p_user_id AND post.created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'nepick_rate_limited';
  END IF;

  INSERT INTO public.nepick_posts (board_store_id, user_id, body)
  VALUES (p_board_store_id, p_user_id, v_body)
  RETURNING id INTO v_post_id;

  RETURN v_post_id;
END;
$$;

-- 추천하기
CREATE OR REPLACE FUNCTION public.nepick_pick_store(
  p_user_id uuid,
  p_board_id bigint,
  p_store_id bigint,
  p_reason text,
  p_allow_switch boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_board_store_id bigint;
  v_is_hidden boolean;
  v_previous_id bigint;
  v_previous_is_effective boolean;
  v_post_id bigint;
  v_record_created boolean := false;
BEGIN
  PERFORM public.nepick_begin_write(p_user_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.nepick_boards AS board WHERE board.id = p_board_id AND board.is_active
  ) THEN
    RAISE EXCEPTION 'nepick_board_not_found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.stores AS store WHERE store.id = p_store_id) THEN
    RAISE EXCEPTION 'nepick_store_not_found';
  END IF;

  INSERT INTO public.nepick_board_stores (board_id, store_id, created_by)
  VALUES (p_board_id, p_store_id, p_user_id)
  ON CONFLICT (board_id, store_id) DO NOTHING;

  SELECT board_store.id, board_store.is_hidden
  INTO v_board_store_id, v_is_hidden
  FROM public.nepick_board_stores AS board_store
  WHERE board_store.board_id = p_board_id AND board_store.store_id = p_store_id;

  IF v_is_hidden THEN
    RAISE EXCEPTION 'nepick_store_hidden';
  END IF;

  -- 운영자가 가게나 추천 이유를 숨겨 지수에서 빠진 추천은 확인 없이 새 추천으로 바꾼다.
  -- (화면에 보이지 않는 추천 때문에 다시 추천하지 못하는 것을 막는다)
  SELECT pick.board_store_id, NOT board_store.is_hidden AND NOT reason_post.is_hidden
  INTO v_previous_id, v_previous_is_effective
  FROM public.nepick_picks AS pick
  JOIN public.nepick_board_stores AS board_store ON board_store.id = pick.board_store_id
  JOIN public.nepick_posts AS reason_post ON reason_post.id = pick.reason_post_id
  WHERE pick.board_id = p_board_id AND pick.user_id = p_user_id;

  IF v_previous_id = v_board_store_id AND v_previous_is_effective THEN
    RAISE EXCEPTION 'nepick_already_picked';
  END IF;

  IF v_previous_id IS NOT NULL
    AND v_previous_id <> v_board_store_id
    AND v_previous_is_effective
    AND NOT COALESCE(p_allow_switch, false) THEN
    RAISE EXCEPTION 'nepick_switch_required';
  END IF;

  v_post_id := public.nepick_insert_post(p_user_id, v_board_store_id, p_reason);

  DELETE FROM public.nepick_picks AS pick
  WHERE pick.board_id = p_board_id AND pick.user_id = p_user_id;

  INSERT INTO public.nepick_picks (board_id, board_store_id, user_id, reason_post_id)
  VALUES (p_board_id, v_board_store_id, p_user_id, v_post_id);

  -- 내 한 곳으로 고른 가게에는 추천/비추천을 누를 수 없으므로 눌러 둔 것을 지운다
  DELETE FROM public.nepick_votes AS vote
  WHERE vote.board_store_id = v_board_store_id AND vote.user_id = p_user_id;

  -- 이 가게에 내 기록이 없을 때만 자동으로 남긴다
  IF NOT EXISTS (
    SELECT 1
    FROM public.records AS record
    WHERE record.user_id = p_user_id AND record.store_id = p_store_id
  ) THEN
    INSERT INTO public.records (user_id, store_id, recommendation, comment, visited_at)
    SELECT p_user_id, p_store_id, 'recommend', post.body, now()
    FROM public.nepick_posts AS post
    WHERE post.id = v_post_id;
    v_record_created := true;
  END IF;

  RETURN jsonb_build_object(
    'board_store_id', v_board_store_id,
    'post_id', v_post_id,
    'previous_board_store_id', v_previous_id,
    'record_created', v_record_created
  );
END;
$$;

-- 일반 댓글
CREATE OR REPLACE FUNCTION public.nepick_add_post(p_user_id uuid, p_board_store_id bigint, p_body text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.nepick_begin_write(p_user_id);

  IF NOT public.nepick_board_store_is_visible(p_board_store_id) THEN
    RAISE EXCEPTION 'nepick_store_not_found';
  END IF;

  RETURN public.nepick_insert_post(p_user_id, p_board_store_id, p_body);
END;
$$;

-- 추천(1) / 비추천(-1) / 취소(0)
CREATE OR REPLACE FUNCTION public.nepick_set_vote(p_user_id uuid, p_board_store_id bigint, p_value integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.nepick_begin_write(p_user_id);

  IF p_value IS NULL OR p_value NOT IN (1, 0, -1) THEN
    RAISE EXCEPTION 'nepick_invalid_vote';
  END IF;

  IF NOT public.nepick_board_store_is_visible(p_board_store_id) THEN
    RAISE EXCEPTION 'nepick_store_not_found';
  END IF;

  -- 무효가 된 추천은 막지 않는다. 취소(0)는 언제나 할 수 있다
  -- (무효일 때 눌러 둔 뒤 운영자가 숨김을 풀면 추천과 투표가 함께 남을 수 있다)
  IF p_value <> 0 AND EXISTS (
    SELECT 1
    FROM public.nepick_active_picks AS pick
    WHERE pick.board_store_id = p_board_store_id AND pick.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'nepick_vote_on_my_pick';
  END IF;

  IF p_value = 0 THEN
    DELETE FROM public.nepick_votes AS vote
    WHERE vote.board_store_id = p_board_store_id AND vote.user_id = p_user_id;
  ELSE
    INSERT INTO public.nepick_votes (board_store_id, user_id, value)
    VALUES (p_board_store_id, p_user_id, p_value)
    ON CONFLICT (board_store_id, user_id) DO UPDATE SET value = EXCLUDED.value;
  END IF;
END;
$$;

-- 신고
CREATE OR REPLACE FUNCTION public.nepick_report(
  p_user_id uuid,
  p_board_store_id bigint,
  p_post_id bigint,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_reason text := NULLIF(public.nepick_clean_text(p_reason), '');
BEGIN
  PERFORM public.nepick_begin_write(p_user_id);

  IF num_nonnulls(p_board_store_id, p_post_id) <> 1 THEN
    RAISE EXCEPTION 'nepick_invalid_report';
  END IF;

  IF char_length(v_reason) > 200 THEN
    RAISE EXCEPTION 'nepick_invalid_text';
  END IF;

  IF p_board_store_id IS NOT NULL AND NOT public.nepick_board_store_is_visible(p_board_store_id) THEN
    RAISE EXCEPTION 'nepick_store_not_found';
  END IF;

  IF p_post_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.nepick_posts AS post
    WHERE post.id = p_post_id
      AND NOT post.is_hidden
      AND post.deleted_at IS NULL
      AND public.nepick_board_store_is_writable(post.board_store_id)
  ) THEN
    RAISE EXCEPTION 'nepick_post_not_found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.nepick_reports AS report
    WHERE report.reporter_id = p_user_id
      AND (report.board_store_id = p_board_store_id OR report.post_id = p_post_id)
  ) THEN
    RAISE EXCEPTION 'nepick_already_reported';
  END IF;

  IF (
    SELECT COUNT(*) >= 20
    FROM public.nepick_reports AS report
    WHERE report.reporter_id = p_user_id AND report.created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'nepick_rate_limited';
  END IF;

  INSERT INTO public.nepick_reports (reporter_id, board_store_id, post_id, reason)
  VALUES (p_user_id, p_board_store_id, p_post_id, v_reason);
END;
$$;

-- 음식 제안
CREATE OR REPLACE FUNCTION public.nepick_suggest_food(p_user_id uuid, p_food_name text, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_food_name text := public.nepick_clean_text(p_food_name);
  v_reason text := NULLIF(public.nepick_clean_text(p_reason), '');
BEGIN
  PERFORM public.nepick_begin_write(p_user_id);

  IF char_length(v_food_name) NOT BETWEEN 1 AND 20 OR char_length(v_reason) > 200 THEN
    RAISE EXCEPTION 'nepick_invalid_text';
  END IF;

  IF (
    SELECT COUNT(*) >= 5
    FROM public.nepick_suggestions AS suggestion
    WHERE suggestion.user_id = p_user_id AND suggestion.created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'nepick_rate_limited';
  END IF;

  INSERT INTO public.nepick_suggestions (user_id, food_name, reason)
  VALUES (p_user_id, v_food_name, v_reason);
END;
$$;

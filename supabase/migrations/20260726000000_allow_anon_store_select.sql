-- 비로그인 사용자도 지도/랭킹에서 공개 가게 정보를 볼 수 있도록 허용.
-- stores는 카카오 API로 검증된 공개 정보이며 개인 데이터가 아니므로 anon
-- select를 열어도 안전함. records/profiles는 계속 authenticated로만 제한.
DROP POLICY IF EXISTS "stores_select" ON public.stores;

CREATE POLICY "stores_select"
  ON public.stores
  FOR SELECT
  TO anon, authenticated
  USING (true);

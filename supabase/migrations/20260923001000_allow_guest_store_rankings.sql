-- Guests can browse Kakao-verified public place data on the home map.
-- Personal records and profiles remain restricted to their existing policies.

DROP POLICY IF EXISTS "stores_select" ON public.stores;

CREATE POLICY "stores_select"
  ON public.stores
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Store rows are shared reference data. They must be created through the
-- server-side Kakao verification endpoint, not directly from a browser.
DROP POLICY IF EXISTS "stores_insert" ON public.stores;

-- ============================================================
-- Public stores are shared Kakao place snapshots.
-- Users can insert missing places, but cannot update existing rows.
-- Personal visit history is stored separately in public.records.
-- ============================================================

DROP POLICY IF EXISTS "stores_update" ON public.stores;

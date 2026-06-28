-- ============================================================
-- Harden RLS policies with explicit authenticated targets and
-- WITH CHECK clauses for mutable owner-scoped rows.
-- ============================================================

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "stores_insert" ON public.stores;
DROP POLICY IF EXISTS "records_insert" ON public.records;
DROP POLICY IF EXISTS "records_update" ON public.records;
DROP POLICY IF EXISTS "records_delete" ON public.records;

CREATE POLICY "profiles_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "stores_insert"
  ON public.stores
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "records_insert"
  ON public.records
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "records_update"
  ON public.records
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "records_delete"
  ON public.records
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

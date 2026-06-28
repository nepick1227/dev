-- Keep read policies explicit. Anonymous users should not be able to enumerate
-- app data through the Supabase Data API.
DROP POLICY IF EXISTS "stores_select" ON public.stores;
DROP POLICY IF EXISTS "records_select" ON public.records;
DROP POLICY IF EXISTS "monthly_menu_usage_select" ON public.monthly_menu_usage;

CREATE POLICY "stores_select"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "records_select"
  ON public.records
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "monthly_menu_usage_select"
  ON public.monthly_menu_usage
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

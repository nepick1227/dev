-- Keep profile rows private. Public profile display should use a separate
-- minimal view/function if it is needed later.
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE OR REPLACE FUNCTION public.is_active_nickname_available(p_nickname text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE nickname = btrim(p_nickname)
      AND deleted_at IS NULL
      AND id <> auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_active_nickname_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_nickname_available(text) TO authenticated;

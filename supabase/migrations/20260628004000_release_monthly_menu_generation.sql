-- Roll back a claimed monthly menu generation when the app fails before
-- producing a usable result. Kept in a new migration so existing databases
-- receive the function even if the original monthly menu migration already ran.
CREATE OR REPLACE FUNCTION public.release_monthly_menu_generation(p_source_month date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  UPDATE public.monthly_menu_usage
  SET generation_count = GREATEST(generation_count - 1, 0)
  WHERE user_id = auth.uid()
    AND source_month = date_trunc('month', p_source_month)::date
    AND generation_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.release_monthly_menu_generation(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_monthly_menu_generation(date) TO authenticated;

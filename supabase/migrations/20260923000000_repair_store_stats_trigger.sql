-- Restore store counters after direct store updates were blocked by RLS.
-- The trigger verifies record ownership, then updates only derived counters.

CREATE OR REPLACE FUNCTION public.update_store_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_role text := (SELECT auth.role());
  v_store_id bigint;
  v_previous_store_id bigint;
BEGIN
  IF v_user_id IS NULL AND v_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Authentication required to update store statistics';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF v_role IS DISTINCT FROM 'service_role'
      AND NEW.user_id IS DISTINCT FROM v_user_id THEN
      RAISE EXCEPTION 'Cannot update store statistics for another user';
    END IF;
    v_store_id := NEW.store_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF v_role IS DISTINCT FROM 'service_role'
      AND (OLD.user_id IS DISTINCT FROM v_user_id
        OR NEW.user_id IS DISTINCT FROM v_user_id) THEN
      RAISE EXCEPTION 'Cannot update store statistics for another user';
    END IF;
    v_store_id := NEW.store_id;
    v_previous_store_id := OLD.store_id;
  ELSE
    IF v_role IS DISTINCT FROM 'service_role'
      AND OLD.user_id IS DISTINCT FROM v_user_id THEN
      RAISE EXCEPTION 'Cannot update store statistics for another user';
    END IF;
    v_store_id := OLD.store_id;
  END IF;

  UPDATE public.stores AS store
  SET
    pick_count = stats.pick_count,
    score = stats.score
  FROM (
    SELECT
      COUNT(*)::integer AS pick_count,
      COALESCE(SUM(
        CASE record.recommendation
          WHEN 'recommend' THEN 2
          WHEN 'neutral' THEN 1
          ELSE 0
        END
      ), 0)::integer AS score
    FROM public.records AS record
    WHERE record.store_id = v_store_id
  ) AS stats
  WHERE store.id = v_store_id;

  IF v_previous_store_id IS NOT NULL
    AND v_previous_store_id IS DISTINCT FROM v_store_id THEN
    UPDATE public.stores AS store
    SET
      pick_count = stats.pick_count,
      score = stats.score
    FROM (
      SELECT
        COUNT(*)::integer AS pick_count,
        COALESCE(SUM(
          CASE record.recommendation
            WHEN 'recommend' THEN 2
            WHEN 'neutral' THEN 1
            ELSE 0
          END
        ), 0)::integer AS score
      FROM public.records AS record
      WHERE record.store_id = v_previous_store_id
    ) AS stats
    WHERE store.id = v_previous_store_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.update_store_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_store_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_store_stats() TO service_role;

DROP TRIGGER IF EXISTS trg_records_store_stats ON public.records;
CREATE TRIGGER trg_records_store_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.update_store_stats();

-- Repair counters for records created before this trigger could bypass store RLS.
UPDATE public.stores AS store
SET
  pick_count = stats.pick_count,
  score = stats.score
FROM (
  SELECT
    source_store.id AS store_id,
    COUNT(record.id)::integer AS pick_count,
    COALESCE(SUM(
      CASE record.recommendation
        WHEN 'recommend' THEN 2
        WHEN 'neutral' THEN 1
        ELSE 0
      END
    ), 0)::integer AS score
  FROM public.stores AS source_store
  LEFT JOIN public.records AS record ON record.store_id = source_store.id
  GROUP BY source_store.id
) AS stats
WHERE store.id = stats.store_id
  AND (
    store.pick_count IS DISTINCT FROM stats.pick_count
    OR store.score IS DISTINCT FROM stats.score
  );

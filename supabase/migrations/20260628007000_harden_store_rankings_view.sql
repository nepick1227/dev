-- Make the ranking view obey the permissions of the caller instead of the
-- view owner. This prevents accidental RLS bypass if the view changes later.
CREATE OR REPLACE VIEW public.store_rankings
WITH (security_invoker = true)
AS
SELECT
  s.id            AS store_id,
  s.name,
  s.category,
  s.subcategory,
  s.address,
  s.road_address,
  s.lat,
  s.lng,
  s.phone,
  s.pick_count,
  s.score,
  RANK() OVER (ORDER BY s.score DESC, s.pick_count DESC) AS rank
FROM public.stores s
GROUP BY s.id;

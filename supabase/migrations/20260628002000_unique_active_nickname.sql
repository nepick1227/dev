-- ============================================================
-- Active profiles cannot share nicknames.
-- Withdrawn profiles (deleted_at is not null) release their nickname.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS profiles_active_nickname_key
  ON public.profiles (nickname)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 탈퇴 사유 길이를 DB 수준에서 500자로 제한
-- 프론트 Textarea maxLength와 동일한 기준을 서버에서도 강제한다.
-- ============================================================

-- 제약 추가 전에 기존 초과 데이터를 잘라 마이그레이션 실패를 방지한다.
UPDATE public.profiles
SET withdrawal_reason = left(withdrawal_reason, 500)
WHERE char_length(withdrawal_reason) > 500;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_withdrawal_reason_length_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_withdrawal_reason_length_check
      CHECK (withdrawal_reason IS NULL OR char_length(withdrawal_reason) <= 500);
  END IF;
END;
$$;

# NePick Security and QA Handoff

이 문서는 동료와 동료가 사용하는 AI 모델이 보안, 사용성, 운영 QA 기준을 이어받기 위한 체크리스트입니다.

## 현재 작업 요약

- 브랜치: `audit/source-review-20260628`
- 목적: 저장/업로드/계정/OWASP 보안 검수와 보강
- 검증 완료: `npm audit`, `npm run lint`, `npm run build`
- 운영 DB 적용은 동료가 최종 QA 중 Supabase migration으로 진행 예정

## 핵심 정책

- 공용 가게 정보는 카카오 API로 확인한 참조 데이터입니다.
- 네 픽(`nepick_*`)의 글, 추천, 투표, 신고, 제안은 브라우저에서 직접 읽거나 쓸 수 없습니다. `app/api` 라우트가 `auth.getUser()`로 확인한 사용자 id만 `service_role` 함수에 넘기고, 금칙어 검사도 라우트에서 합니다.
- 네 픽 응답에는 닉네임 외의 프로필 정보, 다른 사용자의 id, 비추천 수를 담지 않습니다.
- 개인 기록은 `records`에만 쌓이며, 한 사용자는 같은 가게에 여러 기록을 남길 수 있습니다.
- 기록 이미지는 개인 데이터입니다. 기본은 private bucket + signed URL입니다.
- 탈퇴 계정의 닉네임은 재사용 가능합니다. 활성 계정끼리만 닉네임 중복을 막습니다.
- 같은 이메일이 다른 로그인 방식으로 이미 가입된 경우 기존 로그인 방식 안내를 보여줍니다.

## 보안 기준

- F12 Network에 보여도 되는 것: Supabase URL, Supabase anon key, Kakao JS key, 본인 요청/응답, signed image URL.
- F12 Network에 보이면 안 되는 것: `SUPABASE_SERVICE_ROLE_KEY`, `NAVER_CLIENT_SECRET`, `KAKAO_REST_API_KEY`, `GEMINI_API_KEY`, URL query의 `token_hash`.
- 브라우저에서 `stores.insert/update`를 직접 허용하지 않습니다.
- 프로필 테이블은 본인 row만 조회 가능해야 합니다.
- 닉네임 중복 확인은 프로필 row 조회가 아니라 `is_active_nickname_available` RPC를 사용합니다.
- 외부 API route는 입력 검증, body 크기 제한, 요청 제한을 유지합니다.
- AI/Gemini 프롬프트를 다시 도입하면 사용자 코멘트를 기록 내용으로만 취급하라는 방어 문구를 넣습니다. (월간 메뉴판은 2026-11 개편으로 Gemini 호출을 제거했고, 현재 코드에서 Gemini를 호출하는 곳은 없습니다.)
- 새 dependency 또는 버전 변경 후 `npm audit` 결과가 0 vulnerabilities인지 확인합니다.

## 적용해야 하는 Supabase migration

동료는 운영 DB에서 아래 migration 적용 여부를 확인해야 합니다.

- `20260628000000_storage_buckets.sql`: private image bucket, Storage policy, MIME/size 제한
- `20260628001000_lock_store_updates.sql`: 공용 가게 직접 update 차단
- `20260628002000_unique_active_nickname.sql`: 활성 계정 닉네임만 unique
- `20260628003000_harden_rls_policies.sql`: insert/update/delete RLS 보강
- `20260628004000_release_monthly_menu_generation.sql`: 월간 메뉴 실패 시 횟수 복구 함수 (2026-11 개편 후 앱은 호출하지 않음. 콜라주를 먼저 그리고 성공하면 차감)
- `20260628005000_private_profile_select.sql`: 프로필 select 잠금, 닉네임 확인 RPC
- `20260628006000_lock_store_inserts.sql`: 브라우저 직접 store insert 차단
- `20260628007000_harden_store_rankings_view.sql`: `store_rankings` view `security_invoker`
- `20260628008000_harden_select_policies.sql`: select 정책 role 명시
- `20261118000000_monthly_menu_three_generations.sql`: 월간 메뉴판 한 달 생성 횟수 2회 → 3회 (CHECK 제약과 `claim_monthly_menu_generation` 교체). **이 PR을 운영에 배포하기 전에 적용**해야 3번째 생성이 막히지 않음
- `20261125000000_nepick_boards.sql`: 네 픽 게시판 테이블 7개, 집계 뷰 2개, 함수 13개. 모두 브라우저 접근 차단, `service_role`만 사용. 게시판 데이터는 들어 있지 않음
- `20261125010000_nepick_review_fixes.sql`: 위 파일의 리뷰 반영(인덱스, 보이지 않는 문자 검사, 숨겨진 추천 다시 하기, 목록 조회 개선). 위 파일 다음에 적용

## 운영 DB 확인 SQL

```sql
select version, inserted_at
from supabase_migrations.schema_migrations
where version in (
  '20260628000000',
  '20260628001000',
  '20260628002000',
  '20260628003000',
  '20260628004000',
  '20260628005000',
  '20260628006000',
  '20260628007000',
  '20260628008000'
)
order by version;
```

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('record-images', 'profile-images');
```

```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
  and (
    tablename in ('profiles', 'records', 'stores', 'monthly_menu_usage')
    or tablename = 'objects'
  )
order by schemaname, tablename, policyname;
```

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'profiles'
  and indexname = 'profiles_active_nickname_key';
```

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'is_active_nickname_available',
    'release_monthly_menu_generation',
    'claim_monthly_menu_generation',
    'mark_monthly_menu_prompt_seen'
  );
```

```sql
-- 20261118000000 적용 확인: 월간 메뉴판 한 달 3회
select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.monthly_menu_usage'::regclass
  and contype = 'c'
  and pg_get_constraintdef(oid) like '%generation_count%';
-- 기대값: CHECK (((generation_count >= 0) AND (generation_count <= 3)))

select position('generation_count < 3' in pg_get_functiondef('public.claim_monthly_menu_generation(date)'::regprocedure)) > 0
  as is_three_generations;
-- 기대값: true
```

```sql
-- 20261125000000 적용 확인: 네 픽 게시판
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r' and relname like 'nepick\_%'
order by relname;
-- 기대값: 7줄, relrowsecurity 모두 true

select count(*) as function_count,
  bool_or(has_function_privilege('anon', oid, 'execute')
    or has_function_privilege('authenticated', oid, 'execute')) as open_to_browser
from pg_proc
where pronamespace = 'public'::regnamespace and proname like 'nepick\_%';
-- 기대값: 16, false (20261125010000까지 적용했을 때. 그 전에는 13)
```

## 운영 QA 체크리스트

- 로그인: 카카오, 구글, 네이버 로그인 성공/실패 흐름 확인
- 네이버 로그인: 주소창과 Network에 `token_hash`가 노출되지 않는지 확인
- 계정 충돌: 같은 이메일을 다른 provider로 가입 시 안내 문구 확인
- 탈퇴 계정: 탈퇴한 닉네임 재사용 가능 여부 확인
- 기록 저장: 같은 가게에 여러 기록 저장 가능 여부 확인
- 가게 저장: F12로 `stores` 직접 insert가 막히는지 확인
- 이미지: 기록/프로필 이미지 업로드, 수정, 삭제, 새로고침 후 표시 확인
- 이미지 보안: 로그아웃 또는 다른 계정에서 signed URL/Storage path 접근이 막히는지 확인
- 월간 메뉴: 조회, 선택, 추천 메뉴 입력, 콜라주 생성, 공유 창/다운로드, 사진 불러오기 실패 시 횟수가 줄지 않는지 확인
- CSP: 브라우저 Console에서 카카오맵, 폰트, Supabase signed image, 로그인 redirect 차단 오류가 없는지 확인
- 모바일 UX: 저장 버튼, 키보드, 하단 탭, safe area, 화면 새로고침 안내 문구 확인

## AI 작업 원칙

- 기존에 운영 적용됐을 수 있는 migration은 수정하지 말고 새 migration을 추가합니다.
- Supabase 관련 변경은 RLS, Storage policy, function 권한, view 권한을 함께 봅니다.
- `SECURITY DEFINER` 함수는 `auth.uid()` 검사와 `REVOKE ALL FROM PUBLIC`을 반드시 포함합니다.
- 프론트 코드에서 secret env를 읽지 않습니다.
- 사용자 입력이 외부 API나 AI 모델로 나갈 때 검증, 길이 제한, 비용 제한을 고려합니다.
- 코드 변경 후 최소 `npm run lint`, `npm run build`를 실행합니다.
- 의존성 변경 후 `npm audit`도 실행합니다.

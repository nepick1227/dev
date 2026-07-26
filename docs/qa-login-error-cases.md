# 로그인 실패 문구 · 케이스별 테스트 가이드

QA 01 로그인 시트의 에러 케이스(3-1 ~ 3-4, 2-7)를 재현하는 방법입니다.
모든 문구는 `/auth/login` 화면 상단(버튼 영역 위)에 13px 빨간 텍스트로 표시됩니다.

- DEV: `http://localhost:3000` / PROD: `https://nepick.kr`
- 아래 URL은 DEV 기준. PROD 확인 시 도메인만 교체.

## 빠른 확인 (UI 문구만 볼 때)

에러 문구는 URL 파라미터로 결정되므로 주소만 열면 바로 확인됩니다.

| Case | 확인 URL | 표시 문구 |
|------|---------|----------|
| 3-1 | `localhost:3000/auth/login?error=account_deleted` | 탈퇴 후 30일 이내에는 동일 계정으로 재가입이 불가합니다. |
| 3-2 | `localhost:3000/auth/login?error=provider_conflict` | 이미 다른 로그인 방식으로 가입된 이메일입니다. 기존 로그인 방식으로 로그인해 주세요. |
| 3-3 | `localhost:3000/auth/login?error=login_failed` | 로그인에 실패했습니다. 다시 시도해 주세요. |
| 3-4 | `localhost:3000/auth/login?error=auth_failed` | 로그인에 실패했습니다. 다시 시도해 주세요. (3-3과 통합) |

- 문구는 최초 진입 시 1회 표시되고, **에러 파라미터는 주소에서 즉시 제거**됩니다 (새로고침 시 재표시 안 됨 — 의도된 동작).
- 세부 실패 사유는 서버 로그로 남습니다: Vercel → Functions 로그(또는 로컬 dev 터미널)에서 `[Auth]` 검색.
  형식: `[Auth] login_failed reason=exchange_failed`, `[Auth] naver_callback_failed reason=state_mismatch` 등

## 실제 플로우로 재현 (E2E 검증용)

문구가 아니라 "그 상황에서 정말 그 문구가 나오는지"를 검증할 때 사용합니다.

### 3-1 account_deleted — 탈퇴 30일 이내 재로그인
1. 테스트 계정으로 로그인 → 프로필 → 탈퇴하기 진행
2. 같은 소셜 계정으로 다시 로그인 시도
3. 기대: `/auth/login?error=account_deleted`로 돌아오며 문구 표시
- 발생 위치: `app/auth/callback/route.ts` (카카오/구글) · `app/api/auth/naver/callback/route.ts` (네이버)

### 3-2 provider_conflict — 네이버 전용
카카오/구글은 Supabase가 동일 이메일을 자동으로 같은 계정에 연결하므로 이 에러가 없습니다.
**네이버만** 자체 로직이라 충돌이 발생합니다.

1. 카카오(또는 구글)로 가입된 계정과 **같은 이메일**을 쓰는 네이버 계정 준비
2. 네이버로 시작하기 클릭 → 네이버 로그인 완료
3. 기대: `/auth/login?error=provider_conflict`로 돌아오며 문구 표시
- 발생 위치: `app/api/auth/naver/callback/route.ts:177` (동일 이메일 + 네이버 아이디 불일치)

### 3-3 login_failed — OAuth 코드 교환 실패
서버가 유효하지 않은 인증 코드를 받은 상황. 가짜 코드로 콜백을 직접 호출하면 실제 코드 경로가 그대로 실행됩니다.

1. 브라우저에서 `localhost:3000/auth/callback?code=invalid-test-code` 접속
2. 기대: `exchangeCodeForSession` 실패 → `/auth/login?error=login_failed` 리다이렉트
- 발생 위치: `app/auth/callback/route.ts:34`

### 3-4 auth_failed — 세션은 있는데 인증 상태가 불완전
발생 지점이 여러 곳입니다. 가장 쉬운 재현 순서:

- **방법 A**: `localhost:3000/auth/naver/verify` 직접 접속 → 즉시 `/auth/login?error=auth_failed` 리다이렉트 (`app/auth/naver/verify/page.tsx`)
- **방법 B**: 약관 동의 페이지(`/auth/terms`)에 세션 없이 진입 (`app/auth/terms/page.tsx:438`)
- **방법 C**: 가입 도중(닉네임 미설정) 상태로 `/home` 직접 접속 (`app/home/page.tsx:43`)

### 2-7 인라인 에러 — OAuth 시작 자체가 실패 (네트워크 오류 등)
URL 파라미터가 아니라 페이지 내 상태로 표시되는 별도 케이스입니다.

1. F12 → Network 탭 → Throttling을 **Offline**으로 변경
2. 카카오 또는 구글 버튼 클릭
3. 기대: "로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요." 인라인 표시, 버튼 다시 활성화
- 발생 위치: `app/auth/login/page.tsx` `handleOAuthLogin`
- 참고: 네이버 버튼은 리다이렉트 방식이라 이 처리를 타지 않음 (실패 시 서버가 `/auth/error`로 보냄)

### 부록: /auth/error 페이지 (04 케이스들)
- `localhost:3000/auth/error` 직접 접속으로 화면 확인 가능
- 네이버 플로우의 state 불일치·토큰 발급 실패 시 실제로 이 페이지로 이동 (`app/api/auth/naver/callback/route.ts:100,113,221`)

## 참고: 느린 네트워크에서 버튼 로딩 확인 (QA 4번 항목)
1. F12 → Network → Throttling **Slow 4G**
2. 소셜 버튼 클릭 → 버튼 안 스피너 + 전체 버튼 비활성(opacity 60%) 확인

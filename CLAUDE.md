# NePick 프로젝트 — Claude 코드 규칙

> Claude Code가 이 프로젝트에서 코드를 생성할 때 자동으로 참조하는 규칙 파일입니다.

## 프로젝트 개요

- **서비스**: 맛집·카페 방문 기록 & 추천 앱 (모바일 웹)
- **스택**: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · 카카오맵 SDK
- **배포**: Vercel (nepick.kr)
- **경로 별칭**: `@/*` → 프로젝트 루트 (`./`)

## 디렉토리 구조

```
nepick/
├── app/                    # Next.js App Router (페이지 라우팅만)
│   ├── layout.tsx
│   ├── page.tsx            # 랜딩 (→ /auth/login 리다이렉트)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── callback/route.ts
│   │   ├── terms/page.tsx
│   │   └── signup/page.tsx
│   ├── home/page.tsx
│   ├── record/page.tsx
│   ├── mypick/page.tsx
│   └── profile/
│       ├── page.tsx
│       └── edit/page.tsx
├── components/             # 공통 UI 컴포넌트
│   ├── ui/                 # Button, Input, Modal, Toast, Spinner
│   ├── layout/             # Header, BottomNav, PageContainer
│   └── map/                # KakaoMap, MapMarker, BottomSheet
├── features/               # 페이지별 비즈니스 로직 + 전용 컴포넌트
│   ├── auth/               # LoginForm, SignupForm, TermsAgreement
│   ├── home/               # MapView, RankingSheet, StoreCard
│   ├── record/             # RecordForm, StoreSearch, ImageUpload
│   ├── mypick/             # Timeline, RecordCard, MonthFilter
│   └── profile/            # ProfileView, ProfileEditForm
├── hooks/                  # 커스텀 훅
│   ├── use-auth.ts         # 인증 상태 관리
│   ├── use-kakao-map.ts    # 카카오맵 인스턴스
│   └── use-toast.ts        # 토스트 메시지
├── lib/                    # 외부 서비스 클라이언트
│   ├── supabase/
│   │   ├── client.ts       # 브라우저용 (CSR)
│   │   └── server.ts       # 서버용 (SSR/RSC)
│   └── kakao/
│       └── map.ts          # SDK 로드 + 유틸
├── styles/
│   └── tokens.ts           # 디자인 토큰 (색상, 폰트, 레이아웃)
├── types/
│   ├── database.ts         # Supabase 테이블 타입
│   └── kakao.d.ts          # 카카오맵 SDK 전역 타입
└── utils/
    ├── format.ts           # 날짜·텍스트 포맷
    └── validation.ts       # 입력값 검증
```

## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일/폴더 | kebab-case | `store-card.tsx`, `use-auth.ts` |
| React 컴포넌트 | PascalCase | `StoreCard`, `BottomSheet` |
| 함수/변수 | camelCase | `handleSubmit`, `isLoading` |
| 상수 | UPPER_SNAKE_CASE | `MAX_COMMENT_LENGTH` |
| 타입/인터페이스 | PascalCase | `Store`, `RecordFormData` |
| DB 컬럼 | snake_case | `visited_at`, `pick_count` |

## 컴포넌트 작성 패턴

```tsx
// 1. import 순서: 외부 라이브러리 → 내부 모듈 → 타입
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/styles/tokens";
import type { Store } from "@/types/database";

// 2. Props 타입은 반드시 interface로 정의
interface StoreCardProps {
  store: Store;
  onClick?: (storeId: number) => void;
}

// 3. default export 함수형 컴포넌트
export default function StoreCard({ store, onClick }: StoreCardProps) {
  // hooks 최상단 선언
  const [isActive, setIsActive] = useState(false);

  // 핸들러는 useCallback
  const handleClick = useCallback(() => {
    onClick?.(store.id);
  }, [store.id, onClick]);

  // 조건부 early return
  if (!store) return null;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200">
      ...
    </div>
  );
}
```

**핵심 규칙:**
- 파일 당 200줄 이하 권장 → 초과 시 하위 컴포넌트로 분리
- 인라인 스타일(`style={{}}`) 사용 금지 → Tailwind 클래스 사용
- `any` 타입 사용 금지 → `unknown` + 타입 가드 사용
- SVG 아이콘은 `components/ui/icons/` 에 컴포넌트로 분리

## 디자인 토큰 (@/styles/tokens.ts)

색상은 반드시 토큰에서 참조합니다. Tailwind 클래스에 없는 경우 `tailwind.config.ts`에 커스텀 색상을 추가합니다.

```
primary:       #D32F2F   브랜드 레드, 주요 액션
recommend:     #DF6767   추천(👍) 배지
neutral:       #EA9C9C   보통(😐) 배지
notRecommend:  #FFD6D6   비추(👎) 배지
textPrimary:   #111827   본문
textSecondary: #6B7280   보조 텍스트
border:        #E5E7EB   선/구분선
background:    #F9FAFB   배경
```

## Supabase 데이터 레이어 패턴

```ts
// features/*/api.ts — 데이터 함수 분리
// 에러는 throw, 컴포넌트에서 try-catch 처리

export async function fetchRecords(userId: string) {
  const supabase = createClient();        // @/lib/supabase/client
  const { data, error } = await supabase
    .from("records")
    .select("*, stores(*)")
    .eq("user_id", userId)
    .order("visited_at", { ascending: false });

  if (error) throw error;
  return data;
}
```

- `service_role` 키는 Edge Function에서만 사용합니다.
- 카카오 REST API 키는 Edge Function(`supabase/functions/kakao-search/`)을 통해서만 사용합니다.
- `NEXT_PUBLIC_` 접두사 변수만 프론트엔드에서 사용 가능합니다.

## 카카오맵 규칙

- JS Key는 SDK 로드에만 사용 (`@/lib/kakao/map.ts`의 `loadKakaoMapSDK()` 호출)
- 지도 인스턴스는 `useRef`로 관리, 언마운트 시 마커/오버레이 정리
- REST API Key는 절대 프론트 코드에 포함하지 않음

## 에러 처리

```ts
// features 레이어: throw
if (error) throw error;

// 컴포넌트 레이어: try-catch + Toast
try {
  await createRecord(data);
  showToast("저장되었습니다");
} catch {
  showToast("저장에 실패했습니다. 다시 시도해주세요");
} finally {
  setIsSubmitting(false);
}
```

## Git 커밋 메시지

```
feat: 카카오 로그인 연동
fix: 닉네임 중복 검사 오류 수정
style: 홈 지도 마커 색상 변경
refactor: useAuth 세션 관리 로직 분리
chore: Supabase SDK 버전 업데이트
```

## 보안 규칙

- `.env.local`은 절대 git commit 하지 않음
- `KAKAO_REST_API_KEY`는 Edge Function 환경변수로만 설정
- 이미지 업로드 시 MIME 타입 검사 + 5MB 이하 제한

## 참고 문서

- 상세 작업 리스트 및 전체 가이드: `NePick_작업리스트_코드규칙가이드.md`
- DB 스키마 / 정책정의서: `NePick_정책정의서_v0.2.2.xlsx`

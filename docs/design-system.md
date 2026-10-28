# NePick 구현 기준 디자인 시스템

> 기준 브랜치: `main`  
> 최초 정리 기준 커밋: `2c845a0`  
> 최종 기준: 문서가 아니라 현재 공통 컴포넌트와 화면 코드

이 문서는 NePick의 현재 구현에서 반복되는 UI 규칙을 정리한 작업 기준서다. 과거 목업이나 디자인 핸드오프를 그대로 재현하기 위한 문서가 아니다. 새 화면을 만들거나 기존 화면을 수정할 때 현재 제품과 같은 모양과 동작을 유지하기 위해 사용한다.

## 1. 기준과 우선순위

UI 작업 전 아래 순서로 판단한다.

1. 현재 작업에서 사용자가 명시한 요구사항
2. 현재 `main`의 실제 화면 코드와 공통 컴포넌트
3. 이 문서에 정리된 공통 규칙
4. 과거 디자인 가이드, HTML 목업, 스크린샷

이 문서와 코드가 다르면 먼저 최신 `main`의 구현을 확인한다. 의도적인 코드 변경이면 같은 PR에서 이 문서도 함께 고친다. 문서만 보고 현재 기능, 문구, 데이터 순서, 인증 흐름을 삭제하거나 바꾸지 않는다.

기존 디자인 핸드오프는 시각적 배경 자료다. 이후 QA와 사용자 피드백으로 바뀐 부분이 많으므로 크기나 동작 값을 가져올 때 직접적인 기준으로 사용하지 않는다.

## 2. 구현 원칙

- 색상은 `app/globals.css`의 CSS 변수와 Tailwind 토큰을 사용한다.
- TypeScript에서 색상이나 입력 제한이 필요하면 `styles/tokens.ts`를 사용한다.
- 공통 UI는 `components/ui`, 공통 레이아웃은 `components/layout`, 지도 공통 요소는 `components/map`을 먼저 사용한다.
- 동일한 패턴이 둘 이상의 화면에서 쓰이면 화면 안에 복제하지 말고 공통 컴포넌트나 토큰을 수정한다.
- 액션 아이콘은 `components/ui/icons/index.tsx`의 아이콘을 사용한다. 화면별 인라인 SVG는 지도 SDK처럼 이유가 분명한 경우에만 허용한다.
- 페이지를 디자인에 맞춘다는 이유로 기존 필드, 사진 업로드, 버튼, 문구, 상태 처리, 인증 흐름을 생략하지 않는다.
- 모바일과 태블릿 사이에서 화면 너비가 바뀌어도 현재 라우트를 유지한다.

## 3. 디자인 토큰

### 색상

실제 정의 위치는 `app/globals.css`의 `@theme inline`이다.

| 용도 | Tailwind 토큰 | 값 |
|---|---|---|
| 브랜드 기본 | `primary` | `#D32F2F` |
| 브랜드 호버 | `primary-dark` | `#B71C1C` |
| 브랜드 연한 배경 | `primary-soft` | `#FDECEA` |
| 브랜드 연한 테두리 | `primary-border` | `#F3B4B4` |
| 제목·주요 본문 | `text-primary` | `#17191C` |
| 일반 본문 | `text-body` | `#3A3F45` |
| 보조 텍스트 | `text-secondary` | `#6E7379` |
| 설명 텍스트 | `text-description` | `#8A9097` |
| 비활성·보조 | `text-tertiary` | `#9AA0A6` |
| 플레이스홀더 | `text-muted` | `#B4B8BD` |
| 기본 테두리 | `border` | `#E6E8EB` |
| 구분선 | `divider` | `#EEF0F2` |
| 페이지 배경 | `bg` | `#F4F5F7` |
| 보조 배경 | `bg-soft` | `#F6F7F9` |
| 카드·시트 | `surface` | `#FFFFFF` |
| 성공 기본 | `success` | `#10B981` |
| 성공 텍스트 | `success-text` | `#047857` |
| 성공 테두리 | `success-border` | `#34D399` |
| 성공 배경 | `success-soft` | `#ECFDF5` |
| 비활성 배경 | `disabled-bg` | `#EDEEF0` |
| 비활성 텍스트 | `disabled-text` | `#9AA0A6` |
| 보통 평가 배경 | `rating-neutral-soft` | `#EEF0F2` |
| 비추천 평가 | `rating-negative` | `#C77700` |
| 비추천 평가 배경 | `rating-negative-soft` | `#FFF3E0` |

새 색상을 화면에 바로 하드코딩하지 않는다. 반복될 색상이면 `app/globals.css`와 `styles/tokens.ts`를 같은 변경에서 맞춘다. 카카오·네이버 소셜 브랜드색처럼 외부 브랜드가 지정한 색은 예외다.

### 글꼴과 타이포그래피

- 전 화면은 Pretendard Variable을 사용한다.
- 기본 폴백은 Pretendard, Apple system font, Segoe UI, sans-serif 순서다.
- 현재 사용 범위는 11~32px이며, 일반 본문은 14~15.5px가 중심이다.
- 큰 제목은 20~26px, `font-[800]`, 필요할 때 `tracking-[-0.5px]`를 사용한다.
- 입력값은 15px, 입력 레이블은 14px semibold를 기본으로 한다.
- 캡션과 보조 정보는 11~13px, semibold 또는 bold를 사용한다.
- 홈의 `맛집 랭킹 → 지역명`과 내 픽의 `내 기록 → 내 픽`처럼 서브타이틀과 타이틀이 한 쌍인 경우 같은 위계와 간격을 유지한다.

### 간격과 모서리

- 간격은 4px 단위를 기본으로 하고 4, 8, 12, 16, 20, 24, 32px를 우선 사용한다.
- 입력과 작은 버튼은 10~14px radius, 카드와 모달은 18~22px radius를 사용한다.
- 모바일 바텀시트 상단 radius는 26px다.
- 칩, 토글, 상태 배지는 `rounded-full`을 사용한다.

### 상태와 모션

- 기본 포커스는 2px `primary` outline과 2px offset이다.
- 눌림 상태가 있는 공통 버튼은 `scale(0.97)`을 사용한다.
- 기본 진입 모션은 `.nepick-fade-in`: 240ms, 8px 위 이동과 opacity 변화다.
- `prefers-reduced-motion`에서는 진입 모션을 끈다.
- 비활성 상태는 `disabled-bg`, `disabled-text`를 사용하고 그림자를 제거한다.

## 4. 반응형 구조

### 구간

- 모바일: `0~767px`
- 태블릿·웹: `768px 이상`
- 홈 패널: `768~1023px`는 340px, `1024px 이상`은 396px

태블릿은 모바일 전용 화면으로 바꾸지 않는다. `768px`부터 데스크톱 GNB와 좁은 웹 레이아웃을 사용한다. resize가 발생해도 같은 URL과 같은 작업 상태를 유지한다.

### 공통 컨테이너

- `.page-container`: 너비 100%, 높이 `100dvh`, white surface, column flex, overflow hidden
- 모바일 앱 최대 폭: 430px
- 폼 콘텐츠: `.app-content-narrow`, 최대 560px
- 약관 등 읽기 콘텐츠: `.app-content-readable`, 최대 720px
- 고정 액션 바: `.app-fixed-bar`, 최대 560px
- iOS 하단 안전 영역은 `.safe-area-pb` 또는 `.safe-area-pb-lg`를 사용한다.

모바일의 내 픽·프로필과 하위 화면은 흰 배경이다. 태블릿·웹의 폼과 설정 화면은 회색 `bg` 위에 흰 카드가 올라가는 구조다. 콘텐츠 카드 밖에 흰 띠가 생기지 않도록 페이지 배경과 카드 영역을 분리한다.

## 5. 내비게이션과 브랜드

### 데스크톱 GNB

`components/layout/DesktopTopBar.tsx`를 사용한다.

- 높이 64px, white surface, 하단 divider
- 로고는 `/brand/nepick-fork.svg`의 포크 심볼만 사용한다.
- 메뉴는 `홈`, `내 픽`; 15px, 활성 메뉴는 primary와 weight 800
- 기록 CTA는 `+ 기록하기`
- 로그인 상태에는 프로필 원형 버튼, 비로그인 상태에는 로그인 버튼을 표시한다.
- `내 픽`은 줄바꿈하지 않는다.

### 모바일 하단 탭

`components/layout/BottomNav.tsx`를 사용한다.

- 홈, 내 픽, 프로필 세 탭
- 높이 76px와 safe area
- 아이콘 22px, 레이블 11px bold
- 활성 색은 primary, 비활성 색은 text-muted

로그인·약관·가입처럼 집중이 필요한 인증 단계에서는 현재 페이지 구현의 내비게이션 노출 여부를 유지한다. 임의로 GNB나 탭바를 추가·삭제하지 않는다.

## 6. 공통 컴포넌트

| 컴포넌트 | 구현 규격 |
|---|---|
| `Button` | sm 40px, md 48px, lg 52px. primary, secondary, danger, ghost, kakao variant. 로딩 중 Spinner와 disabled 처리 포함 |
| `Input` | 높이 52px, radius 12px, 1.5px border, 좌우 15px, 값 15px, 레이블 14px semibold |
| `Textarea` | radius 12px, 1.5px border, padding 14px, 값 14px. 글자 수는 필드 아래 우측 정렬 |
| `Chip` | 높이 36px, pill, 1.5px border, 14px. 선택 상태는 primary 배경과 흰 글자 |
| `Badge` | 추천은 primary-soft, 보통은 neutral-soft, 비추천은 orange 계열. compact는 11px, 기본은 12px |
| `Modal` | z-index 100. 모바일 dim 0.4, 웹 dim 0.45. 중앙 dialog 최대 380px, radius 20px |
| `Toast` | 화면 하단 중앙, 최대 폭 `100vw - 32px`, radius 14px, 14.5px semibold |
| `Header` | 모바일 56px 기본, 큰 제목 68px. 웹 콘텐츠 폭 최대 720px. 뒤로가기 아이콘 24px |
| `FloatingRecordButton` | primary pill, `+ 기록`, 13px semibold, `px-4 py-2.5`, hover primary-dark |
| `BottomSheet` | collapsed 88px, half 50%, full 100%, 상단 radius 26px, z-index 30 |

### 아이콘

- 공통 선형 아이콘은 2~2.4px stroke를 기준으로 한다.
- 닫기 버튼은 원형 테두리나 배경 없이 X 아이콘만 보인다. 터치 영역은 40px를 유지한다.
- 음식점과 카페 아이콘은 `RestaurantIcon`, `CafeIcon`을 사용하고 같은 박스 안에서 시각적 크기가 맞아야 한다.
- 추천 선택의 👍/😐/👎는 현재 제품 표현이므로 유지한다.

### 폼 규칙

- 필수 표시는 레이블 뒤의 primary `*`만 사용한다. `*필수`로 쓰지 않는다.
- 닉네임은 최대 12자, 한줄소개는 최대 100자, 코멘트는 최대 500자다.
- 글자 수는 입력 박스 안이 아니라 바로 아래 우측에 표시한다.
- 이미지 업로드는 JPEG, PNG, WebP, HEIC, HEIF와 5MB 이하를 허용한다.
- 모바일 CTA는 하단 고정, 웹 CTA는 카드 흐름 안에 배치하는 현재 `actionPlacement` 규칙을 따른다.

## 7. 홈과 지도

관련 구현은 `features/home/MapView.tsx`, `MapOverlay.tsx`, `RankingSheet.tsx`, `SelectedStoreCard.tsx`다.

### 검색과 필터

- 검색 placeholder는 `장소 검색`이다.
- 입력값과 결과가 남아 있으면 이미 focus 상태여도 검색창 클릭으로 결과를 다시 연다.
- 검색 영역 밖 클릭과 Escape로 결과를 닫는다.
- 카테고리는 전체, 음식점, 카페를 제공한다.
- 음식점 세부 카테고리는 현재 노출 상태를 코드에서 확인하고 임의로 복원하지 않는다.

### 랭킹과 지역명

- 기본 서브타이틀은 `맛집 랭킹`, 내 픽 지도 모드는 `내 픽 지도`다.
- 지도 레벨 5 이하는 시·군·구·동, 6~9는 시·군·구를 표시한다.
- 더 넓은 축척은 `현재 보고 있는 지역`으로 표시한다.
- 기본 랭킹은 최대 50개다.
- 순위 1~3은 primary, 이후는 text-tertiary다.
- 가게명 옆에 카테고리와 거리를 표시하고 주소는 한 줄 말줄임한다.
- 픽 수는 우측 primary-soft 배지에 표시한다.
- 랭킹 산정과 지도 이동은 화면 전체 지도 bounds가 아니라 사용자에게 실제 보이는 지도 영역을 기준으로 한다.

### 내 픽만 보기

- `내 픽만 보기` 토글은 홈 랭킹에만 둔다. 내 픽 페이지에는 두지 않는다.
- 켜기 전 지도 center와 level을 보관한다.
- 켜면 내 기록의 모든 가게가 실제 가시 영역에 들어오도록 맞춘다.
- 한 곳뿐이면 과도하게 확대하지 않고 최대 level 5 기준으로 위치시킨다.
- 끄면 토글 전 center와 level을 복구한다.
- 픽이 없으면 검색창 focus를 해제한 뒤 안내 모달을 띄운다.

### 지도 축척과 가시 영역

- 카카오맵 기본 level은 3, 최대 줌아웃 level은 13이다.
- 웹 가시 영역 계산에서는 열린 좌측 패널과 상단 UI를 제외한다.
- 모바일에서는 검색 영역과 현재 바텀시트 높이를 제외한다.
- 가게 선택 시 마커와 카드가 동시에 실제 가시 영역 안에 보이도록 pan offset을 적용한다.

### 모바일 바텀시트와 플로팅 버튼

- 시트 기본 높이는 화면의 50%다. 접힘은 88px, 전체는 100%다.
- 기록 버튼은 `+ 기록`이며 랭킹보기·지도보기 버튼과 같은 pill 크기와 무게를 사용한다.
- 위치 버튼은 기록 버튼 위에 둔다.
- 시트가 full이면 지도 전용 플로팅 컨트롤을 숨긴다.
- 가게 카드가 열리면 랭킹보기·지도보기, 현재 위치, 기록 플로팅 버튼을 숨긴다.
- 닫기는 배경 없는 X 아이콘이다.

### 선택 가게 카드

- 모바일은 좌우 16px, 하단 20px. 웹은 실제 지도 가시 영역의 중앙에 놓는다.
- 주소는 한 줄 말줄임한다.
- 주소 복사 성공은 토스트 대신 같은 버튼의 체크 표시와 success-soft 배경으로 알린다.
- 복사 전후 버튼과 카드 높이는 바뀌지 않는다.
- CTA 문구는 `내 픽 추가하기`다. GNB의 `+ 기록하기`와 구분한다.

## 8. 인증과 비로그인 상태

관련 구현은 `features/auth/AuthGate.tsx`, `LoginPromptHost.tsx`, `app/auth/*`다.

- `/auth/login` 직접 접근은 전체 로그인 페이지를 사용한다.
- 데스크톱 GNB의 로그인 버튼은 현재 페이지 위에 로그인 프롬프트를 연다.
- 보호된 맥락에서 기록하기를 누르면 페이지 이동 전에 로그인 프롬프트를 연다.
- 기록 맥락 제목은 `기록하려면 로그인이 필요해요`, 일반 맥락은 `내 맛집 기록을 시작해요`다.
- 설명은 `3초 만에 로그인하고 나만의 맛집 지도를 만들어보세요.`다.
- 프롬프트의 `먼저 둘러볼게요`는 홈 탐색으로 돌아간다.
- 소셜 인증 화면에서 인증하지 않고 돌아와도 로딩 상태를 해제하고 다른 버튼과 화면을 다시 사용할 수 있어야 한다.
- 비로그인 모바일 내 픽과 프로필은 상단 페이지 타이틀 없이 white surface의 `AuthGate`를 표시한다.
- AuthGate 문구는 `로그인하고 내 지도를 만들어요`, CTA는 `3초 만에 시작하기`다.

인증 프롬프트는 일반 `Modal`과 레이아웃이 다르다. 모바일은 하단 시트, 웹은 400px 중앙 카드이며, 로고와 텍스트를 좌측 정렬한다. 현재 에셋은 `/brand/nepick-logo-transparent.png`를 사용한다.

약관 동의와 프로필 정보 입력은 전체 페이지 흐름을 유지한다. 약관 상세는 공통 읽기 폭과 카드 안에서 렌더링하고, 표는 카드 폭을 넘지 않아야 한다. 법률 문서 번호 목록은 hanging indent를 사용하며 최상위 `1.`, 하위 번호 `1)`, 글머리 기호는 부모 항목 아래로 들여쓴다.

## 9. 기록 추가와 수정

관련 구현은 `RecordForm`, `RecordEditForm`, `StoreSearch`, `ImageUpload`, `RatingSelector`다.

- 모바일과 웹 모두 독립된 full page다. 웹은 데스크톱 GNB 아래 회색 배경과 최대 552px 흰 폼 카드 구조다.
- 생성과 수정 화면의 필드 순서와 공통 규격을 맞춘다.
- 사진, 가게, 방문일시, 추천 여부, 코멘트, 저장 액션을 유지한다.
- 추천 문구는 추천, 보통, 비추천이다.
- 사진 업로드 영역은 높이 96px, radius 13px, 1.5px dashed border다.
- 추천 선택 카드는 높이 88px, radius 15px, 2px border다.
- 저장 CTA는 52px 높이의 공통 버튼을 사용한다.
- 수정 화면 삭제 버튼은 52px 정사각형, primary outline, radius 14px의 휴지통 아이콘 버튼이다. hover는 primary-soft, active는 scale 0.97이다.
- 데스크톱에서 제목 옆이나 콘텐츠 바깥에 흰 영역이 끼지 않도록 폼 페이지 배경을 연속된 `bg`로 유지한다.

## 10. 내 픽

관련 구현은 `ResponsiveMyPickPage`, `Timeline`, `RecordCard`, `MonthFilter`다.

- 모바일에서는 전체 화면 타임라인, `768px` 이상에서는 홈 지도와 좌측 내 픽 패널을 사용한다.
- 모바일 로그인 상태에서만 `내 픽` 헤더를 표시한다. 비로그인 AuthGate 위에는 표시하지 않는다.
- 데스크톱 패널 제목은 `내 기록` 서브타이틀과 `내 픽` 타이틀 구조를 사용한다.
- 상단은 타임라인·월별 토글, `내 픽 추가`, 검색으로 구성한다.
- 검색 placeholder는 `맛집 이름, 후기 검색`이다.
- `내 픽만 보기` 토글은 이 화면에 추가하지 않는다.
- 기록은 날짜별로 묶고 방문 시간은 카테고리 아이콘 아래 타임라인 영역에 표시한다.
- 첫 3개의 기록 이미지는 eager/high priority, 나머지는 lazy load한다.
- 이미지가 있는 카드에서 코멘트가 한 줄이어도 이미지와 본문 영역의 시각적 높이를 맞춘다.
- 메뉴는 수정, 주소 복사, 공유, 삭제를 유지한다. 삭제는 destructive 색으로 분리한다.
- 월 선택 모달은 z-index 100으로 좌측 패널 접기 버튼과 지도 요소보다 위에 표시한다.

## 11. 프로필과 하위 화면

- 로그인 프로필은 모바일 white surface, 웹 gray background 위 white card 구조다.
- 프로필 카드에는 이미지, 닉네임, 소셜 제공자, 한줄소개, 기록 통계, 프로필 편집을 표시한다.
- 메뉴의 섹션 제목은 카드 안에 배치한다.
- 현재 섹션은 설정, 고객센터, 약관이며 각 항목과 순서는 `ProfileView.tsx`의 `sections`가 기준이다.
- 로그아웃은 확인 모달을 거친다.
- 회원탈퇴 진입 위치는 현재 프로필 메뉴를 유지하고 UI는 다른 설정 하위 화면과 맞춘다.
- 프로필 편집, 권한 및 알림 설정, 약관 상세, 회원탈퇴, 탈퇴 완료까지 같은 Header·카드·입력 규격을 사용한다.
- 권한 안내 문구는 목록 카드 안에 둔다.
- 권한 상태는 허용 success, 거부 primary, 미설정 neutral 배지를 사용한다.
- 탈퇴 사유는 기본 border/surface, 선택은 primary border와 primary-soft 계열을 사용한다.
- 탈퇴는 사유 선택 후 확인 모달과 확인 체크를 거치는 2단계 흐름이다.

## 12. 접근성과 상호작용 점검

- 아이콘 전용 버튼은 `aria-label`을 제공한다.
- 현재 탭은 `aria-current="page"`, 토글은 `role="switch"`와 `aria-checked`를 사용한다.
- 클릭 가능한 카드에는 키보드 Enter 동작을 제공한다.
- 시각 아이콘보다 터치 영역을 크게 유지한다. 주요 아이콘 버튼은 40px 이상을 기준으로 한다.
- 모달과 드롭다운은 Escape와 바깥 클릭 동작을 현재 컴포넌트 규칙에 맞춘다.
- 로딩 중에는 중복 제출을 막되, OAuth 취소나 오류 뒤에는 반드시 다시 활성화한다.
- 긴 가게명, 주소, 지역명, 작은 높이의 태블릿 화면에서 잘림과 겹침을 확인한다.

## 13. UI 변경 체크리스트

UI 변경 PR에서는 아래 항목을 확인한다.

- [ ] `app/globals.css`, `styles/tokens.ts`, 공통 컴포넌트를 먼저 확인했다.
- [ ] 모바일 390×844 전후에서 탭바, safe area, 고정 CTA가 겹치지 않는다.
- [ ] 태블릿 768×1024 전후에서 모바일 화면으로 라우트가 바뀌지 않는다.
- [ ] 웹 1280px 이상과 높이가 짧은 화면에서 카드와 플로팅 컨트롤이 잘리지 않는다.
- [ ] 로그인·비로그인 상태를 각각 확인했다.
- [ ] 빈 목록, 한 개, 여러 개, 긴 텍스트, 이미지 있음·없음 상태를 확인했다.
- [ ] 검색 드롭다운, 모달, 월 선택기, 바텀시트의 z-index와 바깥 클릭을 확인했다.
- [ ] hover, active, focus-visible, disabled, loading 상태를 확인했다.
- [ ] UI 결정을 바꿨다면 이 문서와 관련 공통 컴포넌트를 같은 PR에서 갱신했다.

## 14. 코드 참조 지도

| 영역 | 기준 파일 |
|---|---|
| 토큰·반응형 | `app/globals.css`, `styles/tokens.ts` |
| 페이지 뼈대 | `components/layout/PageContainer.tsx` |
| 웹 GNB·모바일 탭 | `components/layout/DesktopTopBar.tsx`, `components/layout/BottomNav.tsx` |
| 헤더·버튼·입력 | `components/layout/Header.tsx`, `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Textarea.tsx` |
| 모달·토스트 | `components/ui/Modal.tsx`, `components/ui/Toast.tsx` |
| 지도·시트 | `features/home/MapView.tsx`, `features/home/MapOverlay.tsx`, `components/map/BottomSheet.tsx` |
| 홈 랭킹·가게 카드 | `features/home/RankingSheet.tsx`, `features/home/StoreCard.tsx`, `features/home/SelectedStoreCard.tsx` |
| 기록 | `features/record/RecordForm.tsx`, `features/record/RecordEditForm.tsx` |
| 내 픽 | `features/mypick/ResponsiveMyPickPage.tsx`, `features/mypick/Timeline.tsx`, `features/mypick/RecordCard.tsx` |
| 프로필 | `features/profile/ProfileView.tsx`, `features/profile/ProfileEditForm.tsx`, `features/profile/PermissionsView.tsx`, `features/profile/WithdrawalView.tsx` |
| 인증 게이트 | `features/auth/AuthGate.tsx`, `features/auth/LoginPromptHost.tsx`, `app/auth/*` |

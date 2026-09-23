# NePick 디자인 가이드 적용 기준

기준 문서는 디자인 핸드오프의 `README.md`, `NePick 디자인 가이드.dc.html`, `NePick 개선안.dc.html`이다. 프로덕션에서는 기존 기능과 문구를 유지하고 구조와 표현 규격만 적용한다.

## 공통 토큰

| 구분 | 규격 | 적용 위치 |
|---|---|---|
| 서체 | Pretendard Variable | `app/globals.css` |
| 제목 | 32/800, 26/800, 20/800 | 페이지·섹션 제목 |
| 본문 강조 | 15~15.5/700 | 상호명·주요 행 |
| 본문 | 14/600 | 버튼·메뉴·본문 |
| 캡션 | 12~13/600 | 주소·거리·설명 |
| 마이크로 | 11/700 | 탭·보조 레이블 |
| 큰 제목 자간 | -0.5px | 26px 이상 제목만 |
| 기본 색 | `#D32F2F`, `#17191C`, `#3A3F45`, `#6E7379` | CSS 테마 토큰 |
| 배경·선 | `#FFFFFF`, `#F4F5F7`, `#F6F7F9`, `#EEF0F2`, `#E6E8EB` | CSS 테마 토큰 |
| 라운드 | 10 / 13 / 18 / 26px | sm / md / lg / sheet |

## 공통 컴포넌트

| 컴포넌트 | 규격 | 구현 |
|---|---|---|
| Primary 버튼 | 52px, radius 14px, 15/800 | `components/ui/Button.tsx` |
| Secondary 버튼 | 48px, radius 13px, border 1.5px, 15/700 | `components/ui/Button.tsx` |
| Destructive 버튼 | 48px, 레드 아웃라인 | `components/ui/Button.tsx` |
| 입력창 | 52px, radius 12px, border 1.5px, 15px | `components/ui/Input.tsx` |
| 텍스트 영역 | radius 12px, border 1.5px, 14px | `components/ui/Textarea.tsx` |
| 카테고리 칩 | 36px, pill, border 1.5px, 14px | `components/ui/Chip.tsx` |
| 평가 뱃지 | radius 9px, 12/700, 의미별 고정색 | `components/ui/Badge.tsx` |
| 토스트 | radius 14px, 14.5/600, 2.2초 | `Toast.tsx`, `use-toast.ts` |
| 확인 모달 | dim 40%/45%, radius 20px | `components/ui/Modal.tsx` |
| 선택 시트 | 모바일 하단 radius 26px, 웹 중앙 radius 20px | 날짜·시간 선택기 |
| 모바일 탭바 | 76px, 아이콘 22px, 레이블 11/700 | `components/layout/BottomNav.tsx` |
| 웹 GNB | 64px, 포크 18px, 탭 15/800·600 | `components/layout/DesktopTopBar.tsx` |
| UI 아이콘 | 24px 기준 stroke 2~2.4px, round cap/join | `components/ui/icons` |

## 사용자 확정 예외

- 홈 랭킹의 정보와 문구는 기존 데이터를 유지한다.
- 픽 수는 랭킹 행 우측의 pill 뱃지로 표시한다.
- 음식점·카테고리와 실제 사용자 위치 기준 거리는 상호명 옆에 표시한다.
- 위치 권한이 없으면 서울 기준 거리를 계산하지 않고 거리를 숨긴다.
- 넓은 지도 범위에서는 `현재 보고 있는 지역`, 좁은 범위에서는 시군구·동 이름을 표시한다.
- 음식점 하위 카테고리는 숨긴다.
- 선택한 가게 상세 카드는 웹 지도 영역의 가로 중앙에 배치한다.
- 선택 가게 카드의 기록 CTA만 `+ 내 픽 추가하기`로 표시하고, GNB와 다른 진입 CTA는 기존 문구를 유지한다.
- 내 픽의 날짜별 건수는 표시하지 않는다.
- 내 픽의 시간은 카테고리 아이콘 아래에 둔다.
- 수정·주소 복사·공유·삭제 아이콘을 유지한다. 삭제는 구분선과 레드 스타일을 유지한다.
- 기록 추가·수정의 필드 순서와 사진 필드를 유지한다.
- 추천·보통·비추천 문구는 현재 서비스 문구를 유지한다.
- 새로운 집계 평가 뱃지 로직은 구현하지 않는다.

## 카테고리 아이콘

음식점·카페 아이콘은 사용자 선택에 따라 **OPTION 01 균형형**으로 확정했다. 24px 기준 2.2px stroke, round cap/join 규격으로 홈 필터·검색 결과·내 픽 카테고리 표시에 공통 적용한다.

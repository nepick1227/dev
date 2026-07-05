"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// ── 약관 데이터 ──────────────────────────────────────
const TERMS_CONTENT = {
  service: {
    title: "이용약관",
    content: `제1조 목적

본 약관은 네픽(NePick) 서비스 운영자와 회원 간의 서비스 이용과 관련한 권리, 의무 및 책임사항, 이용 조건과 절차를 규정함을 목적으로 합니다.

제2조 정의

본 약관에서 사용하는 용어의 의미는 다음과 같습니다.

1. "서비스"란 운영자가 제공하는 맛집 기록, 지도 기반 탐색, 맛집 추천, 맛집 랭킹, 리뷰 작성 및 공유 등 네픽(NePick) 관련 제반 서비스를 의미합니다.
2. "운영자"란 네픽(NePick) 서비스를 기획·개발·운영하는 자를 의미합니다.
3. "회원"이란 소셜 로그인 방식으로 네픽에 가입하고 본 약관에 따라 서비스를 이용하는 자를 의미합니다.
4. "기록"이란 회원이 음식점에 대해 작성한 방문 정보, 추천·보통·비추천 평가, 메모, 사진, 리뷰 등 서비스 내 입력 정보를 의미합니다.
5. "게시물"이란 회원이 서비스에 등록한 리뷰, 사진, 닉네임, 프로필 사진, 한줄소개 및 기타 콘텐츠를 의미합니다.
6. "공개 프로필"이란 회원이 프로필 공개 설정을 통해 다른 회원에게 노출되도록 설정한 프로필 및 관련 기록을 의미합니다.
7. "위치기반서비스"란 회원의 위치정보 또는 회원이 선택한 위치를 활용하여 주변 음식점 검색, 지도 표시, 거리 계산, 위치 기반 랭킹 등을 제공하는 서비스를 의미합니다.

제3조 약관의 효력 및 변경

1. 본 약관은 회원이 약관에 동의하고 서비스를 이용함으로써 효력이 발생합니다.
2. 운영자는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.
3. 운영자가 약관을 변경하는 경우 적용일자 및 변경 내용을 서비스 내 공지사항, 알림 또는 기타 적절한 방법으로 사전에 안내합니다.
4. 회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다.
5. 변경된 약관의 적용일 이후에도 회원이 서비스를 계속 이용하는 경우 변경 약관에 동의한 것으로 볼 수 있습니다.

제4조 회원가입 및 서비스 이용

1. 네픽은 회원 가입 후 이용할 수 있으며, 비회원 상태에서는 서비스 이용이 제한됩니다.
2. 회원은 운영자가 제공하는 소셜 로그인 방식을 통해 가입할 수 있습니다.
3. 네픽은 별도의 아이디 및 비밀번호 기반 회원가입 수단을 제공하지 않습니다.
4. 회원은 가입 및 서비스 이용 과정에서 정확한 정보를 제공해야 하며, 타인의 계정 또는 정보를 이용해서는 안 됩니다.
5. 네픽은 만 14세 이상 회원을 대상으로 제공됩니다. 만 14세 미만 아동은 서비스에 가입하거나 이용할 수 없습니다.

제5조 서비스의 제공

운영자는 다음 각 호의 서비스를 제공합니다.

1. 맛집 기록 및 관리 서비스
2. 지도 기반 맛집 탐색 서비스
3. 위치 기반 주변 맛집 검색 서비스
4. 회원의 기록을 기반으로 한 맛집 추천 및 랭킹 서비스
5. 회원이 작성한 리뷰, 사진, 평가 등의 공개 및 공유 서비스
6. 회원의 프로필 공개 설정에 따른 기록 노출 서비스
7. 향후 커뮤니티, 팔로우, 큐레이션 등 운영자가 추가로 제공하는 서비스

제6조 서비스 이용 시간 및 중단

1. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
2. 다만 시스템 점검, 장애, 통신망 문제, 외부 API 장애, 서비스 운영상 필요한 경우 서비스의 전부 또는 일부가 일시적으로 제한되거나 중단될 수 있습니다.
3. 운영자는 서비스 중단이 예정된 경우 가능한 범위에서 사전에 안내합니다.
4. 긴급 장애, 보안 문제, 외부 서비스 장애 등 부득이한 경우에는 사후에 안내할 수 있습니다.

제7조 추가 정보 입력

1. 운영자는 서비스 제공 및 개인화된 추천을 위해 닉네임, 생년월일, 성별, 프로필 사진, 한줄소개 등의 추가 정보를 입력받을 수 있습니다.
2. 추가 정보 중 선택 항목은 입력하지 않아도 기본 서비스 이용이 가능합니다.
3. 다만 선택 항목을 입력하지 않는 경우 개인화 추천, 프로필 표시, 큐레이션 등 일부 기능의 이용이 제한될 수 있습니다.
4. 운영자는 회원이 입력한 정보를 맛집 추천, 큐레이션, 프로필 구성, 공개 리뷰 표시 등 서비스 운영 목적 범위 내에서 활용할 수 있습니다.

제8조 맛집 기록 및 랭킹

1. 회원은 음식점에 대해 추천, 보통, 비추천 등의 평가와 방문 기록, 메모, 사진, 리뷰를 등록할 수 있습니다.
2. 서비스 내 랭킹, 추천 순위, 내 픽 수, 통계 등은 회원이 작성한 실제 기록 및 평가 데이터를 기준으로 산정될 수 있습니다.
3. 프로필 공개 여부와 관계없이 회원이 작성한 실제 맛집 기록, 평가, 방문 정보는 개인 통계, 내 픽 수, 추천 및 랭킹 산정에 반영될 수 있습니다.
4. 운영자는 서비스 품질 개선, 부정 이용 방지, 추천 정확도 개선을 위해 랭킹 및 추천 기준을 변경할 수 있습니다.
5. 추천 및 랭킹 결과는 서비스 운영 기준에 따라 달라질 수 있으며, 특정 음식점의 품질이나 만족도를 보증하는 것은 아닙니다.

제9조 프로필 공개 설정

1. 네픽의 공개 범위는 프로필 단위로 설정됩니다.
2. 회원이 프로필을 공개로 설정한 경우, 닉네임, 프로필 사진, 한줄소개, 맛집 기록, 리뷰, 사진 등 공개 가능한 정보가 다른 회원에게 노출될 수 있습니다.
3. 회원이 프로필을 비공개로 설정한 경우, 해당 회원의 프로필 및 기록은 원칙적으로 다른 회원에게 노출되지 않습니다.
4. 다만 비공개 상태에서도 회원 본인의 서비스 이용, 기록 관리, 개인 통계, 내 픽 수, 추천 및 랭킹 산정에는 기록이 반영될 수 있습니다.
5. 회원이 공개 상태에서 작성한 게시물을 이후 비공개로 전환하거나 삭제하더라도, 다른 회원의 기기 캐시, 외부 공유, 검색 결과 등 운영자가 통제하기 어려운 영역에서는 일정 기간 노출될 수 있습니다.

제10조 게시물의 권리와 이용

1. 회원이 서비스에 등록한 게시물의 권리는 해당 회원에게 귀속됩니다.
2. 회원은 자신이 등록한 게시물이 제3자의 저작권, 초상권, 개인정보, 상표권, 명예 등 권리를 침해하지 않도록 해야 합니다.
3. 회원은 운영자가 서비스 제공, 노출, 검색, 추천, 공유, 서비스 개선을 위해 필요한 범위 내에서 게시물을 이용할 수 있도록 허락합니다.
4. 운영자가 회원의 게시물을 서비스 외부 광고, 제휴 마케팅 등 별도 목적으로 활용하려는 경우 필요한 범위에서 별도 동의를 받을 수 있습니다.
5. 회원은 자신이 등록한 게시물을 직접 수정하거나 삭제할 수 있습니다. 단, 서비스 구조상 즉시 반영되지 않거나 일정 시간이 소요될 수 있습니다.

제11조 게시물의 관리

1. 운영자는 회원의 게시물이 관련 법령, 본 약관 또는 운영정책을 위반한다고 판단되는 경우 해당 게시물을 숨김, 삭제 또는 노출 제한할 수 있습니다.
2. 운영자는 신고가 접수된 게시물에 대해 검토 후 필요한 조치를 취할 수 있습니다.
3. 다음 각 호에 해당하는 게시물은 사전 통보 없이 제한될 수 있습니다.
  1. 허위 정보 또는 조작된 맛집 기록
  2. 타인의 개인정보, 사진, 리뷰 등을 무단으로 포함한 게시물
  3. 욕설, 비방, 차별, 혐오, 음란, 폭력적 표현을 포함한 게시물
  4. 음식점, 회원 또는 제3자의 명예를 훼손하거나 권리를 침해하는 게시물
  5. 광고, 홍보, 스팸, 도배성 게시물
  6. 서비스의 정상적인 운영을 방해하는 게시물
  7. 관련 법령 또는 본 약관을 위반하는 게시물

제12조 금지행위

회원은 서비스를 이용하면서 다음 행위를 해서는 안 됩니다.

1. 타인의 계정 또는 소셜 로그인 정보를 무단으로 사용하는 행위
2. 허위 정보 또는 조작된 기록을 등록하는 행위
3. 타인의 개인정보, 사진, 리뷰 등을 무단으로 게시하는 행위
4. 음식점, 회원 또는 제3자의 명예나 권리를 침해하는 행위
5. 광고, 홍보, 스팸성 게시물을 등록하는 행위
6. 서비스의 정상적인 운영을 방해하는 행위
7. 운영자의 사전 동의 없이 서비스 정보를 수집, 크롤링, 복제, 배포하는 행위
8. 관련 법령 또는 본 약관을 위반하는 행위

제13조 외부 지도 및 음식점 정보

1. 서비스 내 음식점명, 주소, 위치, 영업시간, 전화번호, 메뉴 등은 외부 지도 API, 제휴 데이터 또는 회원 입력 정보를 기반으로 제공될 수 있습니다.
2. 운영자는 음식점 정보의 정확성을 유지하기 위해 노력하나, 실제 정보와 차이가 있을 수 있습니다.
3. 회원은 방문 전 음식점의 실제 운영 여부, 영업시간, 메뉴, 가격 등을 직접 확인할 필요가 있습니다.
4. 외부 지도 서비스의 장애, 정보 오류, 정책 변경 등으로 인해 서비스 일부가 제한될 수 있습니다.

제14조 회원 탈퇴 및 이용 제한

1. 회원은 언제든지 서비스 내 탈퇴 기능 또는 고객센터를 통해 회원 탈퇴를 요청할 수 있습니다.
2. 회원이 탈퇴하는 경우 운영자는 관련 법령 및 개인정보 처리방침에 따라 회원 정보를 삭제하거나 분리 보관합니다.
3. 회원이 본 약관 또는 관련 법령을 위반한 경우 운영자는 서비스 이용을 제한하거나 회원 자격을 정지 또는 상실시킬 수 있습니다.
4. 회원 탈퇴 후에도 관계 법령 준수, 분쟁 대응, 부정 이용 방지를 위해 필요한 정보는 일정 기간 보관될 수 있습니다.

제15조 책임 제한

1. 운영자는 천재지변, 통신 장애, 외부 API 장애, 시스템 오류 등 운영자의 합리적 통제를 벗어난 사유로 서비스 제공이 어려운 경우 책임이 제한될 수 있습니다.
2. 운영자는 회원이 작성한 리뷰, 사진, 평가, 맛집 기록의 신뢰성, 정확성, 적법성을 보증하지 않습니다.
3. 운영자는 회원 간 또는 회원과 제3자 사이에서 발생한 분쟁에 개입할 의무를 부담하지 않습니다. 다만 서비스 운영상 필요하다고 판단되는 경우 적절한 조치를 취할 수 있습니다.

제16조 준거법 및 분쟁 해결

1. 본 약관은 대한민국 법령에 따라 해석됩니다.
2. 서비스 이용과 관련하여 운영자와 회원 간 분쟁이 발생한 경우 양 당사자는 성실히 협의하여 해결합니다.
3. 협의가 이루어지지 않는 경우 관할 법원은 관련 법령에 따릅니다.

부칙

본 약관은 2026.05.01 부터 시행합니다.`,
  },
  privacy: {
    title: "개인정보 수집·이용 동의",
    content: `제1조 수집·이용하는 개인정보 항목

네픽은 회원가입 및 서비스 제공을 위해 다음과 같은 개인정보를 수집·이용합니다.

1. 필수 수집 항목

항목                       수집·이용 목적
──────────────────────────────────────────────────────
소셜 로그인 식별값         회원가입, 로그인, 회원 식별, 중복 가입 방지
이메일 주소                회원 식별, 계정 관리, 고객 문의 대응
서비스 이용 기록           맛집 기록 관리, 추천 및 랭킹 제공, 서비스 운영
접속 로그, IP 주소         보안 관리, 오류 확인, 부정 이용 방지
기기 정보                  서비스 안정성 확보, 오류 대응, 푸시 알림 제공

2. 선택 수집 항목

항목                       수집·이용 목적
──────────────────────────────────────────────────────
닉네임                     프로필 표시, 공개 리뷰 표시
생년월일                   연령대 기반 큐레이션 및 추천
성별                       맞춤형 큐레이션 및 서비스 분석
프로필 사진                프로필 구성
한줄소개                   프로필 구성 및 회원 소개
위치정보                   주변 맛집 검색, 지도 기반 탐색, 거리 계산

선택 항목을 입력하지 않아도 기본 서비스 이용은 가능합니다. 다만 일부 개인화 추천, 프로필 표시, 위치 기반 기능 이용이 제한될 수 있습니다.

제2조 개인정보의 수집·이용 목적

네픽은 다음 목적을 위해 개인정보를 수집·이용합니다.

1. 소셜 로그인 기반 회원가입 및 로그인 제공
2. 회원 식별 및 계정 관리
3. 맛집 기록, 평가, 리뷰, 사진 저장 및 관리
4. 지도 기반 맛집 탐색 및 위치 기반 추천 제공
5. 개인화 추천, 맛집 랭킹, 큐레이션 제공
6. 서비스 이용 통계, 품질 개선 및 신규 기능 개발
7. 고객 문의, 신고 처리 및 분쟁 대응
8. 부정 이용 방지 및 서비스 보안 관리
9. 푸시 알림 발송 및 알림 설정 관리

제3조 보유 및 이용 기간

1. 네픽은 원칙적으로 회원 탈퇴 시 개인정보를 지체 없이 파기합니다.
2. 다만 서비스 혼선 방지, 부정 이용 방지, 분쟁 대응, 고객 문의 처리 등을 위해 탈퇴 후 최대 30일간 일부 정보를 보관할 수 있습니다.
3. 관계 법령에 따라 보존이 필요한 경우에는 해당 법령에서 정한 기간 동안 별도로 보관합니다.
4. 향후 결제 또는 유료 서비스가 도입되는 경우, 전자상거래법 시행령에 따라 계약 또는 청약철회 기록과 대금결제 및 재화 공급 기록은 5년, 소비자 불만 또는 분쟁처리 기록은 3년, 표시·광고 기록은 6개월 보관될 수 있습니다.

제4조 만 14세 미만 아동의 가입 제한

네픽은 만 14세 이상 회원을 대상으로 제공됩니다. 만 14세 미만 아동은 서비스에 가입하거나 이용할 수 없습니다.

제5조 동의 거부권

1. 회원은 개인정보 수집·이용에 대한 동의를 거부할 수 있습니다.
2. 필수 항목에 대한 동의를 거부하는 경우 네픽 회원가입 및 서비스 이용이 제한될 수 있습니다.
3. 선택 항목에 대한 동의를 거부하더라도 기본 서비스 이용은 가능합니다. 다만 해당 정보를 활용하는 일부 기능은 제한될 수 있습니다.

제6조 개인정보 처리방침 안내

개인정보 처리에 관한 자세한 사항은 서비스 내 설정 > 개인정보 처리방침에서 확인할 수 있습니다.`,
  },
  location: {
    title: "위치기반 서비스 이용약관",
    content: `제1조 목적

본 약관은 네픽(NePick) 서비스 운영자가 제공하는 위치기반서비스와 관련하여 운영자와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 위치기반서비스의 내용

운영자는 회원의 위치정보 또는 회원이 직접 선택한 위치를 활용하여 다음 서비스를 제공합니다.

1. 현재 위치 또는 선택 위치 주변 맛집 검색
2. 지도 기반 음식점 탐색
3. 회원 위치와 음식점 간 거리 표시
4. 위치 기반 맛집 추천 및 랭킹 제공
5. 회원이 기록한 맛집의 지도 표시
6. 기타 위치정보를 활용한 편의 기능

제3조 개인위치정보의 수집 및 이용

1. 운영자는 회원이 위치 권한을 허용하거나 위치 기반 기능을 사용하는 경우 개인위치정보를 수집·이용할 수 있습니다.
2. 운영자는 개인위치정보를 주변 맛집 검색, 지도 표시, 거리 계산, 위치 기반 추천 제공 목적 범위 내에서 이용합니다.
3. 운영자는 회원의 동의 없이 개인위치정보를 본 약관에 명시된 목적 외로 이용하지 않습니다.
4. 회원이 특정 음식점을 기록하거나 저장하는 경우, 해당 음식점의 위치 정보는 회원의 맛집 기록 관리를 위해 보관될 수 있습니다.

제4조 개인위치정보의 보유 및 이용 기간

1. 운영자는 위치 기반 서비스 제공을 위해 필요한 최소한의 범위에서 개인위치정보를 이용합니다.
2. 단순 주변 맛집 검색, 지도 표시, 거리 계산 등 일회성 위치 조회 정보는 원칙적으로 서비스 제공 후 즉시 파기합니다.
3. 회원이 특정 음식점을 기록하거나 저장하는 경우, 해당 음식점의 위치 정보는 회원 탈퇴 또는 기록 삭제 시까지 보관될 수 있습니다.
4. 관계 법령에 따라 보관이 필요한 경우 운영자는 해당 법령에서 정한 기간 동안 정보를 보관할 수 있습니다.

제5조 개인위치정보의 제3자 제공

1. 운영자는 회원의 동의 없이 개인위치정보를 제3자에게 제공하지 않습니다.
2. 다만 법령에 특별한 규정이 있거나 수사기관 등 적법한 절차에 따른 요청이 있는 경우 관련 법령에 따라 제공될 수 있습니다.
3. 운영자가 개인위치정보를 제3자에게 제공해야 하는 경우, 제공받는 자, 제공 목적, 제공 항목, 보유 및 이용 기간을 사전에 안내하고 동의를 받습니다.

제6조 외부 지도 서비스 이용

1. 운영자는 지도 표시, 음식점 검색, 주소 검색, 거리 계산 등을 위해 외부 지도 API 또는 위치 관련 서비스를 이용할 수 있습니다.
2. 외부 지도 서비스의 장애, 정보 오류, API 정책 변경 등으로 인해 서비스 일부가 제한될 수 있습니다.
3. 외부 지도 서비스 제공자의 정책에 따라 음식점 정보, 지도 정보, 위치 표시 방식이 변경될 수 있습니다.
4. 서비스 내 제공되는 음식점 위치, 영업시간, 주소, 전화번호, 메뉴 등은 실제 정보와 다를 수 있습니다.

제7조 회원의 권리

회원은 언제든지 다음 권리를 행사할 수 있습니다.

1. 개인위치정보 수집·이용 동의 철회
2. 위치정보 이용의 일시 중지
3. 개인위치정보 이용 또는 제공 내역 확인 요청
4. 개인위치정보의 삭제 요청
5. 단말기 또는 앱 설정을 통한 위치 접근 권한 차단

제8조 만 14세 미만 아동의 위치정보

네픽은 만 14세 이상 회원을 대상으로 제공되며, 만 14세 미만 아동은 서비스에 가입하거나 이용할 수 없습니다.

제9조 위치정보관리책임자

운영자는 위치정보를 적절히 관리·보호하고 회원의 문의를 처리하기 위해 위치정보관리책임자를 지정합니다.

· 위치정보관리책임자: 박보람
· 연락처: nepick1227@gmail.com

제10조 손해배상 및 책임 제한

1. 운영자가 위치정보 관련 법령을 위반하여 회원에게 손해가 발생한 경우, 회원은 운영자에게 손해배상을 청구할 수 있습니다.
2. 운영자는 회원의 단말기 설정, 위치 권한 거부, 네트워크 오류, GPS 오차, 외부 지도 API 오류 등 운영자의 책임 없는 사유로 발생한 위치정보 오류에 대해서는 책임이 제한될 수 있습니다.
3. 위치정보는 단말기, 네트워크, 건물, 날씨, 지도 데이터 등 다양한 요인에 따라 실제 위치와 차이가 발생할 수 있습니다.

부칙

본 약관은 2026.05.01 부터 시행합니다.`,
  },
  marketing: {
    title: "마케팅 정보 수신 동의",
    content: `제1조 목적

본 동의서는 네픽(NePick)이 회원에게 이벤트, 혜택, 추천 맛집, 신규 기능 안내 등 광고성 정보를 전송하기 위해 필요한 사항을 안내하고 동의를 받는 것을 목적으로 합니다.

제2조 수신 항목

회원은 네픽이 다음과 같은 마케팅 정보를 전송하는 것에 동의할 수 있습니다.

1. 이벤트 및 프로모션 안내
2. 추천 맛집 및 큐레이션 콘텐츠 안내
3. 신규 기능 및 업데이트 안내
4. 서비스 혜택 및 이용 활성화 안내
5. 제휴 또는 캠페인 관련 안내

제3조 전송 방법

마케팅 정보는 다음 방법으로 전송될 수 있습니다.

1. 앱 푸시 알림
2. 이메일
3. 서비스 내 알림 또는 배너

제4조 수집·이용 항목

마케팅 정보 발송을 위해 다음 정보를 이용할 수 있습니다.

1. 이메일 주소
2. 앱 푸시 토큰
3. 서비스 이용 기록
4. 맛집 기록 및 관심 정보
5. 알림 수신 설정 정보

제5조 보유 및 이용 기간

마케팅 정보 발송을 위한 개인정보는 회원 탈퇴 또는 마케팅 정보 수신 동의 철회 시까지 이용됩니다.

제6조 동의 거부 및 철회

1. 회원은 마케팅 정보 수신에 동의하지 않아도 네픽의 기본 서비스를 이용할 수 있습니다.
2. 회원은 동의 후에도 언제든지 서비스 내 설정 화면에서 마케팅 정보 수신 동의를 철회할 수 있습니다.
3. 수신 동의를 철회한 경우 이후 광고성 정보는 발송되지 않습니다.
4. 다만 약관 변경, 개인정보 처리방침 변경, 보안 안내, 서비스 장애 안내, 계정 관련 안내 등 서비스 운영에 필요한 고지성 알림은 마케팅 수신 동의 여부와 관계없이 발송될 수 있습니다.

제7조 동의 문구

[선택] 마케팅 정보 수신 동의
이벤트, 추천 맛집, 신규 기능, 혜택 안내 등 광고성 정보를 앱 푸시 알림 또는 이메일로 받을 수 있습니다. 동의하지 않아도 네픽의 기본 서비스 이용은 가능합니다.

부칙

본 동의서는 2026.05.01 부터 적용됩니다.`,
  },
} as const;

type TermsKey = keyof typeof TERMS_CONTENT;

// ── 체크박스 컴포넌트 ────────────────────────────────
interface CheckboxItemProps {
  checked: boolean;
  required: boolean;
  label: string;
  desc: string;
  onChange: () => void;
  onDetailClick?: () => void;
}

function CheckboxItem({ checked, required, label, desc, onChange, onDetailClick }: CheckboxItemProps) {
  return (
    <div className="flex items-start justify-between py-3.5">
      <div className="flex flex-1 cursor-pointer items-start gap-3" onClick={onChange}>
        <div className={[
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200",
          checked ? "bg-primary" : "border-2 border-border bg-surface",
        ].join(" ")}
        >
          {checked && (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
              <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-[15px] leading-snug tracking-tight text-text-primary">
            {required ? (
              <span className="mr-1 font-semibold text-primary">[필수]</span>
            ) : (
              <span className="mr-1 font-medium text-text-secondary">[선택]</span>
            )}
            {label}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug tracking-tight text-text-secondary">{desc}</p>
        </div>
      </div>
      {onDetailClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onDetailClick(); }}
          className="shrink-0 pl-2 pt-0.5 text-xl leading-none text-text-secondary"
          aria-label="약관 전문 보기"
        >
          ›
        </button>
      )}
    </div>
  );
}

// ── 약관 전문 페이지 ─────────────────────────────────
function TermsDetailView({ termsKey, onBack }: { termsKey: TermsKey; onBack: () => void }) {
  const terms = TERMS_CONTENT[termsKey];
  return (
    <div className="page-container">
      <div className="sticky top-0 z-10 flex items-center border-b border-border bg-surface px-5 py-4">
        <button onClick={onBack} className="flex items-center p-1 pr-2" aria-label="뒤로가기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[18px] font-bold tracking-tight text-text-primary">{terms.title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <pre className="whitespace-pre-wrap break-keep font-sans text-[14px] leading-7 text-text-secondary">
          {terms.content}
        </pre>
      </div>
    </div>
  );
}

// ── 메인: 약관 동의 페이지 ───────────────────────────
export default function TermsPage() {
  const router = useRouter();
  const [detailKey, setDetailKey] = useState<TermsKey | null>(null);
  const [agreements, setAgreements] = useState({
    service: false,
    privacy: false,
    location: false,
    marketing: false,
  });

  const requiredKeys = ["service", "privacy", "location"] as const;
  const allRequired = requiredKeys.every((k) => agreements[k]);
  const allChecked = Object.values(agreements).every(Boolean);

  const handleAllToggle = useCallback(() => {
    const next = !allChecked;
    setAgreements({ service: next, privacy: next, location: next, marketing: next });
  }, [allChecked]);

  const handleToggle = useCallback((key: keyof typeof agreements) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleStart = useCallback(async () => {
    if (!allRequired) return;

    // 1. 위치 권한 요청 (필수 약관 동의 완료 후)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(() => resolve(), () => resolve());
      });
    }

    // 2. 알림 권한 요청 (마케팅 동의한 경우만, 순차적으로)
    if (agreements.marketing && typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    router.replace(`/auth/signup${agreements.marketing ? "?marketing=1" : ""}`);
  }, [allRequired, agreements.marketing, router]);

  if (detailKey) {
    return <TermsDetailView termsKey={detailKey} onBack={() => setDetailKey(null)} />;
  }

  return (
    <div className="page-container">
      <div className="flex flex-1 flex-col">
        {/* 로고 & 타이틀 */}
        <div className="nepick-fade-in px-6 pb-8 pt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="네픽 로고" width={64} height={64} className="mb-4 object-contain" />
          <h1 className="mb-2 text-[26px] font-extrabold leading-tight tracking-tight text-text-primary">
            서비스 이용 동의
          </h1>
          <p className="text-[15px] leading-relaxed tracking-tight text-text-secondary">
            네픽을 이용하기 위해 아래 약관에 동의해 주세요.
          </p>
        </div>

        {/* 약관 목록 */}
        <div className="nepick-fade-in px-6 [animation-delay:100ms]">
          {/* 전체 동의 */}
          <div
            onClick={handleAllToggle}
            className={[
              "mb-2 flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] p-4 transition-all duration-200",
              allChecked ? "border-primary-border bg-primary-soft" : "border-border bg-bg",
            ].join(" ")}
          >
            <div className={[
              "flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
              allChecked ? "bg-primary" : "border-2 border-border bg-surface",
            ].join(" ")}
            >
              {allChecked && (
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                  <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[16px] font-bold tracking-tight text-text-primary">전체 동의하기</span>
          </div>

          <div className="my-2 h-px bg-border" />

          <CheckboxItem checked={agreements.service} required onChange={() => handleToggle("service")} label="이용약관 동의" desc="네픽 서비스를 이용하기 위한 기본 약관이에요." onDetailClick={() => setDetailKey("service")} />
          <CheckboxItem checked={agreements.privacy} required onChange={() => handleToggle("privacy")} label="개인정보 수집·이용 동의" desc="서비스 제공을 위해 꼭 필요한 정보만 수집해요." onDetailClick={() => setDetailKey("privacy")} />
          <CheckboxItem checked={agreements.location} required onChange={() => handleToggle("location")} label="위치기반 서비스 이용약관 동의" desc="내 주변 맛집 탐색과 랭킹 확인에 필요해요." onDetailClick={() => setDetailKey("location")} />
          <CheckboxItem checked={agreements.marketing} required={false} onChange={() => handleToggle("marketing")} label="마케팅 정보 수신 동의" desc="새로운 기능과 이벤트 소식을 가장 먼저 받아요." onDetailClick={() => setDetailKey("marketing")} />
        </div>
      </div>

      {/* CTA */}
      <div className="nepick-fade-in safe-area-pb-lg px-6 pt-4 [animation-delay:250ms]">
        <Button fullWidth onClick={handleStart} disabled={!allRequired}>
          시작하기
        </Button>
      </div>
    </div>
  );
}

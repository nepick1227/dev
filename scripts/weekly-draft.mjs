/**
 * 이번 주 콘텐츠 초안을 생성한다 (매주 화요일 실행 기준).
 * 홀수 주 = yk가 개발일기(화요일) 담당, br이 방문기(금요일) 담당.
 * 짝수 주 = br이 개발일기(화요일) 담당, yk가 방문기(금요일) 담당.
 *
 * 개발일기 초안은 content/schedule.json 대기열에서 다음 항목을 꺼내는 것뿐이라 비밀정보가 필요 없다.
 * 방문기 초안은 그 주 담당자 본인 세션으로 최근 방문 기록(records)을 불러온다.
 *
 * 이 앱은 카카오·네이버·구글 소셜 로그인만 지원하고 비밀번호가 없다. 그래서 이메일/비밀번호
 * 대신, 브라우저에서 이미 로그인된 세션의 refresh_token을 한 번 꺼내와 사용한다:
 *   1. nepick.kr에 로그인한 브라우저에서 개발자도구 → Application/저장공간 → Cookies (또는 LocalStorage)
 *   2. `sb-<project-ref>-auth-token` 이름의 값을 찾아 JSON을 열어보면 그 안에 refresh_token 필드가 있다.
 *   3. 그 값을 .env.local에 YK_REFRESH_TOKEN (또는 BR_REFRESH_TOKEN)으로 저장한다.
 * refresh_token은 access_token보다 훨씬 오래 유효하고, 쓸 때마다 이 스크립트가 새 access_token을
 * 발급받아 쓰므로 매주 새로 꺼낼 필요는 없다 (다만 로그아웃하거나 오래 미사용하면 만료될 수 있다).
 *
 * 방문기 초안은 본인 로그인 세션으로만 조회한다 (RLS 적용, service role 키 사용 안 함).
 *
 * 특정 주차를 강제로 생성하고 싶을 때 (예: 과거/미래분 백필):
 *   WEEK_OVERRIDE=1 node scripts/weekly-draft.mjs
 *
 * 사용법:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... YK_REFRESH_TOKEN=... \
 *     node scripts/weekly-draft.mjs
 */

import { writeFile, mkdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SCHEDULE_PATH = path.join(process.cwd(), "content", "schedule.json");
const DRAFTS_DIR = path.join(process.cwd(), "content", "drafts");

const AUTHOR_LABEL = { yk: "yk", br: "br" };

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

// 오늘 기준으로 이번 주 화요일(개발일기 발행일)을 계산한다.
function getTargetTuesday(today) {
  const day = today.getUTCDay(); // 0=일, 2=화
  const daysUntilTuesday = (2 - day + 7) % 7;
  return addDays(today, daysUntilTuesday === 0 && day !== 2 ? 7 : daysUntilTuesday);
}

function getWeekNumber(anchorDate, targetTuesday) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((targetTuesday.getTime() - anchorDate.getTime()) / msPerDay);
  return Math.round(diffDays / 7) + 1;
}

async function loadSchedule() {
  const raw = await readFile(SCHEDULE_PATH, "utf-8");
  return JSON.parse(raw);
}

function buildDiaryDraft({ week, item, targetTuesday, author }) {
  return `# [개발일기 초안] ${toISODate(targetTuesday)} (${week}주차) — ${AUTHOR_LABEL[author]}

## ${item.title}

**소스 날짜:** ${item.source}
**카테고리:** ${item.category}

### 왜 (본문 뼈대)
${item.why}

---

### 체크리스트
- [ ] 1인칭으로 실제 그 PR/커밋을 다시 열어보고 세부 디테일 보강
- [ ] 필터링 규칙 확인 — 키·시크릿·미출시 기능 언급 없는지 (docs/content-bot-briefing.md)
- [ ] IG용: 훅 한 줄 + 캐러셀 3~4장 또는 릴스로 압축
- [ ] Threads용: 시행착오 순서대로 짧은 텍스트 2~4개로 쪼개기

*이 초안은 content/schedule.json 대기열에서 자동 생성되었습니다. 발행일은 가이드라인이며 밀리면 순서만 유지한 채 다음 슬롯으로 넘기면 됩니다.*
`;
}

async function fetchRecentRecords(userId, accessToken, sinceISO) {
  const url = new URL("/rest/v1/records", SUPABASE_URL);
  url.searchParams.set("select", "id,visited_at,recommendation,comment,image_url,stores(name,address,category,subcategory)");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("visited_at", `gte.${sinceISO}`);
  url.searchParams.set("order", "visited_at.desc");
  url.searchParams.set("limit", "15");

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`records 조회 실패: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

// 이 앱은 카카오·네이버·구글 소셜 로그인만 지원하고 비밀번호가 없다.
// 대신 이미 로그인된 세션의 refresh_token으로 새 액세스 토큰을 발급받는다.
async function signInWithRefreshToken(refreshToken) {
  const url = new URL("/auth/v1/token", SUPABASE_URL);
  url.searchParams.set("grant_type", "refresh_token");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error(`토큰 갱신 실패: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return { accessToken: data.access_token, userId: data.user.id };
}

const RECOMMEND_LABEL = {
  recommend: "👍 추천",
  neutral: "😐 보통",
  not_recommend: "👎 비추",
};

function buildVisitDraft({ week, targetFriday, records, author }) {
  const label = AUTHOR_LABEL[author];

  if (records.length === 0) {
    return `# [방문기 초안] ${toISODate(targetFriday)} (${week}주차) — ${label}

이번 주에는 최근 7일 내 새 기록이 없습니다. 방문기는 부수적인 콘텐츠이니, 밀리면 그냥 이번 주는 건너뛰거나 조금 더 이전 기록으로 대체해도 됩니다.
`;
  }

  const list = records
    .map((r) => {
      const store = r.stores;
      return `- **${store?.name ?? "이름 미상"}** (${store?.subcategory ?? store?.category ?? ""}) — ${RECOMMEND_LABEL[r.recommendation] ?? r.recommendation}\n  - ${toISODate(new Date(r.visited_at))} 방문\n  - 코멘트: ${r.comment || "(없음)"}`;
    })
    .join("\n");

  return `# [방문기 초안] ${toISODate(targetFriday)} (${week}주차) — ${label}

최근 실제 기록 ${records.length}건을 불러왔습니다. 이 중 골라서 방문기로 풀어보세요.

${list}

---

### 체크리스트
- [ ] 위 목록 중 스토리가 되는 곳 1~2곳 선택
- [ ] 어떤 기능(홈 지도 랭킹 / 내 픽 저장 / 검색 / 필터 / 추천 배지 등)을 자연스럽게 보여줄지 정하기
- [ ] IG: 캐러셀 또는 릴스로 비주얼 위주 압축
- [ ] Threads: 캐주얼한 후기 텍스트로 짧게

*Supabase records 테이블에서 본인 로그인 세션으로 조회했습니다 (RLS 적용, 실제 방문 데이터).*
`;
}

async function main() {
  const schedule = await loadSchedule();
  const anchor = new Date(`${schedule.anchor_date}T00:00:00Z`);
  const today = new Date();

  const weekOverride = process.env.WEEK_OVERRIDE ? Number.parseInt(process.env.WEEK_OVERRIDE, 10) : null;
  const targetTuesday = weekOverride ? addDays(anchor, (weekOverride - 1) * 7) : getTargetTuesday(today);
  const week = weekOverride ?? getWeekNumber(anchor, targetTuesday);

  const diaryAuthor = week % 2 === 1 ? "yk" : "br";
  const visitAuthor = diaryAuthor === "yk" ? "br" : "yk";

  await mkdir(DRAFTS_DIR, { recursive: true });

  // 1) 개발일기 초안 — 비밀정보 없이 항상 생성 가능
  const index = Math.floor((week - 1) / 2);
  const diaryQueue = schedule[`${diaryAuthor}_diary_queue`];
  const diaryItem = diaryQueue[index];

  if (!diaryItem) {
    console.log(`[알림] ${AUTHOR_LABEL[diaryAuthor]} 개발일기 대기열이 ${week}주차에서 소진되었습니다. 새 소재를 추가하거나 자동화 봇으로 전환하세요.`);
  } else {
    const diaryDraft = buildDiaryDraft({ week, item: diaryItem, targetTuesday, author: diaryAuthor });
    const diaryPath = path.join(DRAFTS_DIR, `${toISODate(targetTuesday)}-${diaryAuthor}-diary.md`);
    await writeFile(diaryPath, diaryDraft, "utf-8");
    console.log(`초안 생성 완료: ${diaryPath}`);
    console.log("\n" + diaryDraft);
  }

  // 2) 방문기 초안 — 그 주 방문기 담당자의 refresh_token이 있을 때만 시도
  //    (이 앱은 소셜 로그인만 지원해서 비밀번호가 없다. 이미 로그인된 세션의
  //    refresh_token을 브라우저에서 한 번 꺼내와 .env.local에 넣어두면 된다.)
  const refreshTokenVar = `${visitAuthor.toUpperCase()}_REFRESH_TOKEN`;
  const refreshToken = process.env[refreshTokenVar];

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !refreshToken) {
    console.log(
      `[알림] 이번 주 방문기는 ${AUTHOR_LABEL[visitAuthor]} 차례입니다. ${refreshTokenVar}(및 SUPABASE_URL/ANON_KEY)가 없어서 건너뜁니다 — 방문기 담당자가 로컬에서 직접 실행해주세요.`
    );
    return;
  }

  const targetFriday = addDays(targetTuesday, 3);
  const since = addDays(today, -7);
  const { accessToken, userId } = await signInWithRefreshToken(refreshToken);
  const records = await fetchRecentRecords(userId, accessToken, toISODate(since));
  const visitDraft = buildVisitDraft({ week, targetFriday, records, author: visitAuthor });
  const visitPath = path.join(DRAFTS_DIR, `${toISODate(targetFriday)}-${visitAuthor}-visit.md`);
  await writeFile(visitPath, visitDraft, "utf-8");
  console.log(`초안 생성 완료: ${visitPath}`);
  console.log("\n" + visitDraft);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

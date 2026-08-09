/**
 * 기존 stores 중 subcategory가 비어있는 음식점(restaurant)만 골라
 * 지도 필터용 대분류(한식/중식/분식/뷔페/술집 등)로 일괄 갱신
 *
 * 이전 버전은 가게 이름으로 카카오 키워드 검색을 재실행해서 kakao_id가
 * 일치하는 결과를 찾았는데, 오래된 가게일수록 카카오 텍스트 검색 랭킹에서
 * 밀려나 매칭 성공률이 크게 떨어졌음(샘플 기준 최근 생성 94.3% vs 오래된
 * 것 1.3%). 그 결과 dev DB 기준 음식점 68,177개 중 47,609개(약 70%)가
 * subcategory NULL로 남아있어, 특정 세부 카테고리 필터(간식/분식/뷔페/
 * 술집 등)를 눌러도 실제보다 훨씬 적게 노출되는 문제로 이어짐.
 *
 * 이 버전은 가게에 저장된 위경도를 중심으로 카카오 "카테고리 검색"(FD6,
 * batch-kakao-places.js와 동일 방식)을 1차로 시도해서, 그 반경 안의 모든
 * 결과 중 kakao_id가 정확히 일치하는 것만 찾는다. 텍스트 검색 랭킹에
 * 의존하지 않아 매칭 성공률이 더 높지만, category_group_code=FD6 태깅이
 * 안 된 일부 가게는 여기서 못 찾을 수 있어 — 그 경우에만 기존 방식(이름
 * 키워드 검색, 좁은 반경 → 전국)으로 2차 폴백한다.
 *
 * 사용법:
 *   KAKAO_REST_API_KEY=<key> SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> node scripts/backfill-subcategory.mjs
 *   DRY_RUN=1 LIMIT=10 ... node scripts/backfill-subcategory.mjs
 *   LIMIT=5000 ORDER_DESC=1 ... node scripts/backfill-subcategory.mjs   # 배치 단위 실행
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
const PAGE_SIZE = 500;         // Supabase 조회 페이지 크기
const RADIUS = 350;            // 카카오 카테고리 검색 반경(m) — batch-kakao-places.js와 동일
const DELAY_MS = 120;          // 카카오 호출 간 딜레이 (ms)
const DRY_RUN = process.env.DRY_RUN === "1";
const LIMIT = Number.parseInt(process.env.LIMIT ?? "0", 10);
// 최근 생성된 가게일수록 카카오 인덱스에 여전히 남아있을 확률이 높다 —
// ORDER_DESC=1이면 id 내림차순(최근 것)부터 처리한다.
const ORDER_DESC = process.env.ORDER_DESC === "1";

if (!SUPABASE_URL || !SUPABASE_KEY || !KAKAO_KEY) {
  console.error("환경변수 KAKAO_REST_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY 를 설정하세요.");
  process.exit(1);
}

function parseSubcategory(categoryName) {
  if (!categoryName) return null;
  const parts = categoryName.split(" > ");
  return parts.length >= 2 ? parts[1] : null;
}

async function getStores() {
  const stores = [];
  let offset = 0;

  while (true) {
    const url = new URL("/rest/v1/stores", SUPABASE_URL);
    url.searchParams.set("select", "id,kakao_id,name,lat,lng");
    url.searchParams.set("category", "eq.restaurant");
    url.searchParams.set("subcategory", "is.null");
    url.searchParams.set("order", ORDER_DESC ? "id.desc" : "id.asc");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    const batch = await requestJson(url);
    stores.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    if (LIMIT > 0 && stores.length >= LIMIT) break;
  }

  return LIMIT > 0 ? stores.slice(0, LIMIT) : stores;
}

async function requestJson(url, options = {}) {
  const res = await fetch(
    url,
    {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        ...options.headers,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/** 위경도 중심 카카오 음식점(FD6) 카테고리 검색 — batch-kakao-places.js와 동일 엔드포인트/파라미터 */
async function kakaoCategorySearch(lat, lng, page) {
  const params = new URLSearchParams({
    category_group_code: "FD6",
    y: String(lat),
    x: String(lng),
    radius: String(RADIUS),
    page: String(page),
    size: "15",
  });
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/category.json?${params}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kakao HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

/** 이름 + 위치 기반 카카오 키워드 검색 (wide=true면 위치 제한 없이 전국 검색) */
async function kakaoKeywordSearch(name, lat, lng, wide = false) {
  const params = new URLSearchParams({ query: name, size: "15" });
  if (!wide) {
    params.set("x", String(lng));
    params.set("y", String(lat));
    params.set("radius", "500");
  }
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kakao HTTP ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.documents ?? [];
}

/**
 * store 위경도 반경 안의 카카오 카테고리(FD6) 검색 결과에서 kakao_id가
 * 정확히 일치하는 문서를 찾는다. 최대 3페이지(45개)까지 조회.
 * 반환값: 매칭된 category_name(문자열) | undefined(반경 안에서 못 찾음)
 *
 * category_group_code=FD6 인덱스에 안 걸려 있는 가게(이름엔 "음식점"이라고
 * 나와도 그룹 코드 태깅이 안 된 케이스)는 여기서 못 찾을 수 있어, 호출부에서
 * 이름 키워드 검색으로 한 번 더 폴백한다.
 */
async function findCategoryNameByGrid(store) {
  for (let page = 1; page <= 3; page++) {
    const result = await kakaoCategorySearch(store.lat, store.lng, page);
    const docs = result.documents ?? [];
    const matched = docs.find((d) => d.id === store.kakao_id);
    if (matched) return matched.category_name;

    const isEnd = result.meta?.is_end ?? true;
    if (isEnd) break;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  return undefined;
}

/**
 * 카테고리 검색으로 못 찾았을 때 이름 키워드 검색(좁은 반경 → 전국)으로
 * 한 번 더 시도한다. 카테고리 검색보다 텍스트 랭킹에 의존하지만, FD6 그룹
 * 코드 태깅이 안 된 가게를 잡아낼 수 있어 최후 수단으로 사용.
 */
async function findCategoryNameByKeyword(store) {
  let docs = await kakaoKeywordSearch(store.name, store.lat, store.lng, false);
  let matched = docs.find((d) => d.id === store.kakao_id);
  if (matched) return matched.category_name;

  await new Promise((r) => setTimeout(r, DELAY_MS));
  docs = await kakaoKeywordSearch(store.name, store.lat, store.lng, true);
  matched = docs.find((d) => d.id === store.kakao_id);
  return matched?.category_name;
}

/** 그리드(카테고리) 검색 우선 시도, 실패 시 키워드 검색으로 폴백 */
async function findCategoryName(store) {
  const viaGrid = await findCategoryNameByGrid(store);
  if (viaGrid !== undefined) return viaGrid;

  await new Promise((r) => setTimeout(r, DELAY_MS));
  return findCategoryNameByKeyword(store);
}

async function updateStore(id, subcategory) {
  await requestJson(`${SUPABASE_URL}/rest/v1/stores?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ subcategory }),
  });
}

async function main() {
  const stores = await getStores();
  console.log(`subcategory 백필 대상: ${stores.length}개\n`);

  let updated = 0;
  let noSubLevel = 0;   // 매칭은 됐지만 category_name에 세부 분류가 없음
  let notFound = 0;     // 반경 안에서 kakao_id 매칭 실패 (폐업/카카오 인덱스 누락 등)

  for (const store of stores) {
    const categoryName = await findCategoryName(store);

    if (categoryName === undefined) {
      console.log(`✗  ${store.name}  →  반경 내에서 못 찾음 (폐업 또는 카카오 인덱스 누락 가능)`);
      notFound++;
    } else {
      const subcategory = parseSubcategory(categoryName);
      if (subcategory) {
        if (!DRY_RUN) {
          await updateStore(store.id, subcategory);
        }
        console.log(`${DRY_RUN ? "[dry-run] " : "✓  "}${store.name}  →  ${subcategory}`);
        updated++;
      } else {
        console.log(`-  ${store.name}  →  상위 분류만 있음 (${categoryName})`);
        noSubLevel++;
      }
    }

    // Kakao API rate limit 대응
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(
    `\n완료${DRY_RUN ? " (dry-run)" : ""} — 업데이트: ${updated}개 / 상위분류만: ${noSubLevel}개 / 못 찾음: ${notFound}개`
  );
}

main().catch(console.error);

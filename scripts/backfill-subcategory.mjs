/**
 * 기존 stores의 subcategory 일괄 채우기
 * 사용법:
 *   KAKAO_REST_API_KEY=<key> SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> node scripts/backfill-subcategory.mjs
 *   DRY_RUN=1 LIMIT=10 ... node scripts/backfill-subcategory.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
const PAGE_SIZE = 500;
const DELAY_MS = 120;
const DRY_RUN = process.env.DRY_RUN === "1";
const LIMIT = Number.parseInt(process.env.LIMIT ?? "0", 10);

if (!SUPABASE_URL || !SUPABASE_KEY || !KAKAO_KEY) {
  console.error("환경변수 KAKAO_REST_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY 를 설정하세요.");
  process.exit(1);
}

function parseSubcategory(categoryName) {
  if (!categoryName) return null;
  const parts = categoryName.split(" > ");
  return parts.length >= 2 ? parts[parts.length - 1] : null;
}

async function getStores() {
  const stores = [];
  let offset = 0;

  while (true) {
    const url = new URL("/rest/v1/stores", SUPABASE_URL);
    url.searchParams.set("subcategory", "is.null");
    url.searchParams.set("select", "id,kakao_id,name,lat,lng");
    url.searchParams.set("order", "id.asc");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    const batch = await requestJson(url);
    stores.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
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

async function kakaoSearch(name, lat, lng, wide = false) {
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
  console.log(`subcategory 없는 가게: ${stores.length}개\n`);

  let updated = 0;
  let skipped = 0;

  for (const store of stores) {
    let results = await kakaoSearch(store.name, store.lat, store.lng);
    let matched = results.find((r) => r.id === store.kakao_id);

    // 위치 기반 검색 실패 시 위치 제한 없이 재시도
    if (!matched) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      results = await kakaoSearch(store.name, store.lat, store.lng, true);
      matched = results.find((r) => r.id === store.kakao_id);
    }

    if (matched) {
      const subcategory = parseSubcategory(matched.category_name);
      if (subcategory) {
        if (!DRY_RUN) {
          await updateStore(store.id, subcategory);
        }
        console.log(`${DRY_RUN ? "[dry-run] " : "✓  "}${store.name}  →  ${subcategory}`);
        updated++;
      } else {
        console.log(`-  ${store.name}  →  상위 분류만 있음 (${matched.category_name})`);
        skipped++;
      }
    } else {
      console.log(`✗  ${store.name}  →  카카오에서 찾지 못함`);
      skipped++;
    }

    // Kakao API rate limit 대응
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\n완료${DRY_RUN ? " (dry-run)" : ""} — 업데이트 대상: ${updated}개 / 스킵: ${skipped}개`);
}

main().catch(console.error);

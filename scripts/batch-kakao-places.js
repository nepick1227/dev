/**
 * NePick 카카오 장소 배치 적재 스크립트
 *
 * 사용법:
 *   KAKAO_REST_API_KEY=<키> SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> node scripts/batch-kakao-places.js
 *   DRY_RUN=1 MAX_CELLS=3 ... node scripts/batch-kakao-places.js
 *   REGIONS=seoul,busan ... node scripts/batch-kakao-places.js   # 특정 지역만 실행 (기본값: 전체)
 *
 * 동작:
 *   - 전국 광역시 단위(REGIONS, 서울+6개 광역시+세종) 를 지역별로 500m 그리드로 분할
 *   - 각 셀마다 음식점(FD6) + 카페(CE7) 카테고리 검색 (최대 3페이지 × 15개 = 45개)
 *   - 하루 호출 한도(MAX_DAILY_CALLS)에 도달하면 진행 상태를 저장하고 종료
 *   - 다음 날 실행 시 중단된 지점부터 이어서 진행 (지역 간 이어짐, 순서는 REGIONS 배열 순)
 *   - Supabase stores 테이블에 upsert (kakao_id 기준 중복 제거)
 *
 * 지역 경계는 각 광역시 전체를 감싸는 근사 사각형입니다. 산/바다 등 비도심 셀은
 * 카카오 검색 결과가 0건이라 API 호출만 소모하고 적재는 없습니다(기존 서울 그리드와 동일한 방식).
 *
 * 예상 커버리지 (지역 전체 기준):
 *   - 그리드 셀 수: 지역당 수천~1만4천개 수준 (서울이 가장 넓음, 세종이 가장 작음)
 *   - 셀당 API 호출: 카테고리 2 × 페이지 3 = 6회
 *   - 전국 8개 지역 총합 시 하루 50,000회 제한 기준 1~2주 소요 예상 — REGIONS로 지역을 나눠 실행 권장
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ── 환경변수 ────────────────────────────────────────────
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!KAKAO_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("환경변수 KAKAO_REST_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY 를 설정하세요.");
  process.exit(1);
}

// ── 설정 ────────────────────────────────────────────────
const MAX_DAILY_CALLS = 50_000;   // 하루 최대 API 호출 수 (안전 마진 포함)
const MAX_CELLS = Number.parseInt(process.env.MAX_CELLS ?? "0", 10);
const GRID_STEP_M = 500;          // 그리드 간격 (미터)
const RADIUS = 350;               // 검색 반경 (미터) — 그리드 겹침으로 누락 방지
const DELAY_MS = 100;             // 호출 간 딜레이 (ms) — 초당 10회 이내 유지
const PROGRESS_FILE = path.join(__dirname, ".batch-progress.json");
const DRY_RUN = process.env.DRY_RUN === "1";

// ── 전국 광역시 단위 경계 (위경도) ────────────────────────
// 각 지역 전체를 감싸는 근사 사각형. REGIONS 환경변수로 일부만 선택 가능
// (예: REGIONS=seoul,busan). 미지정 시 아래 순서대로 전체 실행.
const ALL_REGIONS = [
  { key: "seoul", name: "서울", bounds: { minLat: 37.413, maxLat: 37.715, minLng: 126.734, maxLng: 127.269 } },
  { key: "busan", name: "부산", bounds: { minLat: 34.876, maxLat: 35.402, minLng: 128.741, maxLng: 129.309 } },
  { key: "daegu", name: "대구", bounds: { minLat: 35.591, maxLat: 35.984, minLng: 128.349, maxLng: 128.775 } },
  { key: "incheon", name: "인천", bounds: { minLat: 37.183, maxLat: 37.750, minLng: 126.383, maxLng: 126.775 } },
  { key: "gwangju", name: "광주", bounds: { minLat: 35.079, maxLat: 35.257, minLng: 126.734, maxLng: 126.982 } },
  { key: "daejeon", name: "대전", bounds: { minLat: 36.203, maxLat: 36.481, minLng: 127.245, maxLng: 127.518 } },
  { key: "ulsan", name: "울산", bounds: { minLat: 35.423, maxLat: 35.688, minLng: 129.157, maxLng: 129.517 } },
  { key: "sejong", name: "세종", bounds: { minLat: 36.443, maxLat: 36.687, minLng: 127.184, maxLng: 127.386 } },
];

const REQUESTED_REGION_KEYS = (process.env.REGIONS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const REGIONS = REQUESTED_REGION_KEYS.length > 0
  ? ALL_REGIONS.filter((r) => REQUESTED_REGION_KEYS.includes(r.key))
  : ALL_REGIONS;

if (REGIONS.length === 0) {
  console.error(`REGIONS 값이 올바르지 않습니다. 사용 가능한 지역: ${ALL_REGIONS.map((r) => r.key).join(", ")}`);
  process.exit(1);
}

const CATEGORIES = [
  { code: "FD6", name: "restaurant" },
  { code: "CE7", name: "cafe" },
];

// ── 유틸 ────────────────────────────────────────────────

/** 미터 → 위도 차 변환 */
function meterToLat(m) {
  return m / 111_320;
}

/** 미터 → 경도 차 변환 (위도 보정) */
function meterToLng(m, lat) {
  return m / (111_320 * Math.cos((lat * Math.PI) / 180));
}

/** 딜레이 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 진행 상태 불러오기
 * REGIONS 선택이 이전 실행과 다르면 그리드 구성 자체가 달라져 cellIndex가
 * 어긋나므로, regionKeys가 일치할 때만 이어서 진행하고 다르면 처음부터 시작한다.
 */
function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return { cellIndex: 0, callCount: 0 };
  try {
    const saved = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    const currentKeys = REGIONS.map((r) => r.key).join(",");
    if (saved.regionKeys && saved.regionKeys !== currentKeys) {
      console.log(
        `⚠️  이전 실행의 REGIONS(${saved.regionKeys})와 이번 REGIONS(${currentKeys})가 달라 처음부터 시작합니다.`
      );
      return { cellIndex: 0, callCount: 0 };
    }
    return saved;
  } catch {
    return { cellIndex: 0, callCount: 0 };
  }
}

/** 진행 상태 저장 */
function saveProgress(state) {
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify({ ...state, regionKeys: REGIONS.map((r) => r.key).join(",") }, null, 2)
  );
}

// ── 그리드 생성 ──────────────────────────────────────────
function buildGridForBounds(bounds) {
  const cells = [];
  const latStep = meterToLat(GRID_STEP_M);
  let lat = bounds.minLat;
  while (lat <= bounds.maxLat) {
    const lngStep = meterToLng(GRID_STEP_M, lat);
    let lng = bounds.minLng;
    while (lng <= bounds.maxLng) {
      cells.push({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
      lng += lngStep;
    }
    lat += latStep;
  }
  return cells;
}

/** 선택된 REGIONS 순서대로 지역 그리드를 이어붙여 하나의 셀 목록으로 생성 */
function buildGrid() {
  return REGIONS.flatMap((region) =>
    buildGridForBounds(region.bounds).map((cell) => ({
      ...cell,
      regionKey: region.key,
      regionName: region.name,
    }))
  );
}

// ── 카카오 카테고리 검색 ─────────────────────────────────
function kakaoSearch(lat, lng, categoryCode, page) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      category_group_code: categoryCode,
      y: String(lat),
      x: String(lng),
      radius: String(RADIUS),
      page: String(page),
      size: "15",
    });
    const options = {
      hostname: "dapi.kakao.com",
      path: `/v2/local/search/category.json?${params}`,
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    };
    https.get(options, (res) => {
      // 청크 경계의 멀티바이트(한글) 문자가 깨지지 않도록 UTF-8 스트림 디코딩
      res.setEncoding("utf8");
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// ── Supabase upsert ──────────────────────────────────────
function upsertStores(rows) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rows);
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path: "/rest/v1/stores?on_conflict=kakao_id",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "resolution=ignore-duplicates",  // kakao_id 중복 시 무시
      },
    };
    const req = https.request(options, (res) => {
      res.setEncoding("utf8");
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Supabase error ${res.statusCode}: ${data}`));
        } else {
          resolve();
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/** 카카오 category_name → 지도 필터용 대분류 ("음식점 > 한식 > 냉면" → "한식") */
function parseSubcategory(categoryName) {
  if (!categoryName) return null;
  const parts = categoryName.split(" > ");
  return parts.length >= 2 ? parts[1] : null;
}

/** 카카오 PlaceResult → stores row 변환 */
function toStoreRow(place, category) {
  return {
    kakao_id: place.id,
    name: place.place_name,
    category,
    subcategory: parseSubcategory(place.category_name),
    address: place.address_name,
    road_address: place.road_address_name || null,
    lat: parseFloat(place.y),
    lng: parseFloat(place.x),
    phone: place.phone || null,
  };
}

// ── 메인 ────────────────────────────────────────────────
async function main() {
  const grid = buildGrid();
  const progress = loadProgress();
  let { cellIndex, callCount } = progress;

  console.log(`대상 지역: ${REGIONS.map((r) => r.name).join(", ")}`);
  console.log(`총 그리드 셀: ${grid.length}개 | 시작 셀: ${cellIndex} | 오늘 호출 수: ${callCount}`);

  let insertedTotal = 0;
  let currentRegionKey = null;

  const endCellIndex = MAX_CELLS > 0 ? Math.min(cellIndex + MAX_CELLS, grid.length) : grid.length;

  for (; cellIndex < endCellIndex; cellIndex++) {
    if (callCount >= MAX_DAILY_CALLS) {
      console.log(`\n하루 호출 한도(${MAX_DAILY_CALLS})에 도달. 진행 상태 저장 후 종료.`);
      saveProgress({ cellIndex, callCount });
      return;
    }

    const { lat, lng, regionKey, regionName } = grid[cellIndex];
    if (regionKey !== currentRegionKey) {
      currentRegionKey = regionKey;
      console.log(`\n── ${regionName} 시작 (셀 ${cellIndex}) ──`);
    }
    const rows = [];

    for (const { code, name } of CATEGORIES) {
      let isEnd = false;
      for (let page = 1; page <= 3 && !isEnd; page++) {
        try {
          const result = await kakaoSearch(lat, lng, code, page);
          callCount++;

          if (!result.documents || result.documents.length === 0) break;

          result.documents.forEach((place) => rows.push(toStoreRow(place, name)));
          isEnd = result.meta?.is_end ?? true;

          await sleep(DELAY_MS);
        } catch (e) {
          console.error(`  검색 오류 (${lat},${lng} ${code} p${page}):`, e.message);
        }
      }
    }

    if (rows.length > 0) {
      try {
        if (!DRY_RUN) {
          await upsertStores(rows);
        }
        insertedTotal += rows.length;
      } catch (e) {
        console.error(`  upsert 오류:`, e.message);
      }
    }

    if (cellIndex % 100 === 0) {
      process.stdout.write(`\r[${regionName}] 셀 ${cellIndex}/${grid.length} | 호출 ${callCount} | 적재 ${insertedTotal}건`);
      saveProgress({ cellIndex, callCount });
    }
  }

  // 완료 시 진행 파일 삭제
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  console.log(`\n완료${DRY_RUN ? " (dry-run)" : ""}! 총 적재 대상: ${insertedTotal}건 | 총 API 호출: ${callCount}회`);
}

main().catch((e) => {
  console.error("배치 실패:", e);
  process.exit(1);
});

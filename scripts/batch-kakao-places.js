/**
 * NePick 카카오 장소 배치 적재 스크립트
 *
 * 사용법:
 *   KAKAO_REST_API_KEY=<키> SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> node scripts/batch-kakao-places.js
 *
 * 동작:
 *   - 서울 전체를 500m 그리드로 분할
 *   - 각 셀마다 음식점(FD6) + 카페(CE7) 카테고리 검색 (최대 3페이지 × 15개 = 45개)
 *   - 하루 호출 한도(MAX_DAILY_CALLS)에 도달하면 진행 상태를 저장하고 종료
 *   - 다음 날 실행 시 중단된 지점부터 이어서 진행
 *   - Supabase stores 테이블에 upsert (kakao_id 기준 중복 제거)
 *
 * 서울 커버리지 예상:
 *   - 그리드 셀 수: 약 14,000개
 *   - 셀당 API 호출: 카테고리 2 × 페이지 3 = 6회
 *   - 전체 호출: ~84,000회 → 하루 50,000회 제한 시 약 2일 소요
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ── 환경변수 ────────────────────────────────────────────
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!KAKAO_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("환경변수 KAKAO_REST_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY 를 설정하세요.");
  process.exit(1);
}

// ── 설정 ────────────────────────────────────────────────
const MAX_DAILY_CALLS = 50_000;   // 하루 최대 API 호출 수 (안전 마진 포함)
const GRID_STEP_M = 500;          // 그리드 간격 (미터)
const RADIUS = 350;               // 검색 반경 (미터) — 그리드 겹침으로 누락 방지
const DELAY_MS = 100;             // 호출 간 딜레이 (ms) — 초당 10회 이내 유지
const PROGRESS_FILE = path.join(__dirname, ".batch-progress.json");

// ── 서울 경계 (위경도) ──────────────────────────────────
const BOUNDS = {
  minLat: 37.413,
  maxLat: 37.715,
  minLng: 126.734,
  maxLng: 127.269,
};

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

/** 진행 상태 불러오기 */
function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return { cellIndex: 0, callCount: 0 };
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  } catch {
    return { cellIndex: 0, callCount: 0 };
  }
}

/** 진행 상태 저장 */
function saveProgress(state) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2));
}

// ── 그리드 생성 ──────────────────────────────────────────
function buildGrid() {
  const cells = [];
  const latStep = meterToLat(GRID_STEP_M);
  let lat = BOUNDS.minLat;
  while (lat <= BOUNDS.maxLat) {
    const lngStep = meterToLng(GRID_STEP_M, lat);
    let lng = BOUNDS.minLng;
    while (lng <= BOUNDS.maxLng) {
      cells.push({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
      lng += lngStep;
    }
    lat += latStep;
  }
  return cells;
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
      path: "/rest/v1/stores",
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

/** 카카오 PlaceResult → stores row 변환 */
function toStoreRow(place, category) {
  return {
    kakao_id: place.id,
    name: place.place_name,
    category,
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

  console.log(`총 그리드 셀: ${grid.length}개 | 시작 셀: ${cellIndex} | 오늘 호출 수: ${callCount}`);

  let insertedTotal = 0;

  for (; cellIndex < grid.length; cellIndex++) {
    if (callCount >= MAX_DAILY_CALLS) {
      console.log(`\n하루 호출 한도(${MAX_DAILY_CALLS})에 도달. 진행 상태 저장 후 종료.`);
      saveProgress({ cellIndex, callCount });
      return;
    }

    const { lat, lng } = grid[cellIndex];
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
        await upsertStores(rows);
        insertedTotal += rows.length;
      } catch (e) {
        console.error(`  upsert 오류:`, e.message);
      }
    }

    if (cellIndex % 100 === 0) {
      process.stdout.write(`\r셀 ${cellIndex}/${grid.length} | 호출 ${callCount} | 적재 ${insertedTotal}건`);
      saveProgress({ cellIndex, callCount });
    }
  }

  // 완료 시 진행 파일 삭제
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  console.log(`\n완료! 총 적재: ${insertedTotal}건 | 총 API 호출: ${callCount}회`);
}

main().catch((e) => {
  console.error("배치 실패:", e);
  process.exit(1);
});

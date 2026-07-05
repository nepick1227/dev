import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/http";

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const ALLOWED_CATEGORY_GROUP_CODES = new Set(["", "FD6", "CE7"]);

interface KakaoSearchDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string;
  y: string;
  distance?: string;
}

function isValidCoordinate(value: string | null, min: number, max: number) {
  if (!value) return false;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= min && numberValue <= max;
}

function toPublicKakaoDocument(document: KakaoSearchDocument) {
  return {
    id: document.id,
    place_name: document.place_name,
    category_name: document.category_name,
    category_group_code: document.category_group_code,
    address_name: document.address_name,
    road_address_name: document.road_address_name,
    phone: document.phone,
    x: document.x,
    y: document.y,
    distance: document.distance,
  };
}

export async function GET(req: NextRequest) {
  const rateLimited = checkRateLimit(req, "kakao-search", {
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  if (!KAKAO_REST_API_KEY) {
    return NextResponse.json({ error: "장소 검색을 사용할 수 없습니다." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query")?.trim() ?? "";
  const categoryGroupCode = searchParams.get("category_group_code") ?? "";
  const x = searchParams.get("x");
  const y = searchParams.get("y");

  if (!query) {
    return NextResponse.json({ error: "검색어를 입력하세요." }, { status: 400 });
  }
  if (query.length > 100) {
    return NextResponse.json({ error: "검색어는 100자 이하여야 합니다." }, { status: 400 });
  }
  if (!ALLOWED_CATEGORY_GROUP_CODES.has(categoryGroupCode)) {
    return NextResponse.json({ error: "잘못된 검색 조건입니다." }, { status: 400 });
  }
  if ((x || y) && (!isValidCoordinate(x, 124, 132) || !isValidCoordinate(y, 33, 39))) {
    return NextResponse.json({ error: "잘못된 위치 정보입니다." }, { status: 400 });
  }

  const params = new URLSearchParams({
    query,
    size: "15",
  });
  if (categoryGroupCode) {
    params.set("category_group_code", categoryGroupCode);
  }
  if (x && y) {
    params.set("x", x);
    params.set("y", y);
    params.set("sort", "distance");
  }

  const kakaoRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!kakaoRes.ok) {
    return NextResponse.json({ error: "카카오 검색 요청 실패" }, { status: kakaoRes.status });
  }

  const data = await kakaoRes.json() as {
    documents?: KakaoSearchDocument[];
    meta?: unknown;
  };
  const documents = (data.documents ?? [])
    .filter((document) =>
      document.category_group_code === "FD6" ||
      document.category_group_code === "CE7"
    )
    .map(toPublicKakaoDocument);

  return NextResponse.json({
    documents,
    meta: data.meta,
  });
}

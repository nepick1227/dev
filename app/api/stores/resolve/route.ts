import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, readJsonBody } from "@/lib/security/http";
import { parseKakaoCategory, parseKakaoSubcategory } from "@/utils/format";
import type { StoreInsert } from "@/types/database";

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface ResolveStoreBody {
  kakaoId?: string;
  query?: string;
  x?: string;
  y?: string;
}

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string;
  y: string;
}

function isValidCoordinate(value: string | undefined, min: number, max: number) {
  if (!value) return false;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= min && numberValue <= max;
}

async function searchKakaoPlaces(body: ResolveStoreBody, includeCoordinates: boolean) {
  if (!KAKAO_REST_API_KEY) {
    throw new Error("kakao_rest_api_key_missing");
  }

  const query = body.query?.trim() ?? "";
  const params = new URLSearchParams({
    query,
    size: "15",
  });

  if (includeCoordinates && body.x && body.y) {
    params.set("x", body.x);
    params.set("y", body.y);
    params.set("sort", "distance");
  }

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!response.ok) {
    throw new Error(`kakao_search_failed:${response.status}`);
  }

  const payload = await response.json() as { documents?: KakaoPlace[] };
  return payload.documents ?? [];
}

async function findVerifiedKakaoPlace(body: ResolveStoreBody) {
  const withCoordinates = await searchKakaoPlaces(body, true);
  const coordinateMatch = withCoordinates.find((place) =>
    place.id === body.kakaoId &&
    (place.category_group_code === "FD6" || place.category_group_code === "CE7")
  );
  if (coordinateMatch) return coordinateMatch;

  const withoutCoordinates = await searchKakaoPlaces(body, false);
  return withoutCoordinates.find((place) =>
    place.id === body.kakaoId &&
    (place.category_group_code === "FD6" || place.category_group_code === "CE7")
  ) ?? null;
}

async function findOrCreateStoreId(storeData: StoreInsert) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("store_admin_config_missing");
  }

  const adminClient = createAdminClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: existingStore, error: selectError } = await adminClient
    .from("stores")
    .select("id")
    .eq("kakao_id", storeData.kakao_id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existingStore) return Number(existingStore.id);

  const { data: newStore, error: insertError } = await adminClient
    .from("stores")
    .insert(storeData)
    .select("id")
    .single();

  if (!insertError) return Number(newStore.id);
  if (insertError.code !== "23505") throw insertError;

  const { data: racedStore, error: racedSelectError } = await adminClient
    .from("stores")
    .select("id")
    .eq("kakao_id", storeData.kakao_id)
    .single();

  if (racedSelectError) throw racedSelectError;
  return Number(racedStore.id);
}

export async function POST(req: NextRequest) {
  const rateLimited = checkRateLimit(req, "store-resolve", {
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  const { data: body, error: bodyError } = await readJsonBody<ResolveStoreBody>(req, 4 * 1024);
  if (bodyError) return bodyError;

  const query = body?.query?.trim() ?? "";

  if (!KAKAO_REST_API_KEY) {
    return NextResponse.json(
      { error: "장소 검증 설정이 누락되었습니다." },
      { status: 503 }
    );
  }

  if (
    !body?.kakaoId ||
    !/^\d{1,40}$/.test(body.kakaoId) ||
    query.length < 1 ||
    query.length > 100 ||
    !isValidCoordinate(body.x, 124, 132) ||
    !isValidCoordinate(body.y, 33, 39)
  ) {
    return NextResponse.json({ error: "잘못된 가게 정보입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const place = await findVerifiedKakaoPlace(body);
    if (!place) {
      return NextResponse.json({ error: "카카오에서 확인된 가게만 저장할 수 있습니다." }, { status: 400 });
    }

    const storeData: StoreInsert = {
      kakao_id: place.id,
      name: place.place_name,
      category: parseKakaoCategory(place.category_group_code),
      subcategory: parseKakaoSubcategory(place.category_name),
      address: place.address_name,
      road_address: place.road_address_name || null,
      lat: Number(place.y),
      lng: Number(place.x),
      phone: place.phone || null,
    };

    const storeId = await findOrCreateStoreId(storeData);
    return NextResponse.json({ storeId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("[StoreResolve]", message);
    if (message === "store_admin_config_missing") {
      return NextResponse.json(
        { error: "가게 저장 설정이 누락되었습니다." },
        { status: 503 }
      );
    }
    if (message.startsWith("kakao_search_failed:429")) {
      return NextResponse.json(
        { error: "장소 확인 요청이 잠시 많아졌어요. 잠시 후 다시 시도해 주세요." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "가게 정보를 확인하지 못했습니다." }, { status: 500 });
  }
}

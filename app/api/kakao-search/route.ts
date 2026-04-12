import { NextRequest, NextResponse } from "next/server";

/**
 * 카카오 장소 검색 API 라우트 (임시 mock)
 * 실제 서비스 전 Supabase Edge Function 또는 카카오 REST API로 교체 필요
 */

const MOCK_PLACES = [
  {
    id: "mock-001",
    place_name: "모수",
    category_name: "음식점 > 양식",
    category_group_code: "FD6",
    address_name: "서울 용산구 이태원로55가길 45",
    road_address_name: "서울 용산구 이태원로55가길 45",
    phone: "02-792-5756",
    x: "126.9946",
    y: "37.5396",
  },
  {
    id: "mock-002",
    place_name: "블루보틀 삼청점",
    category_name: "음식점 > 카페",
    category_group_code: "CE7",
    address_name: "서울 종로구 삼청로 76",
    road_address_name: "서울 종로구 삼청로 76",
    phone: "02-736-0113",
    x: "126.9808",
    y: "37.5837",
  },
  {
    id: "mock-003",
    place_name: "하남돼지집 홍대점",
    category_name: "음식점 > 한식",
    category_group_code: "FD6",
    address_name: "서울 마포구 서교동 394-33",
    road_address_name: "서울 마포구 양화로 141",
    phone: "02-332-6565",
    x: "126.9248",
    y: "37.5563",
  },
  {
    id: "mock-004",
    place_name: "테라로사 한남점",
    category_name: "음식점 > 카페",
    category_group_code: "CE7",
    address_name: "서울 용산구 한남대로 44-1",
    road_address_name: "서울 용산구 한남대로 44-1",
    phone: "02-792-4820",
    x: "126.9989",
    y: "37.5347",
  },
  {
    id: "mock-005",
    place_name: "을밀대",
    category_name: "음식점 > 한식",
    category_group_code: "FD6",
    address_name: "서울 중구 만리재로 61",
    road_address_name: "서울 중구 만리재로 61",
    phone: "02-711-4490",
    x: "126.9591",
    y: "37.5551",
  },
  {
    id: "mock-006",
    place_name: "카페 레이어드 북촌점",
    category_name: "음식점 > 카페",
    category_group_code: "CE7",
    address_name: "서울 종로구 북촌로 7-4",
    road_address_name: "서울 종로구 북촌로 7-4",
    phone: "",
    x: "126.9835",
    y: "37.5823",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // 공백 정규화: 앞뒤 trim + 중간 연속 공백 → 단일 공백
  const query = (searchParams.get("query") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  // 검색어로 필터링 (이름 또는 주소에 포함되면 반환)
  const results = query
    ? MOCK_PLACES.filter(
        (p) =>
          p.place_name.toLowerCase().includes(query) ||
          p.address_name.toLowerCase().includes(query)
      )
    : MOCK_PLACES;

  return NextResponse.json({ documents: results });
}

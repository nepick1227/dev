import { NextRequest, NextResponse } from "next/server";

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

export async function GET(req: NextRequest) {
  if (!KAKAO_REST_API_KEY) {
    return NextResponse.json({ error: "카카오 API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query");
  const categoryGroupCode = searchParams.get("category_group_code") ?? "";

  if (!query || query.trim() === "") {
    return NextResponse.json({ error: "검색어를 입력하세요." }, { status: 400 });
  }

  const params = new URLSearchParams({
    query: query.trim(),
    size: "15",
  });
  if (categoryGroupCode) {
    params.set("category_group_code", categoryGroupCode);
  }

  const kakaoRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
      next: { revalidate: 0 },
    }
  );

  if (!kakaoRes.ok) {
    return NextResponse.json({ error: "카카오 검색 요청 실패" }, { status: kakaoRes.status });
  }

  const data = await kakaoRes.json();
  return NextResponse.json(data);
}

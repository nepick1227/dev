import { NEPICK_SLUG_PATTERN } from "@/lib/nepick";

const ALLOWED_NEXT_PATHS = new Set(["/home", "/nepick", "/mypick", "/profile", "/record"]);
const NEPICK_BOARD_PREFIX = "/nepick/";

function isAllowedNextPath(pathname: string) {
  if (ALLOWED_NEXT_PATHS.has(pathname)) return true;
  // 네 픽 게시판: /nepick/[slug]
  return pathname.startsWith(NEPICK_BOARD_PREFIX) &&
    NEPICK_SLUG_PATTERN.test(pathname.slice(NEPICK_BOARD_PREFIX.length));
}

/** 로그인 뒤 돌아갈 수 있는 주소면 그대로, 아니면 null */
export function parseAuthNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;

  try {
    const url = new URL(next, "https://nepick.local");
    return isAllowedNextPath(url.pathname) ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}

export function getSafeAuthNextPath(next: string | null | undefined) {
  return parseAuthNextPath(next) ?? "/home";
}

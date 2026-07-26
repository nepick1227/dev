const ALLOWED_NEXT_PATHS = new Set(["/home", "/mypick", "/profile", "/record"]);

/**
 * 로그인 후 돌아갈 경로를 검증한다.
 * 오픈 리다이렉트 방지를 위해 같은 origin의 허용된 경로만 통과시키고,
 * 그 외에는 항상 "/home"으로 폴백한다.
 */
export function resolveSafeNextPath(next: string | null | undefined, origin: string): string {
  if (!next) return "/home";

  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/home";
    if (!ALLOWED_NEXT_PATHS.has(url.pathname)) return "/home";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/home";
  }
}

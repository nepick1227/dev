const ALLOWED_NEXT_PATHS = new Set(["/home", "/mypick", "/profile", "/record"]);

export function getSafeAuthNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/home";

  try {
    const url = new URL(next, "https://nepick.local");
    return ALLOWED_NEXT_PATHS.has(url.pathname)
      ? `${url.pathname}${url.search}`
      : "/home";
  } catch {
    return "/home";
  }
}

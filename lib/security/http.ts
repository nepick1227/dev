import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.headers.get("x-real-ip") || "unknown";
}

function cleanupExpiredBuckets(now: number) {
  if (rateLimitBuckets.size < 1000) return;

  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

export function checkRateLimit(
  req: NextRequest,
  name: string,
  { limit, windowMs }: RateLimitOptions
) {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = `${name}:${getClientIp(req)}`;
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;
  if (current.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  return NextResponse.json(
    { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}

export async function readJsonBody<T>(req: NextRequest, maxBytes: number) {
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "요청 내용이 너무 큽니다." },
        { status: 413 }
      ),
    };
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "요청 내용이 너무 큽니다." },
        { status: 413 }
      ),
    };
  }

  try {
    return { data: JSON.parse(raw) as T, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      ),
    };
  }
}

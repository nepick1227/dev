"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSignedImageUrl, type ImageBucket } from "@/lib/supabase/storage";

interface SignedUrlCacheEntry {
  url: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 55 * 60 * 1000;
const signedUrlCache = new Map<string, SignedUrlCacheEntry>();
const pendingSignedUrls = new Map<string, Promise<string | null>>();

function getCachedUrl(key: string) {
  const cached = signedUrlCache.get(key);
  if (!cached) return undefined;
  if (cached.expiresAt <= Date.now()) {
    signedUrlCache.delete(key);
    return undefined;
  }
  return cached.url;
}

function resolveSignedUrl(bucket: ImageBucket, source: string) {
  const key = `${bucket}:${source}`;
  const cached = getCachedUrl(key);
  if (cached !== undefined) return Promise.resolve(cached);

  const pending = pendingSignedUrls.get(key);
  if (pending) return pending;

  const request = createSignedImageUrl(createClient(), bucket, source)
    .then((url) => {
      signedUrlCache.set(key, { url, expiresAt: Date.now() + CACHE_TTL_MS });
      return url;
    })
    .finally(() => pendingSignedUrls.delete(key));

  pendingSignedUrls.set(key, request);
  return request;
}

export function useSignedImageUrl(bucket: ImageBucket, source: string | null | undefined) {
  const [resolved, setResolved] = useState<{ source: string; url: string | null } | null>(null);
  const immediateUrl = source?.startsWith("blob:") || source?.startsWith("data:") ? source : null;

  useEffect(() => {
    if (!source || immediateUrl) return;

    let ignore = false;
    resolveSignedUrl(bucket, source)
      .then((url) => {
        if (!ignore) setResolved({ source, url });
      })
      .catch((error) => {
        console.error("[SignedImageUrl]", error);
        if (!ignore) setResolved({ source, url: null });
      });

    return () => {
      ignore = true;
    };
  }, [bucket, immediateUrl, source]);

  if (!source) return null;
  if (immediateUrl) return immediateUrl;
  return resolved?.source === source ? resolved.url : null;
}

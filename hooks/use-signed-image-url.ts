"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSignedImageUrl, type ImageBucket } from "@/lib/supabase/storage";

export function useSignedImageUrl(bucket: ImageBucket, source: string | null | undefined) {
  const [resolved, setResolved] = useState<{ source: string; url: string | null } | null>(null);
  const immediateUrl = source?.startsWith("blob:") || source?.startsWith("data:") ? source : null;

  useEffect(() => {
    if (!source || immediateUrl) return;

    let ignore = false;
    const supabase = createClient();

    createSignedImageUrl(supabase, bucket, source)
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

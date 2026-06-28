import type { SupabaseClient } from "@supabase/supabase-js";

export type ImageBucket = "record-images" | "profile-images";

const SIGNED_IMAGE_URL_EXPIRES_IN = 60 * 60;

const STORAGE_URL_PREFIXES = [
  "/storage/v1/object/public/",
  "/storage/v1/object/sign/",
  "/storage/v1/object/authenticated/",
];

export function getStorageImagePath(source: string | null | undefined, bucket: ImageBucket) {
  if (!source) return null;

  const trimmed = source.trim();
  if (!trimmed) return null;

  if (!/^https?:\/\//.test(trimmed)) {
    return trimmed.replace(/^\/+/, "");
  }

  try {
    const url = new URL(trimmed);
    const prefix = STORAGE_URL_PREFIXES.find((candidate) =>
      url.pathname.startsWith(`${candidate}${bucket}/`)
    );

    if (!prefix) return null;

    return decodeURIComponent(url.pathname.slice(`${prefix}${bucket}/`.length));
  } catch {
    return null;
  }
}

export async function createSignedImageUrl(
  supabase: SupabaseClient,
  bucket: ImageBucket,
  source: string | null | undefined
) {
  if (!source) return null;

  const path = getStorageImagePath(source, bucket);
  if (!path) return source;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_IMAGE_URL_EXPIRES_IN);

  if (error) throw error;
  return data.signedUrl;
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const supabase = await createClient();

  await supabase.auth.signOut();

  if (error) {
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL("/home", origin));
}

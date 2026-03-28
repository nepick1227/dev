"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

/**
 * 인증 상태 관리 훅
 * 세션 변경을 구독하고 프로필 정보를 함께 제공합니다.
 *
 * @example
 * const { user, profile, isLoading } = useAuth();
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    // 현재 세션 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchProfile(user.id).then((profile) => {
          setState({ user, profile, isLoading: false });
        });
      } else {
        setState({ user: null, profile: null, isLoading: false });
      }
    });

    // 세션 변경 구독 (로그인/로그아웃)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (user) {
        fetchProfile(user.id).then((profile) => {
          setState({ user, profile, isLoading: false });
        });
      } else {
        setState({ user: null, profile: null, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data as Profile | null;
}

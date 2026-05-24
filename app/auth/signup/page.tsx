"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import { validateNickname } from "@/utils/validation";

// ── 타입 ─────────────────────────────────────────────
type Gender = "male" | "female" | "unknown";
type NicknameStatus = null | "checking" | "ok" | "taken" | "error";

// ── 서브 컴포넌트: 라디오 버튼 ───────────────────────
function RadioOption({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border-[1.5px] p-3.5 transition-all duration-200"
      style={{
        background: selected ? "rgba(211,47,47,0.06)" : "#F9FAFB",
        borderColor: selected ? "rgba(211,47,47,0.25)" : "#E5E7EB",
      }}
    >
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200"
        style={{ borderColor: selected ? "#D32F2F" : "#E5E7EB" }}
      >
        {selected && <div className="h-4 w-4 rounded-full opacity-50" style={{ background: "#D32F2F" }} />}
      </div>
      <span
        className="text-[15px] tracking-tight text-text-primary"
        style={{ fontWeight: selected ? 600 : 400 }}
      >
        {label}
      </span>
    </button>
  );
}

// ── 메인: 회원가입 프로필 입력 ───────────────────────
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketingAgree = searchParams.get("marketing") === "1";
  const { toast, showToast } = useToast();

  // 폼 상태
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>(null);
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | null>("unknown");
  const [intro, setIntro] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // 뒤로가기 → 에러 페이지로 강제 이동 (회원가입 중단 방지)
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => router.replace("/auth/error");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  // ── 닉네임 실시간 검증 + 중복 확인 ─────────────────
  const checkNickname = useCallback(async (value: string) => {
    const result = validateNickname(value);
    if (!result.isValid) {
      setNicknameStatus("error");
      setNicknameMessage(result.message);
      return;
    }

    setNicknameStatus("checking");
    setNicknameMessage("중복 확인 중");

    const supabase = createClient();
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("nickname", value);

    if ((count ?? 0) > 0) {
      setNicknameStatus("taken");
      setNicknameMessage("이미 사용 중인 닉네임이에요");
    } else {
      setNicknameStatus("ok");
      setNicknameMessage("사용 가능한 닉네임이에요");
    }
  }, []);

  const handleNicknameChange = useCallback(
    (value: string) => {
      if (value.length > 12) return;
      setNickname(value);

      if (!value) {
        setNicknameStatus(null);
        setNicknameMessage("");
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => checkNickname(value), 500);
    },
    [checkNickname]
  );

  // ── 저장 ────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (nicknameStatus !== "ok" || isSaving) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인 정보를 확인할 수 없습니다");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        nickname,
        birth_date: birthDate || null,
        gender: gender ?? "unknown",
        intro: intro || null,
        marketing_agree: marketingAgree,
      });

      if (error) throw error;

      showToast("환영합니다 🎉");
      setTimeout(() => router.push("/home"), 800);
    } catch {
      showToast("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [nickname, nicknameStatus, birthDate, gender, intro, marketingAgree, isSaving, router, showToast]);

  // ── 나중에 입력 ──────────────────────────────────────
  const handleSkip = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error();

      // 소셜 계정 display_name을 닉네임 기본값으로 사용 (영숫자+한글만, 최대 12자)
      const rawName = (user.user_metadata?.full_name as string | undefined) ?? "";
      const cleanName = rawName.replace(/[^가-힣a-zA-Z0-9]/g, "").slice(0, 12);
      const defaultNickname = cleanName.length >= 2 ? cleanName : `유저${user.id.slice(-4)}`;
      await supabase.from("profiles").upsert({ id: user.id, nickname: defaultNickname, gender: "unknown", marketing_agree: marketingAgree });

      showToast("환영합니다 🎉");
      setTimeout(() => router.push("/home"), 800);
    } catch {
      showToast("오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [marketingAgree, isSaving, router, showToast]);

  // 닉네임 상태별 스타일
  const inputBorderColor =
    nicknameStatus === "ok"
      ? "#16A34A"
      : nicknameStatus === "error" || nicknameStatus === "taken"
        ? "#D32F2F"
        : "#E5E7EB";

  const msgColor =
    nicknameStatus === "ok" ? "#16A34A"
    : nicknameStatus === "checking" ? "#6B7280"
    : "#D32F2F";

  const canSubmit = nicknameStatus === "ok" && !isSaving;

  return (
    <div className="page-container">
      <Toast message={toast.message} visible={toast.visible} />

      <div className="hide-scrollbar flex-1 overflow-y-auto px-6 pt-6">
        {/* 타이틀 */}
        <div
          className="mb-7"
          style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.4s ease-out" }}
        >
          <h2 className="mb-1.5 text-[22px] font-extrabold tracking-tight text-text-primary">
            프로필을 설정해 주세요
          </h2>
          <p className="text-[14px] leading-relaxed tracking-tight text-text-secondary">
            나중에 프로필 탭에서 수정할 수 있어요.
          </p>
        </div>

        {/* ── 닉네임 ── */}
        <div
          className="mb-6"
          style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.4s ease-out 0.05s" }}
        >
          <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
            닉네임
          </label>
          <div className="relative">
            <input
              type="text"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="2~12자, 특수문자는 _만 가능"
              className="w-full rounded-xl px-4 py-3.5 pr-11 text-[15px] tracking-tight text-text-primary outline-none transition-colors duration-200"
              style={{ border: `1.5px solid ${inputBorderColor}`, background: "#fff" }}
              onFocus={(e) => { if (!nicknameStatus) e.currentTarget.style.borderColor = "#D32F2F"; }}
              onBlur={(e) => { if (!nicknameStatus) e.currentTarget.style.borderColor = "#E5E7EB"; }}
              autoComplete="off"
              maxLength={12}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {nicknameStatus === "checking" && <Spinner size={16} />}
              {nicknameStatus === "ok" && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="9" fill="#16A34A" />
                  <path d="M5 9.5L7.5 12L13 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {(nicknameStatus === "error" || nicknameStatus === "taken") && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="9" fill="#D32F2F" />
                  <path d="M6 6L12 12M12 6L6 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between px-1">
            <span className="text-[12px] tracking-tight" style={{ color: nicknameMessage ? msgColor : "transparent" }}>
              {nicknameMessage || "ㅤ"}
            </span>
            <span className="text-[12px] text-text-secondary">{nickname.length}/12</span>
          </div>
        </div>

        {/* ── 생년월일 ── */}
        <div
          className="mb-6"
          style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.4s ease-out 0.1s" }}
        >
          <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
            생년월일{" "}
            <span className="text-[12px] font-normal text-text-secondary">선택</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl border-[1.5px] border-border px-4 py-3.5 text-[15px] tracking-tight outline-none transition-colors duration-200 focus:border-primary"
            style={{ color: birthDate ? "#111827" : "#6B7280", background: "#fff" }}
          />
        </div>

        {/* ── 성별 ── */}
        <div
          className="mb-6"
          style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.4s ease-out 0.15s" }}
        >
          <label className="mb-2.5 block text-[14px] font-semibold tracking-tight text-text-primary">
            성별{" "}
            <span className="text-[12px] font-normal text-text-secondary">선택</span>
          </label>
          <div className="flex flex-col gap-2">
            <RadioOption selected={gender === "male"} label="남성" onClick={() => setGender("male")} />
            <RadioOption selected={gender === "female"} label="여성" onClick={() => setGender("female")} />
            <RadioOption selected={gender === "unknown"} label="답변하지 않음" onClick={() => setGender("unknown")} />
          </div>
        </div>

        {/* ── 한줄소개 ── */}
        <div
          className="mb-8"
          style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.4s ease-out 0.2s" }}
        >
          <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
            한줄소개{" "}
            <span className="text-[12px] font-normal text-text-secondary">선택</span>
          </label>
          <textarea
            value={intro}
            onChange={(e) => { if (e.target.value.length <= 100) setIntro(e.target.value); }}
            placeholder="자신을 소개해 보세요"
            rows={3}
            className="w-full resize-none rounded-xl border-[1.5px] border-border px-4 py-3.5 text-[15px] leading-relaxed tracking-tight text-text-primary outline-none transition-colors duration-200 focus:border-primary"
            style={{ background: "#fff", minHeight: 80 }}
          />
          <div className="mt-1.5 flex justify-end px-1">
            <span className="text-[12px]" style={{ color: intro.length >= 100 ? "#D32F2F" : "#6B7280" }}>
              {intro.length}/100
            </span>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div
        className="border-t border-border bg-white px-6 pb-9 pt-3"
        style={{ opacity: animateIn ? 1 : 0, transition: "all 0.4s ease-out 0.25s" }}
      >
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[16px] font-bold tracking-tight transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed"
          style={{
            background: canSubmit ? "#D32F2F" : "#E5E7EB",
            color: canSubmit ? "#fff" : "#6B7280",
          }}
        >
          {isSaving ? <Spinner color="#fff" size={20} /> : "시작하기"}
        </button>
        <button
          onClick={handleSkip}
          disabled={isSaving}
          className="w-full rounded-xl py-3.5 text-[14px] font-medium tracking-tight text-text-secondary transition-colors disabled:opacity-50"
        >
          나중에 입력할게요
        </button>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}

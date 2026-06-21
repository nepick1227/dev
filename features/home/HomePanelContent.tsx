"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import Timeline from "@/features/mypick/Timeline";
import MonthlyMenuEvent from "@/features/monthly-menu/MonthlyMenuEvent";
import ProfileView from "@/features/profile/ProfileView";
import ProfileEditForm from "@/features/profile/ProfileEditForm";
import PermissionsView from "@/features/profile/PermissionsView";
import WithdrawalView from "@/features/profile/WithdrawalView";
import RecordForm from "@/features/record/RecordForm";
import RecordEditForm from "@/features/record/RecordEditForm";
import MyPickMapToggle from "./MyPickMapToggle";
import { createClient } from "@/lib/supabase/client";
import type { Profile, RecordWithStore } from "@/types/database";

type PanelView = "ranking" | "mypick" | "profile";

interface HomePanelContentProps {
  view: PanelView;
  isMyPickMapMode?: boolean;
  onMyPickMapToggle?: () => void;
  isMyPickLoading?: boolean;
}

interface RecordStats {
  total: number;
  recommend: number;
  neutral: number;
  notRecommend: number;
}

export type { PanelView };

export default function HomePanelContent({
  view,
  isMyPickMapMode = false,
  onMyPickMapToggle,
  isMyPickLoading = false,
}: HomePanelContentProps) {
  const [subview, setSubview] = useState<string>("main");
  const [reloadKey, setReloadKey] = useState(0);

  const handleBack = () => setSubview("main");
  const handleSaved = () => {
    window.dispatchEvent(new CustomEvent("nepick:mypick-updated"));
    setReloadKey((key) => key + 1);
    setSubview("main");
  };

  if (view === "mypick") {
    if (subview === "record-new") return <RecordCreatePanel onBack={handleBack} onSaved={handleSaved} />;
    if (subview.startsWith("record-edit:")) {
      return (
        <RecordEditPanel
          recordId={Number(subview.replace("record-edit:", ""))}
          onBack={handleBack}
          onSaved={handleSaved}
        />
      );
    }
    return (
      <MypickPanel
        key={reloadKey}
        onCreateRecord={() => setSubview("record-new")}
        onEditRecord={(recordId) => setSubview(`record-edit:${recordId}`)}
        isMyPickMapMode={isMyPickMapMode}
        onMyPickMapToggle={onMyPickMapToggle}
        isMyPickLoading={isMyPickLoading}
      />
    );
  }

  if (view === "profile") {
    if (subview === "profile-edit") return <ProfileEditPanel onBack={handleBack} onSaved={handleSaved} />;
    if (subview === "/profile/permissions") {
      return (
        <PanelShell title="권한 및 알림 설정" onBack={handleBack}>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
            <PermissionsView />
          </div>
        </PanelShell>
      );
    }
    if (subview === "/profile/withdrawal") {
      return (
        <PanelShell title="회원탈퇴" onBack={handleBack}>
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
            <WithdrawalView onCancel={handleBack} />
          </div>
        </PanelShell>
      );
    }
    if (subview !== "main") return <UnsupportedPanel title="프로필 메뉴" onBack={handleBack} />;
    return <ProfilePanel key={reloadKey} onNavigate={(href) => setSubview(href === "/profile/edit" ? "profile-edit" : href)} />;
  }

  return null;
}

function MypickPanel({
  onCreateRecord,
  onEditRecord,
  isMyPickMapMode,
  onMyPickMapToggle,
  isMyPickLoading,
}: {
  onCreateRecord: () => void;
  onEditRecord: (recordId: number) => void;
  isMyPickMapMode: boolean;
  onMyPickMapToggle?: () => void;
  isMyPickLoading: boolean;
}) {
  const [records, setRecords] = useState<RecordWithStore[] | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setRecords([]);
        return;
      }

      const { data } = await supabase
        .from("records")
        .select("*, stores(*)")
        .eq("user_id", user.id)
        .order("visited_at", { ascending: false });

      if (active) setRecords((data as RecordWithStore[]) ?? []);
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  if (!records) {
    return <PanelLoading />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-end justify-between gap-3 border-b border-border px-5 pb-4 pt-6">
        <div>
          <p className="text-[11px] font-medium tracking-tight text-text-secondary">내 기록</p>
          <h2 className="mt-0.5 text-[20px] font-extrabold tracking-tight text-text-primary">내 픽</h2>
        </div>
        <MyPickMapToggle
          checked={isMyPickMapMode}
          onChange={() => onMyPickMapToggle?.()}
          disabled={isMyPickLoading}
        />
      </div>
      <MonthlyMenuEvent showLauncher />
      <Timeline initialRecords={records} onCreateRecord={onCreateRecord} onEditRecord={onEditRecord} />
    </div>
  );
}

function ProfilePanel({ onNavigate }: { onNavigate: (href: string) => void }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<RecordStats>({ total: 0, recommend: 0, neutral: 0, notRecommend: 0 });
  const [providers, setProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const [profileRes, recordsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("records").select("recommendation").eq("user_id", user.id),
      ]);

      if (!active) return;

      const identityProviders = (user.identities ?? []).map((id) => id.provider);
      const metaProvider = user.user_metadata?.provider as string | undefined;
      setProviders(metaProvider && !identityProviders.includes(metaProvider)
        ? [...identityProviders, metaProvider]
        : identityProviders);

      const records = (recordsRes.data ?? []) as { recommendation: string }[];
      setStats({
        total: records.length,
        recommend: records.filter((r) => r.recommendation === "recommend").length,
        neutral: records.filter((r) => r.recommendation === "neutral").length,
        notRecommend: records.filter((r) => r.recommendation === "not_recommend").length,
      });
      setProfile(profileRes.data as Profile | null);
      setIsLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [router]);

  if (isLoading) {
    return <PanelLoading />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-5 pb-4 pt-6">
        <p className="text-[11px] font-medium tracking-tight text-text-secondary">내 정보</p>
        <h2 className="mt-0.5 text-[20px] font-extrabold tracking-tight text-text-primary">프로필</h2>
      </div>
      {profile ? (
        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
          <ProfileView profile={profile} stats={stats} providers={providers} onNavigate={onNavigate} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-text-secondary">
          <p className="text-[14px]">프로필을 불러올 수 없습니다.</p>
        </div>
      )}
    </div>
  );
}

function RecordCreatePanel({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  return (
    <PanelShell title="기록 추가" onBack={onBack}>
      <RecordForm onSaved={onSaved} />
    </PanelShell>
  );
}

function RecordEditPanel({
  recordId,
  onBack,
  onSaved,
}: {
  recordId: number;
  onBack: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [record, setRecord] = useState<RecordWithStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!recordId || Number.isNaN(recordId)) {
        onBack();
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data } = await supabase
        .from("records")
        .select("*, stores(*)")
        .eq("id", recordId)
        .eq("user_id", user.id)
        .single();

      if (!active) return;
      setRecord((data as RecordWithStore) ?? null);
      setIsLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [onBack, recordId, router]);

  return (
    <PanelShell title="기록 수정" onBack={onBack}>
      {isLoading ? <PanelLoading /> : record ? <RecordEditForm record={record} onSaved={onSaved} /> : null}
    </PanelShell>
  );
}

function ProfileEditPanel({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!active) return;
      setProfile(data as Profile | null);
      setIsLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <PanelShell title="프로필 편집" onBack={onBack}>
      {isLoading ? <PanelLoading /> : profile ? <ProfileEditForm profile={profile} onSaved={onSaved} /> : null}
    </PanelShell>
  );
}

function UnsupportedPanel({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <PanelShell title={title} onBack={onBack}>
      <div className="flex flex-1 items-center justify-center px-5 text-center text-text-secondary">
        <p className="text-[14px] leading-relaxed">이 메뉴는 아직 패널 안에서 준비 중입니다.</p>
      </div>
    </PanelShell>
  );
}

function PanelShell({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <button
          onClick={onBack}
          className="rounded-full border border-border px-3 py-1.5 text-[13px] font-semibold text-text-secondary"
        >
          뒤로
        </button>
        <h2 className="text-[17px] font-extrabold tracking-tight text-text-primary">{title}</h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}

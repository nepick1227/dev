"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { MapPinIcon, CameraIcon } from "@/components/ui/icons";

type PermStatus = "granted" | "denied" | "prompt";

interface PermState {
  location: PermStatus;
  camera: PermStatus;
  notification: PermStatus;
}

// ── 현재 권한 상태 조회 ────────────────────────────────────

async function fetchPermissions(): Promise<PermState> {
  let location: PermStatus = "prompt";
  let camera: PermStatus = "prompt";
  let notification: PermStatus = "prompt";

  try {
    const r = await navigator.permissions.query({ name: "geolocation" });
    location = r.state as PermStatus;
  } catch {}

  try {
    const r = await navigator.permissions.query({ name: "camera" as PermissionName });
    camera = r.state as PermStatus;
  } catch {}

  try {
    if (typeof Notification !== "undefined") {
      notification = Notification.permission === "default" ? "prompt" : (Notification.permission as PermStatus);
    }
  } catch {}

  return { location, camera, notification };
}

// ── 권한 항목 정의 ─────────────────────────────────────────

const ITEMS = [
  {
    key: "location" as const,
    label: "위치",
    description: "내 주변 맛집 탐색과 랭킹 확인에 필요해요.",
    icon: <MapPinIcon size={20} color="#D32F2F" />,
    iconClass: "bg-bg-soft",
  },
  {
    key: "camera" as const,
    label: "카메라",
    description: "방문 기록에 사진을 남길 때 필요해요.",
    icon: <CameraIcon size={20} color="var(--color-text-body)" />,
    iconClass: "bg-bg-soft",
  },
  // 알림 권한 항목은 출시 정책 확정 전까지 비노출 (QA 07 2-1)
  // {
  //   key: "notification" as const,
  //   label: "알림",
  //   description: "방문 기록 알림과 새로운 소식을 받아볼 수 있어요.",
  //   icon: <BellIcon size={20} color="#D97706" />,
  //   iconBg: "#FEF3C7",
  // },
] as const;

// ── 메인 컴포넌트 ──────────────────────────────────────────

export default function PermissionsView() {
  const { toast, showToast } = useToast();
  const [permissions, setPermissions] = useState<PermState>({
    location: "prompt",
    camera: "prompt",
    notification: "prompt",
  });

  useEffect(() => {
    fetchPermissions().then(setPermissions);
  }, []);

  const handleRequest = useCallback(async () => {
    const { location, camera } = permissions;
    const hasPrompt = location === "prompt" || camera === "prompt";

    if (!hasPrompt) {
      showToast("권한 변경은 기기 설정에서 직접 변경할 수 있어요.");
      return;
    }

    // 미설정 항목에 대해 브라우저 권한 요청 팝업 순서대로 띄움
    if (location === "prompt") {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(() => resolve(), () => resolve());
      });
    }

    if (camera === "prompt") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {}
    }

    // 알림 권한 요청은 항목 비노출에 맞춰 보류 (QA 07 2-1)

    // 권한 응답 후 상태 다시 조회
    const updated = await fetchPermissions();
    setPermissions(updated);
  }, [permissions, showToast]);

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      <div className="app-content-narrow flex flex-1 flex-col px-5 pt-6 md:mt-0 md:!max-w-[512px] md:flex-none md:bg-transparent md:px-0 md:pb-0 md:pt-0">
        {/* 권한 목록 */}
        <div className="overflow-hidden md:rounded-[20px] md:border md:border-divider md:bg-surface md:p-2">
          <p className="mb-6 text-[14px] leading-relaxed text-text-description md:mb-0 md:px-4 md:pb-2 md:pt-3">
            더 편한 네픽 사용을 위해 아래 권한을 허용해 주세요.
          </p>
          {ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-[13px] border-b border-divider px-1.5 py-4 last:border-b-0 md:gap-[14px] md:px-4 md:py-[18px]"
            >
              {/* 아이콘 */}
              <div className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] md:h-11 md:w-11 ${item.iconClass}`}>
                {item.icon}
              </div>

              {/* 텍스트 */}
              <div className="flex-1">
                <p className="text-[15px] font-bold text-text-primary">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[12px] text-text-description">
                  {item.description}
                </p>
              </div>

              {/* 상태 배지 */}
              <StatusBadge status={permissions[item.key]} />
            </div>
          ))}
        </div>

        {/* 설정 버튼 */}
        <div className="safe-area-pb-lg -mx-5 mt-auto border-t border-divider px-5 pt-3 md:mx-0 md:mt-5 md:border-0 md:px-0 md:pb-0 md:pt-0">
          <Button fullWidth onClick={handleRequest} className="shadow-none">
            설정하러 가기
          </Button>
        </div>
      </div>
    </>
  );
}

// ── 상태 배지 ──────────────────────────────────────────────

function StatusBadge({ status }: { status: PermStatus }) {
  if (status === "granted") {
    return (
      <span className="shrink-0 rounded-lg bg-[#EAF7EE] px-[11px] py-[5px] text-[12px] font-bold text-[#1E9E4C]">
        허용
      </span>
    );
  }
  if (status === "denied") {
    return (
      <span className="shrink-0 rounded-lg bg-primary-soft px-[11px] py-[5px] text-[12px] font-bold text-primary">
        거부
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-lg bg-bg px-[11px] py-[5px] text-[12px] font-bold text-text-tertiary">
      미설정
    </span>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { MapPinIcon, CameraIcon, BellIcon } from "@/components/ui/icons";

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
    iconBg: "#FEE2E2",
  },
  {
    key: "camera" as const,
    label: "카메라",
    description: "방문 기록에 사진을 남길 때 필요해요.",
    icon: <CameraIcon size={20} color="#2563EB" />,
    iconBg: "#DBEAFE",
  },
  {
    key: "notification" as const,
    label: "알림",
    description: "방문 기록 알림과 새로운 소식을 받아볼 수 있어요.",
    icon: <BellIcon size={20} color="#D97706" />,
    iconBg: "#FEF3C7",
  },
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
    const { location, camera, notification } = permissions;
    const hasPrompt = location === "prompt" || camera === "prompt" || notification === "prompt";

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

    if (notification === "prompt") {
      try {
        await Notification.requestPermission();
      } catch {}
    }

    // 권한 응답 후 상태 다시 조회
    const updated = await fetchPermissions();
    setPermissions(updated);
  }, [permissions, showToast]);

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      <div className="flex flex-1 flex-col px-5 pt-6">
        <p className="mb-6 text-[14px] leading-relaxed tracking-tight text-text-secondary">
          더 편한 네픽 사용을 위해 아래 권한을 허용해 주세요.
        </p>

        {/* 권한 목록 */}
        <div className="flex flex-col gap-3">
          {ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-4 rounded-2xl border border-border bg-white px-4 py-4"
            >
              {/* 아이콘 */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: item.iconBg }}
              >
                {item.icon}
              </div>

              {/* 텍스트 */}
              <div className="flex-1">
                <p className="text-[15px] font-semibold tracking-tight text-text-primary">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[12px] tracking-tight text-text-secondary">
                  {item.description}
                </p>
              </div>

              {/* 상태 배지 */}
              <StatusBadge status={permissions[item.key]} />
            </div>
          ))}
        </div>

        {/* 설정 버튼 */}
        <div className="mt-8">
          <Button fullWidth onClick={handleRequest}>
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
      <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-[12px] font-semibold text-green-700">
        허용
      </span>
    );
  }
  if (status === "denied") {
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-[12px] font-semibold text-primary">
        거부
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-bg px-3 py-1 text-[12px] font-semibold text-text-secondary">
      미설정
    </span>
  );
}

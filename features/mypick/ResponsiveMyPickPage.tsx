"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import Spinner from "@/components/ui/Spinner";
import AuthGate from "@/features/auth/AuthGate";
import MapView from "@/features/home/MapView";
import Timeline from "./Timeline";
import type { RecordWithStore } from "@/types/database";

interface ResponsiveMyPickPageProps {
  isAuthenticated: boolean;
  initialRecords: RecordWithStore[];
}

type LayoutMode = "pending" | "mobile" | "web";

export default function ResponsiveMyPickPage({
  isAuthenticated,
  initialRecords,
}: ResponsiveMyPickPageProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("pending");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const updateLayout = () => setLayoutMode(media.matches ? "web" : "mobile");

    updateLayout();
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  if (layoutMode === "pending") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (layoutMode === "web") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <MapView initialPanel="mypick" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isAuthenticated && <Header title="내 픽" size="large" />}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isAuthenticated ? (
          <Timeline initialRecords={initialRecords} />
        ) : (
          <AuthGate nextPath="/mypick" />
        )}
      </div>
      <BottomNav />
    </div>
  );
}

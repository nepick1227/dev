"use client";

import { useCallback } from "react";
import type { Store } from "@/types/database";

interface Coordinates {
  lat: number;
  lng: number;
}

interface StoreCardProps {
  store: Store;
  rank?: number;
  onClick?: (storeId: number) => void;
  userPosition?: Coordinates | null;
}

function getDistanceMeters(from: Coordinates, to: Coordinates): number {
  const radius = 6371000;
  const toRadians = (degree: number) => degree * Math.PI / 180;
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const latitude1 = toRadians(from.lat);
  const latitude2 = toRadians(to.lat);
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)}m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)}km`;
}

export default function StoreCard({ store, rank, onClick, userPosition }: StoreCardProps) {
  const handleClick = useCallback(() => {
    onClick?.(store.id);
  }, [store.id, onClick]);

  return (
    <div
      className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-bg-soft active:bg-bg"
      onClick={handleClick}
      data-gtm-event="ranking_store_click"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {/* 순위 */}
      {rank !== undefined && (
        <span className={[
          "w-6 shrink-0 text-center text-[17px] font-[800]",
          rank <= 3 ? "text-primary" : "text-text-tertiary",
        ].join(" ")}>
          {rank}
        </span>
      )}

      {/* 가게 정보 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[15.5px] font-bold text-text-primary">
            {store.name}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-text-tertiary">
            <span>{store.category === "cafe" ? "카페" : "음식점"}</span>
          {userPosition && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatDistance(getDistanceMeters(userPosition, { lat: store.lat, lng: store.lng }))}</span>
            </>
          )}
          </span>
        </div>
        <span className="truncate text-[12.5px] font-semibold text-text-tertiary">
          {store.road_address ?? store.address}
        </span>
      </div>

      <span className="mt-0.5 shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-extrabold text-primary">
        {new Intl.NumberFormat("ko-KR").format(store.pick_count)}픽
      </span>
    </div>
  );
}

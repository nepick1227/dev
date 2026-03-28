"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PlusIcon, BookmarkIcon, UserIcon } from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/home",
    label: "홈",
    icon: (active) => (
      <HomeIcon
        size={24}
        color={active ? "#D32F2F" : "#9CA3AF"}
      />
    ),
  },
  {
    href: "/record",
    label: "기록",
    icon: (active) => (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200"
        style={{ background: active ? "#B71C1C" : "#D32F2F" }}
      >
        <PlusIcon size={24} color="#fff" />
      </div>
    ),
  },
  {
    href: "/mypick",
    label: "마이픽",
    icon: (active) => (
      <BookmarkIcon
        size={24}
        color={active ? "#D32F2F" : "#9CA3AF"}
      />
    ),
  },
  {
    href: "/profile",
    label: "프로필",
    icon: (active) => (
      <UserIcon
        size={24}
        color={active ? "#D32F2F" : "#9CA3AF"}
      />
    ),
  },
];

/**
 * 하단 탭 네비게이션 컴포넌트
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-area-pb sticky bottom-0 z-20 border-t border-border bg-white">
      <ul className="flex h-16 items-center">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isRecord = item.href === "/record";

          return (
            <li key={item.href} className="flex flex-1 justify-center">
              <Link
                href={item.href}
                className={[
                  "flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                  isRecord ? "relative -top-3" : "h-full w-full",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon(isActive)}
                {!isRecord && (
                  <span
                    className="text-[10px] font-semibold tracking-tight transition-colors"
                    style={{ color: isActive ? "#D32F2F" : "#9CA3AF" }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, BookmarkIcon, UserIcon } from "@/components/ui/icons";

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
      <HomeIcon size={22} color={active ? "var(--color-primary)" : "var(--color-text-muted)"} />
    ),
  },
  {
    href: "/mypick",
    label: "내 픽",
    icon: (active) => (
      <BookmarkIcon size={22} color={active ? "var(--color-primary)" : "var(--color-text-muted)"} />
    ),
  },
  {
    href: "/profile",
    label: "프로필",
    icon: (active) => (
      <UserIcon size={22} color={active ? "var(--color-primary)" : "var(--color-text-muted)"} />
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-divider bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex h-[76px] items-center">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex flex-1 justify-center">
              <Link
                href={item.href}
                className="flex h-full w-full flex-col items-center justify-center gap-1 transition-all duration-200"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon(isActive)}
                <span
                  className={[
                    "text-[11px] font-bold transition-colors",
                    isActive ? "text-primary" : "text-text-muted",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

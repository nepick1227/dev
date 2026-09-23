import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
  label: string;
}

export default function Chip({ active = false, icon, label, className = "", ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={[
        "inline-flex h-9 items-center gap-2 rounded-full border-[1.5px] px-[15px] text-[14px] transition-all duration-200 active:scale-[0.97]",
        active
          ? "border-primary bg-primary font-bold text-white"
          : "border-border bg-surface font-semibold text-text-body",
        className,
      ].join(" ")}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

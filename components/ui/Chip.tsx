import { type ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
}

export default function Chip({ active = false, label, className = "", ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={[
        "inline-flex h-11 items-center rounded-full px-5 text-[14px] font-semibold tracking-tight transition-all duration-200 active:scale-[0.97]",
        active
          ? "bg-primary text-white shadow-sm"
          : "border border-border bg-surface text-text-secondary shadow-sm",
        className,
      ].join(" ")}
      {...props}
    >
      {label}
    </button>
  );
}

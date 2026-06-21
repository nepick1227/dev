"use client";

interface MyPickMapToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export default function MyPickMapToggle({
  checked,
  onChange,
  disabled = false,
}: MyPickMapToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="text-[12px] font-bold tracking-tight text-text-secondary">
        내 픽만 보기
      </span>
      <span
        className={[
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-primary bg-primary"
            : "border-border bg-disabled-bg",
        ].join(" ")}
      >
        <span
          className={[
            "absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

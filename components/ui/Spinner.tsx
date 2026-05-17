interface SpinnerProps {
  color?: string;
  size?: number;
  className?: string;
}

export default function Spinner({ color = "var(--color-primary)", size = 20, className }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ animation: "nepick-spin 0.8s linear infinite" }}
      aria-label="로딩 중"
      role="status"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeDasharray="30 70"
        strokeLinecap="round"
      />
    </svg>
  );
}

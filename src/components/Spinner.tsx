import { C } from "@/styles/theme";

type Props = {
  color?: string;
  size?: number;
};

export default function Spinner({ color = C.primary, size = 20 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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

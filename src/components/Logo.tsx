import { C } from "@/styles/theme";

type Props = {
  size?: number;
  id?: string;
};

export default function Logo({ size = 48, id = "bl" }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D32F2F" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#D32F2F" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M40 74C40 74 64 50 64 30C64 16.75 53.25 6 40 6C26.75 6 16 16.75 16 30C16 50 40 74 40 74Z"
        fill={C.primary}
      />
      <path
        d="M25 38h30v3c0 7-5.5 11-15 11S25 48 25 41v-3z"
        fill={`url(#${id})`}
        stroke="#DF6767"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <text
        x="40"
        y="31"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="white"
      >
        N
      </text>
    </svg>
  );
}

import { C } from "@/styles/theme";

type Props = {
  category: string;
  size?: number;
  color?: string;
};

export function CategoryIcon({ category, size = 36, color = C.primary }: Props) {
  const isRestaurant = category === "식당";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: C.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {isRestaurant ? (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 32 32" fill="none">
          <path d="M3 17h20v2c0 5-4 9-10 9S3 24 3 19v-2z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 17c0-4 3-9 7-12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="3" x2="23" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="25" y1="3" x2="28" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 32 32" fill="none">
          <path d="M6 6h18l-2 20H8z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 3h22v4H4z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="10" y1="15" x2="20" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M13 0v2.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 0v2.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

export function CategoryIconInline({
  category,
  size = 16,
  color = "currentColor",
}: Props) {
  const isRestaurant = category === "식당";
  return isRestaurant ? (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display: "block" }}>
      <path d="M3 17h20v2c0 5-4 9-10 9S3 24 3 19v-2z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17c0-4 3-9 7-12" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="3" x2="23" y2="17" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="25" y1="3" x2="28" y2="17" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display: "block" }}>
      <path d="M6 6h18l-2 20H8z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 3h22v4H4z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="15" x2="20" y2="15" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M13 0v2.5" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M18 0v2.5" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

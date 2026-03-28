export const C = {
  primary: "#D32F2F",
  primaryLight: "rgba(211,47,47,0.08)",
  primaryBorder: "rgba(211,47,47,0.25)",
  recommend: "#DF6767",
  neutral: "#EA9C9C",
  notRecommend: "#FFD6D6",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  background: "#F9FAFB",
  white: "#FFFFFF",
  error: "#D32F2F",
  success: "#16A34A",
  overlay: "rgba(0,0,0,0.5)",
  toggleOn: "rgba(211,47,47,0.35)",
} as const;

export const BASE: React.CSSProperties = {
  maxWidth: 430,
  margin: "0 auto",
  height: "100vh",
  background: C.white,
  fontFamily: "'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

export const REC = {
  recommend: { emoji: "😊", label: "추천", color: C.primary, bg: "rgba(211,47,47,0.08)" },
  neutral: { emoji: "😐", label: "그냥그래", color: "#B45309", bg: "rgba(180,83,9,0.08)" },
  notRecommend: { emoji: "😞", label: "비추천", color: C.textSecondary, bg: C.background },
} as const;

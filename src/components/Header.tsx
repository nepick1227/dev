import { C } from "@/styles/theme";

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export default function Header({ title, onBack, right }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        borderBottom: `1px solid ${C.border}`,
        background: C.white,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px 4px 0",
            display: "flex",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke={C.textPrimary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <h1
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: C.textPrimary,
          margin: 0,
          flex: 1,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </h1>
      {right}
    </div>
  );
}

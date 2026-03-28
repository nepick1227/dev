import { C } from "@/styles/theme";

type Props = {
  selected: boolean;
  label: string;
  onClick: () => void;
};

export default function RadioOption({ selected, label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 16px",
        borderRadius: 12,
        cursor: "pointer",
        background: selected ? C.primaryLight : C.background,
        border: `1.5px solid ${selected ? C.primaryBorder : C.border}`,
        transition: "all 0.2s ease",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: `2px solid ${selected ? C.primary : C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected && (
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: C.primary,
              opacity: 0.5,
            }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: selected ? 600 : 400,
          color: C.textPrimary,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </span>
    </button>
  );
}

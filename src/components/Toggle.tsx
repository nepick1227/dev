import { C } from "@/styles/theme";

type Props = {
  on: boolean;
  onChange: (value: boolean) => void;
};

export default function Toggle({ on, onChange }: Props) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        background: on ? C.toggleOn : "#D1D5DB",
        position: "relative",
        padding: 0,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: on ? C.primary : C.white,
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          transition: "all 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

import { C } from "@/styles/theme";
import ModalOverlay from "./ModalOverlay";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: Props) {
  return (
    <ModalOverlay onClose={onCancel}>
      <p
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: C.textPrimary,
          margin: "0 0 8px",
          textAlign: "center",
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: 13,
          color: C.textSecondary,
          margin: "0 0 24px",
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        {message}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "13px 0",
            borderRadius: 10,
            border: `1.5px solid ${C.border}`,
            background: C.white,
            fontSize: 14,
            fontWeight: 600,
            color: C.textSecondary,
            cursor: "pointer",
          }}
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: "13px 0",
            borderRadius: 10,
            border: "none",
            background: danger ? C.error : C.primary,
            color: C.white,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalOverlay>
  );
}

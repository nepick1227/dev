import { C } from "@/styles/theme";

type Props = {
  children: React.ReactNode;
  onClose: () => void;
};

export default function ModalOverlay({ children, onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: C.overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 16,
          padding: "28px 24px",
          width: 320,
          animation: "modalPop 0.2s ease-out",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <style>{`@keyframes modalPop { from { transform: scale(0.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
        {children}
      </div>
    </div>
  );
}

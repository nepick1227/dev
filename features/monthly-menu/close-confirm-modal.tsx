import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface CloseConfirmModalProps {
  isOpen: boolean;
  onKeepViewing: () => void;
  onClose: () => void;
}

/** 만든 메뉴판은 저장하지 않으므로, 닫기 전에 다시 볼 수 없다는 점을 확인한다 */
export default function CloseConfirmModal({ isOpen, onKeepViewing, onClose }: CloseConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onKeepViewing}
      variant="dialog"
      title="메뉴판을 닫으시겠어요?"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="md" fullWidth onClick={onKeepViewing}>
            계속 보기
          </Button>
          <Button size="md" fullWidth onClick={onClose}>
            닫기
          </Button>
        </div>
      }
    >
      <p className="text-[14px] text-text-secondary">닫으면 다시 볼 수 없어요.</p>
    </Modal>
  );
}

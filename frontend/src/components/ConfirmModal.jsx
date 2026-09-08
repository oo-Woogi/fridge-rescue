import Button from "./Button";
import "./ConfirmModal.css";

// 기능명세서_최종본.md 1.6.6절: 되돌릴 수 없는 액션에 사용하는 바텀시트형 확인 모달
export default function ConfirmModal({
  open,
  title,
  description,
  cancelLabel = "취소",
  confirmLabel = "확인",
  danger = true,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="confirm-modal__overlay" onClick={onCancel}>
      <div className="confirm-modal__sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-modal__title">{title}</h2>
        {description && <p className="confirm-modal__desc">{description}</p>}
        <div className="confirm-modal__actions">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

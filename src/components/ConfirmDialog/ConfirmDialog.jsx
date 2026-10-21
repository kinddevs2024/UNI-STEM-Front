import { t, useLocale } from "../../i18n/runtime";import "./ConfirmDialog.css";

const ConfirmDialog = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}) => {useLocale();
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-backdrop" onClick={onCancel}>
      <div className="confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog-title">{t(title)}</h3>
        <p className="confirm-dialog-text">{t(message)}</p>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-button ghost"
            onClick={onCancel}>

            {t(cancelLabel)}
          </button>
          <button
            type="button"
            className="confirm-dialog-button primary"
            onClick={onConfirm}>

            {t(confirmLabel)}
          </button>
        </div>
      </div>
    </div>);

};

export default ConfirmDialog;

import { useEffect, useState } from 'react';

function ActionDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  isBusy = false,
  requiredText = '',
  inputLabel = 'Confirmation text',
  inputPlaceholder = '',
  inputHelp = '',
  onClose,
  onConfirm
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setValue('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const needsTypedConfirmation = Boolean(requiredText);
  const isConfirmDisabled =
    isBusy || (needsTypedConfirmation && value !== requiredText);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isConfirmDisabled) {
      return;
    }

    await onConfirm();
  };

  return (
    <div className="dialog-overlay" role="presentation" onClick={isBusy ? undefined : onClose}>
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-copy">
            <p className="eyebrow">Confirmation</p>
            <h2 id="dialog-title">{title}</h2>
            <p>{description}</p>
          </div>

          {needsTypedConfirmation ? (
            <label className="dialog-field">
              <span>{inputLabel}</span>
              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={inputPlaceholder || requiredText}
                autoFocus
              />
              {inputHelp ? <small>{inputHelp}</small> : null}
            </label>
          ) : null}

          <div className="dialog-actions">
            <button
              type="button"
              className="ghost-button ghost-button--panel"
              onClick={onClose}
              disabled={isBusy}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={`ghost-button ghost-button--action ${
                tone === 'danger' ? 'ghost-button--danger-solid' : 'ghost-button--panel'
              }`}
              disabled={isConfirmDisabled}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActionDialog;

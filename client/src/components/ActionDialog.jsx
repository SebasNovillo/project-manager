import { useEffect, useState } from 'react';
import { buttonClassName, inputClassName, labelClassName } from '../lib/ui';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onClick={isBusy ? undefined : onClose}
    >
      <div
        className={`w-full max-w-xl rounded-[30px] border bg-white p-6 shadow-soft-panel sm:p-7 ${
          tone === 'danger'
            ? 'border-red-200'
            : tone === 'warning'
              ? 'border-amber-200'
              : 'border-stroke-1'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Confirmation
            </p>
            <h2 id="dialog-title" className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              {title}
            </h2>
            <p className="text-sm leading-6 text-slate-500">{description}</p>
          </div>

          {needsTypedConfirmation ? (
            <label className={labelClassName}>
              <span>{inputLabel}</span>
              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={inputPlaceholder || requiredText}
                autoFocus
                className={inputClassName.replace('mt-2 ', '')}
              />
              {inputHelp ? <small className="text-xs font-medium text-slate-400">{inputHelp}</small> : null}
            </label>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={buttonClassName('secondary')}
              onClick={onClose}
              disabled={isBusy}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={
                tone === 'danger'
                  ? buttonClassName('danger')
                  : tone === 'warning'
                    ? buttonClassName('warning')
                    : buttonClassName()
              }
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

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
  const toneClassName =
    tone === 'danger'
      ? 'dialog-card--danger'
      : tone === 'warning'
        ? 'dialog-card--warning'
        : 'dialog-card--default';

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
          toneClassName === 'dialog-card--danger'
            ? 'border-red-200'
            : toneClassName === 'dialog-card--warning'
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
            <label className="grid gap-1.5 text-sm font-medium text-slate-600">
              <span>{inputLabel}</span>
              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={inputPlaceholder || requiredText}
                autoFocus
                className="w-full rounded-2xl border border-stroke-1 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
              />
              {inputHelp ? <small className="text-xs font-medium text-slate-400">{inputHelp}</small> : null}
            </label>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-stroke-1 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onClose}
              disabled={isBusy}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                tone === 'danger'
                  ? 'bg-red-500 hover:bg-red-600'
                  : tone === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-[linear-gradient(135deg,#4f46e5_0%,#3525cd_100%)] hover:brightness-105'
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

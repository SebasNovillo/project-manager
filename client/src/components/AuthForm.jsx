import { buttonClassName, inputClassName, labelClassName, panelClassName } from '../lib/ui';

function AuthForm({
  title,
  subtitle,
  submitLabel,
  footer,
  values,
  error,
  isSubmitting,
  onChange,
  onSubmit
}) {
  return (
    <section className={`${panelClassName} bg-white/96 p-6 sm:p-7`}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">{title}</h2>
        <p className="text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        {values.name !== undefined ? (
          <label className={labelClassName}>
            <span>Full name</span>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={values.name}
              onChange={onChange}
              className={inputClassName}
            />
          </label>
        ) : null}

        <label className={labelClassName}>
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="name@workspace.com"
            value={values.email}
            onChange={onChange}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          <span>Password</span>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={values.password}
            onChange={onChange}
            className={inputClassName}
          />
        </label>

        {values.confirmPassword !== undefined ? (
          <label className={labelClassName}>
            <span>Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChange={onChange}
              className={inputClassName}
            />
          </label>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className={`${buttonClassName()} min-h-12 py-3`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Please wait...' : submitLabel}
        </button>
      </form>

      <p className="mt-5 text-sm leading-6 text-slate-500">{footer}</p>
    </section>
  );
}

export default AuthForm;

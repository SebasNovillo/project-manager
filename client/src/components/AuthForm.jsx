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
  const inputClassName =
    'mt-2 w-full rounded-2xl border border-stroke-1 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100';

  return (
    <section className="rounded-[28px] border border-stroke-1 bg-white/96 p-6 shadow-soft-card sm:p-7">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink-950">{title}</h2>
        <p className="text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        {values.name !== undefined ? (
          <label className="grid gap-1.5 text-sm font-medium text-slate-600">
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

        <label className="grid gap-1.5 text-sm font-medium text-slate-600">
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

        <label className="grid gap-1.5 text-sm font-medium text-slate-600">
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
          <label className="grid gap-1.5 text-sm font-medium text-slate-600">
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
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#3525cd_100%)] px-4 py-3 text-sm font-semibold text-white shadow-soft-card transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
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

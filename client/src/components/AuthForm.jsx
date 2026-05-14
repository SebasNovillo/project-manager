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
    <section className="card auth-card">
      <div className="section-copy">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <form className="form-grid" onSubmit={onSubmit}>
        {values.name !== undefined ? (
          <label>
            <span>Full name</span>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={values.name}
              onChange={onChange}
            />
          </label>
        ) : null}

        <label>
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="name@workspace.com"
            value={values.email}
            onChange={onChange}
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={values.password}
            onChange={onChange}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait...' : submitLabel}
        </button>
      </form>

      <p className="form-footer">{footer}</p>
    </section>
  );
}

export default AuthForm;

export default function FormField({ label, htmlFor, required = false, hint, error, children, className = '' }) {
  return (
    <div className={`form-field ${className}`}>
      {label ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="required"> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}

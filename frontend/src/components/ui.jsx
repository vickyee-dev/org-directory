import { Link } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { initials } from "../lib/format";

/* ---------- Buttons ---------- */

const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "text-slate-600 hover:bg-slate-100",
};
const sizes = { md: "px-3.5 py-2 text-sm", sm: "px-2.5 py-1.5 text-xs" };

export const buttonClass = (variant = "primary", size = "md") =>
  `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]}`;

export function Button({ variant, size, loading, className = "", children, disabled, ...props }) {
  return (
    <button
      className={`${buttonClass(variant, size)} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Small icon-only button used in table rows. */
export function IconButton({ label, tone = "default", to, className = "", children, ...props }) {
  const cls = `inline-flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
    tone === "danger"
      ? "text-slate-500 hover:bg-red-50 hover:text-red-600"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
  } ${className}`;
  return to ? (
    <Link to={to} className={cls} title={label} aria-label={label} {...props}>
      {children}
    </Link>
  ) : (
    <button type="button" className={cls} title={label} aria-label={label} {...props}>
      {children}
    </button>
  );
}

/* ---------- Layout bits ---------- */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      <span className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function Avatar({ name, size = "md" }) {
  const dims = size === "lg" ? "size-14 text-lg" : "size-9 text-xs";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${dims}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Loader2 className="size-5 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="size-6" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center" role="alert">
      <AlertCircle className="mb-2 size-8 text-red-500" />
      <p className="text-sm font-medium text-slate-900">Something went wrong</p>
      <p className="mt-1 text-sm text-slate-500">{error?.message || "Unexpected error"}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Wraps a table: handles loading / error / empty states. */
export function DataBoundary({ query, isEmpty, empty, children }) {
  if (query.loading && !query.data) return <Spinner />;
  if (query.error && !query.data) return <ErrorState error={query.error} onRetry={query.reload} />;
  if (isEmpty) return empty;
  return (
    <div className={query.loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {children}
    </div>
  );
}

/* ---------- Pagination ---------- */

export function Pagination({ meta, onPage }) {
  if (!meta || meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>
        Showing <b className="font-medium text-slate-900">{from}–{to}</b> of{" "}
        <b className="font-medium text-slate-900">{meta.total}</b>
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <span className="px-1">
          Page {meta.page} of {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------- Form fields ---------- */

export const inputClass = (error) =>
  `block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
    error ? "border-red-400" : "border-slate-300"
  }`;

export function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextField({ label, name, error, hint, required, ...props }) {
  return (
    <Field label={label} htmlFor={name} error={error} hint={hint} required={required}>
      <input id={name} name={name} required={required} className={inputClass(error)} {...props} />
    </Field>
  );
}

export function TextAreaField({ label, name, error, hint, rows = 3, ...props }) {
  return (
    <Field label={label} htmlFor={name} error={error} hint={hint}>
      <textarea id={name} name={name} rows={rows} className={inputClass(error)} {...props} />
    </Field>
  );
}

export function SelectField({ label, name, error, hint, required, children, ...props }) {
  return (
    <Field label={label} htmlFor={name} error={error} hint={hint} required={required}>
      <select id={name} name={name} required={required} className={inputClass(error)} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function CheckboxField({ label, hint, name, ...props }) {
  return (
    <label htmlFor={name} className="flex cursor-pointer items-start gap-3">
      <input
        id={name}
        name={name}
        type="checkbox"
        className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

/** Compact filter bar select. */
export function FilterSelect({ label, children, ...props }) {
  return (
    <select aria-label={label} className={`${inputClass(false)} !w-auto`} {...props}>
      {children}
    </select>
  );
}

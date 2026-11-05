import React from "react";

const CookieToggle = ({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm text-text-primary mb-1 block">
          {label}
        </label>
        <p className="text-xs text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
      <div className="shrink-0 flex items-center h-6 mt-1 sm:mt-0">
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`
 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2
 ${disabled ? "opacity-50 cursor-not-allowed" : ""}
 ${checked ? "bg-brand-600" : "bg-slate-300"}
`}
        >
          <span className="sr-only">Toggle {label}</span>
          <span
            aria-hidden="true"
            className={`
 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
 ${checked ? "translate-x-5" : "translate-x-0"}
`}
          />
        </button>
      </div>
    </div>
  );
};

export default CookieToggle;

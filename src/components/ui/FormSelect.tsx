"use client";

import { type SelectHTMLAttributes, type ReactNode, forwardRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: ReactNode;
  optional?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, icon, optional, options, placeholder, className, ...props }, ref) => {
    const hasIcon = !!icon;

    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
          {label}
          {optional && (
            <span className="text-slate-600 normal-case ml-1">(optional)</span>
          )}
        </label>
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            className={[
              "w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none transition-colors",
              hasIcon ? "pl-12" : "pl-4",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  },
);

FormSelect.displayName = "FormSelect";
export default FormSelect;

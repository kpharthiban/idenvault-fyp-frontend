"use client";

import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  optional?: boolean;
  hint?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, optional, hint, className, readOnly, ...props }, ref) => {
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
          <input
            ref={ref}
            readOnly={readOnly}
            className={[
              "w-full border rounded-xl py-3 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors",
              hasIcon ? "pl-12" : "pl-4",
              readOnly
                ? "bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-slate-950 border-slate-700",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        </div>
        {hint && <p className="text-xs text-slate-600 mt-1.5 ml-1">{hint}</p>}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";
export default FormInput;

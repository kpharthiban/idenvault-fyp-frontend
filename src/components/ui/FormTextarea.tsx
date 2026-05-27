"use client";

import { type TextareaHTMLAttributes, type ReactNode, forwardRef } from "react";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: ReactNode;
  optional?: boolean;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, icon, optional, className, ...props }, ref) => {
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
            <span className="absolute left-4 top-3.5 text-slate-500 w-5 h-5">
              {icon}
            </span>
          )}
          <textarea
            ref={ref}
            className={[
              "w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-colors",
              hasIcon ? "pl-12" : "pl-4",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        </div>
      </div>
    );
  },
);

FormTextarea.displayName = "FormTextarea";
export default FormTextarea;

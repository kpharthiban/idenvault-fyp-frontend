"use client";

import { ShieldCheck, Ban, Loader2, ShieldAlert } from "lucide-react";
import clsx from "clsx";
import type { TrustState } from "@/hooks/useIssuerTrust";

interface TrustBadgeProps {
  status: TrustState;
  /** "sm" for tight spots (sidebar), "md" for standalone pills (profile page). */
  size?: "sm" | "md";
  className?: string;
}

const CONFIG: Record<
  TrustState,
  { label: string; classes: string; icon: typeof ShieldCheck; spin?: boolean }
> = {
  loading: {
    label: "Checking…",
    classes: "bg-slate-50 text-slate-500 border-slate-200",
    icon: Loader2,
    spin: true,
  },
  trusted: {
    label: "Trusted Issuer",
    classes: "bg-green-50 text-green-700 border-green-200",
    icon: ShieldCheck,
  },
  revoked: {
    label: "Not Trusted",
    classes: "bg-red-50 text-red-700 border-red-200",
    icon: Ban,
  },
  error: {
    label: "Status Unavailable",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
    icon: ShieldAlert,
  },
};

/**
 * On-chain issuer trust indicator. Presentational only — pass the status from
 * useIssuerTrust (authoritative IssuerRegistry.isIssuerTrusted read).
 */
export default function TrustBadge({ status, size = "md", className }: TrustBadgeProps) {
  const { label, classes, icon: Icon, spin } = CONFIG[status];
  const iconSize = size === "sm" ? 10 : 12;

  return (
    <span
      data-testid="issuer-trust-badge"
      data-trust-status={status}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        classes,
        className,
      )}
    >
      <Icon size={iconSize} strokeWidth={2.5} className={clsx("shrink-0", spin && "animate-spin")} />
      {label}
    </span>
  );
}

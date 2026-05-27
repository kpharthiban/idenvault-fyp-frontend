"use client";

import { CheckCircle, Ban, Clock } from "lucide-react";

type BadgeStatus = "active" | "revoked" | "expired";

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: "sm" | "md";
}

const config: Record<BadgeStatus, { label: string; icon: typeof CheckCircle; colors: string }> = {
  active: {
    label: "Active",
    icon: CheckCircle,
    colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  revoked: {
    label: "Revoked",
    icon: Ban,
    colors: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  expired: {
    label: "Expired",
    icon: Clock,
    colors: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { label, icon: Icon, colors } = config[status];
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider ${colors} ${
        isSmall ? "px-2.5 py-1 text-xs" : "px-4 py-1.5 text-sm"
      }`}
    >
      <Icon size={isSmall ? 11 : 14} />
      {label}
    </span>
  );
}

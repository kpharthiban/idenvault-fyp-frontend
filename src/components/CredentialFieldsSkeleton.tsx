"use client";

import { Database } from "lucide-react";
import { motion } from "framer-motion";

interface CredentialFieldsSkeletonProps {
  /** Number of placeholder field boxes to show. */
  count?: number;
  /** Tailwind classes for the outer card (lets each page match its own theme). */
  className?: string;
}

/**
 * Shimmer placeholder that mirrors the real "Credential Details" IPFS card
 * (header + IPFS Verified badge + field grid). Rendered while the deferred
 * IPFS metadata is hydrating in the background — see useIpfsMetadata.
 */
export default function CredentialFieldsSkeleton({
  count = 4,
  className = "bg-blue-50/50 rounded-xl p-5 border border-blue-200 shadow-sm",
}: CredentialFieldsSkeletonProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Credential Details</h3>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-400 border border-purple-200 text-[11px] font-bold uppercase tracking-wider">
          <Database size={12} strokeWidth={2.5} />
          Loading…
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white/70 rounded-lg p-3 border border-blue-100 animate-pulse">
            <div className="h-2.5 w-20 bg-slate-200 rounded mb-2" />
            <div className="h-3.5 w-32 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

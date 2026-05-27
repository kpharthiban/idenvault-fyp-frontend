"use client";

import { useState, useEffect } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPut } from "@/lib/api";
import {
  GraduationCap,
  Save,
  AlertTriangle,
  Wallet,
  CheckCircle,
  Building2,
  IdCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type HolderProfileData = {
  name: string;
  student_id: string;
  institution: string;
  programme: string;
};

const EMPTY_PROFILE: HolderProfileData = {
  name: "",
  student_id: "",
  institution: "",
  programme: "",
};

export default function HolderProfilePage() {
  const { walletAddress } = useAuth();
  const [formData, setFormData] = useState<HolderProfileData>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    let cancelled = false;
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);
      const res = await apiGet<HolderProfileData>("/api/holder-profile", walletAddress!);
      if (cancelled) return;
      if (res.success && res.data) {
        setFormData({
          name: res.data.name ?? "",
          student_id: res.data.student_id ?? "",
          institution: res.data.institution ?? "",
          programme: res.data.programme ?? "",
        });
      } else {
        setError(res.error || "Failed to load profile.");
      }
      setIsLoading(false);
    }
    fetchProfile();
    return () => { cancelled = true; };
  }, [walletAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!walletAddress) return;
    setIsSaving(true);
    setError(null);

    const res = await apiPut<HolderProfileData>("/api/holder-profile", formData, walletAddress);

    if (res.success) {
      if (res.data) {
        setFormData({
          name: res.data.name ?? "",
          student_id: res.data.student_id ?? "",
          institution: res.data.institution ?? "",
          programme: res.data.programme ?? "",
        });
      }
      window.dispatchEvent(new Event("holderProfileUpdated"));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setError(res.error || "Failed to save profile.");
    }
    setIsSaving(false);
  };

  return (
    <RequireAuth allowedRole="student">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <GraduationCap className="text-blue-500" />
            Holder Profile
          </h2>
          <p className="text-slate-400 mt-2">
            Manage your personal identity details associated with your wallet.
          </p>
        </div>

        {/* Governance Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-yellow-400 font-bold text-sm">Self-Declared Identity</h4>
            <p className="text-yellow-200/80 text-sm mt-1">
              Holder details are self-declared and displayed alongside your credentials.
              This information helps issuers and verifiers identify you but does not replace on-chain verification.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && !isLoading && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 flex items-center gap-1.5 text-xs text-red-300 hover:text-white transition-colors"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6 animate-pulse">
            <div className="space-y-2">
              <div className="h-3 w-48 bg-slate-800 rounded" />
              <div className="h-12 bg-slate-800 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-800 rounded" />
                <div className="h-12 bg-slate-800 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-800 rounded" />
                <div className="h-12 bg-slate-800 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-800 rounded" />
                <div className="h-12 bg-slate-800 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-800 rounded" />
                <div className="h-12 bg-slate-800 rounded-lg" />
              </div>
            </div>
          </div>
        ) : !error ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

            {/* Wallet Section (Read-Only) */}
            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Authorized Wallet Address (Immutable)
              </label>
              <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-slate-800">
                <Wallet size={18} className="text-emerald-500" />
                <code className="text-slate-300 font-mono text-sm break-all">
                  {walletAddress}
                </code>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
                  <CheckCircle size={10} /> Verified
                </span>
              </div>
            </div>

            {/* Editable Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <IdCard size={14} /> Student ID
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    placeholder="e.g. STU2023001"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <Building2 size={14} /> Institution
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="e.g. Multimedia University"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <BookOpen size={14} /> Programme
                  </label>
                  <input
                    type="text"
                    name="programme"
                    value={formData.programme}
                    onChange={handleChange}
                    placeholder="e.g. Bachelor of Computer Science"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <><Loader2 size={18} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={18} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 right-8 bg-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50"
            >
              <CheckCircle size={20} />
              <div>
                <p className="font-bold text-sm">Profile Updated</p>
                <p className="text-xs text-blue-100">Changes saved successfully.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </RequireAuth>
  );
}

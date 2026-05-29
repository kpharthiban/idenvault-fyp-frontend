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
          <h2 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <GraduationCap className="text-blue-600" strokeWidth={2.5} />
            Holder Profile
          </h2>
          <p className="text-slate-600 font-medium mt-2">
            Manage your personal identity details associated with your wallet.
          </p>
        </div>

        {/* Governance Banner */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
          <div>
            <h4 className="text-yellow-800 font-bold text-sm">Self-Declared Identity</h4>
            <p className="text-yellow-700 font-medium text-sm mt-1">
              Holder details are self-declared and displayed alongside your credentials.
              This information helps issuers and verifiers identify you but does not replace on-chain verification.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && !isLoading && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold text-sm shadow-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex-1">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                <RefreshCw size={12} strokeWidth={2.5} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 animate-pulse">
            <div className="space-y-2">
              <div className="h-3 w-48 bg-slate-200 rounded" />
              <div className="h-12 bg-slate-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-12 bg-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-12 bg-slate-200 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-12 bg-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-12 bg-slate-200 rounded-lg" />
              </div>
            </div>
          </div>
        ) : !error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">

            {/* Wallet Section (Read-Only) */}
            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Authorized Wallet Address (Immutable)
              </label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                <Wallet size={18} className="text-green-600" strokeWidth={2.5} />
                <code className="text-slate-700 font-bold font-mono text-sm break-all">
                  {walletAddress}
                </code>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 uppercase font-bold shadow-sm">
                  <CheckCircle size={10} strokeWidth={2.5} /> Verified
                </span>
              </div>
            </div>

            {/* Editable Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-2">
                    <IdCard size={14} strokeWidth={2.5} /> Student ID
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    placeholder="e.g. STU2023001"
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-2">
                    <Building2 size={14} strokeWidth={2.5} /> Institution
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="e.g. Multimedia University"
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-2">
                    <BookOpen size={14} strokeWidth={2.5} /> Programme
                  </label>
                  <input
                    type="text"
                    name="programme"
                    value={formData.programme}
                    onChange={handleChange}
                    placeholder="e.g. Bachelor of Computer Science"
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <><Loader2 size={18} className="animate-spin" strokeWidth={2.5} /> Saving...</>
                ) : (
                  <><Save size={18} strokeWidth={2.5} /> Save Changes</>
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
              className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-3 z-50"
            >
              <CheckCircle size={20} strokeWidth={2.5} />
              <div>
                <p className="font-bold text-sm">Profile Updated</p>
                <p className="text-xs text-blue-100 font-medium">Changes saved successfully.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </RequireAuth>
  );
}

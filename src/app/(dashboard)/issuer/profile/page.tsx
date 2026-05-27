"use client";

import { useState, useEffect } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPut } from "@/lib/api";
import {
  Building2,
  Save,
  AlertTriangle,
  Wallet,
  CheckCircle,
  MapPin,
  Globe,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ProfileData = {
  institution: string;
  type: string;
  department: string;
  website: string;
  address: string;
};

const EMPTY_PROFILE: ProfileData = {
  institution: "",
  type: "",
  department: "",
  website: "",
  address: "",
};

export default function InstitutionProfilePage() {
  const { walletAddress } = useAuth();
  const [formData, setFormData] = useState<ProfileData>(EMPTY_PROFILE);
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
      const res = await apiGet<ProfileData>("/api/profile", walletAddress!);
      if (cancelled) return;
      if (res.success && res.data) {
        setFormData({
          institution: res.data.institution ?? "",
          type: res.data.type ?? "",
          department: res.data.department ?? "",
          website: res.data.website ?? "",
          address: res.data.address ?? "",
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

    const res = await apiPut<ProfileData>("/api/profile", formData, walletAddress);

    if (res.success) {
      if (res.data) {
        setFormData({
          institution: res.data.institution ?? "",
          type: res.data.type ?? "",
          department: res.data.department ?? "",
          website: res.data.website ?? "",
          address: res.data.address ?? "",
        });
      }
      window.dispatchEvent(new Event("issuerProfileUpdated"));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setError(res.error || "Failed to save profile.");
    }
    setIsSaving(false);
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="text-emerald-500" />
            Institution Profile
          </h2>
          <p className="text-slate-400 mt-2">
            Manage your institution&apos;s public identity details and settings.
          </p>
        </div>

        {/* Governance Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-yellow-400 font-bold text-sm">Self-Declared Identity</h4>
            <p className="text-yellow-200/80 text-sm mt-1">
              Institution details are self-declared and subject to administrative trust governance.
              Editing these details does not imply automatic verification by the network.
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
            <div className="space-y-2">
              <div className="h-3 w-40 bg-slate-800 rounded" />
              <div className="h-12 bg-slate-800 rounded-lg" />
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
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Institution Name</label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Institution Type</label>
                  <input
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-2">Department / Faculty</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <Globe size={14} /> Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <MapPin size={14} /> Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70"
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
              className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50"
            >
              <CheckCircle size={20} />
              <div>
                <p className="font-bold text-sm">Profile Updated</p>
                <p className="text-xs text-emerald-100">Changes saved successfully.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </RequireAuth>
  );
}

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
          <h2 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="text-green-600" strokeWidth={2.5} />
            Institution Profile
          </h2>
          <p className="text-slate-600 font-medium mt-2">
            Manage your institution&apos;s public identity details and settings.
          </p>
        </div>

        {/* Governance Banner */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
          <div>
            <h4 className="text-yellow-800 font-bold text-sm">Self-Declared Identity</h4>
            <p className="text-yellow-700 font-medium text-sm mt-1">
              Institution details are self-declared and subject to administrative trust governance.
              Editing these details does not imply automatic verification by the network.
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
            <div className="space-y-2">
              <div className="h-3 w-40 bg-slate-200 rounded" />
              <div className="h-12 bg-slate-200 rounded-lg" />
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Institution Name</label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Institution Type</label>
                  <input
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Department / Faculty</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-2">
                    <Globe size={14} strokeWidth={2.5} /> Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-2">
                    <MapPin size={14} strokeWidth={2.5} /> Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm transition-all disabled:opacity-70"
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
              className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-green-500/20 flex items-center gap-3 z-50"
            >
              <CheckCircle size={20} strokeWidth={2.5} />
              <div>
                <p className="font-bold text-sm">Profile Updated</p>
                <p className="text-xs text-green-100 font-medium">Changes saved successfully.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </RequireAuth>
  );
}

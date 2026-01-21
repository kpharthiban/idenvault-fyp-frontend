"use client";

import { useState, useEffect } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { 
  Building2, 
  Save, 
  AlertTriangle, 
  Wallet, 
  CheckCircle,
  MapPin,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstitutionProfilePage() {
  const { walletAddress } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    institution: "Multimedia University",
    type: "University",
    department: "Faculty of Computing & Informatics",
    website: "https://mmu.edu.my",
    address: "Persiaran Multimedia, 63100 Cyberjaya, Selangor"
  });

  // Load from session storage on mount (Mock Persistence)
  useEffect(() => {
    const stored = sessionStorage.getItem("issuer_profile_mock");
    if (stored) {
      setFormData(JSON.parse(stored));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      // 1. Save to session storage
      sessionStorage.setItem("issuer_profile_mock", JSON.stringify(formData));
      
      // 2. Dispatch event to update Sidebar immediately
      window.dispatchEvent(new Event("issuerProfileUpdated"));

      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
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
                Manage your institution's public identity details and settings.
            </p>
        </div>

        {/* MANDATORY GOVERNANCE BANNER */}
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
                    {isSaving ? "Saving..." : (
                        <>
                            <Save size={18} /> Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>

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
                        <p className="text-xs text-emerald-100">Changes saved to local session.</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </RequireAuth>
  );
}
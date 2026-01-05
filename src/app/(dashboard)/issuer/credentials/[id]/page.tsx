"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Shield, 
  FileText, 
  Ban, 
  CheckCircle, 
  AlertTriangle, 
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data (matching the list page)
const mockCredentials = [
  {
    id: "issued-1",
    studentId: "STU2023001",
    title: "Bachelor of Computer Science",
    status: "Active",
    issuedDate: "12 Aug 2024",
    certificateAvailable: true,
  },
  {
    id: "issued-2",
    studentId: "STU2023002",
    title: "Dean’s List Award",
    status: "Active",
    issuedDate: "05 Feb 2024",
    certificateAvailable: true,
  },
];

export default function IssuerCredentialDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Find credential or default to mock
  const credential = mockCredentials.find((c) => c.id === id) || mockCredentials[0];

  const [isRevoked, setIsRevoked] = useState(credential.status === "Revoked");
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const handleRevoke = () => {
    // Mock API Call
    setTimeout(() => {
      setIsRevoked(true);
      setShowRevokeModal(false);
    }, 1000);
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-2xl mx-auto">
        
        {/* Navigation */}
        <button
          onClick={() => router.push("/issuer")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to List
        </button>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Header Status Bar */}
          <div className={`w-full h-1.5 ${isRevoked ? "bg-red-500" : "bg-emerald-500"}`} />
          
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Issued Credential Details</h1>
                <p className="text-slate-400 text-sm">Reference ID: <span className="font-mono text-slate-300">{id}</span></p>
              </div>
              
              <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isRevoked 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {isRevoked ? <Ban size={12} /> : <CheckCircle size={12} />}
                {isRevoked ? "Revoked" : "Active"}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 border-t border-slate-800 pt-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    <FileText size={14} /> Credential Title
                  </label>
                  <p className="text-slate-200 font-medium text-lg">{credential.title}</p>
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    <User size={14} /> Issued To (Student ID)
                  </label>
                  <p className="text-slate-200 font-mono bg-black/20 inline-block px-2 py-1 rounded border border-slate-800/50">
                    {credential.studentId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    <Calendar size={14} /> Issued On
                  </label>
                  <p className="text-slate-300">{credential.issuedDate}</p>
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    <Shield size={14} /> Certificate File
                  </label>
                  <p className="text-slate-300 flex items-center gap-2">
                    {credential.certificateAvailable ? (
                      <span className="text-emerald-400 text-sm flex items-center gap-1">
                        <CheckCircle size={12} /> Available on IPFS
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm">Not Available</span>
                    )}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Danger Zone */}
          {!isRevoked && (
            <div className="bg-red-950/10 border-t border-red-900/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-red-400 font-bold text-sm">Revoke Credential</h3>
                <p className="text-red-400/60 text-xs mt-1">
                  This action invalidates the credential on the blockchain.
                </p>
              </div>
              <button
                onClick={() => setShowRevokeModal(true)}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Ban size={16} />
                Revoke
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Revocation Confirmation Modal */}
      <AnimatePresence>
        {showRevokeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRevokeModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Revoke Credential?</h3>
                <p className="text-sm text-slate-400">
                  Are you sure you want to revoke <strong>{credential.title}</strong>? This action cannot be undone and will be flagged on the ledger.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-600/20"
                >
                  Yes, Revoke
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </RequireAuth>
  );
}
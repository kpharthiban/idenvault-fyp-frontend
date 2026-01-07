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
  X,
  Award,
  ExternalLink,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data (matching the list page)
const mockCredentials = [
  {
    id: "issued-1",
    studentId: "STU2023001",
    title: "Bachelor of Computer Science",
    templateName: "Bachelor of Computer Science Configuration (v1.0)",
    status: "Active",
    issuedDate: "12 Aug 2024",
    certificateAvailable: true,
  },
  {
    id: "issued-2",
    studentId: "STU2023002",
    title: "Dean’s List Award",
    templateName: "Dean’s List Award Configuration (v1.0)",
    status: "Active",
    issuedDate: "05 Feb 2024",
    certificateAvailable: true,
  },
];

export default function IssuerCredentialDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const credential = mockCredentials.find((c) => c.id === id) || mockCredentials[0];

  const [isRevoked, setIsRevoked] = useState(credential.status === "Revoked");
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const handleRevoke = () => {
    setTimeout(() => {
      setIsRevoked(true);
      setShowRevokeModal(false);
    }, 1000);
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-4xl mx-auto">
        
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
            {/* Top Row: Header + Status */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Issued Credential Details</h1>
                <p className="text-slate-400 text-sm flex items-center gap-2">
                    Reference ID: <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{id}</span>
                </p>
              </div>
              
              <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm ${
                isRevoked 
                  ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10"
              }`}>
                {isRevoked ? <Ban size={14} /> : <CheckCircle size={14} />}
                {isRevoked ? "Revoked" : "Active"}
              </div>
            </div>

            {/* Template Banner */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-900 rounded-lg text-slate-400">
                    <Award size={20} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Issued Using Template</p>
                    <p className="text-base text-slate-200 font-medium">
                        {credential.templateName}
                    </p>
                </div>
            </div>

            {/* NEW LAYOUT: 2-COLUMN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* 1. TOP: Credential Title (Spans 2 columns) */}
                <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        <FileText size={14} /> Credential Title
                    </label>
                    <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex items-center">
                         <h2 className="text-slate-100 font-bold text-xl leading-tight">
                            {credential.title}
                         </h2>
                    </div>
                </div>

                {/* 2. MIDDLE LEFT: Student ID */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                        <User size={14} /> Issued To
                    </label>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Student ID</p>
                            <p className="text-slate-200 font-mono font-medium text-lg">{credential.studentId}</p>
                        </div>
                    </div>
                </div>

                {/* 3. MIDDLE RIGHT: Issued Date */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                        <Calendar size={14} /> Date
                    </label>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Issued On</p>
                            <p className="text-slate-200 font-medium text-lg">{credential.issuedDate}</p>
                        </div>
                    </div>
                </div>

                {/* 4. BOTTOM: Certificate File (Spans 2 columns) */}
                <div className="md:col-span-2 mt-2">
                     <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        <Shield size={14} /> Certificate File
                    </label>
                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                credential.certificateAvailable ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-600"
                            }`}>
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-white font-medium text-lg">
                                    {credential.certificateAvailable ? "Verified Document Available" : "No Document Attached"}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {credential.certificateAvailable 
                                        ? "This credential includes a tamper-proof PDF stored on IPFS." 
                                        : "This is a metadata-only credential."}
                                </p>
                            </div>
                        </div>

                        {credential.certificateAvailable && (
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <ExternalLink size={16} /> View
                                </button>
                                <button className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                                    <Download size={16} /> Download
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
          </div>

          {/* Danger Zone */}
          {!isRevoked && (
            <div className="bg-red-950/10 border-t border-red-900/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-red-400 font-bold text-base">Revoke Credential</h3>
                <p className="text-red-400/70 text-sm mt-1">
                  This action permanently invalidates the credential on the blockchain.
                </p>
              </div>
              <button
                onClick={() => setShowRevokeModal(true)}
                className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Ban size={18} />
                Revoke Credential
              </button>
            </div>
          )}
        </div>
      </div>
      
       {/* Revocation Modal */}
       {showRevokeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Confirm Revocation</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Are you sure you want to revoke <strong>{credential.title}</strong>? This action is irreversible.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setShowRevokeModal(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">Cancel</button>
                        <button onClick={handleRevoke} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Yes, Revoke</button>
                    </div>
                </div>
            </div>
          </div>
        )}
    </RequireAuth>
  );
}
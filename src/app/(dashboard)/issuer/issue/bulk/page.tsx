"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  ChevronRight,
  Award,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Database,
  FileText,
  Asterisk,
  Upload,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { CREDENTIAL_TEMPLATES, CredentialTemplate } from "@/lib/credentialTemplates";
import { fetchTemplates } from "@/lib/api";

// Mock External Data (reused for consistency)
const MOCK_STUDENTS = [
  { id: "EXT-001", name: "Ali Bin Abu", program: "Bachelor of Computer Science" },
  { id: "EXT-002", name: "Sarah Lee", program: "Bachelor of Information Technology" },
  { id: "EXT-003", name: "Muthu Sami", program: "Bachelor of Software Engineering" },
  { id: "EXT-004", name: "Ah Chong", program: "Bachelor of Computer Science" },
];

type Step = "template" | "participants" | "review" | "success";

const TYPE_BADGE: Record<CredentialTemplate["type"], string> = {
  Degree: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  Award: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  Certificate: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  Status: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "text",
  date: "date",
  select: "select",
  file: "file",
  textarea: "textarea",
};

export default function BulkIssuePage() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const [step, setStep] = useState<Step>("template");

  // ── Template list (fetched from API, fallback to local) ──────────
  const [allTemplates, setAllTemplates] = useState<CredentialTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!walletAddress) return;
    setTemplatesLoading(true);
    setUsingFallback(false);
    const res = await fetchTemplates(walletAddress);
    if (res.success && Array.isArray(res.data)) {
      setAllTemplates(res.data);
    } else {
      setAllTemplates(
        CREDENTIAL_TEMPLATES.map((t) => ({ ...t, isSystemDefault: true }))
      );
      setUsingFallback(true);
    }
    setTemplatesLoading(false);
  }, [walletAddress]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // Only templates that support bulk issuance
  const bulkTemplates = allTemplates.filter(
    (t) => t.issuanceMode === "bulk" || t.issuanceMode === "both"
  );

  const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle Selection Logic
  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === MOCK_STUDENTS.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(MOCK_STUDENTS.map(s => s.id));
    }
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
        setIsSubmitting(false);
        setStep("success");
    }, 2000);
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
            <button
                onClick={() => router.push("/issuer/issue")}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Single Issue
            </button>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Users size={20} />
                Bulk Issuance Wizard
            </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 px-4 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10" />
            {["template", "participants", "review", "success"].map((s, idx) => {
                const isActive = step === s;
                const isPast = ["template", "participants", "review", "success"].indexOf(step) > idx;
                
                return (
                    <div key={s} className={`flex flex-col items-center gap-2 bg-slate-950 px-2 ${isActive || isPast ? "text-emerald-400" : "text-slate-600"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            isActive || isPast ? "bg-emerald-500/10 border-emerald-500" : "bg-slate-900 border-slate-700"
                        }`}>
                            {idx + 1}
                        </div>
                        <span className="text-xs uppercase font-medium">{s}</span>
                    </div>
                );
            })}
        </div>

        {/* MAIN CARD CONTENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative min-h-[400px]">
            
            {/* STEP 1: SELECT TEMPLATE */}
            {step === "template" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="text-2xl font-bold text-white mb-6">Select Credential Template</h2>

                    {/* Fallback warning */}
                    {usingFallback && (
                        <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                            <WifiOff size={16} className="text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-200 flex-1">
                                Could not connect to server. Showing local defaults.
                            </p>
                            <button
                                onClick={loadTemplates}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 transition-colors"
                            >
                                <RefreshCw size={10} /> Retry
                            </button>
                        </div>
                    )}

                    {/* Loading state */}
                    {templatesLoading && (
                        <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
                            <Loader2 size={20} className="animate-spin" />
                            <span className="text-sm">Loading templates...</span>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {!templatesLoading && bulkTemplates.map((t) => {
                            const isSelected = selectedTemplate?.id === t.id;
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t)}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                                        isSelected
                                            ? "border-emerald-500 bg-emerald-500/10"
                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${isSelected ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-bold text-lg">{t.title}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${TYPE_BADGE[t.type]}`}>
                                                    {t.type}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mt-0.5">{t.description}</p>
                                        </div>
                                    </div>
                                    {isSelected && <CheckCircle className="text-emerald-500 shrink-0" size={24} />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Template field preview card */}
                    {selectedTemplate && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-5"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <FileText size={16} className="text-slate-400" />
                                <h4 className="text-sm font-semibold text-white">
                                    Template Field Schema
                                </h4>
                                <span className="ml-auto text-xs text-slate-500">
                                    {selectedTemplate.fields.length} field{selectedTemplate.fields.length !== 1 && "s"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">
                                Each recipient record from the external system must supply values for these fields:
                            </p>
                            <div className="space-y-2">
                                {selectedTemplate.fields.map((f) => (
                                    <div
                                        key={f.name}
                                        className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg bg-slate-900/60"
                                    >
                                        <span className="text-white font-medium flex-1 min-w-0 truncate">
                                            {f.label}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 uppercase font-bold shrink-0">
                                            {FIELD_TYPE_LABEL[f.type]}
                                        </span>
                                        {f.required && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-red-400 shrink-0">
                                                <Asterisk size={10} /> required
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {selectedTemplate.requiresCertificate && (
                                <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                                    <Upload size={14} className="shrink-0" />
                                    This template requires a certificate file upload per recipient.
                                </div>
                            )}
                        </motion.div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={() => setStep("participants")}
                            disabled={!selectedTemplate}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2"
                        >
                            Next Step <ChevronRight size={18} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* STEP 2: SELECT PARTICIPANTS */}
            {step === "participants" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Select Recipients</h2>
                        <button onClick={handleSelectAll} className="text-sm text-blue-400 hover:underline">
                            {selectedStudents.length === MOCK_STUDENTS.length ? "Deselect All" : "Select All"}
                        </button>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-2 mb-6">
                        <Database size={16} className="text-blue-400" />
                        <p className="text-xs text-blue-200">
                            <strong>Data Source:</strong> Recipients are retrieved from connected institutional systems (Student Information System).
                        </p>
                    </div>

                    <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900 text-slate-400 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Select</th>
                                    <th className="px-4 py-3">Student ID</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Program</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300 divide-y divide-slate-800">
                                {MOCK_STUDENTS.map(s => (
                                    <tr key={s.id} className={selectedStudents.includes(s.id) ? "bg-emerald-500/5" : ""}>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedStudents.includes(s.id)}
                                                onChange={() => toggleStudent(s.id)}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{s.id}</td>
                                        <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                                        <td className="px-4 py-3 text-slate-400">{s.program}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex justify-between">
                        <button onClick={() => setStep("template")} className="text-slate-400 hover:text-white">Back</button>
                        <button 
                            onClick={() => setStep("review")}
                            disabled={selectedStudents.length === 0}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Review Batch ({selectedStudents.length}) <ChevronRight size={18} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* STEP 3: REVIEW */}
            {step === "review" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="text-2xl font-bold text-white mb-6">Confirm Issuance</h2>
                    
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                        <AlertTriangle className="text-yellow-500 shrink-0" />
                        <p className="text-sm text-yellow-200">
                            Warning: This action will permanently issue <strong>{selectedStudents.length} credential(s)</strong> on the blockchain. This process cannot be undone instantly.
                        </p>
                    </div>

                    <div className="space-y-4 text-slate-300 mb-8">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Credential Template:</span>
                            <span className="text-white font-bold">{selectedTemplate?.title}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Credential Type:</span>
                            {selectedTemplate && (
                                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${TYPE_BADGE[selectedTemplate.type]}`}>
                                    {selectedTemplate.type}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Template Fields:</span>
                            <span className="text-white font-medium">
                                {selectedTemplate?.fields.length} field{selectedTemplate?.fields.length !== 1 && "s"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Certificate Required:</span>
                            <span className={selectedTemplate?.requiresCertificate ? "text-amber-400" : "text-slate-500"}>
                                {selectedTemplate?.requiresCertificate ? "Yes — per recipient" : "No"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Total Recipients:</span>
                            <span className="text-white font-bold">{selectedStudents.length} Students</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Issuer Authority:</span>
                            <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={14} /> Verified</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Certificate Source:</span>
                            <span className="text-slate-400 text-sm flex items-center gap-1">
                                <Database size={14} /> System Generated (Mock)
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button onClick={() => setStep("participants")} className="text-slate-400 hover:text-white">Back</button>
                        <button 
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                            {isSubmitting ? "Minting Batch..." : "Confirm & Issue"}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === "success" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                    <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-4">
                        <CheckCircle size={64} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Batch Issuance Complete!</h2>
                    {/* UPDATED: Detailed Summary */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-w-md mx-auto mb-8 text-sm">
                        <p className="text-slate-400 mb-2">Issuance Summary:</p>
                        <ul className="space-y-1 text-slate-300">
                            <li className="flex justify-between">
                                <span>Template:</span>
                                <span className="text-white font-medium">{selectedTemplate?.title}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Recipients:</span>
                                <span className="text-white font-medium">{selectedStudents.length} Students</span>
                            </li>
                        </ul>
                    </div>

                    <p className="text-slate-400 mb-8 text-sm">
                        Transaction Hash: <span className="font-mono text-emerald-400">0x71...9a2b</span>
                    </p>
                    <button 
                        onClick={() => router.push("/issuer")}
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700"
                    >
                        Return to Dashboard
                    </button>
                </motion.div>
            )}

        </div>
      </div>
    </RequireAuth>
  );
}
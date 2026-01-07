"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  ChevronRight, 
  Award, 
  ShieldCheck, 
  Loader2,
  AlertTriangle,
  Database
} from "lucide-react";
import { motion } from "framer-motion";
import { CREDENTIAL_TEMPLATES } from "@/lib/credentialTemplates";

// Mock External Data (reused for consistency)
const MOCK_STUDENTS = [
  { id: "EXT-001", name: "Ali Bin Abu", program: "Bachelor of Computer Science" },
  { id: "EXT-002", name: "Sarah Lee", program: "Bachelor of Information Technology" },
  { id: "EXT-003", name: "Muthu Sami", program: "Bachelor of Software Engineering" },
  { id: "EXT-004", name: "Ah Chong", program: "Bachelor of Computer Science" },
];

type Step = "template" | "participants" | "review" | "success";

export default function BulkIssuePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("template");
  
  const [selectedTemplate, setSelectedTemplate] = useState(CREDENTIAL_TEMPLATES[0].id);
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

  // Helper to get template details
  const currentTemplate = CREDENTIAL_TEMPLATES.find(t => t.id === selectedTemplate);

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
                    <div className="grid gap-4">
                        {CREDENTIAL_TEMPLATES.map((t) => {
                            
                            // LOGIC: Disable if mode is 'single' only
                            const isDisabled = t.issuanceMode === 'single';

                            return (
                                <div 
                                    key={t.id}
                                    onClick={() => !isDisabled && setSelectedTemplate(t.id)}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                        isDisabled 
                                            ? "opacity-40 border-slate-800 bg-slate-900 cursor-not-allowed grayscale" // Grayed out look
                                            : selectedTemplate === t.id 
                                                ? "border-emerald-500 bg-emerald-500/10 cursor-pointer" 
                                                : "border-slate-700 bg-slate-800/50 hover:border-slate-500 cursor-pointer"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${selectedTemplate === t.id ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-bold text-lg">{t.title}</h3>
                                                {isDisabled && (
                                                    <span className="text-[10px] uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
                                                        Single Issue Only
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-400 text-sm">Type: {t.type}</p>
                                        </div>
                                    </div>
                                    {selectedTemplate === t.id && <CheckCircle className="text-emerald-500" size={24} />}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={() => setStep("participants")}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2"
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
                            <span className="text-white font-bold">{currentTemplate?.title}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Total Recipients:</span>
                            <span className="text-white font-bold">{selectedStudents.length} Students</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>Issuer Authority:</span>
                            <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={14} /> Verified</span>
                        </div>
                        {/* NEW: Certificate Source Row */}
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
                                <span className="text-white font-medium">{currentTemplate?.title}</span>
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
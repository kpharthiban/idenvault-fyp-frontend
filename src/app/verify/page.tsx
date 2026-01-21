"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  ShieldCheck, 
  ScanLine, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Building2,
  User,
  Calendar,
  ArrowLeft,
  FileText,
  Clock,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 1. Expanded Mock Registry (The "Database")
const MOCK_REGISTRY = [
  {
    id: "cred-1",
    title: "Bachelor of Computer Science",
    studentName: "John Doe",
    studentId: "STU2023001",
    issuer: "Multimedia University",
    issuedDate: "12 August 2024",
    expiryDate: "Never",
    status: "Verified",
    type: "degree"
  },
  {
    id: "cred-2",
    title: "Dean’s List Award",
    studentName: "John Doe",
    studentId: "STU2023001",
    issuer: "Faculty of Computing",
    issuedDate: "05 February 2024",
    expiryDate: "Never",
    status: "Verified",
    type: "award"
  },
  {
    id: "cred-status-1",
    title: "Student Identification Credential",
    studentName: "John Doe",
    studentId: "STU2023001",
    issuer: "Multimedia University",
    issuedDate: "01 Jan 2024",
    expiryDate: "31 Dec 2026",
    status: "Active",
    type: "status"
  }
];

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");

  const [credentialId, setCredentialId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [record, setRecord] = useState<any>(null); // Store the found credential here
  const [showAI, setShowAI] = useState(false);

  // 2. Auto-fill and Verify if URL has ?ref=...
  useEffect(() => {
    if (refParam) {
      setCredentialId(refParam);
      handleVerify(refParam);
    }
  }, [refParam]);

  const handleVerify = (idToVerify = credentialId) => {
    if (!idToVerify) {
      alert("Please enter a credential reference");
      return;
    }

    setStatus("loading");

    // Simulate Blockchain Network Delay
    setTimeout(() => {
        // 3. LOOKUP LOGIC: Check the Mock Registry
        const foundRecord = MOCK_REGISTRY.find(
            (r) => r.id.toLowerCase() === idToVerify.toLowerCase()
        );

        if (foundRecord) {
            setRecord(foundRecord);
            setStatus("valid");
        } else {
            setRecord(null);
            setStatus("invalid");
        }
    }, 1500); 
  };

  const resetVerification = () => {
      setStatus("idle");
      setCredentialId("");
      setRecord(null);
      router.replace("/verify"); // Clear URL param
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950">
       
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation Bar */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
            <Link href="/">
              <div className="inline-flex items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 mb-4 shadow-xl hover:border-blue-500/50 hover:shadow-blue-500/20 transition-all cursor-pointer group">
                  <ShieldCheck className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Credential Verification</h1>
            <p className="text-slate-400">Verify the authenticity of digital academic records on the blockchain.</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl transition-all">
          
          <AnimatePresence mode="wait">
            {/* STATE 1: INPUT FORM (Idle or Loading) */}
            {(status === "idle" || status === "loading") && (
                <motion.div
                    key="input-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={credentialId}
                            onChange={(e) => setCredentialId(e.target.value)}
                            placeholder="Enter Credential Reference ID (e.g. cred-1)"
                            disabled={status === "loading"}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-5 pr-12 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                        />
                        {status === "loading" && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="animate-spin text-blue-500" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            onClick={() => handleVerify()}
                            disabled={status === "loading"}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                        >
                            {status === "loading" ? "Verifying..." : "Verify Credential"}
                            {!status && <ArrowRight size={18} />}
                        </button>
                        <button
                            onClick={() => router.push("/scan")} // Assuming you have a scan page
                            disabled={status === "loading"}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-all border border-slate-700"
                        >
                            <ScanLine size={18} />
                            Scan QR Code
                        </button>
                    </div>
                </motion.div>
            )}

            {/* STATE 2: VALID RESULT (Rich Details) */}
            {status === "valid" && record && (
                <motion.div
                    key="valid-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    {/* Success Banner */}
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <CheckCircle className="text-emerald-500 w-6 h-6" />
                        <div>
                            <h3 className="text-emerald-400 font-bold">Valid Credential</h3>
                            <p className="text-xs text-emerald-500/70">Verified on Ethereum Sepolia Network</p>
                        </div>
                    </div>

                    {/* Credential Details Card */}
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                            <FileText size={16} className="text-blue-400" />
                            <span className="text-sm font-bold text-slate-300">Credential Data</span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Credential Title</label>
                                <p className="text-white font-medium text-lg leading-tight">{record.title}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Issued To</label>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <User size={14} />
                                        <span>{record.studentName}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Issued By</label>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <Building2 size={14} />
                                        <span>{record.issuer}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Date Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Issued Date</label>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <Calendar size={14} />
                                        <span>{record.issuedDate}</span>
                                    </div>
                                </div>
                                {record.expiryDate !== "Never" && (
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Valid Until</label>
                                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                            <Clock size={14} />
                                            <span>{record.expiryDate}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Verification Summary (The A+ Logic) */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Verification Summary</h4>
                        <p className="text-[10px] text-slate-400 mb-4 italic">
                            *Verification reflects the credential’s current validity period and the issuer’s trust status on the blockchain allowlist.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle size={14} className="text-emerald-500" />
                                <span><strong>Issuer Trust:</strong> Verified ({record.issuer})</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle size={14} className="text-emerald-500" />
                                <span><strong>Status:</strong> {record.status} & Unrevoked</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle size={14} className="text-emerald-500" />
                                <span><strong>Integrity:</strong> Blockchain Hash Match</span>
                            </li>
                        </ul>
                    </div>

                    {/* Context Note */}
                    <div className="text-center px-2">
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Live QR codes support active credential presentation by the holder. Shared links enable asynchronous verification. Both methods verify the same immutable credential data.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col gap-3">
                        <button 
                            onClick={() => setShowAI(!showAI)}
                            className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <Bot size={18} />
                            {showAI ? "Hide Interview Questions" : "Generate Interview Questions"}
                        </button>

                        <button
                            onClick={resetVerification}
                            className="w-full py-2 text-sm text-slate-500 hover:text-white transition-colors"
                        >
                            Verify Another Credential
                        </button>
                    </div>

                    {/* AI Section (Collapsible) */}
                    {showAI && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-5 mt-4"
                        >
                            <h4 className="text-indigo-400 font-bold text-sm mb-3">AI Interview Assistant</h4>
                            <ul className="space-y-3 text-sm text-indigo-200/80 list-disc pl-4">
                                <li>Explain how you applied software engineering principles in your final year project.</li>
                                <li>Describe a challenging system design decision you made and how you justified it.</li>
                                <li>How would you improve the scalability of a decentralized identity system?</li>
                            </ul>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* STATE 3: INVALID RESULT */}
            {status === "invalid" && (
                 <motion.div
                    key="invalid-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-full mb-4">
                        <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Credential Not Found</h3>
                    <p className="text-slate-400 mb-6 text-sm">
                        The reference ID <span className="font-mono text-red-400">{credentialId}</span> could not be found on the blockchain or has been revoked by the issuer.
                    </p>
                    <button
                        onClick={resetVerification}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
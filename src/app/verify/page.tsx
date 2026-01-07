"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link"; // Import Link
import { 
  Search, 
  ShieldCheck, 
  ScanLine, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Bot, 
  Loader2,
  Building2,
  User,
  Calendar,
  ArrowLeft,
  Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");

  const [credentialId, setCredentialId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [showAI, setShowAI] = useState(false);

  // Auto-fill from URL if present
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

    // SIMULATE BLOCKCHAIN LOOKUP DELAY
    setTimeout(() => {
        if (idToVerify.toLowerCase().includes("invalid")) {
            setStatus("invalid");
        } else {
            setStatus("valid");
        }
    }, 1500); 
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950">
       
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      {/* NEW: Navigation Bar (Top Left) */}
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
        
        {/* Header - Now Clickable */}
        <div className="text-center mb-8">
            <Link href="/">
              <div className="inline-flex items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 mb-4 shadow-xl hover:border-blue-500/50 hover:shadow-blue-500/20 transition-all cursor-pointer group">
                  <ShieldCheck className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Credential Verification</h1>
            <p className="text-slate-400">Verify the authenticity of digital academic records on the blockchain.</p>
        </div>

        {/* Input Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
          
          <AnimatePresence mode="wait">
            {status === "idle" || status === "loading" ? (
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
                            onClick={() => router.push("/scan")}
                            disabled={status === "loading"}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-all border border-slate-700"
                        >
                            <ScanLine size={18} />
                            Scan QR Code
                        </button>
                    </div>
                </motion.div>
            ) : null}

            {/* SUCCESS RESULT */}
            {status === "valid" && (
                <motion.div
                    key="valid-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <CheckCircle className="text-emerald-500 w-6 h-6" />
                        <div>
                            <h3 className="text-emerald-400 font-bold">Valid Credential</h3>
                            <p className="text-xs text-emerald-500/70">Verified on Ethereum Sepolia Network</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Credential Title</p>
                            <h2 className="text-xl font-bold text-white">Bachelor of Computer Science</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                    <Building2 size={12} /> Issuer
                                </div>
                                <p className="text-sm text-slate-200 font-medium">Multimedia University</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                    <User size={12} /> Recipient
                                </div>
                                <p className="text-sm text-slate-200 font-medium">John Doe</p>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                             <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                <Calendar size={12} /> Issue Date
                            </div>
                            <p className="text-sm text-slate-200 font-medium">12 August 2024</p>
                        </div>
                    </div>

                    {/* NEW: Verification Logic Explanation */}
                    <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verification Logic</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            This result is valid because the issuer 
                            <span className="text-slate-300 font-medium"> Multimedia University </span> 
                            is currently active on the Admin Allowlist, and the credential hash matches the immutable record on the Ethereum Sepolia network.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        {!showAI ? (
                            <button
                                onClick={() => setShowAI(true)}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Bot size={18} />
                                Generate Interview Questions (AI)
                            </button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-5"
                            >
                                <div className="flex items-center gap-2 text-indigo-400 font-bold mb-3">
                                    <Bot size={18} />
                                    <span>AI Interview Assistant</span>
                                </div>
                                <ul className="space-y-3 text-sm text-indigo-200/80">
                                    <li className="flex gap-2">
                                        <span className="text-indigo-500">•</span>
                                        Explain how you applied software engineering principles in your final year project.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-indigo-500">•</span>
                                        Describe a challenging system design decision you made and how you justified it.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-indigo-500">•</span>
                                        How would you improve the scalability of a decentralized identity system?
                                    </li>
                                </ul>
                                <button 
                                    onClick={() => setShowAI(false)}
                                    className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline"
                                >
                                    Hide Assistant
                                </button>
                            </motion.div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setStatus("idle");
                            setCredentialId("");
                            setShowAI(false);
                            router.replace("/verify");
                        }}
                        className="w-full py-2 text-sm text-slate-500 hover:text-white transition-colors"
                    >
                        Verify Another Credential
                    </button>
                </motion.div>
            )}

            {/* INVALID RESULT */}
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
                    <p className="text-slate-400 mb-6">
                        The reference ID provided does not exist on the blockchain or has been revoked.
                    </p>
                    <button
                        onClick={() => setStatus("idle")}
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
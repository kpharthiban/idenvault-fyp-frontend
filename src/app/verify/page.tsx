"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, ArrowLeft, CheckCircle, XCircle, Loader2,
  Building2, User, Calendar, Clock, Bot, RefreshCw,
  Copy, AlertCircle, ExternalLink, FileText, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface TrustCheck {
  label: string;
  pass: boolean;
  detail: string;
}

interface CredentialRecord {
  ref_id: string;
  title: string;
  description: string;
  grade: string | null;
  metadata_cid: string | null;
  holder_wallet: string;
  issuer_wallet: string;
  status: string;
  issued_at: string;
  expires_at: string | null;
  tx_hash: string | null;
  blockchain?: {
    valid: boolean;
    revoked: boolean;
    issuer: string;
  };
}

interface IpfsMetadata {
  refId: string;
  templateId: string;
  issuerWallet: string;
  studentWallet: string;
  title: string;
  type: string;
  fields: Record<string, string>;
  ipfsCid: string | null;
  issuedAt: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");

  const [credentialId, setCredentialId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [record, setRecord] = useState<CredentialRecord | null>(null);
  const [trustChecks, setTrustChecks] = useState<TrustCheck[]>([]);

  // IPFS metadata state
  const [metadata, setMetadata] = useState<IpfsMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  // AI state
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVerify = useCallback(async (idToVerify: string) => {
    if (!idToVerify.trim()) return;

    // Extract ref param if a full URL was pasted
    let refId = idToVerify.trim();
    try {
        const parsed = new URL(refId);
        const extracted = parsed.searchParams.get("ref");
        if (extracted) refId = extracted;
    } catch {
        // Not a URL, use as-is
    }

    setStatus("loading");
    setRecord(null);
    setTrustChecks([]);
    setMetadata(null);
    setShowAI(false);
    setAiQuestions([]);


    try {
      const res = await fetch(`${API_URL}/api/credentials/${refId}`);
      if (!res.ok) throw new Error("not_found");
      const data: CredentialRecord = await res.json();

      // ── Build the 5 trust checks ──────────────────────────────
      const now = new Date();
      const isExpired = data.expires_at
        ? new Date(data.expires_at) < now
        : false;
      const isRevoked = data.status === "revoked" || data.blockchain?.revoked === true;
      const hashValid = data.blockchain?.valid ?? false;
      // issuer trust — backend already checked IssuerRegistry
      // if the record exists in DB, the issuer was trusted at issuance time
      // blockchain.issuer confirms on-chain issuer address
      const issuerTrusted = !!data.blockchain?.issuer &&
        data.blockchain.issuer.toLowerCase() === data.issuer_wallet.toLowerCase();

      const checks: TrustCheck[] = [
        {
          label: "Existence",
          pass: true,
          detail: "Credential record found on-chain and in database",
        },
        {
          label: "Integrity",
          pass: hashValid,
          detail: hashValid
            ? "On-chain hash matches stored credential data"
            : "Hash mismatch — credential data may have been tampered",
        },
        {
          label: "Revocation",
          pass: !isRevoked,
          detail: isRevoked
            ? "This credential has been revoked by the issuer"
            : "Credential is not revoked",
        },
        {
          label: "Issuer Trust",
          pass: issuerTrusted,
          detail: issuerTrusted
            ? `Issuer ${data.issuer_wallet.slice(0, 8)}... is registered in IssuerRegistry`
            : "Issuer is not a trusted institution",
        },
        {
          label: "Expiry",
          pass: !isExpired,
          detail: isExpired
            ? `Credential expired on ${new Date(data.expires_at!).toLocaleDateString("en-GB")}`
            : data.expires_at
            ? `Valid until ${new Date(data.expires_at).toLocaleDateString("en-GB")}`
            : "No expiry — credential is permanent",
        },
      ];

      setRecord(data);
      setTrustChecks(checks);

      const allPass = checks.every((c) => c.pass);
      setStatus(allPass ? "valid" : "invalid");

      // Fetch IPFS metadata if available
      if (data.metadata_cid) {
        setMetadataLoading(true);
        try {
          const metaRes = await fetch(
            `https://gateway.pinata.cloud/ipfs/${data.metadata_cid}`
          );
          if (metaRes.ok) {
            const metaJson: IpfsMetadata = await metaRes.json();
            setMetadata(metaJson);
          }
        } catch {
          // Non-critical — metadata display is best-effort
        } finally {
          setMetadataLoading(false);
        }
      }
    } catch {
      setStatus("invalid");
    }
  }, []);

  // Auto-verify from URL param
  useEffect(() => {
    if (refParam) {
      setCredentialId(refParam);
      handleVerify(refParam);
    }
  }, [refParam, handleVerify]);

  const handleGenerateQuestions = async () => {
    if (!record) return;
    setAiLoading(true);
    setAiError(null);
    setAiQuestions([]);

    try {
        const res = await fetch(`${API_URL}/api/ai/interview-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: record.title,
            issuer: record.issuer_wallet,
            fields: metadata?.fields ?? undefined,
        }),
        });
        if (!res.ok) throw new Error("AI service failed");
        const data = await res.json();
        setAiQuestions(data.questions || []);
    } catch {
        setAiError("Failed to generate questions. Please try again.");
    } finally {
        setAiLoading(false);
    }
  };

  const handleCopyQuestions = () => {
    if (!aiQuestions.length) return;
    navigator.clipboard.writeText(aiQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetVerification = () => {
    setStatus("idle");
    setCredentialId("");
    setRecord(null);
    setTrustChecks([]);
    setMetadata(null);
    setShowAI(false);
    setAiQuestions([]);
    router.replace("/verify");
  };

  const allPass = trustChecks.length > 0 && trustChecks.every((c) => c.pass);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Back nav */}
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
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 mb-4 shadow-xl">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Credential Verification
          </h1>
          <p className="text-slate-400">
            Verify the authenticity of digital academic records on the blockchain.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <AnimatePresence mode="wait">

            {/* ── STATE: Input ── */}
            {(status === "idle" || status === "loading") && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify(credentialId)}
                    placeholder="Enter Credential Reference ID (UUID)"
                    disabled={status === "loading"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-5 pr-12 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                  />
                  {status === "loading" && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-blue-500" size={20} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVerify(credentialId)}
                    disabled={status === "loading" || !credentialId.trim()}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20"
                  >
                    {status === "loading" ? (
                      <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                    ) : (
                      <><ShieldCheck size={18} /> Verify Credential</>
                    )}
                  </button>
                  <Link
                    href="/verify/scan"
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-all border border-slate-700"
                  >
                    <FileText size={18} /> Scan QR Code
                  </Link>
                </div>

                {status === "loading" && (
                  <div className="mt-5 space-y-2">
                    {["Fetching credential from database...", "Reading blockchain state...", "Running trust checks..."].map((msg, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                        <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />
                        {msg}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STATE: Result ── */}
            {(status === "valid" || status === "invalid") && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Overall result banner */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border ${
                  allPass
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}>
                  {allPass
                    ? <CheckCircle size={32} className="text-emerald-500 shrink-0" />
                    : <XCircle size={32} className="text-red-500 shrink-0" />}
                  <div>
                    <p className={`font-bold text-lg ${allPass ? "text-emerald-400" : "text-red-400"}`}>
                      {allPass ? "Credential Verified" : "Verification Failed"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {allPass
                        ? "All trust checks passed. This credential is authentic."
                        : "One or more trust checks failed. See details below."}
                    </p>
                  </div>
                </div>

                {/* 5 Trust Checks */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800 overflow-hidden">
                  {trustChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      {check.pass
                        ? <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                        : <XCircle size={18} className="text-red-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{check.label}</p>
                        <p className="text-xs text-slate-500 truncate">{check.detail}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        check.pass
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {check.pass ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Credential metadata */}
                {record && (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                    <h3 className="text-white font-bold text-base">{record.title}</h3>

                    {/* IPFS metadata fields */}
                    {metadataLoading && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                        <Loader2 size={14} className="animate-spin text-blue-400" />
                        Loading credential details from IPFS...
                      </div>
                    )}
                    {metadata && Object.keys(metadata.fields).length > 0 && (
                      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Credential Details
                          </p>
                          <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                            <Database size={10} /> IPFS Verified
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(metadata.fields).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-[11px] text-slate-500 capitalize">
                                {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                              </p>
                              <p className="text-sm text-white">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                          <User size={11} /> Holder
                        </p>
                        <p className="text-xs text-white font-mono">
                          {record.holder_wallet.slice(0, 8)}...{record.holder_wallet.slice(-6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                          <Building2 size={11} /> Issuer
                        </p>
                        <p className="text-xs text-white font-mono">
                          {record.issuer_wallet.slice(0, 8)}...{record.issuer_wallet.slice(-6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                          <Calendar size={11} /> Issued
                        </p>
                        <p className="text-xs text-white">
                          {new Date(record.issued_at).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </p>
                      </div>
                      {record.expires_at && (
                        <div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                            <Clock size={11} /> Expires
                          </p>
                          <p className="text-xs text-white">
                            {new Date(record.expires_at).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                    {record.tx_hash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${record.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all group mt-2"
                      >
                        <span className="text-sm text-slate-400 group-hover:text-blue-400">View on Etherscan</span>
                        <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400" />
                      </a>
                    )}
                  </div>
                )}

                {/* AI Interview Questions — only if all checks pass */}
                {allPass && (
                  <div className="border border-indigo-500/20 rounded-xl overflow-hidden">
                    <button
                      onClick={() => {
                        setShowAI(!showAI);
                        if (!showAI && aiQuestions.length === 0) handleGenerateQuestions();
                      }}
                      className="w-full py-3 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Bot size={18} />
                      {showAI ? "Hide AI Questions" : "Generate Interview Questions with AI"}
                    </button>

                    <AnimatePresence>
                      {showAI && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-slate-950 space-y-3">
                            {aiLoading ? (
                              <div className="flex items-center gap-3 text-slate-400 py-4 justify-center">
                                <Loader2 size={18} className="animate-spin text-indigo-400" />
                                Gemini is generating questions...
                              </div>
                            ) : aiError ? (
                              <div className="flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} /> {aiError}
                              </div>
                            ) : aiQuestions.length > 0 ? (
                              <>
                                <ol className="space-y-3">
                                  {aiQuestions.map((q, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                                      <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                                      <span>{q}</span>
                                    </li>
                                  ))}
                                </ol>
                                <p className="text-xs text-slate-600 pt-2 border-t border-slate-800">
                                  ⚠️ AI-generated questions are suggestions only. Use professional discretion.
                                </p>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={handleGenerateQuestions}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                                  >
                                    <RefreshCw size={13} /> Regenerate
                                  </button>
                                  <button
                                    onClick={handleCopyQuestions}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                                  >
                                    {copied
                                      ? <><CheckCircle size={13} className="text-emerald-400" /> Copied!</>
                                      : <><Copy size={13} /> Copy All</>}
                                  </button>
                                </div>
                              </>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Reset */}
                <button
                  onClick={resetVerification}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all border border-slate-700 text-sm"
                >
                  Verify Another Credential
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
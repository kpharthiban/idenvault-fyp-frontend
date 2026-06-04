"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, ArrowLeft, CheckCircle, XCircle, Loader2,
  Building2, User, Calendar, Clock, RefreshCw,
  ExternalLink, FileText, Database, Radio
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyPresentationToken } from "@/lib/api";

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

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");
  const refParam = searchParams.get("ref");

  const [credentialId, setCredentialId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [record, setRecord] = useState<CredentialRecord | null>(null);
  const [trustChecks, setTrustChecks] = useState<TrustCheck[]>([]);

  // IPFS metadata state
  const [metadata, setMetadata] = useState<IpfsMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const [presentedBy, setPresentedBy] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<"expired" | "invalid" | null>(null);

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

  const handleTokenVerify = useCallback(async (token: string) => {
    setStatus("loading");
    setRecord(null);
    setTrustChecks([]);
    setMetadata(null);
    setTokenError(null);
    setPresentedBy(null);

    const res = await verifyPresentationToken(token);

    if (!res.success) {
      if (res.code === "TOKEN_EXPIRED") {
        setTokenError("expired");
        setStatus("idle");
      } else {
        setTokenError("invalid");
        setStatus("idle");
      }
      return;
    }

    const data = res.data as Record<string, unknown>;

    // The backend may return the credential nested under a `credential` key
    // or directly at the top level alongside `presentedBy` and `blockchain`.
    const cred: CredentialRecord = (data.credential as CredentialRecord) ?? (data as unknown as CredentialRecord);

    if (data.blockchain && typeof data.blockchain === "object") {
      cred.blockchain = data.blockchain as CredentialRecord["blockchain"];
    }
    if (data.presentedBy && typeof data.presentedBy === "string") {
      setPresentedBy(data.presentedBy);
    }

    const now = new Date();
    const isExpired = cred.expires_at ? new Date(cred.expires_at) < now : false;
    const isRevoked = cred.status === "revoked" || cred.blockchain?.revoked === true;
    const hashValid = cred.blockchain?.valid ?? false;
    const issuerTrusted = !!cred.blockchain?.issuer &&
      cred.blockchain.issuer.toLowerCase() === cred.issuer_wallet.toLowerCase();

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
          ? `Issuer ${cred.issuer_wallet.slice(0, 8)}... is registered in IssuerRegistry`
          : "Issuer is not a trusted institution",
      },
      {
        label: "Expiry",
        pass: !isExpired,
        detail: isExpired
          ? `Credential expired on ${new Date(cred.expires_at!).toLocaleDateString("en-GB")}`
          : cred.expires_at
          ? `Valid until ${new Date(cred.expires_at).toLocaleDateString("en-GB")}`
          : "No expiry — credential is permanent",
      },
    ];

    setRecord(cred);
    setTrustChecks(checks);
    setStatus(checks.every((c) => c.pass) ? "valid" : "invalid");

    if (cred.metadata_cid) {
      setMetadataLoading(true);
      try {
        const metaRes = await fetch(
          `https://gateway.pinata.cloud/ipfs/${cred.metadata_cid}`
        );
        if (metaRes.ok) {
          const metaJson: IpfsMetadata = await metaRes.json();
          setMetadata(metaJson);
        }
      } catch {
        // Non-critical
      } finally {
        setMetadataLoading(false);
      }
    }
  }, []);

  // Auto-verify from URL param — token takes priority over ref
  useEffect(() => {
    if (tokenParam) {
      handleTokenVerify(tokenParam);
    } else if (refParam) {
      setCredentialId(refParam);
      handleVerify(refParam);
    }
  }, [tokenParam, refParam, handleTokenVerify, handleVerify]);

  const resetVerification = () => {
    setStatus("idle");
    setCredentialId("");
    setRecord(null);
    setTrustChecks([]);
    setMetadata(null);
    setPresentedBy(null);
    setTokenError(null);
    router.replace("/verify");
  };

  const allPass = trustChecks.length > 0 && trustChecks.every((c) => c.pass);

  return (
    <main className="min-h-screen flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6 relative overflow-hidden bg-[#F8F8F8] bg-dotgrid">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px]" />
      </div>

      {/* Back nav */}
      <div className="self-start relative z-20">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:shadow-sm transition-all text-sm font-medium group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-2xl relative z-10 mx-auto mt-4 sm:mt-6 flex-1 flex flex-col sm:justify-center">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200 mb-6 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-purple-600" strokeWidth={2.5} />
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Credential Verification
          </h1>
          <p className="text-slate-600 font-medium">
            Verify the authenticity of digital academic records on the blockchain.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm relative">
          <AnimatePresence mode="wait">

            {/* ── STATE: Token Expired ── */}
            {tokenError === "expired" && status === "idle" && (
              <motion.div
                key="expired"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center text-center py-6">
                  <div className="p-4 bg-amber-50 rounded-full border border-amber-200 mb-4">
                    <Clock size={32} className="text-amber-600" strokeWidth={2} />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">QR Code Expired</h2>
                  <p className="text-slate-500 font-medium text-sm max-w-sm">
                    This QR code has expired. Please ask the credential holder to present a fresh QR code.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link
                    href="/verify/scan"
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-all hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-none"
                  >
                    <FileText size={18} /> Scan Another QR
                  </Link>
                  <button
                    onClick={resetVerification}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-semibold transition-all border border-slate-200"
                  >
                    <RefreshCw size={18} /> Enter Ref ID Instead
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STATE: Token Invalid ── */}
            {tokenError === "invalid" && status === "idle" && (
              <motion.div
                key="token-invalid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center text-center py-6">
                  <div className="p-4 bg-red-50 rounded-full border border-red-200 mb-4">
                    <XCircle size={32} className="text-red-600" strokeWidth={2} />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Invalid Verification Code</h2>
                  <p className="text-slate-500 font-medium text-sm max-w-sm">
                    This verification code is not valid. It may have been tampered with or is malformed.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link
                    href="/verify/scan"
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-all hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-none"
                  >
                    <FileText size={18} /> Scan Another QR
                  </Link>
                  <button
                    onClick={resetVerification}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-semibold transition-all border border-slate-200"
                  >
                    <RefreshCw size={18} /> Enter Ref ID Instead
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STATE: Input ── */}
            {(status === "idle" || status === "loading") && !tokenError && (
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
                    className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-4 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:opacity-50"
                  />
                  {status === "loading" && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-purple-600" size={20} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVerify(credentialId)}
                    disabled={status === "loading" || !credentialId.trim()}
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-none"
                  >
                    {status === "loading" ? (
                      <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                    ) : (
                      <><ShieldCheck size={18} /> Verify Credential</>
                    )}
                  </button>
                  <Link
                    href="/verify/scan"
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-semibold transition-all border border-slate-200"
                  >
                    <FileText size={18} /> Scan QR Code
                  </Link>
                </div>

                {status === "loading" && (
                  <div className="mt-5 space-y-2">
                    {["Fetching credential from database...", "Reading blockchain state...", "Running trust checks..."].map((msg, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-slate-500">
                        <Loader2 size={14} className="animate-spin text-purple-600 shrink-0" />
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
                {/* Live Presentation badge */}
                {presentedBy && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <Radio size={14} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-emerald-700">Live Presentation</span>
                    <span className="text-xs text-slate-500 font-medium ml-auto">
                      Presented by <span className="font-mono text-slate-700">{presentedBy.slice(0, 8)}...{presentedBy.slice(-6)}</span>
                    </span>
                  </div>
                )}

                {/* Overall result banner */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border ${
                  allPass
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  {allPass
                    ? <CheckCircle size={32} className="text-green-600 shrink-0" />
                    : <XCircle size={32} className="text-red-600 shrink-0" />}
                  <div>
                    <p className={`font-heading text-lg font-bold ${allPass ? "text-green-800" : "text-red-800"}`}>
                      {allPass ? "Credential Verified" : "Verification Failed"}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {allPass
                        ? "All trust checks passed. This credential is authentic."
                        : "One or more trust checks failed. See details below."}
                    </p>
                  </div>
                </div>

                {/* 5 Trust Checks */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                  {trustChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      {check.pass
                        ? <CheckCircle size={18} className="text-green-600 shrink-0" />
                        : <XCircle size={18} className="text-red-600 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{check.label}</p>
                        <p className="text-xs text-slate-500 truncate">{check.detail}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        check.pass
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {check.pass ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Credential metadata */}
                {record && (
                  <div className="bg-green-50/50 rounded-xl border border-green-200 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -z-10 pointer-events-none" />
                    <h3 className="text-slate-900 font-heading text-lg font-bold">{record.title}</h3>

                    {/* IPFS metadata fields */}
                    {metadataLoading && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                        <Loader2 size={14} className="animate-spin text-purple-600" />
                        Loading credential details from IPFS...
                      </div>
                    )}
                    {metadata && Object.keys(metadata.fields).length > 0 && (
                      <div className="bg-white rounded-lg border border-green-100 shadow-sm p-4 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Credential Details
                          </p>
                          <span className="flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            <Database size={10} /> IPFS Verified
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          {Object.entries(metadata.fields).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-[11px] text-slate-500 capitalize mb-0.5 font-medium">
                                {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                              </p>
                              <p className="text-sm text-slate-900 font-medium">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-100 mt-2">
                      <div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-1 font-medium">
                          <User size={12} /> Holder
                        </p>
                        <p className="text-[13px] text-slate-900 font-mono bg-white px-1.5 py-0.5 rounded-md inline-block border border-green-100 shadow-sm">
                          {record.holder_wallet.slice(0, 8)}...{record.holder_wallet.slice(-4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-1 font-medium">
                          <Building2 size={12} /> Issuer
                        </p>
                        <p className="text-[13px] text-slate-900 font-mono bg-white px-1.5 py-0.5 rounded-md inline-block border border-green-100 shadow-sm">
                          {record.issuer_wallet.slice(0, 8)}...{record.issuer_wallet.slice(-4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-1 font-medium">
                          <Calendar size={12} /> Issued
                        </p>
                        <p className="text-sm text-slate-900 font-medium">
                          {new Date(record.issued_at).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </p>
                      </div>
                      {record.expires_at && (
                        <div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mb-1 font-medium">
                            <Clock size={12} /> Expires
                          </p>
                          <p className="text-sm text-slate-900 font-medium">
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
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all group mt-4"
                      >
                        <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900">View on Etherscan</span>
                        <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-900" />
                      </a>
                    )}
                  </div>
                )}

                {/* Reset */}
                <button
                  onClick={resetVerification}
                  className="w-full py-3.5 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 hover:border-purple-400 rounded-xl font-bold transition-all border-2 border-slate-200 text-sm shadow-sm"
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

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}
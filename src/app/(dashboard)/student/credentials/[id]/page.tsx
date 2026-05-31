"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { requestPresentationToken } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, ShieldCheck, Calendar, Fingerprint,
  ExternalLink, Building2, FileCheck, Copy, CheckCircle,
  Clock, Loader2, AlertCircle, Download, Ban, RefreshCw,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface CredentialDetail {
  id: string;
  ref_id: string;
  title: string;
  description: string;
  grade: string | null;
  holder_wallet: string;
  issuer_wallet: string;
  status: string;
  issued_at: string;
  expires_at: string | null;
  ipfs_cid: string | null;
  metadata_cid: string | null;
  tx_hash: string | null;
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

export default function StudentCredentialDetail() {
  const router = useRouter();
  const params = useParams();
  const refId = params.id as string;

  const [credential, setCredential] = useState<CredentialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25);
  const [presentationToken, setPresentationToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const { walletAddress } = useAuth();
  const [metadata, setMetadata] = useState<IpfsMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  useEffect(() => {
    const fetchCredential = async () => {
      try {
        const res = await fetch(`${API_URL}/api/credentials/${refId}`);
        if (!res.ok) throw new Error("Credential not found");
        const data = await res.json();
        setCredential(data);

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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCredential();
  }, [refId]);

  const fetchToken = useCallback(async () => {
    if (!walletAddress || !credential) return;
    setTokenError(null);
    const res = await requestPresentationToken(walletAddress, credential.ref_id);
    if (res.success && res.data) {
      setPresentationToken(res.data.token);
      setSecondsLeft(25);
    } else {
      setPresentationToken(null);
      setTokenError(res.error || "Failed to generate presentation token");
    }
  }, [walletAddress, credential]);

  // Fetch token and refresh every 25s
  useEffect(() => {
    if (!walletAddress || !credential) return;
    fetchToken();
    const refreshInterval = setInterval(fetchToken, 25_000);
    return () => clearInterval(refreshInterval);
  }, [fetchToken, walletAddress, credential]);

  // Countdown timer synced to token expiry
  useEffect(() => {
    if (!presentationToken) return;
    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [presentationToken]);

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify?ref=${refId}`
    : `/verify?ref=${refId}`;

  const qrUrl = presentationToken && typeof window !== "undefined"
    ? `${window.location.origin}/verify?token=${presentationToken}`
    : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <RequireAuth allowedRole="student">
        <div className="flex items-center justify-center py-32 text-slate-600 font-bold gap-3">
          <Loader2 size={20} className="animate-spin" strokeWidth={2.5} /> Loading credential...
        </div>
      </RequireAuth>
    );
  }

  if (error || !credential) {
    return (
      <RequireAuth allowedRole="student">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold shadow-sm">
          <AlertCircle size={18} strokeWidth={2.5} /> {error || "Credential not found"}
        </div>
      </RequireAuth>
    );
  }

  const isRevoked = credential.status === "revoked";
  const ipfsUrl = credential.ipfs_cid
    ? `https://gateway.pinata.cloud/ipfs/${credential.ipfs_cid}`
    : null;

  const formatFieldKey = (key: string): string =>
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <RequireAuth allowedRole="student">
      <div className="max-w-3xl mx-auto pb-12">

        <button
          onClick={() => router.push("/student")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-all duration-200 text-sm font-bold group"
        >
          <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
          Back to Credentials
        </button>

        <div className="flex flex-col gap-5">

          {/* Credential Info */}
          <div className="space-y-5">

            {/* Main card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl"
            >
              <div className={`w-full h-1.5 ${isRevoked ? "bg-red-500" : "bg-green-500"}`} />
              <div className="p-6 relative">
                <div className={`absolute -top-6 -left-6 w-36 h-36 rounded-full blur-[50px] pointer-events-none ${isRevoked ? "bg-red-500/8" : "bg-blue-500/10"}`} />

                {/* Title + status */}
                <div className="relative flex items-start justify-between gap-3 mb-6">
                  <div>
                    <h1 className="text-2xl font-heading font-extrabold text-slate-900">{credential.title}</h1>
                    {credential.grade && (
                      <p className="text-green-700 font-bold mt-1">Grade: {credential.grade}</p>
                    )}
                  </div>
                  <div className={`shrink-0 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                    isRevoked
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {isRevoked ? <Ban size={13} strokeWidth={2.5} /> : <ShieldCheck size={13} strokeWidth={2.5} />}
                    {isRevoked ? "Revoked" : "Active"}
                  </div>
                </div>

                {/* Details grid */}
                <div className="space-y-3 relative">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 size={15} className="text-slate-500 shrink-0" strokeWidth={2.5} />
                    <span className="text-slate-500 font-bold">Issuer:</span>
                    <span className="text-slate-900 font-mono font-medium text-xs">
                      {credential.issuer_wallet.slice(0, 10)}...{credential.issuer_wallet.slice(-6)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={15} className="text-slate-500 shrink-0" strokeWidth={2.5} />
                    <span className="text-slate-500 font-bold">Issued:</span>
                    <span className="text-slate-900 font-medium">
                      {new Date(credential.issued_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </span>
                  </div>
                  {credential.expires_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock size={15} className="text-slate-500 shrink-0" strokeWidth={2.5} />
                      <span className="text-slate-500 font-bold">Expires:</span>
                      <span className="text-slate-900 font-medium">
                        {new Date(credential.expires_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "long", year: "numeric"
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Digital Fingerprint */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Digital Fingerprint</p>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 text-sm">
                      <Fingerprint size={15} className="text-slate-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-slate-500 font-bold shrink-0">Ref ID:</span>
                      <span className="text-green-600 font-mono font-bold text-xs break-all">{credential.ref_id}</span>
                    </div>
                    {credential.tx_hash && (
                      <div className="flex items-start gap-3 text-sm">
                        <ExternalLink size={15} className="text-slate-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span className="text-slate-500 font-bold shrink-0">Tx:</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${credential.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 font-mono font-bold text-xs break-all hover:underline transition-all duration-200"
                        >
                          {credential.tx_hash.slice(0, 18)}...
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {credential.description && (
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{credential.description}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Credential Details from IPFS */}
            {metadataLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl p-5 border border-blue-200/60 flex items-center gap-3 text-blue-700"
              >
                <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                <span className="text-sm font-medium">Loading credential details from IPFS...</span>
              </motion.div>
            )}
            {!metadataLoading && metadata && metadata.fields && Object.keys(metadata.fields).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl p-5 border border-blue-200/60 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Credential Details</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider">
                    <Database size={11} strokeWidth={2.5} />
                    IPFS Verified
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {Object.entries(metadata.fields).map(([key, value]) => (
                    <div key={key} className="bg-white/70 rounded-lg p-3 border border-blue-100/80">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">{formatFieldKey(key)}</p>
                      <p className="text-sm text-slate-900 font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* IPFS Certificate */}
            {ipfsUrl && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600 border border-green-100 transition-all duration-200 hover:bg-green-100">
                      <FileCheck size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-slate-900 text-sm font-bold">Certificate Document</p>
                      <p className="text-xs text-slate-500 font-medium">Stored on IPFS via Pinata</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} strokeWidth={2.5} /> View
                    </a>
                    <a
                      href={ipfsUrl}
                      download
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm text-xs font-bold transition-all duration-200 flex items-center gap-1.5"
                    >
                      <Download size={13} strokeWidth={2.5} /> Download
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Share Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
          >
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] bg-purple-500/5 pointer-events-none" />
                <h3 className="text-slate-900 font-heading font-extrabold text-xl relative">Share Credential</h3>
                <p className="text-slate-500 font-medium text-sm mt-1 relative">Present or share this credential with verifiers to prove its authenticity</p>
              </div>

              {/* Share Content */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8 bg-[#F8F8F8]">
                 {/* QR Code Column */}
                 <div className="flex flex-col items-center justify-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                      {qrUrl && (
                        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold shadow-sm ${
                          secondsLeft < 5
                            ? "bg-red-50 border border-red-200 text-red-600"
                            : "bg-blue-50 border border-blue-200 text-blue-700"
                        }`}>
                          <Clock size={11} strokeWidth={2.5} /> QR refreshes in {secondsLeft}s
                        </div>
                      )}
                      <div className="relative mt-8 flex items-center justify-center" style={{ width: 140, height: 140 }}>
                        {tokenError ? (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <AlertCircle size={28} className="text-red-400" strokeWidth={2} />
                            <p className="text-xs text-red-600 font-bold leading-snug">{tokenError}</p>
                            <button
                              onClick={fetchToken}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all duration-200"
                            >
                              <RefreshCw size={12} strokeWidth={2.5} /> Retry
                            </button>
                          </div>
                        ) : !qrUrl ? (
                          <Loader2 size={28} className="animate-spin text-slate-400" strokeWidth={2} />
                        ) : (
                          <>
                            <motion.div
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute left-0 w-full h-0.5 bg-green-500/50 pointer-events-none z-10"
                            />
                            <QRCodeSVG value={qrUrl} size={140} />
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium text-center mt-6">
                        {tokenError ? "Unable to generate QR" : "Scan to verify instantly"}
                      </p>
                 </div>

                 {/* Link Column */}
                 <div className="flex flex-col justify-center">
                    <p className="text-slate-900 font-bold text-sm mb-2">Verify Link</p>
                    <p className="text-slate-500 font-medium text-xs mb-4">
                      Share this link for online or async verification (LinkedIn, resume, email).
                    </p>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-xl p-2 mb-3">
                      <code className="text-[11px] text-green-700 font-bold flex-1 break-all line-clamp-2 px-2">{verifyUrl}</code>
                      <button
                        onClick={handleCopyLink}
                        className="shrink-0 p-2.5 bg-slate-50 hover:bg-green-50 rounded-lg text-slate-500 hover:text-green-600 border border-slate-200 hover:border-green-200 transition-all duration-200 shadow-sm"
                      >
                        {copied
                          ? <CheckCircle size={16} strokeWidth={2.5} className="text-green-600" />
                          : <Copy size={16} strokeWidth={2.5} />}
                      </button>
                    </div>
                    <p className="text-xs text-green-600 font-bold h-4">
                      {copied ? "✓ Copied to clipboard!" : ""}
                    </p>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </RequireAuth>
  );
}
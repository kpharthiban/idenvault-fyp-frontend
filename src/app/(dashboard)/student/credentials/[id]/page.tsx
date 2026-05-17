"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, ShieldCheck, Calendar, Fingerprint,
  ExternalLink, Building2, FileCheck, Copy, CheckCircle,
  Clock, Loader2, AlertCircle, Download, Ban
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
  tx_hash: string | null;
}

export default function StudentCredentialDetail() {
  const router = useRouter();
  const params = useParams();
  const refId = params.id as string;

  const [credential, setCredential] = useState<CredentialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareTab, setShareTab] = useState<"link" | "qr">("link");
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    const fetchCredential = async () => {
      try {
        const res = await fetch(`${API_URL}/api/credentials/${refId}`);
        if (!res.ok) throw new Error("Credential not found");
        const data = await res.json();
        setCredential(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCredential();
  }, [refId]);

  // QR refresh timer
  useEffect(() => {
    if (shareTab !== "qr") return;
    setSecondsLeft(30);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { setSecondsLeft(30); return 30; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [shareTab]);

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify?ref=${refId}`
    : `/verify?ref=${refId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <RequireAuth allowedRole="student">
        <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
          <Loader2 size={20} className="animate-spin" /> Loading credential...
        </div>
      </RequireAuth>
    );
  }

  if (error || !credential) {
    return (
      <RequireAuth allowedRole="student">
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle size={18} /> {error || "Credential not found"}
        </div>
      </RequireAuth>
    );
  }

  const isRevoked = credential.status === "revoked";
  const ipfsUrl = credential.ipfs_cid
    ? `https://gateway.pinata.cloud/ipfs/${credential.ipfs_cid}`
    : null;

  return (
    <RequireAuth allowedRole="student">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => router.push("/student")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Wallet
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — Credential Info (3 cols) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Main card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className={`w-full h-1.5 ${isRevoked ? "bg-red-500" : "bg-emerald-500"}`} />
              <div className="p-6">

                {/* Title + status */}
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{credential.title}</h1>
                    {credential.grade && (
                      <p className="text-emerald-400 font-semibold mt-1">Grade: {credential.grade}</p>
                    )}
                  </div>
                  <div className={`shrink-0 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isRevoked
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  }`}>
                    {isRevoked ? <Ban size={12} /> : <ShieldCheck size={12} />}
                    {isRevoked ? "Revoked" : "Active"}
                  </div>
                </div>

                {/* Details grid */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 size={15} className="text-slate-500 shrink-0" />
                    <span className="text-slate-400">Issuer:</span>
                    <span className="text-white font-mono text-xs">
                      {credential.issuer_wallet.slice(0, 10)}...{credential.issuer_wallet.slice(-6)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={15} className="text-slate-500 shrink-0" />
                    <span className="text-slate-400">Issued:</span>
                    <span className="text-white">
                      {new Date(credential.issued_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </span>
                  </div>
                  {credential.expires_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock size={15} className="text-slate-500 shrink-0" />
                      <span className="text-slate-400">Expires:</span>
                      <span className="text-white">
                        {new Date(credential.expires_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "long", year: "numeric"
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-3 text-sm">
                    <Fingerprint size={15} className="text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-slate-400 shrink-0">Ref ID:</span>
                    <span className="text-emerald-400 font-mono text-xs break-all">{credential.ref_id}</span>
                  </div>
                  {credential.tx_hash && (
                    <div className="flex items-start gap-3 text-sm">
                      <ExternalLink size={15} className="text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-slate-400 shrink-0">Tx:</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${credential.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 font-mono text-xs break-all hover:underline"
                      >
                        {credential.tx_hash.slice(0, 18)}...
                      </a>
                    </div>
                  )}
                </div>

                {/* Description */}
                {credential.description && (
                  <div className="mt-5 pt-5 border-t border-slate-800">
                    <p className="text-slate-400 text-sm leading-relaxed">{credential.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* IPFS Certificate */}
            {ipfsUrl && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Certificate Document</p>
                      <p className="text-xs text-slate-500">Stored on IPFS via Pinata</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} /> View
                    </a>
                    <a
                      href={ipfsUrl}
                      download
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — Share Panel (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden sticky top-6">
              <div className="p-5 border-b border-slate-800">
                <h3 className="text-white font-bold">Share Credential</h3>
                <p className="text-slate-500 text-xs mt-1">Present or share this credential with verifiers</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                {(["link", "qr"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setShareTab(tab)}
                    className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      shareTab === tab
                        ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab === "link" ? "🔗 Verify Link" : "📱 QR Code"}
                  </button>
                ))}
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  {shareTab === "link" ? (
                    <motion.div
                      key="link"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <p className="text-slate-400 text-xs mb-3">
                        Share this link for online or async verification (LinkedIn, resume, email).
                      </p>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-3 mb-3">
                        <code className="text-xs text-emerald-400 flex-1 break-all">{verifyUrl}</code>
                        <button
                          onClick={handleCopyLink}
                          className="shrink-0 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          {copied
                            ? <CheckCircle size={16} className="text-emerald-500" />
                            : <Copy size={16} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600">
                        {copied ? "✓ Copied to clipboard!" : "Click the copy icon to copy the link"}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col items-center"
                    >
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium mb-4 ${
                        secondsLeft < 10
                          ? "bg-red-500/10 text-red-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        <Clock size={11} /> Refreshes in {secondsLeft}s
                      </div>
                      <div className="bg-white p-4 rounded-xl mb-3 relative overflow-hidden">
                        <motion.div
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 w-full h-0.5 bg-blue-500/50 pointer-events-none"
                        />
                        <QRCodeSVG value={verifyUrl} size={160} />
                      </div>
                      <p className="text-xs text-slate-500 text-center">
                        Scan to verify instantly. Shows active presentation.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
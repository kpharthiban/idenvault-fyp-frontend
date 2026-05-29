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
    setSecondsLeft(30);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { setSecondsLeft(30); return 30; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <RequireAuth allowedRole="student">
      <div className="max-w-3xl mx-auto pb-12">

        <button
          onClick={() => router.push("/student/credentials")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors text-sm font-bold group"
        >
          <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
          Back to Credentials
        </button>

        <div className="flex flex-col gap-6">

          {/* Credential Info */}
          <div className="space-y-4">

            {/* Main card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
              <div className={`w-full h-1.5 ${isRevoked ? "bg-red-500" : "bg-green-500"}`} />
              <div className="p-6">

                {/* Title + status */}
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div>
                    <h1 className="text-2xl font-heading font-extrabold text-slate-900">{credential.title}</h1>
                    {credential.grade && (
                      <p className="text-green-700 font-bold mt-1">Grade: {credential.grade}</p>
                    )}
                  </div>
                  <div className={`shrink-0 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                    isRevoked
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {isRevoked ? <Ban size={12} strokeWidth={2.5} /> : <ShieldCheck size={12} strokeWidth={2.5} />}
                    {isRevoked ? "Revoked" : "Active"}
                  </div>
                </div>

                {/* Details grid */}
                <div className="space-y-3">
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
                        className="text-purple-600 font-mono font-bold text-xs break-all hover:underline"
                      >
                        {credential.tx_hash.slice(0, 18)}...
                      </a>
                    </div>
                  )}
                </div>

                {/* Description */}
                {credential.description && (
                  <div className="mt-5 pt-5 border-t border-slate-200">
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{credential.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* IPFS Certificate */}
            {ipfsUrl && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
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
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} strokeWidth={2.5} /> View
                    </a>
                    <a
                      href={ipfsUrl}
                      download
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Download size={13} strokeWidth={2.5} /> Download
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share Panel */}
          <div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-white">
                <h3 className="text-slate-900 font-heading font-extrabold text-xl">Share Credential</h3>
                <p className="text-slate-500 font-medium text-sm mt-1">Present or share this credential with verifiers to prove its authenticity</p>
              </div>

              {/* Share Content */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8 bg-[#F8F8F8]">
                 {/* QR Code Column */}
                 <div className="flex flex-col items-center justify-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold shadow-sm ${
                        secondsLeft < 10
                          ? "bg-red-50 border border-red-200 text-red-600"
                          : "bg-blue-50 border border-blue-200 text-blue-700"
                      }`}>
                        <Clock size={11} strokeWidth={2.5} /> {secondsLeft}s
                      </div>
                      <div className="relative mt-8">
                        <motion.div
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 w-full h-0.5 bg-green-500/50 pointer-events-none z-10"
                        />
                        <QRCodeSVG value={verifyUrl} size={140} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium text-center mt-6">
                        Scan to verify instantly
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
                        className="shrink-0 p-2.5 bg-slate-50 hover:bg-green-50 rounded-lg text-slate-500 hover:text-green-600 border border-slate-200 hover:border-green-200 transition-all shadow-sm"
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
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
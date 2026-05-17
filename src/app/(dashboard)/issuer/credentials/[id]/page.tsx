"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ethers } from "ethers";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, User, Calendar, Shield, FileText, Ban, CheckCircle,
  AlertTriangle, Award, ExternalLink, Download, Loader2, AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ANCHOR_ADDRESS = process.env.NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS!;
const ANCHOR_ABI = [
  "function revokeCredential(string memory refId) external",
];

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
  blockchain?: {
    valid: boolean;
    revoked: boolean;
    issuer: string;
  };
}

export default function IssuerCredentialDetail() {
  const router = useRouter();
  const params = useParams();
  const refId = params.id as string;
  const { walletAddress } = useAuth();

  const [credential, setCredential] = useState<CredentialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

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

  const handleRevoke = async () => {
    if (!credential) return;
    setRevokeError(null);
    setRevoking(true);

    try {
      // Step 1 — on-chain revocation via MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ANCHOR_ADDRESS, ANCHOR_ABI, signer);
      const tx = await contract.revokeCredential(credential.ref_id);
      await tx.wait();

      // Step 2 — update Supabase status
      const res = await fetch(`${API_URL}/api/credentials/${credential.ref_id}`, {
        method: "DELETE",
        headers: { "x-wallet-address": walletAddress! },
      });
      if (!res.ok) throw new Error("Failed to update revocation in database");

      // Update local state
      setCredential(prev => prev ? { ...prev, status: "revoked" } : prev);
      setShowRevokeModal(false);
    } catch (err: any) {
      const msg = err?.code === "ACTION_REJECTED"
        ? "MetaMask transaction was rejected."
        : err.message || "Revocation failed.";
      setRevokeError(msg);
    } finally {
      setRevoking(false);
    }
  };

  // ── Loading / Error states ──────────────────────────────────────
  if (loading) {
    return (
      <RequireAuth allowedRole="issuer">
        <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
          <Loader2 size={20} className="animate-spin" /> Loading credential...
        </div>
      </RequireAuth>
    );
  }

  if (error || !credential) {
    return (
      <RequireAuth allowedRole="issuer">
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

  // ── Main render ─────────────────────────────────────────────────
  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => router.push("/issuer")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to List
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

          {/* Status bar */}
          <div className={`w-full h-1.5 ${isRevoked ? "bg-red-500" : "bg-emerald-500"}`} />

          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Issued Credential Details</h1>
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  Reference ID:
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                    {credential.ref_id}
                  </span>
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                isRevoked
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}>
                {isRevoked ? <Ban size={14} /> : <CheckCircle size={14} />}
                {isRevoked ? "Revoked" : "Active"}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credential Info</h3>
                <div className="flex items-start gap-3">
                  <Award size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Title</p>
                    <p className="text-white font-semibold">{credential.title}</p>
                  </div>
                </div>
                {credential.grade && (
                  <div className="flex items-start gap-3">
                    <Shield size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Grade / GPA</p>
                      <p className="text-white font-semibold">{credential.grade}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Issued On</p>
                    <p className="text-white font-semibold">
                      {new Date(credential.issued_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                {credential.expires_at && (
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Expires On</p>
                      <p className="text-white font-semibold">
                        {new Date(credential.expires_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parties</h3>
                <div className="flex items-start gap-3">
                  <User size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Holder Wallet</p>
                    <p className="text-white font-mono text-xs break-all">{credential.holder_wallet}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Issuer Wallet</p>
                    <p className="text-white font-mono text-xs break-all">{credential.issuer_wallet}</p>
                  </div>
                </div>
                {credential.tx_hash && (
                  <div className="flex items-start gap-3">
                    <ExternalLink size={16} className="text-purple-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Transaction Hash</p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${credential.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 font-mono text-xs break-all hover:underline"
                      >
                        {credential.tx_hash.slice(0, 20)}...
                      </a>
                    </div>
                  </div>
                )}
                {/* Blockchain status */}
                {credential.blockchain && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-2">Blockchain Status</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${credential.blockchain.valid ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"}`}>
                        {credential.blockchain.valid ? "✓ Hash Valid" : "✗ Hash Invalid"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${credential.blockchain.revoked ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"}`}>
                        {credential.blockchain.revoked ? "✗ Revoked On-Chain" : "✓ Not Revoked"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {credential.description && (
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{credential.description}</p>
              </div>
            )}

            {/* IPFS Document */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${ipfsUrl ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {ipfsUrl ? "Certificate Document" : "No Document Attached"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ipfsUrl
                        ? `IPFS CID: ${credential.ipfs_cid?.slice(0, 20)}...`
                        : "This is a metadata-only credential."}
                    </p>
                  </div>
                </div>
                {ipfsUrl && (
                  <div className="flex gap-3">
                    <a
                      href={ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <ExternalLink size={16} /> View
                    </a>
                    <a
                      href={ipfsUrl}
                      download
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Download size={16} /> Download
                    </a>
                  </div>
                )}
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
                <Ban size={18} /> Revoke Credential
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Confirm Revocation</h3>
              <p className="text-sm text-slate-400 mb-2">
                Are you sure you want to revoke <strong>{credential.title}</strong>?
              </p>
              <p className="text-xs text-slate-500 mb-6">
                MetaMask will ask you to sign a transaction. This action is permanent and irreversible.
              </p>

              {revokeError && (
                <div className="w-full mb-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-left">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  {revokeError}
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setShowRevokeModal(false); setRevokeError(null); }}
                  disabled={revoking}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {revoking ? <><Loader2 size={16} className="animate-spin" /> Revoking...</> : "Yes, Revoke"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </RequireAuth>
  );
}
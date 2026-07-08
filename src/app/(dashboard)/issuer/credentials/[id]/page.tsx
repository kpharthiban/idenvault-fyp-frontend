"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ethers } from "ethers";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { useIpfsMetadata } from "@/hooks/useIpfsMetadata";
import { resolveExpiryValue, isExpired as checkExpired } from "@/lib/expiry";
import CredentialFieldsSkeleton from "@/components/CredentialFieldsSkeleton";
import {
  ArrowLeft, User, Calendar, Shield, FileText, Ban, CheckCircle,
  AlertTriangle, Award, ExternalLink, Download, Loader2, AlertCircle,
  Database, Clock
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
  metadata_cid: string | null;
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

  // IPFS field data is hydrated in the background (deferred-hydrate) so it never
  // blocks first paint of the fast DB data below.
  const { metadata, loading: metadataLoading } = useIpfsMetadata(credential?.metadata_cid);

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
        <div className="flex items-center justify-center py-32 text-slate-500 gap-3 font-medium">
          <Loader2 size={20} className="animate-spin" /> Loading credential...
        </div>
      </RequireAuth>
    );
  }

  if (error || !credential) {
    return (
      <RequireAuth allowedRole="issuer">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
          <AlertCircle size={18} strokeWidth={2.5} /> {error || "Credential not found"}
        </div>
      </RequireAuth>
    );
  }

  const isRevoked = credential.status === "revoked";
  // Prefer the DB column; fall back to the IPFS metadata expiry field for older
  // credentials that were issued before expires_at was populated correctly.
  const effectiveExpiresAt = credential.expires_at ?? resolveExpiryValue(metadata?.fields);
  const isExpired = !isRevoked && checkExpired(effectiveExpiresAt);
  const ipfsUrl = credential.ipfs_cid
    ? `https://gateway.pinata.cloud/ipfs/${credential.ipfs_cid}`
    : null;

  const formatFieldKey = (key: string): string =>
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Main render ─────────────────────────────────────────────────
  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => router.push("/issuer")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-all duration-200 text-sm font-bold group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
          Back to List
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl"
        >

          {/* Status bar */}
          <div className={`w-full h-1.5 ${isRevoked ? "bg-red-500" : isExpired ? "bg-amber-500" : "bg-green-500"}`} />

          <div className="p-8">
            {/* Header */}
            <div className="relative flex justify-between items-start mb-8">
              <div className={`absolute -top-8 -left-8 w-40 h-40 rounded-full blur-[50px] pointer-events-none ${isRevoked ? "bg-red-500/8" : isExpired ? "bg-amber-500/8" : "bg-green-500/8"}`} />
              <div className="relative">
                <h1 className="text-3xl font-heading font-extrabold text-slate-900 mb-2">Issued Credential Details</h1>
                <p className="text-slate-600 text-sm flex items-center gap-2 font-medium">
                  Reference ID:
                  <span className="font-mono text-green-700 bg-green-50 font-bold border border-green-100 px-2 py-0.5 rounded text-xs">
                    {credential.ref_id}
                  </span>
                </p>
              </div>
              <div className={`px-5 py-2 rounded-full border text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                isRevoked
                  ? "bg-red-50 text-red-700 border-red-200"
                  : isExpired
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-green-50 text-green-700 border-green-200"
              }`} data-testid="credential-status-badge">
                {isRevoked ? <Ban size={15} strokeWidth={2.5} /> : isExpired ? <Clock size={15} strokeWidth={2.5} /> : <CheckCircle size={15} strokeWidth={2.5} />}
                {isRevoked ? "Revoked" : isExpired ? "Expired" : "Active"}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm space-y-4"
              >
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Credential Info</h3>
                <div className="flex items-start gap-3">
                  <Award size={16} className="text-green-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Title</p>
                    <p className="text-slate-900 font-bold">{credential.title}</p>
                  </div>
                </div>
                {credential.grade && (
                  <div className="flex items-start gap-3">
                    <Shield size={16} className="text-green-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <div>
                      <p className="text-xs text-slate-500 font-bold">Grade / GPA</p>
                      <p className="text-slate-900 font-bold">{credential.grade}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-green-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Issued On</p>
                    <p className="text-slate-900 font-bold">
                      {new Date(credential.issued_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                {effectiveExpiresAt && (
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className={`mt-0.5 shrink-0 ${isExpired ? "text-amber-500" : "text-slate-400"}`} strokeWidth={2.5} />
                    <div>
                      <p className="text-xs text-slate-500 font-bold">Expires On</p>
                      <p className={`font-bold ${isExpired ? "text-amber-700" : "text-slate-900"}`}>
                        {new Date(effectiveExpiresAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm space-y-4"
              >
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Parties</h3>
                <div className="flex items-start gap-3">
                  <User size={16} className="text-blue-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Holder Wallet</p>
                    <p className="text-slate-900 font-mono text-xs break-all font-medium">{credential.holder_wallet}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield size={16} className="text-green-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Issuer Wallet</p>
                    <p className="text-slate-900 font-mono text-xs break-all font-medium">{credential.issuer_wallet}</p>
                  </div>
                </div>
                {credential.tx_hash && (
                  <div className="flex items-start gap-3">
                    <ExternalLink size={16} className="text-purple-600 mt-0.5 shrink-0" strokeWidth={2.5} />
                    <div>
                      <p className="text-xs text-slate-500 font-bold">Transaction Hash</p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${credential.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 font-mono text-xs break-all hover:underline font-medium transition-all duration-200"
                      >
                        {credential.tx_hash.slice(0, 20)}...
                      </a>
                    </div>
                  </div>
                )}
                {/* Blockchain status */}
                {credential.blockchain && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">On-Chain Status</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-xs px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 ${credential.blockchain.valid ? "text-green-700 border-green-200 bg-green-50" : "text-red-700 border-red-200 bg-red-50"}`}>
                        {credential.blockchain.valid ? <CheckCircle size={12} strokeWidth={2.5} /> : <AlertCircle size={12} strokeWidth={2.5} />}
                        {credential.blockchain.valid ? "Hash Valid" : "Hash Invalid"}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 ${credential.blockchain.revoked ? "text-red-700 border-red-200 bg-red-50" : "text-green-700 border-green-200 bg-green-50"}`}>
                        {credential.blockchain.revoked ? <Ban size={12} strokeWidth={2.5} /> : <Shield size={12} strokeWidth={2.5} />}
                        {credential.blockchain.revoked ? "Revoked On-Chain" : "Not Revoked"}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Description */}
            {credential.description && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm mb-6"
              >
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-slate-700 text-sm leading-relaxed font-medium">{credential.description}</p>
              </motion.div>
            )}

            {/* Credential Details from IPFS — deferred-hydrated */}
            {metadataLoading && (
              <div className="mb-6">
                <CredentialFieldsSkeleton />
              </div>
            )}
            {!metadataLoading && metadata && metadata.fields && Object.keys(metadata.fields).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-blue-50/50 rounded-xl p-5 border border-blue-200 shadow-sm mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Credential Details</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold uppercase tracking-wider">
                    <Database size={12} strokeWidth={2.5} />
                    IPFS Verified
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(metadata.fields).map(([key, value]) => (
                    <div key={key} className="bg-white/70 rounded-lg p-3 border border-blue-100">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{formatFieldKey(key)}</p>
                      <p className="text-sm text-slate-900 font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* IPFS Document */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-all duration-200 ${ipfsUrl ? "bg-green-50 text-green-600 border border-green-100 hover:bg-green-100" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                    <FileText size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-slate-900 font-bold text-sm">
                      {ipfsUrl ? "Certificate Document" : "No Document Attached"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
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
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 shadow-sm"
                    >
                      <ExternalLink size={16} strokeWidth={2.5} /> View
                    </a>
                    <a
                      href={ipfsUrl}
                      download
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 shadow-sm"
                    >
                      <Download size={16} strokeWidth={2.5} /> Download
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Danger Zone */}
          {!isRevoked && (
            <div className="bg-red-50 border-t border-red-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-red-700 font-bold text-base">Revoke Credential</h3>
                <p className="text-red-600/80 text-sm mt-1 font-medium">
                  This action permanently invalidates the credential on the blockchain.
                </p>
              </div>
              <button
                onClick={() => setShowRevokeModal(true)}
                className="px-6 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 shadow-sm"
                data-testid="revoke-credential-btn"
              >
                <Ban size={18} strokeWidth={2.5} /> Revoke Credential
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-50 border border-red-100 rounded-full text-red-600 mb-4">
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-heading font-extrabold text-slate-900 mb-2">Confirm Revocation</h3>
              <p className="text-sm text-slate-700 mb-2 font-medium">
                Are you sure you want to revoke <strong className="text-slate-900">{credential.title}</strong>?
              </p>
              <p className="text-xs text-slate-600 mb-6 font-medium">
                MetaMask will ask you to sign a transaction. This action is permanent and irreversible.
              </p>

              {revokeError && (
                <div className="w-full mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs text-left font-medium">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                  {revokeError}
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { setShowRevokeModal(false); setRevokeError(null); }}
                  disabled={revoking}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {revoking ? <><Loader2 size={16} className="animate-spin" strokeWidth={2.5} /> Revoking...</> : "Yes, Revoke"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </RequireAuth>
  );
}
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Send, User, Award, Loader2, CheckCircle, Shield,
  Calendar, FileText, GraduationCap, Star, Upload, X, Paperclip, Users, AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { CREDENTIAL_TEMPLATES } from "@/lib/credentialTemplates";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ANCHOR_ADDRESS = process.env.NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS!;
const ANCHOR_ABI = [
  "function anchorCredential(string memory refId, bytes32 dataHash) external",
];

type Status = "idle" | "uploading" | "anchoring" | "saving" | "success";

const STATUS_MESSAGES: Record<Status, string> = {
  idle: "",
  uploading: "Uploading certificate to IPFS...",
  anchoring: "Waiting for MetaMask — sign the transaction...",
  saving: "Saving credential record to database...",
  success: "",
};

export default function IssueCredentialPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { walletAddress } = useAuth();

  const [formData, setFormData] = useState({
    studentWallet: "",
    title: "",
    type: "degree",
    grade: "",
    expiryDate: "",
    description: "",
    templateId: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [issuedRefId, setIssuedRefId] = useState("");
  const [issuedTxHash, setIssuedTxHash] = useState("");

  const isSubmitting = status !== "idle" && status !== "success";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    const template = CREDENTIAL_TEMPLATES.find(t => t.id === tId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId: tId,
        title: template.title,
        type: template.type,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.studentWallet || !formData.title || !formData.description) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!ethers.isAddress(formData.studentWallet)) {
      setError("Student wallet must be a valid Ethereum address (0x...).");
      return;
    }

    try {
      // ── Step 1: IPFS upload (optional) ──────────────────────────
      let ipfsCid = "";
      if (selectedFile) {
        setStatus("uploading");
        const fileForm = new FormData();
        fileForm.append("file", selectedFile);
        const uploadRes = await fetch(`${API_URL}/api/ipfs/upload`, {
          method: "POST",
          headers: { "x-wallet-address": walletAddress! },
          body: fileForm,
        });
        if (!uploadRes.ok) throw new Error("IPFS upload failed");
        const { cid } = await uploadRes.json();
        ipfsCid = cid;
      }

      // ── Step 2: Build data + compute hash ───────────────────────
      setStatus("anchoring");
      const refId = crypto.randomUUID();
      const credentialData = {
        refId,
        issuerWallet: walletAddress!.toLowerCase(),
        studentWallet: formData.studentWallet.toLowerCase(),
        title: formData.title,
        type: formData.type,
        grade: formData.grade || null,
        description: formData.description,
        expiryDate: formData.expiryDate || null,
        ipfsCid: ipfsCid || null,
        issuedAt: new Date().toISOString(),
      };

      const dataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(credentialData))
      );

      // ── Step 3: Anchor on-chain via MetaMask ────────────────────
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ANCHOR_ADDRESS, ANCHOR_ABI, signer);

      const tx = await contract.anchorCredential(refId, dataHash);
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // ── Step 4: Save to Supabase via backend ────────────────────
        setStatus("saving");
        const saveRes = await fetch(`${API_URL}/api/credentials`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-wallet-address": walletAddress!,
        },
        body: JSON.stringify({
            ref_id:       refId,
            title:        credentialData.title,
            description:  credentialData.description,
            grade:        credentialData.grade || null,
            holder_wallet: credentialData.studentWallet,
            expires_at:   credentialData.expiryDate || null,
            ipfs_cid:     ipfsCid || null,
            tx_hash:      txHash,
            data_hash:    dataHash,
        }),
        });
      if (!saveRes.ok) throw new Error("Failed to save credential to database");

      setIssuedRefId(refId);
      setIssuedTxHash(txHash);
      setStatus("success");

    } catch (err: any) {
      // MetaMask rejection shows a friendly message
      const msg = err?.code === "ACTION_REJECTED"
        ? "MetaMask transaction was rejected."
        : err.message || "Something went wrong.";
      setError(msg);
      setStatus("idle");
    }
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-3xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/issuer")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push("/issuer/issue/bulk")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-700 transition-all text-sm font-medium"
          >
            <Users size={16} /> Switch to Bulk Mode
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />

          {status === "success" ? (
            <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-6">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Credential Issued Successfully</h2>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                <strong>{formData.title}</strong> has been anchored on Sepolia and saved.
              </p>

              {/* Reference details */}
              <div className="bg-slate-950 rounded-xl p-4 text-left space-y-2 mb-8 border border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Reference ID</p>
                  <p className="font-mono text-emerald-400 text-sm break-all">{issuedRefId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Transaction Hash</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${issuedTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-blue-400 text-sm break-all hover:underline"
                  >
                    {issuedTxHash}
                  </a>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/issuer")}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setFormData({ studentWallet: "", title: "", type: "degree", grade: "", expiryDate: "", description: "", templateId: "" });
                    setSelectedFile(null);
                    setError(null);
                  }}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Issue Another
                </button>
              </div>
            </motion.div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Shield className="text-emerald-500" /> Issue New Credential
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Fill in the details below. This data will be immutable once anchored on-chain.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Progress banner */}
              {isSubmitting && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                  <Loader2 size={18} className="animate-spin shrink-0" />
                  {STATUS_MESSAGES[status]}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Template */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Credential Template *
                  </label>
                  <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <select
                      name="templateId"
                      value={formData.templateId}
                      onChange={handleTemplateChange}
                      disabled={isSubmitting}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                    >
                      <option value="">-- Select a Template --</option>
                      {CREDENTIAL_TEMPLATES.map(t => {
                        const disabled = t.issuanceMode === "bulk";
                        return (
                          <option key={t.id} value={t.id} disabled={disabled}>
                            {t.title}{disabled ? " (Bulk Only)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Student Wallet + Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                      Student Wallet Address *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input
                        type="text"
                        name="studentWallet"
                        value={formData.studentWallet}
                        onChange={handleChange}
                        placeholder="0x..."
                        disabled={isSubmitting}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                      Credential Type
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input
                        type="text"
                        name="type"
                        value={formData.type}
                        readOnly
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Credential Title *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Bachelor of Computer Science"
                      disabled={isSubmitting}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                {/* Grade + Expiry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                      Grade / GPA <span className="text-slate-600 normal-case">(optional)</span>
                    </label>
                    <div className="relative">
                      <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input
                        type="text"
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        placeholder="e.g. 3.85 / First Class"
                        disabled={isSubmitting}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                      Expiry Date <span className="text-slate-600 normal-case">(optional)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Description *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe the credential, programme scope, or achievement..."
                      disabled={isSubmitting}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 ml-1">
                    Supporting Document <span className="text-slate-600 normal-case">(optional — uploaded to IPFS)</span>
                  </label>
                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-900/50 hover:bg-slate-900 group"
                    >
                      <div className="p-3 bg-slate-800 rounded-full mb-3 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors text-slate-400">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm text-slate-300 font-medium">Click to upload or drag & drop</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Paperclip size={18} className="text-emerald-400" />
                        <div>
                          <p className="text-sm text-white font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        disabled={isSubmitting}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-900/30"
                >
                  {isSubmitting ? (
                    <><Loader2 size={20} className="animate-spin" /> Processing...</>
                  ) : (
                    <><Send size={20} /> Issue Credential</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Send, User, Award, Loader2, CheckCircle, Shield,
  FileText, GraduationCap, Upload, X, Paperclip, Users, AlertCircle,
  WifiOff, RefreshCw, Database, Search, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CREDENTIAL_TEMPLATES, CredentialTemplate, TemplateField } from "@/lib/credentialTemplates";
import { fetchTemplates } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ANCHOR_ADDRESS = process.env.NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS!;
const ANCHOR_ABI = [
  "function anchorCredential(string memory refId, bytes32 dataHash) external",
];

interface Connection {
  id: string;
  system_name: string;
  endpoint_url: string;
  status: string;
  connected_at: string;
}

interface ExternalStudent {
  id: string;
  student_id?: string;
  name: string;
  program: string;
  gpa?: string;
  status?: string;
  has_certificate?: boolean;
}

type Status = "idle" | "uploading" | "uploading-metadata" | "anchoring" | "saving" | "success";

const STATUS_MESSAGES: Record<Status, string> = {
  idle: "",
  uploading: "Uploading certificate to IPFS...",
  "uploading-metadata": "Storing metadata on IPFS...",
  anchoring: "Waiting for MetaMask — sign the transaction...",
  saving: "Saving credential record to database...",
  success: "",
};

export default function IssueCredentialPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { walletAddress } = useAuth();

  // ── External system connections ─────────────────────────────────
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  // ── External students for import ────────────────────────────────
  const [sisStudents, setSisStudents] = useState<ExternalStudent[]>([]);
  const [sisStudentsLoading, setSisStudentsLoading] = useState(false);
  const [sisSearchTerm, setSisSearchTerm] = useState("");
  const [sisSearchOpen, setSisSearchOpen] = useState(false);
  const [selectedSisStudent, setSelectedSisStudent] = useState<ExternalStudent | null>(null);
  const [useSisCertificate, setUseSisCertificate] = useState(false);

  // ── Template list (fetched from API, fallback to local) ─────────
  const [allTemplates, setAllTemplates] = useState<CredentialTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null);
  const [studentWallet, setStudentWallet] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [issuedRefId, setIssuedRefId] = useState("");
  const [issuedTxHash, setIssuedTxHash] = useState("");

  const isSubmitting = status !== "idle" && status !== "success";

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    "x-wallet-address": walletAddress || "",
  }), [walletAddress]);

  // Load connections
  useEffect(() => {
    if (!walletAddress) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/external-system/connections`, { headers: headers() });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const conns: Connection[] = data.connections || [];
        setConnections(conns);
        if (conns.length === 1) setSelectedConnection(conns[0]);
      } catch {
        // Non-blocking — import panel just won't show
      } finally {
        setConnectionsLoading(false);
      }
    };
    load();
  }, [walletAddress, headers]);

  // Fetch students when connection is selected
  useEffect(() => {
    if (!selectedConnection) return;
    const fetchSisStudents = async () => {
      setSisStudentsLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/external-system/connections/${selectedConnection.id}/students`,
          { headers: headers() }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSisStudents(data.students || []);
      } catch {
        setSisStudents([]);
      } finally {
        setSisStudentsLoading(false);
      }
    };
    fetchSisStudents();
  }, [selectedConnection, headers]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    if (!walletAddress) return;
    setTemplatesLoading(true);
    setUsingFallback(false);
    const res = await fetchTemplates(walletAddress);
    if (res.success && Array.isArray(res.data)) {
      setAllTemplates(res.data);
    } else {
      setAllTemplates(CREDENTIAL_TEMPLATES.map((t) => ({ ...t, isSystemDefault: true })));
      setUsingFallback(true);
    }
    setTemplatesLoading(false);
  }, [walletAddress]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const singleTemplates = allTemplates.filter(
    (t) => t.issuanceMode === "single" || t.issuanceMode === "both"
  );

  // Filtered student list for search
  const filteredSisStudents = sisStudents.filter((s) => {
    const term = sisSearchTerm.toLowerCase();
    if (!term) return true;
    return (
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      (s.student_id && s.student_id.toLowerCase().includes(term))
    );
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    const template = singleTemplates.find((t) => t.id === tId) ?? null;
    setSelectedTemplate(template);
    setFieldValues({});
    setSelectedFile(null);
    setUseSisCertificate(false);
  };

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  // Select student from SIS
  const handleSelectSisStudent = (student: ExternalStudent) => {
    setSelectedSisStudent(student);
    setSisSearchTerm("");
    setSisSearchOpen(false);
    // Auto-fill student ID field if template has one
    const studentIdVal = student.student_id || student.id;
    setFieldValues((prev) => ({ ...prev, student_id: studentIdVal }));
    setUseSisCertificate(false);
  };

  // Clear import
  const handleClearImport = () => {
    setSelectedSisStudent(null);
    setSisSearchTerm("");
    setUseSisCertificate(false);
    setFieldValues((prev) => {
      const next = { ...prev };
      delete next.student_id;
      return next;
    });
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTemplate) {
      setError("Please select a credential template.");
      return;
    }
    if (!studentWallet) {
      setError("Please enter the student wallet address.");
      return;
    }
    if (!ethers.isAddress(studentWallet)) {
      setError("Student wallet must be a valid Ethereum address (0x...).");
      return;
    }

    const missingRequired = selectedTemplate.fields
      .filter((f) => f.required && f.type !== "file" && !fieldValues[f.name]?.trim())
      .map((f) => f.label);
    if (missingRequired.length > 0) {
      setError(`Missing required fields: ${missingRequired.join(", ")}`);
      return;
    }

    const fileField = selectedTemplate.fields.find((f) => f.type === "file");
    if (fileField?.required && !selectedFile && !useSisCertificate) {
      setError(`Please upload the required file: ${fileField.label}`);
      return;
    }

    try {
      // ── Step 1: IPFS upload (optional, skip if using SIS cert) ──
      let ipfsCid = "";
      if (selectedFile && !useSisCertificate) {
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

      // ── Step 2: Build data + compute hash ────────────────────────
      setStatus("anchoring");
      const refId = crypto.randomUUID();
      const credentialData: Record<string, any> = {
        refId,
        templateId: selectedTemplate.id,
        issuerWallet: walletAddress!.toLowerCase(),
        studentWallet: studentWallet.toLowerCase(),
        title: selectedTemplate.title,
        type: selectedTemplate.type,
        fields: fieldValues,
        ipfsCid: ipfsCid || null,
        issuedAt: new Date().toISOString(),
      };

      // Add SIS certificate info if using it
      if (useSisCertificate && selectedSisStudent && selectedConnection) {
        credentialData.sis_certificate = true;
        credentialData.sis_connection_id = selectedConnection.id;
        credentialData.sis_student_id = selectedSisStudent.id;
      }

      const dataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(credentialData))
      );

      // ── Step 2.5: Upload metadata JSON to IPFS ──────────────────
      setStatus("uploading-metadata");
      const metadataRes = await fetch(`${API_URL}/api/ipfs/upload-metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress!,
        },
        body: JSON.stringify(credentialData),
      });
      if (!metadataRes.ok) throw new Error("Failed to upload metadata to IPFS");
      const { cid: metadataCid } = await metadataRes.json();

      // ── Step 3: Anchor on-chain via MetaMask ─────────────────────
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ANCHOR_ADDRESS, ANCHOR_ABI, signer);

      const tx = await contract.anchorCredential(refId, dataHash);
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // ── Step 4: Save to Supabase via backend ─────────────────────
      setStatus("saving");
      const savePayload: Record<string, any> = {
        ref_id: refId,
        template_id: selectedTemplate.id,
        title: credentialData.title,
        type: credentialData.type,
        holder_wallet: credentialData.studentWallet,
        fields: fieldValues,
        ipfs_cid: ipfsCid || null,
        metadata_cid: metadataCid,
        tx_hash: txHash,
        data_hash: dataHash,
      };

      if (useSisCertificate && selectedSisStudent && selectedConnection) {
        savePayload.sis_certificate = true;
        savePayload.sis_connection_id = selectedConnection.id;
        savePayload.sis_student_id = selectedSisStudent.id;
      }

      const saveRes = await fetch(`${API_URL}/api/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress!,
        },
        body: JSON.stringify(savePayload),
      });
      if (!saveRes.ok) throw new Error("Failed to save credential to database");

      setIssuedRefId(refId);
      setIssuedTxHash(txHash);
      setStatus("success");
    } catch (err: any) {
      const msg =
        err?.code === "ACTION_REJECTED"
          ? "MetaMask transaction was rejected."
          : err.message || "Something went wrong.";
      setError(msg);
      setStatus("idle");
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setSelectedTemplate(null);
    setStudentWallet("");
    setFieldValues({});
    setSelectedFile(null);
    setError(null);
    setSelectedSisStudent(null);
    setSisSearchTerm("");
    setUseSisCertificate(false);
  };

  function renderField(field: TemplateField) {
    if (field.type === "file") {
      // If using SIS certificate, show badge instead of file upload
      if (useSisCertificate) {
        return (
          <div key={field.name} className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 ml-1">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <Database size={18} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm text-emerald-300 font-medium">Certificate will be fetched from external system</p>
                <p className="text-xs text-slate-400 mt-0.5">Source: {selectedConnection?.system_name}</p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div key={field.name} className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 ml-1">
            {field.label} {field.required && <span className="text-red-400">*</span>}
            {!field.required && <span className="text-slate-600 normal-case">(optional — uploaded to IPFS)</span>}
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
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.name}>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          <select
            value={fieldValues[field.name] || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={isSubmitting}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.name}>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
            {field.label} {field.required ? <span className="text-red-400">*</span> : <span className="text-slate-600 normal-case">(optional)</span>}
          </label>
          <div className="relative">
            <FileText className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
            <textarea
              value={fieldValues[field.name] || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              rows={3}
              placeholder={field.placeholder}
              disabled={isSubmitting}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
            />
          </div>
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
          {field.label} {field.required ? <span className="text-red-400">*</span> : <span className="text-slate-600 normal-case">(optional)</span>}
        </label>
        <input
          type={field.type === "date" ? "date" : "text"}
          value={fieldValues[field.name] || ""}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          disabled={isSubmitting}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>
    );
  }

  const nonFileFields = selectedTemplate?.fields.filter((f) => f.type !== "file") ?? [];
  const fileFields = selectedTemplate?.fields.filter((f) => f.type === "file") ?? [];
  const hasConnections = connections.length > 0;

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
                <strong>{selectedTemplate?.title}</strong> has been anchored on Sepolia and saved.
              </p>

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
                  onClick={resetForm}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Issue Another
                </button>
              </div>
            </motion.div>
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

              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {isSubmitting && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                  <Loader2 size={18} className="animate-spin shrink-0" />
                  {STATUS_MESSAGES[status]}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Import from External System Panel ──────────────── */}
                {!connectionsLoading && hasConnections && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Database size={16} className="text-blue-400" />
                      <h3 className="text-sm font-semibold text-white">Import Student Data from External System</h3>
                    </div>

                    {/* System selector (only if multiple) */}
                    {connections.length > 1 && (
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                          System
                        </label>
                        <select
                          value={selectedConnection?.id || ""}
                          onChange={(e) => {
                            const conn = connections.find((c) => c.id === e.target.value) || null;
                            setSelectedConnection(conn);
                            setSelectedSisStudent(null);
                            setSisSearchTerm("");
                            setUseSisCertificate(false);
                          }}
                          disabled={isSubmitting}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none text-sm"
                        >
                          <option value="">Select a system...</option>
                          {connections.map((c) => (
                            <option key={c.id} value={c.id}>{c.system_name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Student search */}
                    {selectedConnection && (
                      <div className="relative">
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                          Student
                        </label>

                        {selectedSisStudent ? (
                          /* Selected student info card */
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {selectedSisStudent.name}
                                  <span className="text-slate-400 font-mono text-xs ml-2">
                                    ({selectedSisStudent.student_id || selectedSisStudent.id})
                                  </span>
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {selectedSisStudent.program}
                                  {selectedSisStudent.gpa && <> · CGPA: {selectedSisStudent.gpa}</>}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleClearImport}
                                disabled={isSubmitting}
                                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            {/* SIS certificate toggle */}
                            {selectedSisStudent.has_certificate && (
                              <div className="mt-3 pt-3 border-t border-slate-800">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={useSisCertificate}
                                    onChange={(e) => {
                                      setUseSisCertificate(e.target.checked);
                                      if (e.target.checked) setSelectedFile(null);
                                    }}
                                    disabled={isSubmitting}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className="text-xs text-slate-300">
                                    <Paperclip size={12} className="inline mr-1 text-emerald-400" />
                                    Attach certificate from external system
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Search input */
                          <div>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                              <input
                                type="text"
                                value={sisSearchTerm}
                                onChange={(e) => {
                                  setSisSearchTerm(e.target.value);
                                  setSisSearchOpen(true);
                                }}
                                onFocus={() => setSisSearchOpen(true)}
                                placeholder="Type name or student ID to search..."
                                disabled={isSubmitting || sisStudentsLoading}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                              />
                              {sisStudentsLoading && (
                                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />
                              )}
                            </div>

                            {/* Dropdown results */}
                            <AnimatePresence>
                              {sisSearchOpen && !sisStudentsLoading && filteredSisStudents.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto"
                                >
                                  {filteredSisStudents.slice(0, 8).map((s) => (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => handleSelectSisStudent(s)}
                                      className="w-full text-left px-4 py-2.5 hover:bg-slate-800/60 transition-colors border-b border-slate-800/40 last:border-b-0"
                                    >
                                      <p className="text-sm text-white">
                                        <span className="font-mono text-xs text-blue-400 mr-2">{s.student_id || s.id}</span>
                                        {s.name}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-0.5">{s.program}</p>
                                    </button>
                                  ))}
                                  {filteredSisStudents.length > 8 && (
                                    <div className="px-4 py-2 text-xs text-slate-500 text-center bg-slate-950">
                                      {filteredSisStudents.length - 8} more results — refine your search
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Clear import button (when student selected) */}
                        {selectedSisStudent && (
                          <button
                            type="button"
                            onClick={handleClearImport}
                            disabled={isSubmitting}
                            className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            Clear Import
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback warning */}
                {usingFallback && (
                  <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <WifiOff size={16} className="text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-200 flex-1">Could not connect to server. Showing local defaults.</p>
                    <button
                      type="button"
                      onClick={loadTemplates}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 transition-colors"
                    >
                      <RefreshCw size={10} /> Retry
                    </button>
                  </div>
                )}

                {/* Template Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Credential Template <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <select
                      value={selectedTemplate?.id ?? ""}
                      onChange={handleTemplateChange}
                      disabled={isSubmitting || templatesLoading}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                    >
                      <option value="">
                        {templatesLoading ? "Loading templates..." : "-- Select a Template --"}
                      </option>
                      {singleTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Student Wallet + Credential Type */}
                {selectedTemplate && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                          Student Wallet Address <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                          <input
                            type="text"
                            value={studentWallet}
                            onChange={(e) => setStudentWallet(e.target.value)}
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
                            value={selectedTemplate.type}
                            readOnly
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Credential Title (read-only from template) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                        Credential Title
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                          type="text"
                          value={selectedTemplate.title}
                          readOnly
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Dynamic template fields (non-file) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {nonFileFields.map((field) => (
                        <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>

                    {/* File upload fields */}
                    {fileFields.map((field) => renderField(field))}

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
                  </>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}

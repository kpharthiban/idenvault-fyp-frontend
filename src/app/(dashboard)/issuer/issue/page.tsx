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
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSisSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <div key={field.name} className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 ml-1">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <Database size={18} className="text-green-600 shrink-0" strokeWidth={2.5} />
              <div>
                <p className="text-sm text-green-800 font-bold">Certificate will be fetched from external system</p>
                <p className="text-xs text-green-700 mt-0.5 font-medium">Source: {selectedConnection?.system_name}</p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div key={field.name} className="pt-2 border-t border-slate-200">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 ml-1">
            {field.label} {field.required && <span className="text-red-600">*</span>}
            {!field.required && <span className="text-slate-500 normal-case font-medium ml-1">(optional — uploaded to IPFS)</span>}
          </label>
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 hover:border-green-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 hover:bg-white group"
            >
              <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-full mb-3 group-hover:bg-green-50 group-hover:border-green-200 group-hover:text-green-600 transition-colors text-slate-400">
                <Upload size={24} />
              </div>
              <p className="text-sm text-slate-900 font-bold">Click to upload or drag & drop</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">PDF, PNG, JPG up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
              <div className="flex items-center gap-3">
                <Paperclip size={18} className="text-green-600" />
                <div>
                  <p className="text-sm text-slate-900 font-bold">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={isSubmitting}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
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
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
            {field.label} {field.required && <span className="text-red-600">*</span>}
          </label>
          <div className="relative">
            <select
              value={fieldValues[field.name] || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent appearance-none shadow-sm transition-all font-medium"
            >
              <option value="">{field.placeholder || `Select ${field.label}`}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" strokeWidth={2.5} />
          </div>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.name}>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
            {field.label} {field.required ? <span className="text-red-600">*</span> : <span className="text-slate-500 normal-case font-medium ml-1">(optional)</span>}
          </label>
          <div className="relative">
            <FileText className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
            <textarea
              value={fieldValues[field.name] || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              rows={3}
              placeholder={field.placeholder}
              disabled={isSubmitting}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none shadow-sm transition-all font-medium"
            />
          </div>
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
          {field.label} {field.required ? <span className="text-red-600">*</span> : <span className="text-slate-500 normal-case font-medium ml-1">(optional)</span>}
        </label>
        <input
          type={field.type === "date" ? "date" : "text"}
          value={fieldValues[field.name] || ""}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          disabled={isSubmitting}
          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 shadow-sm transition-all font-medium"
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
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push("/issuer/issue/bulk")}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-blue-600 rounded-lg border border-slate-200 shadow-sm transition-all text-sm font-bold"
          >
            <Users size={16} strokeWidth={2.5} /> Switch to Bulk Mode
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-visible">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 rounded-t-2xl" />

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="inline-flex items-center justify-center p-4 bg-green-50 rounded-full mb-6 border border-green-100">
                <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-2">Credential Issued Successfully</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto font-medium">
                <strong className="text-slate-900">{selectedTemplate?.title}</strong> has been anchored on Sepolia and saved.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 mb-8 border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Reference ID</p>
                  <p className="font-mono text-green-700 text-sm break-all font-medium">{issuedRefId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1 mt-3">Transaction Hash</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${issuedTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-blue-600 text-sm break-all hover:underline font-medium"
                  >
                    {issuedTxHash}
                  </a>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/issuer")}
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all border border-slate-200 shadow-sm"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  Issue Another
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-heading text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="text-green-600" strokeWidth={2.5} /> Issue New Credential
                </h2>
                <p className="text-slate-600 text-sm mt-1 font-medium">
                  Fill in the details below. This data will be immutable once anchored on-chain.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                  {error}
                </div>
              )}

              {isSubmitting && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                  <Loader2 size={18} className="animate-spin shrink-0" strokeWidth={2.5} />
                  {STATUS_MESSAGES[status]}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">


                {/* Fallback warning */}
                {usingFallback && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <WifiOff size={16} className="text-yellow-600 shrink-0" strokeWidth={2.5} />
                    <p className="text-xs text-yellow-700 flex-1 font-bold">Could not connect to server. Showing local defaults.</p>
                    <button
                      type="button"
                      onClick={loadTemplates}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-yellow-700 bg-white hover:bg-yellow-50 rounded-lg border border-yellow-200 transition-colors shadow-sm"
                    >
                      <RefreshCw size={12} strokeWidth={2.5} /> Retry
                    </button>
                  </div>
                )}

                {/* Template Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                    Credential Template <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <select
                      value={selectedTemplate?.id ?? ""}
                      onChange={handleTemplateChange}
                      disabled={isSubmitting || templatesLoading}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent appearance-none shadow-sm transition-all font-medium"
                    >
                      <option value="">
                        {templatesLoading ? "Loading templates..." : "-- Select a Template --"}
                      </option>
                      {singleTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Student Wallet + Credential Type */}
                {selectedTemplate && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                          Student Wallet Address <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input
                            type="text"
                            value={studentWallet}
                            onChange={(e) => setStudentWallet(e.target.value)}
                            placeholder="0x..."
                            disabled={isSubmitting}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-mono text-sm shadow-sm transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                          Credential Type
                        </label>
                        <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input
                            type="text"
                            value={selectedTemplate.type}
                            readOnly
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-500 cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Credential Title (read-only from template) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                        Credential Title
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="text"
                          value={selectedTemplate.title}
                          readOnly
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-500 cursor-not-allowed font-medium"
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
                      className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm hover:-translate-y-[1px] active:translate-y-0 active:shadow-none mt-2"
                    >
                      {isSubmitting ? (
                        <><Loader2 size={20} className="animate-spin" /> Processing...</>
                      ) : (
                        <><Send size={20} strokeWidth={2.5} /> Issue Credential</>
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

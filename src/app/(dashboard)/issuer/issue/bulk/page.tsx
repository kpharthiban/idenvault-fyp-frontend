"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  ChevronRight,
  Award,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Database,
  FileText,
  Asterisk,
  Upload,
  WifiOff,
  RefreshCw,
  Server,
  AlertCircle,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { CREDENTIAL_TEMPLATES, CredentialTemplate } from "@/lib/credentialTemplates";
import { fetchTemplates } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ANCHOR_ADDRESS = process.env.NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS!;
const ANCHOR_ABI = [
  "function batchAnchorCredentials(string[] memory refIds, bytes32[] memory dataHashes) external",
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
  name: string;
  student_id: string;
  programme: string;
  faculty: string;
  gpa: string;
  status: string;
  enrollment_year: number;
  expected_graduation: string;
  has_certificate: boolean;
  certificate_filename: string | null;
  wallet_address: string;
}

interface BuiltCredential {
  refId: string;
  student: ExternalStudent;
  credentialData: Record<string, any>;
  dataHash: string;
  ipfsCid: string | null;
  metadataCid: string;
}

interface IssuedCredential {
  refId: string;
  studentName: string;
  studentId: string;
  studentWallet: string;
  txHash: string;
  ipfsCid: string | null;
  metadataCid: string;
}

type Step = "source" | "template" | "participants" | "review" | "processing" | "success" | "error";

const TYPE_BADGE: Record<CredentialTemplate["type"], string> = {
  Degree: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  Award: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  Certificate: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  Status: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "text",
  date: "date",
  select: "select",
  file: "file",
  textarea: "textarea",
};

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateId(id: string): string {
  if (!id || id.length < 12) return id || "—";
  return `${id.slice(0, 8)}...`;
}

export default function BulkIssuePage() {
  const router = useRouter();
  const { walletAddress } = useAuth();

  // ── External system connections ─────────────────────────────────
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);

  // ── External students ───────────────────────────────────────────
  const [externalStudents, setExternalStudents] = useState<ExternalStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // ── Wizard state ────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("source");
  const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [participantError, setParticipantError] = useState<string | null>(null);

  // ── Processing state ────────────────────────────────────────────
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [processingPhase, setProcessingPhase] = useState(0); // 0-5

  // ── Results ─────────────────────────────────────────────────────
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);
  const [batchTxHash, setBatchTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorPhase, setErrorPhase] = useState("");

  // ── Template list ───────────────────────────────────────────────
  const [allTemplates, setAllTemplates] = useState<CredentialTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const apiHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "x-wallet-address": walletAddress || "",
  }), [walletAddress]);

  // ── Load connections ────────────────────────────────────────────
  const loadConnections = useCallback(async () => {
    if (!walletAddress) return;
    setConnectionsLoading(true);
    setConnectionsError(null);
    try {
      const res = await fetch(`${API_URL}/api/external-system/connections`, { headers: apiHeaders() });
      if (!res.ok) throw new Error("Failed to load connections");
      const data = await res.json();
      const conns: Connection[] = data.connections || [];
      setConnections(conns);
      if (conns.length === 1) {
        setSelectedConnection(conns[0]);
        setStep("template");
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
      setConnectionsError("Could not load external system connections.");
    } finally {
      setConnectionsLoading(false);
    }
  }, [walletAddress, apiHeaders]);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  // ── Load templates ──────────────────────────────────────────────
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

  const bulkTemplates = allTemplates.filter(
    (t) => t.issuanceMode === "bulk" || t.issuanceMode === "both"
  );

  // ── Fetch students ──────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    if (!selectedConnection) return;
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/external-system/connections/${selectedConnection.id}/students`,
        { headers: apiHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setExternalStudents(data.students || []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudentsError("Could not load student data from this system.");
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedConnection, apiHeaders]);

  const goToParticipants = () => {
    setStep("participants");
    setSelectedStudentIds([]);
    setParticipantError(null);
    fetchStudents();
  };

  // ── Selection logic ─────────────────────────────────────────────
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setParticipantError(null);
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === externalStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(externalStudents.map((s) => s.id));
    }
    setParticipantError(null);
  };

  const selectedStudentObjects = externalStudents.filter((s) => selectedStudentIds.includes(s.id));
  const studentsWithoutWallet = selectedStudentObjects.filter((s) => !s.wallet_address);
  const studentsWithCert = selectedStudentObjects.filter((s) => s.has_certificate);
  const studentsWithoutCert = selectedStudentObjects.filter((s) => !s.has_certificate);

  // Validate before proceeding to review
  const goToReview = () => {
    if (studentsWithoutWallet.length > 0) {
      setParticipantError(
        `${studentsWithoutWallet.length} student${studentsWithoutWallet.length !== 1 ? "s are" : " is"} missing wallet addresses and cannot receive credentials.`
      );
      return;
    }
    setParticipantError(null);
    setStep("review");
  };

  // ── PROCESSING PIPELINE ─────────────────────────────────────────
  const handleConfirmAndIssue = async () => {
    if (!selectedTemplate || !selectedConnection || !walletAddress) return;

    setStep("processing");
    setError(null);
    setErrorPhase("");

    const students = selectedStudentObjects;
    const certCids: Record<string, string> = {};
    const built: BuiltCredential[] = [];

    try {
      // ── Phase 1: Upload certificates to IPFS ────────────────────
      if (selectedTemplate.requiresCertificate) {
        const studentsNeedingCert = students.filter((s) => s.has_certificate);
        setProcessingPhase(1);
        setProcessingStatus("Uploading certificates to IPFS...");
        setProcessingProgress({ current: 0, total: studentsNeedingCert.length });

        for (let i = 0; i < studentsNeedingCert.length; i++) {
          const student = studentsNeedingCert[i];
          setProcessingProgress({ current: i + 1, total: studentsNeedingCert.length });

          try {
            // Fetch cert PDF from external system
            const certRes = await fetch(
              `${API_URL}/api/external-system/connections/${selectedConnection.id}/students/${student.id}/certificate`,
              { headers: { "x-wallet-address": walletAddress } }
            );
            if (!certRes.ok) throw new Error("Cert fetch failed");

            const blob = await certRes.blob();
            const file = new File(
              [blob],
              student.certificate_filename || `certificate-${student.student_id}.pdf`,
              { type: "application/pdf" }
            );

            // Upload to IPFS
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch(`${API_URL}/api/ipfs/upload`, {
              method: "POST",
              headers: { "x-wallet-address": walletAddress },
              body: formData,
            });
            if (!uploadRes.ok) throw new Error("IPFS upload failed");
            const { cid } = await uploadRes.json();
            certCids[student.id] = cid;
          } catch (err) {
            // Log but don't block — this student will be issued without cert
            console.error(`Failed to upload certificate for ${student.student_id}:`, err);
          }
        }
      }

      // ── Phase 2: Build credential data + compute hashes ─────────
      setProcessingPhase(2);
      setProcessingStatus("Building credential data and computing hashes...");
      setProcessingProgress({ current: 0, total: students.length });

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const refId = crypto.randomUUID();

        const credentialData = {
          refId,
          templateId: selectedTemplate.id,
          issuerWallet: walletAddress.toLowerCase(),
          studentWallet: student.wallet_address.toLowerCase(),
          title: selectedTemplate.title,
          type: selectedTemplate.type,
          fields: {
            studentId: student.student_id,
            studentName: student.name,
            programme: student.programme,
            gpa: student.gpa,
          },
          ipfsCid: certCids[student.id] || null,
          issuedAt: new Date().toISOString(),
        };

        const dataHash = ethers.keccak256(
          ethers.toUtf8Bytes(JSON.stringify(credentialData))
        );

        built.push({
          refId,
          student,
          credentialData,
          dataHash,
          ipfsCid: certCids[student.id] || null,
          metadataCid: "", // filled in Phase 3
        });

        setProcessingProgress({ current: i + 1, total: students.length });
      }

      // ── Phase 3: Upload metadata to IPFS ────────────────────────
      setProcessingPhase(3);
      setProcessingStatus("Uploading metadata to IPFS...");
      setProcessingProgress({ current: 0, total: built.length });

      for (let i = 0; i < built.length; i++) {
        const metadataRes = await fetch(`${API_URL}/api/ipfs/upload-metadata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-wallet-address": walletAddress,
          },
          body: JSON.stringify(built[i].credentialData),
        });
        if (!metadataRes.ok) throw new Error(`Failed to upload metadata for credential ${i + 1}`);
        const { cid } = await metadataRes.json();
        built[i].metadataCid = cid;

        setProcessingProgress({ current: i + 1, total: built.length });
      }

      // ── Phase 4: Batch anchor on-chain ──────────────────────────
      setProcessingPhase(4);
      setProcessingStatus("Awaiting MetaMask — sign ONE transaction for all credentials...");
      setProcessingProgress({ current: 0, total: 1 });

      if (!window.ethereum) {
        throw Object.assign(new Error("MetaMask not detected. Please install MetaMask to continue."), { phase: "blockchain" });
      }

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ANCHOR_ADDRESS, ANCHOR_ABI, signer);

      const refIds = built.map((b) => b.refId);
      const dataHashes = built.map((b) => b.dataHash);

      const tx = await contract.batchAnchorCredentials(refIds, dataHashes);
      const receipt = await tx.wait();
      const txHash = receipt.hash;
      setBatchTxHash(txHash);

      setProcessingProgress({ current: 1, total: 1 });

      // ── Phase 5: Save to Supabase ───────────────────────────────
      setProcessingPhase(5);
      setProcessingStatus("Saving credentials to database...");
      setProcessingProgress({ current: 0, total: 1 });

      const credentials = built.map((b) => ({
        ref_id: b.refId,
        template_id: selectedTemplate.id,
        title: selectedTemplate.title,
        type: selectedTemplate.type,
        holder_wallet: b.student.wallet_address.toLowerCase(),
        ipfs_cid: b.ipfsCid || null,
        metadata_cid: b.metadataCid,
        tx_hash: txHash,
        data_hash: b.dataHash,
      }));

      const saveRes = await fetch(`${API_URL}/api/credentials/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress,
        },
        body: JSON.stringify({ credentials }),
      });

      if (!saveRes.ok) {
        throw Object.assign(
          new Error(
            `Credentials were anchored on-chain but failed to save to database. Transaction hash: ${txHash}. Please contact admin.`
          ),
          { phase: "database", critical: true }
        );
      }

      setProcessingProgress({ current: 1, total: 1 });

      // ── Done — build result list ────────────────────────────────
      setIssuedCredentials(
        built.map((b) => ({
          refId: b.refId,
          studentName: b.student.name,
          studentId: b.student.student_id,
          studentWallet: b.student.wallet_address,
          txHash,
          ipfsCid: b.ipfsCid,
          metadataCid: b.metadataCid,
        }))
      );
      setStep("success");

    } catch (err: any) {
      console.error("Bulk issuance failed:", err);
      const phase = err?.phase || (
        processingPhase === 1 ? "certificate upload" :
        processingPhase === 2 ? "data preparation" :
        processingPhase === 3 ? "metadata upload" :
        processingPhase === 4 ? "blockchain" :
        processingPhase === 5 ? "database" : "unknown"
      );

      const msg = err?.code === "ACTION_REJECTED"
        ? "MetaMask transaction was rejected."
        : err.message || "An unexpected error occurred during batch issuance.";

      setErrorPhase(phase);
      setError(msg);
      setStep("error");
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const hasMultipleSystems = connections.length > 1;
  const stepList: Step[] = hasMultipleSystems
    ? ["source", "template", "participants", "review"]
    : ["template", "participants", "review"];
  const stepLabels: Record<string, string> = {
    source: "Source",
    template: "Template",
    participants: "Participants",
    review: "Review",
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
    } catch { return iso; }
  };

  const progressPercent = processingProgress.total > 0
    ? Math.round((processingProgress.current / processingProgress.total) * 100)
    : 0;

  const totalPhases = 5;
  const overallProgress = Math.round(((processingPhase - 1) / totalPhases) * 100 + (progressPercent / totalPhases));

  // ── No connections (blocking) ───────────────────────────────────
  if (!connectionsLoading && !connectionsError && connections.length === 0) {
    return (
      <RequireAuth allowedRole="issuer">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.push("/issuer/issue")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Single Issue
            </button>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Users size={20} /> Bulk Issuance Wizard
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-2xl">
            <div className="inline-flex p-4 rounded-2xl bg-slate-800/50 mb-5">
              <Server size={40} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No External System Connected</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm leading-relaxed">
              Bulk issuance requires a connected institutional system to retrieve recipient data.
            </p>
            <button
              onClick={() => router.push("/issuer/external-systems")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all"
            >
              <Server size={18} /> Connect External System
            </button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/issuer/issue")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Single Issue
          </button>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Users size={20} /> Bulk Issuance Wizard
          </div>
        </div>

        {connectionsLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 size={20} className="animate-spin" /> Loading connections...
          </div>
        ) : connectionsError ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <AlertCircle size={36} className="mx-auto mb-3 text-red-400 opacity-60" />
            <p className="text-red-400 mb-4">{connectionsError}</p>
            <button onClick={loadConnections} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-slate-700 transition-colors text-sm inline-flex items-center gap-2">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Progress Bar (wizard steps — not during processing/success/error) */}
            {!["processing", "success", "error"].includes(step) && (
              <div className="flex items-center justify-between mb-8 px-4 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10" />
                {stepList.map((s, idx) => {
                  const currentIdx = stepList.indexOf(step as any);
                  const isActive = step === s;
                  const isPast = currentIdx > idx;
                  return (
                    <div key={s} className={`flex flex-col items-center gap-2 bg-slate-950 px-2 ${isActive || isPast ? "text-emerald-400" : "text-slate-600"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isActive || isPast ? "bg-emerald-500/10 border-emerald-500" : "bg-slate-900 border-slate-700"
                      }`}>
                        {isPast ? <CheckCircle size={14} /> : idx + 1}
                      </div>
                      <span className="text-xs uppercase font-medium">{stepLabels[s]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MAIN CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative min-h-[400px]">

              {/* ────── SOURCE STEP ────── */}
              {step === "source" && hasMultipleSystems && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold text-white mb-2">Select Data Source</h2>
                  <p className="text-slate-400 text-sm mb-6">Choose which connected system to retrieve recipient data from.</p>
                  <div className="grid gap-3">
                    {connections.map((conn) => {
                      const isSelected = selectedConnection?.id === conn.id;
                      return (
                        <div key={conn.id} onClick={() => setSelectedConnection(conn)} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-emerald-500" : "border-slate-600"}`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-white font-bold">{conn.system_name}</h3>
                              <p className="text-slate-400 text-xs font-mono mt-0.5 break-all">{conn.endpoint_url}</p>
                              <p className="text-slate-500 text-xs mt-0.5">Connected {formatDate(conn.connected_at)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button onClick={() => setStep("template")} disabled={!selectedConnection} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2">
                      Continue <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── TEMPLATE STEP ────── */}
              {step === "template" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold text-white mb-2">Select Credential Template</h2>

                  {selectedConnection && (
                    <div className="flex items-center gap-2 mb-6 text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 w-fit">
                      <Database size={13} className="text-blue-400" />
                      Source: <span className="text-white font-medium">{selectedConnection.system_name}</span>
                    </div>
                  )}

                  {usingFallback && (
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                      <WifiOff size={16} className="text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-200 flex-1">Could not connect to server. Showing local defaults.</p>
                      <button onClick={loadTemplates} className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 transition-colors">
                        <RefreshCw size={10} /> Retry
                      </button>
                    </div>
                  )}

                  {templatesLoading ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
                      <Loader2 size={20} className="animate-spin" />
                      <span className="text-sm">Loading templates...</span>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {bulkTemplates.map((t) => {
                        const isSelected = selectedTemplate?.id === t.id;
                        return (
                          <div key={t.id} onClick={() => setSelectedTemplate(t)} className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${isSelected ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg ${isSelected ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                                <Award size={24} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-white font-bold text-lg">{t.title}</h3>
                                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${TYPE_BADGE[t.type]}`}>{t.type}</span>
                                </div>
                                <p className="text-slate-400 text-sm mt-0.5">{t.description}</p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="text-emerald-500 shrink-0" size={24} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedTemplate && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText size={16} className="text-slate-400" />
                        <h4 className="text-sm font-semibold text-white">Template Field Schema</h4>
                        <span className="ml-auto text-xs text-slate-500">{selectedTemplate.fields.length} field{selectedTemplate.fields.length !== 1 && "s"}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Each recipient record from the external system must supply values for these fields:</p>
                      <div className="space-y-2">
                        {selectedTemplate.fields.map((f) => (
                          <div key={f.name} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg bg-slate-900/60">
                            <span className="text-white font-medium flex-1 min-w-0 truncate">{f.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 uppercase font-bold shrink-0">{FIELD_TYPE_LABEL[f.type]}</span>
                            {f.required && <span className="flex items-center gap-0.5 text-[10px] text-red-400 shrink-0"><Asterisk size={10} /> required</span>}
                          </div>
                        ))}
                      </div>
                      {selectedTemplate.requiresCertificate && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                          <Upload size={14} className="shrink-0" />
                          This template requires a certificate file upload per recipient.
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="mt-8 flex justify-between">
                    {hasMultipleSystems && <button onClick={() => setStep("source")} className="text-slate-400 hover:text-white transition-colors">Back</button>}
                    <div className={!hasMultipleSystems ? "ml-auto" : ""}>
                      <button onClick={goToParticipants} disabled={!selectedTemplate} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2">
                        Next Step <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ────── PARTICIPANTS STEP ────── */}
              {step === "participants" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Select Recipients</h2>
                    {!studentsLoading && !studentsError && externalStudents.length > 0 && (
                      <button onClick={handleSelectAll} className="text-sm text-blue-400 hover:underline">
                        {selectedStudentIds.length === externalStudents.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg flex items-center gap-2 mb-4">
                    <ShieldCheck size={16} className="text-purple-400 shrink-0" />
                    <p className="text-xs text-purple-200">
                      <strong>Data Governance:</strong> Recipients are retrieved from connected institutional systems. This data is authoritative.
                    </p>
                  </div>

                  {participantError && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      <AlertCircle size={14} className="shrink-0" /> {participantError}
                    </div>
                  )}

                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                      <Loader2 size={18} className="animate-spin" /> <span className="text-sm">Fetching student records...</span>
                    </div>
                  ) : studentsError ? (
                    <div className="p-6 text-center">
                      <AlertCircle size={32} className="mx-auto mb-3 text-red-400 opacity-60" />
                      <p className="text-red-400 text-sm mb-4">{studentsError}</p>
                      <button onClick={fetchStudents} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-slate-700 transition-colors text-sm inline-flex items-center gap-2">
                        <RefreshCw size={14} /> Retry
                      </button>
                    </div>
                  ) : externalStudents.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                      <Users size={36} className="mx-auto mb-3 opacity-30" />
                      <p>No student records found in this system.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                            <tr>
                              <th className="px-3 py-3 w-10"></th>
                              <th className="px-3 py-3">Student ID</th>
                              <th className="px-3 py-3">Name</th>
                              <th className="px-3 py-3">Programme</th>
                              <th className="px-3 py-3">CGPA</th>
                              <th className="px-3 py-3">Wallet</th>
                              <th className="px-3 py-3">Certificate</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-300 divide-y divide-slate-800/60">
                            {externalStudents.map((s) => (
                              <tr key={s.id} onClick={() => toggleStudent(s.id)} className={`cursor-pointer transition-colors ${selectedStudentIds.includes(s.id) ? "bg-emerald-500/5" : "hover:bg-slate-800/30"}`}>
                                <td className="px-3 py-3">
                                  <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                                </td>
                                <td className="px-3 py-3 font-mono text-xs text-blue-400">{s.student_id}</td>
                                <td className="px-3 py-3 font-medium text-white text-sm">{s.name}</td>
                                <td className="px-3 py-3 text-xs">{s.programme}</td>
                                <td className="px-3 py-3 text-xs">{s.gpa || "—"}</td>
                                <td className="px-3 py-3 font-mono text-xs">
                                  {s.wallet_address ? (
                                    <span className="text-slate-300">{truncateAddress(s.wallet_address)}</span>
                                  ) : (
                                    <span className="text-red-400">Missing</span>
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  {s.has_certificate ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">Available</span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px] font-bold border border-slate-700">None</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-500">
                        {externalStudents.length} records from {selectedConnection?.system_name} · {selectedStudentIds.length} selected
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep("template")} className="text-slate-400 hover:text-white transition-colors">Back</button>
                    <button onClick={goToReview} disabled={selectedStudentIds.length === 0} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      Review Batch ({selectedStudentIds.length}) <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── REVIEW STEP ────── */}
              {step === "review" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold text-white mb-6">Confirm Issuance</h2>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-amber-200">
                      This action will permanently anchor <strong>{selectedStudentIds.length} credential{selectedStudentIds.length !== 1 && "s"}</strong> on the Ethereum blockchain. Each credential will be issued to the student&apos;s wallet address. This cannot be undone.
                    </p>
                  </div>

                  {selectedTemplate?.requiresCertificate && studentsWithoutCert.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-4 flex items-start gap-3">
                      <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-amber-200">
                        <strong>{studentsWithoutCert.length} of {selectedStudentIds.length}</strong> selected students have no certificate file. These will be issued without a certificate attachment.
                      </p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-3 text-slate-300 mb-6 text-sm">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Template:</span>
                      <span className="text-white font-bold">{selectedTemplate?.title} <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ml-1 ${selectedTemplate ? TYPE_BADGE[selectedTemplate.type] : ""}`}>{selectedTemplate?.type}</span></span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Data Source:</span>
                      <span className="text-white font-medium flex items-center gap-1.5"><Database size={13} className="text-blue-400" /> {selectedConnection?.system_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Total Recipients:</span>
                      <span className="text-white font-bold">{selectedStudentIds.length}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Certificate Attachment:</span>
                      <span className={selectedTemplate?.requiresCertificate ? "text-emerald-400" : "text-slate-500"}>
                        {selectedTemplate?.requiresCertificate ? `Yes — ${studentsWithCert.length} available, ${studentsWithoutCert.length} missing` : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Issuer Authority:</span>
                      <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={14} /> Verified</span>
                    </div>
                  </div>

                  {/* Recipient table */}
                  <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 mb-8 max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 w-8">#</th>
                          <th className="px-3 py-2.5">Student ID</th>
                          <th className="px-3 py-2.5">Name</th>
                          <th className="px-3 py-2.5">Wallet Address</th>
                          <th className="px-3 py-2.5">Certificate</th>
                          <th className="px-3 py-2.5">Credential Title</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300 divide-y divide-slate-800/40">
                        {selectedStudentObjects.map((s, i) => (
                          <tr key={s.id} className="hover:bg-slate-800/20">
                            <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                            <td className="px-3 py-2 font-mono text-blue-400">{s.student_id}</td>
                            <td className="px-3 py-2 text-white font-medium">{s.name}</td>
                            <td className="px-3 py-2 font-mono text-slate-300">{truncateAddress(s.wallet_address)}</td>
                            <td className="px-3 py-2">
                              {s.has_certificate
                                ? <span className="text-emerald-400">Available</span>
                                : <span className="text-slate-500">None</span>}
                            </td>
                            <td className="px-3 py-2 text-slate-400">{selectedTemplate?.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep("participants")} className="text-slate-400 hover:text-white transition-colors">Back</button>
                    <button
                      onClick={handleConfirmAndIssue}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                      <ShieldCheck size={18} />
                      Sign & Issue {selectedStudentIds.length} Credential{selectedStudentIds.length !== 1 && "s"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── PROCESSING STEP ────── */}
              {step === "processing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-4">
                      <Loader2 size={48} className="animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Issuing Credentials</h2>
                    <p className="text-slate-400 text-sm">Do not close this page or switch tabs.</p>
                  </div>

                  {/* Overall progress bar */}
                  <div className="max-w-md mx-auto mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Overall Progress</span>
                      <span className="text-xs text-emerald-400 font-bold">{overallProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Phase indicators */}
                  <div className="max-w-md mx-auto space-y-3">
                    {[
                      { phase: 1, label: "Uploading certificates to IPFS" },
                      { phase: 2, label: "Building credential data" },
                      { phase: 3, label: "Uploading metadata to IPFS" },
                      { phase: 4, label: "Awaiting MetaMask signature" },
                      { phase: 5, label: "Saving to database" },
                    ].map(({ phase, label }) => {
                      const isActive = processingPhase === phase;
                      const isDone = processingPhase > phase;
                      return (
                        <div key={phase} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? "bg-emerald-500/10 border border-emerald-500/20" : isDone ? "bg-slate-800/30" : "opacity-40"}`}>
                          {isDone ? (
                            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                          ) : isActive ? (
                            <Loader2 size={16} className="text-emerald-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                          )}
                          <span className={`text-sm ${isActive ? "text-white font-medium" : isDone ? "text-slate-400" : "text-slate-500"}`}>
                            {label}
                          </span>
                          {isActive && processingProgress.total > 0 && (
                            <span className="ml-auto text-xs text-emerald-400 font-mono">
                              {processingProgress.current}/{processingProgress.total}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-center text-xs text-slate-500 mt-6">{processingStatus}</p>
                </motion.div>
              )}

              {/* ────── ERROR STEP ────── */}
              {step === "error" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                  <div className="inline-flex p-4 bg-red-500/10 rounded-full text-red-500 mb-4">
                    <XCircle size={56} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Issuance Failed</h2>
                  <p className="text-slate-400 text-sm mb-4">
                    Failed during: <span className="text-red-400 font-medium">{errorPhase}</span>
                  </p>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-w-lg mx-auto mb-8 text-left">
                    <p className="text-sm text-red-300 break-words">{error}</p>
                  </div>

                  {batchTxHash && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 max-w-lg mx-auto mb-6 text-left">
                      <p className="text-xs text-amber-200 mb-1"><strong>Important:</strong> Credentials may have been anchored on-chain.</p>
                      <p className="text-xs text-amber-300 font-mono break-all">
                        TX: <a href={`https://sepolia.etherscan.io/tx/${batchTxHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-100">{batchTxHash}</a>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setStep("review")} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-slate-700 transition-colors">
                      Try Again
                    </button>
                    <button onClick={() => router.push("/issuer")} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-medium border border-slate-700 transition-colors">
                      Back to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── SUCCESS STEP ────── */}
              {step === "success" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-4">
                      <CheckCircle size={56} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Credentials Issued Successfully</h2>
                    <p className="text-slate-400 text-sm">
                      All {issuedCredentials.length} credentials have been anchored on-chain and saved.
                    </p>
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Issued</p>
                      <p className="text-2xl font-bold text-emerald-400">{issuedCredentials.length}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Template</p>
                      <p className="text-sm font-medium text-white truncate">{selectedTemplate?.title}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Data Source</p>
                      <p className="text-sm font-medium text-white truncate">{selectedConnection?.system_name}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">With Certificate</p>
                      <p className="text-2xl font-bold text-blue-400">{issuedCredentials.filter((c) => c.ipfsCid).length}</p>
                    </div>
                  </div>

                  {/* Transaction link */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Blockchain Transaction</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${batchTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-400 text-sm break-all hover:underline flex items-center gap-2"
                    >
                      {batchTxHash}
                      <ExternalLink size={14} className="shrink-0" />
                    </a>
                  </div>

                  {/* Credential details table */}
                  <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 mb-8 max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 w-8">#</th>
                          <th className="px-3 py-2.5">Student</th>
                          <th className="px-3 py-2.5">Wallet</th>
                          <th className="px-3 py-2.5">Ref ID</th>
                          <th className="px-3 py-2.5">Certificate</th>
                          <th className="px-3 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300 divide-y divide-slate-800/40">
                        {issuedCredentials.map((cred, i) => (
                          <tr key={cred.refId} className="hover:bg-slate-800/20">
                            <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                            <td className="px-3 py-2">
                              <span className="text-white font-medium">{cred.studentName}</span>
                              <span className="text-slate-500 ml-1.5">({cred.studentId})</span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-300">{truncateAddress(cred.studentWallet)}</td>
                            <td className="px-3 py-2 font-mono text-blue-400">{truncateId(cred.refId)}</td>
                            <td className="px-3 py-2">
                              {cred.ipfsCid
                                ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Pinned</span>
                                : <span className="text-slate-500">None</span>}
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Issued</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setStep(hasMultipleSystems ? "source" : "template");
                        setSelectedTemplate(null);
                        setSelectedStudentIds([]);
                        setExternalStudents([]);
                        setIssuedCredentials([]);
                        setBatchTxHash("");
                        setError(null);
                      }}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-slate-700 transition-colors"
                    >
                      Issue Another Batch
                    </button>
                    <button
                      onClick={() => router.push("/issuer")}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                    >
                      View Issued Credentials
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </>
        )}
      </div>
    </RequireAuth>
  );
}

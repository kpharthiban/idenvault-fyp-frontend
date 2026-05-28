"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { CREDENTIAL_TEMPLATES, CredentialTemplate } from "@/lib/credentialTemplates";
import { fetchTemplates } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  program: string;
  gpa?: string;
  status?: string;
  has_certificate?: boolean;
}

type Step = "source" | "template" | "participants" | "review" | "success";

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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Template list (fetched from API, fallback to local) ─────────
  const [allTemplates, setAllTemplates] = useState<CredentialTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    "x-wallet-address": walletAddress || "",
  }), [walletAddress]);

  // Load connections
  const loadConnections = useCallback(async () => {
    if (!walletAddress) return;
    setConnectionsLoading(true);
    setConnectionsError(null);
    try {
      const res = await fetch(`${API_URL}/api/external-system/connections`, { headers: headers() });
      if (!res.ok) throw new Error("Failed to load connections");
      const data = await res.json();
      const conns: Connection[] = data.connections || [];
      setConnections(conns);
      if (conns.length === 1) {
        setSelectedConnection(conns[0]);
        setStep("template");
      } else if (conns.length === 0) {
        setStep("source");
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
      setConnectionsError("Could not load external system connections.");
    } finally {
      setConnectionsLoading(false);
    }
  }, [walletAddress, headers]);

  useEffect(() => { loadConnections(); }, [loadConnections]);

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

  const bulkTemplates = allTemplates.filter(
    (t) => t.issuanceMode === "bulk" || t.issuanceMode === "both"
  );

  // Fetch students for selected connection
  const fetchStudents = useCallback(async () => {
    if (!selectedConnection) return;
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/external-system/connections/${selectedConnection.id}/students`,
        { headers: headers() }
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
  }, [selectedConnection, headers]);

  // Fetch students when entering participants step
  const goToParticipants = () => {
    setStep("participants");
    setSelectedStudents([]);
    fetchStudents();
  };

  // Toggle selection
  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === externalStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(externalStudents.map((s) => s.id));
    }
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("success");
    }, 2000);
  };

  // Multi-connection means 4 steps, single means 3
  const hasMultipleSystems = connections.length > 1;
  const stepList: Step[] = hasMultipleSystems
    ? ["source", "template", "participants", "review"]
    : ["template", "participants", "review"];
  const stepLabels: Record<Step, string> = {
    source: "Source",
    template: "Template",
    participants: "Participants",
    review: "Review",
    success: "Success",
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
    } catch { return iso; }
  };

  // Certificate warning for review step
  const selectedStudentObjects = externalStudents.filter((s) => selectedStudents.includes(s.id));
  const studentsWithoutCert = selectedStudentObjects.filter((s) => !s.has_certificate);

  // ── No connections state (blocking) ────────────────────────────
  if (!connectionsLoading && !connectionsError && connections.length === 0) {
    return (
      <RequireAuth allowedRole="issuer">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push("/issuer/issue")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Single Issue
            </button>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Users size={20} />
              Bulk Issuance Wizard
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
              <Server size={18} />
              Connect External System
            </button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/issuer/issue")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Single Issue
          </button>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Users size={20} />
            Bulk Issuance Wizard
          </div>
        </div>

        {/* Loading connections */}
        {connectionsLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 size={20} className="animate-spin" />
            Loading connections...
          </div>
        ) : connectionsError ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <AlertCircle size={36} className="mx-auto mb-3 text-red-400 opacity-60" />
            <p className="text-red-400 mb-4">{connectionsError}</p>
            <button
              onClick={loadConnections}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-slate-700 transition-colors text-sm inline-flex items-center gap-2"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            {step !== "success" && (
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
                        {idx + 1}
                      </div>
                      <span className="text-xs uppercase font-medium">{stepLabels[s]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MAIN CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative min-h-[400px]">

              {/* STEP 0: SOURCE (only if multiple connections) */}
              {step === "source" && hasMultipleSystems && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold text-white mb-2">Select Data Source</h2>
                  <p className="text-slate-400 text-sm mb-6">Choose which connected system to retrieve recipient data from.</p>

                  <div className="grid gap-3">
                    {connections.map((conn) => {
                      const isSelected = selectedConnection?.id === conn.id;
                      return (
                        <div
                          key={conn.id}
                          onClick={() => setSelectedConnection(conn)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? "border-emerald-500" : "border-slate-600"
                            }`}>
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
                    <button
                      onClick={() => setStep("template")}
                      disabled={!selectedConnection}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2"
                    >
                      Continue <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: TEMPLATE */}
              {step === "template" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold text-white mb-2">Select Credential Template</h2>

                  {/* Selected source indicator */}
                  {selectedConnection && (
                    <div className="flex items-center gap-2 mb-6 text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 inline-flex">
                      <Database size={13} className="text-blue-400" />
                      Source: <span className="text-white font-medium">{selectedConnection.system_name}</span>
                    </div>
                  )}

                  {/* Fallback warning */}
                  {usingFallback && (
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                      <WifiOff size={16} className="text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-200 flex-1">Could not connect to server. Showing local defaults.</p>
                      <button
                        onClick={loadTemplates}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 transition-colors"
                      >
                        <RefreshCw size={10} /> Retry
                      </button>
                    </div>
                  )}

                  {templatesLoading && (
                    <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
                      <Loader2 size={20} className="animate-spin" />
                      <span className="text-sm">Loading templates...</span>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {!templatesLoading && bulkTemplates.map((t) => {
                      const isSelected = selectedTemplate?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTemplate(t)}
                          className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
                          }`}
                        >
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

                  {/* Template field preview */}
                  {selectedTemplate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <FileText size={16} className="text-slate-400" />
                        <h4 className="text-sm font-semibold text-white">Template Field Schema</h4>
                        <span className="ml-auto text-xs text-slate-500">
                          {selectedTemplate.fields.length} field{selectedTemplate.fields.length !== 1 && "s"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        Each recipient record from the external system must supply values for these fields:
                      </p>
                      <div className="space-y-2">
                        {selectedTemplate.fields.map((f) => (
                          <div key={f.name} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg bg-slate-900/60">
                            <span className="text-white font-medium flex-1 min-w-0 truncate">{f.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 uppercase font-bold shrink-0">
                              {FIELD_TYPE_LABEL[f.type]}
                            </span>
                            {f.required && (
                              <span className="flex items-center gap-0.5 text-[10px] text-red-400 shrink-0">
                                <Asterisk size={10} /> required
                              </span>
                            )}
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
                    {hasMultipleSystems && (
                      <button onClick={() => setStep("source")} className="text-slate-400 hover:text-white transition-colors">Back</button>
                    )}
                    <div className={!hasMultipleSystems ? "ml-auto" : ""}>
                      <button
                        onClick={goToParticipants}
                        disabled={!selectedTemplate}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2"
                      >
                        Next Step <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PARTICIPANTS */}
              {step === "participants" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Select Recipients</h2>
                    {!studentsLoading && !studentsError && externalStudents.length > 0 && (
                      <button onClick={handleSelectAll} className="text-sm text-blue-400 hover:underline">
                        {selectedStudents.length === externalStudents.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-2 mb-6">
                    <Database size={16} className="text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-200">
                      <strong>Data Source:</strong> Recipients retrieved from <span className="font-medium">{selectedConnection?.system_name}</span>.
                    </p>
                  </div>

                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm">Fetching student records...</span>
                    </div>
                  ) : studentsError ? (
                    <div className="p-6 text-center">
                      <AlertCircle size={32} className="mx-auto mb-3 text-red-400 opacity-60" />
                      <p className="text-red-400 text-sm mb-4">{studentsError}</p>
                      <button
                        onClick={fetchStudents}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-slate-700 transition-colors text-sm inline-flex items-center gap-2"
                      >
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
                              <th className="px-4 py-3 w-12">Select</th>
                              <th className="px-4 py-3">Student ID</th>
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3">Programme</th>
                              <th className="px-4 py-3">CGPA</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Certificate</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-300 divide-y divide-slate-800/60">
                            {externalStudents.map((s) => (
                              <tr
                                key={s.id}
                                onClick={() => toggleStudent(s.id)}
                                className={`cursor-pointer transition-colors ${
                                  selectedStudents.includes(s.id) ? "bg-emerald-500/5" : "hover:bg-slate-800/30"
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(s.id)}
                                    onChange={() => toggleStudent(s.id)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                  />
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-blue-400">{s.id}</td>
                                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                                <td className="px-4 py-3 text-xs">{s.program}</td>
                                <td className="px-4 py-3 text-xs">{s.gpa || "—"}</td>
                                <td className="px-4 py-3">
                                  {s.status && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      s.status === "Graduated"
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    }`}>
                                      <CheckCircle size={9} /> {s.status}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {s.has_certificate ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                      Available
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px] font-bold border border-slate-700">
                                      None
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-500">
                        {externalStudents.length} records from {selectedConnection?.system_name}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep("template")} className="text-slate-400 hover:text-white transition-colors">Back</button>
                    <button
                      onClick={() => setStep("review")}
                      disabled={selectedStudents.length === 0}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review Batch ({selectedStudents.length}) <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: REVIEW */}
              {step === "review" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold text-white mb-6">Confirm Issuance</h2>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertTriangle className="text-yellow-500 shrink-0" />
                    <p className="text-sm text-yellow-200">
                      Warning: This action will permanently issue <strong>{selectedStudents.length} credential(s)</strong> on the blockchain. This process cannot be undone instantly.
                    </p>
                  </div>

                  {/* Certificate warning */}
                  {selectedTemplate?.requiresCertificate && studentsWithoutCert.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                      <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-amber-200">
                        <strong>{studentsWithoutCert.length} of {selectedStudents.length}</strong> selected students do not have certificates available in {selectedConnection?.system_name}. This template requires a certificate per recipient.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 text-slate-300 mb-8">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Data Source:</span>
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <Database size={14} className="text-blue-400" /> {selectedConnection?.system_name}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Credential Template:</span>
                      <span className="text-white font-bold">{selectedTemplate?.title}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Credential Type:</span>
                      {selectedTemplate && (
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${TYPE_BADGE[selectedTemplate.type]}`}>
                          {selectedTemplate.type}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Template Fields:</span>
                      <span className="text-white font-medium">
                        {selectedTemplate?.fields.length} field{selectedTemplate?.fields.length !== 1 && "s"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Certificate Required:</span>
                      <span className={selectedTemplate?.requiresCertificate ? "text-amber-400" : "text-slate-500"}>
                        {selectedTemplate?.requiresCertificate ? "Yes — per recipient" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Total Recipients:</span>
                      <span className="text-white font-bold">{selectedStudents.length} Students</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Issuer Authority:</span>
                      <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={14} /> Verified</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Certificate Source:</span>
                      <span className="text-slate-300 text-sm flex items-center gap-1.5">
                        <Database size={14} className="text-blue-400" /> {selectedConnection?.system_name} (External SIS)
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep("participants")} className="text-slate-400 hover:text-white transition-colors">Back</button>
                    <button
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                      {isSubmitting ? "Minting Batch..." : "Confirm & Issue"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === "success" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-4">
                    <CheckCircle size={64} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Batch Issuance Complete!</h2>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-w-md mx-auto mb-8 text-sm">
                    <p className="text-slate-400 mb-2">Issuance Summary:</p>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex justify-between">
                        <span>Data Source:</span>
                        <span className="text-white font-medium">{selectedConnection?.system_name}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Template:</span>
                        <span className="text-white font-medium">{selectedTemplate?.title}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Recipients:</span>
                        <span className="text-white font-medium">{selectedStudents.length} Students</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-slate-400 mb-8 text-sm">
                    Transaction Hash: <span className="font-mono text-emerald-400">0x71...9a2b</span>
                  </p>
                  <button
                    onClick={() => router.push("/issuer")}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700"
                  >
                    Return to Dashboard
                  </button>
                </motion.div>
              )}

            </div>
          </>
        )}
      </div>
    </RequireAuth>
  );
}

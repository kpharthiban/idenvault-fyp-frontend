"use client";

import { useState, useEffect, useCallback } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  Server,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database,
  Lock,
  RefreshCw,
  ShieldCheck,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  X,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Connection {
  id: string;
  system_name: string;
  endpoint_url: string;
  status: string;
  connected_at: string;
}

interface Student {
  id: string;
  name: string;
  program: string;
  gpa: string;
  status: string;
  has_certificate?: boolean;
}

export default function ExternalSystemsPage() {
  const { walletAddress } = useAuth();

  // Connections
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ system_name: "Student Information System", endpoint_url: "", api_key: "" });
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState(false);

  // Per-system student preview
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [students, setStudents] = useState<Record<string, Student[]>>({});
  const [studentsLoading, setStudentsLoading] = useState<Record<string, boolean>>({});
  const [studentsError, setStudentsError] = useState<Record<string, string | null>>({});

  // Disconnect confirmation
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    "x-wallet-address": walletAddress || "",
  }), [walletAddress]);

  // Load connections on mount
  const loadConnections = useCallback(async () => {
    if (!walletAddress) return;
    setConnectionsLoading(true);
    setConnectionsError(null);
    try {
      const res = await fetch(`${API_URL}/api/external-system/connections`, { headers: headers() });
      if (!res.ok) throw new Error("Failed to load connections");
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error("Failed to load connections:", err);
      setConnectionsError("Could not load external system connections. Please try again.");
    } finally {
      setConnectionsLoading(false);
    }
  }, [walletAddress, headers]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Auto-dismiss success banner
  useEffect(() => {
    if (!connectSuccess) return;
    const t = setTimeout(() => setConnectSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [connectSuccess]);

  // Add new connection
  const handleAddConnection = async () => {
    setConnectError(null);
    if (!formData.endpoint_url.match(/^https?:\/\/.+/)) {
      setConnectError("Endpoint URL must start with http:// or https://");
      return;
    }
    if (!formData.api_key.trim()) {
      setConnectError("API key is required.");
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch(`${API_URL}/api/external-system/connections`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Connection failed — could not reach the endpoint.");
      }
      const data = await res.json();
      const newConn: Connection = data.connection || data;
      setConnections((prev) => [...prev, newConn]);
      setFormData({ system_name: "Student Information System", endpoint_url: "", api_key: "" });
      setShowAddForm(false);
      setConnectSuccess(true);
    } catch (err: any) {
      setConnectError(err.message || "Connection failed. Please check your details and try again.");
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect a system
  const handleDisconnect = async (connectionId: string) => {
    setDisconnecting(connectionId);
    try {
      const res = await fetch(`${API_URL}/api/external-system/connections/${connectionId}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      if (expandedSystem === connectionId) setExpandedSystem(null);
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      // Clean up cached students
      setStudents((prev) => { const n = { ...prev }; delete n[connectionId]; return n; });
      setStudentsError((prev) => { const n = { ...prev }; delete n[connectionId]; return n; });
    } catch (err) {
      console.error("Failed to disconnect:", err);
    } finally {
      setDisconnecting(null);
      setDisconnectConfirm(null);
    }
  };

  // Fetch students for a connection
  const fetchStudents = useCallback(async (connectionId: string) => {
    setStudentsLoading((prev) => ({ ...prev, [connectionId]: true }));
    setStudentsError((prev) => ({ ...prev, [connectionId]: null }));
    try {
      const res = await fetch(`${API_URL}/api/external-system/connections/${connectionId}/students`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents((prev) => ({ ...prev, [connectionId]: data.students || [] }));
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudentsError((prev) => ({ ...prev, [connectionId]: "Could not load student data from this system." }));
    } finally {
      setStudentsLoading((prev) => ({ ...prev, [connectionId]: false }));
    }
  }, [headers]);

  // Toggle expand / collapse students
  const toggleExpand = (connectionId: string) => {
    if (expandedSystem === connectionId) {
      setExpandedSystem(null);
      return;
    }
    setExpandedSystem(connectionId);
    if (!students[connectionId]) {
      fetchStudents(connectionId);
    }
  };

  // Certificate helpers
  const handleViewCertificate = async (connectionId: string, studentId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/external-system/connections/${connectionId}/students/${studentId}/certificate-url`,
        { headers: headers() }
      );
      if (!res.ok) throw new Error("Failed to get certificate URL");
      const data = await res.json();
      window.open(data.url, "_blank");
    } catch (err) {
      console.error("Failed to view certificate:", err);
    }
  };

  const handleDownloadCertificate = async (connectionId: string, studentId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/external-system/connections/${connectionId}/students/${studentId}/certificate`,
        { headers: headers() }
      );
      if (!res.ok) throw new Error("Failed to download certificate");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download certificate:", err);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-MY", {
        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Server className="text-blue-600" strokeWidth={2.5} />
              External System Integration
            </h2>
            <p className="text-slate-600 font-medium mt-2">
              Connect to institutional data sources for automated credential issuance.
            </p>
          </div>
          {!connectionsLoading && connections.length > 0 && (
            <button
              onClick={() => { setShowAddForm((prev) => !prev); setConnectError(null); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all text-sm shrink-0"
            >
              <Plus size={16} />
              Add System
            </button>
          )}
        </div>

        {/* Success Banner */}
        <AnimatePresence>
          {connectSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm"
            >
              <CheckCircle size={16} className="shrink-0" />
              System connected successfully!
              <button onClick={() => setConnectSuccess(false)} className="ml-auto text-emerald-400/60 hover:text-emerald-400">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add System Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-slate-900 font-bold flex items-center gap-2">
                    <Plus size={18} className="text-blue-600" />
                    Connect New System
                  </h3>
                  <button onClick={() => { setShowAddForm(false); setConnectError(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* System Name */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">System Name</label>
                    <input
                      type="text"
                      value={formData.system_name}
                      onChange={(e) => setFormData((f) => ({ ...f, system_name: e.target.value }))}
                      placeholder="e.g. MMU Student Records"
                      className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm font-medium"
                    />
                  </div>

                  {/* Endpoint URL */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Endpoint URL</label>
                    <input
                      type="text"
                      value={formData.endpoint_url}
                      onChange={(e) => setFormData((f) => ({ ...f, endpoint_url: e.target.value }))}
                      placeholder="https://your-sis-api.example.com"
                      className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm font-mono font-medium"
                    />
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">API Key</label>
                    <input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData((f) => ({ ...f, api_key: e.target.value }))}
                      placeholder="Enter the API key provided by the system"
                      className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm font-medium"
                    />
                  </div>

                  {/* Error */}
                  {connectError && (
                    <div className="flex items-center gap-2 text-red-700 text-sm font-bold bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 shadow-sm">
                      <AlertCircle size={14} className="shrink-0" strokeWidth={2.5} />
                      {connectError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => { setShowAddForm(false); setConnectError(null); }}
                      className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 transition-colors shadow-sm text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddConnection}
                      disabled={connecting || !formData.endpoint_url.trim() || !formData.api_key.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 text-white rounded-xl font-bold shadow-sm transition-all text-sm"
                    >
                      {connecting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Testing connection...
                        </>
                      ) : (
                        <>
                          <ExternalLink size={14} />
                          Test &amp; Connect
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        {connectionsLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 size={20} className="animate-spin" />
            Loading connections...
          </div>
        ) : connectionsError ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <AlertCircle size={36} className="mx-auto mb-3 text-red-600 opacity-60" strokeWidth={2.5} />
            <p className="text-red-600 font-bold mb-4">{connectionsError}</p>
            <button
              onClick={loadConnections}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 transition-colors shadow-sm text-sm inline-flex items-center gap-2"
            >
              <RefreshCw size={14} strokeWidth={2.5} /> Retry
            </button>
          </div>
        ) : connections.length === 0 && !showAddForm ? (
          /* Empty State */
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="inline-flex p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-5">
              <Server size={40} className="text-slate-400" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-heading font-extrabold text-slate-900 mb-2">No External Systems Connected</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-6 text-sm leading-relaxed">
              Connect to institutional systems like Student Information Systems to enable bulk credential issuance and automated data retrieval.
            </p>
            <button
              onClick={() => { setShowAddForm(true); setConnectError(null); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              Connect Your First System
            </button>
          </div>
        ) : (
          /* Connected Systems List */
          <div className="space-y-4">
            {connections.map((conn) => (
              <motion.div
                key={conn.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-slate-900 font-bold text-base leading-snug">{conn.system_name}</h3>
                        <p className="text-blue-600 font-medium text-xs font-mono mt-1 break-all">{conn.endpoint_url}</p>
                        <p className="text-slate-500 font-medium text-xs mt-1">Connected {formatDate(conn.connected_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* View Students Toggle */}
                      <button
                        onClick={() => toggleExpand(conn.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors shadow-sm"
                      >
                        <Database size={13} />
                        {expandedSystem === conn.id ? (
                          <>Hide Students <ChevronUp size={13} /></>
                        ) : (
                          <>View Students <ChevronDown size={13} /></>
                        )}
                      </button>

                      {/* Disconnect */}
                      {disconnectConfirm === conn.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDisconnectConfirm(null)}
                            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDisconnect(conn.id)}
                            disabled={disconnecting === conn.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            {disconnecting === conn.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDisconnectConfirm(conn.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-red-200"
                        >
                          <Trash2 size={13} />
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Student Preview */}
                <AnimatePresence>
                  {expandedSystem === conn.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-200 bg-slate-50 pb-2">
                        {/* Data Governance Banner */}
                        <div className="mx-5 mt-4 mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-3 shadow-sm">
                          <ShieldCheck className="text-purple-600 shrink-0" size={16} strokeWidth={2.5} />
                          <p className="text-xs text-purple-800 font-medium">
                            <strong>Data Governance:</strong> Data retrieved from this external system is treated as authoritative. It cannot be modified within IdenVault.
                          </p>
                        </div>

                        {studentsLoading[conn.id] ? (
                          <div className="flex items-center justify-center py-12 text-slate-500 gap-3 text-sm font-bold">
                            <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                            Fetching student records...
                          </div>
                        ) : studentsError[conn.id] ? (
                          <div className="m-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2 text-red-700 text-sm font-bold">
                              <AlertCircle size={14} strokeWidth={2.5} /> {studentsError[conn.id]}
                            </div>
                            <button
                              onClick={() => fetchStudents(conn.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors shadow-sm"
                            >
                              <RefreshCw size={12} strokeWidth={2.5} /> Retry
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Header Bar */}
                            <div className="flex items-center justify-between px-5 mb-2 mt-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Lock size={11} strokeWidth={2.5} />
                                Read-Only Access Granted
                              </div>
                              <button
                                onClick={() => fetchStudents(conn.id)}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                              >
                                <RefreshCw size={12} strokeWidth={2.5} /> Refresh
                              </button>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto mx-5 bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="px-5 py-3">Student ID</th>
                                    <th className="px-5 py-3">Full Name</th>
                                    <th className="px-5 py-3">Programme</th>
                                    <th className="px-5 py-3">CGPA</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Certificate</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-slate-600">
                                  {(students[conn.id] || []).map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-5 py-3 font-mono text-blue-600 font-bold text-xs">{student.id}</td>
                                      <td className="px-5 py-3 font-bold text-slate-900 text-sm">{student.name}</td>
                                      <td className="px-5 py-3 text-xs font-medium">{student.program}</td>
                                      <td className="px-5 py-3 text-xs font-bold">{student.gpa}</td>
                                      <td className="px-5 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                          student.status === "Graduated"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-green-50 text-green-700 border-green-200"
                                        }`}>
                                          <CheckCircle size={9} strokeWidth={2.5} /> {student.status}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3">
                                        {student.has_certificate ? (
                                          <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">
                                              Available
                                            </span>
                                            <button
                                              onClick={() => handleViewCertificate(conn.id, student.id)}
                                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                              title="View certificate"
                                            >
                                              <Eye size={13} strokeWidth={2.5} />
                                            </button>
                                            <button
                                              onClick={() => handleDownloadCertificate(conn.id, student.id)}
                                              className="p-1 text-slate-400 hover:text-green-600 transition-colors"
                                              title="Download certificate"
                                            >
                                              <Download size={13} strokeWidth={2.5} />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                                            None
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs font-bold text-slate-500 rounded-b-2xl">
                              Showing {(students[conn.id] || []).length} records from {conn.system_name}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Modal (for small screens / accessibility) */}
      {/* Inline confirmation is used in the cards above */}
    </RequireAuth>
  );
}

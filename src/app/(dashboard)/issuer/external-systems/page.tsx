"use client";

import { useState } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { 
  Server, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Database, 
  Lock, 
  RefreshCw,
  ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data from "External System" (Mixed Degrees as requested)
const mockExternalData = [
  { id: "EXT-001", name: "Ali Bin Abu", program: "Bachelor of Computer Science", gpa: "3.85", status: "Active" },
  { id: "EXT-002", name: "Sarah Lee", program: "Bachelor of Information Technology", gpa: "3.92", status: "Active" },
  { id: "EXT-003", name: "Muthu Sami", program: "Bachelor of Software Engineering", gpa: "3.67", status: "Active" },
  { id: "EXT-004", name: "Ah Chong", program: "Bachelor of Computer Science", gpa: "3.50", status: "Active" },
  { id: "EXT-005", name: "Jessica Tan", program: "Bachelor of Data Science", gpa: "3.98", status: "Active" },
];

export default function ExternalSystemsPage() {
  // Connection States: 'disconnected' | 'connecting' | 'verifying' | 'connected'
  const [status, setStatus] = useState("disconnected");

  const handleConnect = () => {
    setStatus("connecting");
    
    // Step 1: Simulate Network Handshake (1.5s)
    setTimeout(() => {
        setStatus("verifying");
        
        // Step 2: Simulate API Key Verification (1.5s)
        setTimeout(() => {
            setStatus("connected");
        }, 1500);
    }, 1500);
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <Server className="text-blue-500" />
                External System Integration
            </h2>
            <p className="text-slate-400 mt-2">
                Configure trusted data sources for automated credential issuance. 
                <span className="text-xs ml-2 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">
                    PROTOTYPE MODE
                </span>
            </p>
        </div>

        {/* Connection Control Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Status Indicator Stripe */}
            <div className={`absolute top-0 left-0 w-1 h-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-slate-700'}`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-4">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Student Information System (SIS)</h3>
                    <p className="text-sm text-slate-400">Endpoint: <code className="font-mono bg-black/30 px-1 py-0.5 rounded text-blue-400">api.university.edu.my/v1/records</code></p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        status === 'connected' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : status === 'disconnected'
                                ? 'bg-slate-800 border-slate-700 text-slate-400'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                        {status === 'connected' && <CheckCircle size={16} />}
                        {status === 'disconnected' && <AlertCircle size={16} />}
                        {(status === 'connecting' || status === 'verifying') && <Loader2 size={16} className="animate-spin" />}
                        
                        <span className="uppercase tracking-wider text-xs">
                            {status === 'connecting' && "Handshaking..."}
                            {status === 'verifying' && "Verifying Keys..."}
                            {status === 'connected' && "System Connected"}
                            {status === 'disconnected' && "Not Connected"}
                        </span>
                    </div>

                    {/* Connect Button */}
                    {status === 'disconnected' && (
                        <button
                            onClick={handleConnect}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
                        >
                            Connect System
                        </button>
                    )}
                    
                    {status === 'connected' && (
                        <button
                            onClick={() => setStatus("disconnected")}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium border border-slate-700 transition-all"
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Data Preview Section (Only shows when connected) */}
        <AnimatePresence>
            {status === 'connected' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Database size={20} className="text-purple-500" />
                            Retrieved Academic Records
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                             <Lock size={12} />
                             Read-Only Access Granted
                        </div>
                    </div>

                    {/* NEW: Authoritative Data Banner */}
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-purple-400 shrink-0" size={18} />
                        <p className="text-sm text-purple-200">
                            <strong>Data Governance:</strong> Data retrieved from this external system is treated as authoritative. It cannot be modified within IdenVault to ensure integrity.
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Student ID</th>
                                        <th className="px-6 py-4">Full Name</th>
                                        <th className="px-6 py-4">Program</th>
                                        <th className="px-6 py-4">CGPA</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {mockExternalData.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-blue-400">{student.id}</td>
                                            <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                                            <td className="px-6 py-4">{student.program}</td>
                                            <td className="px-6 py-4">{student.gpa}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                                                    <CheckCircle size={10} /> {student.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
                            Showing 5 sample records from external database
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </RequireAuth>
  );
}
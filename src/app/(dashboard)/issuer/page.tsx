"use client";

import { useState, useEffect } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { Search, ShieldCheck, FileText, Ban, Plus, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Credential {
  id: string;
  ref_id: string;
  student_wallet: string;
  title: string;
  status: string;
  issued_at: string;
}

export default function IssuerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { walletAddress } = useAuth();

  useEffect(() => {
    if (!walletAddress) return;

    const fetchCredentials = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/credentials?role=issuer`, {
          headers: { "x-wallet-address": walletAddress },
        });
        if (!res.ok) throw new Error("Failed to fetch credentials");
        const data = await res.json();
        setCredentials(data.credentials || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [walletAddress]);

  const filteredCredentials = credentials.filter((cred) =>
    cred.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.student_wallet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RequireAuth allowedRole="issuer">
      <div className="space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Issued Credentials</h2>
            <p className="text-slate-400 mt-1">Manage and track certificates issued by your institution.</p>
            <p className="text-xs text-slate-500 mt-2">
              Issuer actions are subject to administrative approval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
            <button
              onClick={() => router.push("/issuer/issue")}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-900/30 whitespace-nowrap"
            >
              <Plus size={16} /> Issue New
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 size={20} className="animate-spin" />
            Loading credentials...
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <FileText size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No credentials issued yet</p>
            <p className="text-sm mt-1">Issue your first credential to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCredentials.map((cred, i) => (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                    <ShieldCheck className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{cred.title}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{cred.ref_id}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Issued: {new Date(cred.issued_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                    cred.status === "revoked"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {cred.status === "revoked" ? <Ban size={12} /> : <ShieldCheck size={12} />}
                    {cred.status === "revoked" ? "Revoked" : "Active"}
                  </div>
                  <button
                    onClick={() => router.push(`/issuer/credentials/${cred.ref_id}`)}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
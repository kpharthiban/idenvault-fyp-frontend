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
            <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Issued Credentials</h2>
            <p className="text-slate-600 mt-1 font-medium">Manage and track certificates issued by your institution.</p>
            <p className="text-[13px] text-slate-500 mt-2 font-medium">
              Issuer actions are subject to administrative approval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm transition-all"
              />
            </div>
            <button
              onClick={() => router.push("/issuer/issue")}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:-translate-y-[1px] active:translate-y-0 active:shadow-none whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} /> Issue New
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3 font-medium">
            <Loader2 size={20} className="animate-spin text-green-600" />
            Loading credentials...
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium shadow-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <FileText size={48} className="mx-auto mb-4 opacity-20 text-slate-900" />
            <p className="font-bold text-lg text-slate-900">No credentials issued yet</p>
            <p className="text-[15px] mt-1">Issue your first credential to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCredentials.map((cred, i) => (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-sm shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-green-50 border border-green-100 rounded-xl">
                    <ShieldCheck className="text-green-600 w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="pt-0.5">
                    <p className="font-bold text-slate-900">{cred.title}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded inline-block">{cred.ref_id}</p>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">
                      Issued: {new Date(cred.issued_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    cred.status === "revoked"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {cred.status === "revoked" ? <Ban size={12} strokeWidth={2.5} /> : <ShieldCheck size={12} strokeWidth={2.5} />}
                    {cred.status === "revoked" ? "REVOKED" : "ACTIVE"}
                  </div>
                  <button
                    onClick={() => router.push(`/issuer/credentials/${cred.ref_id}`)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm"
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
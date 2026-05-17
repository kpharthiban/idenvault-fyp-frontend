"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { Search, Eye, CheckCircle, Shield, Award, User, Clock, Loader2, AlertCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Credential {
  id: string;
  ref_id: string;
  title: string;
  issuer_wallet: string;
  issued_at: string;
  expires_at: string | null;
  status: string;
  type?: string;
}

const getTypeIcon = (title: string) => {
  if (title.toLowerCase().includes("award") || title.toLowerCase().includes("dean"))
    return <Award size={24} />;
  if (title.toLowerCase().includes("identification") || title.toLowerCase().includes("status"))
    return <User size={24} />;
  return <Shield size={24} />;
};

const getTypeColor = (title: string) => {
  if (title.toLowerCase().includes("award") || title.toLowerCase().includes("dean"))
    return "bg-purple-500/10 text-purple-400";
  if (title.toLowerCase().includes("identification") || title.toLowerCase().includes("status"))
    return "bg-blue-500/10 text-blue-400";
  return "bg-emerald-500/10 text-emerald-400";
};

export default function StudentDashboard() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    const fetchCredentials = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/credentials`, {
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
    cred.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RequireAuth allowedRole="student">
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">My Wallet</h2>
            <p className="text-slate-400 mt-1">Your verified academic credentials, anchored on blockchain.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 size={20} className="animate-spin" /> Loading your credentials...
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertCircle size={18} /> {error}
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <FileText size={40} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-500 font-medium">No credentials found</p>
            <p className="text-slate-600 text-sm mt-1">
              {searchTerm ? "Try a different search term" : "No credentials have been issued to your wallet yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCredentials.map((cred, i) => (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all group cursor-pointer"
                onClick={() => router.push(`/student/credentials/${cred.ref_id}`)}
              >
                <div>
                  {/* Icon + Status */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-2.5 rounded-xl ${getTypeColor(cred.title)}`}>
                      {getTypeIcon(cred.title)}
                    </div>
                    <div className={`px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      cred.status === "revoked"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}>
                      <CheckCircle size={11} />
                      {cred.status === "revoked" ? "Revoked" : "Active"}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-white mb-1 group-hover:text-blue-200 transition-colors line-clamp-2">
                    {cred.title}
                  </h3>

                  {/* Issuer wallet (truncated) */}
                  <p className="text-xs text-slate-500 font-mono mb-3">
                    {cred.issuer_wallet.slice(0, 6)}...{cred.issuer_wallet.slice(-4)}
                  </p>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} />
                    {new Date(cred.issued_at).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric"
                    })}
                  </div>
                </div>

                {/* View button */}
                <button className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700 hover:border-slate-600">
                  <Eye size={16} /> View Details & Share
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
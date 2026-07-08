"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { Search, Eye, CheckCircle, Shield, Award, User, Clock, Loader2, AlertCircle, FileText, Ban } from "lucide-react";
import { motion } from "framer-motion";

import { isExpired as checkExpired } from "@/lib/expiry";

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
    return "bg-purple-50 text-purple-600 border border-purple-100";
  if (title.toLowerCase().includes("identification") || title.toLowerCase().includes("status"))
    return "bg-blue-50 text-blue-600 border border-blue-100";
  return "bg-green-50 text-green-600 border border-green-100";
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
            <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">My Wallet</h2>
            <p className="text-slate-600 mt-1 font-medium">Your verified academic credentials, anchored on blockchain.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 gap-3 font-medium">
            <Loader2 size={20} className="animate-spin text-blue-600" /> Loading your credentials...
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium shadow-sm">
            <AlertCircle size={18} /> {error}
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <FileText size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="text-slate-900 font-bold text-lg">No credentials found</p>
            <p className="text-slate-500 text-[15px] mt-1 font-medium">
              {searchTerm ? "Try a different search term" : "No credentials have been issued to your wallet yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredentials.map((cred, i) => (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md shadow-sm transition-all group cursor-pointer"
                onClick={() => router.push(`/student/credentials/${cred.ref_id}`)}
              >
                <div>
                  {/* Icon + Status */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-2.5 rounded-xl ${getTypeColor(cred.title)}`}>
                      {getTypeIcon(cred.title)}
                    </div>
                    {(() => {
                      const isExpired = checkExpired(cred.expires_at);
                      return (
                        <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          cred.status === "revoked"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : isExpired
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-green-50 border-green-200 text-green-700"
                        }`}>
                          {cred.status === "revoked"
                            ? <Ban size={11} strokeWidth={2.5} />
                            : isExpired
                              ? <Clock size={11} strokeWidth={2.5} />
                              : <CheckCircle size={11} strokeWidth={2.5} />}
                          {cred.status === "revoked" ? "REVOKED" : isExpired ? "EXPIRED" : "ACTIVE"}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {cred.title}
                  </h3>

                  {/* Issuer wallet (truncated) */}
                  <p className="text-xs text-slate-600 font-mono mb-4 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md inline-block font-medium">
                    {cred.issuer_wallet.slice(0, 6)}...{cred.issuer_wallet.slice(-4)}
                  </p>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock size={12} />
                    Issued on {new Date(cred.issued_at).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric"
                    })}
                  </div>
                </div>

                {/* View button */}
                <button className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all border border-slate-200 hover:border-slate-300 shadow-sm">
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
"use client";

import { useState } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Ban, 
  CheckCircle, 
  Building2, 
  Wallet,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

// Mock Data
const mockIssuers = [
  {
    id: "ISSUER-MMU",
    name: "Multimedia University",
    wallet: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    allowed: true,
    region: "Cyberjaya, MY",
  },
  {
    id: "ISSUER-UM",
    name: "Universiti Malaya",
    wallet: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    allowed: true,
    region: "Kuala Lumpur, MY",
  },
  {
    id: "ISSUER-FAKE",
    name: "Diploma Mill Institute",
    wallet: "0x8888888888888888888888888888888888888888",
    allowed: false,
    region: "Unknown",
  },
];

export default function AdminDashboard() {
  const [issuers, setIssuers] = useState(mockIssuers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIssuers = issuers.filter((issuer) =>
    issuer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issuer.wallet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAllowlist = (id: string) => {
    // In a real app, this would call a Smart Contract function: setIssuerStatus(address, bool)
    setIssuers((prev) =>
      prev.map((issuer) =>
        issuer.id === id
          ? { ...issuer, allowed: !issuer.allowed }
          : issuer
      )
    );
  };

  return (
    <RequireAuth allowedRole="admin">
      <div className="space-y-8">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <ShieldAlert size={24} />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">System Governance</h2>
            </div>
            <p className="text-slate-400">Manage the allowlist of authorized academic institutions.</p>
          </div>

          {/* Mini Stats Card */}
          <div className="flex items-center gap-6 bg-slate-900 border border-slate-800 p-4 rounded-xl">
             <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold">Total Issuers</p>
                <p className="text-xl font-mono text-white">{issuers.length}</p>
             </div>
             <div className="w-px h-8 bg-slate-800" />
             <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold">Active</p>
                <p className="text-xl font-mono text-emerald-400">
                    {issuers.filter(i => i.allowed).length}
                </p>
             </div>
             <div className="w-px h-8 bg-slate-800" />
             <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold">System Status</p>
                <div className="flex items-center gap-1.5 justify-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Online</span>
                </div>
             </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search issuers by name or wallet address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
        </div>

        {/* Issuers Grid */}
        <div className="grid gap-4">
          {filteredIssuers.map((issuer, index) => (
            <motion.div
              key={issuer.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`group flex flex-col md:flex-row items-center justify-between p-5 rounded-xl border transition-all ${
                  issuer.allowed 
                    ? "bg-slate-900/50 border-slate-800 hover:border-purple-500/30" 
                    : "bg-red-950/10 border-red-900/20"
              }`}
            >
              {/* Left: Info */}
              <div className="flex items-start gap-4 w-full md:w-auto mb-4 md:mb-0">
                <div className={`p-3 rounded-lg transition-colors ${
                    issuer.allowed ? "bg-slate-800 text-purple-400" : "bg-red-900/20 text-red-500"
                }`}>
                  <Building2 size={24} />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-semibold ${issuer.allowed ? "text-white" : "text-slate-300"}`}>
                        {issuer.name}
                    </h3>
                    {!issuer.allowed && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                            Blocked
                        </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <Wallet size={12} />
                        {issuer.wallet}
                    </div>
                    <p className="text-xs text-slate-600">{issuer.region}</p>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                <div className="text-right hidden md:block mr-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Authorization</p>
                    <div className={`flex items-center gap-1.5 justify-end text-sm font-medium ${
                        issuer.allowed ? "text-emerald-400" : "text-red-400"
                    }`}>
                        {issuer.allowed ? <CheckCircle size={14} /> : <Ban size={14} />}
                        {issuer.allowed ? "Authorized Issuer" : "Access Revoked"}
                    </div>
                </div>

                <button
                    onClick={() => toggleAllowlist(issuer.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                        issuer.allowed
                            ? "bg-slate-800 text-red-400 border-slate-700 hover:bg-red-950/30 hover:border-red-500/30 hover:text-red-300"
                            : "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 hover:border-emerald-600 shadow-lg shadow-emerald-900/20"
                    }`}
                >
                    {issuer.allowed ? (
                        <>
                            <Ban size={16} /> Block Access
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={16} /> Approve
                        </>
                    )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
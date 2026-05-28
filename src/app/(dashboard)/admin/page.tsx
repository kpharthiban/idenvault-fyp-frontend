"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  Search, ShieldAlert, ShieldCheck, Ban, CheckCircle,
  Wallet, Activity, Plus, Loader2, AlertCircle, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS!;
const REGISTRY_ABI = [
  "function registerIssuer(address issuer) external",
  "function revokeIssuer(address issuer) external",
  "function isIssuerTrusted(address issuer) external view returns (bool)",
  "event IssuerRegistered(address indexed issuer)",
  "event IssuerRevoked(address indexed issuer)",
];

interface IssuerEntry {
  wallet: string;
  trusted: boolean;
  action?: "registering" | "revoking";
}

export default function AdminDashboard() {
  const { walletAddress } = useAuth();

  const [issuers, setIssuers] = useState<IssuerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newWallet, setNewWallet] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ wallet: string; action: "revoke" | "register" } | null>(null);
  const [profiles, setProfiles] = useState<Record<string, { institution: string; institution_type: string; department: string; website: string; address: string }>>({});

  // Load issuer history from contract events
  useEffect(() => {
    const loadIssuers = async () => {
      try {
        setLoading(true);
        const provider = new ethers.JsonRpcProvider(
          `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`
        );
        const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

        // Read all IssuerRegistered events to build the list
        const registerFilter = contract.filters.IssuerRegistered();
        const events = await contract.queryFilter(registerFilter);

        // Deduplicate wallet addresses
        const wallets = [...new Set(events.map((e: any) => e.args.issuer.toLowerCase()))];

        // Check current trust status for each
        const entries: IssuerEntry[] = await Promise.all(
          wallets.map(async (wallet) => {
            const trusted = await contract.isIssuerTrusted(wallet);
            return { wallet, trusted };
          })
        );

        setIssuers(entries);
      } catch (err: any) {
        setError("Failed to load issuer registry from blockchain.");
      } finally {
        setLoading(false);
      }
    };
    loadIssuers();
  }, []);

  // Fetch issuer profiles from backend once issuers are loaded
  useEffect(() => {
    if (issuers.length === 0 || !walletAddress) return;
    const fetchProfiles = async () => {
      try {
        const wallets = issuers.map(i => i.wallet);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/issuer-profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-wallet-address": walletAddress || "" },
          body: JSON.stringify({ wallets }),
        });
        if (!res.ok) throw new Error("Failed to fetch profiles");
        const data = await res.json();
        setProfiles(data.profiles || {});
      } catch (err) {
        console.error("Failed to fetch issuer profiles:", err);
      }
    };
    fetchProfiles();
  }, [issuers, walletAddress]);

  const handleRegister = async (walletToRegister: string) => {
    if (!ethers.isAddress(walletToRegister)) {
      setRegisterError("Invalid Ethereum address.");
      return;
    }
    setRegistering(true);
    setRegisterError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
      const tx = await contract.registerIssuer(walletToRegister);
      await tx.wait();

      setIssuers(prev => {
        const exists = prev.find(i => i.wallet === walletToRegister.toLowerCase());
        if (exists) return prev.map(i => i.wallet === walletToRegister.toLowerCase() ? { ...i, trusted: true } : i);
        return [...prev, { wallet: walletToRegister.toLowerCase(), trusted: true }];
      });
      setNewWallet("");
      setShowConfirm(null);
    } catch (err: any) {
      const msg = err?.code === "ACTION_REJECTED" ? "MetaMask transaction rejected." : err.message;
      setRegisterError(msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleRevoke = async (walletToRevoke: string) => {
    setIssuers(prev => prev.map(i => i.wallet === walletToRevoke ? { ...i, action: "revoking" } : i));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
      const tx = await contract.revokeIssuer(walletToRevoke);
      await tx.wait();
      setIssuers(prev => prev.map(i => i.wallet === walletToRevoke ? { ...i, trusted: false, action: undefined } : i));
      setShowConfirm(null);
    } catch (err: any) {
      setIssuers(prev => prev.map(i => i.wallet === walletToRevoke ? { ...i, action: undefined } : i));
    }
  };

  const filtered = issuers.filter(i => {
    const term = searchTerm.toLowerCase();
    if (i.wallet.toLowerCase().includes(term)) return true;
    const profile = profiles[i.wallet];
    if (profile?.institution?.toLowerCase().includes(term)) return true;
    return false;
  });
  const trustedCount = issuers.filter(i => i.trusted).length;

  return (
    <RequireAuth allowedRole="admin">
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <ShieldAlert size={24} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">System Governance</h2>
            </div>
            <p className="text-slate-400">Manage trusted issuer institutions on the blockchain.</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total</p>
              <p className="text-2xl font-bold text-white">{issuers.length}</p>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Trusted</p>
              <p className="text-2xl font-bold text-emerald-400">{trustedCount}</p>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Revoked</p>
              <p className="text-2xl font-bold text-red-400">{issuers.length - trustedCount}</p>
            </div>
          </div>
        </div>

        {/* Register new issuer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-1 flex items-center gap-2">
            <Plus size={18} className="text-emerald-400" /> Register New Issuer
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Enter the wallet address of the institution to grant issuer trust on-chain.
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={newWallet}
                onChange={(e) => { setNewWallet(e.target.value); setRegisterError(null); }}
                placeholder="0x..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm"
              />
            </div>
            <button
              onClick={() => {
                if (!ethers.isAddress(newWallet)) { setRegisterError("Invalid address."); return; }
                setShowConfirm({ wallet: newWallet, action: "register" });
              }}
              disabled={registering || !newWallet.trim()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {registering ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Register
            </button>
          </div>
          {registerError && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={14} /> {registerError}
            </div>
          )}
        </div>

        {/* Issuer list */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Activity size={18} className="text-purple-400" /> Issuer Registry
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search wallet or institution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 size={20} className="animate-spin" /> Reading from blockchain...
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 m-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <AlertCircle size={18} /> {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <ShieldAlert size={36} className="mx-auto mb-3 opacity-30" />
              <p>No issuers registered yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filtered.map((issuer, i) => (
                <motion.div
                  key={issuer.wallet}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${issuer.trusted ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                      {issuer.trusted ? <ShieldCheck size={20} /> : <Ban size={20} />}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-700/60 rounded-lg px-3 py-1 font-mono text-xs text-slate-300 break-all">
                          <Wallet size={12} className="text-slate-500 shrink-0" />
                          {issuer.wallet}
                        </span>
                        {issuer.wallet.toLowerCase() === walletAddress?.toLowerCase() && (
                          <span className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                      </div>
                      {profiles[issuer.wallet] ? (
                        <div className="pl-0.5">
                          <p className="text-white font-semibold text-sm leading-snug">
                            {profiles[issuer.wallet].institution}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                            {[profiles[issuer.wallet].institution_type, profiles[issuer.wallet].department, profiles[issuer.wallet].address].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic pl-0.5">No profile registered</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 md:mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      issuer.trusted
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {issuer.trusted ? "TRUSTED" : "REVOKED"}
                    </span>

                    {/* Don't allow admin to toggle their own wallet */}
                    {issuer.wallet.toLowerCase() !== walletAddress?.toLowerCase() && (
                      issuer.trusted ? (
                        <button
                          onClick={() => setShowConfirm({ wallet: issuer.wallet, action: "revoke" })}
                          disabled={issuer.action === "revoking"}
                          className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {issuer.action === "revoking"
                            ? <><Loader2 size={12} className="animate-spin" /> Revoking...</>
                            : <><Ban size={12} /> Revoke</>}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowConfirm({ wallet: issuer.wallet, action: "register" })}
                          className="px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle size={12} /> Re-trust
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full mb-4 ${showConfirm.action === "revoke" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {showConfirm.action === "revoke" ? "Revoke Issuer Trust?" : "Register Issuer?"}
              </h3>
              <p className="text-sm text-slate-400 mb-2">
                {showConfirm.action === "revoke"
                  ? "This will prevent this wallet from issuing new credentials. All existing credentials will fail verification."
                  : "This will grant issuer trust to this wallet on-chain."}
              </p>
              <p className="font-mono text-xs text-slate-500 bg-slate-950 px-3 py-2 rounded-lg mb-6 break-all">
                {showConfirm.wallet}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => showConfirm.action === "revoke"
                    ? handleRevoke(showConfirm.wallet)
                    : handleRegister(showConfirm.wallet)}
                  disabled={registering}
                  className={`flex-1 py-2.5 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    showConfirm.action === "revoke"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {registering
                    ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
                    : showConfirm.action === "revoke" ? "Yes, Revoke" : "Yes, Register"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </RequireAuth>
  );
}
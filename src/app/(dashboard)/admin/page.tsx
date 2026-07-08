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
import { REGISTRY_ADDRESS, REGISTRY_ABI, SEPOLIA_RPC_URL } from "@/config/contracts";

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
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
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
        console.error("Failed to load issuer registry:", err);
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
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-purple-600">
                <ShieldAlert size={24} strokeWidth={2.5} />
              </div>
              <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">System Governance</h2>
            </div>
            <p className="text-slate-600 font-medium">Manage trusted issuer institutions on the blockchain.</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 bg-white border border-slate-200 shadow-sm p-4 rounded-2xl">
            <div className="text-center">
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-slate-900">{issuers.length}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Trusted</p>
              <p className="text-2xl font-bold text-green-600">{trustedCount}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Revoked</p>
              <p className="text-2xl font-bold text-red-600">{issuers.length - trustedCount}</p>
            </div>
          </div>
        </div>

        {/* Register new issuer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h3 className="text-slate-900 font-heading text-lg font-bold mb-1 flex items-center gap-2">
            <Plus size={20} className="text-green-600" strokeWidth={2.5} /> Register New Issuer
          </h3>
          <p className="text-slate-600 text-sm mb-5 font-medium">
            Enter the wallet address of the institution to grant issuer trust on-chain.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={newWallet}
                onChange={(e) => { setNewWallet(e.target.value); setRegisterError(null); }}
                placeholder="0x..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-mono text-sm transition-all"
              />
            </div>
            <button
              onClick={() => {
                if (!ethers.isAddress(newWallet)) { setRegisterError("Invalid address."); return; }
                setShowConfirm({ wallet: newWallet, action: "register" });
              }}
              disabled={registering || !newWallet.trim()}
              className="px-6 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-none whitespace-nowrap"
            >
              {registering ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
              Register
            </button>
          </div>
          {registerError && (
            <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
              <AlertCircle size={16} /> {registerError}
            </div>
          )}
        </div>

        {/* Issuer list */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 md:px-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-slate-900 font-heading text-lg font-bold flex items-center gap-2">
              <Activity size={20} className="text-purple-600" strokeWidth={2.5} /> Issuer Registry
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search wallet or institution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-3 font-medium">
              <Loader2 size={20} className="animate-spin text-purple-600" /> Reading from blockchain...
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 m-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <ShieldAlert size={40} className="mx-auto mb-3 opacity-20 text-slate-900" />
              <p className="font-medium text-slate-600">No issuers registered yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((issuer, i) => (
                <motion.div
                  key={issuer.wallet}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-5 md:px-8 py-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${issuer.trusted ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                      {issuer.trusted ? <ShieldCheck size={20} strokeWidth={2.5} /> : <Ban size={20} strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0 space-y-2 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-0.5 font-mono text-xs text-slate-600 break-all font-medium">
                          <Wallet size={12} className="text-slate-400 shrink-0" />
                          {issuer.wallet}
                        </span>
                        {issuer.wallet.toLowerCase() === walletAddress?.toLowerCase() && (
                          <span className="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5 text-[10px] font-bold text-yellow-700 uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                      </div>
                      {profiles[issuer.wallet] ? (
                        <div className="pl-0.5 mt-2">
                          <p className="text-slate-900 font-bold text-sm leading-snug">
                            {profiles[issuer.wallet].institution}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                            {[profiles[issuer.wallet].institution_type, profiles[issuer.wallet].department, profiles[issuer.wallet].address].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic pl-0.5 mt-2">No profile registered</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 md:mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                      issuer.trusted
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      {issuer.trusted ? "TRUSTED" : "REVOKED"}
                    </span>

                    {/* Don't allow admin to toggle their own wallet */}
                    {issuer.wallet.toLowerCase() !== walletAddress?.toLowerCase() && (
                      issuer.trusted ? (
                        <button
                          onClick={() => setShowConfirm({ wallet: issuer.wallet, action: "revoke" })}
                          disabled={issuer.action === "revoking"}
                          className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {issuer.action === "revoking"
                            ? <><Loader2 size={14} className="animate-spin" /> Revoking...</>
                            : <><Ban size={14} /> Revoke</>}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowConfirm({ wallet: issuer.wallet, action: "register" })}
                          className="px-4 py-2 bg-white hover:bg-green-50 text-green-700 border border-slate-200 hover:border-green-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle size={14} /> Re-trust
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full shadow-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-5 ${showConfirm.action === "revoke" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-heading font-extrabold text-slate-900 mb-2">
                {showConfirm.action === "revoke" ? "Revoke Issuer Trust?" : "Register Issuer?"}
              </h3>
              <p className="text-[15px] font-medium text-slate-600 mb-4">
                {showConfirm.action === "revoke"
                  ? "This will prevent this wallet from issuing new credentials. All existing credentials will fail verification."
                  : "This will grant issuer trust to this wallet on-chain."}
              </p>
              <p className="font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg mb-8 break-all font-medium w-full">
                {showConfirm.wallet}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => showConfirm.action === "revoke"
                    ? handleRevoke(showConfirm.wallet)
                    : handleRegister(showConfirm.wallet)}
                  disabled={registering}
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-[1px] ${
                    showConfirm.action === "revoke"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {registering
                    ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
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
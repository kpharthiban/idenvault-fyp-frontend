"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";
import { 
  ArrowLeft, 
  Wallet, 
  ShieldCheck, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";

export default function ConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const { connectWallet, isConnected, role } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = roleParam as UserRole;

  // Validate role from query
  useEffect(() => {
    if (selectedRole !== "student" && selectedRole !== "issuer") {
      router.replace("/");
    }
  }, [selectedRole, router]);

  // If already connected, redirect immediately
  useEffect(() => {
    if (isConnected && role) {
      router.replace(`/${role}`);
    }
  }, [isConnected, role, router]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
        await connectWallet(selectedRole);
        // Redirect handled by useEffect above
    } catch (err: any) {
        const msg = err.message || "Failed to connect wallet";
        // If user rejected in MetaMask, show a friendlier message
        if (err?.code === "ACTION_REJECTED" || msg.includes("user rejected")) {
          setError("Connection request was rejected in MetaMask.");
        } else {
          setError(msg);
        }
        setIsConnecting(false);
    }
  };

  const isStudent = selectedRole === "student";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 ${isStudent ? 'bg-blue-600' : 'bg-emerald-600'}`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Role Selection
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            
            {/* Top Border Accent */}
            <div className={`absolute top-0 left-0 w-full h-1 ${isStudent ? 'bg-blue-500' : 'bg-emerald-500'}`} />

            <div className="flex flex-col items-center text-center">
                <div className={`p-4 rounded-full mb-6 ${isStudent ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <Wallet size={40} />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Connect Wallet</h1>
                <p className="text-slate-400 mb-8">
                    You are initializing a secure session as a <br />
                    <span className={`font-mono font-medium uppercase tracking-wider ${isStudent ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {selectedRole}
                    </span>
                </p>

                {error && (
                    <div className="w-full mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-sm text-red-400 text-left">
                        <AlertCircle size={18} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed
                    ${isStudent 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    }`}
                >
                    {isConnecting ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Establishing Connection...
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={20} />
                            Connect MetaMask
                        </>
                    )}
                </button>

                <p className="mt-6 text-xs text-slate-500 max-w-xs">
                    By connecting, you agree to sign a cryptographic challenge to verify your identity.
                </p>
            </div>
        </div>
      </motion.div>
    </main>
  );
}
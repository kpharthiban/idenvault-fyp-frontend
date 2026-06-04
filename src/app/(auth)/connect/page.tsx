"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";
import { isMobile } from "@/lib/isMobile";
import {
  ArrowLeft,
  Wallet,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Smartphone
} from "lucide-react";
import { motion } from "framer-motion";

function ConnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const { connectWallet, isConnected, role } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const selectedRole = roleParam as UserRole;
  const needsDeepLink = isMobileDevice && typeof window !== "undefined" && !window.ethereum;

  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

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
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#F8F8F8] bg-dotgrid">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-60 ${isStudent ? 'bg-blue-100' : 'bg-emerald-100'}`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-50 rounded-full blur-[100px] opacity-60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md z-10"
      >
        <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors text-sm font-medium group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Role Selection
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
            
            {/* Top Border Accent */}
            <div className={`absolute top-0 left-0 w-full h-1 ${isStudent ? 'bg-blue-500' : 'bg-emerald-500'}`} />

            <div className="flex flex-col items-center text-center">
                <div className={`p-4 rounded-xl mb-6 border ${isStudent ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    <Wallet size={32} strokeWidth={2.5} />
                </div>

                <h1 className="font-heading text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Connect Wallet</h1>
                <p className="text-slate-600 mb-8 text-[15px]">
                    You are initializing a secure session as a <br />
                    <span className={`font-mono font-bold uppercase tracking-wider ${isStudent ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {selectedRole}
                    </span>
                </p>

                {needsDeepLink && (
                    <div className="w-full mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-sm text-blue-700 text-left">
                        <Smartphone size={18} className="shrink-0" />
                        <p>Tap the button below to open this page in MetaMask&apos;s browser.</p>
                    </div>
                )}

                {error && !needsDeepLink && (
                    <div className="w-full mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700 text-left">
                        <AlertCircle size={18} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-none
                    ${isStudent
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                    {isConnecting ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Establishing Connection...
                        </>
                    ) : needsDeepLink ? (
                        <>
                            <Smartphone size={18} strokeWidth={2.5} />
                            Open in MetaMask
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={18} strokeWidth={2.5} />
                            Connect MetaMask
                        </>
                    )}
                </button>

                <p className="mt-6 text-xs text-slate-400 max-w-xs">
                    By connecting, you agree to sign a cryptographic challenge to verify your identity.
                </p>
            </div>
        </div>
      </motion.div>
    </main>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </main>
    }>
      <ConnectContent />
    </Suspense>
  );
}
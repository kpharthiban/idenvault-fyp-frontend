"use client";

import Link from "next/link";
import { motion } from "framer-motion"; // Animation library
import { ShieldCheck, GraduationCap, Building2, ScanLine } from "lucide-react"; // Icons

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor (Subtle Glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-4xl text-center"
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
            <ShieldCheck className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Iden<span className="text-blue-500">Vault</span>
          </h1>
        </div>
        
        <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">
          The decentralized standard for academic credentials. Secure, verifiable, and owned by you.
        </p>

        {/* Role Selection Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Student Card */}
          <Link href="/connect?role=student" className="group">
            <motion.div 
              whileHover={{ y: -5 }}
              className="h-full p-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl text-left hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-300 shadow-xl"
            >
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <GraduationCap size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Student Portal</h2>
              <p className="text-slate-400 text-sm">
                Access your wallet to view, manage, and share your earned academic credentials.
              </p>
            </motion.div>
          </Link>

          {/* Issuer Card */}
          <Link href="/connect?role=issuer" className="group">
            <motion.div 
              whileHover={{ y: -5 }}
              className="h-full p-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl text-left hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all duration-300 shadow-xl"
            >
              <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Institution Portal</h2>
              <p className="text-slate-400 text-sm">
                Issue tamper-proof certificates directly to student wallets on the blockchain.
              </p>
            </motion.div>
          </Link>

          {/* Verifier Card */}
          <Link href="/verify" className="group">
            <motion.div 
              whileHover={{ y: -5 }}
              className="h-full p-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl text-left hover:border-purple-500/50 hover:bg-slate-900/80 transition-all duration-300 shadow-xl"
            >
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <ScanLine size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verify Credential</h2>
              <p className="text-slate-400 text-sm">
                Instantly verify the authenticity of a digital certificate using its reference ID or QR.
              </p>
            </motion.div>
          </Link>

        </div>
      </motion.div>
      
      {/* Footer Text */}
      <div className="absolute bottom-6 text-slate-600 text-sm font-mono">
        Secured by Ethereum • Built for MMU FYP
      </div>
    </main>
  );
}
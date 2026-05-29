"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, GraduationCap, Building2, ScanLine } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F8F8] bg-dotgrid flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor (Subtle Glows for light theme) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-100/50 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-4xl text-center"
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
            <ShieldCheck className="w-12 h-12 text-teal-600" strokeWidth={2.5} />
          </div>
          <h1 className="font-heading text-5xl font-extrabold text-slate-900">
            Iden<span className="text-teal-600">Vault</span>
          </h1>
        </div>
        
        <p className="text-slate-600 text-[15px] font-medium mb-12 max-w-xl mx-auto">
          The decentralized standard for academic credentials. Secure, verifiable, and owned by you.
        </p>

        {/* Role Selection Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Issuer Card */}
          <Link href="/connect?role=issuer" className="group">
            <motion.div 
              whileHover={{ y: -1 }}
              className="h-full p-6 bg-white rounded-2xl border border-slate-200 text-left hover:border-emerald-300 hover:shadow-sm hover:shadow-emerald-500/5 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors duration-200">
                <Building2 size={24} strokeWidth={2.5} />
              </div>
              <h2 className="font-heading text-lg font-bold text-slate-800 mb-2">Institution Portal</h2>
              <p className="text-sm text-slate-600">
                Issue tamper-proof certificates directly to student wallets on the blockchain.
              </p>
            </motion.div>
          </Link>

          {/* Student Card */}
          <Link href="/connect?role=student" className="group">
            <motion.div 
              whileHover={{ y: -1 }}
              className="h-full p-6 bg-white rounded-2xl border border-slate-200 text-left hover:border-blue-300 hover:shadow-sm hover:shadow-blue-500/5 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors duration-200">
                <GraduationCap size={24} strokeWidth={2.5} />
              </div>
              <h2 className="font-heading text-lg font-bold text-slate-800 mb-2">Student Portal</h2>
              <p className="text-sm text-slate-600">
                Access your wallet to view, manage, and share your earned academic credentials.
              </p>
            </motion.div>
          </Link>

          {/* Verifier Card */}
          <Link href="/verify" className="group">
            <motion.div 
              whileHover={{ y: -1 }}
              className="h-full p-6 bg-white rounded-2xl border border-slate-200 text-left hover:border-purple-300 hover:shadow-sm hover:shadow-purple-500/5 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600 group-hover:border-purple-200 transition-colors duration-200">
                <ScanLine size={24} strokeWidth={2.5} />
              </div>
              <h2 className="font-heading text-lg font-bold text-slate-800 mb-2">Verify Credential</h2>
              <p className="text-sm text-slate-600">
                Instantly verify the authenticity of a digital certificate using its reference ID or QR.
              </p>
            </motion.div>
          </Link>

        </div>
      </motion.div>
      
      {/* Footer Text */}
      <div className="absolute bottom-6 text-slate-400 text-xs font-mono">
        Secured by Ethereum • Built for FYP 1 • By Pharthiban Kumarhesan
      </div>
    </main>
  );
}
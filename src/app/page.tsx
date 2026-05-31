"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  GraduationCap, 
  Building2, 
  ScanLine,
  ChevronDown,
  UserCheck,
  Anchor,
  Database,
  FilePlus,
  Shield,
  Cloud,
  CheckCircle,
  X,
  Check,
  ArrowRight
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-[100dvh] bg-[#F8F8F8] bg-dotgrid flex flex-col relative overflow-x-hidden">
      
      {/* Background Decor (Subtle Glows for light theme) */}
      <div className="absolute top-[0%] left-[0%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-teal-100/50 rounded-full blur-[80px] md:blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-teal-50/50 rounded-full blur-[80px] md:blur-[100px] pointer-events-none" />

      {/* SECTION 1 — Hero + Portal Cards */}
      <section className="min-[100dvh] flex flex-col items-center justify-center px-4 md:px-6 py-16 md:py-24 relative w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 w-full max-w-5xl text-center flex flex-col items-center justify-center h-full"
        >
          {/* Logo Section */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
              <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 text-teal-600" strokeWidth={2.5} />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
              Iden<span className="text-teal-600">Vault</span>
            </h1>
          </div>
          
          <p className="text-slate-600 text-base md:text-lg font-medium mb-12 md:mb-16 max-w-xl mx-auto px-2">
            The decentralized standard for academic credentials. Secure, verifiable, and owned by you.
          </p>

          {/* Role Selection Grid */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 w-full">
            
            {/* Issuer Card */}
            <Link href="/connect?role=issuer" className="group w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)]">
              <motion.div
                whileHover={{ y: -2 }}
                className="h-full p-4 sm:p-5 md:p-8 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-emerald-300 shadow-sm text-left hover:border-emerald-300 hover:border-l-emerald-500 hover:shadow-emerald-500/10 transition-all duration-200 flex flex-col"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-emerald-400 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-600 group-hover:scale-110 transition-all duration-200">
                  <Building2 className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2.5} />
                </div>
                <h2 className="font-heading text-base md:text-xl font-bold text-slate-800 mb-2">Institution Portal</h2>
                <p className="text-xs md:text-[15px] text-slate-600 mb-6 leading-relaxed">
                  Issue tamper-proof certificates directly to student wallets on the blockchain.
                </p>
                <div className="mt-auto flex items-center text-[11px] md:text-sm font-bold text-emerald-400 group-hover:text-emerald-600 transition-colors duration-200">
                  Connect Wallet <ArrowRight className="ml-1 w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>

            {/* Student Card */}
            <Link href="/connect?role=student" className="group w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)]">
              <motion.div
                whileHover={{ y: -2 }}
                className="h-full p-4 sm:p-5 md:p-8 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-blue-300 shadow-sm text-left hover:border-blue-300 hover:border-l-blue-500 hover:shadow-blue-500/10 transition-all duration-200 flex flex-col"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-blue-400 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-200">
                  <GraduationCap className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2.5} />
                </div>
                <h2 className="font-heading text-base md:text-xl font-bold text-slate-800 mb-2">Student Portal</h2>
                <p className="text-xs md:text-[15px] text-slate-600 mb-6 leading-relaxed">
                  Access your wallet to view, manage, and share your earned academic credentials.
                </p>
                <div className="mt-auto flex items-center text-[11px] md:text-sm font-bold text-blue-400 group-hover:text-blue-600 transition-colors duration-200">
                  Connect Wallet <ArrowRight className="ml-1 w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>

            {/* Verifier Card */}
            <Link href="/verify" className="group w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)]">
              <motion.div
                whileHover={{ y: -2 }}
                className="h-full p-4 sm:p-5 md:p-8 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-purple-300 shadow-sm text-left hover:border-purple-300 hover:border-l-purple-500 hover:shadow-purple-500/10 transition-all duration-200 flex flex-col"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-purple-400 group-hover:bg-purple-50 group-hover:border-purple-200 group-hover:text-purple-600 group-hover:scale-110 transition-all duration-200">
                  <ScanLine className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2.5} />
                </div>
                <h2 className="font-heading text-base md:text-xl font-bold text-slate-800 mb-2">Verify Credential</h2>
                <p className="text-xs md:text-[15px] text-slate-600 mb-6 leading-relaxed">
                  Instantly verify the authenticity of a digital certificate using its reference ID or QR.
                </p>
                <div className="mt-auto flex items-center text-[11px] md:text-sm font-bold text-purple-400 group-hover:text-purple-600 transition-colors duration-200">
                  Verify Now <ArrowRight className="ml-1 w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>

          </div>

          <motion.div 
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center text-slate-400 gap-2 mt-12 md:mt-16"
          >
            <span className="text-xs md:text-sm font-medium">Scroll to explore</span>
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2 — What is IdenVault? */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="py-14 md:py-20 lg:py-24 w-full max-w-5xl mx-auto px-4 md:px-6 text-center z-10 relative"
      >
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 md:mb-6">What is IdenVault?</h2>
        <p className="text-slate-600 text-sm md:text-[15px] font-medium max-w-2xl mx-auto mb-10 md:mb-16 leading-relaxed">
          IdenVault is a Self-Sovereign Identity (SSI) framework that puts academic credentials back in the hands of their rightful owners. Built on Ethereum and IPFS, it lets institutions issue tamper-proof digital credentials that students truly own and verifiers can instantly trust — no middleman required.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="p-5 md:p-6 bg-white rounded-2xl border border-slate-200 text-left hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4 md:mb-5 text-slate-600">
              <UserCheck className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-heading text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Self-Sovereign</h3>
            <p className="text-xs md:text-sm text-slate-600">
              Credential holders have full ownership and control. No central authority can revoke access to your own achievements.
            </p>
          </div>
          <div className="p-5 md:p-6 bg-white rounded-2xl border border-slate-200 text-left hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4 md:mb-5 text-slate-600">
              <Anchor className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-heading text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Blockchain-Anchored</h3>
            <p className="text-xs md:text-sm text-slate-600">
              Every credential is hashed and anchored on Ethereum, creating an immutable proof of authenticity.
            </p>
          </div>
          <div className="p-5 md:p-6 bg-white rounded-2xl border border-slate-200 text-left hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4 md:mb-5 text-slate-600">
              <Database className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-heading text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Decentralized Storage</h3>
            <p className="text-xs md:text-sm text-slate-600">
              Credential metadata lives on IPFS, ensuring data permanence without relying on any single server.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SECTION 3 — How It Works */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="py-14 md:py-20 lg:py-24 w-full max-w-5xl mx-auto px-4 md:px-6 text-center z-10 relative"
      >
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-slate-900 mb-10 md:mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative text-left md:text-center">
          
          {/* Subtle dashed line connecting steps on large desktop */}
          <div className="hidden lg:block absolute top-6 left-[12%] right-[12%] h-[2px] border-t-2 border-dashed border-slate-200 -z-10" />

          {/* Step 1 */}
          <div className="flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-0 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl border border-slate-100 md:border-0 shadow-sm md:shadow-none">
            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center md:mb-4 text-slate-600 font-bold z-10">
              <FilePlus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-heading text-sm md:text-md font-bold text-slate-800 mb-1 md:mb-2">1. Issue</h3>
              <p className="text-xs md:text-sm text-slate-600 md:max-w-[200px]">
                An institution issues a digital credential, filling in the academic details and the student's wallet address.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-0 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl border border-slate-100 md:border-0 shadow-sm md:shadow-none">
            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center md:mb-4 text-slate-600 font-bold z-10">
              <Shield className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-heading text-sm md:text-md font-bold text-slate-800 mb-1 md:mb-2">2. Anchor</h3>
              <p className="text-xs md:text-sm text-slate-600 md:max-w-[200px]">
                The credential's data hash is anchored on the Ethereum blockchain, creating a permanent, tamper-proof record.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-0 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl border border-slate-100 md:border-0 shadow-sm md:shadow-none">
            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center md:mb-4 text-slate-600 font-bold z-10">
              <Cloud className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-heading text-sm md:text-md font-bold text-slate-800 mb-1 md:mb-2">3. Store</h3>
              <p className="text-xs md:text-sm text-slate-600 md:max-w-[200px]">
                Full credential metadata is stored on IPFS via Pinata, ensuring decentralized and persistent storage.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-0 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl border border-slate-100 md:border-0 shadow-sm md:shadow-none">
            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center md:mb-4 text-slate-600 font-bold z-10">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-heading text-sm md:text-md font-bold text-slate-800 mb-1 md:mb-2">4. Verify</h3>
              <p className="text-xs md:text-sm text-slate-600 md:max-w-[200px]">
                Anyone can verify a credential's authenticity instantly using its reference ID — no login needed.
              </p>
            </div>
          </div>

        </div>
      </motion.section>

      {/* SECTION 4 — Why Decentralized? */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="py-14 md:py-20 lg:py-24 w-full max-w-5xl mx-auto px-4 md:px-6 z-10 relative"
      >
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 md:mb-12 text-center">Why Decentralized?</h2>
        
        {/* Desktop Layout */}
        <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/50">
            <div className="p-6 text-left px-8 border-r border-slate-200">
              <span className="font-heading font-bold text-slate-500 text-base">Traditional Verification</span>
            </div>
            <div className="p-6 text-left px-8">
              <span className="font-heading font-bold text-teal-700 flex items-center justify-start gap-2 text-base">
                <ShieldCheck size={18} /> IdenVault
              </span>
            </div>
          </div>
          
          {/* Rows */}
          {[
            ["Relies on central authority", "Trust-minimized, on-chain verification"],
            ["Slow manual processes (days to weeks)", "Instant cryptographic verification"],
            ["Paper certificates can be forged", "Tamper-proof blockchain anchoring"],
            ["Institution controls your records", "You own and control your credentials"],
            ["Single point of failure", "Decentralized across Ethereum and IPFS"]
          ].map((row, idx) => (
            <div key={idx} className="grid grid-cols-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
              {/* Traditional (Desktop) */}
              <div className="p-6 px-8 border-r border-slate-100 flex items-start gap-3">
                <div className="mt-0.5 min-w-5 text-slate-400"><X className="w-[18px] h-[18px]" strokeWidth={2.5} /></div>
                <span className="text-sm font-medium text-slate-600">{row[0]}</span>
              </div>
              {/* IdenVault (Desktop) */}
              <div className="p-6 px-8 flex items-start gap-3">
                <div className="mt-0.5 min-w-5 text-teal-500"><Check className="w-[18px] h-[18px]" strokeWidth={2.5} /></div>
                <span className="text-sm font-medium text-slate-800">{row[1]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Layout (Paired Cards) */}
        <div className="md:hidden flex flex-col gap-4">
          {[
            ["Relies on central authority", "Trust-minimized, on-chain verification"],
            ["Slow manual processes (days to weeks)", "Instant cryptographic verification"],
            ["Paper certificates can be forged", "Tamper-proof blockchain anchoring"],
            ["Institution controls your records", "You own and control your credentials"],
            ["Single point of failure", "Decentralized across Ethereum and IPFS"]
          ].map((row, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Traditional Row */}
              <div className="bg-slate-50 px-4 py-3 flex items-start gap-3 border-b border-slate-100">
                <div className="mt-0.5 min-w-4 text-slate-400"><X className="w-4 h-4" strokeWidth={2.5} /></div>
                <span className="text-slate-500 text-sm">{row[0]}</span>
              </div>
              {/* IdenVault Row */}
              <div className="bg-white px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5 min-w-4 text-teal-600"><Check className="w-4 h-4" strokeWidth={2.5} /></div>
                <span className="text-slate-800 text-sm font-bold">{row[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* SECTION 5 — Tech Stack Badges */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="py-14 md:py-20 w-full max-w-5xl mx-auto px-4 md:px-6 text-center z-10 relative"
      >
        <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-bold mb-4 md:mb-6">Built With</div>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          <span className="bg-white border border-slate-200 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 flex items-center gap-1.5 md:gap-2">
            ⟠ Ethereum
          </span>
          <span className="bg-white border border-slate-200 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 flex items-center gap-1.5 md:gap-2">
            📦 IPFS
          </span>
          <span className="bg-white border border-slate-200 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 flex items-center gap-1.5 md:gap-2">
            ⚡ Solidity
          </span>
          <span className="bg-white border border-slate-200 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 flex items-center gap-1.5 md:gap-2">
            ▲ Next.js
          </span>
          <span className="bg-white border border-slate-200 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 flex items-center gap-1.5 md:gap-2">
            🌐 W3C DID
          </span>
        </div>
      </motion.section>

      {/* SECTION 6 — Footer */}
      <footer className="border-t border-slate-200 py-6 md:py-8 text-center text-slate-400 text-xs w-full mt-auto z-10 relative bg-[#F8F8F8]">
        <div className="flex items-center justify-center gap-1 mb-2">
          <ShieldCheck size={14} className="text-slate-400" />
          <span className="font-heading font-bold text-slate-500">IdenVault</span>
        </div>
        <p>Built by Pharthiban Kumarhesan</p>
      </footer>

    </main>
  );
}